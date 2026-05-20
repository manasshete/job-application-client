import { getJobs } from '@/lib/data/jobs'
import { getProfile } from '@/lib/data/profiles'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
  const [jobs, profile] = await Promise.all([getJobs(), getProfile()])
  
  const isPremium = profile?.subscription_tier === 'premium'
  const documentsUsedThisMonth = profile?.documents_generated_this_month || 0

  return (
    <DashboardClient 
      initialJobs={jobs} 
      isPremium={isPremium}
      documentsUsedThisMonth={documentsUsedThisMonth}
    />
  )
}
