-- MS Jobs storage + documents vault setup.
-- Run ONCE in Supabase Dashboard > SQL Editor. Safe to re-run.

-- 1. resumes bucket: raise to 30 MB and allow PNG uploads --------------------
update storage.buckets
set file_size_limit = 31457280,
    allowed_mime_types = array[
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png'
    ]
where id = 'resumes';

-- 2. avatars bucket (public): 5 MB, images only -------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = true,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'avatars');

drop policy if exists "avatars user insert" on storage.objects;
create policy "avatars user insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);

drop policy if exists "avatars user update" on storage.objects;
create policy "avatars user update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (select auth.uid())::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'avatars'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);

drop policy if exists "avatars user delete" on storage.objects;
create policy "avatars user delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);

-- 3. documents bucket (private): 30 MB, transcripts and certificates --------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  31457280,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = 31457280,
    allowed_mime_types = array[
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg'
    ];

drop policy if exists "documents user select" on storage.objects;
create policy "documents user select"
on storage.objects for select
to authenticated
using (
  bucket_id = 'documents'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);

drop policy if exists "documents user insert" on storage.objects;
create policy "documents user insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'documents'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);

drop policy if exists "documents user update" on storage.objects;
create policy "documents user update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'documents'
  and (select auth.uid())::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'documents'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);

drop policy if exists "documents user delete" on storage.objects;
create policy "documents user delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'documents'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);

-- 4. profiles.avatar_url ------------------------------------------------------
alter table public.profiles
  add column if not exists avatar_url text;

-- 5. user_documents table -----------------------------------------------------
create table if not exists public.user_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  file_name text not null,
  storage_path text not null unique,
  mime_type text,
  byte_size int,
  doc_type text not null default 'other',
  attach_to_applications boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.user_documents enable row level security;

drop policy if exists "user_documents own select" on public.user_documents;
create policy "user_documents own select"
on public.user_documents for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "user_documents own insert" on public.user_documents;
create policy "user_documents own insert"
on public.user_documents for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "user_documents own update" on public.user_documents;
create policy "user_documents own update"
on public.user_documents for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "user_documents own delete" on public.user_documents;
create policy "user_documents own delete"
on public.user_documents for delete
to authenticated
using ((select auth.uid()) = user_id);

create index if not exists user_documents_user_idx
  on public.user_documents (user_id, created_at desc);
