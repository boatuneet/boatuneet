-- Privacy policy launch: consent records, Meta Lead Ads leads, erasure.
--
-- Same access model as the rest: server-only, RLS on with zero policies,
-- anon/authenticated revoked. See 20260731044503_waitlist_schema.sql.

-- --------------------------------------------------------------- consents --

-- One row per consent event. Marketing consent is deliberately its own row
-- kind, never inferred from a lead or waitlist signup.
create table if not exists public.consents (
  id             uuid primary key default gen_random_uuid(),
  email          text        not null,
  kind           text        not null,
  granted        boolean     not null,
  source         text,
  policy_version text        not null,
  created_at     timestamptz not null default now(),
  constraint consents_kind check (kind in ('privacy_ack', 'marketing_email'))
);

comment on table public.consents is
  'Consent events. kind=privacy_ack: person submitted a form under policy_version. kind=marketing_email: explicit opt-in/out to promotional email.';
comment on column public.consents.source is
  'Where the choice was made: website:valuation, meta_lead_ads:<form_id>, …';

create index if not exists consents_email_idx on public.consents (lower(email));

-- ------------------------------------------------------------- meta leads --

create table if not exists public.meta_leads (
  id             uuid primary key default gen_random_uuid(),
  leadgen_id     text        not null,
  form_id        text,
  page_id        text,
  ad_id          text,
  email          text,
  full_name      text,
  phone          text,
  fields         jsonb       not null default '[]'::jsonb,
  source         text        not null default 'meta_lead_ads',
  submitted_at   timestamptz not null,
  received_at    timestamptz not null default now(),
  policy_version text        not null
);

comment on table public.meta_leads is
  'Leads delivered by the Meta Lead Ads webhook. fields holds the raw field_data array; email/full_name/phone are lifted out for lookup.';
comment on column public.meta_leads.submitted_at is
  'Meta created_time: when the person submitted the form.';
comment on column public.meta_leads.policy_version is
  'Privacy policy version in force when the lead was received.';

-- Meta re-delivers on any non-200; the unique index makes retries idempotent.
create unique index if not exists meta_leads_leadgen_id_key on public.meta_leads (leadgen_id);
create index if not exists meta_leads_email_idx on public.meta_leads (lower(email));

-- ------------------------------------------------------------- lockdown ---

alter table public.consents   enable row level security;
alter table public.meta_leads enable row level security;
revoke all on public.consents   from anon, authenticated;
revoke all on public.meta_leads from anon, authenticated;
