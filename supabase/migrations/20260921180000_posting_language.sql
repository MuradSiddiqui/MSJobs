-- Posting language of the job ad itself (en | de | unknown), for Jobs filters.
alter table public.jobs
  add column if not exists posting_language text not null default 'unknown';

alter table public.jobs
  drop constraint if exists jobs_posting_language_check;

alter table public.jobs
  add constraint jobs_posting_language_check
  check (posting_language in ('en', 'de', 'unknown'));

create index if not exists jobs_posting_language_idx
  on public.jobs (posting_language)
  where is_active = true;
