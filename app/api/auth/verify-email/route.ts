import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/admin/service-client'

const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * GET /api/auth/verify-email?token=<hex>
 *
 * Validates the verification token stored in app_users, marks the user
 * as email_verified = true, then redirects:
 *   - Success → /auth/verify-email?verified=1
 *   - Invalid / expired → /auth/verify-email?error=invalid_token
 */
export async function GET(request: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const token = request.nextUrl.searchParams.get('token')

  if (!token || !/^[0-9a-f]{64}$/.test(token)) {
    return NextResponse.redirect(`${siteUrl}/auth/verify-email?error=invalid_token`)
  }

  try {
    const admin = createAdminClient()

    // Look up the user by token
    const { data: user, error: lookupError } = await admin
      .from('app_users')
      .select('id, email_verified, verification_sent_at')
      .eq('email_verification_token', token)
      .maybeSingle()

    if (lookupError) {
      console.error('[v0] verify-email lookup error:', lookupError.message)
      return NextResponse.redirect(`${siteUrl}/auth/verify-email?error=server_error`)
    }

    if (!user) {
      return NextResponse.redirect(`${siteUrl}/auth/verify-email?error=invalid_token`)
    }

    // Check expiry (24h window)
    if (user.verification_sent_at) {
      const sentAt = new Date(user.verification_sent_at).getTime()
      if (Date.now() - sentAt > TOKEN_EXPIRY_MS) {
        return NextResponse.redirect(`${siteUrl}/auth/verify-email?error=expired_token`)
      }
    }

    // Already verified — still redirect to success so the user isn't confused
    if (user.email_verified) {
      return NextResponse.redirect(`${siteUrl}/auth/verify-email?verified=1`)
    }

    // Mark verified, clear token
    const { error: updateError } = await admin
      .from('app_users')
      .update({
        email_verified: true,
        email_verification_token: null,
        verification_sent_at: null,
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('[v0] verify-email update error:', updateError.message)
      return NextResponse.redirect(`${siteUrl}/auth/verify-email?error=server_error`)
    }

    return NextResponse.redirect(`${siteUrl}/auth/verify-email?verified=1`)
  } catch (error) {
    console.error('[v0] verify-email error:', error instanceof Error ? error.message : String(error))
    return NextResponse.redirect(`${siteUrl}/auth/verify-email?error=server_error`)
  }
}
