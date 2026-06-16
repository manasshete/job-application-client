import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/data/profiles'
import { getJobs } from '@/lib/data/jobs'
import { SettingsClient } from './settings-client'
import type { JobStatus } from '@/lib/types'

// Always render fresh so subscription/job changes reflect immediately.
export const dynamic = 'force-dynamic'

export interface JobStats {
  total: number
  byStatus: Record<JobStatus, number>
  activeApplications: number
}

export default async function SettingsPage() {
  const profile = await getProfile()

  if (!profile) {
    redirect('/auth/login')
  }

  const jobs = await getJobs()

  const byStatus: Record<JobStatus, number> = {
    applied: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
    accepted: 0,
  }

  for (const job of jobs) {
    const status = job.status as JobStatus
    if (status in byStatus) {
      byStatus[status] += 1
    }
  }

  // Active = anything not yet closed out (rejected).
  const activeApplications = jobs.length - byStatus.rejected

  const stats: JobStats = {
    total: jobs.length,
    byStatus,
    activeApplications,
  }

  return <SettingsClient profile={profile} stats={stats} />
}
