import { SUBSCRIPTION_LIMITS, SUBSCRIPTION_PRICING, type SubscriptionTier } from '@/lib/subscription'

export interface PlanView {
  tier: SubscriptionTier
  name: string
  price: string
  per: string
  lines: string[]
}

const L = SUBSCRIPTION_LIMITS

export const PLANS: PlanView[] = [
  {
    tier: 'free',
    name: 'Free',
    price: '₹0',
    per: 'forever',
    lines: [`Up to ${L.free.maxJobs} applications`, `${L.free.aiExtractionLimit} AI extractions / month`, `${L.free.documentGenerationLimit} AI documents / month`],
  },
  {
    tier: 'pro',
    name: 'Pro',
    price: `₹${SUBSCRIPTION_PRICING.pro}`,
    per: '/ month',
    lines: ['Unlimited applications', `${L.pro.aiExtractionLimit} AI extractions / month`, `${L.pro.documentGenerationLimit} AI documents / month`],
  },
  {
    tier: 'premium',
    name: 'Premium',
    price: `₹${SUBSCRIPTION_PRICING.premium}`,
    per: '/ month',
    lines: ['Everything in Pro', `${L.premium.aiExtractionLimit} AI extractions / month`, `${L.premium.documentGenerationLimit} AI documents / month`, 'Priority AI queue'],
  },
]

export const planOf = (tier: SubscriptionTier) => PLANS.find((p) => p.tier === tier) ?? PLANS[0]

export const upgradeTarget = (tier: SubscriptionTier): 'pro' | 'premium' | null => (tier === 'free' ? 'pro' : tier === 'pro' ? 'premium' : null)

export const FREE_JOB_LIMIT = L.free.maxJobs
