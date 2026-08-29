repo: dhrathx/v0-job-application-tracker-nc
branch: main

## Last sync
date: 2026-08-29T09:31:00Z

### Updated in this project
- Added the Task model from interview-task-section.tsx: Progress tab is now
  "Interview Rounds" + "Tasks & Assignments", matching the real section.
- Interview statuses now cover pending / scheduled / completed / cancelled;
  task statuses cover pending / in-progress / completed / submitted.
- Interviews screen gained an Open tasks panel (replaces the removed Reminders panel).
- Verified tokens, subscription limits and pricing are unchanged upstream.

## Screen map
| Project screen | Repo files read and used | Status |
| --- | --- | --- |
| Pursuitz Landing.dc.html | app/(landing)/page.tsx, app/tools/* (titles inferred from URLs), lib/subscription.ts | grounded |
| Dashboard — shell, board, stats | app/dashboard/dashboard-client.tsx, components/job-board.tsx, components/job-card.tsx, components/stats.tsx, app/globals.css, app/design-preview/page.tsx | grounded |
| Dashboard — add via link | components/add-job-dialog.tsx, app/api/extract-job/route.ts | grounded |
| Dashboard — detail slide-over | components/job-detail-dialog.tsx, components/interview-task-section.tsx, lib/types.ts | grounded |
| Dashboard — settings & plans | components/plan-manager.tsx, app/dashboard/settings/settings-client.tsx, lib/subscription.ts | grounded |
| Dashboard — interviews screen | components/interview-task-section.tsx, lib/types.ts | net-new UI, model grounded |
| Dashboard — tailoring / documents | lib/document-limits.ts | partial — document-generator-dialog.tsx, api/tailor-resume, api/generate-cover-letter not yet read |

## Notes
- Status → colour follows components/job-board.tsx: applied chart-3, interview chart-2,
  offer chart-1, rejected chart-5; accepted uses settings-client.tsx green. Lightened for dark.
- Upstream job-board.tsx renders FOUR columns (no "accepted"); this project shows five at
  the user's request, since "accepted" is a real JobStatus in lib/types.ts.
- Board and Analytics derive every rate from one totals object, so no two screens disagree.
- Plan cards use TIER_META copy and SUBSCRIPTION_PRICING verbatim; downgrade shows the
  same confirm copy as the AlertDialog in plan-manager.tsx.

## Sync history
- 2026-08-29T09:24:00Z — detail, add-job and plan views aligned to their real components.
- 2026-08-28T18:06:00Z — palette, radius and type derived from app/globals.css tokens.
