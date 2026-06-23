import { NextResponse } from 'next/server'
import { verifyAdmin, logAdminAction } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/admin/service-client'
import { sendSubscriptionChangeEmail } from '@/lib/email/subscription-emails'
import { SUBSCRIPTION_LIMITS, type SubscriptionTier } from '@/lib/subscription'
import { grantTokens } from '@/lib/data/tokens'

export const dynamic = 'force-dynamic'

const VALID_TIERS: SubscriptionTier[] = ['free', 'pro', 'premium']
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(req: Request) {
  const check = await verifyAdmin()
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }

  let body: { userId?: unknown; tier?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const userId = typeof body.userId === 'string' ? body.userId : ''
  const tier = typeof body.tier === 'string' ? body.tier : ''

  // Strict input validation
  if (!UUID_REGEX.test(userId)) {
    return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
  }
  if (!VALID_TIERS.includes(tier as SubscriptionTier)) {
    return NextResponse.json(
      { error: 'Invalid tier. Must be free, pro, or premium.' },
      { status: 400 }
    )
  }

  try {
    const admin = createAdminClient()

    // Read current tier for the audit trail
    const { data: current, error: readError } = await admin
      .from('profiles')
      .select('email, subscription_tier')
      .eq('id', userId)
      .single()

    if (readError || !current) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const previousTier = current.subscription_tier

    // Update the tier and mark subscription active for paid tiers
    const { data: updated, error: updateError } = await admin
      .from('profiles')
      .update({
        subscription_tier: tier,
        subscription_status: tier === 'free' ? 'inactive' : 'active',
      })
      .eq('id', userId)
      .select(
        'id, email, subscription_tier, subscription_status, is_admin, ai_extractions_used, documents_generated_this_month, created_at, full_name'
      )
      .single()

    if (updateError) {
      console.error('[v0] Admin subscription update error:', {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code,
      })
      throw updateError
    }

    // On an upgrade to a paid tier, grant that tier's tokens (valid 60 days),
    // mirroring the payment flow. Downgrades grant nothing — the user keeps
    // whatever unexpired tokens they already have.
    if (tier !== 'free' && !isDowngrade(previousTier, tier)) {
      const limits = SUBSCRIPTION_LIMITS[tier as SubscriptionTier]
      if (limits) {
        const aiGrant = await grantTokens(userId, 'ai_extraction', limits.aiExtractionLimit, 'admin')
        if (aiGrant.error) {
          console.error('[v0] Admin upgrade: failed to grant AI tokens:', aiGrant.error.message)
        }
        const docGrant = await grantTokens(userId, 'document_generation', limits.documentGenerationLimit, 'admin')
        if (docGrant.error) {
          console.error('[v0] Admin upgrade: failed to grant document tokens:', docGrant.error.message)
        }
      }
    }

    // Audit log (best-effort)
    await logAdminAction({
      adminId: check.user.id,
      action: tier === 'free' || isDowngrade(previousTier, tier)
        ? 'subscription_downgrade'
        : 'subscription_upgrade',
      targetUserId: userId,
      details: {
        from: previousTier,
        to: tier,
        targetEmail: current.email,
      },
    })

    // Send subscription change email (best-effort)
    try {
      await sendSubscriptionChangeEmail(
        current.email,
        updated.full_name || '',
        previousTier || 'free',
        tier
      )
    } catch (emailError) {
      console.error('[v0] Failed to send subscription change email:', emailError)
      // Don't fail the tier change if the email fails; just log it
    }

    return NextResponse.json({ user: updated })
  } catch (error) {
    console.error('[v0] Admin subscription change error:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    )
  }
}

function isDowngrade(from: string | null, to: string): boolean {
  const rank: Record<string, number> = { free: 0, pro: 1, premium: 2 }
  return (rank[to] ?? 0) < (rank[from ?? 'free'] ?? 0)
}
