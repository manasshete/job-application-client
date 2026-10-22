// Simple HTML escape function - works in all environments without jsdom
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  }
  return text.replace(/[&<>"'/]/g, (char) => map[char] || char)
}

// Sanitize user input to prevent XSS - strips all HTML tags
export function sanitizeInput(input: string): string {
  // Remove all HTML tags and escape special characters
  const stripped = input.replace(/<[^>]*>/g, '')
  return escapeHtml(stripped)
}

// Reverse escapeHtml() for the specific entities it produces. Some URLs were
// previously stored HTML-escaped (e.g. "https:&#x2F;&#x2F;site.com&amp;a=1"),
// which breaks links. This restores them to a usable URL.
export function unescapeHtmlEntities(text: string): string {
  return text
    .replace(/&#x2F;/gi, '/')
    .replace(/&#x27;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
}

// Build a safe href for an external link: un-escape any legacy HTML-escaped
// URL data, then guarantee an absolute http(s) URL.
export function toSafeHref(url: string | null | undefined): string {
  if (!url) return ''
  const clean = unescapeHtmlEntities(url).trim()
  return /^https?:\/\//i.test(clean) ? clean : `https://${clean}`
}

// Validate URL is safe (no javascript:, data:, file: protocols)
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const allowedProtocols = ['http:', 'https:']
    return allowedProtocols.includes(parsed.protocol)
  } catch {
    return false
  }
}

// True if an IP literal (v4, or v6 without brackets) is loopback, private,
// link-local, CGNAT, multicast, reserved or otherwise not publicly routable.
export function isPrivateIp(ip: string): boolean {
  const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ip)
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])]
    return (
      a === 0 || a === 10 || a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    )
  }
  const v6 = ip.toLowerCase()
  if (!v6.includes(':')) return false
  if (v6 === '::' || v6 === '::1') return true
  // IPv4-mapped (::ffff:a.b.c.d, or ::ffff:XXXX:XXXX after URL normalisation)
  const mapped = /^::ffff:(?:(\d+\.\d+\.\d+\.\d+)|([0-9a-f]{1,4}):([0-9a-f]{1,4}))$/.exec(v6)
  if (mapped) {
    if (mapped[1]) return isPrivateIp(mapped[1])
    const hi = parseInt(mapped[2], 16)
    const lo = parseInt(mapped[3], 16)
    return isPrivateIp(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`)
  }
  return /^f[cd]/.test(v6) || /^fe[89ab]/.test(v6) || /^ff/.test(v6)
}

// Validate URL is not pointing to internal/private networks (literal hosts only;
// see lib/ssrf.ts for the DNS-resolution check used by server routes).
export function isPublicUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    // IPv6 hostnames come back wrapped in brackets, e.g. "[::1]".
    const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '')
    if (!hostname) return false

    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname === 'metadata.google.internal'
    ) {
      return false
    }
    return !isPrivateIp(hostname)
  } catch {
    return false
  }
}

// Validate input length
export function validateLength(input: string, maxLength: number): boolean {
  return input.length <= maxLength
}

// Input length constants
export const MAX_LENGTHS = {
  COMPANY: 200,
  POSITION: 200,
  LOCATION: 200,
  SALARY: 100,
  NOTES: 5000,
  URL: 2000,
} as const
