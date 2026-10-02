-- Boat details captured with each free-valuation request.
--
-- One row per request, not per email: an owner may value more than one boat,
-- and the waitlist row stays one-per-email. Join on email to connect them.
-- Same lockdown as the waitlist: server-only, RLS on with zero policies.

create table if not exists public.valuation_requests (
  id         uuid primary key default gen_random_uuid(),
  email      text        not null,
  make       text        not null,
  model      text        not null,
  year       smallint    not null,
  hin        text,
  created_at timestamptz not null default now(),
  constraint valuation_requests_make_len  check (length(make)  between 1 and 80),
  constraint valuation_requests_model_len check (length(model) between 1 and 80),
  constraint valuation_requests_year      check (year between 1900 and 2100),
  -- Stored bare (no spaces/dashes, upper case). Not pinned to the 12-char
  -- ISO 10087 format: pre-1984 and non-EU/US hulls use other lengths.
  constraint valuation_requests_hin       check (hin ~ '^[A-Z0-9]{6,20}$')
);

comment on column public.valuation_requests.hin is
  'Hull / Craft Identification Number (HIN / CIN), optional.';

create index if not exists valuation_requests_email_idx
  on public.valuation_requests (email);

alter table public.valuation_requests enable row level security;
revoke all on public.valuation_requests from anon, authenticated;
