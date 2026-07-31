-- Boatuneet coming-soon waitlist.
--
-- Access model: no browser ever talks to these tables. The Next.js server
-- routes hold the service_role key and are the only caller, so RLS is enabled
-- with zero policies and anon/authenticated are revoked outright. That is
-- deliberate — the signup list is private, and a public repo must not be one
-- leaked key away from exposing it.

-- ---------------------------------------------------------------- signups --

create table if not exists public.waitlist_signups (
  id          uuid primary key default gen_random_uuid(),
  signup_no   bigint generated always as identity,
  email       text        not null,
  ref_code    text        not null,
  referred_by text,
  source      text,
  created_at  timestamptz not null default now()
);

comment on table public.waitlist_signups is
  'One row per waitlist signup. signup_no drives the displayed position.';
comment on column public.waitlist_signups.signup_no is
  'Monotonic join order. Displayed position = waitlist_config.seed_offset + signup_no.';
comment on column public.waitlist_signups.referred_by is
  'ref_code of the signup that referred this one, if any.';

create unique index if not exists waitlist_signups_email_key
  on public.waitlist_signups (lower(email));
create unique index if not exists waitlist_signups_ref_code_key
  on public.waitlist_signups (ref_code);
create index if not exists waitlist_signups_referred_by_idx
  on public.waitlist_signups (referred_by);
create index if not exists waitlist_signups_created_at_idx
  on public.waitlist_signups (created_at desc);

-- ----------------------------------------------------------------- config --

-- Single-row table: the `id boolean primary key check (id)` trick means only
-- one row (id = true) can ever exist.
create table if not exists public.waitlist_config (
  id            boolean primary key default true,
  seed_offset   integer     not null default 58,
  current_cap   integer     not null default 200,
  cap_filled_on date,
  tiers         integer[]   not null default '{200,500,1000,2500,5000}',
  updated_at    timestamptz not null default now(),
  constraint waitlist_config_singleton check (id),
  constraint waitlist_config_seed_offset_nonneg check (seed_offset >= 0),
  constraint waitlist_config_cap_positive check (current_cap > 0)
);

comment on column public.waitlist_config.seed_offset is
  'Head start added to the real signup count. 58 means the first real signup is #59.';
comment on column public.waitlist_config.cap_filled_on is
  'Date the current cap filled up. The next tier opens the following day.';
comment on column public.waitlist_config.tiers is
  'Ascending ladder of caps. When one fills, the next larger value opens.';

insert into public.waitlist_config (id) values (true) on conflict (id) do nothing;

-- ---------------------------------------------------------------- status ---

-- Returns what the page should display, advancing the cap tier when due.
-- Writes as well as reads (hence volatile): it records the date a cap fills
-- and opens the next tier the day after.
create or replace function public.waitlist_status()
returns table (
  taken       integer,
  cap         integer,
  spots_left  integer,
  signups     bigint
)
language plpgsql
volatile
security invoker
set search_path = public, pg_temp
as $$
declare
  v_seed      integer;
  v_cap       integer;
  v_filled_on date;
  v_tiers     integer[];
  v_signups   bigint;
  v_raw       integer;
  v_next_cap  integer;
begin
  -- ponytail: row lock serialises concurrent page loads. Fine at launch-page
  -- traffic; if this ever becomes hot, cache status in the app for a few seconds.
  select c.seed_offset, c.current_cap, c.cap_filled_on, c.tiers
    into v_seed, v_cap, v_filled_on, v_tiers
    from public.waitlist_config c
   where c.id
     for update;

  select count(*) into v_signups from public.waitlist_signups;
  v_raw := v_seed + v_signups;

  -- A cap that filled on an earlier day opens the next tier now.
  if v_filled_on is not null and current_date > v_filled_on then
    select min(t) into v_next_cap from unnest(v_tiers) as t where t > v_cap;

    if v_next_cap is not null then
      v_cap       := v_next_cap;
      v_filled_on := null;
      update public.waitlist_config
         set current_cap = v_cap, cap_filled_on = null, updated_at = now()
       where id;
    end if;
  end if;

  -- Record the moment this cap fills; the next tier opens tomorrow.
  if v_raw >= v_cap and v_filled_on is null then
    v_filled_on := current_date;
    update public.waitlist_config
       set cap_filled_on = v_filled_on, updated_at = now()
     where id;
  end if;

  -- Signups are never rejected once the cap is hit — the display just holds at
  -- the cap until the next tier opens, then catches up to the true number.
  taken      := least(v_raw, v_cap);
  cap        := v_cap;
  spots_left := greatest(v_cap - taken, 0);
  signups    := v_signups;
  return next;
end;
$$;

-- ------------------------------------------------------------------ join ---

-- Idempotent: signing up twice with the same email returns the original
-- position instead of erroring, so a double-submit never looks like a failure.
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
  v_email     text := lower(trim(p_email));
  v_row       public.waitlist_signups;
  v_seed      integer;
  v_cap       integer;
  v_referrals integer;
  v_existing  boolean := false;
  v_code      text;
  v_attempt   integer := 0;
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

  select count(*) into v_referrals
    from public.waitlist_signups s
   where s.referred_by = v_row.ref_code;

  -- Each referral moves you up 10 places, as promised on the page.
  -- Named `place`, not `position`: the latter is a reserved word in Postgres
  -- and cannot be used as an OUT parameter.
  place              := greatest(1, (v_seed + v_row.signup_no)::integer - (10 * v_referrals));
  cap                := v_cap;
  ref_code           := v_row.ref_code;
  already_registered := v_existing;
  return next;
end;
$$;

-- -------------------------------------------------------------- lockdown ---

alter table public.waitlist_signups enable row level security;
alter table public.waitlist_config  enable row level security;

-- No policies on purpose: only service_role (which bypasses RLS) may touch
-- these. Belt and braces, drop the default grants too.
revoke all on public.waitlist_signups from anon, authenticated;
revoke all on public.waitlist_config  from anon, authenticated;

-- Functions are granted to PUBLIC by default; these must stay server-only.
revoke execute on function public.waitlist_status()               from public, anon, authenticated;
revoke execute on function public.waitlist_join(text, text, text) from public, anon, authenticated;
grant  execute on function public.waitlist_status()               to service_role;
grant  execute on function public.waitlist_join(text, text, text) to service_role;
