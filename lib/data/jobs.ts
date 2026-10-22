import { getCurrentUser } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import type { Job, InterviewStatus, TaskStatus } from '@/lib/types'
import { unescapeHtmlEntities } from '@/lib/validation'

// Text is stored HTML-escaped (see sanitizeInput); hand the UI the plain text.
const d = (v: string | null | undefined) => (typeof v === 'string' ? unescapeHtmlEntities(v) : v ?? undefined)

interface InterviewRow {
  id: string
  round: string
  date: string
  time: string | null
  status: InterviewStatus
  notes: string | null
}

interface TaskRow {
  id: string
  title: string
  due_date: string | null
  status: TaskStatus
  notes: string | null
}

interface ActivityRow {
  id: string
  timestamp: string
  action: string
  old_value: string | null
  new_value: string | null
}

export async function getJobs(): Promise<Job[]> {
  const supabase = await createClient()

  // Explicitly scope to the authenticated user. This is defense-in-depth on top
  // of RLS so the personal dashboard only ever shows the current user's jobs,
  // even for admin accounts that may have broader RLS visibility.
  const user = await getCurrentUser()
  if (!user) {
    return []
  }

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select(`
      *,
      interviews (*),
      tasks (*),
      activity_logs (*)
    `)
    .eq('user_id', user.id)
    .order('date_applied', { ascending: false })

  if (error) {
    console.error('[v0] Error fetching jobs:', error)
    throw new Error('Failed to fetch jobs')
  }

  return jobs.map((job) => ({
    id: job.id,
    company: d(job.company) as string,
    position: d(job.position) as string,
    status: job.status,
    dateApplied: job.date_applied,
    salary: d(job.salary),
    location: d(job.location),
    notes: d(job.notes),
    jobUrl: job.job_url ? unescapeHtmlEntities(job.job_url) : job.job_url,
    deadline: job.deadline,
    recruiterName: d(job.recruiter_name),
    recruiterEmail: d(job.recruiter_email),
    tags: (job.tags || []).map((t: string) => d(t) as string),
    requirements: (job.requirements || []).map((t: string) => d(t) as string),
    description: d(job.description),
    interviews: job.interviews?.map((i: InterviewRow) => ({
      id: i.id,
      round: d(i.round) as string,
      date: i.date,
      time: i.time || undefined,
      status: i.status,
      notes: d(i.notes),
    })) || [],
    tasks: job.tasks?.map((t: TaskRow) => ({
      id: t.id,
      title: d(t.title) as string,
      dueDate: t.due_date,
      status: t.status,
      notes: d(t.notes),
    })) || [],
    activityLog: job.activity_logs?.map((a: ActivityRow) => ({
      id: a.id,
      timestamp: a.timestamp,
      action: a.action,
      oldValue: a.old_value,
      newValue: a.new_value,
    })) || [],
  }))
}

export async function createJob(job: Omit<Job, 'id' | 'activityLog'>) {
  const supabase = await createClient()
  
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('jobs')
    .insert({
      user_id: user.id,
      company: job.company,
      position: job.position,
      status: job.status,
      date_applied: job.dateApplied,
      salary: job.salary,
      location: job.location,
      notes: job.notes,
      job_url: job.jobUrl,
      deadline: job.deadline,
      recruiter_name: job.recruiterName,
      recruiter_email: job.recruiterEmail,
      tags: job.tags || [],
    })
    .select()
    .single()

  if (error) {
    console.error('[v0] Error creating job:', error)
    throw new Error('Failed to create job')
  }

  // Create initial activity log
  await supabase.from('activity_logs').insert({
    job_id: data.id,
    action: 'Created',
    new_value: 'Applied',
  })

  return data
}

export async function updateJob(id: string, updates: Partial<Job>) {
  const supabase = await createClient()
  
  const dbUpdates: Record<string, unknown> = {}
  if (updates.company) dbUpdates.company = updates.company
  if (updates.position) dbUpdates.position = updates.position
  if (updates.status) dbUpdates.status = updates.status
  if (updates.dateApplied) dbUpdates.date_applied = updates.dateApplied
  if (updates.salary !== undefined) dbUpdates.salary = updates.salary
  if (updates.location !== undefined) dbUpdates.location = updates.location
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes
  if (updates.jobUrl !== undefined) dbUpdates.job_url = updates.jobUrl
  if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline
  if (updates.recruiterName !== undefined) dbUpdates.recruiter_name = updates.recruiterName
  if (updates.recruiterEmail !== undefined) dbUpdates.recruiter_email = updates.recruiterEmail
  if (updates.tags) dbUpdates.tags = updates.tags

  const { error } = await supabase
    .from('jobs')
    .update(dbUpdates)
    .eq('id', id)

  if (error) {
    console.error('[v0] Error updating job:', error)
    throw new Error('Failed to update job')
  }

  // Log status changes
  if (updates.status) {
    const { data: job } = await supabase.from('jobs').select('status').eq('id', id).single()
    
    await supabase.from('activity_logs').insert({
      job_id: id,
      action: 'Status Changed',
      old_value: job?.status,
      new_value: updates.status,
    })
  }

  // Handle interview updates
  if (updates.interviews) {
    for (const interview of updates.interviews) {
      if (interview.id.startsWith('new-')) {
        await supabase.from('interviews').insert({
          job_id: id,
          round: interview.round,
          date: interview.date,
          status: interview.status,
          notes: interview.notes,
        })
      } else {
        await supabase.from('interviews').update({
          round: interview.round,
          date: interview.date,
          status: interview.status,
          notes: interview.notes,
        }).eq('id', interview.id)
      }
    }
  }

  // Handle task updates
  if (updates.tasks) {
    for (const task of updates.tasks) {
      if (task.id.startsWith('new-')) {
        await supabase.from('tasks').insert({
          job_id: id,
          title: task.title,
          due_date: task.dueDate,
          status: task.status,
          notes: task.notes,
        })
      } else {
        await supabase.from('tasks').update({
          title: task.title,
          due_date: task.dueDate,
          status: task.status,
          notes: task.notes,
        }).eq('id', task.id)
      }
    }
  }
}

export async function deleteJob(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[v0] Error deleting job:', error)
    throw new Error('Failed to delete job')
  }
}

export async function deleteInterview(id: string) {
  const supabase = await createClient()
  await supabase.from('interviews').delete().eq('id', id)
}

export async function deleteTask(id: string) {
  const supabase = await createClient()
  await supabase.from('tasks').delete().eq('id', id)
}
