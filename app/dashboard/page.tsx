import { getJobs } from '@/lib/data/jobs'
import { getProfile } from '@/lib/data/profiles'
import { getTokenSummary } from '@/lib/data/tokens'
import { SUBSCRIPTION_LIMITS, type SubscriptionTier } from '@/lib/subscription'
import { DashboardClient } from './dashboard-client'

// Force dynamic rendering to always fetch fresh profile data
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const [jobs, profile] = await Promise.all([getJobs(), getProfile()])
  
  const subscriptionTier = (profile?.subscription_tier || 'free') as SubscriptionTier
  const isPremium = subscriptionTier === 'premium'
  
  // getTokenBalance returns REMAINING tokens. Convert to "used" by subtracting
  // from the tier limit so the dialog displays "X used out of Y".
  const tokenSummary = await getTokenSummary()
  const tierLimit = SUBSCRIPTION_LIMITS[subscriptionTier]?.documentGenerationLimit ?? 0
  const documentsUsedThisMonth = Math.max(0, tierLimit - tokenSummary.documentGenerationBalance)

  return (
    <DashboardClient 
      initialJobs={jobs} 
      subscriptionTier={subscriptionTier}
      isPremium={isPremium}
      documentsUsedThisMonth={documentsUsedThisMonth}
      userName={profile?.full_name?.trim() || profile?.email?.split('@')[0] || undefined}
      userEmail={profile?.email || undefined}
      extractionTokens={tokenSummary.aiExtractionBalance}
      documentTokens={tokenSummary.documentGenerationBalance}
      nextTokenExpiry={tokenSummary.nextExpiry}
    />
  )
}
