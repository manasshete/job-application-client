// Shared domain types used across the entire application.
// All components and server code import from here — never from app/page.

export type JobStatus = 'applied' | 'interview' | 'offer' | 'rejected' | 'accepted'

export type InterviewStatus = 'pending' | 'scheduled' | 'completed' | 'cancelled'

export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'submitted'

export interface Interview {
  id: string
  round: string
  date: string
  status: InterviewStatus
  notes?: string
}

export interface Task {
  id: string
  title: string
  dueDate?: string
  status: TaskStatus
  notes?: string
}

export interface ActivityLogEntry {
  id: string
  timestamp: string
  action: string
  oldValue?: string
  newValue?: string
}

export interface Job {
  id: string
  company: string
  position: string
  status: JobStatus
  dateApplied: string
  salary?: string
  location?: string
  notes?: string
  jobUrl?: string
  deadline?: string
  recruiterName?: string
  recruiterEmail?: string
  tags?: string[]
  interviews?: Interview[]
  tasks?: Task[]
  activityLog?: ActivityLogEntry[]
}

// Legacy alias — kept for compatibility but prefer Job directly.
export type JobApplication = Job
