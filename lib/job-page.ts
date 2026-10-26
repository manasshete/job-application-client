import { isValidUrl } from '@/lib/validation'
import { isSafePublicUrl } from '@/lib/ssrf'

const MAX_REDIRECTS = 5
const MAX_BYTES = 3 * 1024 * 1024
const TIMEOUT_MS = 10000
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

export class JobPageError extends Error {}

/**
 * Server-only. Fetches a job posting's HTML. Redirects are followed by hand so
 * every hop goes through the SSRF check (a public URL could otherwise redirect
 * to an internal address such as cloud metadata). The body is capped at 3 MB.
 */
export async function fetchJobPage(url: string): Promise<string> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    let current = url
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      if (!isValidUrl(current) || !(await isSafePublicUrl(current))) {
        throw new JobPageError(hop === 0
          ? 'Cannot access internal or private network URLs.'
          : 'This link redirects to an address that cannot be accessed.')
      }

      const response = await fetch(current, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' },
        signal: controller.signal,
        redirect: 'manual',
      })

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location')
        if (!location) throw new JobPageError('Failed to fetch job posting')
        current = new URL(location, current).toString()
        continue
      }
      if (!response.ok) throw new JobPageError('Failed to fetch job posting')
      return await readCapped(response)
    }
    throw new JobPageError('This link redirects too many times.')
  } catch (error) {
    if (error instanceof JobPageError) throw error
    throw new JobPageError(controller.signal.aborted ? 'The job page took too long to load.' : 'Failed to fetch job posting')
  } finally {
    clearTimeout(timeoutId)
  }
}

async function readCapped(response: Response): Promise<string> {
  const declared = Number(response.headers.get('content-length') ?? 0)
  if (declared > MAX_BYTES) throw new JobPageError('Job posting content too large')
  if (!response.body) return ''

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > MAX_BYTES) {
      await reader.cancel()
      throw new JobPageError('Job posting content too large')
    }
    chunks.push(value)
  }
  return Buffer.concat(chunks).toString('utf8')
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === '#') {
      const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : match
    }
    return ENTITIES[code.toLowerCase()] ?? match
  })
}

function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<(script|style|noscript|svg|template|iframe|head)\b[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<br\s*\/?>|<\/(p|div|li|ul|ol|h[1-6]|tr|section|article|header|footer)>/gi, '\n')
      .replace(/<li\b[^>]*>/gi, '\n- ')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/[ \t\f\v\r]+/g, ' ')
    .replace(/ *\n[\n ]*/g, '\n')
    .trim()
}

/**
 * Turns a job page's HTML into compact text for the AI: JobPosting structured
 * data (most job boards include it), the title and meta description, then the
 * visible page text. Scripts, styles and markup are dropped, since raw HTML is
 * mostly noise and would crowd the job text out of the prompt.
 */
export function jobPageToText(html: string, maxChars = 20000): string {
  const parts: string[] = []

  for (const m of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    if (/JobPosting/i.test(m[1])) parts.push(`Structured data:\n${htmlToText(decodeEntities(m[1])).slice(0, 8000)}`)
  }

  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]
  if (title) parts.push(`Page title: ${decodeEntities(title).trim()}`)

  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const key = tag.match(/\b(?:property|name)=["']([^"']+)["']/i)?.[1]?.toLowerCase()
    const content = tag.match(/\bcontent=["']([^"']*)["']/i)?.[1]
    if (content && (key === 'og:title' || key === 'og:description' || key === 'description')) {
      parts.push(`${key}: ${decodeEntities(content).trim()}`)
    }
  }

  parts.push(`Page text:\n${htmlToText(html)}`)
  return parts.join('\n\n').slice(0, maxChars)
}
