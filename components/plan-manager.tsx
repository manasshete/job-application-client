'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RazorpayCheckout } from '@/components/razorpay-checkout'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  SUBSCRIPTION_PRICING,
  type SubscriptionTier,
} from '@/lib/subscription'
import { Crown, Zap, Sparkles, CheckCircle2, ArrowDownCircle, Loader2 } from 'lucide-react'

interface PlanManagerProps {
  currentTier: SubscriptionTier
}

const TIER_RANK: Record<SubscriptionTier, number> = { free: 0, pro: 1, premium: 2 }

const TIER_META: Record<
  SubscriptionTier,
  { label: string; icon: typeof Zap; blurb: string; features: string[] }
> = {
  free: {
    label: 'Free',
    icon: Sparkles,
    blurb: 'Perfect for getting started',
    features: ['Up to 10 job applications', '5 AI extractions/month', 'Basic application tracking'],
  },
  pro: {
    label: 'Pro',
    icon: Zap,
    blurb: 'For active job seekers',
    features: ['Unlimited applications', '200 AI extractions/month', 'AI resume & cover letters', '200 documents/month'],
  },
  premium: {
    label: 'Premium',
    icon: Crown,
    blurb: 'Maximum AI power',
    features: ['Everything in Pro', '500 AI extractions/month', '500 documents/month', 'Priority support'],
  },
}

const ORDER: SubscriptionTier[] = ['free', 'pro', 'premium']

export function PlanManager({ currentTier }: PlanManagerProps) {
  const router = useRouter()
  const [pendingDowngrade, setPendingDowngrade] = useState<SubscriptionTier | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDowngrade = async (tier: SubscriptionTier) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/subscription/change-tier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to change plan')
      }
      setPendingDowngrade(null)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change plan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {ORDER.map((tier) => {
          const meta = TIER_META[tier]
          const Icon = meta.icon
          const isCurrent = tier === currentTier
          const isUpgrade = TIER_RANK[tier] > TIER_RANK[currentTier]
          const isDowngrade = TIER_RANK[tier] < TIER_RANK[currentTier]
          const price = SUBSCRIPTION_PRICING[tier]

          return (
            <div
              key={tier}
              className={`flex flex-col rounded-xl border p-5 ${
                isCurrent ? 'border-primary bg-primary/5' : 'border-border bg-card'
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${tier === 'premium' ? 'text-amber-500' : tier === 'pro' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="font-semibold text-foreground">{meta.label}</span>
                </div>
                {isCurrent && <Badge>Current</Badge>}
              </div>

              <div className="mb-1 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-foreground">{price === 0 ? 'Free' : `£${price}`}</span>
                {price > 0 && <span className="text-sm text-muted-foreground">/month</span>}
              </div>
              <p className="mb-4 text-xs text-muted-foreground">{meta.blurb}</p>

              <ul className="mb-5 space-y-2">
                {meta.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                {isCurrent && (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                )}
                {isUpgrade && (
                  <RazorpayCheckout
                    tier={tier as 'pro' | 'premium'}
                    onSuccess={() => router.refresh()}
                    onError={(msg) => setError(msg)}
                  />
                )}
                {isDowngrade && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setPendingDowngrade(tier)}
                    disabled={loading}
                  >
                    <ArrowDownCircle className="mr-2 h-4 w-4" />
                    {tier === 'free' ? 'Downgrade to Free' : `Switch to ${meta.label}`}
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <AlertDialog open={pendingDowngrade !== null} onOpenChange={(open) => !open && setPendingDowngrade(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingDowngrade === 'free'
                ? 'Downgrade to the Free plan?'
                : `Switch to the ${pendingDowngrade ? TIER_META[pendingDowngrade].label : ''} plan?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDowngrade === 'free'
                ? 'You will lose access to unlimited jobs, AI resume tailoring, cover letter generation, and other paid features. This change takes effect immediately. You can top up again anytime.'
                : 'Your plan limits will be reduced to match the lower tier. This change takes effect immediately. You can upgrade again anytime.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Keep current plan</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                if (pendingDowngrade) handleDowngrade(pendingDowngrade)
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Confirm change'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
