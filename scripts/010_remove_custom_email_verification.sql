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
