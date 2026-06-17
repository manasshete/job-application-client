import { sendConfirmationEmail } from '@/lib/email/resend'
import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'

export const dynamic = 'force-dynamic'

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

export async function POST(req: NextRequest) {
  try {
    // Fail closed: if the webhook secret isn't configured, reject everything
    // instead of accidentally allowing unauthenticated requests through.
    const expectedSecret = process.env.SUPABASE_WEBHOOK_SECRET
    if (!expectedSecret) {
      console.error('[v0] SUPABASE_WEBHOOK_SECRET is not configured; rejecting webhook.')
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
    }

    const token = req.headers.get('authorization')?.replace('Bearer ', '') ?? ''
    if (!token || !safeEqual(token, expectedSecret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // Handle different Supabase email events
    if (body.type === 'token_refresh' && body.email) {
      // This is sent when user signs up or needs email verification
      const confirmationUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?token_hash=${body.token_hash}&type=email_verification`

      await sendConfirmationEmail(body.email, confirmationUrl)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Email hook error:', error)
    return NextResponse.json({ error: 'Email sending failed' }, { status: 500 })
  }
}
