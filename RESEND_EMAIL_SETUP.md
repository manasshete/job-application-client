# Resend Email Integration Setup Guide

## Overview
JobTracker now uses **Resend** to send branded emails instead of Supabase's default emails. When users sign up, they receive a professional email confirmation from "JobTracker" instead of Supabase.

## What's Been Set Up

### 1. Installed Dependencies
- `resend` package installed
- API route created at `/api/email-hooks`

### 2. Email Templates
Four professional email templates configured:

#### Confirmation Email
- Sent when user signs up
- Contains email verification link
- Professional blue gradient header
- 24-hour expiration notice

#### Interview Reminder
- Sent before scheduled interviews
- Shows company, position, and date
- Green gradient header
- Prompts user to review job details

#### Status Update Email
- Sent when job application status changes
- Displays new status with styling
- Professional formatting
- Link to JobTracker dashboard

#### Weekly Digest
- Sent on Fridays (optional, can be enabled)
- Shows stats: total applications, interviews, accepted offers
- Grid layout with numbered stats
- Motivational message

### 3. Environment Variables Added
- `RESEND_API_KEY` - Your Resend API key
- `SUPABASE_WEBHOOK_SECRET` - Random secret for webhook validation
- `NEXT_PUBLIC_SITE_URL` - Your deployment URL

## Supabase Webhook Configuration

### Webhook Details
- **Name:** `user_confirmation_emails`
- **Table:** `auth.users`
- **Event:** `Insert` (new user signup)
- **HTTP Method:** POST
- **URL:** `https://v0-job-application-tracker-nc.vercel.app/api/email-hooks`

### Headers to Add
```
Content-Type: application/json
Authorization: Bearer YOUR_WEBHOOK_SECRET_HERE
```

## How It Works

1. **User Signs Up**
   - Creates account in Supabase Auth
   - Triggers webhook event

2. **Webhook Fires**
   - Supabase sends POST request to `/api/email-hooks`
   - Includes user email and verification token

3. **Resend Sends Email**
   - Email hook verifies the webhook secret
   - Calls `sendConfirmationEmail()` function
   - Resend sends professional email with "JobTracker <noreply@jobtracker.dev>" as sender

4. **User Confirms Email**
   - Clicks link in email
   - Completes email verification
   - Can now log in and use app

## Testing the Integration

### Local Testing
1. Start dev server: `pnpm dev`
2. Go to sign-up page
3. Enter email and password
4. Check console for webhook processing
5. Check your email (use a test email)

### Production Testing
1. Deploy to Vercel
2. Test with real email address
3. Verify email arrives with "JobTracker" branding

## Email Sender Address

All emails come from: **JobTracker <noreply@jobtracker.dev>**

To customize this:
- Edit `from` field in `/lib/email/resend.ts`
- Change domain to your own (requires domain verification in Resend)

## Rate Limits & Pricing

- **Resend Free Tier:** 100 emails/day
- **Pro Plan:** $20/month for 10,000 emails
- **Current Setup:** Suitable for startups, upgrade as you scale

## Troubleshooting

### Emails Not Sending
1. Check `RESEND_API_KEY` is set in Vercel
2. Verify webhook secret matches in Supabase and Vercel
3. Check server logs for errors
4. Verify Supabase webhook is enabled

### Webhook Not Firing
1. Confirm webhook URL is correct
2. Check webhook is enabled in Supabase
3. Verify Authorization header format
4. Test with Supabase webhook simulator

### Email Not Branded
- If still seeing Supabase emails, webhook may not be set up
- Clear browser cache and try signing up again
- Check Supabase webhook events in Activity tab

## Additional Email Types Available

The system supports sending emails for:
- Interview reminders (call `sendInterviewReminder()`)
- Status updates (call `sendStatusUpdateEmail()`)
- Weekly digest (call `sendWeeklyDigest()`)

These can be triggered from job status updates or scheduled tasks.

## Next Steps

1. Verify webhook is working by signing up with a test account
2. Check email arrives with JobTracker branding
3. Click confirmation link to verify it works
4. Deploy to production when ready
5. Monitor email delivery in Resend dashboard
