import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    const {
      data: { user },
    } = await supabase.auth.getUser()

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
      .select('subscription_tier, subscription_status')
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

    // Scoped to the authenticated user only — RLS also enforces this.
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ subscription_status: newStatus })
      .eq('id', user.id)

    if (updateError) {
      console.error('[v0] Error updating subscription status:', updateError)
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
    }

    return NextResponse.json({ success: true, subscription_status: newStatus })
  } catch (error) {
    console.error('[v0] Subscription route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
