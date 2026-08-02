'use client'

import type { Job } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Briefcase, Clock, CheckCircle2, TrendingUp, FileText } from 'lucide-react'

interface StatsProps {
  jobs: Job[]
  documentLimit?: number
  documentsUsed?: number
}

export function Stats({ jobs, documentLimit = 0, documentsUsed = 0 }: StatsProps) {
  const offerCount = jobs.filter((j) => j.status === 'offer' || j.status === 'accepted').length
  const interviewRate = jobs.length > 0
    ? Math.round((jobs.filter((j) => j.status !== 'applied').length / jobs.length) * 100)
    : 0
  const documentsRemaining = Math.max(0, documentLimit - documentsUsed)

  const stats = [
    {
      label: 'Total Applications',
      value: jobs.length,
      icon: Briefcase,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      label: 'Applied',
      value: jobs.filter((j) => j.status === 'applied').length,
      icon: Clock,
      iconBg: 'bg-chart-3/10',
      iconColor: 'text-chart-3',
    },
    {
      label: 'Interviews',
      value: jobs.filter((j) => j.status === 'interview').length,
      icon: CheckCircle2,
      iconBg: 'bg-chart-2/10',
      iconColor: 'text-chart-2',
    },
    ...(documentLimit > 0 ? [{
      label: 'AI Documents',
      value: `${documentsRemaining}/${documentLimit}`,
      icon: FileText,
      iconBg: 'bg-violet-500/10',
      iconColor: 'text-violet-500',
    }] : []),
    {
      label: 'Offers',
      value: offerCount,
      icon: TrendingUp,
      iconBg: 'bg-chart-1/10',
      iconColor: 'text-chart-1',
    },
  ]

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 stagger-children sm:gap-4 md:grid-cols-4">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className="animate-fade-up card-hover overflow-hidden shadow-sm"
        >
          <CardContent className="flex items-center gap-3 p-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.iconBg}`}>
              <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold tabular-nums text-card-foreground">
                {stat.value}
              </p>
              <p className="truncate text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
