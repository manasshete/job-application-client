export type JobStatus = 'applied' | 'interview' | 'offer' | 'rejected' | 'accepted'

export interface JobApplication {
  id: string
  company: string
  position: string
  status: JobStatus
  appliedDate: string
  salary?: string
  location?: string
  notes?: string
  url?: string
}
