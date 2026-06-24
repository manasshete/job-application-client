export type SubscriptionTier = 'free' | 'pro' | 'premium'

export interface SubscriptionLimits {
  maxJobs: number
  maxInterviews: number
  maxTasks: number
  aiExtractionLimit: number
  documentGenerationLimit: number
  hasEmailNotifications: boolean
  hasAdvancedFilters: boolean
  hasTimelineView: boolean
  hasExport: boolean
  hasDocumentGeneration: boolean
}

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  free: {
    maxJobs: 10,
    maxInterviews: 20,
    maxTasks: 20,
    aiExtractionLimit: 5,
    documentGenerationLimit: 0,
    hasEmailNotifications: false,
    hasAdvancedFilters: false,
    hasTimelineView: false,
    hasExport: false,
    hasDocumentGeneration: false,
  },
  pro: {
    maxJobs: -1,
    maxInterviews: -1,
    maxTasks: -1,
    aiExtractionLimit: 200,
    documentGenerationLimit: 200,
    hasEmailNotifications: true,
    hasAdvancedFilters: true,
    hasTimelineView: true,
    hasExport: true,
    hasDocumentGeneration: true,
  },
  premium: {
    maxJobs: -1,
    maxInterviews: -1,
    maxTasks: -1,
    aiExtractionLimit: 300,
    documentGenerationLimit: 300,
    hasEmailNotifications: true,
    hasAdvancedFilters: true,
    hasTimelineView: true,
    hasExport: true,
    hasDocumentGeneration: true,
  },
}

// Subscription pricing in INR (rupees)
export const SUBSCRIPTION_PRICING: Record<SubscriptionTier, number> = {
  free: 0,
  pro: 299,
  premium: 499,
}

export function checkLimit(tier: SubscriptionTier, current: number, limit: keyof SubscriptionLimits): boolean {
  const limits = SUBSCRIPTION_LIMITS[tier]
  const maxLimit = limits[limit] as number
  
  if (maxLimit === -1) return true // unlimited
  return current < maxLimit
}

export function canUseFeature(tier: SubscriptionTier, feature: keyof SubscriptionLimits): boolean {
  return SUBSCRIPTION_LIMITS[tier][feature] === true
}
