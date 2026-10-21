import { cache } from 'react'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/admin/service-client'
import { SESSION_COOKIE, verifySession, type SessionUser } from '@/lib/auth/session'

/**
 * The logged-in user from the session cookie, or null.
 *
 * Beyond the JWT signature this confirms the account still exists and the
 * token hasn't been revoked (app_users.token_version bumped by logout or a
 * password change/reset). Memoised per request.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies()
  const claims = await verifySession(cookieStore.get(SESSION_COOKIE)?.value)
  if (!claims) return null

  const { data, error } = await createAdminClient()
    .from('app_users')
    .select('token_version')
    .eq('id', claims.id)
    .maybeSingle()

  if (error || !data || data.token_version !== claims.tokenVersion) return null
  return { id: claims.id, email: claims.email }
})

/** The raw session JWT, used as the Supabase access token. */
export async function getSessionToken(): Promise<string | undefined> {
  if (!(await getCurrentUser())) return undefined
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE)?.value
}
