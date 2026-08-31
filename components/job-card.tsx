'use client'

import { useState } from 'react'
import type { Job, JobStatus } from '@/lib/types'
import { ChevronLeft, ChevronRight, ExternalLink, MoreHorizontal, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { JobDetailDialog } from './job-detail-dialog'
import { toSafeHref } from '@/lib/validation'

interface JobCardProps {
  job: Job
  onUpdate: (id: string, updates: Partial<Job>) => void
  onDelete: (id: string) => void
  canMoveLeft?: boolean
  canMoveRight?: boolean
  onMoveLeft?: () => void
  onMoveRight?: () => void
}

const statusMeta: Record<JobStatus, { label: string; color: string; soft: string }> = {
  applied: { label: 'Applied', color: 'var(--board-purple)', soft: 'color-mix(in srgb, var(--board-purple) 16%, transparent)' },
  interview: { label: 'Interviewing', color: 'var(--board-cyan)', soft: 'color-mix(in srgb, var(--board-cyan) 16%, transparent)' },
  offer: { label: 'Offer', color: 'var(--board-blue)', soft: 'color-mix(in srgb, var(--board-blue) 16%, transparent)' },
  accepted: { label: 'Accepted', color: 'var(--board-green)', soft: 'color-mix(in srgb, var(--board-green) 16%, transparent)' },
  rejected: { label: 'Closed', color: 'var(--board-red)', soft: 'color-mix(in srgb, var(--board-red) 14%, transparent)' },
}

export function JobCard({ job, onUpdate, onDelete, canMoveLeft, canMoveRight, onMoveLeft, onMoveRight }: JobCardProps) {
  const [open, setOpen] = useState(false)
  const meta = statusMeta[job.status]
  const scheduled = job.interviews?.filter((interview) => interview.status === 'scheduled') ?? []
  const nextInterview = scheduled.slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
  const documentCount = Math.min(2, Number(Boolean(job.notes)) + Number(Boolean(job.jobUrl)))

  return (
    <>
      <article className="dashboard-job-card" style={{ '--job-color': meta.color } as React.CSSProperties} onClick={() => setOpen(true)}>
        <div className="dashboard-job-head">
          <span className="dashboard-company-avatar" style={{ color: meta.color, background: meta.soft }}>{job.company.charAt(0).toUpperCase()}</span>
          <div className="min-w-0 flex-1">
            <h3>{job.position}</h3>
            {job.jobUrl ? (
              <a href={toSafeHref(job.jobUrl)} target="_blank" rel="noopener noreferrer" style={{ color: meta.color }} onClick={(event) => event.stopPropagation()}>
                {job.company}<ExternalLink aria-hidden="true" />
              </a>
            ) : <p style={{ color: meta.color }}>{job.company}</p>}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Actions for ${job.position}`} onClick={(event) => event.stopPropagation()}><MoreHorizontal /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
              <DropdownMenuLabel>Application</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setOpen(true)}>View details</DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {(Object.keys(statusMeta) as JobStatus[]).map((status) => <DropdownMenuItem key={status} disabled={status === job.status} onClick={() => onUpdate(job.id, { status })}>{statusMeta[status].label}</DropdownMenuItem>)}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(job.id)}><Trash2 />Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="dashboard-job-facts">
          <span>Applied {new Date(job.dateApplied).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          {job.location && <span>{job.location}</span>}
          {job.salary && <span>{job.salary}</span>}
        </div>
        {!!job.tags?.length && <div className="dashboard-card-tags">{job.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}
        {job.deadline && <div className="dashboard-deadline"><b>!</b> Deadline {new Date(job.deadline).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}</div>}
        <footer>
          <span className="dashboard-status-chip" style={{ color: meta.color, background: meta.soft }}>{meta.label}</span>
          {!!job.interviews?.length && <span>{job.interviews.length} {job.interviews.length === 1 ? 'round' : 'rounds'}</span>}
          {!!documentCount && <span>{documentCount} {documentCount === 1 ? 'doc' : 'docs'}</span>}
          <div className="dashboard-move-buttons">
            <button disabled={!canMoveLeft} onClick={(event) => { event.stopPropagation(); onMoveLeft?.() }} aria-label={`Move ${job.company} back`}><ChevronLeft /></button>
            <button disabled={!canMoveRight} onClick={(event) => { event.stopPropagation(); onMoveRight?.() }} aria-label={`Move ${job.company} forward`}><ChevronRight /></button>
          </div>
        </footer>
        {nextInterview && <div className="dashboard-next" style={{ color: meta.color }}>Next · {nextInterview.round} · {new Date(nextInterview.date).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })}</div>}
      </article>
      <JobDetailDialog job={job} open={open} onOpenChange={setOpen} onUpdateJob={(updates) => onUpdate(job.id, updates)} onDeleteJob={() => onDelete(job.id)} />
    </>
  )
}
