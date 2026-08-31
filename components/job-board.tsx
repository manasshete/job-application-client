'use client'

import type { Job, JobStatus } from '@/lib/types'
import { JobCard } from './job-card'

interface JobBoardProps {
  jobs: Job[]
  onUpdateJob: (id: string, updates: Partial<Job>) => void
  onDeleteJob: (id: string) => void
}

const columns: { status: JobStatus; label: string; tone: string }[] = [
  { status: 'applied', label: 'Applied', tone: 'var(--board-purple)' },
  { status: 'interview', label: 'Interview', tone: 'var(--board-cyan)' },
  { status: 'offer', label: 'Offer', tone: 'var(--board-blue)' },
  { status: 'accepted', label: 'Accepted', tone: 'var(--board-green)' },
  { status: 'rejected', label: 'Rejected', tone: 'var(--board-red)' },
]

const movementOrder = columns.map((column) => column.status)

export function JobBoard({ jobs, onUpdateJob, onDeleteJob }: JobBoardProps) {
  return (
    <section aria-label="Application board" className="dashboard-kanban">
      {columns.map((column) => {
        const columnJobs = jobs.filter((job) => job.status === column.status)
        return (
          <section key={column.status} className="dashboard-column" aria-labelledby={`column-${column.status}`}>
            <header style={{ borderColor: column.tone }}>
              <span className="dashboard-column-dot" style={{ background: column.tone }} aria-hidden="true" />
              <h2 id={`column-${column.status}`}>{column.label}</h2>
              <b>{columnJobs.length}</b>
            </header>
            <div className="flex flex-col gap-2.5">
              {columnJobs.map((job) => {
                const index = movementOrder.indexOf(job.status)
                return (
                  <JobCard
                    key={job.id}
                    job={job}
                    onUpdate={onUpdateJob}
                    onDelete={onDeleteJob}
                    canMoveLeft={index > 0}
                    canMoveRight={index < movementOrder.length - 1}
                    onMoveLeft={index > 0 ? () => onUpdateJob(job.id, { status: movementOrder[index - 1] }) : undefined}
                    onMoveRight={index < movementOrder.length - 1 ? () => onUpdateJob(job.id, { status: movementOrder[index + 1] }) : undefined}
                  />
                )
              })}
              {columnJobs.length === 0 && <div className="dashboard-empty-column">Drop a card here</div>}
            </div>
          </section>
        )
      })}
    </section>
  )
}
