import { generateText, Output } from 'ai'
import { z } from 'zod'
import { isValidUrl, isPublicUrl, MAX_LENGTHS } from '@/lib/validation'
import { rateLimit } from '@/lib/rate-limit'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getProfile, incrementAIExtractionCount } from '@/lib/data/profiles'
import { checkLimit } from '@/lib/subscription'

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
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check subscription limits
    const profile = await getProfile()
    if (!profile) {
      return Response.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (!checkLimit(profile.subscription_tier, profile.ai_extractions_used, 'aiExtractionLimit')) {
      return Response.json(
        { error: 'AI extraction limit reached. Please upgrade your plan.' },
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
    }).finally(() => clearTimeout(timeoutId))

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
    const result = await generateText({
      model: 'openai/gpt-4o-mini',
      output: Output.object({
        schema: jobDetailsSchema,
      }),
      messages: [
        {
          role: 'system',
          content:
            'You are a job posting analyzer. Extract the following information from the HTML content: company name, job position/title, location, salary range (if mentioned), and a brief description. Return null for any field that cannot be found.',
        },
        {
          role: 'user',
          content: `Extract job details from this HTML:\n\n${html.slice(0, 15000)}`,
        },
      ],
    })

    // Increment AI extraction count
    await incrementAIExtractionCount()

    return Response.json(result.output)
  } catch (error) {
    console.error('[v0] Job extraction error:', error)
    return Response.json(
      { error: 'Failed to extract job details' },
      { status: 500 }
    )
  }
}
