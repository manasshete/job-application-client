import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const securityHeaders = [
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
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
})
