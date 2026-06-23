import Link from 'next/link'
import { AnimateIn } from '@/components/landing/animate-in'
import {
  ArrowRight,
  Check,
  Briefcase,
  FileText,
  Brain,
  Download,
  BarChart2,
  CalendarCheck,
  ChevronDown,
  X,
  Zap,
  Shield,
  Clock,
  LayoutGrid,
  Sparkles,
  FileCheck,
  Link2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SUBSCRIPTION_PRICING, SUBSCRIPTION_LIMITS } from '@/lib/subscription'
import { siteConfig } from '@/lib/site-config'

// ─── Data ────────────────────────────────────────────────────────────────────

const WHY_PURSUITZ = [
  {
    icon: Clock,
    title: 'Save hours every week',
    description: 'Stop copying job details into spreadsheets. Paste a URL and AI fills every field in seconds — company, salary, requirements, deadline.',
  },
  {
    icon: Shield,
    title: 'Never lose track again',
    description: 'One dashboard for every application, every status, every document. Always know exactly where you stand with each company.',
  },
  {
    icon: Brain,
    title: 'AI that works for you',
    description: 'Your master CV tailored for each role in under a minute. Cover letters written to match the job description — without fabricating experience.',
  },
  {
    icon: Zap,
    title: 'Built for speed',
    description: 'From spotting a role to submitting a tailored application in under five minutes. Apply to more roles, faster, without the burnout.',
  },
]

const PAIN_POINTS = [
  'Spreadsheet with 50 job rows, no idea which stage each is at',
  'Sent the wrong resume to three companies',
  'Missed a follow-up because you forgot to check your notes',
  'Rewrote the same cover letter twelve times',
  'Forgot the interview date until the morning of',
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Track Job Applications Instantly',
    description: 'Paste a job URL and automatically extract the company name, role, location, salary, and application details into your Kanban board. You can also manually create and manage job application cards.',
    detail: 'Works with LinkedIn, Indeed, company pages, and more.',
  },
  {
    step: '02',
    title: 'AI Resume Tailoring & Cover Letter Generation',
    description: 'Upload your master resume and cover letter once. Pursuitz analyzes the job description and creates tailored, ATS-friendly versions optimized for the specific role.',
    detail: 'Tailored to each job description. ATS-optimized formatting.',
  },
  {
    step: '03',
    title: 'Download ATS-Optimized Files & Apply',
    description: 'Export tailored resumes and cover letters as downloadable PDF or TXT files, track every status update, and apply with confidence.',
    detail: 'PDF & TXT export. Kanban view, timeline view, and analytics.',
  },
]

const FEATURES = [
  {
    icon: Brain,
    title: 'AI Extraction',
    description: 'Paste any job URL. AI pulls the role details instantly — company, salary, requirements, everything. Zero manual work.',
    tag: null,
  },
  {
    icon: Briefcase,
    title: 'Application Tracking',
    description: 'Kanban board and timeline view. See every application, every status, at a glance. Never lose track of a role again.',
    tag: null,
  },
  {
    icon: FileText,
    title: 'AI Resume Tailoring',
    description: 'Your master CV, tailored for every role. AI rewrites the most relevant sections without fabricating experience.',
    tag: 'Pro & Premium',
  },
  {
    icon: Download,
    title: 'AI Cover Letters',
    description: 'Personalised cover letters generated in seconds. Give it your key points and it handles the rest. Download as PDF.',
    tag: 'Pro & Premium',
  },
  {
    icon: CalendarCheck,
    title: 'Interview Management',
    description: 'Schedule interviews, set preparation reminders, and log every conversation in one place. Never miss a slot.',
    tag: null,
  },
  {
    icon: BarChart2,
    title: 'Analytics & Insights',
    description: 'Response rates, interview conversion, weekly summaries. Understand what is working in your job search.',
    tag: 'Pro & Premium',
  },
]

const PRICING_TIERS = [
  {
    id: 'free' as const,
    name: 'Free',
    price: '₹0',
    period: null,
    description: 'Start organising your job search today.',
    features: [
      'Up to 10 applications',
      '5 AI extractions / month',
      'Basic application tracking',
      'Status updates & notes',
      'Interview scheduling',
    ],
    missing: ['AI Resume Tailoring', 'AI Cover Letters', 'PDF downloads', 'Advanced analytics'],
    cta: 'Get Started Free',
    href: '/auth/sign-up',
    highlighted: false,
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    price: `₹${SUBSCRIPTION_PRICING.pro}`,
    period: '/mo',
    description: 'For active job seekers applying consistently.',
    features: [
      'Unlimited applications',
      '200 AI extractions / month',
      'AI Resume Tailoring',
      'AI Cover Letter Generation',
      '200 document downloads / month',
      'PDF downloads',
      'Timeline & Kanban view',
      'Export to CSV',
      'Advanced filters & tags',
      'Weekly summaries',
    ],
    missing: [],
    cta: 'Start Pro',
    href: '/auth/sign-up?tier=pro',
    highlighted: true,
  },
  {
    id: 'premium' as const,
    name: 'Premium',
    price: `₹${SUBSCRIPTION_PRICING.premium}`,
    period: '/mo',
    description: 'Maximum AI power for the serious job seeker.',
    features: [
      'Everything in Pro',
      '500 AI extractions / month',
      '500 document downloads / month',
    ],
    missing: [],
    cta: 'Start Premium',
    href: '/auth/sign-up?tier=premium',
    highlighted: false,
  },
]

const FAQS = [
  {
    q: 'What is a job application tracker?',
    a: 'A job application tracker is a tool that helps you organize and monitor every job you apply to in one place. Pursuitz is an AI-powered job application tracker that uses a visual Kanban board to show the exact status of each application — applied, interviewing, offer, or rejected — so you never lose track of a role or miss a follow-up.',
  },
  {
    q: 'How does Pursuitz extract job details from a URL?',
    a: 'Paste a job link and Pursuitz automatically reads the posting and extracts key details — company name, role, location, salary, and requirements — then fills them into a new application card. This job link parsing removes the manual copy-and-paste work of tracking applications in a spreadsheet. It works with LinkedIn, Indeed, company career pages, and more.',
  },
  {
    q: 'Can I tailor my resume to a specific job description?',
    a: 'Yes. Upload your master resume once and Pursuitz analyzes the target job description, then rewrites and emphasizes your most relevant experience to match the role. It tailors your existing experience rather than fabricating new content, so you stay truthful while improving keyword relevance.',
  },
  {
    q: 'Does Pursuitz create ATS-friendly resumes?',
    a: 'Yes. Pursuitz produces ATS-optimized resumes using clean, single-column formatting without tables, graphics, or unusual fonts — the formats most reliably parsed by Applicant Tracking Systems (ATS). This improves the chance your resume is read correctly and ranked by automated screening software.',
  },
  {
    q: 'Can I generate cover letters using AI?',
    a: 'Yes. Pursuitz includes an AI cover letter generator that writes a personalized cover letter matched to the specific job description in seconds. You provide your key points and the AI handles the structure and tone, producing an ATS-friendly letter you can download.',
  },
  {
    q: 'Can I download my resume as a PDF?',
    a: 'Yes. Every tailored resume and cover letter can be downloaded as a PDF or plain-text (TXT) file, ready to submit to any job application or upload to an ATS.',
  },
  {
    q: 'Is Pursuitz free to use?',
    a: 'Yes. Pursuitz offers a free plan that includes up to 10 applications and 5 AI extractions per month so you can track job applications and try the core AI before upgrading. Paid Pro and Premium plans add AI resume tailoring, AI cover letters, PDF downloads, and higher monthly limits.',
  },
  {
    q: 'Is my resume data secure?',
    a: 'Yes. All data is encrypted at rest and in transit. We use Supabase with row-level security, meaning your data is strictly isolated from other accounts. We will never share or sell your information.',
  },
  {
    q: 'How long are my tokens valid?',
    a: 'Tokens for AI extractions and document generation are valid for 60 days from the date they are added to your account — whether through a purchase, an upgrade, or a downgrade. Any unused tokens roll over and stay usable on top of your newly added tokens until their 60-day window ends. Tokens are always used oldest-first so you get the most out of every batch.',
  },
]

// ─── Components ──────────────────────────────────────────────────────────────

function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <Briefcase className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">Pursuitz</span>
        </div>
        <nav className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm text-slate-600 transition-colors hover:text-slate-900">Features</a>
          <a href="#how-it-works" className="text-sm text-slate-600 transition-colors hover:text-slate-900">How it works</a>
          <a href="#pricing" className="text-sm text-slate-600 transition-colors hover:text-slate-900">Pricing</a>
          <a href="#faq" className="text-sm text-slate-600 transition-colors hover:text-slate-900">FAQ</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/auth/login">
            <Button variant="ghost" size="sm" className="text-slate-700 hover:text-slate-900">
              Log in
            </Button>
          </Link>
          <Link href="/auth/sign-up">
            <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800">
              Start Free
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pt-20 pb-0">
      <div className="mx-auto max-w-7xl px-6">
        {/* Hero sequence — staggered fade-up on page load */}
        <div className="hero-sequence">
          {/* Badge */}
          <div className="mb-6 flex animate-fade-up justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700">
              <Zap className="h-3.5 w-3.5" />
              AI-powered job search management
            </div>
          </div>

          {/* Headline */}
          <h1 className="animate-fade-up mx-auto max-w-4xl text-balance text-center text-5xl font-bold tracking-tight text-slate-900 md:text-6xl lg:text-7xl">
            AI Job Application Tracker{' '}
            <span className="text-blue-600">&amp; Resume Tailoring Tool</span>
          </h1>

          {/* Subheadline */}
          <p className="animate-fade-up mx-auto mt-6 max-w-2xl text-pretty text-center text-lg leading-relaxed text-slate-500 md:text-xl">
            Track every application in a visual Kanban board, instantly extract job details from any
            job link, tailor your resume and cover letter with AI, and download ATS-optimized PDFs
            ready to submit.
          </p>

          {/* CTAs */}
          <div className="animate-fade-up mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/auth/sign-up">
              <Button size="lg" className="h-12 rounded-lg bg-blue-600 px-8 text-base font-semibold shadow-sm transition-transform hover:scale-[1.03] hover:bg-blue-700 active:scale-[0.97]">
                Start Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button size="lg" variant="outline" className="h-12 rounded-lg px-8 text-base font-semibold text-slate-700 transition-transform hover:scale-[1.03] active:scale-[0.97]">
                See how it works
              </Button>
            </a>
          </div>
          <p className="animate-fade-up mt-4 text-center text-sm text-slate-400">
            Free to start. No credit card required.
          </p>
        </div>

        {/* Dashboard mockup — gentle float */}
        <div className="animate-float relative mt-16 mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-2xl shadow-slate-200/80">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <div className="mx-auto flex h-7 w-72 items-center justify-center rounded-md border border-slate-200 bg-white text-xs text-slate-400">
                app.pursuitz.dev/dashboard
              </div>
            </div>
            {/* Dashboard content */}
            <div className="bg-slate-50 p-3 sm:p-6">
              {/* Top stats — 2 cols on mobile, 4 on sm+ */}
              <div className="mb-4 grid grid-cols-2 gap-2 sm:mb-5 sm:grid-cols-4 sm:gap-4">
                {[
                  { label: 'Total Applied', value: '34', color: 'text-blue-600' },
                  { label: 'In Progress', value: '12', color: 'text-amber-600' },
                  { label: 'Interviews', value: '5', color: 'text-green-600' },
                  { label: 'Offers', value: '2', color: 'text-purple-600' },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
                    <p className="text-[11px] leading-tight text-slate-500 sm:text-xs">{s.label}</p>
                    <p className={`mt-1 text-xl font-bold sm:text-2xl ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>
              {/* Kanban — 2 cols on mobile (Applied + Interviewing), 4 on sm+ */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                {[
                  {
                    col: 'Applied',
                    color: 'bg-blue-100 text-blue-700',
                    cards: [
                      { company: 'Stripe', role: 'Senior Engineer', time: '2d ago' },
                      { company: 'Notion', role: 'Product Designer', time: '3d ago' },
                      { company: 'Vercel', role: 'DevRel', time: '5d ago' },
                    ],
                  },
                  {
                    col: 'Interviewing',
                    color: 'bg-amber-100 text-amber-700',
                    cards: [
                      { company: 'Linear', role: 'Frontend Eng', time: '1d ago' },
                      { company: 'Figma', role: 'Staff Designer', time: '4d ago' },
                    ],
                  },
                  {
                    col: 'Offer',
                    color: 'bg-green-100 text-green-700',
                    cards: [
                      { company: 'Loom', role: 'Full Stack Dev', time: '1d ago' },
                    ],
                  },
                  {
                    col: 'Rejected',
                    color: 'bg-slate-100 text-slate-600',
                    cards: [
                      { company: 'Airbnb', role: 'iOS Engineer', time: '6d ago' },
                    ],
                  },
                ].map((col, i) => (
                  /* Hide Offer + Rejected columns on mobile — show all 4 on sm+ */
                  <div key={col.col} className={i >= 2 ? 'hidden sm:block' : ''}>
                    <div className={`mb-2 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold sm:px-2.5 sm:text-xs ${col.color}`}>
                      {col.col}
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      {col.cards.map((card) => (
                        <div key={card.company} className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm sm:rounded-xl sm:p-3">
                          <p className="text-[11px] font-semibold leading-tight text-slate-800 sm:text-xs">{card.company}</p>
                          <p className="text-[10px] leading-tight text-slate-500 sm:text-xs">{card.role}</p>
                          <p className="mt-1 text-[9px] text-slate-400 sm:text-[10px]">{card.time}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Fade out at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
        </div>
      </div>
    </section>
  )
}

function WhyPursuitz() {
  return (
    <section className="border-y border-slate-100 bg-white py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">Why Pursuitz</p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            A smarter way to manage your job search
          </h2>
          <p className="mt-4 text-slate-500">
            Purpose-built for job seekers who are serious about landing their next role.
          </p>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {WHY_PURSUITZ.map((item, i) => (
            <AnimateIn key={item.title} delay={`reveal-delay-${i + 1}` as 'reveal-delay-1'}>
              <div className="group h-full rounded-2xl border border-slate-200 bg-slate-50 p-7 transition-shadow hover:shadow-md">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 feature-icon">
                  <item.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="mb-2 text-base font-bold text-slate-900">{item.title}</h3>
                <p className="text-sm leading-7 text-slate-500">{item.description}</p>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  )
}

function ProblemSection() {
  return (
    <section className="bg-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">The Problem</p>
          <h2 className="mt-3 text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Sound familiar?
          </h2>
          <p className="mt-4 text-slate-500">
            Managing a job search without the right tools is exhausting. Most people end up here:
          </p>
        </div>

        <div className="mt-16 grid gap-10 md:grid-cols-2 md:items-center">
          {/* Pain points */}
          <div className="space-y-4">
            {PAIN_POINTS.map((point, i) => (
              <AnimateIn key={point} delay={`reveal-delay-${i + 1}` as 'reveal-delay-1'}>
                <div className="flex items-start gap-4 rounded-xl border border-red-100 bg-white p-5 shadow-sm">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100">
                    <X className="h-3.5 w-3.5 text-red-600" />
                  </div>
                  <p className="text-sm leading-relaxed text-slate-700">{point}</p>
                </div>
              </AnimateIn>
            ))}
          </div>

          {/* Solution */}
          <AnimateIn variant="reveal-scale">
          <div className="rounded-2xl border border-blue-100 bg-white p-10 shadow-sm">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">Pursuitz solves all of this.</h3>
            <p className="mt-3 text-slate-500 leading-relaxed">
              One dashboard for your entire job search. Every application, every document, every interview — organised, searchable, and always up to date.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'Know the exact status of every application',
                'See which resume version went to which company',
                'Never miss an interview or follow-up',
                'Generate tailored documents in under 60 seconds',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <Check className="h-5 w-5 shrink-0 text-blue-600" />
                  <span className="text-sm text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Link href="/auth/sign-up">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Start for free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
          </AnimateIn>
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">How It Works</p>
          <h2 className="mt-3 text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            How Pursuitz Helps You Track Job Applications Faster
          </h2>
        </div>

        <div className="mt-20 grid gap-12 md:grid-cols-3">
          {HOW_IT_WORKS.map((step, i) => (
            <AnimateIn key={step.step} delay={`reveal-delay-${i + 1}` as 'reveal-delay-1'}>
            <div className="relative">
              {/* Connector line */}
              {i < HOW_IT_WORKS.length - 1 && (
                <div className="absolute left-full top-8 hidden h-px w-full -translate-x-6 border-t-2 border-dashed border-slate-200 md:block" />
              )}
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-lg font-bold text-white shadow-lg shadow-blue-600/25">
                  {step.step}
                </div>
                <div className="h-px flex-1 bg-slate-100 md:hidden" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">{step.description}</p>
              <p className="mt-3 text-xs font-medium text-blue-600">{step.detail}</p>
            </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  )
}

function Features() {
  return (
    <section id="features" className="bg-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">Features</p>
          <h2 className="mt-3 text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Everything you need to land the job
          </h2>
          <p className="mt-4 text-slate-500">
            From your first application to your final offer — Pursuitz covers every step.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <AnimateIn key={f.title} delay={`reveal-delay-${(i % 6) + 1}` as 'reveal-delay-1'}>
              <div className="group relative h-full rounded-2xl border border-slate-200 bg-white p-8 transition-all duration-200 hover:border-blue-200 hover:shadow-lg hover:-translate-y-1">
                {f.tag && (
                  <span className="absolute right-4 top-4 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-semibold text-white">
                    {f.tag}
                  </span>
                )}
                <div className="feature-icon mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-slate-900">{f.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{f.description}</p>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  )
}

function ProductShowcase() {
  return (
    <section className="overflow-hidden bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">Product</p>
          <h2 className="mt-3 text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            See the product in action
          </h2>
          <p className="mt-4 text-slate-500">
            A clean, focused interface that gets out of your way and lets you focus on your job search.
          </p>
        </div>

        {/* Feature showcase cards */}
        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {/* Application detail */}
          <AnimateIn delay="reveal-delay-1">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
            <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
              <p className="text-xs font-semibold text-slate-600">Application Detail View</p>
            </div>
            <div className="p-6">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">S</div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Stripe</p>
                      <p className="text-xs text-slate-500">Senior Software Engineer</p>
                    </div>
                  </div>
                </div>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">Interviewing</span>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Location', value: 'Bengaluru, IN (Hybrid)' },
                  { label: 'Salary', value: '₹18,00,000 – ₹28,00,000' },
                  { label: 'Applied', value: '12 June 2026' },
                  { label: 'Resume sent', value: 'stripe-tailored-v2.pdf' },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2.5">
                    <span className="text-xs text-slate-500">{row.label}</span>
                    <span className="text-xs font-medium text-slate-800">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          </AnimateIn>

          {/* Resume tailoring */}
          <AnimateIn delay="reveal-delay-2">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
            <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
              <p className="text-xs font-semibold text-slate-600">AI Resume Tailoring</p>
            </div>
            <div className="p-6">
              <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-semibold text-blue-700 mb-1">AI is tailoring your resume...</p>
                <p className="text-xs text-blue-600">Matching your experience to: Senior Software Engineer at Stripe</p>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-blue-200">
                  <div className="animate-progress-fill h-full rounded-full bg-blue-600" />
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { section: 'Work Experience', status: 'Tailored', color: 'text-green-600 bg-green-50' },
                  { section: 'Skills', status: 'Tailored', color: 'text-green-600 bg-green-50' },
                  { section: 'Summary', status: 'In progress', color: 'text-amber-600 bg-amber-50' },
                  { section: 'Education', status: 'Unchanged', color: 'text-slate-500 bg-slate-50' },
                ].map((row) => (
                  <div key={row.section} className="flex items-center justify-between rounded-lg px-4 py-2.5 bg-slate-50">
                    <span className="text-xs text-slate-700">{row.section}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${row.color}`}>{row.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          </AnimateIn>

          {/* Interview scheduling */}
          <AnimateIn delay="reveal-delay-3">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
            <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
              <p className="text-xs font-semibold text-slate-600">Interview Scheduling</p>
            </div>
            <div className="p-6 space-y-3">
              {[
                { company: 'Linear', type: 'Technical Screen', date: 'Mon 16 Jun, 10:00', status: 'Upcoming', color: 'bg-blue-100 text-blue-700' },
                { company: 'Figma', type: 'Final Round', date: 'Wed 18 Jun, 14:30', status: 'Confirmed', color: 'bg-green-100 text-green-700' },
                { company: 'Stripe', type: 'HR Call', date: 'Fri 20 Jun, 09:00', status: 'Upcoming', color: 'bg-blue-100 text-blue-700' },
              ].map((iv) => (
                <div key={iv.company} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{iv.company}</p>
                    <p className="text-xs text-slate-500">{iv.type}</p>
                    <p className="mt-1 text-xs font-medium text-slate-700">{iv.date}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${iv.color}`}>{iv.status}</span>
                </div>
              ))}
            </div>
          </div>
          </AnimateIn>

          {/* Analytics */}
          <AnimateIn delay="reveal-delay-4">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
            <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
              <p className="text-xs font-semibold text-slate-600">Application Analytics</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                {[
                  { label: 'Response rate', value: '38%', sub: '+12% vs last month' },
                  { label: 'Interview rate', value: '14%', sub: '5 of 34 applications' },
                ].map((m) => (
                  <div key={m.label} className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">{m.label}</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{m.value}</p>
                    <p className="mt-0.5 text-xs text-green-600">{m.sub}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-600 mb-3">Applications by status</p>
                {[
                  { label: 'Applied', count: 17, pct: 50, color: 'bg-blue-500' },
                  { label: 'Interviewing', count: 12, pct: 35, color: 'bg-amber-500' },
                  { label: 'Offer', count: 5, pct: 15, color: 'bg-green-500' },
                ].map((r) => (
                  <div key={r.label} className="mb-2">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>{r.label}</span>
                      <span>{r.count}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                      <div className={`h-full rounded-full ${r.color}`} style={{ width: `${r.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          </AnimateIn>
        </div>
      </div>
    </section>
  )
}

function Pricing() {
  return (
    <section id="pricing" className="bg-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">Pricing</p>
          <h2 className="mt-3 text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-slate-500">
            Start free. Top up when you need more AI power. No subscriptions, no lock-in.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {PRICING_TIERS.map((tier, i) => (
            <AnimateIn key={tier.id} variant="reveal-scale" delay={`reveal-delay-${i + 1}` as 'reveal-delay-1'}>
            <div
              className={`relative flex h-full flex-col rounded-2xl border p-8 transition-shadow hover:shadow-xl ${
                tier.highlighted
                  ? 'animate-glow-pulse border-blue-600 bg-white shadow-xl shadow-blue-600/10 ring-1 ring-blue-600'
                  : 'border-slate-200 bg-white shadow-sm'
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-blue-600 px-4 py-1 text-xs font-semibold text-white shadow">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900">{tier.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight text-slate-900">{tier.price}</span>
                  {tier.period && <span className="text-slate-500">{tier.period}</span>}
                </div>
                <p className="mt-2 text-sm text-slate-500">{tier.description}</p>
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                    <span className="text-sm text-slate-700">{f}</span>
                  </li>
                ))}
                {tier.missing.map((f) => (
                  <li key={f} className="flex items-start gap-3 opacity-40">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <span className="text-sm text-slate-500 line-through">{f}</span>
                  </li>
                ))}
              </ul>

              <Link href={tier.href} className="block">
                <Button
                  className={`w-full rounded-lg transition-transform hover:scale-[1.02] active:scale-[0.98] ${
                    tier.highlighted
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                  size="lg"
                >
                  {tier.cta}
                </Button>
              </Link>
            </div>
            </AnimateIn>
          ))}
        </div>

        {/* Token validity note */}
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-slate-500">
          All tokens are valid for 60 days from the date they are added to your account. Unused tokens roll over and stay usable on top of new tokens until they expire.
        </p>

        {/* Trust signals */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-600" />
            <span>Encrypted & secure</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span>Cancel or change plan anytime</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-blue-600" />
            <span>No hidden fees</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function FAQ() {
  return (
    <section id="faq" className="bg-white py-24">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">FAQ</p>
          <h2 className="mt-3 text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Common questions
          </h2>
        </div>

        <div className="mt-16 divide-y divide-slate-100">
          {FAQS.map((faq) => (
            <details key={faq.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <span className="text-base font-semibold text-slate-900">{faq.q}</span>
                <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-4 text-sm leading-relaxed text-slate-500">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

function FinalCTA() {
  return (
    <section className="bg-slate-900 py-28">
      <AnimateIn variant="reveal-scale" className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Spend less time organising.{' '}
          <br className="hidden sm:block" />
          <span className="text-blue-400">Spend more time getting hired.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg text-slate-400">
          Join thousands of job seekers who use Pursuitz to stay organised, stand out, and land more interviews.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/auth/sign-up">
            <Button size="lg" className="animate-glow-pulse h-12 rounded-lg bg-white px-8 text-base font-semibold text-slate-900 transition-transform hover:scale-[1.04] hover:bg-slate-100 active:scale-[0.97]">
              Start Free — No Card Required
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <p className="mt-6 text-sm text-slate-500">Free forever for up to 10 applications.</p>
      </AnimateIn>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <Briefcase className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-slate-900">Pursuitz</span>
            </div>
            <p className="mt-3 text-sm text-slate-500 leading-relaxed">
              AI-powered job application management for serious job seekers.
            </p>
          </div>

          {/* Product */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">Product</p>
            <ul className="space-y-3 text-sm text-slate-600">
              <li><a href="#features" className="hover:text-slate-900">Features</a></li>
              <li><a href="#pricing" className="hover:text-slate-900">Pricing</a></li>
              <li><a href="#how-it-works" className="hover:text-slate-900">How it works</a></li>
              <li><a href="#faq" className="hover:text-slate-900">FAQ</a></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">Account</p>
            <ul className="space-y-3 text-sm text-slate-600">
              <li><Link href="/auth/sign-up" className="hover:text-slate-900">Sign up</Link></li>
              <li><Link href="/auth/login" className="hover:text-slate-900">Log in</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">Legal</p>
            <ul className="space-y-3 text-sm text-slate-600">
              <li><Link href="/privacy" className="hover:text-slate-900">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-slate-900">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">Contact</p>
            <ul className="space-y-3 text-sm text-slate-600">
              <li><a href="mailto:info@pursuitz.co" className="hover:text-slate-900">info@pursuitz.co</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-100 pt-8 space-y-3">
          <p className="text-xs text-slate-400 text-center">
            Use of this service does not guarantee employment, job interviews, or job offers. Pursuitz is a personal organisation tool only.
          </p>
          <p className="text-xs text-slate-400 text-center">
            AI-generated content including extracted job details, tailored resumes, and cover letters may be inaccurate. Always review and verify before submitting.
          </p>
          <p className="text-xs text-slate-400 text-center">
            © 2026 Pursuitz. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

const SEO_POINTS = [
  {
    icon: LayoutGrid,
    title: 'Visual Job Application Tracking',
    body: 'Spreadsheets break down fast. See every application as a card on a Kanban board grouped by stage — Applied, Interviewing, Offer, Rejected — so your whole job search is clear at a glance.',
  },
  {
    icon: Sparkles,
    title: 'AI Resume Tailoring',
    body: 'Generic resumes miss the keywords hiring teams scan for. AI analyzes each job description and rewrites your real experience to match the role — without inventing anything.',
  },
  {
    icon: FileCheck,
    title: 'ATS-Optimized Resumes',
    body: 'Most companies filter resumes with ATS software before a human reads them. Pursuitz exports clean, single-column layouts these systems parse reliably, so you reach more recruiters.',
  },
  {
    icon: Link2,
    title: 'One Link to Apply Faster',
    body: 'Paste a job link to extract the details, track it visually, tailor your resume and cover letter, and download a submit-ready PDF — turning a scattered process into a repeatable system.',
  },
]

function SeoContent() {
  return (
    <section className="border-b border-slate-100 bg-slate-50 py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Why Use an AI Job Application Tracker?
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-slate-500">
            Stop juggling spreadsheets. Pursuitz combines visual tracking, AI resume tailoring, and
            ATS-ready exports so you apply to more roles with less effort.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {SEO_POINTS.map((point, i) => {
            const Icon = point.icon
            return (
              <AnimateIn key={point.title} delay={`reveal-delay-${i + 1}` as 'reveal-delay-1'}>
                <div className="group h-full rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-shadow hover:shadow-md">
                  <div className="feature-icon flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{point.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-500">
                    {point.body}
                  </p>
                </div>
              </AnimateIn>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function StructuredData() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        '@id': `${siteConfig.url}/#software`,
        name: siteConfig.name,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url: siteConfig.url,
        description: siteConfig.description,
        offers: [
          {
            '@type': 'Offer',
            name: 'Free',
            price: '0',
            priceCurrency: 'INR',
          },
          {
            '@type': 'Offer',
            name: 'Pro',
            price: String(SUBSCRIPTION_PRICING.pro),
            priceCurrency: 'INR',
          },
          {
            '@type': 'Offer',
            name: 'Premium',
            price: String(SUBSCRIPTION_PRICING.premium),
            priceCurrency: 'INR',
          },
        ],
        featureList: [
          'Job Application Tracker',
          'Kanban Job Board',
          'AI Resume Tailoring',
          'AI Cover Letter Generator',
          'ATS Resume Optimization',
          'Job Link Extraction',
          'PDF Export',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${siteConfig.url}/#website`,
        url: siteConfig.url,
        name: siteConfig.name,
        description: siteConfig.description,
        publisher: { '@id': `${siteConfig.url}/#organization` },
      },
      {
        '@type': 'Organization',
        '@id': `${siteConfig.url}/#organization`,
        name: siteConfig.name,
        url: siteConfig.url,
        logo: `${siteConfig.url}${siteConfig.ogImage}`,
        description: siteConfig.description,
      },
      {
        '@type': 'FAQPage',
        '@id': `${siteConfig.url}/#faq`,
        mainEntity: FAQS.map((faq) => ({
          '@type': 'Question',
          name: faq.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.a,
          },
        })),
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      // JSON-LD structured data for Google rich results and AI search engines.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <StructuredData />
      <NavBar />
      <Hero />
      <WhyPursuitz />
      <ProblemSection />
      <HowItWorks />
      <Features />
      <ProductShowcase />
      <SeoContent />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  )
}
