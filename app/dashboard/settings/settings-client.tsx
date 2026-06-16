'use client'

import { useState } from 'react'
import type { Profile } from '@/lib/data/profiles'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SUBSCRIPTION_LIMITS } from '@/lib/subscription'
import { Crown, Zap, CheckCircle2 } from 'lucide-react'

interface SettingsClientProps {
  profile: Profile
}

export function SettingsClient({ profile }: SettingsClientProps) {
  const [fullName, setFullName] = useState(profile.full_name || '')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName }),
      })

      if (!response.ok) throw new Error('Failed to update profile')
      
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('[v0] Error updating profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const limits = SUBSCRIPTION_LIMITS[profile.subscription_tier]

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your account settings and subscription
          </p>
        </div>

        <div className="space-y-6">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Update your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>

          {/* Subscription */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Subscription
                {profile.subscription_tier === 'premium' && (
                  <Crown className="h-5 w-5 text-amber-500" />
                )}
                {profile.subscription_tier === 'pro' && (
                  <Zap className="h-5 w-5 text-primary" />
                )}
              </CardTitle>
              <CardDescription>Your current plan and usage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Current Plan</p>
                  <p className="text-sm text-muted-foreground">
                    {profile.subscription_tier.charAt(0).toUpperCase() + profile.subscription_tier.slice(1)} Tier
                  </p>
                </div>
                <Badge variant={profile.subscription_tier === 'free' ? 'secondary' : 'default'}>
                  {profile.subscription_tier === 'free' ? 'Free' : profile.subscription_tier === 'pro' ? '£10/month' : '£15/month'}
                </Badge>
              </div>

              <div className="space-y-3 border-t border-border pt-4">
                <h4 className="text-sm font-medium">Plan Features & Usage</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>
                      Jobs: {limits.maxJobs === -1 ? 'Unlimited' : `Up to ${limits.maxJobs}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>
                      AI Extractions: {limits.aiExtractionLimit === -1 ? `Unlimited (${profile.ai_extractions_used} used)` : `${profile.ai_extractions_used}/${limits.aiExtractionLimit} used this month`}
                    </span>
                  </div>
                  {limits.hasDocumentGeneration && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>
                        Documents: {profile.documents_generated_this_month}/{limits.documentGenerationLimit} used this month
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>AI Resume & Cover Letter: {limits.hasDocumentGeneration ? 'Enabled' : 'Pro / Premium only'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Timeline View: {limits.hasTimelineView ? 'Enabled' : 'Pro / Premium only'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Export to CSV: {limits.hasExport ? 'Enabled' : 'Pro / Premium only'}</span>
                  </div>
                </div>
              </div>

              {profile.subscription_tier === 'free' && (
                <Button className="w-full" disabled>
                  Upgrade to Pro (Stripe Integration Required)
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
