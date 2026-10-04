-- Stelle schema: enums, tables, RLS, indexes, storage.

create extension if not exists pg_trgm with schema extensions;
create extension if not exists vector with schema extensions;

create type public.employment_category as enum (
  'hiwi', 'working_student', 'full_time', 'internship', 'thesis', 'part_time', 'contract', 'unknown'
);
create type public.remote_type as enum ('remote', 'hybrid', 'onsite', 'unknown');
create type public.seniority as enum ('intern', 'junior', 'mid', 'senior', 'lead', 'unknown');
create type public.visa_signal as enum ('unknown', 'mentioned', 'not_mentioned', 'required', 'provided');
create type public.application_status as enum (
  'interested', 'saved', 'preparing', 'applied', 'recruiter_contact',
  'interview', 'technical_interview', 'offer', 'rejected', 'withdrawn'
);
create type public.parse_status as enum ('pending', 'processing', 'succeeded', 'failed');
create type public.ingestion_status as enum ('running', 'succeeded', 'failed', 'cancelled');
create type public.match_label as enum ('excellent', 'strong', 'good', 'possible', 'weak');
create type public.recommendation as enum ('apply', 'worth_applying', 'possible_stretch', 'low_priority');
create type public.document_kind as enum ('cover_letter', 'cv_variant', 'cv_suggestions');

-- Profiles -----------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  headline text,
  location text,
  years_of_experience numeric,
  current_education text,
  student_status boolean not null default false,
  preferred_working_language text,
  visa_sponsorship_needed boolean not null default false,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  desired_roles text[] not null default '{}',
  employment_types public.employment_category[] not null default '{}',
  preferred_cities text[] not null default '{}',
  german_states text[] not null default '{}',
  remote_preference public.remote_type[] not null default '{}',
  relocation_ok boolean not null default false,
  seniority_preference public.seniority,
  technical_skills text[] not null default '{}',
  languages jsonb not null default '[]'::jsonb,
  salary_min integer,
  salary_currency text default 'EUR',
  min_match_score integer not null default 0,
  excluded_companies text[] not null default '{}',
  excluded_keywords text[] not null default '{}',
  preferred_keywords text[] not null default '{}',
  scoring_weights jsonb not null default '{
    "roleMatch":15,"skillsMatch":25,"experienceMatch":20,"seniorityMatch":10,
    "educationMatch":10,"locationMatch":5,"languageMatch":5,"semanticMatch":10
  }'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default 'CV',
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.resume_versions (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references public.resumes (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  byte_size integer not null,
  extracted_text text,
  parsed jsonb,
  user_edited jsonb,
  parse_status public.parse_status not null default 'pending',
  parse_error text,
  created_at timestamptz not null default now()
);

-- Jobs ---------------------------------------------------------------------

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text not null unique,
  website text,
  logo_url text,
  ats_type text,
  created_at timestamptz not null default now()
);

create table public.job_boards (
  id uuid primary key default gen_random_uuid(),
  adapter text not null,
  board_token text not null,
  company_name text,
  enabled boolean not null default true,
  de_relevant boolean not null default true,
  last_ok_at timestamptz,
  consecutive_failures integer not null default 0,
  last_error text,
  unique (adapter, board_token)
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies (id),
  title text not null,
  normalized_title text not null,
  description_html text,
  description_text text not null default '',
  city text,
  state_code text,
  country text not null default 'DE',
  remote_type public.remote_type not null default 'unknown',
  employment_category public.employment_category not null default 'unknown',
  seniority public.seniority not null default 'unknown',
  salary_min integer,
  salary_max integer,
  salary_currency text,
  required_skills text[] not null default '{}',
  preferred_skills text[] not null default '{}',
  required_experience_years numeric,
  language_requirements jsonb not null default '[]'::jsonb,
  visa_sponsorship_signal public.visa_signal not null default 'unknown',
  student_enrollment_required boolean not null default false,
  min_weekly_hours integer,
  max_weekly_hours integer,
  source_url text not null,
  apply_url text,
  canonical_url text not null,
  content_fingerprint text not null,
  posted_at timestamptz,
  posted_at_is_estimated boolean not null default true,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  is_active boolean not null default true,
  analysis jsonb,
  analysis_version text,
  search_tsv tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description_text, '')), 'B')
  ) stored,
  effective_posted_at timestamptz generated always as (coalesce(posted_at, first_seen_at)) stored,
  created_at timestamptz not null default now()
);

create table public.job_source_postings (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  source text not null,
  source_job_id text not null,
  source_url text not null,
  raw_payload jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (source, source_job_id)
);

create table public.job_skills (
  job_id uuid not null references public.jobs (id) on delete cascade,
  skill text not null,
  kind text not null default 'required',
  primary key (job_id, skill, kind)
);

create table public.user_job_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  job_id uuid not null references public.jobs (id) on delete cascade,
  resume_version_id uuid references public.resume_versions (id) on delete set null,
  overall_score integer not null,
  breakdown jsonb not null,
  matched_skills text[] not null default '{}',
  missing_skills text[] not null default '{}',
  strengths text[] not null default '{}',
  concerns text[] not null default '{}',
  label public.match_label not null,
  recommendation public.recommendation not null,
  explanation jsonb,
  scorer_version text not null default '1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, job_id)
);

create table public.saved_jobs (
  user_id uuid not null references public.profiles (id) on delete cascade,
  job_id uuid not null references public.jobs (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, job_id)
);

create table public.ignored_jobs (
  user_id uuid not null references public.profiles (id) on delete cascade,
  job_id uuid not null references public.jobs (id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  primary key (user_id, job_id)
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  job_id uuid not null references public.jobs (id) on delete cascade,
  status public.application_status not null default 'interested',
  opened_apply_at timestamptz,
  applied_at timestamptz,
  resume_version_id uuid references public.resume_versions (id),
  notes text,
  next_action text,
  interview_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, job_id)
);

create table public.application_status_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  status public.application_status not null,
  changed_at timestamptz not null default now(),
  note text
);

create table public.generated_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  job_id uuid not null references public.jobs (id) on delete cascade,
  kind public.document_kind not null,
  language text,
  variant text,
  content jsonb not null,
  created_at timestamptz not null default now()
);

create table public.ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  jobs_fetched integer not null default 0,
  jobs_created integer not null default 0,
  jobs_updated integer not null default 0,
  jobs_failed integer not null default 0,
  status public.ingestion_status not null default 'running',
  error text
);

create table public.ingestion_locks (
  name text primary key,
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
  user_id uuid references public.profiles (id) on delete set null,
  task text not null,
  model text not null,
  input_tokens integer,
  output_tokens integer,
  latency_ms integer,
  cache_hit boolean not null default false,
  ok boolean not null default true,
  error text,
  created_at timestamptz not null default now()
);

-- Indexes ------------------------------------------------------------------

create index jobs_active_posted_idx on public.jobs (is_active, effective_posted_at desc);
create index jobs_category_idx on public.jobs (employment_category);
create index jobs_city_idx on public.jobs (city);
create index jobs_state_idx on public.jobs (state_code);
create index jobs_remote_idx on public.jobs (remote_type);
create index jobs_company_idx on public.jobs (company_id);
create index jobs_fingerprint_idx on public.jobs (content_fingerprint);
create index jobs_search_idx on public.jobs using gin (search_tsv);
create index jobs_skills_idx on public.jobs using gin (required_skills);
create index jobs_title_trgm_idx on public.jobs using gin (normalized_title gin_trgm_ops);
create index matches_user_score_idx on public.user_job_matches (user_id, overall_score desc);
create index resume_versions_user_idx on public.resume_versions (user_id, created_at desc);
create index applications_user_idx on public.applications (user_id, updated_at desc);

-- Profile bootstrap --------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  insert into public.user_preferences (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS ----------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.resumes enable row level security;
alter table public.resume_versions enable row level security;
alter table public.user_job_matches enable row level security;
alter table public.saved_jobs enable row level security;
alter table public.ignored_jobs enable row level security;
alter table public.applications enable row level security;
alter table public.application_status_history enable row level security;
alter table public.generated_documents enable row level security;
alter table public.companies enable row level security;
alter table public.jobs enable row level security;
alter table public.job_source_postings enable row level security;
alter table public.job_skills enable row level security;
alter table public.job_boards enable row level security;
alter table public.ingestion_runs enable row level security;
alter table public.ingestion_locks enable row level security;
alter table public.ai_cache enable row level security;
alter table public.ai_usage enable row level security;

create policy profiles_own on public.profiles
  for all using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy prefs_own on public.user_preferences
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy resumes_own on public.resumes
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy resume_versions_own on public.resume_versions
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy matches_own on public.user_job_matches
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy saved_own on public.saved_jobs
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy ignored_own on public.ignored_jobs
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy applications_own on public.applications
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy app_history_own on public.application_status_history
  for all using (
    exists (
      select 1 from public.applications a
      where a.id = application_id and a.user_id = (select auth.uid())
    )
  );
create policy docs_own on public.generated_documents
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy jobs_read on public.jobs for select to authenticated using (true);
create policy companies_read on public.companies for select to authenticated using (true);
create policy postings_read on public.job_source_postings for select to authenticated using (true);
create policy skills_read on public.job_skills for select to authenticated using (true);
create policy boards_read on public.job_boards for select to authenticated using (true);
create policy runs_read on public.ingestion_runs for select to authenticated using (true);

-- Storage ------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resumes',
  'resumes',
  false,
  5242880,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do nothing;

create policy resumes_storage_select on storage.objects
  for select to authenticated
  using (bucket_id = 'resumes' and (select auth.uid())::text = (storage.foldername(name))[1]);

create policy resumes_storage_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'resumes' and (select auth.uid())::text = (storage.foldername(name))[1]);

create policy resumes_storage_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'resumes' and (select auth.uid())::text = (storage.foldername(name))[1]);
