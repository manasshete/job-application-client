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
