import { getJobs } from '@/lib/data/jobs'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
  const jobs = await getJobs()
  return <DashboardClient initialJobs={jobs} />
}
