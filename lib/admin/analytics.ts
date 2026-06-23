import { createAdminClient } from '@/lib/admin/service-client'
import { SUBSCRIPTION_PRICING, SUBSCRIPTION_LIMITS, type SubscriptionTier } from '@/lib/subscription'

// Approximate API cost per AI action in INR (from cost analysis)
const COST_PER_EXTRACTION = 0.04 // ~₹0.04 per job extraction
const COST_PER_DOCUMENT = 0.2 // ~₹0.20 per generated document

type Profile = {
  id: string
  email: string | null
  subscription_tier: string | null
  subscription_status: string | null
  created_at: string
  updated_at: string
  ai_extractions_used: number | null
  documents_generated_this_month: number | null
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

function startOfMonth(): Date {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

async function getAllProfiles(): Promise<Profile[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('profiles')
    .select(
      'id, email, subscription_tier, subscription_status, created_at, updated_at, ai_extractions_used, documents_generated_this_month'
    )
  if (error) throw new Error(`Failed to load profiles: ${error.message}`)
  return (data ?? []) as Profile[]
}

type TokenBatch = {
  user_id: string
  token_type: string
  granted: number
  remaining: number
  expires_at: string
}

async function getAllTokenBatches(): Promise<TokenBatch[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('token_batches')
    .select('user_id, token_type, granted, remaining, expires_at')
  if (error) throw new Error(`Failed to load token batches: ${error.message}`)
  return (data ?? []) as TokenBatch[]
}

// Aggregate token batches into per-user consumed totals and active remaining
// balances (consumed = granted - remaining; only unexpired batches count toward
// "remaining"). Used by feature-usage and system-health metrics.
function aggregateTokens(batches: TokenBatch[]) {
  const now = Date.now()
  const consumed = {
    ai_extraction: 0,
    document_generation: 0,
  }
  const consumedByUser = {
    ai_extraction: new Set<string>(),
    document_generation: new Set<string>(),
  }
  const remainingByUser = {
    ai_extraction: new Map<string, number>(),
    document_generation: new Map<string, number>(),
  }

  for (const b of batches) {
    const type = b.token_type as 'ai_extraction' | 'document_generation'
    if (type !== 'ai_extraction' && type !== 'document_generation') continue

    const used = Math.max(0, (b.granted ?? 0) - (b.remaining ?? 0))
    if (used > 0) {
      consumed[type] += used
      consumedByUser[type].add(b.user_id)
    }
    if (new Date(b.expires_at).getTime() > now) {
      remainingByUser[type].set(
        b.user_id,
        (remainingByUser[type].get(b.user_id) ?? 0) + (b.remaining ?? 0)
      )
    }
  }

  return { consumed, consumedByUser, remainingByUser }
}

// ============ TAB 1: USER METRICS ============
export async function getUserMetrics() {
  const profiles = await getAllProfiles()
  const admin = createAdminClient()

  const total = profiles.length
  const byTier = { free: 0, pro: 0, premium: 0 } as Record<string, number>
  for (const p of profiles) {
    const tier = (p.subscription_tier ?? 'free') as string
    byTier[tier] = (byTier[tier] ?? 0) + 1
  }

  // Active users based on activity_logs timestamps
  const { data: activity } = await admin
    .from('activity_logs')
    .select('user_id, timestamp')
    .gte('timestamp', daysAgo(30).toISOString())

  const dau = new Set<string>()
  const wau = new Set<string>()
  const mau = new Set<string>()
  const now = Date.now()
  for (const a of activity ?? []) {
    const ts = new Date(a.timestamp as string).getTime()
    const ageDays = (now - ts) / (1000 * 60 * 60 * 24)
    if (ageDays <= 1) dau.add(a.user_id as string)
    if (ageDays <= 7) wau.add(a.user_id as string)
    mau.add(a.user_id as string)
  }

  // Growth: signups over last 6 months
  const growth: { month: string; signups: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1)
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    const count = profiles.filter((p) => {
      const c = new Date(p.created_at)
      return c >= monthStart && c < monthEnd
    }).length
    growth.push({
      month: monthStart.toLocaleString('en-GB', { month: 'short' }),
      signups: count,
    })
  }

  const newThisMonth = profiles.filter((p) => new Date(p.created_at) >= startOfMonth()).length

  return {
    total,
    newThisMonth,
    dau: dau.size,
    wau: wau.size,
    mau: mau.size,
    tierDistribution: [
      { tier: 'Free', count: byTier.free ?? 0 },
      { tier: 'Pro', count: byTier.pro ?? 0 },
      { tier: 'Premium', count: byTier.premium ?? 0 },
    ],
    growth,
  }
}

// ============ TAB 2: REVENUE & SUBSCRIPTION ============
export async function getRevenueMetrics() {
  const profiles = await getAllProfiles()

  const proCount = profiles.filter((p) => p.subscription_tier === 'pro').length
  const premiumCount = profiles.filter((p) => p.subscription_tier === 'premium').length
  const paidCount = proCount + premiumCount

  const proRevenue = proCount * SUBSCRIPTION_PRICING.pro
  const premiumRevenue = premiumCount * SUBSCRIPTION_PRICING.premium
  const mrr = proRevenue + premiumRevenue
  const arpu = profiles.length > 0 ? mrr / profiles.length : 0

  // Conversion: paid / total
  const conversionRate = profiles.length > 0 ? (paidCount / profiles.length) * 100 : 0

  return {
    mrr,
    arr: mrr * 12,
    arpu,
    paidCount,
    conversionRate,
    revenueByTier: [
      { tier: 'Pro', revenue: proRevenue, users: proCount },
      { tier: 'Premium', revenue: premiumRevenue, users: premiumCount },
    ],
  }
}

// ============ TAB 3: FEATURE USAGE ============
export async function getFeatureUsage() {
  const admin = createAdminClient()
  const batches = await getAllTokenBatches()
  const { consumed, consumedByUser } = aggregateTokens(batches)

  // Total tokens actually consumed across all users (granted - remaining).
  const totalExtractions = consumed.ai_extraction
  const totalDocuments = consumed.document_generation

  const { count: jobsCount } = await admin
    .from('jobs')
    .select('*', { count: 'exact', head: true })
  const { count: docsCount } = await admin
    .from('user_documents')
    .select('*', { count: 'exact', head: true })

  // Adoption: how many users have consumed at least one token of each type.
  const usersUsingExtractions = consumedByUser.ai_extraction.size
  const usersUsingDocuments = consumedByUser.document_generation.size

  const apiCost =
    totalExtractions * COST_PER_EXTRACTION + totalDocuments * COST_PER_DOCUMENT

  return {
    totalExtractions,
    totalDocuments,
    totalJobs: jobsCount ?? 0,
    totalSavedDocuments: docsCount ?? 0,
    apiCost,
    adoption: [
      { feature: 'AI Extractions', users: usersUsingExtractions },
      { feature: 'Document Generation', users: usersUsingDocuments },
    ],
  }
}

// ============ TAB 4: SYSTEM HEALTH ============
export async function getSystemHealth() {
  const admin = createAdminClient()
  const profiles = await getAllProfiles()

  // Users who have run out of usable tokens (0 active remaining) for a feature
  // their tier is entitled to — these are potential friction points.
  const batches = await getAllTokenBatches()
  const { remainingByUser } = aggregateTokens(batches)
  let extractionLimitHits = 0
  let documentLimitHits = 0
  for (const p of profiles) {
    const tier = (p.subscription_tier ?? 'free') as SubscriptionTier
    const limits = SUBSCRIPTION_LIMITS[tier]
    if (!limits) continue
    if (
      limits.aiExtractionLimit > 0 &&
      (remainingByUser.ai_extraction.get(p.id) ?? 0) <= 0
    ) {
      extractionLimitHits++
    }
    if (
      limits.hasDocumentGeneration &&
      (remainingByUser.document_generation.get(p.id) ?? 0) <= 0
    ) {
      documentLimitHits++
    }
  }

  // Recent activity volume as a proxy for system load (last 7 days, by day)
  const { data: activity } = await admin
    .from('activity_logs')
    .select('timestamp')
    .gte('timestamp', daysAgo(7).toISOString())

  const loadByDay: { day: string; events: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = daysAgo(i)
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)
    const count = (activity ?? []).filter((a) => {
      const ts = new Date(a.timestamp as string)
      return ts >= dayStart && ts < dayEnd
    }).length
    loadByDay.push({
      day: dayStart.toLocaleString('en-GB', { weekday: 'short' }),
      events: count,
    })
  }

  return {
    extractionLimitHits,
    documentLimitHits,
    totalEvents7d: (activity ?? []).length,
    loadByDay,
  }
}

// ============ TAB 5: USER ENGAGEMENT ============
export async function getEngagementMetrics() {
  const admin = createAdminClient()
  const profiles = await getAllProfiles()

  const { data: activity } = await admin
    .from('activity_logs')
    .select('user_id, timestamp')
    .gte('timestamp', daysAgo(60).toISOString())

  // Retention: of users created >=7/30 days ago, how many have recent activity
  const activeUserIds = new Set((activity ?? []).map((a) => a.user_id as string))

  const cohort7 = profiles.filter((p) => new Date(p.created_at) <= daysAgo(7))
  const retained7 = cohort7.filter((p) => activeUserIds.has(p.id)).length
  const cohort30 = profiles.filter((p) => new Date(p.created_at) <= daysAgo(30))
  const retained30 = cohort30.filter((p) => activeUserIds.has(p.id)).length

  // Active by day over last 14 days
  const activeByDay: { day: string; active: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = daysAgo(i)
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)
    const dayUsers = new Set(
      (activity ?? [])
        .filter((a) => {
          const ts = new Date(a.timestamp as string)
          return ts >= dayStart && ts < dayEnd
        })
        .map((a) => a.user_id as string)
    )
    activeByDay.push({
      day: dayStart.toLocaleString('en-GB', { day: 'numeric', month: 'short' }),
      active: dayUsers.size,
    })
  }

  // Dormant users: no activity in 30 days
  const recentlyActive = new Set(
    (activity ?? [])
      .filter((a) => new Date(a.timestamp as string) >= daysAgo(30))
      .map((a) => a.user_id as string)
  )
  const dormant = profiles.filter((p) => !recentlyActive.has(p.id)).length

  return {
    retention7: cohort7.length > 0 ? (retained7 / cohort7.length) * 100 : 0,
    retention30: cohort30.length > 0 ? (retained30 / cohort30.length) * 100 : 0,
    dormant,
    activeByDay,
  }
}

// ============ TAB 6: DATA INSIGHTS ============
export async function getDataInsights() {
  const admin = createAdminClient()
  const profiles = await getAllProfiles()

  const { data: jobs, count: jobsCount } = await admin
    .from('jobs')
    .select('company, position, status', { count: 'exact' })
  const { count: interviewsCount } = await admin
    .from('interviews')
    .select('*', { count: 'exact', head: true })

  const avgJobsPerUser = profiles.length > 0 ? (jobsCount ?? 0) / profiles.length : 0

  // Status distribution
  const statusMap: Record<string, number> = {}
  const companyMap: Record<string, number> = {}
  for (const j of jobs ?? []) {
    const status = (j.status as string) ?? 'unknown'
    statusMap[status] = (statusMap[status] ?? 0) + 1
    const company = (j.company as string) ?? 'Unknown'
    companyMap[company] = (companyMap[company] ?? 0) + 1
  }

  const statusDistribution = Object.entries(statusMap).map(([status, count]) => ({
    status,
    count,
  }))

  const topCompanies = Object.entries(companyMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([company, count]) => ({ company, count }))

  return {
    totalJobs: jobsCount ?? 0,
    totalInterviews: interviewsCount ?? 0,
    avgJobsPerUser,
    statusDistribution,
    topCompanies,
  }
}

// ============ TAB 7: SUPPORT & ISSUES ============
export async function getSupportMetrics() {
  const profiles = await getAllProfiles()

  // No dedicated support table yet — surface users hitting limits as
  // proactive support signals, plus accounts with past_due status.
  const pastDue = profiles.filter((p) => p.subscription_status === 'past_due').length
  const canceled = profiles.filter((p) => p.subscription_status === 'canceled').length

  return {
    openTickets: 0,
    pastDue,
    canceled,
    note: 'No dedicated support ticket system is connected yet. These figures are derived from subscription status.',
  }
}

// ============ TAB 8: PAYMENT & RAZORPAY ============
export async function getPaymentMetrics() {
  const profiles = await getAllProfiles()

  const active = profiles.filter((p) => p.subscription_status === 'active').length
  const pastDue = profiles.filter((p) => p.subscription_status === 'past_due').length
  const canceled = profiles.filter((p) => p.subscription_status === 'canceled').length
  const paid = profiles.filter(
    (p) => p.subscription_tier === 'pro' || p.subscription_tier === 'premium'
  ).length

  const successRate = paid > 0 ? (active / paid) * 100 : 0

  return {
    active,
    pastDue,
    canceled,
    successRate,
    statusBreakdown: [
      { status: 'Active', count: active },
      { status: 'Past Due', count: pastDue },
      { status: 'Canceled', count: canceled },
    ],
  }
}
