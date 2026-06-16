'use client'

import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, type LucideIcon } from 'lucide-react'

export const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'Failed to load data')
  }
  return res.json()
}

/** SWR hook for a given metrics tab */
export function useMetric<T>(tab: string) {
  return useSWR<{ data: T }>(`/api/admin/metrics?tab=${tab}`, fetcher, {
    revalidateOnFocus: false,
  })
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string
  value: string | number
  hint?: string
  icon?: LucideIcon
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        {Icon ? <Icon className="h-4 w-4 text-muted-foreground" aria-hidden /> : null}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  )
}

export function TabLoading() {
  return (
    <div className="flex items-center justify-center py-20 text-muted-foreground">
      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      Loading metrics...
    </div>
  )
}

export function TabError({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      {message}
    </div>
  )
}

const GBP = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 2,
})

export function formatGBP(n: number): string {
  return GBP.format(n)
}

export function formatPct(n: number): string {
  return `${n.toFixed(1)}%`
}
