'use client'

import type { Job } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Briefcase, Clock, CheckCircle2, XCircle } from 'lucide-react'

interface StatsProps {
  jobs: Job[]
}

export function Stats({ jobs }: StatsProps) {
  const stats = [
    {
      label: 'Total Applications',
      value: jobs.length,
      icon: Briefcase,
      color: 'text-primary',
    },
    {
      label: 'Applied',
      value: jobs.filter((j) => j.status === 'applied').length,
      icon: Clock,
      color: 'text-chart-3',
    },
    {
      label: 'Interviews',
      value: jobs.filter((j) => j.status === 'interview').length,
      icon: CheckCircle2,
      color: 'text-chart-2',
    },
    {
      label: 'Offers',
      value: jobs.filter((j) => j.status === 'offer').length,
      icon: CheckCircle2,
      color: 'text-chart-1',
    },
  ]

  return (
    <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="flex items-center gap-3 p-4">
            <stat.icon className={`h-8 w-8 ${stat.color}`} />
            <div>
              <p className="text-2xl font-bold text-card-foreground">
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
