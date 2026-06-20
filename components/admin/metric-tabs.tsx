'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Users,
  UserPlus,
  Activity,
  IndianRupee,
  TrendingUp,
  Zap,
  FileText,
  AlertTriangle,
  Repeat,
  Moon,
  Briefcase,
  CalendarDays,
  LifeBuoy,
  CreditCard,
} from 'lucide-react'
import {
  StatCard,
  TabLoading,
  TabError,
  useMetric,
  formatINR,
  formatPct,
} from './shared'

const CHART_COLORS = ['#2563eb', '#0891b2', '#64748b', '#f59e0b', '#dc2626']

function ChartCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

/* ============ TAB 1: USER METRICS ============ */
type UserMetrics = {
  total: number
  newThisMonth: number
  dau: number
  wau: number
  mau: number
  tierDistribution: { tier: string; count: number }[]
  growth: { month: string; signups: number }[]
}

export function UsersTab() {
  const { data, error, isLoading } = useMetric<UserMetrics>('users')
  if (isLoading) return <TabLoading />
  if (error) return <TabError message={error.message} />
  const m = data!.data

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value={m.total} icon={Users} />
        <StatCard label="New This Month" value={m.newThisMonth} icon={UserPlus} />
        <StatCard label="Active Today (DAU)" value={m.dau} icon={Activity} />
        <StatCard label="Monthly Active (MAU)" value={m.mau} icon={Activity} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Signups (last 6 months)">
          <ChartContainer
            config={{ signups: { label: 'Signups', color: CHART_COLORS[0] } }}
            className="h-[260px] w-full"
          >
            <LineChart data={m.growth} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={30} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="signups"
                stroke="var(--color-signups)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </ChartCard>
        <ChartCard title="Users by Tier">
          <ChartContainer
            config={{ count: { label: 'Users' } }}
            className="h-[260px] w-full"
          >
            <PieChart accessibilityLayer>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Pie data={m.tierDistribution} dataKey="count" nameKey="tier" innerRadius={50}>
                {m.tierDistribution.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="mt-2 flex justify-center gap-4">
            {m.tierDistribution.map((t, i) => (
              <div key={t.tier} className="flex items-center gap-1.5 text-xs">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                />
                {t.tier}: {t.count}
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  )
}

/* ============ TAB 2: REVENUE ============ */
type RevenueMetrics = {
  mrr: number
  arr: number
  arpu: number
  paidCount: number
  conversionRate: number
  revenueByTier: { tier: string; revenue: number; users: number }[]
}

export function RevenueTab() {
  const { data, error, isLoading } = useMetric<RevenueMetrics>('revenue')
  if (isLoading) return <TabLoading />
  if (error) return <TabError message={error.message} />
  const m = data!.data

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="MRR" value={formatINR(m.mrr)} icon={IndianRupee} />
        <StatCard label="ARR (projected)" value={formatINR(m.arr)} icon={TrendingUp} />
        <StatCard label="ARPU" value={formatINR(m.arpu)} hint="Avg revenue per user" />
        <StatCard
          label="Conversion Rate"
          value={formatPct(m.conversionRate)}
          hint={`${m.paidCount} paying users`}
        />
      </div>
      <ChartCard title="Revenue by Tier" description="Monthly recurring revenue contribution">
        <ChartContainer
          config={{ revenue: { label: 'Revenue (₹)', color: CHART_COLORS[0] } }}
          className="h-[280px] w-full"
        >
          <BarChart data={m.revenueByTier} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="tier" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} width={40} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </ChartCard>
    </div>
  )
}

/* ============ TAB 3: FEATURE USAGE ============ */
type FeatureUsage = {
  totalExtractions: number
  totalDocuments: number
  totalJobs: number
  totalSavedDocuments: number
  apiCost: number
  adoption: { feature: string; users: number }[]
}

export function FeaturesTab() {
  const { data, error, isLoading } = useMetric<FeatureUsage>('features')
  if (isLoading) return <TabLoading />
  if (error) return <TabError message={error.message} />
  const m = data!.data

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="AI Extractions" value={m.totalExtractions} icon={Zap} />
        <StatCard label="Documents Generated" value={m.totalDocuments} icon={FileText} />
        <StatCard label="Total Jobs Tracked" value={m.totalJobs} icon={Briefcase} />
        <StatCard
          label="Est. API Cost"
          value={formatINR(m.apiCost)}
          hint="This month, all users"
        />
      </div>
      <ChartCard title="Feature Adoption" description="Users who used each feature this month">
        <ChartContainer
          config={{ users: { label: 'Users', color: CHART_COLORS[1] } }}
          className="h-[260px] w-full"
        >
          <BarChart data={m.adoption} layout="vertical" accessibilityLayer>
            <CartesianGrid horizontal={false} />
            <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="feature"
              tickLine={false}
              axisLine={false}
              width={140}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="users" fill="var(--color-users)" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ChartContainer>
      </ChartCard>
    </div>
  )
}

/* ============ TAB 4: SYSTEM HEALTH ============ */
type SystemHealth = {
  extractionLimitHits: number
  documentLimitHits: number
  totalEvents7d: number
  loadByDay: { day: string; events: number }[]
}

export function HealthTab() {
  const { data, error, isLoading } = useMetric<SystemHealth>('health')
  if (isLoading) return <TabLoading />
  if (error) return <TabError message={error.message} />
  const m = data!.data

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Events (7 days)" value={m.totalEvents7d} icon={Activity} />
        <StatCard
          label="Extraction Limit Hits"
          value={m.extractionLimitHits}
          icon={AlertTriangle}
          hint="Users at extraction cap"
        />
        <StatCard
          label="Document Limit Hits"
          value={m.documentLimitHits}
          icon={AlertTriangle}
          hint="Users at document cap"
        />
      </div>
      <ChartCard title="Activity Volume (last 7 days)" description="Proxy for system load">
        <ChartContainer
          config={{ events: { label: 'Events', color: CHART_COLORS[0] } }}
          className="h-[260px] w-full"
        >
          <BarChart data={m.loadByDay} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={30} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="events" fill="var(--color-events)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </ChartCard>
    </div>
  )
}

/* ============ TAB 5: ENGAGEMENT ============ */
type EngagementMetrics = {
  retention7: number
  retention30: number
  dormant: number
  activeByDay: { day: string; active: number }[]
}

export function EngagementTab() {
  const { data, error, isLoading } = useMetric<EngagementMetrics>('engagement')
  if (isLoading) return <TabLoading />
  if (error) return <TabError message={error.message} />
  const m = data!.data

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="7-Day Retention" value={formatPct(m.retention7)} icon={Repeat} />
        <StatCard label="30-Day Retention" value={formatPct(m.retention30)} icon={Repeat} />
        <StatCard label="Dormant Users" value={m.dormant} icon={Moon} hint="No activity in 30 days" />
      </div>
      <ChartCard title="Active Users (last 14 days)">
        <ChartContainer
          config={{ active: { label: 'Active Users', color: CHART_COLORS[1] } }}
          className="h-[260px] w-full"
        >
          <LineChart data={m.activeByDay} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} minTickGap={20} />
            <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={30} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="active"
              stroke="var(--color-active)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </ChartCard>
    </div>
  )
}

/* ============ TAB 6: DATA INSIGHTS ============ */
type DataInsights = {
  totalJobs: number
  totalInterviews: number
  avgJobsPerUser: number
  statusDistribution: { status: string; count: number }[]
  topCompanies: { company: string; count: number }[]
}

export function InsightsTab() {
  const { data, error, isLoading } = useMetric<DataInsights>('insights')
  if (isLoading) return <TabLoading />
  if (error) return <TabError message={error.message} />
  const m = data!.data

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Jobs" value={m.totalJobs} icon={Briefcase} />
        <StatCard label="Total Interviews" value={m.totalInterviews} icon={CalendarDays} />
        <StatCard label="Avg Jobs / User" value={m.avgJobsPerUser.toFixed(1)} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Application Status Distribution">
          <ChartContainer
            config={{ count: { label: 'Jobs', color: CHART_COLORS[0] } }}
            className="h-[260px] w-full"
          >
            <BarChart data={m.statusDistribution} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="status" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={30} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </ChartCard>
        <ChartCard title="Top Companies" description="Most tracked across all users">
          {m.topCompanies.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No data yet</p>
          ) : (
            <ul className="space-y-3">
              {m.topCompanies.map((c, i) => (
                <li key={c.company} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    >
                      {i + 1}
                    </span>
                    {c.company}
                  </span>
                  <span className="font-medium text-muted-foreground">{c.count} jobs</span>
                </li>
              ))}
            </ul>
          )}
        </ChartCard>
      </div>
    </div>
  )
}

/* ============ TAB 7: SUPPORT ============ */
type SupportMetrics = {
  openTickets: number
  pastDue: number
  canceled: number
  note: string
}

export function SupportTab() {
  const { data, error, isLoading } = useMetric<SupportMetrics>('support')
  if (isLoading) return <TabLoading />
  if (error) return <TabError message={error.message} />
  const m = data!.data

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Open Tickets" value={m.openTickets} icon={LifeBuoy} />
        <StatCard label="Past Due Accounts" value={m.pastDue} icon={AlertTriangle} />
        <StatCard label="Canceled Accounts" value={m.canceled} icon={AlertTriangle} />
      </div>
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">{m.note}</p>
        </CardContent>
      </Card>
    </div>
  )
}

/* ============ TAB 8: PAYMENTS ============ */
type PaymentMetrics = {
  active: number
  pastDue: number
  canceled: number
  successRate: number
  statusBreakdown: { status: string; count: number }[]
}

export function PaymentsTab() {
  const { data, error, isLoading } = useMetric<PaymentMetrics>('payments')
  if (isLoading) return <TabLoading />
  if (error) return <TabError message={error.message} />
  const m = data!.data

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Subscriptions" value={m.active} icon={CreditCard} />
        <StatCard label="Payment Success Rate" value={formatPct(m.successRate)} icon={TrendingUp} />
        <StatCard label="Past Due" value={m.pastDue} icon={AlertTriangle} />
        <StatCard label="Canceled" value={m.canceled} icon={AlertTriangle} />
      </div>
      <ChartCard title="Subscription Status Breakdown">
        <ChartContainer
          config={{ count: { label: 'Accounts', color: CHART_COLORS[0] } }}
          className="h-[260px] w-full"
        >
          <BarChart data={m.statusBreakdown} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="status" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={30} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </ChartCard>
    </div>
  )
}
