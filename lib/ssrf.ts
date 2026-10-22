import { lookup } from 'node:dns/promises'
import { isPrivateIp, isPublicUrl } from '@/lib/validation'

/**
 * Server-only. Rejects URLs whose host is a private literal OR resolves (via
 * DNS) to a private/loopback address, e.g. localtest.me -> 127.0.0.1.
 * Redirects are not followed by callers, which closes the other common bypass.
 * A short window between this lookup and the fetch remains (DNS rebinding).
 */
export async function isSafePublicUrl(url: string): Promise<boolean> {
  if (!isPublicUrl(url)) return false
  const hostname = new URL(url).hostname.replace(/^\[|\]$/g, '')
  try {
    const addresses = await lookup(hostname, { all: true, verbatim: true })
    return addresses.length > 0 && addresses.every((a) => !isPrivateIp(a.address))
  } catch {
    return false
  }
}
