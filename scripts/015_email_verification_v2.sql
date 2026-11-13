-- Migration 015: Email verification v2 (custom JWT auth)
--
-- Adds email verification to public.app_users:
--   email_verified          — set true once the user clicks their link
--   email_verification_token— secure random token stored as text (hex)
--   verification_sent_at    — timestamp of last send, used for rate-limiting resends
--
-- The verification flow:
--   1. After signup, POST /api/auth/sign-up generates a token and emails a link.
--   2. User clicks /api/auth/verify-email?token=<hex>.
--   3. API validates (token matches, not expired), sets email_verified = true.
--
-- Existing users default to email_verified = false and will see a soft banner.
-- To bulk-verify existing test users, uncomment the UPDATE below.

alter table public.app_users
  add column if not exists email_verified        boolean      not null default false,
  add column if not exists email_verification_token text       unique,
  add column if not exists verification_sent_at  timestamptz;

-- Optional: mark all existing users as verified so they aren't interrupted
-- UPDATE public.app_users SET email_verified = true WHERE email_verified = false;

-- Index so the token lookup is O(1)
create index if not exists app_users_verification_token_idx
  on public.app_users (email_verification_token)
  where email_verification_token is not null;
