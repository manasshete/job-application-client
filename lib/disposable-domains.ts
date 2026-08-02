/**
 * Disposable email domain blocklist.
 *
 * Strategy: fetch the full 60,000+ domain list from GitHub on first use,
 * cache it in Node.js module memory for the lifetime of the server instance.
 * No database writes, no cron jobs, no monthly cost — just one HTTP GET.
 *
 * Source: https://github.com/tompec/disposable-email-domains
 *
 * The ~90 domain hardcoded set below is the fallback used when:
 *   - The GitHub fetch fails (network error, rate limit, etc.)
 *   - The server is in local development without internet access
 */

const GITHUB_URL =
  'https://raw.githubusercontent.com/tompec/disposable-email-domains/main/index.json'

// Module-level cache — shared across all requests on the same server instance
let cachedSet: Set<string> | null = null
let fetchPromise: Promise<Set<string>> | null = null

async function fetchRemoteList(): Promise<Set<string>> {
  try {
    const res = await fetch(GITHUB_URL, {
      next: { revalidate: 86400 }, // Next.js cache: refresh at most once per day
    })
    if (!res.ok) throw new Error(`GitHub responded ${res.status}`)
    const domains: string[] = await res.json()
    const set = new Set([...domains.map((d) => d.toLowerCase()), ...FALLBACK_DOMAINS])
    console.log(`[v0] Disposable domain list loaded: ${set.size} domains`)
    return set
  } catch (err) {
    console.warn('[v0] Failed to fetch remote disposable list, using fallback:', err)
    return new Set(FALLBACK_DOMAINS)
  }
}

/** Returns the cached Set, fetching from GitHub if not yet loaded. */
async function getDisposableSet(): Promise<Set<string>> {
  if (cachedSet) return cachedSet

  // Deduplicate concurrent requests — only one fetch in flight at a time
  if (!fetchPromise) {
    fetchPromise = fetchRemoteList().then((set) => {
      cachedSet = set
      fetchPromise = null
      return set
    })
  }

  return fetchPromise
}

/**
 * Check if an email is from a known disposable domain.
 * Async — waits for the remote list on first call, instant thereafter.
 */
export async function isDisposableEmail(email: string): Promise<boolean> {
  const domain = email.toLowerCase().split('@')[1]
  if (!domain) return false
  const set = await getDisposableSet()
  return set.has(domain)
}

// ─── Fallback hardcoded list (~90 domains) ────────────────────────────────────

const FALLBACK_DOMAINS = [
  // 10 Minute Mail variants
  '10minutemail.com',
  '10minemail.com',
  
  // Guerrilla Mail variants
  'guerrillamail.com',
  'guerrillamail.co.uk',
  'guerrillamail.us',
  
  // Temp Mail variants (all domains)
  'temp-mail.org',
  'tempmailo.com',
  'tempmail.com',
  'tempmail.dev',
  'tempmail.lol',
  'tempmail.ninja',
  'tempmail.plus',
  'tempmail.it',
  'tempmail.id',
  'tempmail365.com',
  'tempmailgen.com',
  'tempmails.com',
  'tempmailpro.com',
  'tempmailnow.com',
  'tempmailx.com',
  'tempmailworld.com',
  'tempmailbest.com',
  'tempmaildemo.com',
  'tempmail100.com',
  'tempmailsite.com',
  'tempmailopen.com',
  'tempmail.adguard.com',
  'temp-mail.io',
  
  // TempEmail variants
  'tempemail.co',
  'tempemail.net',
  'tempemailaddress.com',
  'tempemailgenerator.org',
  'tempemailplus.com',
  'tempemailworld.com',
  
  // TempInbox / TempBox variants
  'tempinbox.com',
  'tempinbox.net',
  'tempail.com',
  'tempboxmail.com',
  'tempmailhub.org',
  'emailtemp.org',
  
  // Classic services
  'mailinator.com',
  'maildrop.cc',
  'yopmail.com',
  'fakemail.net',
  'throwawaymail.com',
  'emailondeck.com',
  'mohmal.com',
  'minuteinbox.com',
  
  // Disposable mail services
  'disposablemail.com',
  'emailfake.com',
  
  // Nada / GetNada variants
  'getnada.com',
  'nada.email',
  'inboxes.com',
  
  // Mail catch services
  'mail.tm',
  'mail7.io',
  'mail.cx',
  'mailcatch.com',
  'mailnesia.com',
  'mytemp.email',
  'mailsac.com',
  'mailpoof.com',
  
  // Trash mail services
  'trashmail.com',
  'trashmail.net',
  
  // Catch-all / forwarding
  '33mail.com',
  'spamgourmet.com',
  'bulc.club',
  'erine.email',
  'dropmail.me',
  'tmailor.com',
  'smailpro.com',
  
  // Privacy-focused email masking
  'addy.io',
  'relay.firefox.com',
  'simplelogin.io',
  'duckduckgo.com',
  'burnermail.io',
  'internxt.com',
  
  // Other disposable services
  'sharklasers.com',
  'spam4.me',
  'mailtrap.io',
  'catch-all.com',
  'bukemoldova.com',
  'clownmail.com',
  'flumpus.com',
  
  // Development / testing
  'example.com',
  'test.com',
  'localhost',
  '0.0.0.0',
]
