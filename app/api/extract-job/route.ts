import { getCurrentUser } from '@/lib/auth/server'
import { extractionModel } from '@/lib/ai'
import { generateText, Output } from 'ai'
import { z } from 'zod'
import { isValidUrl, MAX_LENGTHS } from '@/lib/validation'
import { isSafePublicUrl } from '@/lib/ssrf'
import { fetchJobPage, jobPageToText, JobPageError, needsBrowser } from '@/lib/job-page'
import { rateLimit } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/data/profiles'
import { getTokenBalance, consumeToken, refundToken } from '@/lib/data/tokens'

const jobDetailsSchema = z.object({
  company: z.string().nullable(),
  position: z.string().nullable(),
  location: z.string().nullable(),
  salary: z.string().nullable(),
  description: z.string().nullable(),
  requirements: z.array(z.string()).nullable(),
})

const MAX_PASTED_CHARS = 20000

export async function POST(req: Request) {
  try {
    // Authentication check
    const supabase = await createClient()
    const user = await getCurrentUser()
    
    if (!user) {
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

    const { url, text } = await req.json()

    let pageText: string
    if (typeof text === 'string' && text.trim()) {
      // Text copied from the posting, for sites that block automatic reading.
      pageText = text.trim().slice(0, MAX_PASTED_CHARS)
      if (pageText.length < 200) {
        return Response.json(
          { error: 'That\'s too short to be a full posting. Copy the whole job description and try again.' },
          { status: 422 }
        )
      }
    } else {
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
      if (!(await isSafePublicUrl(url))) {
        return Response.json(
          { error: 'Cannot access internal or private network URLs.' },
          { status: 400 }
        )
      }

      // Fetch the job posting (redirects are followed with an SSRF check on every hop)
      try {
        let html = await fetchJobPage(url)

        // Pages built by JavaScript have no job text in their HTML, so load them in a browser.
        // Tighter limit than above: this runs before a token is charged and costs far more than a fetch.
        if (needsBrowser(html)) {
          const browserLimit = rateLimit(`extract-job-browser:${user.id}`, 3, 60000)
          if (!browserLimit.success) {
            return Response.json(
              { error: 'Too many requests. Please try again in a minute.' },
              {
                status: 429,
                headers: { 'Retry-After': Math.ceil((browserLimit.resetTime - Date.now()) / 1000).toString() },
              }
            )
          }
          const { renderJobPage } = await import('@/lib/job-page-browser')
          html = await renderJobPage(url, req.signal)
        }

        pageText = jobPageToText(html)
      } catch (error) {
        if (error instanceof JobPageError) {
          return Response.json({ error: error.message }, { status: 400 })
        }
        throw error
      }

      // Checked before reserving a token so the user isn't charged.
      if (pageText.length < 200) {
        return Response.json(
          { error: 'Could not read job details from this page. Try the job board\'s own link (e.g. Greenhouse, Lever, LinkedIn) or fill in the details manually.' },
          { status: 422 }
        )
      }
    }

    // Use AI to extract job details
    // Reserve the token atomically just before the AI call (not after), so parallel
    // requests can't all pass the balance check. Refunded below if extraction fails.
    if (!(await consumeToken('ai_extraction'))) {
      return Response.json(
        { error: 'You have no AI extraction tokens left. Purchase or upgrade your plan to get more. Tokens are valid for 60 days from the date they are added.' },
        { status: 403 }
      )
    }

    try {
      const { output } = await generateText({
        model: extractionModel,
        // Stops the AI call when the user cancels, so the catch below refunds their token.
        abortSignal: req.signal,
        output: Output.object({
          schema: jobDetailsSchema,
        }),
        messages: [
          {
            role: 'user',
            content: `Extract job details from this job posting. Return the company name, job position/title, location, salary range (if mentioned), a brief description, and up to 10 key requirements (short skill or qualification names such as "React" or "3+ years experience", not sentences). Return null for any field that cannot be found.\n\n${pageText}`,
          },
        ],
      })

      return Response.json(output)
    } catch (error) {
      await refundToken(user.id, 'ai_extraction')
      console.error('[extract-job] AI extraction failed:', error)
      return Response.json(
        { error: 'AI extraction failed. Please try again or fill in manually.' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[extract-job] Unexpected error:', error)
    return Response.json(
      { error: 'Failed to extract job details' },
      { status: 500 }
    )
  }
}
