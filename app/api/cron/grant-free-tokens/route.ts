import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/admin/service-client'
import { SUBSCRIPTION_LIMITS } from '@/lib/subscription'

export const dynamic = 'force-dynamic'

/**
 * Monthly free-tier top-up.
 *
 * Paid tiers receive tokens at purchase time (see /api/payment/verify), so this
 * cron only re-grants the free allotment to free-tier users. Each grant is a
 * fresh 60-day batch that stacks on any unused tokens. We skip users who
 * already received a free_monthly grant in the last 28 days to stay idempotent
 * even if the cron fires more than once.
 *
 * Secured with CRON_SECRET: Vercel Cron sends it as a Bearer token.
 */
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const aiExtractionAllotment = SUBSCRIPTION_LIMITS.free.aiExtractionLimit
  const documentGenerationAllotment = SUBSCRIPTION_LIMITS.free.documentGenerationLimit

  // Free-tier users.
  const { data: profiles, error: profilesError } = await admin
    .from('profiles')
    .select('id')
    .eq('subscription_tier', 'free')

  if (profilesError) {
    console.error('[v0] Cron: failed to list free users:', profilesError.message)
    return NextResponse.json({ error: 'Failed to list users' }, { status: 500 })
  }

  // Users who already got a free_monthly grant within the last 28 days.
  const cutoff = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString()
  const { data: recent, error: recentError } = await admin
    .from('token_batches')
    .select('user_id')
    .eq('source', 'free_monthly')
    .gt('granted_at', cutoff)

  if (recentError) {
    console.error('[v0] Cron: failed to read recent grants:', recentError.message)
    return NextResponse.json({ error: 'Failed to read recent grants' }, { status: 500 })
  }

  const recentlyGranted = new Set((recent ?? []).map((r) => r.user_id))
  const targets = (profiles ?? []).filter((p) => !recentlyGranted.has(p.id))

  let granted = 0
  for (const profile of targets) {
    // Grant ai_extraction tokens
    const { error: aiError } = await admin.rpc('grant_tokens', {
      p_user_id: profile.id,
      p_token_type: 'ai_extraction',
      p_amount: aiExtractionAllotment,
      p_source: 'free_monthly',
    })
    if (aiError) {
      console.error('[v0] Cron: failed to grant ai_extraction tokens to', profile.id, aiError.message)
    } else {
      granted += 1
    }

    // Grant document_generation tokens
    const { error: docError } = await admin.rpc('grant_tokens', {
      p_user_id: profile.id,
      p_token_type: 'document_generation',
      p_amount: documentGenerationAllotment,
      p_source: 'free_monthly',
    })
    if (docError) {
      console.error('[v0] Cron: failed to grant document_generation tokens to', profile.id, docError.message)
    }
  }

  return NextResponse.json({ success: true, granted, skipped: (profiles ?? []).length - granted })
}
