import type { NextRequest } from 'next/server'

/**
 * Client IP from headers the platform sets itself. A client can put anything
 * in the left side of X-Forwarded-For, so never trust the first entry; the
 * last one is appended by the nearest proxy.
 */
export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',').pop()?.trim()
  return (
    request.headers.get('x-vercel-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    forwardedFor ||
    'unknown'
  )
}

/**
 * CSRF guard for cookie-authenticated POSTs: browsers always send Origin on
 * cross-site requests, so reject when it doesn't match this host.
 */
export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return true
  try {
    return new URL(origin).host === request.headers.get('host')
  } catch {
    return false
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeEmail(email: unknown): string | null {
  if (typeof email !== 'string') return null
  const trimmed = email.trim().toLowerCase()
  return trimmed.length <= 254 && EMAIL_RE.test(trimmed) ? trimmed : null
}

const MAX_AUTH_BODY_BYTES = 16 * 1024

/**
 * Parses a small JSON body for auth endpoints. Oversized or malformed bodies
 * yield an empty object so callers fall through to their normal validation
 * errors, without buffering megabytes of attacker-controlled input.
 */
export async function readAuthBody(request: NextRequest): Promise<Record<string, unknown>> {
  const declared = Number(request.headers.get('content-length') ?? 0)
  if (declared > MAX_AUTH_BODY_BYTES) return {}
  try {
    const text = await request.text()
    if (text.length > MAX_AUTH_BODY_BYTES) return {}
    const parsed = JSON.parse(text)
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}
