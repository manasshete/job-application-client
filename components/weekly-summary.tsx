import { Calendar, TrendingUp, Clock, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Job } from '@/lib/types'

interface WeeklySummaryProps {
  jobs: Job[]
}

export function WeeklySummary({ jobs }: WeeklySummaryProps) {
  const now = new Date()
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const weeklyApplications = jobs.filter(
    (job) => new Date(job.dateApplied) >= oneWeekAgo
  ).length

  const totalApplied = jobs.filter((j) => j.status !== 'rejected').length
  const totalInterviews = jobs.filter((j) => j.status === 'interview' || j.status === 'offer').length
  const responseRate = totalApplied > 0 ? Math.round((totalInterviews / totalApplied) * 100) : 0

  const interviewJobs = jobs.filter(
    (j) => (j.status === 'interview' || j.status === 'offer') && j.dateApplied
  )
  const avgTimeToInterview =
    interviewJobs.length > 0
      ? Math.round(
          interviewJobs.reduce((acc, job) => {
            const applied = new Date(job.dateApplied).getTime()
            const diff = now.getTime() - applied
            return acc + diff / (1000 * 60 * 60 * 24)
          }, 0) / interviewJobs.length
        )
      : 0

  const upcomingDeadlines = jobs.filter((job) => {
    if (!job.deadline) return false
    const deadlineDate = new Date(job.deadline)
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    return deadlineDate >= now && deadlineDate <= threeDaysFromNow
  }).length

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Weekly Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{weeklyApplications}</p>
              <p className="text-xs text-muted-foreground">This Week</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{responseRate}%</p>
              <p className="text-xs text-muted-foreground">Response Rate</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{avgTimeToInterview || '-'}</p>
              <p className="text-xs text-muted-foreground">Avg Days to Interview</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{upcomingDeadlines}</p>
              <p className="text-xs text-muted-foreground">Deadlines Soon</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
