import { createAdminClient } from '@/lib/admin/service-client'
import { rateLimit } from '@/lib/rate-limit'

/**
 * Rate limit backed by Postgres (public.check_rate_limit) so it holds across
 * serverless instances. Falls back to the in-memory limiter if the DB call
 * fails, so an outage degrades protection instead of blocking logins.
 */
export async function authRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  try {
    const { data, error } = await createAdminClient().rpc('check_rate_limit', {
      p_key: key,
      p_limit: limit,
      p_window_seconds: Math.ceil(windowMs / 1000),
    })
    if (error) throw error
    return data === true
  } catch (error) {
    console.warn('[v0] DB rate limit unavailable, using in-memory fallback:', error instanceof Error ? error.message : error)
    return rateLimit(key, limit, windowMs).success
  }
}
