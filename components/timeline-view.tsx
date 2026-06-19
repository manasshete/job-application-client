'use client';

import { Calendar, Building2, MapPin, ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Job, JobStatus } from '@/app/page'

interface TimelineViewProps {
  jobs: Job[]
  onJobClick: (job: Job) => void
}

const statusColors: Record<JobStatus, string> = {
  applied: 'bg-blue-500',
  interview: 'bg-amber-500',
  offer: 'bg-green-500',
  rejected: 'bg-red-500',
}

const statusLabels: Record<JobStatus, string> = {
  applied: 'Applied',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
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

  return (
    <div className="space-y-8">
      {Object.entries(groupedByMonth).map(([monthKey, monthJobs]) => {
        const [year, month] = monthKey.split('-')
        const monthName = new Date(Number(year), Number(month) - 1).toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        })

        return (
          <div key={monthKey}>
            <h3 className="mb-4 text-lg font-semibold">{monthName}</h3>
            <div className="relative space-y-4 border-l-2 border-border pl-6">
              {monthJobs.map((job) => (
                <div key={job.id} className="relative">
                  <div
                    className={`absolute -left-[27px] top-2 h-4 w-4 rounded-full border-2 border-background ${statusColors[job.status]}`}
                  />
                  <Card
                    className="cursor-pointer transition-all hover:shadow-md"
                    onClick={() => onJobClick(job)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            {job.jobUrl ? (
                              <a
                                href={/^https?:\/\//i.test(job.jobUrl!) ? job.jobUrl! : `https://${job.jobUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-base font-semibold text-primary underline-offset-4 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {job.position}
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            ) : (
                              <h4 className="text-base font-semibold">{job.position}</h4>
                            )}
                            <Badge variant="secondary" className="text-xs">
                              {statusLabels[job.status]}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="h-4 w-4" />
                              {job.company}
                            </div>
                            {job.location && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-4 w-4" />
                                {job.location}
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4" />
                              {new Date(job.dateApplied).toLocaleDateString()}
                            </div>
                          </div>
                          {job.tags && job.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {job.tags.map((tag) => (
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
              ))}
            </div>
          </div>
        )
      })}
      {Object.keys(groupedByMonth).length === 0 && (
        <div className="text-center text-muted-foreground">No applications yet</div>
      )}
    </div>
  )
}
