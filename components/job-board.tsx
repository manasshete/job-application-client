'use client'

import type { Job, JobStatus } from '@/lib/types'
import { JobCard } from './job-card'

interface JobBoardProps {
  jobs: Job[]
  onUpdateJob: (id: string, updates: Partial<Job>) => void
  onDeleteJob: (id: string) => void
}

const columns: { status: JobStatus; label: string; color: string; dot: string }[] = [
  { status: 'applied',   label: 'Applied',   color: 'border-l-chart-3', dot: 'bg-chart-3' },
  { status: 'interview', label: 'Interview', color: 'border-l-chart-2', dot: 'bg-chart-2' },
  { status: 'offer',     label: 'Offer',     color: 'border-l-chart-1', dot: 'bg-chart-1' },
  { status: 'rejected',  label: 'Rejected',  color: 'border-l-chart-5', dot: 'bg-chart-5' },
]

export function JobBoard({ jobs, onUpdateJob, onDeleteJob }: JobBoardProps) {
  const getNextStatus = (currentStatus: JobStatus): JobStatus | null => {
    const currentIndex = columns.findIndex((col) => col.status === currentStatus)
    if (currentIndex >= 0 && currentIndex < columns.length - 1) {
      return columns[currentIndex + 1].status
    }
    return null
  }

  const getPrevStatus = (currentStatus: JobStatus): JobStatus | null => {
    const currentIndex = columns.findIndex((col) => col.status === currentStatus)
    if (currentIndex > 0) {
      return columns[currentIndex - 1].status
    }
    return null
  }

  return (
    <>
      {/*
        Mobile layout: horizontal scroll with snap-x mandatory.
        Each column is 80vw wide so the next column peeks in, hinting at scroll.
        Desktop: standard 4-column grid.
      */}
      <div
        className="
          -mx-4 flex gap-4 overflow-x-auto px-4 pb-4
          snap-x snap-mandatory
          scrollbar-none
          sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0
          lg:grid-cols-4
        "
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {columns.map((column, colIdx) => {
          const colJobs = jobs.filter((job) => job.status === column.status)
          return (
            <div
              key={column.status}
              className="
                flex w-[80vw] min-w-[280px] shrink-0 flex-col
                snap-start
                sm:w-auto sm:min-w-0
              "
              style={{ animationDelay: `${colIdx * 60}ms` }}
            >
              {/* Column header */}
              <div
                className={`
                  mb-3 flex items-center gap-2.5 rounded-lg border-l-4 ${column.color}
                  bg-card px-4 py-3 shadow-sm
                `}
              >
                <span className={`h-2 w-2 rounded-full ${column.dot}`} />
                <span className="text-sm font-semibold uppercase tracking-wide text-card-foreground">
                  {column.label}
                </span>
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  {colJobs.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-1 flex-col gap-3">
                {colJobs.map((job, cardIdx) => {
                  const prevStatus = getPrevStatus(job.status)
                  const nextStatus = getNextStatus(job.status)
                  return (
                    <div
                      key={job.id}
                      className="animate-fade-up"
                      style={{ animationDelay: `${colIdx * 40 + cardIdx * 50}ms` }}
                    >
                      <JobCard
                        job={job}
                        onUpdate={onUpdateJob}
                        onDelete={onDeleteJob}
                        canMoveLeft={prevStatus !== null}
                        canMoveRight={nextStatus !== null}
                        onMoveLeft={
                          prevStatus ? () => onUpdateJob(job.id, { status: prevStatus }) : undefined
                        }
                        onMoveRight={
                          nextStatus ? () => onUpdateJob(job.id, { status: nextStatus }) : undefined
                        }
                      />
                    </div>
                  )
                })}
                {colJobs.length === 0 && (
                  <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
                    No jobs yet
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Mobile scroll hint — only shown when board has jobs */}
      {jobs.length > 0 && (
        <p className="mt-3 text-center text-xs text-muted-foreground sm:hidden">
          Swipe to see all columns
        </p>
      )}
    </>
  )
}
