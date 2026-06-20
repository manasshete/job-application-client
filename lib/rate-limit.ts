/**
 * Simple in-memory rate limiter.
 *
 * @warning BEST-EFFORT ONLY — state lives in the memory of a single
 * serverless function instance and resets on every cold start or scale-out.
 * In a multi-instance deployment this limit is per-instance, not global.
 *
 * The authoritative cost-abuse protection for AI routes is the per-user
 * subscription limit (`checkLimit`) stored in the database. This limiter
 * provides a secondary defence against burst abuse within a single instance.
 *
 * For strict distributed rate limiting that survives cold starts and scales
 * across instances, replace this implementation with Upstash Redis.
 */
interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

export function rateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(identifier)

  // Clean up expired entries periodically
  if (Math.random() < 0.01) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetTime) {
        rateLimitMap.delete(key)
      }
    }
  }

  if (!entry || now > entry.resetTime) {
    const resetTime = now + windowMs
    rateLimitMap.set(identifier, { count: 1, resetTime })
    return { success: true, remaining: limit - 1, resetTime }
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0, resetTime: entry.resetTime }
  }

  entry.count++
  return { success: true, remaining: limit - entry.count, resetTime: entry.resetTime }
}
