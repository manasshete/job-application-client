'use client'

import Link from 'next/link'
import { ArrowLeft, CalendarClock, CheckCircle2, CreditCard, FileText, Mail, Sparkles, UserRound } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DashboardTheme } from '@/app/dashboard/dashboard-theme'

export default function SettingsDesignPreview() {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <DashboardTheme />
      <header className="border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Button asChild variant="ghost"><Link href="/design-preview"><ArrowLeft className="mr-2 h-4 w-4" />Dashboard</Link></Button>
          <Badge variant="secondary">Safe design preview</Badge>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-primary">Account workspace</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Account and plan</h1>
          <p className="mt-3 text-muted-foreground">Manage your profile, usage, and plan. All information shown here is mock data.</p>
        </div>

        <div className="mt-8 grid gap-5">
          <Card>
            <CardHeader><div className="flex items-center gap-3"><div className="rounded-xl bg-primary/10 p-2.5 text-primary"><UserRound className="h-5 w-5" /></div><div><CardTitle>Profile</CardTitle><CardDescription>Your account identity and contact information.</CardDescription></div></div></CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2"><Label htmlFor="name">Name</Label><Input id="name" defaultValue="Alex Morgan" /></div>
              <div className="grid gap-2"><Label htmlFor="email">Email</Label><div className="relative"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="email" className="pl-9" defaultValue="alex@example.com" disabled /></div></div>
              <div className="sm:col-span-2"><Button>Save changes</Button></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="rounded-xl bg-primary/10 p-2.5 text-primary"><Sparkles className="h-5 w-5" /></div><div><CardTitle>Current usage</CardTitle><CardDescription>Your available AI tools and token balance.</CardDescription></div></div><Badge>Pro</Badge></div></CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-muted/30 p-4"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">AI extraction</span><FileText className="h-4 w-4 text-primary" /></div><p className="mt-2 text-2xl font-bold">18</p><p className="text-xs text-muted-foreground">tokens remaining</p></div>
                <div className="rounded-xl border border-border bg-muted/30 p-4"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Document generation</span><Sparkles className="h-4 w-4 text-primary" /></div><p className="mt-2 text-2xl font-bold">14</p><p className="text-xs text-muted-foreground">tokens remaining</p></div>
              </div>
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground"><CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>Your next token batch expires on October 21, 2026. Tokens remain valid for 60 days.</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><div className="flex items-center gap-3"><div className="rounded-xl bg-primary/10 p-2.5 text-primary"><CreditCard className="h-5 w-5" /></div><div><CardTitle>Manage plan</CardTitle><CardDescription>Choose the plan that fits your current job search.</CardDescription></div></div></CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-3">
              {[
                { name: 'Free', price: '₹0', features: ['2 AI documents', '5 job extractions'], active: false },
                { name: 'Pro', price: '₹299', features: ['20 AI documents', '30 job extractions'], active: true },
                { name: 'Premium', price: '₹499', features: ['50 AI documents', 'Unlimited tracking'], active: false },
              ].map((plan) => <div key={plan.name} className={`rounded-2xl border p-5 ${plan.active ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border'}`}><div className="flex items-center justify-between"><h2 className="font-semibold">{plan.name}</h2>{plan.active && <Badge>Current</Badge>}</div><p className="mt-4 text-3xl font-bold">{plan.price}<span className="text-sm font-normal text-muted-foreground">/month</span></p><div className="mt-5 flex flex-col gap-2">{plan.features.map((feature) => <span key={feature} className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-emerald-500" />{feature}</span>)}</div><Button className="mt-6 w-full" variant={plan.active ? 'outline' : 'default'} disabled={plan.active}>{plan.active ? 'Current plan' : `Choose ${plan.name}`}</Button></div>)}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
