import { Resend } from 'resend'

let resendInstance: Resend | null = null

function getResend(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error('Resend is not configured. Please set the RESEND_API_KEY environment variable.')
    }
    resendInstance = new Resend(apiKey)
  }
  return resendInstance
}

export async function sendSubscriptionChangeEmail(
  email: string,
  fullName: string,
  fromTier: string,
  toTier: string
) {
  const tierNames: Record<string, string> = {
    free: 'Free',
    pro: 'Pro',
    premium: 'Premium',
  }

  const isUpgrade = getTierRank(toTier) > getTierRank(fromTier)
  const action = isUpgrade ? 'upgraded' : 'downgraded'
  const headerColor = isUpgrade ? '#059669' : '#dc2626' // green for upgrade, red for downgrade

  try {
    await getResend().emails.send({
      from: 'HireFlow <noreply@hireflow.dev>',
      to: email,
      subject: `Your HireFlow subscription has ${action}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, ${headerColor} 0%, ${adjustColor(headerColor, -20)} 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .tier-box { background: white; border: 2px solid #e5e7eb; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center; }
              .from-tier { color: #6b7280; font-size: 14px; margin-bottom: 10px; }
              .tier-name { font-size: 24px; font-weight: bold; color: ${headerColor}; }
              .arrow { margin: 15px 0; font-size: 20px; }
              .features { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
              .feature-list { list-style: none; padding: 0; }
              .feature-list li { padding: 8px 0; padding-left: 25px; position: relative; }
              .feature-list li:before { content: "✓"; position: absolute; left: 0; color: ${headerColor}; font-weight: bold; }
              .cta { text-align: center; margin: 30px 0; }
              .cta-button { display: inline-block; background: ${headerColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; }
              .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #999; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Subscription ${action.charAt(0).toUpperCase() + action.slice(1)}</h1>
              </div>
              <div class="content">
                <p>Hi ${fullName || 'there'},</p>
                <p>Great news! Your HireFlow subscription has been ${action}.</p>
                
                <div class="tier-box">
                  <div class="from-tier">From</div>
                  <div class="tier-name">${tierNames[fromTier] || fromTier}</div>
                  <div class="arrow">↓</div>
                  <div class="tier-name">${tierNames[toTier] || toTier}</div>
                </div>

                ${getFeaturesSectionHtml(toTier, headerColor)}

                <div class="cta">
                  <a href="https://hireflow.dev/dashboard" class="cta-button">Go to Dashboard</a>
                </div>

                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                  ${isUpgrade
                    ? `Your new features are now available! Start using the advanced tools right away.`
                    : `Your current subscription features remain active until your billing cycle ends. You can upgrade anytime.`}
                </p>
              </div>
              <div class="footer">
                <p>© 2026 HireFlow. All rights reserved.</p>
                <p>Questions? Contact us at support@hireflow.dev</p>
              </div>
            </div>
          </body>
        </html>
      `,
    })
  } catch (error) {
    console.error('Failed to send subscription change email:', error)
    throw error
  }
}

function getTierRank(tier: string): number {
  const rank: Record<string, number> = { free: 0, pro: 1, premium: 2 }
  return rank[tier] ?? 0
}

function adjustColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.max(0, Math.min(255, (num >> 16) + amt))
  const G = Math.max(0, Math.min(255, (num >> 8 & 0x00FF) + amt))
  const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt))
  return `#${(0x1000000 + (R < 16 ? 0 : 0) * 0x1000000 + R * 0x10000 + (G < 16 ? 0 : 0) * 0x100 + G * 0x100 + (B < 16 ? 0 : 0) + B).toString(16).slice(1)}`
}

function getFeaturesSectionHtml(tier: string, color: string): string {
  const tiers: Record<string, string[]> = {
    free: [
      'Up to 10 job applications',
      '5 AI extractions/month',
      'Basic application tracking',
      'Status updates & notes',
      'Interview scheduling',
    ],
    pro: [
      'Unlimited applications',
      '200 AI extractions/month',
      'AI Resume Tailoring',
      'AI Cover Letter Generation',
      '200 documents/month',
      'PDF downloads',
      'Timeline view',
      'Export to CSV',
      'Advanced filters & tags',
      'Activity logs',
      'Weekly summaries',
    ],
    premium: [
      'Everything in Pro',
      '500 AI extractions/month',
      '500 documents/month',
      'Priority support',
      'Advanced analytics',
    ],
  }

  const features = tiers[tier] || tiers.free

  return `
    <div class="features">
      <h3 style="color: ${color}; margin-top: 0;">Your ${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan Includes:</h3>
      <ul class="feature-list">
        ${features.map(f => `<li>${f}</li>`).join('')}
      </ul>
    </div>
  `
}
