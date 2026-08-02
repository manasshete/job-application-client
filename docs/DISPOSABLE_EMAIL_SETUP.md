# Disposable Email Domains Setup

## Overview

Pursuitz blocks 60,000+ disposable email services to prevent free-tier abuse. The blocklist is automatically synced from [tompec/disposable-email-domains](https://github.com/tompec/disposable-email-domains) daily.

## Architecture

```
GitHub (60,000+ domains)
    ↓
Cron job runs daily (2 AM UTC)
    ↓
API: /api/cron/sync-disposable-domains
    ↓
Supabase: disposable_email_domains table
    ↓
Signup validation queries database
    ↓
Rejects disposable emails before account creation
```

## Setup Steps

### 1. Run the Database Migration

```bash
# This creates the disposable_email_domains table and RPC functions
supabase migration up 009_email_verification.sql
```

The migration creates:
- `disposable_email_domains` table (60,000+ rows)
- `is_disposable_email(email)` RPC function
- Indexes for fast lookups during signup

### 2. Seed the Initial List

Manually trigger the first sync (or wait for the daily cron):

```bash
# Manual admin sync
curl -X POST https://your-app.vercel.app/api/admin/sync-disposable-domains \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

Response:
```json
{
  "success": true,
  "domains_synced": 61234,
  "timestamp": "2025-08-02T02:00:00Z"
}
```

### 3. Configure Cron Job (Vercel)

Update `vercel.json` to enable daily auto-sync at 2 AM UTC:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-disposable-domains",
      "schedule": "0 2 * * *"
    }
  ]
}
```

Ensure `CRON_SECRET` environment variable is set in Vercel project settings.

### 4. Verify in Production

Check Vercel Function logs:
```
https://vercel.com/your-team/pursuitz/functions
```

Look for: `[v0] Cron: Successfully synced XXXX disposable domains`

## Endpoints

### Admin Manual Sync

**POST** `/api/admin/sync-disposable-domains`

Manually trigger a sync from GitHub (useful for emergency updates or testing).

```bash
curl -X POST http://localhost:3000/api/admin/sync-disposable-domains \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

### Cron Auto-Sync

**GET** `/api/cron/sync-disposable-domains`

Triggered automatically daily by Vercel Cron (requires `CRON_SECRET` header).

## Monitoring

### Check Last Sync Time

```sql
SELECT domain, synced_at 
FROM disposable_email_domains 
ORDER BY synced_at DESC 
LIMIT 1;
```

### Count Domains in Database

```sql
SELECT COUNT(*) as total_domains FROM disposable_email_domains;
```

### View Recent Rejections

```sql
-- Check IP signup logs for rejected emails
SELECT ip_address, COUNT(*) as attempts, created_at 
FROM ip_signup_log 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY ip_address, created_at
ORDER BY created_at DESC;
```

## Troubleshooting

### Sync Failed - GitHub Connection

Check if GitHub API is accessible:
```bash
curl -I https://raw.githubusercontent.com/tompec/disposable-email-domains/master/disposable_domains.txt
```

### Sync Failed - Database Insert

Ensure service role key has permission to insert into `disposable_email_domains` table.

### Domains Not Being Blocked

1. Verify table has data: `SELECT COUNT(*) FROM disposable_email_domains;`
2. Test RPC function: `SELECT is_disposable_email('user@tempmail.com');` (should return `true`)
3. Check validation API logs: `/api/auth/validate-signup`

## Performance

- **GitHub fetch**: ~2 seconds
- **Database clear**: ~1 second (auto-vacuum)
- **Batch insert (60K)**: ~8 seconds
- **Total sync time**: ~15 seconds
- **Validation query**: ~5ms (indexed lookup)

## Rollback

If something goes wrong, manually restore from backup:

```sql
-- Clear corrupted data
DELETE FROM disposable_email_domains;

-- Re-seed from manual trigger or wait for next cron
```

Or restore Supabase backup from Vercel dashboard.
