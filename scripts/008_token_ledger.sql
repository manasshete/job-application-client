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
