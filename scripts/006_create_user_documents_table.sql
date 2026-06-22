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
