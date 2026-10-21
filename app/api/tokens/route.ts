import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'
import { getTokenBatches, getTokenSummary } from '@/lib/data/tokens'

export const dynamic = 'force-dynamic'

/** Current token balances and the batches behind them. */
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [summary, batches] = await Promise.all([getTokenSummary(), getTokenBatches()])
  return NextResponse.json({
    extractions: summary.aiExtractionBalance,
    documents: summary.documentGenerationBalance,
    nextExpiry: summary.nextExpiry,
    batches,
  })
}
