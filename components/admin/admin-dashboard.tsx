'use client'

import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ShieldCheck, ArrowLeft } from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import { AccountManager } from './account-manager'
import {
  UsersTab,
  RevenueTab,
  FeaturesTab,
  HealthTab,
  EngagementTab,
  InsightsTab,
  SupportTab,
  PaymentsTab,
} from './metric-tabs'

const TABS = [
  { value: 'users', label: 'Users', Component: UsersTab },
  { value: 'revenue', label: 'Revenue', Component: RevenueTab },
  { value: 'features', label: 'Feature Usage', Component: FeaturesTab },
  { value: 'health', label: 'System Health', Component: HealthTab },
  { value: 'engagement', label: 'Engagement', Component: EngagementTab },
  { value: 'insights', label: 'Data Insights', Component: InsightsTab },
  { value: 'support', label: 'Support', Component: SupportTab },
  { value: 'payments', label: 'Payments', Component: PaymentsTab },
] as const

export function AdminDashboard({ adminEmail }: { adminEmail: string }) {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <BrandLogo markClassName="h-9 w-9" wordmarkClassName="text-lg" />
            <div>
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" /> Admin · {adminEmail}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to App
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
        <section aria-label="Account management">
          <AccountManager />
        </section>

        <section aria-label="Analytics">
          <h2 className="mb-4 text-base font-semibold tracking-tight">Analytics</h2>
          <Tabs defaultValue="users">
            <div className="overflow-x-auto pb-2">
              <TabsList className="inline-flex w-max">
                {TABS.map((t) => (
                  <TabsTrigger key={t.value} value={t.value}>
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            {TABS.map(({ value, Component }) => (
              <TabsContent key={value} value={value} className="mt-6">
                <Component />
              </TabsContent>
            ))}
          </Tabs>
        </section>
      </main>
    </div>
  )
}
