import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Check, ArrowRight, Sparkles, Shield, Zap, FileText } from 'lucide-react'

const PRICING_TIERS = [
  {
    name: 'Free',
    price: '£0',
    description: 'Perfect for getting started with job tracking',
    features: [
      'Up to 10 jobs',
      'Up to 20 interviews',
      'Up to 20 tasks',
      '5 AI extractions/month',
      'Basic job tracking',
      'Status updates',
    ],
    cta: 'Get Started',
    href: '/auth/sign-up',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '£10',
    description: 'For serious job seekers managing multiple applications',
    features: [
      'Unlimited jobs',
      'Unlimited interviews & tasks',
      '50 AI extractions/month',
      'Timeline view',
      'Export to CSV',
      'Advanced filters & sorting',
      'Tags & categories',
      'Activity logs',
      'Weekly summaries',
    ],
    cta: 'Start Pro',
    href: '/auth/sign-up?tier=pro',
    highlighted: true,
  },
  {
    name: 'Premium',
    price: '£20',
    description: 'Maximum productivity with AI-powered documents',
    features: [
      'Everything in Pro',
      'Unlimited AI extractions',
      'AI Resume Tailoring',
      'AI Cover Letter Generation',
      '100 documents/month',
      'PDF downloads',
    ],
    cta: 'Start Premium',
    href: '/auth/sign-up?tier=premium',
    highlighted: false,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">JobTracker</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-balance text-5xl font-bold tracking-tight sm:text-6xl">
            Take Control of Your Job Search
          </h1>
          <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground">
            Track applications, manage interviews, and land your dream job faster with our intelligent job application tracker.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/auth/sign-up">
              <Button size="lg" className="gap-2">
                Start Free Today <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            No credit card required. Start tracking in minutes.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t border-border bg-muted/30 py-24">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to manage your job search
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Powerful features to keep you organized and productive
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">AI-Powered Extraction</h3>
              <p className="text-muted-foreground">
                Automatically extract job details from any posting URL. Save time on manual data entry.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Secure & Private</h3>
              <p className="text-muted-foreground">
                Your data is encrypted and protected with row-level security. Only you can see your applications.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Smart Insights</h3>
              <p className="text-muted-foreground">
                Track your application velocity, response rates, and get actionable insights to improve your search.
              </p>
            </div>

            <div className="rounded-lg border border-primary/50 bg-card p-6 relative">
              <div className="absolute -top-3 right-4 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                Premium
              </div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">AI Document Generation</h3>
              <p className="text-muted-foreground">
                Generate tailored resumes and cover letters for each job application. Download as PDF instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-24">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Choose the plan that fits your job search needs
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-lg border p-8 ${
                tier.highlighted
                  ? 'border-primary bg-primary/5 shadow-lg'
                  : 'border-border bg-card'
              }`}
            >
              <div className="mb-6">
                <h3 className="text-2xl font-bold">{tier.name}</h3>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  {tier.price !== '$0' && (
                    <span className="text-muted-foreground">/month</span>
                  )}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {tier.description}
                </p>
              </div>

              <ul className="mb-8 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href={tier.href} className="block">
                <Button
                  className="w-full"
                  variant={tier.highlighted ? 'default' : 'outline'}
                  size="lg"
                >
                  {tier.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-muted/30 py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to streamline your job search?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join thousands of job seekers who have organized their applications
          </p>
          <div className="mt-10">
            <Link href="/auth/sign-up">
              <Button size="lg" className="gap-2">
                Start Free Today <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-semibold">JobTracker</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/terms" className="hover:text-foreground">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-foreground">
                Privacy
              </Link>
              <Link href="/contact" className="hover:text-foreground">
                Contact
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 JobTracker. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
