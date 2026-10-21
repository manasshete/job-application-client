import type { InterviewStatus, JobStatus, TaskStatus } from '@/lib/types'

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WDL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/* ── Labels ─────────────────────────────────────────── */

export const JOB_STATUSES: JobStatus[] = ['applied', 'interview', 'offer', 'accepted', 'rejected']
export const JOB_STATUS_LABEL: Record<JobStatus, string> = { applied: 'Applied', interview: 'Interview', offer: 'Offer', accepted: 'Accepted', rejected: 'Rejected' }

export const ROUND_STATUSES: InterviewStatus[] = ['pending', 'scheduled', 'completed', 'cancelled']
export const ROUND_STATUS_LABEL: Record<InterviewStatus, string> = { pending: 'Pending', scheduled: 'Scheduled', completed: 'Completed', cancelled: 'Cancelled' }

export const TASK_STATUSES: TaskStatus[] = ['pending', 'in-progress', 'completed', 'submitted']
export const TASK_STATUS_LABEL: Record<TaskStatus, string> = { pending: 'Pending', 'in-progress': 'In progress', completed: 'Completed', submitted: 'Submitted' }

/* ── Dates (all "YYYY-MM-DD" strings, local calendar) ── */

export function isoOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function todayIso(): string {
  return isoOf(new Date())
}

export function parseIso(s: string): Date {
  const [y, m, d] = s.slice(0, 10).split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function addDays(s: string, n: number): string {
  const d = parseIso(s)
  d.setDate(d.getDate() + n)
  return isoOf(d)
}

/** Whole days from `today` to `s` (negative = in the past). */
export function daysFrom(today: string, s: string): number {
  return Math.round((parseIso(s).getTime() - parseIso(today).getTime()) / 86400000)
}

/** "16 Oct" */
export function fd(s?: string | null): string {
  if (!s) return '—'
  const d = parseIso(s)
  return `${d.getDate()} ${MON[d.getMonth()]}`
}

/** "Fri 16 Oct" */
export function fdw(s: string): string {
  const d = parseIso(s)
  return `${WD[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}`
}

/** "Friday 16 October" */
export function longDay(s: string): string {
  const d = parseIso(s)
  return `${WDL[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
}

export function weekday(s: string): string {
  return WD[parseIso(s).getDay()]
}

/** "3:00 PM" from "15:00" */
export function ft(t?: string | null): string {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  return `${(h % 12) || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

export function minutes(t?: string | null): number {
  const [h, m] = (t || '12:00').split(':').map(Number)
  return h * 60 + m
}

/** today / tomorrow / Wed / 24 Oct */
export function when(today: string, s: string): string {
  const d = daysFrom(today, s)
  if (d === 0) return 'today'
  if (d === 1) return 'tomorrow'
  if (d > 1 && d < 7) return weekday(s)
  return fd(s)
}

/** "2026-10-16T08:00:00Z" -> "2026-10-16" */
export function dayOf(ts: string): string {
  return isoOf(new Date(ts))
}

/* ── Links ──────────────────────────────────────────── */

export function hostOf(u?: string | null): string {
  if (!u) return ''
  try {
    return new URL(/^https?:/.test(u) ? u : `https://${u}`).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

export function sourceOf(u?: string | null): string {
  const h = hostOf(u)
  if (!h) return 'Unknown'
  if (/linkedin/.test(h)) return 'LinkedIn'
  if (/indeed/.test(h)) return 'Indeed'
  if (/naukri/.test(h)) return 'Naukri'
  if (/wellfound|angel\.co/.test(h)) return 'Wellfound'
  return 'Company site'
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`
}
