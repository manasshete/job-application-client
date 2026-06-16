import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/admin/service-client'
import type { User } from '@supabase/supabase-js'

export type AdminCheckResult =
  | { ok: true; user: User }
  | { ok: false; status: 401 | 403; error: string }

/**
 * Verifies the current request comes from an authenticated admin user.
 * Uses the user-scoped server client (respects the session cookie) to read
 * the session, then confirms the is_admin flag on their profile.
 *
 * Returns a discriminated union so callers can branch cleanly.
 */
export async function verifyAdmin(): Promise<AdminCheckResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { ok: false, status: 401, error: 'Authentication required' }
  }

  // Read the admin flag with the user-scoped client first (RLS allows reading own profile)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.is_admin) {
    return { ok: false, status: 403, error: 'Admin access required' }
  }

  return { ok: true, user }
}

/**
 * Records an admin action in the audit log using the service-role client.
 * Best-effort: failures are logged but never block the primary action.
 */
export async function logAdminAction(params: {
  adminId: string
  action: string
  targetUserId?: string | null
  details?: Record<string, unknown>
}): Promise<void> {
  try {
    const admin = createAdminClient()
    await admin.from('admin_logs').insert({
      admin_id: params.adminId,
      action: params.action,
      target_user_id: params.targetUserId ?? null,
      details: params.details ?? null,
    })
  } catch (error) {
    console.error('[v0] Failed to write admin audit log:', error)
  }
}
