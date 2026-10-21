-- Migration 013: columns the redesigned UI relies on.
--
--   jobs.status            allow 'accepted' (the UI already has an Accepted column)
--   jobs.requirements      key requirements pulled from the posting (matched against the master CV)
--   jobs.description       the posting text, kept so CV / cover letter tailoring has something to read
--   interviews.time        time of day for a round (date stays a plain date)
--   interviews.status      allow 'cancelled'
--   user_documents.job_id  the job a tailored CV / cover letter was made for
--
-- Safe to run more than once.

-- jobs.status: replace the check constraint so it includes 'accepted'
do $$
declare
  c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.jobs'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public.jobs drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.jobs
  add constraint jobs_status_check
  check (status in ('applied', 'interview', 'offer', 'accepted', 'rejected'));

alter table public.jobs add column if not exists requirements text[];
alter table public.jobs add column if not exists description text;

-- interviews: time of day + 'cancelled'
alter table public.interviews add column if not exists time text;

do $$
declare
  c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.interviews'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public.interviews drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.interviews
  add constraint interviews_status_check
  check (status in ('pending', 'scheduled', 'completed', 'cancelled'));

-- user_documents: link a document to its job
alter table public.user_documents
  add column if not exists job_id uuid references public.jobs(id) on delete set null;

create index if not exists idx_user_documents_job_id on public.user_documents(job_id);
