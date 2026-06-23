'use client'

import { useRouter } from 'next/navigation'
import type { Profile } from '@/lib/data/profiles'
import type { TokenSummary } from '@/lib/data/tokens'
import type { JobStats } from './page'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PlanManager } from '@/components/plan-manager'
import { SUBSCRIPTION_LIMITS, SUBSCRIPTION_PRICING } from '@/lib/subscription'
import {
  Crown,
  Zap,
  CheckCircle2,
  Briefcase,
  CalendarClock,
  Trophy,
  XCircle,
  PartyPopper,
  ArrowLeft,
} from 'lucide-react'

interface SettingsClientProps {
  profile: Profile
  stats: JobStats
  tokenSummary: TokenSummary
}

const STATUS_META: Record<
  string,
  { label: string; icon: typeof Briefcase; className: string }
> = {
  applied:   { label: 'Applied',      icon: Briefcase,      className: 'text-blue-500' },
  interview: { label: 'Interviewing', icon: CalendarClock,   className: 'text-amber-500' },
  offer:     { label: 'Offers',       icon: Trophy,          className: 'text-violet-500' },
  accepted:  { label: 'Accepted',     icon: PartyPopper,     className: 'text-green-500' },
  rejected:  { label: 'Rejected',     icon: XCircle,         className: 'text-muted-foreground' },
}

export function SettingsClient({ profile, stats, tokenSummary }: SettingsClientProps) {
  const router = useRouter()

  const expiryLabel = tokenSummary.nextExpiry
    ? new Date(tokenSummary.nextExpiry).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null

  const limits     = SUBSCRIPTION_LIMITS[profile.subscription_tier]
  const isPaid     = profile.subscription_tier !== 'free'
  const tierLabel  = profile.subscription_tier.charAt(0).toUpperCase() + profile.subscription_tier.slice(1)
  const priceLabel = profile.subscription_tier === 'free'
    ? 'Free'
    : `₹${SUBSCRIPTION_PRICING[profile.subscription_tier]}/month`

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button onClick={() => router.back()} variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your plan and view your application stats
          </p>
        </div>

        <div className="space-y-6">

          {/* ── Job Statistics ── */}
          <Card>
            <CardHeader>
              <CardTitle>Application Statistics</CardTitle>
              <CardDescription>A snapshot of your job search activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-foreground">{stats.total}</span>
                <span className="text-sm text-muted-foreground">
                  total {stats.total === 1 ? 'application' : 'applications'}
                  {stats.total > 0 && ` · ${stats.activeApplications} active`}
                </span>
              </div>

              {stats.total === 0 ? (
                <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  You haven&apos;t added any jobs yet. Head to your dashboard to start tracking applications.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  {Object.entries(STATUS_META).map(([key, meta]) => {
                    const Icon = meta.icon
                    return (
                      <div
                        key={key}
                        className="flex flex-col items-center gap-1 rounded-lg border border-border bg-card p-4 text-center"
                      >
                        <Icon className={`h-5 w-5 ${meta.className}`} aria-hidden="true" />
                        <span className="text-2xl font-semibold text-foreground">
                          {stats.byStatus[key as keyof typeof stats.byStatus]}
                        </span>
                        <span className="text-xs text-muted-foreground">{meta.label}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Plan ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Plan
                {profile.subscription_tier === 'premium' && <Crown className="h-5 w-5 text-amber-500" />}
                {profile.subscription_tier === 'pro'     && <Zap   className="h-5 w-5 text-primary"   />}
              </CardTitle>
              <CardDescription>Your current plan and feature usage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">

              {/* Plan header row */}
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
                <div>
                  <p className="font-semibold text-foreground">{tierLabel} Plan</p>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isPaid && (
                    <Badge className="bg-green-600 hover:bg-green-600 text-white">Active</Badge>
                  )}
                  <Badge variant={isPaid ? 'default' : 'secondary'}>{priceLabel}</Badge>
                </div>
              </div>

              {/* Feature usage */}
              <div className="space-y-2 border-t border-border pt-4">
                <p className="text-sm font-medium text-foreground">Plan Features &amp; Token Balance</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                    <span>Jobs: {limits.maxJobs === -1 ? 'Unlimited' : `Up to ${limits.maxJobs}`}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                    <span>
                      AI Extraction tokens:{' '}
                      <span className="font-medium text-foreground">{tokenSummary.aiExtractionBalance}</span> remaining
                    </span>
                  </div>
                  {limits.hasDocumentGeneration && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                      <span>
                        Document Generation tokens:{' '}
                        <span className="font-medium text-foreground">{tokenSummary.documentGenerationBalance}</span> remaining
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                  <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <span>
                    Tokens are valid for 60 days from the date they are added to your account.
                    {expiryLabel
                      ? ` Your next batch of tokens expires on ${expiryLabel}.`
                      : ' You have no active tokens right now.'}
                  </span>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* ── Manage Plan ── */}
          <Card>
            <CardHeader>
              <CardTitle>Manage Plan</CardTitle>
              <CardDescription>
                Upgrade or switch your plan anytime. Pay as you go — top up to a higher tier when you
                need more, or switch down whenever you like.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PlanManager currentTier={profile.subscription_tier} />
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
