'use client'

import type { Job, JobStatus } from '@/app/page'
import { JobCard } from './job-card'

interface JobBoardProps {
  jobs: Job[]
  onUpdateJob: (id: string, updates: Partial<Job>) => void
  onDeleteJob: (id: string) => void
}

const columns: { status: JobStatus; label: string; color: string }[] = [
  { status: 'applied', label: 'Applied', color: 'border-chart-3' },
  { status: 'interview', label: 'Interview', color: 'border-chart-2' },
  { status: 'offer', label: 'Offer', color: 'border-chart-1' },
  { status: 'rejected', label: 'Rejected', color: 'border-chart-4' },
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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {columns.map((column) => (
        <div key={column.status} className="flex flex-col">
          <div
            className={`mb-3 border-l-4 ${column.color} bg-card px-4 py-3 text-sm font-semibold uppercase tracking-wide text-card-foreground`}
          >
            {column.label}
            <span className="ml-2 text-muted-foreground">
              {jobs.filter((job) => job.status === column.status).length}
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-3">
            {jobs
              .filter((job) => job.status === column.status)
              .map((job) => {
                const prevStatus = getPrevStatus(job.status)
                const nextStatus = getNextStatus(job.status)
                
                return (
                  <JobCard
                    key={job.id}
                    job={job}
                    onUpdate={onUpdateJob}
                    onDelete={onDeleteJob}
                    canMoveLeft={prevStatus !== null}
                    canMoveRight={nextStatus !== null}
                    onMoveLeft={
                      prevStatus
                        ? () => onUpdateJob(job.id, { status: prevStatus })
                        : undefined
                    }
                    onMoveRight={
                      nextStatus
                        ? () => onUpdateJob(job.id, { status: nextStatus })
                        : undefined
                    }
                  />
                )
              })}
            {jobs.filter((job) => job.status === column.status).length ===
              0 && (
              <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
                No jobs yet
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
