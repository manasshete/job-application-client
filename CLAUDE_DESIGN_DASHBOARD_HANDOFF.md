# Pursuitz Dashboard — Claude Design Handoff

## Mission
Redesign the authenticated Pursuitz job-search dashboard and connected account/settings experience as a polished, modern product UI for desktop and mobile. Improve visual hierarchy, information density, typography, spacing, color, states, responsiveness, and purposeful motion while preserving every existing feature and backend contract.

This file is a design/engineering handoff. It contains no credentials, service-role keys, tokens, real user records, or private profile data.

## Product context
Pursuitz helps job seekers track applications, organize job-search activity, and generate AI-assisted resumes and cover letters. The dashboard is the main authenticated workspace: users add jobs, move applications through statuses, search/filter/sort them, switch between board and timeline views, inspect job details, generate documents, and manage their plan.

Desired feeling: focused, calm, trustworthy, fast, and motivating. The redesign should feel like a premium productivity workspace rather than an admin panel. Avoid decorative statistics that do not help a user act.

## Production route map

- `/dashboard`
  - Server page loads the signed-in user's jobs, profile subscription tier, and token balance.
  - Redirect/auth protection is handled by the existing application auth/data layer.
  - Client orchestration lives in `app/dashboard/dashboard-client.tsx`.
- `/dashboard/settings`
  - Server page loads the signed-in user's profile, jobs, derived application stats, and token summary.
  - Client UI lives in `app/dashboard/settings/settings-client.tsx`.
- Auth sign-out
  - Existing client action calls Supabase `auth.signOut()` and redirects to `/`.
- Existing production API contracts
  - `POST /api/jobs`
  - `PATCH /api/jobs/[id]`
  - `DELETE /api/jobs/[id]`
  - Existing document-generation routes used by document dialogs
  - Existing plan/subscription routes used by `PlanManager`

Do not invent replacement endpoints. Do not bypass auth. Do not use mock data in production routes.

## Current dashboard behavior

### Dashboard shell
- Sticky top header with Pursuitz brand and current tier badge.
- Desktop actions: Account, Sign Out, Quick Actions, Add Job.
- Mobile actions: Add Job and a collapsible account menu.
- Main content contains stats, weekly summary, search, Board/Timeline toggle, filters, the selected view, dialogs, and a disclaimer.

### State and interactions
- `jobs`: initial server jobs synchronized into client state.
- `searchQuery`: searches company, position, location, and notes.
- `viewMode`: `board` or `timeline`.
- `hiddenStatuses`: status visibility filters.
- `sortBy`: date applied, company, or deadline with ascending/descending order.
- `selectedTags`: tag filters.
- `selectedJob`: opens job detail dialog from timeline/card interaction.
- `isAddDialogOpen`: opens Add Job flow.
- `isMobileMenuOpen`: mobile account menu.
- `isPending`: transition state for mutations.
- Document usage is synchronized from server-provided monthly usage.

### Required dashboard actions
1. Add a job, including duplicate confirmation.
2. Edit/update a job.
3. Delete a job.
4. Search applications.
5. Filter by status and tags.
6. Sort by date, company, and deadline.
7. Toggle board/timeline views.
8. Open job details.
9. Generate/tailor resume and cover letter from the existing dialogs.
10. Export applications to CSV.
11. Archive old applications.
12. Delete rejected applications.
13. Open account/settings.
14. Manage subscription plan and token usage.
15. Sign out.
16. Use mobile navigation.

## Connected UI component inventory
Preserve these component responsibilities while redesigning their visual presentation:

- `components/stats.tsx` — top-level application and document usage metrics.
- `components/weekly-summary.tsx` — recent/weekly activity summary.
- `components/filter-toolbar.tsx` — status, tag, and sort controls.
- `components/job-board.tsx` — kanban/status board composition.
- `components/job-card.tsx` — individual application card.
- `components/application-card.tsx` — application summary card variant.
- `components/timeline-view.tsx` — chronological application view.
- `components/interview-task-section.tsx` — interview/task details.
- `components/job-detail-dialog.tsx` — job detail and actions modal.
- `components/add-job-dialog.tsx` — add job form and optional AI document generation.
- `components/add-application-dialog.tsx` — application creation variant.
- `components/edit-job-dialog.tsx` — edit job form.
- `components/document-generator-dialog.tsx` — document generation flow, usage limits, disclaimer, loading/error/success states.
- `components/quick-actions-menu.tsx` — export, archive, and rejected-job actions.
- `components/plan-manager.tsx` — upgrade/downgrade plan UI and payment flow.
- Required shared primitives are in `components/ui/*`; reuse their accessibility and behavior.

Relevant domain files:
- `lib/types.ts`
- `lib/subscription.ts`
- `lib/document-limits.ts`
- `lib/data/jobs.ts`
- `lib/data/profiles.ts`
- `lib/data/tokens.ts`

## Account/settings behavior

The settings page currently contains:

1. Back navigation to the dashboard.
2. Application Statistics card with total applications, active count, and status breakdown for Applied, Interviewing, Offers, Accepted, and Rejected.
3. Plan card with current tier, email, paid/free state, job limits, AI extraction balance, document-generation balance, token expiry information, and a 60-day token validity notice.
4. Manage Plan card using the existing `PlanManager` component.

Redesign this page as a clear account workspace. Keep all statistics, plan information, token balances, expiry information, and plan controls. Make paid/free differences obvious but not aggressive. Preserve the existing disclaimer and any payment confirmation behavior.

## Safe mock fixtures for Claude Design previews

Use these only in an isolated design preview. Never persist them and never connect them to Supabase.

```ts
export const mockFreeProfile = {
  email: 'alex@example.test',
  subscription_tier: 'free' as const,
}

export const mockProProfile = {
  email: 'alex@example.test',
  subscription_tier: 'pro' as const,
}

export const mockJobs = [
  {
    id: 'mock-job-1',
    company: 'Northstar Labs',
    position: 'Product Designer',
    status: 'applied',
    dateApplied: '2026-08-20',
    deadline: '2026-09-05',
    location: 'Remote',
    salary: '$110k–$135k',
    tags: ['Design', 'Remote'],
    notes: 'Follow up after one week.',
    activityLog: [],
  },
  {
    id: 'mock-job-2',
    company: 'Orbit Systems',
    position: 'Frontend Engineer',
    status: 'interview',
    dateApplied: '2026-08-14',
    deadline: '2026-08-30',
    location: 'New York, NY',
    salary: '$125k–$150k',
    tags: ['Engineering', 'Priority'],
    notes: 'Prepare accessibility examples.',
    activityLog: [],
  },
  {
    id: 'mock-job-3',
    company: 'Fieldwork',
    position: 'Product Manager',
    status: 'offer',
    dateApplied: '2026-08-02',
    deadline: null,
    location: 'Austin, TX',
    salary: '$120k–$140k',
    tags: ['Product'],
    notes: 'Compare equity and remote policy.',
    activityLog: [],
  },
  {
    id: 'mock-job-4',
    company: 'Lumen Health',
    position: 'UX Researcher',
    status: 'rejected',
    dateApplied: '2026-07-18',
    deadline: null,
    location: 'Remote',
    salary: '$95k–$115k',
    tags: ['Research'],
    notes: '',
    activityLog: [],
  },
]

export const mockEmptyJobs = []

export const mockStats = {
  total: 4,
  activeApplications: 3,
  byStatus: { applied: 1, interview: 1, offer: 1, accepted: 0, rejected: 1 },
}

export const mockTokenSummary = {
  aiExtractionBalance: 8,
  documentGenerationBalance: 3,
  nextExpiry: '2026-10-01T00:00:00.000Z',
}
```

Required preview states:
- Empty dashboard with a clear first-job CTA.
- Populated dashboard with mixed statuses.
- Search results with no matches.
- Filtered board and filtered timeline.
- Loading mutation state.
- API error state with retry/undo affordance where appropriate.
- Free plan with limits visible.
- Pro/premium plan with usage and upgrade/manage controls.
- Mobile header/menu open.
- Add/edit/detail/document dialogs open.
- Settings with zero applications and with populated statistics.

## Claude Design instructions

Act as a senior product designer and frontend engineer. Produce a complete visual makeover for the dashboard and account/settings pages using the current functionality above as the source of truth.

Improve:
- Information hierarchy and scanability.
- Typography using no more than two font families.
- Spacing rhythm and responsive layout.
- Status color semantics and accessible contrast.
- Board cards, timeline rows, stats, filters, dialogs, and settings sections.
- Empty, loading, disabled, success, and error states.
- Mobile navigation and touch targets.
- Keyboard navigation, focus states, labels, and screen-reader descriptions.
- Purposeful motion: restrained entrance, board transitions, dialog transitions, and feedback for successful mutations. Respect `prefers-reduced-motion`.
- Visual distinction between free, pro, and premium without using misleading decorative metrics.

Use a cohesive 3–5 color system: one brand color, semantic status accents, and neutral surfaces/text. Avoid purple gradients, generic dashboard card grids, decorative blobs, and excessive rounded rectangles. Make the primary action obvious: add and progress a job application.

Return:
1. A visual system: color tokens, typography, spacing, radii, shadows, and motion rules.
2. A revised responsive layout for `/dashboard`.
3. A revised responsive layout for `/dashboard/settings`.
4. Component-level JSX/CSS recommendations for every component in the inventory.
5. Mock-data preview states for all required states.
6. A migration plan that changes presentation only and preserves existing handlers, props, API paths, auth, and data types.

## Do not change

- Do not change Supabase authentication, session cookies, callback routes, or sign-out behavior.
- Do not expose, log, or request environment variables, credentials, service-role keys, tokens, or real user records.
- Do not add client-side persistence for production user data.
- Do not remove or weaken server-side authorization, RLS, user ownership checks, rate limits, token limits, payment verification, or subscription rules.
- Do not invent API routes or alter request/response contracts.
- Do not change `Job`, `JobStatus`, subscription, token, or profile types.
- Do not remove document disclaimers, plan-limit messaging, or payment safeguards.
- Do not make mock preview data callable against production mutations.
- Do not delete applications implicitly through a visual interaction; archive/delete must remain explicit and confirmed.
- Do not claim an AI-generated document is accurate without review.

## Visual acceptance checklist

- Desktop dashboard has a clear primary action and readable board hierarchy.
- Mobile dashboard remains usable at 375px wide without horizontal scrolling.
- Every interactive control has a visible focus state and accessible name.
- Board, timeline, search, filter, sort, dialogs, and settings controls remain discoverable.
- Empty, loading, error, and success states are intentional and actionable.
- Status colors pass contrast requirements and do not rely on color alone.
- Free/pro/premium usage is understandable without overwhelming the workspace.
- Dialogs are keyboard navigable and do not trap users on mobile.
- Motion is subtle and disabled/reduced under `prefers-reduced-motion`.
- No real data or secrets appear in the design preview.
- Production API/auth/data behavior remains untouched.

## Current source files to inspect in the repository

```text
app/dashboard/page.tsx
app/dashboard/dashboard-client.tsx
app/dashboard/settings/page.tsx
app/dashboard/settings/settings-client.tsx
components/stats.tsx
components/weekly-summary.tsx
components/filter-toolbar.tsx
components/job-board.tsx
components/job-card.tsx
components/application-card.tsx
components/timeline-view.tsx
components/interview-task-section.tsx
components/job-detail-dialog.tsx
components/add-job-dialog.tsx
components/add-application-dialog.tsx
components/edit-job-dialog.tsx
components/document-generator-dialog.tsx
components/quick-actions-menu.tsx
components/plan-manager.tsx
lib/types.ts
lib/subscription.ts
lib/document-limits.ts
```

Use the source files above for exact props and behavior. This handoff intentionally separates the visual redesign from production data access so the final implementation can be reviewed safely before applying it to the authenticated dashboard.
