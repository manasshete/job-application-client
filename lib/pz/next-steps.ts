import type { Job } from '@/lib/types'
import { daysFrom, fd, ft, minutes, weekday, when } from './format'

export interface NextItem {
  key: string
  jobId: string
  /** 0 = today, 1 = this week, 2 = later */
  group: 0 | 1 | 2
  sort: number
  kind: 'Interview' | 'Task' | 'Deadline' | 'Follow up'
  title: string
  sub: string
  gutter: string
}

export const NEXT_GROUPS = ['Today', 'This week', 'Later'] as const

const OPEN_STATUSES = ['applied', 'interview', 'offer']

const isOpenRound = (status: string) => status === 'scheduled' || status === 'pending'
const isOpenTask = (status: string) => status === 'pending' || status === 'in-progress'

/** Has the company responded in any way? */
export function replied(job: Job): boolean {
  return job.status !== 'applied' || (job.interviews?.length ?? 0) > 0
}

/** Everything that needs the user, across all jobs, unsorted. */
export function nextItems(jobs: Job[], today: string): NextItem[] {
  const out: NextItem[] = []
  for (const job of jobs) {
    const sub = `${job.company} — ${job.position}`

    for (const r of job.interviews ?? []) {
      if (!isOpenRound(r.status) || !r.date) continue
      const d = daysFrom(today, r.date)
      if (d < 0) continue
      out.push({
        key: `r${r.id}`,
        jobId: job.id,
        group: d === 0 ? 0 : d < 7 ? 1 : 2,
        sort: d * 1440 + minutes(r.time),
        kind: 'Interview',
        title: r.round,
        sub,
        gutter: d === 0 ? ft(r.time) || 'Today' : d < 7 ? `${weekday(r.date)} ${ft(r.time)}`.trim() : fd(r.date),
      })
    }

    for (const t of job.tasks ?? []) {
      if (!isOpenTask(t.status) || !t.dueDate) continue
      const d = daysFrom(today, t.dueDate)
      out.push({
        key: `t${t.id}`,
        jobId: job.id,
        group: d <= 0 ? 0 : d < 7 ? 1 : 2,
        sort: Math.max(d, 0) * 1440 + 720,
        kind: 'Task',
        title: t.title,
        sub: `${sub} · ${t.status === 'in-progress' ? 'In progress' : 'Pending'}`,
        gutter: d < 0 ? 'Overdue' : d === 0 ? 'Due today' : d < 7 ? `Due ${weekday(t.dueDate)}` : `Due ${fd(t.dueDate)}`,
      })
    }

    if (job.deadline && OPEN_STATUSES.includes(job.status)) {
      const d = daysFrom(today, job.deadline)
      if (d >= 0) {
        out.push({
          key: `d${job.id}`,
          jobId: job.id,
          group: d === 0 ? 0 : d < 7 ? 1 : 2,
          sort: d * 1440 + 600,
          kind: 'Deadline',
          title: job.status === 'offer' ? 'Offer response due' : 'Response deadline',
          sub,
          gutter: d === 0 ? 'Today' : d < 7 ? weekday(job.deadline) : fd(job.deadline),
        })
      }
    }

    if (job.status === 'applied') {
      const n = -daysFrom(today, job.dateApplied)
      if (n >= 7) {
        out.push({ key: `f${job.id}`, jobId: job.id, group: 1, sort: 6 * 1440 + 1000, kind: 'Follow up', title: `No reply in ${n} days — consider following up`, sub, gutter: `${n} days` })
      }
    }
  }
  return out
}

export function nextGroups(jobs: Job[], today: string) {
  const items = nextItems(jobs, today).sort((a, b) => a.sort - b.sort)
  return NEXT_GROUPS.map((label, i) => ({ label, items: items.filter((x) => x.group === i) })).filter((g) => g.items.length)
}

/** The one-line "next step" shown in the table and on board cards. */
export function nextStep(job: Job, today: string, suggestTailor = false): string {
  if (suggestTailor) return 'Suggested: tailor your CV'

  const round = (job.interviews ?? [])
    .filter((r) => isOpenRound(r.status) && r.date && daysFrom(today, r.date) >= 0)
    .sort((a, b) => (a.date + (a.time ?? '')).localeCompare(b.date + (b.time ?? '')))[0]
  if (round) return `${round.round}, ${when(today, round.date)}${round.time ? ` ${ft(round.time)}` : ''}`

  const task = (job.tasks ?? []).filter((t) => isOpenTask(t.status) && t.dueDate).sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1))[0]
  if (task) return task.title + (daysFrom(today, task.dueDate!) < 0 ? ' (overdue)' : `, due ${when(today, task.dueDate!)}`)

  if (job.deadline && daysFrom(today, job.deadline) >= 0 && OPEN_STATUSES.includes(job.status)) {
    return `${job.status === 'offer' ? 'Respond to offer by ' : 'Respond by '}${when(today, job.deadline)}`
  }
  if (job.status === 'applied') {
    const n = -daysFrom(today, job.dateApplied)
    return n >= 7 ? `No reply in ${n} days — follow up` : 'Waiting for a reply'
  }
  if (job.status === 'interview') return 'Waiting to hear back'
  if (job.status === 'offer') return 'Review the offer'
  return '—'
}

/** Interviews in the next 7 days. */
export function interviewsThisWeek(jobs: Job[], today: string): number {
  return jobs.reduce(
    (n, j) => n + (j.interviews ?? []).filter((r) => isOpenRound(r.status) && r.date && daysFrom(today, r.date) >= 0 && daysFrom(today, r.date) < 7).length,
    0,
  )
}

export const isActive = (job: Job) => OPEN_STATUSES.includes(job.status)
