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
