import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/admin/service-client'
import { isDisposableEmail } from '@/lib/disposable-domains'
import { SESSION_COOKIE, sessionCookieOptions, signSession } from '@/lib/auth/session'
import { hashPassword, MIN_PASSWORD_LENGTH } from '@/lib/auth/password'
import { getClientIp, isSameOrigin, normalizeEmail } from '@/lib/auth/request'

/**
 * POST /api/auth/sign-up
 * Expects: { email, password }.
 *
 * 1. Rejects disposable email domains
 * 2. Enforces the IP signup limit (max 5 new accounts per 24h per IP)
 * 3. Creates the user (a DB trigger creates their profile + free tokens)
 * 4. Logs the signup IP and sets the session JWT cookie
 */
export async function POST(request: NextRequest) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const body = await request.json().catch(() => ({}))
    const email = normalizeEmail(body.email)
    const password = typeof body.password === 'string' ? body.password : ''

    if (!email) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
    }
    if (password.length < MIN_PASSWORD_LENGTH || password.length > 72) {
      return NextResponse.json(
        { error: `Password must be between ${MIN_PASSWORD_LENGTH} and 72 characters` },
        { status: 400 }
      )
    }

    if (await isDisposableEmail(email)) {
      return NextResponse.json(
        { error: 'This email domain is not allowed. Please use a personal or work email address.' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()
    const ip = getClientIp(request)

    if (ip !== 'unknown') {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { count, error: rateLimitError } = await admin
        .from('ip_signup_log')
        .select('id', { count: 'exact', head: true })
        .eq('ip_address', ip)
        .gt('created_at', cutoff)

      if (rateLimitError) {
        console.error('[v0] Rate limit check failed:', rateLimitError.message)
      } else if ((count ?? 0) >= 5) {
        return NextResponse.json(
          { error: 'Too many signup attempts from this IP. Please try again later or contact support.' },
          { status: 429 }
        )
      }
    }

    const { data: user, error: insertError } = await admin
      .from('app_users')
      .insert({ email, password_hash: await hashPassword(password) })
      .select('id, email, token_version')
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
      }
      console.error('[v0] Sign-up insert failed:', insertError.message)
      return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
    }

    if (ip !== 'unknown') {
      const { error: logError } = await admin.rpc('log_signup_by_ip', {
        p_ip_address: ip,
        p_user_id: user.id,
      })
      if (logError) console.warn('[v0] Failed to log signup IP:', logError.message)
    }

    const token = await signSession({ id: user.id, email: user.email }, user.token_version)
    const response = NextResponse.json({ success: true })
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions)
    return response
  } catch (error) {
    console.error('[v0] Sign-up error:', error instanceof Error ? error.message : String(error))
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
