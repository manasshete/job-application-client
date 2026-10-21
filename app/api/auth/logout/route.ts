import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/admin/service-client'
import { getCurrentUser } from '@/lib/auth/server'
import { isSameOrigin } from '@/lib/auth/request'
import { SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth/session'

/**
 * POST /api/auth/logout — clears the session cookie and revokes the user's
 * sessions server-side (bumping token_version invalidates every issued JWT).
 */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const user = await getCurrentUser()
  if (user) {
    const admin = createAdminClient()
    const { data } = await admin.from('app_users').select('token_version').eq('id', user.id).single()
    if (data) {
      await admin.from('app_users').update({ token_version: data.token_version + 1 }).eq('id', user.id)
    }
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions, maxAge: 0 })
  return response
}
