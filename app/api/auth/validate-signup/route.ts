import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/admin/service-client'

/**
 * POST /api/auth/validate-signup
 * 
 * Validates signup before Supabase Auth creates the user:
 * 1. Check email against disposable domain blocklist
 * 2. Check IP signup rate limit (max 5 signups per 24h per IP)
 * 3. Log the signup IP for tracking multi-account abuse patterns
 * 
 * Returns { valid: boolean, error?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { valid: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    // Get client IP (handles proxies: CF, nginx, etc.)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'

    const admin = createAdminClient()

    // 1. Check if email domain is disposable
    console.log('[v0] Checking disposable email:', email)
    const { data: isDisposable, error: disposableError } = await admin.rpc(
      'is_disposable_email',
      { p_email: email }
    )

    if (disposableError) {
      console.error('[v0] Disposable email check failed:', disposableError.message)
      // Soft fail — allow signup but log it
    } else if (isDisposable) {
      console.warn('[v0] Rejected disposable email:', email)
      return NextResponse.json(
        {
          valid: false,
          error: 'This email domain is not allowed. Please use a personal or work email address.',
        },
        { status: 400 }
      )
    }

    // 2. Check IP-based rate limit (max 5 new accounts per 24h per IP)
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: recentSignups, error: rateLimitError } = await admin
      .from('ip_signup_log')
      .select('id', { count: 'exact' })
      .eq('ip_address', ip)
      .gt('created_at', cutoff)

    if (rateLimitError) {
      console.error('[v0] Rate limit check failed:', rateLimitError.message)
      // Soft fail
    } else if (recentSignups && recentSignups.length >= 5) {
      console.warn('[v0] IP rate limit exceeded:', ip, 'signups:', recentSignups.length)
      return NextResponse.json(
        {
          valid: false,
          error: 'Too many signup attempts from this IP. Please try again later or contact support.',
        },
        { status: 429 }
      )
    }

    // Validation passed
    return NextResponse.json(
      { valid: true, ip }, // Return IP so client can pass it to post-signup logging
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Signup validation error:', error instanceof Error ? error.message : String(error))
    // Soft fail — don't block signup on unexpected errors
    return NextResponse.json(
      { valid: true },
      { status: 200 }
    )
  }
}
