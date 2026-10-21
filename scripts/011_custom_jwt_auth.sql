-- Migration 011: Replace Supabase Auth with the app's own JWT login
--
-- Users now live in public.app_users (email + bcrypt password hash). The app
-- signs its own session JWT with the project's JWT secret (role
-- 'authenticated', sub = user id), so auth.uid() and every existing RLS policy
-- and SECURITY DEFINER function keep working unchanged.
--
-- This migration:
--   1. Creates public.app_users (service-role access only).
--   2. Copies existing Supabase Auth users, keeping their bcrypt password
--      hashes so everyone can still log in with their current password.
--   3. Re-points every public.* foreign key from auth.users to public.app_users.
--   4. Moves the profile-creation trigger from auth.users to public.app_users.

-- ─── 1. app_users ────────────────────────────────────────────────────────────

create table if not exists public.app_users (
  id            uuid        primary key default gen_random_uuid(),
  email         text        not null,
  password_hash text        not null,
  full_name     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create unique index if not exists app_users_email_lower_idx
  on public.app_users (lower(email));

-- No policies: only the service role (server code) can read or write this table.
alter table public.app_users enable row level security;
revoke all on public.app_users from anon, authenticated;

-- ─── 2. Copy existing Supabase Auth users ───────────────────────────────────

insert into public.app_users (id, email, password_hash, full_name, created_at)
select
  u.id,
  lower(u.email),
  u.encrypted_password,
  u.raw_user_meta_data ->> 'full_name',
  u.created_at
from auth.users u
where u.email is not null
  and u.encrypted_password is not null
  and u.encrypted_password <> ''
on conflict (id) do nothing;

-- ─── 3. Re-point foreign keys auth.users -> public.app_users ────────────────

do $$
declare
  r record;
begin
  for r in
    select c.conname, c.conrelid::regclass as tbl, pg_get_constraintdef(c.oid) as def
    from pg_constraint c
    join pg_namespace n on n.oid = c.connamespace
    where c.contype = 'f'
      and c.confrelid = 'auth.users'::regclass
      and n.nspname = 'public'
  loop
    -- If re-adding fails, some rows reference an auth user that was not copied
    -- in step 2 (no email/password); delete those rows and re-run.
    execute format('alter table %s drop constraint %I', r.tbl, r.conname);
    execute format(
      'alter table %s add constraint %I %s',
      r.tbl,
      r.conname,
      replace(r.def, 'auth.users(id)', 'public.app_users(id)')
    );
  end loop;
end;
$$;

-- ─── 4. Profile-creation trigger on app_users ───────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.full_name)
  on conflict (id) do nothing;
  return new;
end;
$function$;

revoke all on function public.handle_new_user() from anon, authenticated, public;

drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_app_user_created on public.app_users;
create trigger on_app_user_created
  after insert on public.app_users
  for each row execute function public.handle_new_user();
