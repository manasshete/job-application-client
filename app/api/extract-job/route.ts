import { generateText, Output } from 'ai'
import { z } from 'zod'
import { isValidUrl, isPublicUrl, MAX_LENGTHS } from '@/lib/validation'
import { rateLimit } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/data/profiles'
import { getTokenBalance, consumeToken } from '@/lib/data/tokens'

const jobDetailsSchema = z.object({
  company: z.string().nullable(),
  position: z.string().nullable(),
  location: z.string().nullable(),
  salary: z.string().nullable(),
  description: z.string().nullable(),
})

export async function POST(req: Request) {
  try {
    // Authentication check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check subscription limits
    const profile = await getProfile()
    
    if (!profile) {
      return Response.json({ error: 'Profile not found' }, { status: 404 })
    }

    const aiBalance = await getTokenBalance('ai_extraction')
    if (aiBalance <= 0) {
      return Response.json(
        { error: 'You have no AI extraction tokens left. Purchase or upgrade your plan to get more. Tokens are valid for 60 days from the date they are added.' },
        { status: 403 }
      )
    }

    // Rate limiting by user ID (more secure than IP)
    const rateLimitResult = rateLimit(`extract-job:${user.id}`, 10, 60000)
    
    if (!rateLimitResult.success) {
      return Response.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
          }
        }
      )
    }

    const { url } = await req.json()

    if (!url || typeof url !== 'string') {
      return Response.json({ error: 'URL is required' }, { status: 400 })
    }

    // Validate URL length
    if (url.length > MAX_LENGTHS.URL) {
      return Response.json({ error: 'URL too long' }, { status: 400 })
    }

    // Validate URL format and protocol
    if (!isValidUrl(url)) {
      return Response.json(
        { error: 'Invalid URL. Only HTTP and HTTPS URLs are allowed.' },
        { status: 400 }
      )
    }

    // Prevent SSRF attacks by blocking internal/private URLs
    if (!isPublicUrl(url)) {
      return Response.json(
        { error: 'Cannot access internal or private network URLs.' },
        { status: 400 }
      )
    }

    // Fetch the job posting HTML with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      signal: controller.signal,
      // Do not follow redirects: a public URL could otherwise 302-redirect to
      // an internal address (e.g. cloud metadata) and bypass the SSRF check.
      redirect: 'manual',
    }).finally(() => clearTimeout(timeoutId))

    // A redirect (3xx) is treated as a failure rather than silently followed.
    if (response.status >= 300 && response.status < 400) {
      return Response.json(
        { error: 'Job posting URL redirects are not supported.' },
        { status: 400 }
      )
    }

    if (!response.ok) {
      return Response.json(
        { error: 'Failed to fetch job posting' },
        { status: 400 }
      )
    }

    // Limit response size to prevent abuse
    const html = await response.text()
    if (html.length > 500000) {
      return Response.json(
        { error: 'Job posting content too large' },
        { status: 400 }
      )
    }

    // Use AI to extract job details
    try {
      const { output } = await generateText({
        model: 'openai/gpt-4o-mini',
        output: Output.object({
          schema: jobDetailsSchema,
        }),
        messages: [
          {
            role: 'user',
            content: `Extract job details from this HTML content. Return the company name, job position/title, location, salary range (if mentioned), and a brief description. Return null for any field that cannot be found.\n\nHTML:\n${html.slice(0, 15000)}`,
          },
        ],
      })

      // Consume one AI extraction token (oldest-expiring batch first)
      await consumeToken('ai_extraction')

      return Response.json(output)
    } catch {
      return Response.json(
        { error: 'AI extraction failed. Please try again or fill in manually.' },
        { status: 500 }
      )
    }
  } catch {
    return Response.json(
      { error: 'Failed to extract job details' },
      { status: 500 }
    )
  }
}
