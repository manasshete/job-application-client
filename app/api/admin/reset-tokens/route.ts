import { NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/admin/service-client'
import { SUBSCRIPTION_LIMITS, type SubscriptionTier } from '@/lib/subscription'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/reset-tokens
 * One-time admin route to expire old token batches for all paid users
 * and re-grant them at the new limits (Pro: 100, Premium: 300).
 */
export async function POST(req: Request) {
  const check = await verifyAdmin()
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }

  // Optional: scope to a specific tier, otherwise reset all paid users
  let body: { tier?: string } = {}
  try { body = await req.json() } catch { /* no body is fine */ }

  const admin = createAdminClient()

  // 1. Fetch all pro and premium users
  const tierFilter = body.tier && ['pro', 'premium'].includes(body.tier)
    ? [body.tier]
    : ['pro', 'premium']

  const { data: users, error: usersError } = await admin
    .from('profiles')
    .select('id, subscription_tier')
    .in('subscription_tier', tierFilter)

  if (usersError || !users) {
    console.error('[v0] reset-tokens: failed to fetch users', usersError?.message)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }

  const results = { reset: 0, failed: 0, users: [] as string[] }

  for (const user of users) {
    const tier = user.subscription_tier as SubscriptionTier
    const limits = SUBSCRIPTION_LIMITS[tier]
    if (!limits) continue

    // 2. Expire all existing token batches for this user
    const { error: expireError } = await admin
      .from('token_batches')
      .update({ remaining: 0 })
      .eq('user_id', user.id)
      .gt('remaining', 0)

    if (expireError) {
      console.error('[v0] reset-tokens: failed to expire tokens for', user.id, expireError.message)
      results.failed++
      continue
    }

    // 3. Grant fresh batches at new limits
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 60)
    const expiresAtISO = expiresAt.toISOString()

    const { error: grantError } = await admin
      .from('token_batches')
      .insert([
        {
          user_id: user.id,
          token_type: 'ai_extraction',
          granted: limits.aiExtractionLimit,
          remaining: limits.aiExtractionLimit,
          source: 'admin_reset',
          granted_at: new Date().toISOString(),
          expires_at: expiresAtISO,
        },
        {
          user_id: user.id,
          token_type: 'document_generation',
          granted: limits.documentGenerationLimit,
          remaining: limits.documentGenerationLimit,
          source: 'admin_reset',
          granted_at: new Date().toISOString(),
          expires_at: expiresAtISO,
        },
      ])

    if (grantError) {
      console.error('[v0] reset-tokens: failed to grant tokens for', user.id, grantError.message)
      results.failed++
      continue
    }

    results.reset++
    results.users.push(user.id)
  }

  return NextResponse.json({
    message: `Reset complete. ${results.reset} users updated, ${results.failed} failed.`,
    ...results,
  })
}
