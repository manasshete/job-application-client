import { getCurrentUser } from '@/lib/auth/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/admin/service-client'
import { sendSubscriptionChangeEmail } from '@/lib/email/subscription-emails'
import type { SubscriptionTier } from '@/lib/subscription'

export const dynamic = 'force-dynamic'

// Numeric ranking used to decide whether a tier change is a downgrade.
const TIER_RANK: Record<SubscriptionTier, number> = {
  free: 0,
  pro: 1,
  premium: 2,
}

const VALID_TIERS: SubscriptionTier[] = ['free', 'pro', 'premium']

/**
 * Handles DOWNGRADES only (moving to a cheaper or free plan), which require no
 * payment. Upgrades must go through the Razorpay checkout flow
 * (/api/payment/create-order + /api/payment/verify) so they are intentionally
 * rejected here — this prevents a user from self-upgrading without paying.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const targetTier = (body as { tier?: unknown })?.tier
    if (typeof targetTier !== 'string' || !VALID_TIERS.includes(targetTier as SubscriptionTier)) {
      return NextResponse.json(
        { error: 'Invalid tier. Expected "free", "pro", or "premium".' },
        { status: 400 }
      )
    }

    // Read current tier to validate the transition.
    const { data: profile, error: readError } = await supabase
      .from('profiles')
      .select('subscription_tier, full_name')
      .eq('id', user.id)
      .single()

    if (readError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const currentTier = profile.subscription_tier as SubscriptionTier
    const newTier = targetTier as SubscriptionTier

    if (newTier === currentTier) {
      return NextResponse.json({ error: 'You are already on this plan.' }, { status: 400 })
    }

    // Only allow downgrades here. Upgrades must go through payment.
    if (TIER_RANK[newTier] > TIER_RANK[currentTier]) {
      return NextResponse.json(
        { error: 'Upgrades require payment. Please use the checkout flow.' },
        { status: 400 }
      )
    }

    // Use the service-role client for the write so it's never blocked by RLS
    // edge cases. Identity is already verified; we scope to the exact user.id.
    const adminClient = createAdminClient()
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({
        subscription_tier: newTier,
        subscription_status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('[v0] Error downgrading tier:', updateError.message, updateError.details)
      return NextResponse.json({ error: 'Failed to change plan' }, { status: 500 })
    }

    // Send confirmation email (best-effort).
    try {
      await sendSubscriptionChangeEmail(user.email || '', profile.full_name || '', currentTier, newTier)
    } catch (emailError) {
      console.error('[v0] Failed to send tier change email:', emailError)
    }

    return NextResponse.json({ success: true, subscription_tier: newTier })
  } catch (error) {
    console.error('[v0] Change-tier route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
