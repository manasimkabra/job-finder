-- Job Finder schema.
--
-- Access before the frontend is wired to Supabase:
-- Row Level Security is enabled on every table in this migration, and no
-- policies are created for anon or authenticated. With RLS on and no
-- matching policy, the Data API denies those roles. This file does not
-- grant them table privileges.
-- Until the app reads and writes these tables, server-side code may use the
-- service role key, which bypasses RLS. That key must never be shipped to
-- the browser and must not be stored in these tables.
-- When auth is added, give profile-owned rows an owner column (for example
-- user_id uuid references auth.users) and add policies TO authenticated
-- that check (select auth.uid()) = user_id in both USING and WITH CHECK.
-- Profiles have no owner column yet, so browser access stays closed.
-- Opportunities stay shared across profiles.
--
-- Cascade:
-- Deleting a profile deletes that profile's job_scores,
-- profile_opportunity_history, job_actions, and search_runs. It does not
-- delete shared opportunities.
-- Deleting an opportunity deletes scores, history, and actions that
-- reference it.
--
-- set_updated_at() is security invoker. EXECUTE is revoked from PUBLIC,
-- anon, and authenticated so PostgREST cannot call it directly. A future
-- authenticated UPDATE also needs EXECUTE on this function or the
-- updated_at trigger will fail for that role.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public;
revoke all on function public.set_updated_at() from anon, authenticated;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  resume_text text,
  career_interests text,
  preferred_locations text[] not null default '{}',
  minimum_salary integer not null default 0,
  work_arrangements text[] not null default '{}',
  employment_types text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_name_not_blank check (length(btrim(name)) > 0),
  constraint profiles_minimum_salary_nonnegative check (minimum_salary >= 0),
  constraint profiles_work_arrangements_known check (
    work_arrangements <@ array['remote', 'hybrid', 'on-site']::text[]
  ),
  constraint profiles_employment_types_known check (
    employment_types <@ array['full-time', 'contract', 'internship']::text[]
  )
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  external_id text,
  source text not null,
  source_type text not null,
  title text not null,
  company text,
  location text,
  work_arrangement text,
  employment_type text,
  salary_min integer,
  salary_max integer,
  currency text not null default 'USD',
  description text,
  requirements text,
  posted_at timestamptz,
  discovered_at timestamptz not null default now(),
  original_url text,
  author_name text,
  author_title text,
  post_text text,
  application_instructions text,
  constraint opportunities_external_id_not_blank check (
    external_id is null or length(btrim(external_id)) > 0
  ),
  constraint opportunities_source_not_blank check (length(btrim(source)) > 0),
  constraint opportunities_source_type_known check (
    source_type in ('FORMAL_JOB', 'HIRING_POST')
  ),
  constraint opportunities_title_not_blank check (length(btrim(title)) > 0),
  constraint opportunities_work_arrangement_known check (
    work_arrangement is null
    or work_arrangement in ('remote', 'hybrid', 'on-site')
  ),
  constraint opportunities_employment_type_known check (
    employment_type is null
    or employment_type in ('full-time', 'contract', 'internship')
  ),
  constraint opportunities_salary_min_nonnegative check (
    salary_min is null or salary_min >= 0
  ),
  constraint opportunities_salary_max_nonnegative check (
    salary_max is null or salary_max >= 0
  ),
  constraint opportunities_salary_range_ordered check (
    salary_min is null or salary_max is null or salary_max >= salary_min
  ),
  constraint opportunities_currency_code check (currency ~ '^[A-Z]{3}$')
);

-- One row per external listing when the source provides an id. Rows with a
-- null external_id are allowed (some hiring posts may not have one).
create unique index opportunities_source_external_id_key
  on public.opportunities (source, external_id)
  where external_id is not null;

create index opportunities_source_type_posted_at_idx
  on public.opportunities (source_type, posted_at desc);

create index opportunities_posted_at_idx
  on public.opportunities (posted_at desc);

create index opportunities_discovered_at_idx
  on public.opportunities (discovered_at desc);

create table public.job_scores (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  qualification_fit smallint not null,
  responsibility_fit smallint not null,
  skills_fit smallint not null,
  interest_fit smallint not null,
  career_fit smallint not null,
  seniority_fit smallint not null,
  industry_fit smallint not null,
  seniority_assessment text,
  hearback_estimate text,
  strengths jsonb not null default '[]'::jsonb,
  gaps jsonb not null default '[]'::jsonb,
  reasoning text,
  priority_score smallint,
  scoring_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint job_scores_profile_opportunity_version_key
    unique (profile_id, opportunity_id, scoring_version),
  constraint job_scores_qualification_fit_range check (qualification_fit between 0 and 100),
  constraint job_scores_responsibility_fit_range check (responsibility_fit between 0 and 100),
  constraint job_scores_skills_fit_range check (skills_fit between 0 and 100),
  constraint job_scores_interest_fit_range check (interest_fit between 0 and 100),
  constraint job_scores_career_fit_range check (career_fit between 0 and 100),
  constraint job_scores_seniority_fit_range check (seniority_fit between 0 and 100),
  constraint job_scores_industry_fit_range check (industry_fit between 0 and 100),
  constraint job_scores_seniority_assessment_known check (
    seniority_assessment is null
    or seniority_assessment in (
      'below_candidate_level',
      'strong_fit',
      'reasonable_stretch',
      'too_senior'
    )
  ),
  constraint job_scores_hearback_estimate_known check (
    hearback_estimate is null
    or hearback_estimate in ('High', 'Medium', 'Low')
  ),
  constraint job_scores_strengths_array check (jsonb_typeof(strengths) = 'array'),
  constraint job_scores_gaps_array check (jsonb_typeof(gaps) = 'array'),
  constraint job_scores_priority_score_range check (
    priority_score is null or priority_score between 0 and 100
  ),
  constraint job_scores_scoring_version_not_blank check (
    length(btrim(scoring_version)) > 0
  )
);

create index job_scores_opportunity_id_idx
  on public.job_scores (opportunity_id);

create index job_scores_profile_priority_idx
  on public.job_scores (profile_id, priority_score desc);

create trigger job_scores_set_updated_at
  before update on public.job_scores
  for each row
  execute function public.set_updated_at();

create table public.profile_opportunity_history (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  first_shown_at timestamptz not null,
  last_shown_at timestamptz not null,
  times_shown integer not null default 1,
  first_batch_number integer not null,
  last_batch_number integer not null,
  constraint profile_opportunity_history_profile_opportunity_key
    unique (profile_id, opportunity_id),
  constraint profile_opportunity_history_times_shown_positive check (times_shown >= 1),
  constraint profile_opportunity_history_batches_nonnegative check (
    first_batch_number >= 0 and last_batch_number >= 0
  ),
  constraint profile_opportunity_history_shown_order check (
    last_shown_at >= first_shown_at
  ),
  constraint profile_opportunity_history_batch_order check (
    last_batch_number >= first_batch_number
  )
);

create index profile_opportunity_history_opportunity_id_idx
  on public.profile_opportunity_history (opportunity_id);

create table public.job_actions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  status text not null,
  saved_at timestamptz,
  applied_at timestamptz,
  response_at timestamptz,
  interview_at timestamptz,
  rejected_at timestamptz,
  offer_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint job_actions_profile_opportunity_key unique (profile_id, opportunity_id),
  constraint job_actions_status_known check (
    status in (
      'SAVED',
      'APPLIED',
      'NOT_INTERESTED',
      'RECRUITER_RESPONSE',
      'INTERVIEW',
      'REJECTED',
      'OFFER'
    )
  )
);

create index job_actions_opportunity_id_idx
  on public.job_actions (opportunity_id);

create index job_actions_profile_status_idx
  on public.job_actions (profile_id, status);

create trigger job_actions_set_updated_at
  before update on public.job_actions
  for each row
  execute function public.set_updated_at();

create table public.search_runs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  search_criteria jsonb not null default '{}'::jsonb,
  batch_number integer not null,
  result_count integer not null default 0,
  created_at timestamptz not null default now(),
  constraint search_runs_criteria_object check (jsonb_typeof(search_criteria) = 'object'),
  constraint search_runs_batch_number_positive check (batch_number >= 1),
  constraint search_runs_result_count_nonnegative check (result_count >= 0)
);

create index search_runs_profile_created_at_idx
  on public.search_runs (profile_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.opportunities enable row level security;
alter table public.job_scores enable row level security;
alter table public.profile_opportunity_history enable row level security;
alter table public.job_actions enable row level security;
alter table public.search_runs enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.opportunities from anon, authenticated;
revoke all on table public.job_scores from anon, authenticated;
revoke all on table public.profile_opportunity_history from anon, authenticated;
revoke all on table public.job_actions from anon, authenticated;
revoke all on table public.search_runs from anon, authenticated;

-- Hosted Supabase creates service_role with bypassrls. Grant it explicitly so
-- server-side writes work even when default privileges did not. anon and
-- authenticated stay revoked above. Skip the grant when the role is absent
-- (plain Postgres has no service_role).
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant all on table
      public.profiles,
      public.opportunities,
      public.job_scores,
      public.profile_opportunity_history,
      public.job_actions,
      public.search_runs
    to service_role;
    grant execute on function public.set_updated_at() to service_role;
  end if;
end $$;
