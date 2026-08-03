import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/admin/service-client'

/**
 * POST /api/auth/log-signup
 *
 * Called after a successful Supabase signup to record the signup IP for
 * multi-account / abuse detection. Email confirmation itself is handled
 * natively by Supabase (see the emailRedirectTo -> /auth/callback flow).
 *
 * Expects: { userId, ip }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, ip } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    // Nothing to log without a usable IP — succeed quietly.
    if (!ip || ip === 'unknown') {
      return NextResponse.json({ success: true }, { status: 200 })
    }

    const admin = createAdminClient()
    const { error: logError } = await admin.rpc('log_signup_by_ip', {
      p_ip_address: ip,
      p_user_id: userId,
    })

    if (logError) {
      console.warn('[v0] Failed to log signup IP:', logError.message)
      // Don't fail the request — IP logging is best-effort.
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('[v0] Signup logging error:', error instanceof Error ? error.message : String(error))
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
