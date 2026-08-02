import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/admin/service-client'

/**
 * POST /api/auth/log-signup
 * 
 * Called after successful Supabase signup to:
 * 1. Generate a verification token and send verification email
 * 2. Log the signup IP for multi-account tracking
 * 
 * Expects: { userId, email, ip }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, email, ip } = await request.json()

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Missing userId or email' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()

    // Generate a secure random verification token
    const verificationToken = crypto.getRandomValues(new Uint8Array(32))
      .reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '')

    // Store token in profiles
    const { error: updateError } = await admin
      .from('profiles')
      .update({
        verification_token: verificationToken,
        verification_sent_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (updateError) {
      console.error('[v0] Failed to store verification token:', updateError.message)
      return NextResponse.json(
        { error: 'Failed to prepare verification' },
        { status: 500 }
      )
    }

    // Log the signup IP (for abuse detection)
    if (ip && ip !== 'unknown') {
      const { error: logError } = await admin.rpc('log_signup_by_ip', {
        p_ip_address: ip,
        p_user_id: userId,
      })
      if (logError) {
        console.warn('[v0] Failed to log signup IP:', logError.message)
        // Don't fail the request for this
      }
    }

    // TODO: Send verification email via Resend
    // For now, just return the verification token (client can show a link)
    const verificationUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/verify-email?token=${verificationToken}`

    console.log('[v0] Signup prepared for:', email, 'token:', verificationToken.slice(0, 8) + '...')

    return NextResponse.json(
      {
        success: true,
        message: 'Verification email prepared',
        verificationUrl, // For development — remove in production
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Signup logging error:', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
