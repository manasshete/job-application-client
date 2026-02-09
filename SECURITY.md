# Security Documentation

## Overview

This document outlines the security measures implemented in the Job Application Tracker SaaS application.

## Authentication & Authorization

### Supabase Auth
- Email/password authentication with automatic email verification
- Secure session management via HTTP-only cookies
- Row Level Security (RLS) policies on all database tables
- Automatic profile creation on signup via database triggers

### RLS Policies
All tables have the following policies:
- **SELECT**: Users can only view their own data (`auth.uid() = user_id`)
- **INSERT**: Users can only insert data for themselves
- **UPDATE**: Users can only update their own data
- **DELETE**: Users can only delete their own data

### API Route Protection
All API routes check authentication status:
```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
```

## Input Validation & Sanitization

### Server-Side Validation
- All user inputs are validated on the server before processing
- URL validation prevents dangerous protocols (javascript:, data:, file:)
- Input length limits enforced via MAX_LENGTHS constants
- DOMPurify sanitization on all text inputs to prevent XSS

### Rate Limiting
- User-based rate limiting on AI extraction API (10 requests/minute)
- In-memory rate limiter with automatic cleanup
- 429 status codes with Retry-After headers

## SSRF Protection

### URL Validation
The `isPublicUrl()` function prevents SSRF attacks by:
- Blocking localhost and 127.0.0.1
- Blocking private IP ranges (10.x.x.x, 192.168.x.x, 172.16-31.x.x)
- Blocking link-local addresses (169.254.x.x)
- Blocking IPv6 localhost (::1)
- Validating DNS resolution

### Request Timeouts
- 10-second timeout on external fetch requests
- AbortController to cancel hanging requests
- Maximum response size of 500KB

## SQL Injection Prevention

### Parameterized Queries
All database queries use Supabase's query builder which automatically:
- Sanitizes inputs
- Uses prepared statements
- Prevents SQL injection

Example:
```typescript
await supabase
  .from('jobs')
  .select('*')
  .eq('user_id', userId) // Safe parameterized query
```

## Subscription & Feature Gating

### Usage Limits
- Free tier: 10 jobs, 5 AI extractions/month
- Pro tier: Unlimited jobs, 50 AI extractions/month
- Premium tier: Unlimited everything

### Enforcement
- Server-side checks before creating resources
- AI extraction counter incremented on each use
- 403 Forbidden responses when limits exceeded

## Data Protection

### Environment Variables
Sensitive keys stored in environment variables:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY (server-only)

### Password Security
- Passwords hashed by Supabase Auth (bcrypt)
- Never stored in plain text
- Minimum 6 characters enforced

## Known Limitations

### Without Stripe Integration
- Subscription tiers cannot be purchased
- Manual upgrade required via database
- No automatic billing

### localStorage Migration
- Old data in localStorage not automatically migrated
- Users must manually re-add applications

## Security Checklist

- [x] Authentication required for all protected routes
- [x] RLS policies on all database tables
- [x] Input validation and sanitization
- [x] SSRF protection on URL fetching
- [x] Rate limiting on expensive operations
- [x] SQL injection prevention via parameterized queries
- [x] XSS protection via DOMPurify
- [x] Feature gating based on subscription tier
- [x] Secure session management
- [x] HTTPS enforced in production (via Vercel)

## Reporting Security Issues

If you discover a security vulnerability, please email security@example.com (update with your actual email).

## Updates

- v1.0.0 (2025-02-09): Initial security implementation
