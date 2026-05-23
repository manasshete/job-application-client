import { sendConfirmationEmail } from '@/lib/email/resend'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Verify the request is from Supabase
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (token !== process.env.SUPABASE_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
