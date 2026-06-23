'use client'

import { Calendar, Building2, MapPin, ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Job, JobStatus } from '@/lib/types'
import { toSafeHref } from '@/lib/validation'

interface TimelineViewProps {
  jobs: Job[]
  onJobClick: (job: Job) => void
}

const statusColors: Record<JobStatus, string> = {
  applied:   'bg-blue-500',
  interview: 'bg-amber-500',
  offer:     'bg-green-500',
  rejected:  'bg-red-500',
  accepted:  'bg-emerald-500',
}

const statusLabels: Record<JobStatus, string> = {
  applied:   'Applied',
  interview: 'Interview',
  offer:     'Offer',
  rejected:  'Rejected',
  accepted:  'Accepted',
}

const statusBadgeVariant: Record<JobStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  applied:   'secondary',
  interview: 'secondary',
  offer:     'default',
  accepted:  'default',
  rejected:  'destructive',
}

export function TimelineView({ jobs, onJobClick }: TimelineViewProps) {
  const sortedJobs = [...jobs].sort(
    (a, b) => new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime()
  )

  const groupedByMonth: Record<string, Job[]> = {}
  sortedJobs.forEach((job) => {
    const date = new Date(job.dateApplied)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!groupedByMonth[key]) groupedByMonth[key] = []
    groupedByMonth[key].push(job)
  })

  let globalCardIdx = 0

  return (
    <div className="space-y-10">
      {Object.entries(groupedByMonth).map(([monthKey, monthJobs]) => {
        const [year, month] = monthKey.split('-')
        const monthName = new Date(Number(year), Number(month) - 1).toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        })

        return (
          <div key={monthKey} className="animate-fade-up">
            <h3 className="mb-4 text-base font-semibold text-foreground sm:text-lg">{monthName}</h3>
            <div className="relative space-y-4 border-l-2 border-border pl-5 sm:pl-6">
              {monthJobs.map((job) => {
                const delay = globalCardIdx++ * 50
                return (
                  <div
                    key={job.id}
                    className="animate-slide-in-left relative"
                    style={{ animationDelay: `${delay}ms` }}
                  >
                    {/* Timeline dot */}
                    <div
                      className={`absolute -left-[23px] top-3 h-4 w-4 rounded-full border-2 border-background transition-transform group-hover:scale-125 ${statusColors[job.status]}`}
                    />
                    <Card
                      className="card-hover btn-press cursor-pointer shadow-sm"
                      onClick={() => onJobClick(job)}
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                          <div className="flex-1 space-y-2">
                            {/* Position + status */}
                            <div className="flex flex-wrap items-center gap-2">
                              {job.jobUrl ? (
                                <a
                                  href={toSafeHref(job.jobUrl)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-base font-semibold text-primary underline-offset-4 hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {job.position}
                                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                                </a>
                              ) : (
                                <h4 className="text-base font-semibold text-card-foreground">
                                  {job.position}
                                </h4>
                              )}
                              <Badge variant={statusBadgeVariant[job.status]} className="text-xs">
                                {statusLabels[job.status]}
                              </Badge>
                            </div>

                            {/* Meta row */}
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5 shrink-0" />
                                <span>{job.company}</span>
                              </div>
                              {job.location && (
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                                  <span>{job.location}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 shrink-0" />
                                <span>{new Date(job.dateApplied).toLocaleDateString()}</span>
                              </div>
                            </div>

                            {/* Tags */}
                            {job.tags && job.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {job.tags.map((tag: string) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {Object.keys(groupedByMonth).length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 py-16 text-center text-muted-foreground">
          No applications yet
        </div>
      )}
    </div>
  )
}
