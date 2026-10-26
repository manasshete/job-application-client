# Pursuitz — AI Job Application Tracker

Pursuitz helps job seekers track every application in one place and use AI to tailor their resume and cover letter to each job.

**Live:** https://job-application-client-flame.vercel.app

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Database setup](#database-setup)
- [AI setup (Gemini)](#ai-setup-gemini)
- [Plans, credits and payments](#plans-credits-and-payments)
- [Authentication](#authentication)
- [API reference](#api-reference)
- [Deployment](#deployment)
- [Security](#security)
- [Troubleshooting](#troubleshooting)

---

## Features

### Job tracking
- **Applications list and Kanban board.** Move jobs between stages (applied, interview, offer, and so on).
- **Job details.** Each job has notes, status, location and salary, plus its own **tasks** (follow-ups, deadlines) and **interviews** (rounds, dates, times).
- **Analytics.** Charts of your pipeline and a weekly summary.

### AI features
| Feature | What it does | Credit used |
|---|---|---|
| **Extract job from URL** | Paste a job posting link; the app fetches the page and fills in company, position, location, salary, description and key requirements. | 1 AI extraction |
| **Tailor resume** | Rewrites your resume for a specific job description to improve ATS keyword match, without inventing experience. | 1 document generation |
| **Cover letter** | Writes a cover letter from your resume or notes and the job description. | 1 document generation |
| **PDF download** | Exports the tailored resume or cover letter as a PDF. | Free |
| **Resume upload** | Upload a `.doc`/`.docx` resume and its text is extracted for the AI tools. | Free |

If an AI call fails, the credit is refunded automatically.

### Free tools (no account needed)
Available at `/tools` and inside the dashboard at `/dashboard/tools`:
- **ATS Resume Scanner.** Checks how well a resume matches a job description.
- **Salary Take-Home Calculator.** Estimates in-hand salary.
- **Resume Readability Checker.** Word count and readability score.
- **Cover Letter Template Generator.**

### Accounts and admin
- Email + password sign-up, login, logout, forgot/reset password (reset link sent by email via Resend).
- Settings page with profile editing and account deletion.
- Admin dashboard (`/admin`) with user metrics and subscription management, for users with `is_admin = true`.

---

## Tech stack

| Area | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router), React 19, TypeScript |
| Styling | Tailwind CSS, [shadcn/ui](https://ui.shadcn.com) (Radix UI), lucide-react icons |
| Database | [Supabase](https://supabase.com) Postgres with Row Level Security |
| Auth | Custom email/password auth: bcrypt hashes + HS256 JWT session cookie (`jose`) |
| AI | [Vercel AI SDK](https://ai-sdk.dev) v6 + `@ai-sdk/google` (Gemini) |
| Documents | `mammoth` (.docx parsing), `@react-pdf/renderer` / `pdf-lib` (PDF output) |
| Payments | [Razorpay](https://razorpay.com) (INR) |
| Email | [Resend](https://resend.com) |
| Monitoring | Sentry, Vercel Analytics |
| Charts | Recharts |
| Hosting | [Vercel](https://vercel.com) (with a monthly Vercel Cron job) |
| Package manager | pnpm |

---

## Project structure

```
app/
  (landing)/              Marketing landing page
  auth/                   Login, sign-up, forgot/reset password pages
  dashboard/              Signed-in app: applications, board, analytics,
                          documents, settings, tools, jobs/[id] (cv, cover-letter)
  admin/                  Admin dashboard
  tools/                  Public free tools
  api/                    Route handlers (see API reference below)
  privacy/, terms/        Legal pages
  robots.ts, sitemap.ts   SEO
components/
  ui/                     shadcn/ui primitives
  pz/, landing/, tools/   App, landing and tool components
  admin/                  Admin components
lib/
  ai.ts                   Gemini models with automatic fallback
  auth/                   Session JWT, password hashing, request helpers, rate limits
  data/                   Data access (tokens/credits, jobs, ...)
  supabase/               Supabase server/browser/admin clients
  email/                  Resend email helpers
  subscription.ts         Plan limits and prices
  razorpay.ts             Razorpay client
  ssrf.ts                 URL safety check for job-link extraction
  rate-limit.ts           Per-user API rate limiting
  site-config.ts          Brand + SEO constants
scripts/
  001_ … 014_*.sql        Database migrations (run in order)
  seed-test-data.mjs      Seed data for a test project
  model-bench.mjs         Benchmark AI models on the app's prompts
proxy.ts                  Redirects signed-out users away from /dashboard, /settings, /admin
vercel.json               Cron schedule
```

---

## Getting started

### Prerequisites
- **Node.js 22+** (24 recommended)
- **pnpm** (`npm i -g pnpm`)
- A **Supabase** project
- A **Gemini API key** from [Google AI Studio](https://aistudio.google.com/apikey)

### Install and run

```bash
git clone https://github.com/manasshete/job-application-client.git
cd job-application-client
pnpm install
# create .env.local (see the next section), then:
pnpm dev
```

Open http://localhost:3000.

### Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | Run ESLint |
| `npx tsc --noEmit` | Type-check |

---

## Environment variables

Create `.env.local` in the project root. It is git-ignored; never commit it.

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_URL` | Yes | Same as above, server side |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_ANON_KEY` | Yes | Same as above, server side |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (server only, bypasses RLS) |
| `SUPABASE_JWT_SECRET` | Yes | Supabase → Project Settings → API → JWT Secret. Signs session cookies. |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Yes | Gemini API key, used by all AI features |
| `NEXT_PUBLIC_SITE_URL` | Yes | Base URL of the site, e.g. `http://localhost:3000` |
| `CRON_SECRET` | Yes (prod) | Bearer token Vercel Cron sends to `/api/cron/grant-free-tokens` |
| `RESEND_API_KEY` | Optional | Sends password-reset and subscription emails. Without it, reset links are printed to the server console. |
| `RAZORPAY_KEY_ID` | For payments | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | For payments | Razorpay key secret |
| `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` | Optional | Source-map upload to Sentry during build |

`.env.test.example` is a template for pointing the app at a separate **test** Supabase project.

---

## Database setup

The schema lives in `scripts/` as numbered SQL migrations. In the Supabase dashboard open **SQL Editor** and run them **in order**:

| File | Purpose |
|---|---|
| `001_create_tables.sql` | Profiles, jobs, interviews, tasks, activity log + RLS |
| `002_create_profile_trigger.sql` | Creates a profile row for each new user |
| `003_add_document_tracking.sql` | Document usage tracking |
| `004_add_admin_schema.sql` | `is_admin` flag, admin audit log |
| `005_create_payments_table.sql` | Razorpay payments |
| `006_create_user_documents_table.sql` | Saved resumes / cover letters |
| `007_profiles_columns_and_functions.sql` | Extra profile columns and helpers |
| `008_token_ledger.sql` | Credit ledger (`token_batches`, `grant_tokens`, `consume_token`, …) |
| `009_email_verification.sql` | Email verification (later removed by 010) |
| `010_remove_custom_email_verification.sql` | Removes 009's verification flow |
| `011_custom_jwt_auth.sql` | `app_users` table for custom auth |
| `012_auth_hardening.sql` | Login/sign-up rate limits, sign-up-by-IP logging |
| `013_ui_redesign.sql` | Columns used by the redesigned UI |
| `014_signup_document_tokens.sql` | Free sign-ups get 5 extraction + 2 document credits |

All migrations are safe to re-run. `scripts/all_migrations.sql` is an older bundle that only covers the early migrations, so use the numbered files.

**Make yourself an admin:**
```sql
update public.profiles set is_admin = true where email = 'you@example.com';
```

---

## AI setup (Gemini)

All AI calls go through `lib/ai.ts`, which exports two models:

| Export | Used by | Models tried, in order |
|---|---|---|
| `writingModel` | Tailor resume, cover letter | `gemini-3.5-flash` → `gemini-3.6-flash` → `gemini-3-flash-preview` → `gemini-flash-latest` |
| `extractionModel` | Extract job from URL | `gemini-3.5-flash-lite` → `gemini-flash-lite-latest` → `gemini-3.1-flash-lite` → `gemini-3.5-flash` |

Gemini models often return **503 (high demand)**, **429 (quota)** or **404 (model retired / not available to new keys)**. When that happens, the request automatically moves on to the next model in the list. Other errors (bad request, invalid key) fail immediately.

**To change models,** edit the lists in `lib/ai.ts`. To check which models your key can use:

```bash
curl -H "x-goog-api-key: $GOOGLE_GENERATIVE_AI_API_KEY" \
  "https://generativelanguage.googleapis.com/v1beta/models?pageSize=200"
```

> Free-tier Gemini keys have low rate limits. For real traffic, enable billing on the key in Google AI Studio.

---

## Plans, credits and payments

Defined in `lib/subscription.ts`:

| | Free | Pro | Premium |
|---|---|---|---|
| Price | ₹0 | ₹299 | ₹499 |
| Jobs / interviews / tasks | 10 / 20 / 20 | Unlimited | Unlimited |
| AI extractions | 5 | 100 | 300 |
| Document generations | 2 | 100 | 300 |
| Email notifications, advanced filters, timeline, export | — | ✓ | ✓ |

**How credits work**
- Credits are stored as batches in `token_batches`, and each batch **expires after 60 days**.
- New free accounts get 5 extraction + 2 document credits at sign-up (database trigger, migration 014).
- A Vercel Cron job (`vercel.json`, 1st of every month) calls `/api/cron/grant-free-tokens` to top up free users. It skips anyone who already got a monthly grant in the last 28 days.
- A credit is reserved **before** each AI call, so parallel requests can't overspend, and is **refunded** if the call fails.

**Payments** use Razorpay. The server creates the order with a fixed price (`/api/payment/create-order`), never trusting an amount from the browser, and verifies the payment signature in `/api/payment/verify` before upgrading the plan.

---

## Authentication

The app uses its own auth instead of Supabase Auth:

- Users live in the `app_users` table. Passwords are hashed with **bcrypt**.
- On login/sign-up the server sets an **httpOnly JWT cookie** (HS256, signed with `SUPABASE_JWT_SECRET`, valid 7 days).
- Each user has a `token_version`; bumping it (e.g. on password reset) signs out all of their sessions.
- `proxy.ts` sends signed-out visitors from `/dashboard`, `/settings` and `/admin` to `/auth/login`. Admin rights are checked again on the server for every admin page and API route.
- Login and sign-up are rate-limited per IP and per email. Sign-up rejects disposable email domains.
- Auth endpoints reject cross-origin requests.

---

## API reference

All routes live under `app/api/`. Unless noted, they require a signed-in user.

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/sign-up` | Create account `{ email, password }` (public) |
| POST | `/api/auth/login` | Log in `{ email, password }` (public) |
| POST | `/api/auth/logout` | Log out |
| POST | `/api/auth/forgot-password` | Email a reset link (public) |
| POST | `/api/auth/reset-password` | Set a new password with a reset token (public) |
| GET / PATCH | `/api/profile` | Read / update profile |
| DELETE | `/api/account` | Delete account `{ email }` (email must match) |
| GET | `/api/tokens` | Credit balance and batches |
| POST | `/api/jobs` | Create job `{ company, position, … }` |
| PATCH / DELETE | `/api/jobs/[id]` | Update / delete job |
| POST | `/api/jobs/[id]/tasks` | Add task `{ title, dueDate?, status?, notes? }` |
| PATCH / DELETE | `/api/jobs/[id]/tasks/[itemId]` | Update / delete task |
| POST | `/api/jobs/[id]/interviews` | Add interview `{ round, date?, time?, status?, notes? }` |
| PATCH / DELETE | `/api/jobs/[id]/interviews/[itemId]` | Update / delete interview |
| POST | `/api/extract-job` | AI: extract job details `{ url }` |
| POST | `/api/tailor-resume` | AI: `{ resumeText, jobDescription, jobTitle?, company? }` → `{ tailoredResume }` |
| POST | `/api/generate-cover-letter` | AI: `{ userInput, jobDescription, mode?, jobTitle?, company?, applicantName? }` → `{ coverLetter }` |
| POST | `/api/parse-resume` | Multipart upload `file` (.doc/.docx, max 5 MB) → text |
| POST | `/api/generate-pdf` | `{ content, filename? }` → PDF file |
| GET / POST / DELETE | `/api/user-documents` | Saved documents |
| POST | `/api/subscription`, `/api/subscription/change-tier` | Plan changes |
| POST | `/api/payment/create-order`, `/api/payment/verify` | Razorpay checkout |
| GET | `/api/admin/metrics`, `/api/admin/users` | Admin only |
| POST | `/api/admin/users/subscription` | Admin only: change a user's plan |
| GET | `/api/cron/grant-free-tokens` | Vercel Cron only (`Authorization: Bearer $CRON_SECRET`) |

AI routes return `401` when signed out, `403` when out of credits, and `429` when rate-limited.

---

## Deployment

The app is deployed on **Vercel** (project `job-application-client`). Every push to `main` deploys to production automatically.

1. Push to `main`:
   ```bash
   git push origin main
   ```
2. Production environment variables are managed in Vercel → Project → Settings → Environment Variables, or with the CLI:
   ```bash
   npx vercel env ls production
   npx vercel env add GOOGLE_GENERATIVE_AI_API_KEY production --sensitive
   ```
3. A new env variable only applies to **new** deployments. After changing one, redeploy:
   ```bash
   npx vercel redeploy https://job-application-client-flame.vercel.app --target production
   ```
4. Run any new SQL migration in the Supabase SQL Editor **before** deploying code that depends on it.

---

## Security

- Row Level Security on all user tables; service-role access only on the server.
- Job-link extraction blocks private/internal addresses (SSRF protection in `lib/ssrf.ts`).
- Payment amounts are fixed on the server; Razorpay signatures are verified.
- Input size limits on all AI and upload routes.
- More detail in `SECURITY.md` and `SECURITY_AUDIT.md`.

Report security issues privately to the repository owner rather than opening a public issue.

---

## Troubleshooting

| Problem | Likely cause / fix |
|---|---|
| AI features return **500** in production | `GOOGLE_GENERATIVE_AI_API_KEY` missing in Vercel Production, or added without redeploying. |
| Error: "model … is no longer available to new users" | Google retired that model for new keys. Update the lists in `lib/ai.ts`. |
| AI errors about "high demand" | Gemini capacity is temporarily full. The fallback chain usually handles it; add more models to the lists if it keeps happening. |
| New users have **0 document credits** | Migration `014_signup_document_tokens.sql` hasn't been run. |
| Password-reset emails not arriving | `RESEND_API_KEY` missing/invalid, or the sending domain isn't verified in Resend. |
| Logged out after deploy | `SUPABASE_JWT_SECRET` changed, which invalidates all sessions. |
| Monthly free credits not granted | `CRON_SECRET` not set in Vercel. |
