import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createAdminClient } from '@/lib/admin/service-client'
import { hashPassword, MIN_PASSWORD_LENGTH } from '@/lib/auth/password'
import { getClientIp, isSameOrigin, readAuthBody } from '@/lib/auth/request'
import { authRateLimit } from '@/lib/auth/rate-limit'

/**
 * POST /api/auth/reset-password
 * Expects: { token, password }. The token is single-use and expires after an
 * hour. Success bumps token_version, signing the user out everywhere; they log
 * in again with the new password.
 */
export async function POST(request: NextRequest) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const body = await readAuthBody(request)
    const token = typeof body.token === 'string' ? body.token : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!/^[0-9a-f]{64}$/.test(token)) {
      return NextResponse.json({ error: 'This reset link is invalid or has expired' }, { status: 400 })
    }
    if (password.length < MIN_PASSWORD_LENGTH || password.length > 72) {
      return NextResponse.json(
        { error: `Password must be between ${MIN_PASSWORD_LENGTH} and 72 characters` },
        { status: 400 }
      )
    }

    if (!(await authRateLimit(`reset-submit:ip:${getClientIp(request)}`, 20, 60 * 60 * 1000))) {
      return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 })
    }

    const admin = createAdminClient()
    // Claim the token atomically so it can only ever be used once
    const { data: reset } = await admin
      .from('password_resets')
      .update({ used_at: new Date().toISOString() })
      .eq('token_hash', createHash('sha256').update(token).digest('hex'))
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .select('user_id')
      .maybeSingle()

    if (!reset) {
      return NextResponse.json({ error: 'This reset link is invalid or has expired' }, { status: 400 })
    }

    const { data: user } = await admin.from('app_users').select('token_version').eq('id', reset.user_id).single()
    const { error } = await admin
      .from('app_users')
      .update({
        password_hash: await hashPassword(password),
        token_version: (user?.token_version ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reset.user_id)

    if (error) {
      console.error('[v0] Password reset update failed:', error.message)
      return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
    }

    // Any other outstanding reset links for this user are now void
    await admin.from('password_resets').delete().eq('user_id', reset.user_id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Reset-password error:', error instanceof Error ? error.message : String(error))
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
