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
