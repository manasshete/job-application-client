import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/admin/service-client'
import { getCurrentUser } from '@/lib/auth/server'
import { isSameOrigin } from '@/lib/auth/request'
import { SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth/session'

/**
 * DELETE /api/account — removes the signed-in user's account and everything
 * hanging off it (every table references app_users with ON DELETE CASCADE).
 *
 * Accounts with payment history are not deleted here: those are closed by the
 * support team so the payment records stay intact. The caller must send the
 * account email to confirm.
 */
export async function DELETE(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let confirmEmail: unknown
  try {
    confirmEmail = (await request.json())?.email
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  if (typeof confirmEmail !== 'string' || confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()) {
    return NextResponse.json({ error: 'The email does not match this account.' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { count, error: paymentsError } = await admin
    .from('payments')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
  if (paymentsError) {
    console.error('[account] payment lookup failed:', paymentsError.message)
    return NextResponse.json({ error: 'Could not delete the account. Please try again.' }, { status: 500 })
  }
  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: 'support', message: 'Accounts with payment history are closed by support.' }, { status: 409 })
  }

  const { error } = await admin.from('app_users').delete().eq('id', user.id)
  if (error) {
    console.error('[account] delete failed:', error.message)
    return NextResponse.json({ error: 'Could not delete the account. Please try again.' }, { status: 500 })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions, maxAge: 0 })
  return response
}
