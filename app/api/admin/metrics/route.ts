import { NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/admin/auth'
import {
  getUserMetrics,
  getRevenueMetrics,
  getFeatureUsage,
  getSystemHealth,
  getEngagementMetrics,
  getDataInsights,
  getSupportMetrics,
  getPaymentMetrics,
} from '@/lib/admin/analytics'

export const dynamic = 'force-dynamic'

const METRIC_HANDLERS: Record<string, () => Promise<unknown>> = {
  users: getUserMetrics,
  revenue: getRevenueMetrics,
  features: getFeatureUsage,
  health: getSystemHealth,
  engagement: getEngagementMetrics,
  insights: getDataInsights,
  support: getSupportMetrics,
  payments: getPaymentMetrics,
}

export async function GET(req: Request) {
  const check = await verifyAdmin()
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }

  const { searchParams } = new URL(req.url)
  const tab = searchParams.get('tab')

  if (!tab || !(tab in METRIC_HANDLERS)) {
    return NextResponse.json(
      { error: 'Invalid or missing tab parameter' },
      { status: 400 }
    )
  }

  try {
    const data = await METRIC_HANDLERS[tab]()
    return NextResponse.json({ data })
  } catch (error) {
    console.error(`[v0] Admin metrics error (${tab}):`, error)
    return NextResponse.json(
      { error: 'Failed to load metrics' },
      { status: 500 }
    )
  }
}
