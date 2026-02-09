export type SubscriptionTier = 'free' | 'pro' | 'premium'

export interface SubscriptionLimits {
  maxJobs: number
  maxInterviews: number
  maxTasks: number
  aiExtractionLimit: number
  hasEmailNotifications: boolean
  hasAdvancedFilters: boolean
  hasTimelineView: boolean
  hasExport: boolean
}

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  free: {
    maxJobs: 10,
    maxInterviews: 20,
    maxTasks: 20,
    aiExtractionLimit: 5,
    hasEmailNotifications: false,
    hasAdvancedFilters: false,
    hasTimelineView: false,
    hasExport: false,
  },
  pro: {
    maxJobs: -1, // unlimited
    maxInterviews: -1,
    maxTasks: -1,
    aiExtractionLimit: 50,
    hasEmailNotifications: true,
    hasAdvancedFilters: true,
    hasTimelineView: true,
    hasExport: true,
  },
  premium: {
    maxJobs: -1,
    maxInterviews: -1,
    maxTasks: -1,
    aiExtractionLimit: -1, // unlimited
    hasEmailNotifications: true,
    hasAdvancedFilters: true,
    hasTimelineView: true,
    hasExport: true,
  },
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
