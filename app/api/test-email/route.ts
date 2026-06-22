import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email address required' }, { status: 400 })
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY not configured' },
        { status: 500 }
      )
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    const { data, error } = await resend.emails.send({
      from: 'Pursuitz <noreply@pursuitz.co>',
      to: email,
      subject: 'Test Email from Pursuitz',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Test Email</title>
          </head>
          <body style="font-family: sans-serif; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #3b82f6;">Test Email from Pursuitz</h1>
              <p>Hi there!</p>
              <p>This is a test email to verify that your Pursuitz email configuration is working correctly.</p>
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Email Details:</strong></p>
                <ul>
                  <li>From: Pursuitz &lt;noreply@pursuitz.co&gt;</li>
                  <li>Domain: pursuitz.co</li>
                  <li>Sent via: Resend</li>
                  <li>Timestamp: ${new Date().toISOString()}</li>
                </ul>
              </div>
              <p>If you received this email, your Resend integration and domain setup is working perfectly!</p>
              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                © 2026 Pursuitz. All rights reserved.
              </p>
            </div>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error('[test-email] Resend error:', error)
      return NextResponse.json(
        { error: 'Failed to send test email', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${email}`,
      resendId: data?.id,
    })
  } catch (error) {
    console.error('[test-email] Error:', error)
    return NextResponse.json(
      { error: 'Failed to send test email', details: String(error) },
      { status: 500 }
    )
  }
}
