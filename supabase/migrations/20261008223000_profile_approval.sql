-- Approval-gated access: new signups stay locked until the admin approves them.
-- Run once in Supabase Dashboard > SQL Editor.

alter table public.profiles
  add column if not exists is_approved boolean not null default false;
