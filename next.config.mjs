import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production'

// Next.js injects inline bootstrap scripts, so script-src needs 'unsafe-inline'
// unless nonces are wired through the proxy. Everything else stays locked down.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://checkout.razorpay.com https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.sentry.io https://*.ingest.sentry.io https://*.razorpay.com https://vitals.vercel-insights.com${isDev ? ' ws://localhost:* http://localhost:*' : ''}`,
  'frame-src https://api.razorpay.com https://checkout.razorpay.com',
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  // Prevent browsers from MIME-sniffing the content-type
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Block clickjacking by disallowing iframes from other origins
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Limit referrer information sent to third parties
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Restrict access to browser features
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  // Force HTTPS for 1 year (including subdomains)
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  // XSS protection for older browsers
  { key: 'X-XSS-Protection', value: '1; mode=block' },
]

const nextConfig = {
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || 'none-7mv',
  project: process.env.SENTRY_PROJECT || 'pursuitz',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: false,
  widenClientFileUpload: true,
})
