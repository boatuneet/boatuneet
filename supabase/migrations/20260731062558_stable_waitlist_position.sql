-- Positions no longer move on referral.
--
-- The page used to promise "every friend who joins moves you up 10 spots", so
-- waitlist_join subtracted 10 places per referral. That promise is gone, and a
-- position that silently drifts with no explanation is worse than none — your
-- number should mean the order you joined in. referred_by is still recorded,
-- purely as attribution.

create or replace function public.waitlist_join(
  p_email       text,
  p_referred_by text default null,
  p_source      text default null
)
returns table (
  place              integer,
  cap                integer,
  ref_code           text,
  already_registered boolean
)
language plpgsql
volatile
security invoker
set search_path = public, pg_temp
as $$
declare
  v_email    text := lower(trim(p_email));
  v_row      public.waitlist_signups;
  v_seed     integer;
  v_cap      integer;
  v_existing boolean := false;
  v_code     text;
  v_attempt  integer := 0;
begin
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'invalid_email' using errcode = '22023';
  end if;

  select * into v_row
    from public.waitlist_signups s
   where lower(s.email) = v_email;

  if found then
    v_existing := true;
  else
    -- Random (not sequential) share codes: a guessable code would leak the
    -- real signup count and give away the seeded head start.
    loop
      v_attempt := v_attempt + 1;
      v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 10));
      begin
        insert into public.waitlist_signups (email, ref_code, referred_by, source)
        values (
          v_email,
          v_code,
          nullif(upper(trim(coalesce(p_referred_by, ''))), ''),
          nullif(trim(coalesce(p_source, '')), '')
        )
        returning * into v_row;
        exit;
      exception when unique_violation then
        if v_attempt >= 5 then raise; end if;
      end;
    end loop;
  end if;

  select s.cap into v_cap from public.waitlist_status() s;
  select c.seed_offset into v_seed from public.waitlist_config c where c.id;

  -- Join order, plain and stable.
  place              := (v_seed + v_row.signup_no)::integer;
  cap                := v_cap;
  ref_code           := v_row.ref_code;
  already_registered := v_existing;
  return next;
end;
$$;

revoke execute on function public.waitlist_join(text, text, text) from public, anon, authenticated;
grant  execute on function public.waitlist_join(text, text, text) to service_role;
