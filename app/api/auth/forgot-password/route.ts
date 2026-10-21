import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { createAdminClient } from '@/lib/admin/service-client'
import { getClientIp, isSameOrigin, normalizeEmail } from '@/lib/auth/request'
import { authRateLimit } from '@/lib/auth/rate-limit'
import { sendPasswordResetEmail } from '@/lib/email/resend'

const RESET_TTL_MS = 60 * 60 * 1000

/**
 * POST /api/auth/forgot-password
 * Expects: { email }. Always answers with the same success response so it
 * can't be used to find out which emails have accounts.
 */
export async function POST(request: NextRequest) {
  const ok = NextResponse.json({ success: true })
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const body = await request.json().catch(() => ({}))
    const email = normalizeEmail(body.email)
    if (!email) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
    }

    const ip = getClientIp(request)
    const windowMs = 60 * 60 * 1000
    const allowed = (
      await Promise.all([
        authRateLimit(`reset:email:${email}`, 3, windowMs),
        authRateLimit(`reset:ip:${ip}`, 10, windowMs),
      ])
    ).every(Boolean)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many reset requests. Please try again later.' },
        { status: 429 }
      )
    }

    const admin = createAdminClient()
    const { data: user } = await admin.from('app_users').select('id, email').eq('email', email).maybeSingle()
    if (!user) return ok

    const token = randomBytes(32).toString('hex')
    const { error } = await admin.from('password_resets').insert({
      user_id: user.id,
      token_hash: createHash('sha256').update(token).digest('hex'),
      expires_at: new Date(Date.now() + RESET_TTL_MS).toISOString(),
    })
    if (error) {
      console.error('[v0] Password reset insert failed:', error.message)
      return ok
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin
    await sendPasswordResetEmail(user.email, `${baseUrl}/auth/reset-password?token=${token}`)
    return ok
  } catch (error) {
    console.error('[v0] Forgot-password error:', error instanceof Error ? error.message : String(error))
    return ok
  }
}
