import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/admin/service-client'
import { SESSION_COOKIE, sessionCookieOptions, signSession } from '@/lib/auth/session'
import { verifyPassword } from '@/lib/auth/password'
import { getClientIp, isSameOrigin, normalizeEmail, readAuthBody } from '@/lib/auth/request'
import { authRateLimit } from '@/lib/auth/rate-limit'

/**
 * POST /api/auth/login
 * Expects: { email, password }. On success sets the httpOnly session JWT cookie.
 */
export async function POST(request: NextRequest) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const body = await readAuthBody(request)
    const email = normalizeEmail(body.email)
    const password = typeof body.password === 'string' ? body.password : ''

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const ip = getClientIp(request)
    const windowMs = 15 * 60 * 1000
    const allowed = (
      await Promise.all([
        authRateLimit(`login:ip-email:${ip}:${email}`, 10, windowMs),
        authRateLimit(`login:email:${email}`, 20, windowMs),
        authRateLimit(`login:ip:${ip}`, 50, windowMs),
      ])
    ).every(Boolean)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again in a few minutes.' },
        { status: 429 }
      )
    }

    const admin = createAdminClient()
    const { data: user, error } = await admin
      .from('app_users')
      .select('id, email, password_hash, token_version')
      .eq('email', email)
      .maybeSingle()

    if (error) {
      console.error('[v0] Login lookup failed:', error.message)
      return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
    }

    if (!(await verifyPassword(password, user?.password_hash)) || !user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const token = await signSession({ id: user.id, email: user.email }, user.token_version)
    const response = NextResponse.json({ success: true })
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions)
    return response
  } catch (error) {
    console.error('[v0] Login error:', error instanceof Error ? error.message : String(error))
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
