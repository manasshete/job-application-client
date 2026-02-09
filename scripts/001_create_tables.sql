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
