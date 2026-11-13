import { lookup } from 'node:dns/promises'
import { isPrivateIp, isPublicUrl } from '@/lib/validation'

/**
 * Server-only. Returns the IP a URL's host resolves to, or null if the host is
 * a private literal or ANY of its addresses is private/loopback, e.g.
 * localtest.me -> 127.0.0.1. Connecting to the returned IP (rather than looking
 * the name up again) closes the DNS rebinding window.
 */
export async function resolvePublicAddress(url: string): Promise<string | null> {
  if (!isPublicUrl(url)) return null
  const hostname = new URL(url).hostname.replace(/^\[|\]$/g, '')
  try {
    const addresses = await lookup(hostname, { all: true, verbatim: true })
    if (addresses.length === 0 || addresses.some((a) => isPrivateIp(a.address))) return null
    // Hosts often list IPv6 first, but not every network can reach it.
    return (addresses.find((a) => a.family === 4) ?? addresses[0]).address
  } catch {
    return null
  }
}

/**
 * Server-only. Same check for callers that fetch by hostname and do not follow
 * redirects. A short window between this lookup and the fetch remains (DNS rebinding).
 */
export async function isSafePublicUrl(url: string): Promise<boolean> {
  return (await resolvePublicAddress(url)) !== null
}
