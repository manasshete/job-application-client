# Sentry Integration Setup

Sentry is configured for production error tracking and performance monitoring.

## 1. Create a Sentry Project

1. Go to [sentry.io](https://sentry.io)
2. Sign up or log in
3. Click "Create Project"
4. Select **Next.js** as the platform
5. Name it **"Pursuitz"**
6. You'll get a **DSN** (looks like `https://xxxxx@xxxxx.ingest.sentry.io/xxxxxx`)

## 2. Set Environment Variables in Vercel

Add these to your Vercel project (Settings → Environment Variables):

**For Production:**
```
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxxx
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxxx
SENTRY_ORG=your-org-name
SENTRY_PROJECT=pursuitz
SENTRY_AUTH_TOKEN=your-auth-token
```

**To get the auth token:**
1. Go to Sentry Settings → Account → API Tokens
2. Click "Create New Token"
3. Select scopes: `project:releases`, `org:read`, `project:admin`
4. Copy the token and paste it as `SENTRY_AUTH_TOKEN`

## 3. Set Environment Variables Locally

Create a `.env.local` file in your project root:
```
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxxx
```

## 4. How It Works

- **Client-side errors:** Automatically caught by the ErrorBoundary component
- **Server-side errors:** Automatically captured by @sentry/nextjs
- **API errors:** Use `captureApiError()` in try-catch blocks
- **Performance:** All transactions are traced (1.0 sample rate for now)
- **Replays:** On error, last 100KB of session is replayed (1.0 sample rate for errors)

## 5. Test It

To test Sentry error capture in production:

```typescript
// In any client component
'use client'
import * as Sentry from '@sentry/nextjs'

export default function TestPage() {
  return (
    <button onClick={() => Sentry.captureException(new Error('Test error'))}>
      Test Sentry
    </button>
  )
}
```

## 6. View Errors in Sentry Dashboard

- Go to [sentry.io](https://sentry.io) → Your Project
- Errors appear in Issues with:
  - Stack trace
  - Browser/device info
  - User session replay (on errors)
  - Release info
  - Breadcrumbs (sequence of actions before error)

## 7. Alerts

Set up alerts in Sentry:
1. Go to Alerts → Create Alert Rule
2. Set conditions: "An event is seen" + your project
3. Add actions: Email, Slack, etc.

Done! All errors in production are now tracked in Sentry.
