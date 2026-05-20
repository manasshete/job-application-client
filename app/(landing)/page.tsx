import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Check, ArrowRight, Briefcase, FileText, FolderSearch, Clock, Brain, Download, ChevronRight } from 'lucide-react'
import { PrivacyDisclaimer, AIDisclaimer } from '@/components/disclaimers'

const PRICING_TIERS = [
  {
    name: 'Free',
    price: '£0',
    description: 'Perfect for getting started',
    features: [
      'Up to 10 job applications',
      '5 AI extractions/month',
      'Basic application tracking',
      'Status updates & notes',
      'Interview scheduling',
    ],
    cta: 'Get Started Free',
    href: '/auth/sign-up',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '£10',
    period: '/month',
    description: 'For active job seekers',
    features: [
      'Unlimited applications',
      '50 AI extractions/month',
      'Timeline view',
      'Export to CSV',
      'Advanced filters & tags',
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
    period: '/month',
    description: 'AI-powered job hunting',
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

const PAIN_POINTS = [
  {
    icon: FolderSearch,
    title: 'Lost Track of Applications?',
    description: 'Applied to dozens of jobs but forgot which companies? We organize everything in one place.',
  },
  {
    icon: FileText,
    title: 'Resume Chaos?',
    description: 'Different versions for different jobs? Track exactly which resume went where.',
  },
  {
    icon: Clock,
    title: 'Missing Deadlines?',
    description: 'Forgot to follow up or missed an interview? Get reminders and never miss an opportunity.',
  },
]

const FEATURES = [
  {
    icon: Brain,
    title: 'AI-Powered Extraction',
    description: 'Paste any job URL and let AI automatically extract company, role, salary, and requirements. No more copy-pasting.',
    badge: null,
  },
  {
    icon: Briefcase,
    title: 'Track Every Application',
    description: 'Kanban board, timeline view, and powerful filters. Know the status of every application at a glance.',
    badge: null,
  },
  {
    icon: FileText,
    title: 'AI Resume Tailoring',
    description: 'Upload your resume once. Get a tailored version for each job that highlights the most relevant experience.',
    badge: 'Premium',
  },
  {
    icon: Download,
    title: 'AI Cover Letters',
    description: 'Generate personalized cover letters in seconds. Edit, refine, and download as PDF.',
    badge: 'Premium',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/80 via-white to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <Briefcase className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">JobTracker</span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              How It Works
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                Login
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button className="bg-blue-600 hover:bg-blue-700 rounded-full px-6">
                Register
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/40 via-transparent to-indigo-100/30" />
        <div className="container relative mx-auto px-4 text-center">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
              Never lose track of a{' '}
              <span className="text-blue-600">job application</span>
              {' '}again.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-slate-600 md:text-xl">
              Applied to 50+ jobs and forgot which resume went where? JobTracker organizes your entire job search, tailors your documents with AI, and helps you land your dream role faster.
            </p>
            
            {/* Feature Pills */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm border border-slate-200">
                <Check className="h-4 w-4 text-blue-600" />
                <span className="text-slate-700">Application Tracking</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm border border-slate-200">
                <Check className="h-4 w-4 text-blue-600" />
                <span className="text-slate-700">AI Resume Tailoring</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm border border-slate-200">
                <Check className="h-4 w-4 text-blue-600" />
                <span className="text-slate-700">Cover Letter Generator</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm border border-slate-200">
                <Check className="h-4 w-4 text-blue-600" />
                <span className="text-slate-700">Interview Scheduler</span>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-10">
              <Link href="/auth/sign-up">
                <Button size="lg" className="h-14 rounded-full bg-blue-600 px-8 text-base font-semibold hover:bg-blue-700 shadow-lg shadow-blue-600/25 transition-all hover:shadow-xl hover:shadow-blue-600/30">
                  Start Tracking For Free
                </Button>
              </Link>
              <p className="mt-4 text-sm text-slate-500">
                No credit card required. Free forever for up to 10 applications.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="border-y border-slate-200 bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">The Problem</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
              Sound familiar?
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {PAIN_POINTS.map((point) => (
              <div key={point.title} className="group rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-8 transition-all hover:border-blue-200 hover:shadow-lg">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                  <point.icon className="h-7 w-7" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-slate-900">{point.title}</h3>
                <p className="text-slate-600 leading-relaxed">{point.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-gradient-to-b from-white to-blue-50/50 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">How It Works</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
              From chaos to clarity in 3 steps
            </h2>
          </div>

          <div className="mx-auto max-w-4xl">
            <div className="relative">
              {/* Connection Line */}
              <div className="absolute left-8 top-0 hidden h-full w-0.5 bg-gradient-to-b from-blue-600 via-blue-400 to-blue-200 md:block" />
              
              <div className="space-y-12">
                <div className="relative flex gap-6">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white shadow-lg">
                    1
                  </div>
                  <div className="pt-3">
                    <h3 className="text-xl font-semibold text-slate-900">Paste a job link</h3>
                    <p className="mt-2 text-slate-600 leading-relaxed">
                      Found a job you like? Just paste the URL. Our AI extracts the company name, job title, location, salary, and requirements automatically.
                    </p>
                  </div>
                </div>

                <div className="relative flex gap-6">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xl font-bold text-white shadow-lg">
                    2
                  </div>
                  <div className="pt-3">
                    <h3 className="text-xl font-semibold text-slate-900">Generate tailored documents</h3>
                    <p className="mt-2 text-slate-600 leading-relaxed">
                      Upload your master resume once. For each application, AI creates a tailored resume and cover letter that highlights your most relevant experience.
                    </p>
                  </div>
                </div>

                <div className="relative flex gap-6">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-400 text-xl font-bold text-white shadow-lg">
                    3
                  </div>
                  <div className="pt-3">
                    <h3 className="text-xl font-semibold text-slate-900">Track and follow up</h3>
                    <p className="mt-2 text-slate-600 leading-relaxed">
                      See all your applications in one dashboard. Track status, schedule interviews, set reminders, and never let an opportunity slip away.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-y border-slate-200 bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Features</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
              Everything you need to land the job
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
              From tracking applications to generating tailored documents, we&apos;ve got your entire job search covered.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="group relative rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-blue-200 hover:shadow-lg">
                {feature.badge && (
                  <span className="absolute -top-3 right-4 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1 text-xs font-medium text-white">
                    {feature.badge}
                  </span>
                )}
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-gradient-to-b from-blue-50/50 to-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 rounded-3xl border border-blue-100 bg-white p-8 shadow-sm md:flex-row md:p-12">
            <div className="text-center md:text-left">
              <p className="text-4xl font-bold text-blue-600">50+</p>
              <p className="text-sm text-slate-600">Applications tracked per user on average</p>
            </div>
            <div className="hidden h-16 w-px bg-slate-200 md:block" />
            <div className="text-center md:text-left">
              <p className="text-4xl font-bold text-blue-600">3x</p>
              <p className="text-sm text-slate-600">Faster application process with AI extraction</p>
            </div>
            <div className="hidden h-16 w-px bg-slate-200 md:block" />
            <div className="text-center md:text-left">
              <p className="text-4xl font-bold text-blue-600">100%</p>
              <p className="text-sm text-slate-600">Know which resume went where</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="border-t border-slate-200 bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Pricing</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
              Start free, upgrade when you need more power.
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl border p-8 ${
                  tier.highlighted
                    ? 'border-blue-600 bg-gradient-to-b from-blue-50 to-white shadow-xl shadow-blue-600/10'
                    : 'border-slate-200 bg-white'
                }`}
              >
                {tier.highlighted && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1 text-sm font-medium text-white">
                    Most Popular
                  </span>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900">{tier.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-slate-900">{tier.price}</span>
                    {tier.period && (
                      <span className="text-slate-500">{tier.period}</span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{tier.description}</p>
                </div>

                <ul className="mb-8 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                      <span className="text-sm text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href={tier.href} className="block">
                  <Button
                    className={`w-full rounded-full ${
                      tier.highlighted
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-slate-900 hover:bg-slate-800'
                    }`}
                    size="lg"
                  >
                    {tier.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to organize your job search?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-blue-100">
            Stop losing track of applications. Start landing more interviews.
          </p>
          <div className="mt-10">
            <Link href="/auth/sign-up">
              <Button size="lg" className="h-14 rounded-full bg-white px-8 text-base font-semibold text-blue-600 hover:bg-blue-50 shadow-lg transition-all">
                Get Started Free <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Disclaimers Section */}
      <section className="border-t border-slate-200 bg-slate-50 py-12">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="mb-8 text-center text-xl font-semibold text-slate-900">Important Information</h2>
          <div className="space-y-4">
            <PrivacyDisclaimer />
            <AIDisclaimer />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <Briefcase className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-slate-900">JobTracker</span>
            </div>
            <div className="flex gap-8 text-sm">
              <Link href="/terms" className="text-slate-600 hover:text-slate-900">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-slate-600 hover:text-slate-900">
                Privacy Policy
              </Link>
            </div>
            <p className="text-sm text-slate-500">
              © 2024 JobTracker. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
