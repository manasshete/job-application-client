import { Resend } from 'resend'

/** Escape user-supplied strings before embedding them in HTML email bodies. */
function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

let resendInstance: Resend | null = null

function getResend(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error(
        'Resend is not configured. Please set the RESEND_API_KEY environment variable.'
      )
    }
    resendInstance = new Resend(apiKey)
  }
  return resendInstance
}

export async function sendConfirmationEmail(email: string, confirmationUrl: string) {
  try {
    await getResend().emails.send({
      from: 'Pursuitz <noreply@pursuitz.co>',
      to: email,
      subject: 'Confirm your Pursuitz account',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #999; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to Pursuitz</h1>
              </div>
              <div class="content">
                <p>Hi there,</p>
                <p>Thanks for signing up! Click the button below to confirm your email and start tracking your job applications.</p>
                <a href="${esc(confirmationUrl)}" class="button">Confirm Email</a>
                <p style="color: #666; font-size: 14px;">Or copy and paste this link: ${esc(confirmationUrl)}</p>
                <p>This link expires in 24 hours.</p>
              </div>
              <div class="footer">
                <p>© 2026 Pursuitz. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    })
  } catch (error) {
    console.error('Failed to send confirmation email:', error)
    throw error
  }
}

export async function sendInterviewReminder(email: string, jobTitle: string, company: string, interviewDate: string) {
  try {
    await getResend().emails.send({
      from: 'Pursuitz <noreply@pursuitz.co>',
      to: email,
      subject: `Reminder: Interview with ${esc(company)}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
              .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #999; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>Interview Reminder</h2>
              </div>
              <div class="content">
                <p>Hi there,</p>
                <div class="alert">
                  <p><strong>You have an upcoming interview!</strong></p>
                  <p><strong>Company:</strong> ${esc(company)}</p>
                  <p><strong>Position:</strong> ${esc(jobTitle)}</p>
                  <p><strong>Date:</strong> ${esc(interviewDate)}</p>
                </div>
                <p>Make sure you're prepared! Log in to Pursuitz to review the job details and your tailored resume.</p>
              </div>
              <div class="footer">
                <p>© 2026 Pursuitz. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    })
  } catch (error) {
    console.error('Failed to send interview reminder:', error)
    throw error
  }
}

export async function sendStatusUpdateEmail(email: string, jobTitle: string, company: string, newStatus: string) {
  try {
    await getResend().emails.send({
      from: 'Pursuitz <noreply@pursuitz.co>',
      to: email,
      subject: `Job Application Status: ${esc(newStatus)}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .status { background: white; border: 2px solid #e5e7eb; padding: 20px; border-radius: 6px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #999; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>Application Status Update</h2>
              </div>
              <div class="content">
                <p>Hi there,</p>
                <p>Your job application status has been updated!</p>
                <div class="status">
                  <p><strong>Company:</strong> ${esc(company)}</p>
                  <p><strong>Position:</strong> ${esc(jobTitle)}</p>
                  <p><strong>New Status:</strong> <span style="color: #2563eb; font-weight: bold;">${esc(newStatus)}</span></p>
                </div>
                <p>Log in to Pursuitz to see more details and next steps.</p>
              </div>
              <div class="footer">
                <p>© 2026 Pursuitz. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    })
  } catch (error) {
    console.error('Failed to send status update email:', error)
    throw error
  }
}

export async function sendWeeklyDigest(email: string, stats: { totalApplications: number; interviews: number; accepted: number }) {
  try {
    await getResend().emails.send({
      from: 'Pursuitz <noreply@pursuitz.co>',
      to: email,
      subject: 'Your Pursuitz Weekly Summary',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 20px 0; }
              .stat-box { background: white; padding: 15px; border-radius: 6px; text-align: center; border: 1px solid #e5e7eb; }
              .stat-number { font-size: 24px; font-weight: bold; color: #2563eb; }
              .stat-label { font-size: 12px; color: #666; margin-top: 5px; }
              .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #999; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>Your Weekly Summary</h2>
              </div>
              <div class="content">
                <p>Hi there,</p>
                <p>Here's how your job search is going this week:</p>
                <div class="stats">
                  <div class="stat-box">
                    <div class="stat-number">${Number(stats.totalApplications)}</div>
                    <div class="stat-label">Applications</div>
                  </div>
                  <div class="stat-box">
                    <div class="stat-number">${Number(stats.interviews)}</div>
                    <div class="stat-label">Interviews</div>
                  </div>
                  <div class="stat-box">
                    <div class="stat-number">${Number(stats.accepted)}</div>
                    <div class="stat-label">Accepted</div>
                  </div>
                </div>
                <p>Keep up the great work! Log in to Pursuitz to see more details and continue tracking your applications.</p>
              </div>
              <div class="footer">
                <p>© 2026 Pursuitz. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    })
  } catch (error) {
    console.error('Failed to send weekly digest:', error)
    throw error
  }
}
