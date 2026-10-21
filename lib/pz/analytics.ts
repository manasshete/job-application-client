import type { Job } from '@/lib/types'
import { addDays, dayOf, daysFrom, fd, sourceOf } from './format'
import { replied } from './next-steps'

export const MIN_FOR_CHARTS = 5
export const MIN_FOR_SOURCES = 10

/** Days between applying and the first status change away from Applied (or first round), where known. */
function replyDays(job: Job): number | null {
  const firstChange = (job.activityLog ?? [])
    .filter((a) => a.action === 'Status Changed' && a.newValue && a.newValue !== 'applied')
    .map((a) => dayOf(a.timestamp))
    .sort()[0]
  const firstRound = (job.interviews ?? []).map((r) => r.date).filter(Boolean).sort()[0]
  const first = [firstChange, firstRound].filter(Boolean).sort()[0]
  if (!first) return null
  return Math.max(0, daysFrom(job.dateApplied, first))
}

export type Range = '30' | '90' | 'all'

export function buildAnalytics(allJobs: Job[], today: string, range: Range = 'all') {
  const since = range === 'all' ? null : addDays(today, -Number(range))
  const jobs = since ? allJobs.filter((j) => j.dateApplied >= since) : allJobs
  const n = jobs.length
  const replies = jobs.filter(replied)
  const reached = jobs.filter((j) => ['interview', 'offer', 'accepted'].includes(j.status)).length
  const days = jobs.map(replyDays).filter((d): d is number => d !== null)
  const avg = days.length ? (days.reduce((t, d) => t + d, 0) / days.length).toFixed(1) : '—'

  const earliest = allJobs.map((j) => j.dateApplied).sort()[0]
  const weekCount =
    range === '30' ? 5 : range === '90' ? 13 : Math.min(26, Math.max(8, earliest ? Math.ceil(daysFrom(earliest, today) / 7) + 1 : 8))
  const weeks = []
  for (let w = weekCount - 1; w >= 0; w--) {
    const lo = addDays(today, -(7 * w + 6))
    const hi = addDays(today, -(7 * w))
    weeks.push({ isCurrent: w === 0, label: fd(lo), count: jobs.filter((j) => j.dateApplied >= lo && j.dateApplied <= hi).length })
  }

  const groups = new Map<string, { name: string; n: number; r: number }>()
  for (const j of jobs) {
    const k = sourceOf(j.jobUrl)
    const g = groups.get(k) ?? { name: k, n: 0, r: 0 }
    g.n++
    if (replied(j)) g.r++
    groups.set(k, g)
  }
  const sources = [...groups.values()].sort((a, b) => b.r / b.n - a.r / a.n || b.n - a.n)
  const best = sources.filter((s) => s.n >= 3)[0]

  const offers = jobs.filter((j) => j.status === 'offer' || j.status === 'accepted').length
  const accepted = jobs.filter((j) => j.status === 'accepted').length
  const funnel = [
    { key: 'Applied', value: n },
    { key: 'Replied', value: replies.length },
    { key: 'Interview', value: reached },
    { key: 'Offer', value: offers },
    { key: 'Accepted', value: accepted },
  ].map((s) => ({ ...s, note: n ? `${Math.round((100 * s.value) / n)}% of applied` : undefined }))
  const stale = jobs.filter((j) => !replied(j) && daysFrom(j.dateApplied, today) >= 14).length

  return {
    count: n,
    totalCount: allJobs.length,
    funnel,
    stale,
    enoughForCharts: n >= MIN_FOR_CHARTS,
    enoughForInsight: n >= MIN_FOR_SOURCES && !!best,
    responseRate: n ? Math.round((100 * replies.length) / n) : 0,
    repliedCount: replies.length,
    interviewRate: n ? Math.round((100 * reached) / n) : 0,
    reachedCount: reached,
    avgDays: avg,
    daysCount: days.length,
    weeks,
    sources,
    best,
  }
}
