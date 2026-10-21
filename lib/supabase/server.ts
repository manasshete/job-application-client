import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getSessionToken } from '@/lib/auth/server'

/**
 * User-scoped Supabase client. Sends the app's session JWT as the access
 * token, so RLS sees auth.uid() = the logged-in user. Without a session it
 * acts as the anonymous role.
 *
 * Especially important if using Fluid compute: Don't put this client in a
 * global variable. Always create a new client within each function when using
 * it.
 */
export async function createClient() {
  const token = await getSessionToken()

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    {
      global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
      auth: { autoRefreshToken: false, persistSession: false },
    },
  )
}
