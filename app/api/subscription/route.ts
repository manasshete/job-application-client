import { getCurrentUser } from '@/lib/auth/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/admin/service-client'
import { sendSubscriptionCancellationEmail, sendSubscriptionReactivationEmail } from '@/lib/email/subscription-emails'

export const dynamic = 'force-dynamic'

// Valid actions a user may perform on their OWN subscription.
// Note: this endpoint never changes subscription_tier — it only toggles the
// status. Tier changes go through billing (Stripe) / the admin tools, so a
// user cannot self-upgrade to a paid plan by calling this route.
const VALID_ACTIONS = ['cancel', 'reactivate'] as const
type Action = (typeof VALID_ACTIONS)[number]

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

    const action = (body as { action?: unknown })?.action
    if (typeof action !== 'string' || !VALID_ACTIONS.includes(action as Action)) {
      return NextResponse.json(
        { error: 'Invalid action. Expected "cancel" or "reactivate".' },
        { status: 400 }
      )
    }

    // Read the user's current tier so we can guard the transition.
    const { data: profile, error: readError } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_status, full_name')
      .eq('id', user.id)
      .single()

    if (readError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Free tier has nothing to cancel or reactivate.
    if (profile.subscription_tier === 'free') {
      return NextResponse.json(
        { error: 'No active paid subscription to modify.' },
        { status: 400 }
      )
    }

    const newStatus = action === 'cancel' ? 'cancelled' : 'active'

    // Use the service-role client for the write so it is never blocked by
    // RLS edge cases. The user's identity has already been verified above —
    // we always scope the update to their exact user.id.
    const adminClient = createAdminClient()
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({ subscription_status: newStatus })
      .eq('id', user.id)

    if (updateError) {
      console.error('[v0] Error updating subscription status:', updateError.message, updateError.details)
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
    }

    // Send confirmation email (best-effort — don't fail the request if email fails)
    try {
      if (action === 'cancel') {
        await sendSubscriptionCancellationEmail(user.email || '', profile.full_name || '', profile.subscription_tier)
      } else {
        await sendSubscriptionReactivationEmail(user.email || '', profile.full_name || '', profile.subscription_tier)
      }
    } catch (emailError) {
      console.error('[v0] Failed to send subscription status email:', emailError)
      // Don't fail the request if email fails — the subscription status was already updated
    }

    return NextResponse.json({ success: true, subscription_status: newStatus })
  } catch (error) {
    console.error('[v0] Subscription route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
