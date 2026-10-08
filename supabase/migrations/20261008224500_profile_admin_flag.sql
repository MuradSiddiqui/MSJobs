-- Proper admin flag on profiles (in addition to the ADMIN_EMAIL env fallback).
-- Run once in Supabase Dashboard > SQL Editor. The second statement marks
-- the owner's account as admin; adjust the email if yours differs.

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

update public.profiles
set is_admin = true
where id = (select id from auth.users where email = 'muradsiddiqui99@gmail.com');
