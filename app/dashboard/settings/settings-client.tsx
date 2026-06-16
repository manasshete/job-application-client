'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Profile } from '@/lib/data/profiles'
import type { JobStats } from './page'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { SUBSCRIPTION_LIMITS } from '@/lib/subscription'
import {
  Crown,
  Zap,
  CheckCircle2,
  Briefcase,
  CalendarClock,
  Trophy,
  XCircle,
  PartyPopper,
  AlertTriangle,
  ArrowUpCircle,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react'

interface SettingsClientProps {
  profile: Profile
  stats: JobStats
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

export function SettingsClient({ profile, stats }: SettingsClientProps) {
  const router = useRouter()
  const [subStatus, setSubStatus]       = useState(profile.subscription_status || 'active')
  const [isUpdatingSub, setIsUpdatingSub] = useState(false)
  const [subError, setSubError]         = useState<string | null>(null)
  const [subSuccess, setSubSuccess]     = useState<string | null>(null)

  const handleSubscriptionAction = async (action: 'cancel' | 'reactivate') => {
    setIsUpdatingSub(true)
    setSubError(null)
    setSubSuccess(null)
    try {
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update subscription')
      }

      setSubStatus(data.subscription_status)
      setSubSuccess(
        action === 'cancel'
          ? 'Your subscription has been cancelled. You will keep access until the end of your billing period.'
          : 'Your subscription has been reactivated successfully!'
      )
      router.refresh()
    } catch (error) {
      setSubError(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setIsUpdatingSub(false)
    }
  }

  const limits     = SUBSCRIPTION_LIMITS[profile.subscription_tier]
  const isPaid     = profile.subscription_tier !== 'free'
  const isCancelled = subStatus === 'cancelled'
  const tierLabel  = profile.subscription_tier.charAt(0).toUpperCase() + profile.subscription_tier.slice(1)
  const priceLabel = profile.subscription_tier === 'free' ? 'Free' : profile.subscription_tier === 'pro' ? '£10/month' : '£15/month'

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
            Manage your subscription and view your application stats
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

          {/* ── Subscription ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Subscription
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
                  {isCancelled && <Badge variant="destructive">Cancelled</Badge>}
                  {isPaid && !isCancelled && (
                    <Badge className="bg-green-600 hover:bg-green-600 text-white">Active</Badge>
                  )}
                  <Badge variant={isPaid ? 'default' : 'secondary'}>{priceLabel}</Badge>
                </div>
              </div>

              {/* Cancellation warning */}
              {isCancelled && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <span>
                    Your subscription is cancelled. You still have access to {tierLabel} features until the end of your billing period.
                  </span>
                </div>
              )}

              {/* Feature usage */}
              <div className="space-y-2 border-t border-border pt-4">
                <p className="text-sm font-medium text-foreground">Plan Features &amp; Usage</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                    <span>Jobs: {limits.maxJobs === -1 ? 'Unlimited' : `Up to ${limits.maxJobs}`}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                    <span>
                      AI Extractions:{' '}
                      {limits.aiExtractionLimit === -1
                        ? `Unlimited (${profile.ai_extractions_used ?? 0} used)`
                        : `${profile.ai_extractions_used ?? 0} / ${limits.aiExtractionLimit} used this month`}
                    </span>
                  </div>
                  {limits.hasDocumentGeneration && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                      <span>
                        Documents: {profile.documents_generated_this_month ?? 0} / {limits.documentGenerationLimit} used this month
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-border pt-4 space-y-3">

                {/* Feedback messages */}
                {subError && (
                  <p className="text-sm text-destructive" role="alert">{subError}</p>
                )}
                {subSuccess && (
                  <p className="text-sm text-green-600" role="status">{subSuccess}</p>
                )}

                {/* Free tier — prompt to upgrade */}
                {!isPaid && (
                  <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Upgrade to unlock unlimited jobs, AI resume tailoring, cover letter generation, and more.
                    </p>
                    <Button asChild className="w-full">
                      <Link href="/#pricing">
                        <ArrowUpCircle className="mr-2 h-4 w-4" />
                        View Plans &amp; Upgrade
                      </Link>
                    </Button>
                  </div>
                )}

                {/* Paid + active — show cancel */}
                {isPaid && !isCancelled && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" disabled={isUpdatingSub} className="w-full">
                        {isUpdatingSub ? 'Cancelling...' : 'Cancel Subscription'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel your {tierLabel} subscription?</AlertDialogTitle>
                        <AlertDialogDescription>
                          You&apos;ll keep access to {tierLabel} features until the end of your current billing period.
                          After that your account reverts to the Free plan. All your job data stays safe.
                          You can reactivate any time.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleSubscriptionAction('cancel')}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Yes, Cancel
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                {/* Paid + cancelled — show reactivate */}
                {isPaid && isCancelled && (
                  <Button
                    onClick={() => handleSubscriptionAction('reactivate')}
                    disabled={isUpdatingSub}
                    className="w-full"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {isUpdatingSub ? 'Reactivating...' : 'Reactivate Subscription'}
                  </Button>
                )}

              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
