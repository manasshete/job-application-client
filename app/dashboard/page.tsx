import { getJobs } from '@/lib/data/jobs'
import { getProfile } from '@/lib/data/profiles'
import { getTokenBalance } from '@/lib/data/tokens'
import { DashboardClient } from './dashboard-client'

// Force dynamic rendering to always fetch fresh profile data
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const [jobs, profile] = await Promise.all([getJobs(), getProfile()])
  
  const subscriptionTier = profile?.subscription_tier || 'free'
  const isPremium = subscriptionTier === 'premium'
  
  // Fetch live token balance (not the frozen monthly counter)
  const tokenBalance = await getTokenBalance('document_generation')
  const documentsUsedThisMonth = tokenBalance || 0

  return (
    <DashboardClient 
      initialJobs={jobs} 
      subscriptionTier={subscriptionTier}
      isPremium={isPremium}
      documentsUsedThisMonth={documentsUsedThisMonth}
    />
  )
}
