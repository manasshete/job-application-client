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
