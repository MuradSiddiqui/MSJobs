-- Stelle initial schema. Extensions live in `extensions` (Supabase default search_path).

create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- Enums

create type public.employment_category as enum (
  'hiwi',
  'working_student',
  'full_time',
  'internship',
  'thesis',
  'part_time',
  'contract',
  'unknown'
);

create type public.remote_type as enum (
  'remote',
  'hybrid',
  'onsite',
  'unknown'
);

create type public.seniority_level as enum (
  'intern',
  'junior',
  'mid',
  'senior',
  'lead',
  'unknown'
);

create type public.visa_signal as enum (
  'unknown',
  'mentioned',
  'not_mentioned',
  'required',
  'provided'
);

create type public.application_status as enum (
  'interested',
  'saved',
  'preparing',
  'applied',
  'recruiter_contact',
  'interview',
  'technical_interview',
  'offer',
  'rejected',
  'withdrawn'
);

create type public.parse_status as enum (
  'pending',
  'processing',
  'succeeded',
  'failed'
);

create type public.ingestion_status as enum (
  'running',
  'succeeded',
  'failed',
  'cancelled'
);

create type public.document_kind as enum (
  'cover_letter',
  'resume_variant',
  'notes'
);

-- Helpers

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Tables

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  headline text,
  location text,
  years_of_experience numeric,
  current_education text,
  student_status boolean not null default false,
  onboarding_completed_at timestamptz,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_preferences (
  user_id uuid primary key references public.profiles on delete cascade,
  desired_roles text[] not null default '{}',
  employment_types public.employment_category[] not null default '{}',
  preferred_cities text[] not null default '{}',
  german_states text[] not null default '{}',
  remote_preference public.remote_type[] not null default '{}',
  relocation_ok boolean not null default false,
  technical_skills text[] not null default '{}',
  languages jsonb not null default '[]'::jsonb,
  preferred_working_language text,
  salary_min int,
  salary_currency text not null default 'EUR',
  seniority_preference public.seniority_level,
  visa_sponsorship_needed boolean not null default false,
  excluded_companies text[] not null default '{}',
  excluded_keywords text[] not null default '{}',
  preferred_keywords text[] not null default '{}',
  min_match_score int not null default 0,
  scoring_weights jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  title text not null default 'CV',
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index resumes_one_active_per_user
  on public.resumes (user_id)
  where is_active = true;

create table public.resume_versions (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references public.resumes on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  storage_path text not null,
  file_name text,
  mime_type text,
  byte_size int,
  extracted_text text,
  parsed jsonb,
  user_edited jsonb,
  parse_status public.parse_status not null default 'pending',
  parse_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text not null unique,
  website text,
  logo_url text,
  ats_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.job_boards (
  id uuid primary key default gen_random_uuid(),
  adapter text not null,
  board_token text not null,
  company_name text,
  enabled boolean not null default true,
  de_relevant boolean not null default true,
  last_ok_at timestamptz,
  consecutive_failures int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (adapter, board_token)
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies,
  title text not null,
  normalized_title text not null,
  description_html text,
  description_text text,
  city text,
  state_code text,
  country text not null default 'DE',
  remote_type public.remote_type not null default 'unknown',
  employment_category public.employment_category not null default 'unknown',
  seniority public.seniority_level not null default 'unknown',
  salary_min int,
  salary_max int,
  salary_currency text,
  required_skills text[] not null default '{}',
  preferred_skills text[] not null default '{}',
  required_experience_years numeric,
  education_requirements text[] not null default '{}',
  language_requirements jsonb not null default '[]'::jsonb,
  visa_sponsorship_signal public.visa_signal not null default 'unknown',
  student_enrollment_required boolean not null default false,
  min_weekly_hours int,
  max_weekly_hours int,
  source_url text,
  apply_url text,
  canonical_url text,
  content_fingerprint text not null,
  posted_at timestamptz,
  posted_at_is_estimated boolean not null default false,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  is_active boolean not null default true,
  analysis jsonb,
  analysis_version text,
  search_tsv tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description_text, '')), 'B')
  ) stored,
  effective_posted_at timestamptz generated always as (
    coalesce(posted_at, first_seen_at)
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.job_source_postings (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs on delete cascade,
  source text not null,
  source_job_id text not null,
  source_url text,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  unique (source, source_job_id)
);

create table public.job_skills (
  job_id uuid not null references public.jobs on delete cascade,
  skill text not null,
  kind text not null default 'required',
  primary key (job_id, skill, kind)
);

create table public.user_job_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  job_id uuid not null references public.jobs on delete cascade,
  resume_version_id uuid references public.resume_versions,
  overall_score int not null,
  breakdown jsonb not null,
  matched_skills text[] not null default '{}',
  missing_skills text[] not null default '{}',
  strengths text[] not null default '{}',
  concerns text[] not null default '{}',
  label text,
  recommendation text,
  explanation jsonb,
  scorer_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, job_id)
);

create table public.saved_jobs (
  user_id uuid not null references public.profiles on delete cascade,
  job_id uuid not null references public.jobs on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, job_id)
);

create table public.ignored_jobs (
  user_id uuid not null references public.profiles on delete cascade,
  job_id uuid not null references public.jobs on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  primary key (user_id, job_id)
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  job_id uuid not null references public.jobs on delete cascade,
  status public.application_status not null default 'interested',
  opened_apply_at timestamptz,
  applied_at timestamptz,
  notes text,
  next_action text,
  interview_at timestamptz,
  resume_version_id uuid references public.resume_versions,
  cover_letter_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, job_id)
);

create table public.application_status_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  from_status public.application_status,
  to_status public.application_status not null,
  changed_at timestamptz not null default now()
);

create table public.generated_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  job_id uuid references public.jobs on delete cascade,
  kind public.document_kind not null,
  language text,
  title text,
  body text not null,
  meta jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.applications
  add constraint applications_cover_letter_id_fkey
  foreign key (cover_letter_id) references public.generated_documents (id) on delete set null;

create table public.ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  status public.ingestion_status not null default 'running',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  jobs_fetched int not null default 0,
  jobs_created int not null default 0,
  jobs_updated int not null default 0,
  jobs_failed int not null default 0,
  error text,
  cursor_json jsonb
);

create table public.ingestion_locks (
  lock_key text primary key,
  locked_until timestamptz not null,
  holder text
);

create table public.ai_cache (
  id uuid primary key default gen_random_uuid(),
  task text not null,
  model text not null,
  input_hash text not null,
  output jsonb not null,
  created_at timestamptz not null default now(),
  unique (task, model, input_hash)
);

create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete set null,
  task text not null,
  model text not null,
  input_tokens int,
  output_tokens int,
  latency_ms int,
  cache_hit boolean not null default false,
  outcome text,
  created_at timestamptz not null default now()
);

-- Indexes

create index jobs_active_posted_idx
  on public.jobs (is_active, effective_posted_at desc);

create index jobs_employment_category_idx
  on public.jobs (employment_category);

create index jobs_city_idx
  on public.jobs (city);

create index jobs_state_code_idx
  on public.jobs (state_code);

create index jobs_remote_type_idx
  on public.jobs (remote_type);

create index jobs_company_id_idx
  on public.jobs (company_id);

create index jobs_search_tsv_gin
  on public.jobs using gin (search_tsv);

create index jobs_required_skills_gin
  on public.jobs using gin (required_skills);

create index jobs_normalized_title_trgm
  on public.jobs using gin (normalized_title gin_trgm_ops);

create index jobs_content_fingerprint_idx
  on public.jobs (content_fingerprint);

create index user_job_matches_user_score_idx
  on public.user_job_matches (user_id, overall_score desc);

create index job_source_postings_job_id_idx
  on public.job_source_postings (job_id);

create index resume_versions_resume_id_idx
  on public.resume_versions (resume_id);

create index resume_versions_user_id_idx
  on public.resume_versions (user_id);

-- updated_at triggers

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger user_preferences_set_updated_at
  before update on public.user_preferences
  for each row execute function public.set_updated_at();

create trigger jobs_set_updated_at
  before update on public.jobs
  for each row execute function public.set_updated_at();

create trigger applications_set_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();

create trigger resumes_set_updated_at
  before update on public.resumes
  for each row execute function public.set_updated_at();

-- Auth signup: profile + default preferences

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  insert into public.user_preferences (user_id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS

alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.resumes enable row level security;
alter table public.resume_versions enable row level security;
alter table public.companies enable row level security;
alter table public.job_boards enable row level security;
alter table public.jobs enable row level security;
alter table public.job_source_postings enable row level security;
alter table public.job_skills enable row level security;
alter table public.user_job_matches enable row level security;
alter table public.saved_jobs enable row level security;
alter table public.ignored_jobs enable row level security;
alter table public.applications enable row level security;
alter table public.application_status_history enable row level security;
alter table public.generated_documents enable row level security;
alter table public.ingestion_runs enable row level security;
alter table public.ingestion_locks enable row level security;
alter table public.ai_cache enable row level security;
alter table public.ai_usage enable row level security;

create policy "profiles_select_own"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles_insert_own"
  on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));

create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

do $$
declare
  t text;
  owned text[] := array[
    'user_preferences',
    'resumes',
    'resume_versions',
    'user_job_matches',
    'saved_jobs',
    'ignored_jobs',
    'applications',
    'application_status_history',
    'generated_documents'
  ];
  readable text[] := array[
    'jobs',
    'companies',
    'job_boards',
    'job_source_postings',
    'job_skills'
  ];
begin
  foreach t in array owned loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (user_id = (select auth.uid()))',
      t || '_select_own', t
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (user_id = (select auth.uid()))',
      t || '_insert_own', t
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))',
      t || '_update_own', t
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (user_id = (select auth.uid()))',
      t || '_delete_own', t
    );
  end loop;

  foreach t in array readable loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (true)',
      t || '_select_authenticated', t
    );
  end loop;
end $$;

create policy "ai_usage_select_own"
  on public.ai_usage for select to authenticated
  using (user_id = (select auth.uid()));

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;

-- Storage: private CV bucket

insert into storage.buckets (id, name, public, file_size_limit)
values ('resumes', 'resumes', false, 5242880)
on conflict (id) do nothing;

create policy "resumes_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "resumes_select_own"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "resumes_delete_own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
