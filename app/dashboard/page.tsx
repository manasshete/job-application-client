import { getJobs } from '@/lib/data/jobs'
import { getProfile } from '@/lib/data/profiles'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
  const [jobs, profile] = await Promise.all([getJobs(), getProfile()])
  
  const subscriptionTier = profile?.subscription_tier || 'free'
  const isPremium = subscriptionTier === 'premium'
  const documentsUsedThisMonth = profile?.documents_generated_this_month || 0

  return (
    <DashboardClient 
      initialJobs={jobs} 
      subscriptionTier={subscriptionTier}
      isPremium={isPremium}
      documentsUsedThisMonth={documentsUsedThisMonth}
    />
  )
}
