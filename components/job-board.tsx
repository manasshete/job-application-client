'use client'

import type { Job, JobStatus } from '@/lib/types'
import { JobCard } from './job-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreHorizontal } from 'lucide-react'

interface JobBoardProps {
  jobs: Job[]
  onUpdateJob: (id: string, updates: Partial<Job>) => void
  onDeleteJob: (id: string) => void
}

const columns: { status: JobStatus; label: string; dot: string }[] = [
  { status: 'applied', label: 'Applied', dot: 'bg-blue-500' },
  { status: 'interview', label: 'Interview', dot: 'bg-amber-500' },
  { status: 'offer', label: 'Offer', dot: 'bg-emerald-500' },
  { status: 'rejected', label: 'Closed', dot: 'bg-slate-400' },
]

const movementOrder: JobStatus[] = ['applied', 'interview', 'offer', 'rejected']

export function JobBoard({ jobs, onUpdateJob, onDeleteJob }: JobBoardProps) {
  const adjacentStatus = (status: JobStatus, direction: -1 | 1): JobStatus | null => {
    if (status === 'accepted') return direction === -1 ? 'offer' : null
    const index = movementOrder.indexOf(status)
    const nextIndex = index + direction
    return nextIndex >= 0 && nextIndex < movementOrder.length ? movementOrder[nextIndex] : null
  }

  return (
    <>
      <section
        aria-label="Application board"
        className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {columns.map((column, columnIndex) => {
          const columnJobs = jobs.filter((job) =>
            column.status === 'offer'
              ? job.status === 'offer' || job.status === 'accepted'
              : job.status === column.status
          )

          return (
            <section
              key={column.status}
              className="w-[84vw] min-w-[290px] shrink-0 snap-start rounded-2xl bg-muted/45 p-3 sm:w-auto sm:min-w-0"
              style={{ animationDelay: `${columnIndex * 60}ms` }}
              aria-labelledby={`column-${column.status}`}
            >
              <header className="flex items-center justify-between px-1 pb-3">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${column.dot}`} aria-hidden="true" />
                  <h2 id={`column-${column.status}`} className="font-semibold">{column.label}</h2>
                  <Badge variant="outline" className="h-5 px-1.5 text-[11px]">{columnJobs.length}</Badge>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`${column.label} column options`} disabled>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </header>

              <div className="flex flex-col gap-3">
                {columnJobs.map((job, cardIndex) => {
                  const previousStatus = adjacentStatus(job.status, -1)
                  const nextStatus = adjacentStatus(job.status, 1)
                  return (
                    <div
                      key={job.id}
                      className="animate-fade-up"
                      style={{ animationDelay: `${columnIndex * 40 + cardIndex * 50}ms` }}
                    >
                      <JobCard
                        job={job}
                        onUpdate={onUpdateJob}
                        onDelete={onDeleteJob}
                        canMoveLeft={previousStatus !== null}
                        canMoveRight={nextStatus !== null}
                        onMoveLeft={previousStatus ? () => onUpdateJob(job.id, { status: previousStatus }) : undefined}
                        onMoveRight={nextStatus ? () => onUpdateJob(job.id, { status: nextStatus }) : undefined}
                      />
                    </div>
                  )
                })}
                {columnJobs.length === 0 && (
                  <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed border-border bg-card/35 p-8 text-center text-sm text-muted-foreground">
                    No applications here
                  </div>
                )}
              </div>
            </section>
          )
        })}
      </section>
      {jobs.length > 0 && <p className="mt-3 text-center text-xs text-muted-foreground sm:hidden">Swipe to see all columns</p>}
    </>
  )
}
