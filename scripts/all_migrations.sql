-- Create users table extension (profiles)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  avatar_url text,
  subscription_tier text default 'free' check (subscription_tier in ('free', 'pro', 'premium')),
  subscription_status text default 'active' check (subscription_status in ('active', 'canceled', 'past_due')),
  stripe_customer_id text unique,
  stripe_subscription_id text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create jobs table
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company text not null,
  position text not null,
  status text not null check (status in ('applied', 'interview', 'offer', 'rejected')),
  date_applied date not null,
  salary text,
  location text,
  notes text,
  job_url text,
  deadline date,
  recruiter_name text,
  recruiter_email text,
  tags text[],
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create interviews table
create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  round text not null,
  date date,
  status text not null check (status in ('scheduled', 'completed', 'pending')),
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create tasks table
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  due_date date,
  status text not null check (status in ('pending', 'in-progress', 'completed', 'submitted')),
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create activity log table
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  old_value text,
  new_value text,
  timestamp timestamp with time zone default now()
);

-- Create indexes for better query performance
create index if not exists idx_jobs_user_id on public.jobs(user_id);
create index if not exists idx_jobs_status on public.jobs(status);
create index if not exists idx_jobs_date_applied on public.jobs(date_applied);
create index if not exists idx_interviews_job_id on public.interviews(job_id);
create index if not exists idx_tasks_job_id on public.tasks(job_id);
create index if not exists idx_activity_logs_job_id on public.activity_logs(job_id);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.interviews enable row level security;
alter table public.tasks enable row level security;
alter table public.activity_logs enable row level security;

-- Profiles policies
create policy "Users can view their own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- Jobs policies
create policy "Users can view their own jobs" on public.jobs
  for select using (auth.uid() = user_id);

create policy "Users can insert their own jobs" on public.jobs
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own jobs" on public.jobs
  for update using (auth.uid() = user_id);

create policy "Users can delete their own jobs" on public.jobs
  for delete using (auth.uid() = user_id);

-- Interviews policies
create policy "Users can view their own interviews" on public.interviews
  for select using (auth.uid() = user_id);

create policy "Users can insert their own interviews" on public.interviews
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own interviews" on public.interviews
  for update using (auth.uid() = user_id);

create policy "Users can delete their own interviews" on public.interviews
  for delete using (auth.uid() = user_id);

-- Tasks policies
create policy "Users can view their own tasks" on public.tasks
  for select using (auth.uid() = user_id);

create policy "Users can insert their own tasks" on public.tasks
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own tasks" on public.tasks
  for update using (auth.uid() = user_id);

create policy "Users can delete their own tasks" on public.tasks
  for delete using (auth.uid() = user_id);

-- Activity logs policies
create policy "Users can view their own activity logs" on public.activity_logs
  for select using (auth.uid() = user_id);

create policy "Users can insert their own activity logs" on public.activity_logs
  for insert with check (auth.uid() = user_id);
-- Create function to handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', null)
  )
  on conflict (id) do nothing;
  
  return new;
end;
$$;

-- Drop trigger if exists and create new one
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
-- Add documents_generated_this_month column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS documents_generated_this_month INTEGER DEFAULT 0;

-- Create a function to reset document counts monthly (can be called via cron)
CREATE OR REPLACE FUNCTION reset_monthly_document_counts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles SET documents_generated_this_month = 0;
END;
$$;
-- Admin Dashboard Schema
-- 1. Add is_admin flag to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- 2. Security-definer function to check admin status (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- 3. Admin audit log table
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  details jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON public.admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs(created_at DESC);

ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_logs;
CREATE POLICY "Admins can view audit logs" ON public.admin_logs
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.admin_logs;
CREATE POLICY "Admins can insert audit logs" ON public.admin_logs
  FOR INSERT WITH CHECK (public.is_admin() AND admin_id = auth.uid());

-- 4. Admin-wide read policies on existing tables
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all jobs" ON public.jobs;
CREATE POLICY "Admins can view all jobs" ON public.jobs
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all interviews" ON public.interviews;
CREATE POLICY "Admins can view all interviews" ON public.interviews
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all activity logs" ON public.activity_logs;
CREATE POLICY "Admins can view all activity logs" ON public.activity_logs
  FOR SELECT USING (public.is_admin());

-- 5. Designate the first admin (run manually with your email):
-- UPDATE public.profiles SET is_admin = true WHERE email = 'your@email.com';
-- Migration 005: Create payments table
-- Stores Razorpay payment records. Written server-side only (service role);
-- the authenticated role has no INSERT/UPDATE/DELETE — reads are scoped by RLS.

create table if not exists public.payments (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             uuid        not null references auth.users(id) on delete cascade,
  razorpay_order_id   text        unique,
  razorpay_payment_id text,
  amount              integer     not null default 0,
  currency            text        not null default 'GBP',
  tier                text        not null,
  status              text        not null default 'completed',
  created_at          timestamptz not null default now()
);

-- Indexes
create index if not exists payments_user_id_idx
  on public.payments(user_id);

-- Replay-protection: a given Razorpay order can only be recorded once.
create unique index if not exists payments_order_id_uniq
  on public.payments(razorpay_order_id)
  where razorpay_order_id is not null;

-- RLS
alter table public.payments enable row level security;

-- Users can read their own payment records; admins can read all.
create policy "Users can view their own payments"
  on public.payments for select
  using (auth.uid() = user_id or is_admin());

-- No INSERT/UPDATE/DELETE policies for the authenticated role.
-- All writes go through the service-role client in API routes only.
-- Migration 006: Create user_documents table
-- Stores user-uploaded CVs and cover letters (content stored as text).

create table if not exists public.user_documents (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users(id) on delete cascade,
  document_type text        not null check (document_type in ('cv', 'cover_letter')),
  name          text        not null,
  content       text        not null,
  is_default    boolean     default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Indexes
create index if not exists idx_user_documents_user_id
  on public.user_documents(user_id);

create index if not exists idx_user_documents_type
  on public.user_documents(document_type);

-- RLS
alter table public.user_documents enable row level security;

create policy "Users can view their own documents"
  on public.user_documents for select
  using (auth.uid() = user_id);

create policy "Users can insert their own documents"
  on public.user_documents for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own documents"
  on public.user_documents for update
  using (auth.uid() = user_id);

create policy "Users can delete their own documents"
  on public.user_documents for delete
  using (auth.uid() = user_id);
-- Migration 007: Add usage-tracking columns to profiles + all hardened functions
--
-- Adds:
--   profiles.ai_extractions_used            — counts AI extractions this month
--   profiles.documents_generated_this_month — counts PDF downloads this month
--   profiles.is_admin                       — boolean admin flag
--
-- Creates/replaces all SECURITY DEFINER functions with:
--   - Pinned SET search_path to prevent search-path injection
--   - Counter functions use auth.uid() internally (not the caller-supplied id)
--     so one user cannot inflate another user's quotas
--   - EXECUTE grants locked down to the minimum required role

-- ─── profiles columns ────────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists ai_extractions_used            integer not null default 0,
  add column if not exists documents_generated_this_month integer not null default 0,
  add column if not exists is_admin                       boolean not null default false;

-- Column-level UPDATE grants: authenticated users may only update display fields.
-- subscription_tier, subscription_status, is_admin are intentionally excluded.
grant update (full_name, avatar_url) on public.profiles to authenticated;

-- ─── profiles policies (safe-columns update gate) ────────────────────────────

-- Drop the original open update policy added in migration 001 and replace it
-- with one that is already enforced at the column-grant level (belt-and-suspenders).
drop policy if exists "Users can update their own profile" on public.profiles;

create policy "profiles_update_own_safe_cols"
  on public.profiles for update
  using (auth.uid() = id);

-- ─── is_admin() helper ───────────────────────────────────────────────────────

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $function$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$function$;

revoke all on function public.is_admin() from anon, authenticated, public;

-- ─── handle_new_user() trigger ───────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$function$;

revoke all on function public.handle_new_user() from anon, authenticated, public;

-- Ensure the trigger is attached (idempotent).
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── increment_ai_extractions() ──────────────────────────────────────────────
-- Called via RPC by the app after a successful job extraction.
-- Uses auth.uid() internally — the passed user_id is kept for API compatibility
-- but is intentionally ignored, preventing quota-griefing attacks.

create or replace function public.increment_ai_extractions(user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
begin
  update public.profiles
  set ai_extractions_used = coalesce(ai_extractions_used, 0) + 1,
      updated_at = now()
  where id = auth.uid();
end;
$function$;

revoke all   on function public.increment_ai_extractions(uuid) from anon, public;
grant execute on function public.increment_ai_extractions(uuid) to authenticated;

-- ─── increment_documents_generated() ────────────────────────────────────────
-- Called via RPC by the app after a successful PDF download.
-- Same auth.uid() pattern as above.

create or replace function public.increment_documents_generated(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
begin
  update public.profiles
  set documents_generated_this_month = coalesce(documents_generated_this_month, 0) + 1,
      updated_at = now()
  where id = auth.uid();
end;
$function$;

revoke all   on function public.increment_documents_generated(uuid) from anon, public;
grant execute on function public.increment_documents_generated(uuid) to authenticated;

-- ─── reset_monthly_document_count() ─────────────────────────────────────────
-- Maintenance function — wipes all users' monthly document counters.
-- Intended for a monthly cron job (Supabase pg_cron or external scheduler).
-- Not callable via the public REST API.

create or replace function public.reset_monthly_document_count()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
begin
  update public.profiles
  set documents_generated_this_month = 0,
      updated_at = now();
end;
$function$;

revoke all on function public.reset_monthly_document_count() from anon, authenticated, public;
-- ============================================================
-- 60-DAY TOKEN LEDGER
-- Every batch of tokens expires 60 days from its grant date.
-- Consumption drains the oldest-expiring batch first (FIFO by expiry).
-- Applies to both AI extraction tokens and document generation tokens.
-- ============================================================

create table if not exists public.token_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_type text not null check (token_type in ('ai_extraction','document_generation')),
  granted integer not null check (granted > 0),
  remaining integer not null check (remaining >= 0),
  source text not null default 'system',
  granted_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint token_batches_remaining_lte_granted check (remaining <= granted)
);

-- Index optimized for the consume query (oldest-expiring, still-usable batch).
create index if not exists token_batches_consume_idx
  on public.token_batches (user_id, token_type, expires_at)
  where remaining > 0;

create index if not exists token_batches_user_type_idx
  on public.token_batches (user_id, token_type);

alter table public.token_batches enable row level security;

drop policy if exists "Users can view their own token batches" on public.token_batches;
create policy "Users can view their own token batches"
  on public.token_batches for select
  using (auth.uid() = user_id);

-- ---------- get_token_balance ----------
-- Returns the total still-valid (non-expired) tokens of a type for the caller.
create or replace function public.get_token_balance(p_token_type text)
returns integer
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select coalesce(sum(remaining), 0)::integer
  from public.token_batches
  where user_id = auth.uid()
    and token_type = p_token_type
    and expires_at > now()
    and remaining > 0;
$$;

-- ---------- consume_token (oldest-expiring first, atomic) ----------
-- Decrements one token from the caller's soonest-to-expire valid batch.
-- Returns true if a token was consumed, false if the balance is exhausted.
create or replace function public.consume_token(p_token_type text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_batch_id uuid;
begin
  select id into v_batch_id
  from public.token_batches
  where user_id = auth.uid()
    and token_type = p_token_type
    and expires_at > now()
    and remaining > 0
  order by expires_at asc
  for update skip locked
  limit 1;

  if v_batch_id is null then
    return false;
  end if;

  update public.token_batches
  set remaining = remaining - 1
  where id = v_batch_id;

  return true;
end;
$$;

-- ---------- grant_tokens (service-role only) ----------
-- Grants a new batch of tokens valid for 60 days from now.
create or replace function public.grant_tokens(
  p_user_id uuid,
  p_token_type text,
  p_amount integer,
  p_source text default 'system'
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_amount is null or p_amount <= 0 then
    return;
  end if;
  if p_token_type not in ('ai_extraction','document_generation') then
    raise exception 'invalid token_type %', p_token_type;
  end if;

  insert into public.token_batches
    (user_id, token_type, granted, remaining, source, granted_at, expires_at)
  values
    (p_user_id, p_token_type, p_amount, p_amount, coalesce(p_source,'system'), now(), now() + interval '60 days');
end;
$$;

-- ---------- EXECUTE grants ----------
revoke all on function public.get_token_balance(text) from public, anon;
grant execute on function public.get_token_balance(text) to authenticated, service_role;

revoke all on function public.consume_token(text) from public, anon;
grant execute on function public.consume_token(text) to authenticated, service_role;

revoke all on function public.grant_tokens(uuid, text, integer, text) from public, anon, authenticated;
grant execute on function public.grant_tokens(uuid, text, integer, text) to service_role;

-- ---------- Backfill existing users (idempotent) ----------
-- AI extraction tokens for everyone (free=5, pro=200, premium=500).
insert into public.token_batches (user_id, token_type, granted, remaining, source, granted_at, expires_at)
select p.id, 'ai_extraction',
  (case p.subscription_tier when 'pro' then 200 when 'premium' then 500 else 5 end),
  greatest(0, (case p.subscription_tier when 'pro' then 200 when 'premium' then 500 else 5 end) - coalesce(p.ai_extractions_used, 0)),
  'backfill', now(), now() + interval '60 days'
from public.profiles p
where not exists (
  select 1 from public.token_batches b
  where b.user_id = p.id and b.token_type = 'ai_extraction' and b.source = 'backfill'
);

-- Document generation tokens for paid users only (free tier has 0).
insert into public.token_batches (user_id, token_type, granted, remaining, source, granted_at, expires_at)
select p.id, 'document_generation',
  (case p.subscription_tier when 'pro' then 200 when 'premium' then 500 end),
  greatest(0, (case p.subscription_tier when 'pro' then 200 when 'premium' then 500 end) - coalesce(p.documents_generated_this_month, 0)),
  'backfill', now(), now() + interval '60 days'
from public.profiles p
where p.subscription_tier in ('pro','premium')
  and not exists (
    select 1 from public.token_batches b
    where b.user_id = p.id and b.token_type = 'document_generation' and b.source = 'backfill'
  );

-- ---------- Grant free AI tokens to new signups ----------
create or replace function public.grant_free_tokens_on_signup()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.subscription_tier is null or new.subscription_tier = 'free' then
    perform public.grant_tokens(new.id, 'ai_extraction', 5, 'signup');
  end if;
  return new;
end;
$$;

-- Trigger-only function: not meant to be called directly via RPC.
revoke all on function public.grant_free_tokens_on_signup() from public, anon, authenticated;

drop trigger if exists on_profile_created_grant_tokens on public.profiles;
create trigger on_profile_created_grant_tokens
  after insert on public.profiles
  for each row execute function public.grant_free_tokens_on_signup();
-- Migration 009: Email verification and abuse prevention
--
-- Adds email verification for free tier users:
--   profiles.email_verified       — boolean flag, true after successful verification
--   profiles.verification_token   — secure random token for email links
--   profiles.verification_sent_at — timestamp of last verification email sent
--   ip_signup_log                 — tracks signups per IP to prevent account farming

-- ─── Add verification columns to profiles ──────────────────────────────────

alter table public.profiles
  add column if not exists email_verified boolean not null default false,
  add column if not exists verification_token text unique,
  add column if not exists verification_sent_at timestamp with time zone;

-- Only unverified free-tier users can generate documents/extract jobs (once implemented in code)

-- ─── Create IP signup tracking table ──────────────────────────────────────

create table if not exists public.ip_signup_log (
  id uuid primary key default gen_random_uuid(),
  ip_address text not null,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now()
);

-- Index for fast IP lookups (lookback 24h)
create index if not exists idx_ip_signup_log_ip_time on public.ip_signup_log(ip_address, created_at);

-- Auto-delete records older than 30 days (optional, uses pg_cron if available)
-- For manual cleanup: DELETE FROM ip_signup_log WHERE created_at < NOW() - INTERVAL '30 days';

-- Note: Disposable email domains are checked locally in /lib/disposable-domains.ts
-- No database table needed — local O(1) lookup costs $0/month

-- ─── Function to verify email and mark user as verified ──────────────────

create or replace function public.verify_email(p_token text)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_user_id uuid;
  v_result json;
begin
  -- Find the user with this token
  select id into v_user_id from public.profiles
  where verification_token = p_token
    and verification_token is not null
    and verification_sent_at > now() - interval '7 days';  -- Token valid for 7 days
  
  if v_user_id is null then
    return json_build_object('success', false, 'error', 'Invalid or expired verification token');
  end if;
  
  -- Mark email as verified and clear token
  update public.profiles
  set email_verified = true,
      verification_token = null,
      verification_sent_at = null,
      updated_at = now()
  where id = v_user_id;
  
  return json_build_object(
    'success', true,
    'message', 'Email verified successfully',
    'user_id', v_user_id
  );
end;
$function$;

revoke all on function public.verify_email(text) from authenticated, public;
grant execute on function public.verify_email(text) to anon;

-- ─── Function to log signup by IP ───────────────────────────────────────

create or replace function public.log_signup_by_ip(p_ip_address text, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
begin
  insert into public.ip_signup_log (ip_address, user_id)
  values (p_ip_address, p_user_id);
end;
$function$;

revoke all on function public.log_signup_by_ip(text, uuid) from public;
grant execute on function public.log_signup_by_ip(text, uuid) to anon;

-- ─── RLS policies ──────────────────────────────────────────────────────────

-- No need to expose IP logs to users
alter table public.ip_signup_log enable row level security;

create policy "Admins only" on public.ip_signup_log for all
  using (public.is_admin());
-- Migration 010: Remove the custom email-verification layer
--
-- We now rely on Supabase's native email confirmation (the emailRedirectTo ->
-- /auth/callback -> exchangeCodeForSession flow), which sends a real email and
-- blocks unconfirmed logins. The custom email_verified gate was half-wired
-- (no email was ever sent) and locked all free users out of document generation,
-- and the token endpoint leaked working verification links.
--
-- This migration removes the now-unused verification pieces. It intentionally
-- KEEPS the ip_signup_log table and log_signup_by_ip() function, which are still
-- used for signup abuse detection / IP rate limiting.

-- Drop the custom verification RPC (was granted to anon)
drop function if exists public.verify_email(text);

-- Drop the verification columns from profiles
alter table public.profiles
  drop column if exists email_verified,
  drop column if exists verification_token,
  drop column if exists verification_sent_at;
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
-- Migration 012: Auth hardening
--
--   1. app_users.token_version — bumping it revokes every session JWT for the
--      user (logout, password change/reset). The JWT carries the version in `tv`.
--   2. password_resets — single-use, hashed, expiring reset tokens.
--   3. auth_rate_limit — DB-backed limiter shared across serverless instances.
--
-- All three are service-role only (RLS enabled, no policies, no grants).

-- ─── 1. Session revocation ───────────────────────────────────────────────────

alter table public.app_users
  add column if not exists token_version integer not null default 0;

-- ─── 2. Password reset tokens ────────────────────────────────────────────────

create table if not exists public.password_resets (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.app_users(id) on delete cascade,
  token_hash  text        not null unique,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists password_resets_user_idx on public.password_resets (user_id);

alter table public.password_resets enable row level security;
revoke all on public.password_resets from anon, authenticated;

-- ─── 3. Rate limiting ────────────────────────────────────────────────────────

create table if not exists public.auth_rate_limit (
  id          bigint      generated always as identity primary key,
  key         text        not null,
  created_at  timestamptz not null default now()
);

create index if not exists auth_rate_limit_key_idx on public.auth_rate_limit (key, created_at);

alter table public.auth_rate_limit enable row level security;
revoke all on public.auth_rate_limit from anon, authenticated;

-- Returns true if the hit is allowed (and records it), false if over the limit.
create or replace function public.check_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_count integer;
begin
  -- Opportunistic cleanup of old rows
  if random() < 0.02 then
    delete from public.auth_rate_limit where created_at < now() - interval '1 day';
  end if;

  select count(*) into v_count
  from public.auth_rate_limit
  where key = p_key
    and created_at > now() - make_interval(secs => p_window_seconds);

  if v_count >= p_limit then
    return false;
  end if;

  insert into public.auth_rate_limit (key) values (p_key);
  return true;
end;
$function$;

revoke all on function public.check_rate_limit(text, integer, integer) from anon, authenticated, public;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;

-- ─── 4. Lock down log_signup_by_ip ───────────────────────────────────────────
-- Migration 009 granted this to anon, so anyone with the public anon key could
-- fill ip_signup_log for a victim's IP and block them from signing up.
-- Only the server (service role) logs signups.

revoke all on function public.log_signup_by_ip(text, uuid) from public, anon, authenticated;
grant execute on function public.log_signup_by_ip(text, uuid) to service_role;

-- ─── 5. is_admin() must be executable by authenticated ───────────────────────
-- Migration 007 revoked EXECUTE from authenticated, but RLS policies on jobs,
-- profiles, payments, etc. call is_admin(); Postgres checks that privilege as
-- the querying role, so every authenticated query failed with
-- "permission denied for function is_admin". The function only reveals the
-- caller's own admin flag.

grant execute on function public.is_admin() to authenticated;
