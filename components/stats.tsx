import type { Job } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { BriefcaseBusiness, CircleCheckBig, FileText, Users } from 'lucide-react'

interface StatsProps {
  jobs: Job[]
  documentLimit?: number
  documentsUsed?: number
}

export function Stats({ jobs, documentLimit = 0, documentsUsed = 0 }: StatsProps) {
  const activeCount = jobs.filter((job) => job.status !== 'rejected' && job.status !== 'accepted').length
  const interviewCount = jobs.filter((job) => job.status === 'interview').length
  const offerCount = jobs.filter((job) => job.status === 'offer' || job.status === 'accepted').length
  const documentsRemaining = Math.max(0, documentLimit - documentsUsed)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const weeklyCount = jobs.filter((job) => new Date(job.dateApplied) >= weekAgo).length
  const upcomingInterviews = jobs.reduce(
    (count, job) => count + (job.interviews?.filter((interview) => interview.status === 'scheduled').length ?? 0),
    0
  )

  const stats = [
    {
      label: 'Active applications',
      value: activeCount,
      note: weeklyCount > 0 ? `+${weeklyCount} this week` : 'Keep your pipeline moving',
      icon: BriefcaseBusiness,
    },
    {
      label: 'Interviews',
      value: interviewCount,
      note: upcomingInterviews > 0 ? `${upcomingInterviews} upcoming` : 'No interviews scheduled',
      icon: Users,
    },
    {
      label: 'Offers',
      value: offerCount,
      note: offerCount > 0 ? 'Review your next step' : 'Keep building momentum',
      icon: CircleCheckBig,
    },
    {
      label: 'AI documents',
      value: documentsUsed,
      note: documentLimit > 0 ? `${documentsRemaining} tokens left` : 'Upgrade to generate',
      icon: FileText,
    },
  ]

  return (
    <section aria-label="Application summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="animate-fade-up overflow-hidden shadow-sm">
          <CardContent className="flex items-start justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-card-foreground">{stat.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.note}</p>
            </div>
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <stat.icon className="h-5 w-5" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  )
}
