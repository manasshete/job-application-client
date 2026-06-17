// Simple in-memory rate limiter.
//
// LIMITATION: state lives in the memory of a single serverless instance, so
// limits are per-instance and reset on cold start. This is a best-effort
// throttle to curb casual abuse — it is NOT a hard guarantee across a scaled,
// multi-instance deployment. The authoritative protection against cost abuse
// is the per-user subscription limit (checkLimit) enforced on a value stored
// in the database. For strict distributed rate limiting, back this with
// Upstash Redis.
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
