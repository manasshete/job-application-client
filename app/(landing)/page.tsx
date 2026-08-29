import Link from 'next/link'
import { AnimateIn } from '@/components/landing/animate-in'
import { FreeToolsMenu } from '@/components/landing/free-tools-menu'
import { BrandLogo } from '@/components/brand-logo'
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  FileText,
  Brain,
  Download,
  BarChart2,
  CalendarCheck,
  LayoutGrid,
  Link2,
  MoveRight,
} from 'lucide-react'
import { SUBSCRIPTION_PRICING } from '@/lib/subscription'
import { siteConfig } from '@/lib/site-config'

// ─── Palette (dark editorial) ──────────────────────────────────────────────────
const ACCENT = 'oklch(0.72 0.16 250)'
const ACCENT_HI = 'oklch(0.82 0.13 250)'
const ACCENT_TX = 'oklch(0.86 0.1 250)'
const ACCENT_LB = 'oklch(0.78 0.14 250)'
const GREEN = 'oklch(0.72 0.16 155)'
const GREEN_TX = 'oklch(0.86 0.12 155)'
const BORDER = 'rgba(255,255,255,.08)'

// ─── Data ────────────────────────────────────────────────────────────────────

const SOURCES = ['LinkedIn', 'Indeed', 'Greenhouse', 'Lever', 'Workday', 'Naukri', 'Ashby', 'Company career pages']

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Paste the link',
    description:
      'The posting is read for you — company, role, location, salary, requirements, deadline — and lands on your board as a card.',
  },
  {
    step: '02',
    title: 'Tailor in one pass',
    description:
      'Upload your master CV once. Each role gets your real experience re-weighted to its description — nothing invented, ever.',
  },
  {
    step: '03',
    title: 'Download and send',
    description:
      'Clean single-column PDF or TXT that applicant tracking systems actually parse. Then the card moves itself along as you go.',
  },
]

const FEATURES = [
  { icon: Link2, title: 'Link extraction', description: 'Any job URL becomes a filled-in card. Company, salary, requirements, deadline — no typing.' },
  { icon: LayoutGrid, title: 'Kanban + timeline', description: 'Drag a card between stages, or read your whole search as a timeline. Both stay in sync.' },
  { icon: FileText, title: 'Resume tailoring', description: 'Your master CV, re-weighted per role. Truthful by design — it edits emphasis, not facts.' },
  { icon: Download, title: 'Cover letters', description: 'Give it two bullets of context; get a letter matched to the description. PDF in one click.' },
  { icon: CalendarCheck, title: 'Interview desk', description: 'Slots, prep reminders and notes from every conversation, attached to the role they belong to.' },
  { icon: BarChart2, title: 'Search analytics', description: 'Response and interview rates, weekly summaries — so you can tell which tactic is working.' },
]

const PROBLEMS = [
  'Sent the wrong resume to three companies',
  'Forgot the interview until the morning of',
  'Rewrote the same cover letter twelve times',
  'No idea which stage each of 50 rows is at',
]

const PRICING_TIERS = [
  {
    id: 'free' as const,
    name: 'Free',
    price: '₹0',
    period: 'forever',
    description: 'Get organised today.',
    features: ['Up to 10 applications', '5 link extractions / month', '2 tailored CVs + letters / month', 'Status updates, notes, interviews'],
    cta: 'Get started free',
    href: '/auth/sign-up',
    highlighted: false,
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    price: `₹${SUBSCRIPTION_PRICING.pro}`,
    period: '/ month',
    description: 'For applying consistently.',
    features: ['Unlimited applications', '100 extractions / month', '100 document downloads / month', 'Kanban + timeline, filters, tags', 'Weekly summaries, CSV export'],
    cta: 'Start Pro',
    href: '/auth/sign-up?tier=pro',
    highlighted: true,
  },
  {
    id: 'premium' as const,
    name: 'Premium',
    price: `₹${SUBSCRIPTION_PRICING.premium}`,
    period: '/ month',
    description: 'Maximum AI headroom.',
    features: ['Everything in Pro', '300 extractions / month', '300 document downloads / month', 'Priority AI queue'],
    cta: 'Start Premium',
    href: '/auth/sign-up?tier=premium',
    highlighted: false,
  },
]

const FAQS = [
  {
    q: 'How does the link extraction actually work?',
    a: 'Paste a job URL and Pursuitz reads the posting, pulls company, role, location, salary and requirements, and fills a new card on your board. It works with LinkedIn, Indeed, ATS portals and company career pages — and you can always create or edit a card by hand.',
  },
  {
    q: 'Will the AI invent experience I do not have?',
    a: 'No. Tailoring re-weights and rewrites the experience already in your master CV so the relevant parts lead and the language matches the description. Nothing is fabricated. AI output can still be imperfect, so review before you submit.',
  },
  {
    q: 'Are the exports really ATS-friendly?',
    a: 'Yes — clean single-column layouts with no tables, graphics or unusual fonts, exported as PDF or plain text. Those are the formats applicant tracking systems parse most reliably.',
  },
  {
    q: 'What can I do on the free plan?',
    a: 'Track up to 10 applications, run 5 extractions a month, and generate 2 tailored resumes and cover letters a month. Enough to run the full workflow end to end before you decide to pay anything.',
  },
  {
    q: 'How do tokens and roll-over work?',
    a: 'Extraction and document tokens are valid for 60 days from the day they land in your account, whether from a purchase, an upgrade or a downgrade. Unused tokens roll over on top of new ones and are always spent oldest-first.',
  },
  {
    q: 'Is my resume data safe?',
    a: 'Everything is encrypted at rest and in transit, with row-level security isolating your account from every other. We never share or sell your information.',
  },
]

const SEO_POINTS = [
  {
    icon: LayoutGrid,
    title: 'Visual Job Application Tracking',
    body: 'Spreadsheets break down fast. See every application as a card on a Kanban board grouped by stage — Applied, Interviewing, Offer, Rejected — so your whole job search is clear at a glance.',
  },
  {
    icon: Brain,
    title: 'AI Resume Tailoring',
    body: 'Generic resumes miss the keywords hiring teams scan for. AI analyzes each job description and rewrites your real experience to match the role — without inventing anything.',
  },
  {
    icon: FileText,
    title: 'ATS-Optimized Resumes',
    body: 'Most companies filter resumes with ATS software before a human reads them. Pursuitz exports clean, single-column layouts these systems parse reliably, so you reach more recruiters.',
  },
  {
    icon: Link2,
    title: 'One Link to Apply Faster',
    body: 'Paste a job link to extract the details, track it visually, tailor your resume and cover letter, and download a submit-ready PDF — turning a scattered process into a repeatable system.',
  },
]

// ─── Shared bits ───────────────────────────────────────────────────────────────

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[11px] uppercase tracking-[0.1em]" style={{ color: ACCENT_LB }}>
      {children}
    </div>
  )
}

function Logo() {
  return <BrandLogo />
}

// ─── Sections ────────────────────────────────────────────────────────────────

function NavBar() {
  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur-xl"
      style={{ background: 'rgba(8,9,12,.72)', borderColor: 'rgba(255,255,255,.07)' }}
    >
      <div className="mx-auto flex max-w-[1180px] items-center gap-7 px-6 py-3.5 md:px-7">
        <div className="mr-auto">
          <Logo />
        </div>
        <nav className="hidden items-center gap-6 text-sm md:flex" style={{ color: '#9aa0ac' }}>
          <a href="#features" className="transition-colors hover:text-white">Features</a>
          <a href="#how" className="transition-colors hover:text-white">How it works</a>
          <FreeToolsMenu />
          <a href="#pricing" className="transition-colors hover:text-white">Pricing</a>
          <a href="#faq" className="transition-colors hover:text-white">FAQ</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="px-3 py-2 text-sm transition-colors" style={{ color: '#c8ccd4' }}>
            Log in
          </Link>
          <Link
            href="/auth/sign-up"
            className="rounded-[10px] px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ color: '#08090c', background: ACCENT_HI }}
          >
            Start free
          </Link>
        </div>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="relative px-6 pt-20 md:px-7">
      {/* glow + grid */}
      <div
        className="pointer-events-none absolute inset-x-0 -top-40 h-[620px] anim-glow"
        style={{ background: `radial-gradient(60% 60% at 22% 0%, oklch(0.72 0.16 250 / .20), transparent 70%)` }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.028) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.028) 1px,transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'linear-gradient(180deg,#000,transparent 78%)',
          WebkitMaskImage: 'linear-gradient(180deg,#000,transparent 78%)',
        }}
      />

      <div className="relative mx-auto grid max-w-[1180px] items-center gap-14 lg:grid-cols-2">
        <div>
          <div
            className="inline-flex items-center gap-2.5 whitespace-nowrap rounded-full border py-1.5 pl-2 pr-3 text-[12.5px]"
            style={{ borderColor: 'rgba(255,255,255,.1)', background: 'rgba(255,255,255,.03)', color: '#c8ccd4' }}
          >
            <span className="h-[7px] w-[7px] rounded-full anim-glow" style={{ background: GREEN }} />
            One link in. A tailored application out.
          </div>
          <h1 className="mt-5 text-balance text-[42px] font-semibold leading-[1.03] tracking-[-0.035em] md:text-[56px] lg:text-[66px]">
            Your job search,<br />finally running<br />
            <span className="italic font-medium" style={{ color: ACCENT_HI }}>like a system.</span>
          </h1>
          <p className="mt-6 max-w-[490px] text-pretty text-[18px] leading-relaxed" style={{ color: '#9aa0ac' }}>
            Paste any job link. Pursuitz reads the posting, tracks it on a visual board, tailors your resume and cover
            letter to it, and hands you an ATS-ready PDF. Five minutes, start to submit.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/auth/sign-up"
              className="anim-ring inline-flex items-center gap-2.5 rounded-[13px] px-6 py-3.5 text-[15.5px] font-semibold transition-opacity hover:opacity-90"
              style={{ color: '#08090c', background: ACCENT_HI }}
            >
              Start free — no card
              <ArrowRight className="h-[17px] w-[17px]" />
            </Link>
            <a
              href="#how"
              className="inline-flex items-center rounded-[13px] border px-5 py-3.5 text-[15.5px] font-medium transition-colors hover:bg-white/5"
              style={{ borderColor: 'rgba(255,255,255,.14)', background: 'rgba(255,255,255,.02)', color: '#e6e8ec' }}
            >
              Watch it work
            </a>
          </div>
          <div className="mt-6 flex items-center gap-5 font-mono text-[11.5px] uppercase tracking-[0.04em]" style={{ color: '#6f7684' }}>
            <span>10 applications free</span>
            <span className="h-1 w-1 rounded-full" style={{ background: '#3a3f4a' }} />
            <span>No subscription lock-in</span>
          </div>
        </div>

        {/* app mock */}
        <HeroMock />
      </div>

      {/* source marquee */}
      <div className="mx-auto mt-16 max-w-[1180px] border-t pt-6" style={{ borderColor: 'rgba(255,255,255,.07)' }}>
        <div className="flex items-center gap-6">
          <div className="whitespace-nowrap font-mono text-[10.5px] uppercase tracking-[0.08em]" style={{ color: '#6f7684' }}>
            Reads job links from
          </div>
          <div
            className="flex-1 overflow-hidden"
            style={{ maskImage: 'linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)', WebkitMaskImage: 'linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)' }}
          >
            <div className="flex w-max gap-11 anim-marquee">
              {[0, 1].map((dup) => (
                <div key={dup} className="flex gap-11 text-[15px]" style={{ color: '#767d8b' }} aria-hidden={dup === 1}>
                  {SOURCES.map((s) => (
                    <span key={s}>{s}</span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function HeroMock() {
  const stats = [
    { label: 'Applied', value: '34', accent: false },
    { label: 'Active', value: '12', accent: false },
    { label: 'Interviews', value: '5', accent: false },
    { label: 'Offers', value: '2', accent: true },
  ]
  return (
    <div style={{ perspective: '1600px' }}>
      <div className="anim-float" style={{ transformStyle: 'preserve-3d' }}>
        <div
          className="overflow-hidden rounded-[20px] border"
          style={{
            borderColor: 'rgba(255,255,255,.1)',
            background: 'linear-gradient(180deg,#12141b,#0d0f14)',
            boxShadow: '0 50px 90px -40px rgba(0,0,0,.9)',
          }}
        >
          <div className="flex items-center gap-2 border-b px-4 py-3" style={{ borderColor: 'rgba(255,255,255,.07)' }}>
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-[9px] w-[9px] rounded-full" style={{ background: '#2d323c' }} />
            ))}
            <div className="ml-2.5 flex-1 rounded-md px-2.5 py-1.5 font-mono text-[11px]" style={{ color: '#6f7684', background: 'rgba(255,255,255,.035)' }}>
              app.pursuitz.co/board
            </div>
          </div>

          <div className="p-[18px]">
            <div className="mb-4 grid grid-cols-4 gap-2.5">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border p-3"
                  style={{
                    borderColor: s.accent ? 'oklch(0.72 0.16 155 / .3)' : 'rgba(255,255,255,.07)',
                    background: s.accent ? 'oklch(0.72 0.16 155 / .07)' : 'rgba(255,255,255,.02)',
                  }}
                >
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: s.accent ? GREEN_TX : '#6f7684' }}>
                    {s.label}
                  </div>
                  <div className="mt-1 text-[25px] font-semibold tracking-[-0.02em]" style={{ color: s.accent ? GREEN_TX : undefined }}>
                    {s.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {/* Applied */}
              <div className="flex flex-col gap-2.5">
                <ColLabel>Applied</ColLabel>
                <MockCard company="Stripe" role="Senior Engineer" active>
                  <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10.5px]" style={{ background: 'oklch(0.72 0.16 250 / .16)', color: ACCENT_TX }}>
                    Applied · 2d
                  </span>
                </MockCard>
                <MockCard company="Notion" role="Product Designer" />
              </div>
              {/* Interviewing */}
              <div className="flex flex-col gap-2.5">
                <ColLabel>Interviewing</ColLabel>
                <MockCard company="Linear" role="Frontend Eng">
                  <div className="font-mono text-[10px]" style={{ color: ACCENT_HI }}>TECH SCREEN · MON 10:00</div>
                </MockCard>
                <MockCard company="Figma" role="Staff Designer" />
              </div>
              {/* Offer */}
              <div className="flex flex-col gap-2.5">
                <ColLabel>Offer</ColLabel>
                <MockCard company="Loom" role="Full Stack Dev" green>
                  <div className="font-mono text-[10px]" style={{ color: GREEN_TX }}>OFFER RECEIVED</div>
                </MockCard>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ColLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="pl-0.5 font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: '#6f7684' }}>
      {children}
    </div>
  )
}

function MockCard({
  company,
  role,
  children,
  active,
  green,
}: {
  company: string
  role: string
  children?: React.ReactNode
  active?: boolean
  green?: boolean
}) {
  const border = active ? 'oklch(0.72 0.16 250 / .45)' : green ? 'oklch(0.72 0.16 155 / .35)' : 'rgba(255,255,255,.07)'
  const bg = green ? 'oklch(0.72 0.16 155 / .07)' : active ? 'rgba(255,255,255,.035)' : 'rgba(255,255,255,.02)'
  return (
    <div className="rounded-[11px] border p-3" style={{ borderColor: border, background: bg }}>
      <div className="text-[13px] font-semibold">{company}</div>
      <div className="mt-0.5 text-[11.5px]" style={{ color: '#9aa0ac' }}>{role}</div>
      {children && <div className="mt-2.5">{children}</div>}
    </div>
  )
}

function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-[1180px] px-6 pt-[120px] md:px-7">
      <AnimateIn>
        <Kicker>How it works</Kicker>
        <h2 className="mt-3.5 max-w-[640px] text-balance text-[32px] font-semibold leading-[1.09] tracking-[-0.03em] md:text-[44px]">
          Three steps. The rest is already done for you.
        </h2>
      </AnimateIn>

      <div className="mt-11 grid gap-4 md:grid-cols-3">
        {HOW_IT_WORKS.map((s, i) => (
          <AnimateIn key={s.step} delay={`reveal-delay-${i + 1}` as 'reveal-delay-1'}>
            <div
              className="flex h-full flex-col gap-4 rounded-[20px] border p-[22px]"
              style={{ borderColor: BORDER, background: 'linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.012))' }}
            >
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-[11px]" style={{ color: ACCENT_LB }}>{s.step}</span>
                <h3 className="text-[20px] font-semibold tracking-[-0.02em]">{s.title}</h3>
              </div>
              <p className="text-[14.5px] leading-relaxed" style={{ color: '#9aa0ac' }}>{s.description}</p>
            </div>
          </AnimateIn>
        ))}
      </div>
    </section>
  )
}

function ProblemSection() {
  return (
    <section className="mx-auto max-w-[1180px] px-6 pt-[120px] md:px-7">
      <AnimateIn variant="reveal-scale">
        <div
          className="grid items-center gap-14 rounded-[26px] border p-12 md:grid-cols-2"
          style={{ borderColor: BORDER, background: 'linear-gradient(135deg,rgba(255,255,255,.035),rgba(255,255,255,.008))' }}
        >
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.1em]" style={{ color: '#6f7684' }}>
              The spreadsheet years
            </div>
            <h2 className="mt-3.5 text-balance text-[30px] font-semibold leading-[1.11] tracking-[-0.03em] md:text-[40px]">
              You are not disorganised. Your tools are.
            </h2>
            <p className="mt-5 max-w-[440px] text-[16.5px] leading-relaxed" style={{ color: '#9aa0ac' }}>
              Fifty rows, four resume versions, one missed follow-up. Pursuitz replaces the whole fragile stack with a
              single board that keeps itself current.
            </p>
            <Link
              href="/auth/sign-up"
              className="mt-7 inline-flex items-center gap-2.5 rounded-xl px-5 py-3 text-[15px] font-semibold transition-opacity hover:opacity-90"
              style={{ color: '#08090c', background: ACCENT_HI }}
            >
              Move it all to Pursuitz <MoveRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex flex-col gap-2.5">
            {PROBLEMS.map((p) => (
              <div key={p} className="rounded-xl border px-4 py-3 text-[14.5px]" style={{ borderColor: 'rgba(255,255,255,.07)', background: 'rgba(255,255,255,.02)', color: '#767d8b' }}>
                <span className="line-through">{p}</span>
              </div>
            ))}
            <div
              className="flex items-center gap-2.5 rounded-xl border px-4 py-3 text-[14.5px]"
              style={{ borderColor: 'oklch(0.72 0.16 155 / .35)', background: 'oklch(0.72 0.16 155 / .08)', color: 'oklch(0.88 0.1 155)' }}
            >
              <span className="h-[7px] w-[7px] rounded-full anim-glow" style={{ background: GREEN }} />
              One board. Always current.
            </div>
          </div>
        </div>
      </AnimateIn>
    </section>
  )
}

function Features() {
  return (
    <section id="features" className="mx-auto max-w-[1180px] px-6 pt-[120px] md:px-7">
      <AnimateIn>
        <div className="flex flex-wrap items-end justify-between gap-10">
          <div>
            <Kicker>Features</Kicker>
            <h2 className="mt-3.5 max-w-[600px] text-balance text-[32px] font-semibold leading-[1.09] tracking-[-0.03em] md:text-[44px]">
              Everything between the posting and the offer
            </h2>
          </div>
          <p className="max-w-[330px] text-[15.5px] leading-relaxed" style={{ color: '#9aa0ac' }}>
            Six pieces that do the admin so your energy goes into the conversations that matter.
          </p>
        </div>
      </AnimateIn>

      <div className="mt-11 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <AnimateIn key={f.title} delay={`reveal-delay-${(i % 3) + 1}` as 'reveal-delay-1'}>
            <div
              className="group h-full rounded-[18px] border p-6 transition-colors"
              style={{ borderColor: BORDER, background: 'rgba(255,255,255,.022)' }}
            >
              <div
                className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] transition-transform group-hover:scale-110"
                style={{ background: 'oklch(0.72 0.16 250 / .14)', color: ACCENT_TX }}
              >
                <f.icon className="h-[17px] w-[17px]" />
              </div>
              <h3 className="mt-4 text-[18px] font-semibold tracking-[-0.015em]">{f.title}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed" style={{ color: '#9aa0ac' }}>{f.description}</p>
            </div>
          </AnimateIn>
        ))}
      </div>
    </section>
  )
}

function ProductShowcase() {
  return (
    <section className="mx-auto max-w-[1180px] px-6 pt-[120px] md:px-7">
      <AnimateIn>
        <Kicker>Inside the product</Kicker>
        <h2 className="mt-3.5 max-w-[620px] text-balance text-[32px] font-semibold leading-[1.09] tracking-[-0.03em] md:text-[44px]">
          Quiet interface. Loud results.
        </h2>
      </AnimateIn>

      <div className="mt-11 grid gap-4 lg:grid-cols-2">
        {/* detail */}
        <AnimateIn delay="reveal-delay-1">
          <div className="rounded-[22px] border p-[26px]" style={{ borderColor: BORDER, background: 'linear-gradient(180deg,#12141b,#0c0e13)' }}>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.08em]" style={{ color: '#6f7684' }}>Application detail</div>
            <div className="mt-4 flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl text-[18px] font-semibold" style={{ background: 'oklch(0.72 0.16 250 / .16)', color: ACCENT_TX }}>S</div>
              <div>
                <div className="text-[19px] font-semibold tracking-[-0.02em]">Senior Software Engineer</div>
                <div className="mt-px text-[14px]" style={{ color: '#9aa0ac' }}>Stripe · Bengaluru, IN (Hybrid)</div>
              </div>
              <div className="anim-glow ml-auto rounded-full px-3 py-1.5 text-[12px] font-medium" style={{ background: 'oklch(0.72 0.16 250 / .14)', color: ACCENT_TX }}>
                Interviewing
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              {[
                { label: 'Salary band', value: '₹18,00,000 – ₹28,00,000', mono: false },
                { label: 'Applied', value: '12 June 2026', mono: false },
                { label: 'Resume sent', value: 'stripe-tailored-v2.pdf', mono: true },
                { label: 'Next step', value: 'HR call · Fri 09:00', mono: false },
              ].map((r) => (
                <div key={r.label} className="rounded-[13px] border px-4 py-3" style={{ borderColor: 'rgba(255,255,255,.07)', background: 'rgba(255,255,255,.02)' }}>
                  <div className="text-[11.5px]" style={{ color: '#6f7684' }}>{r.label}</div>
                  <div className={`mt-1 ${r.mono ? 'font-mono text-[12.5px]' : 'text-[15px]'}`} style={{ color: r.mono ? ACCENT_TX : undefined }}>{r.value}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-col gap-2.5 border-t pt-4" style={{ borderColor: 'rgba(255,255,255,.07)' }}>
              {[
                { dot: GREEN, text: 'Recruiter screen — went well, asked about payments infra', date: '14 JUN', muted: false },
                { dot: ACCENT, text: 'Technical screen scheduled', date: '16 JUN', muted: false },
                { dot: 'rgba(255,255,255,.16)', text: 'Prep reminder — 24h before', date: 'SET', muted: true },
              ].map((row) => (
                <div key={row.text} className="flex items-center gap-3">
                  <div className="h-[9px] w-[9px] rounded-full" style={{ background: row.dot }} />
                  <div className="text-[13.5px]" style={{ color: row.muted ? '#767d8b' : '#c8ccd4' }}>{row.text}</div>
                  <div className="ml-auto font-mono text-[10.5px]" style={{ color: '#6f7684' }}>{row.date}</div>
                </div>
              ))}
            </div>
          </div>
        </AnimateIn>

        {/* analytics + week */}
        <AnimateIn delay="reveal-delay-2">
          <div className="flex flex-col gap-4">
            <div className="rounded-[22px] border p-[26px]" style={{ borderColor: BORDER, background: 'linear-gradient(180deg,#12141b,#0c0e13)' }}>
              <div className="font-mono text-[10.5px] uppercase tracking-[0.08em]" style={{ color: '#6f7684' }}>Analytics</div>
              <div className="mt-4 flex gap-7">
                <div>
                  <div className="text-[38px] font-semibold tracking-[-0.03em]">38%</div>
                  <div className="mt-0.5 text-[12.5px]" style={{ color: '#9aa0ac' }}>Response rate</div>
                  <div className="mt-1.5 text-[11.5px]" style={{ color: GREEN_TX }}>↑ 12 pts vs last month</div>
                </div>
                <div>
                  <div className="text-[38px] font-semibold tracking-[-0.03em]">14%</div>
                  <div className="mt-0.5 text-[12.5px]" style={{ color: '#9aa0ac' }}>Interview rate</div>
                  <div className="mt-1.5 text-[11.5px]" style={{ color: '#767d8b' }}>5 of 34 applications</div>
                </div>
              </div>
              <div className="mt-5 flex h-[78px] items-end gap-[7px]">
                {[38, 56, 44, 72, 62, 88, 100].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-[5px]"
                    style={{ height: `${h}%`, background: i === 6 ? GREEN : i === 5 ? ACCENT : i === 3 ? 'oklch(0.72 0.16 250 / .5)' : 'rgba(255,255,255,.1)' }}
                  />
                ))}
              </div>
            </div>

            <div className="flex-1 rounded-[22px] border p-[26px]" style={{ borderColor: BORDER, background: 'linear-gradient(180deg,#12141b,#0c0e13)' }}>
              <div className="font-mono text-[10.5px] uppercase tracking-[0.08em]" style={{ color: '#6f7684' }}>This week</div>
              <div className="mt-4 flex flex-col gap-2.5">
                {[
                  { day: 'MON', text: 'Linear · Technical screen', time: '10:00' },
                  { day: 'WED', text: 'Figma · Final round', time: '14:30' },
                  { day: 'FRI', text: 'Stripe · HR call', time: '09:00' },
                ].map((e) => (
                  <div key={e.day} className="flex items-center gap-3 rounded-xl px-3.5 py-3" style={{ background: 'rgba(255,255,255,.028)' }}>
                    <div className="w-11 font-mono text-[10.5px]" style={{ color: ACCENT_HI }}>{e.day}</div>
                    <div className="flex-1 text-[13.5px]">{e.text}</div>
                    <div className="text-[12px]" style={{ color: '#9aa0ac' }}>{e.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AnimateIn>
      </div>
    </section>
  )
}

function FreeToolsSection() {
  const tools = [
    { href: '/tools/ats-resume-scanner', title: 'ATS resume scanner', body: 'Drop in your CV and a job description. See the keyword gaps a filter would catch before a human ever reads it.' },
    { href: '/tools/cover-letter-generator', title: 'Cover letter generator', body: 'Two lines of context and the posting. Out comes a letter that sounds like you wrote it on a good day.' },
    { href: '/tools/salary-take-home-calculator', title: 'Take-home calculator', body: 'Turn a CTC number into what actually lands in your account each month — before you negotiate.' },
    { href: '/tools/resume-word-counter', title: 'Resume word counter', body: 'Length, section balance and reading time, so a recruiter six-second scan lands where you want it.' },
  ]
  return (
    <section id="tools" className="mx-auto max-w-[1180px] px-6 pt-[120px] md:px-7">
      <AnimateIn>
        <div className="flex flex-wrap items-end justify-between gap-10">
          <div>
            <Kicker>Free tools · no account</Kicker>
            <h2 className="mt-3.5 max-w-[620px] text-balance text-[32px] font-semibold leading-[1.09] tracking-[-0.03em] md:text-[44px]">
              Try us without signing up
            </h2>
          </div>
          <Link
            href="/tools"
            className="inline-flex items-center gap-2.5 rounded-xl border px-5 py-3 text-[15px] font-semibold transition-colors hover:bg-white/5"
            style={{ borderColor: 'rgba(255,255,255,.14)', background: 'rgba(255,255,255,.02)', color: '#e6e8ec' }}
          >
            Browse all tools <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </AnimateIn>

      <div className="mt-11 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tools.map((t, i) => (
          <AnimateIn key={t.href} delay={`reveal-delay-${(i % 4) + 1}` as 'reveal-delay-1'}>
            <Link
              href={t.href}
              className="group flex h-full flex-col gap-4 rounded-[20px] border p-[22px] transition-colors hover:bg-white/5"
              style={{ borderColor: BORDER, background: 'linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.012))' }}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[18px] font-semibold tracking-[-0.015em]">{t.title}</h3>
                <ArrowUpRight className="h-[18px] w-[18px] shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" style={{ color: ACCENT_TX }} />
              </div>
              <p className="text-[14.5px] leading-relaxed" style={{ color: '#9aa0ac' }}>{t.body}</p>
            </Link>
          </AnimateIn>
        ))}
      </div>
    </section>
  )
}

function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-[1180px] px-6 pt-[120px] md:px-7">
      <AnimateIn>
        <div className="text-center">
          <Kicker>Pricing</Kicker>
          <h2 className="mx-auto mt-3.5 text-balance text-[32px] font-semibold leading-[1.09] tracking-[-0.03em] md:text-[44px]">
            Start free. Pay only for AI power.
          </h2>
          <p className="mx-auto mt-4 max-w-[520px] text-[16.5px]" style={{ color: '#9aa0ac' }}>
            No subscriptions to escape. Top up when you are applying hard, pause when you are not.
          </p>
        </div>
      </AnimateIn>

      <div className="mt-11 grid items-start gap-4 md:grid-cols-3">
        {PRICING_TIERS.map((tier, i) => (
          <AnimateIn key={tier.id} variant="reveal-scale" delay={`reveal-delay-${i + 1}` as 'reveal-delay-1'}>
            <div
              className="relative h-full overflow-hidden rounded-[20px] border p-7"
              style={
                tier.highlighted
                  ? {
                      borderColor: 'oklch(0.72 0.16 250 / .45)',
                      background: 'linear-gradient(180deg,oklch(0.72 0.16 250 / .12),rgba(255,255,255,.02))',
                      boxShadow: '0 30px 70px -40px oklch(0.72 0.16 250 / .6)',
                    }
                  : { borderColor: BORDER, background: 'rgba(255,255,255,.022)' }
              }
            >
              {tier.highlighted && (
                <div className="pointer-events-none absolute inset-0 anim-sweep" style={{ background: 'linear-gradient(100deg,transparent,oklch(0.82 0.13 250 / .09),transparent)' }} />
              )}
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="text-[15px] font-semibold">{tier.name}</div>
                  {tier.highlighted && (
                    <div className="rounded-full px-2.5 py-1 font-mono text-[10px] tracking-[0.06em]" style={{ background: ACCENT_HI, color: '#08090c' }}>
                      MOST POPULAR
                    </div>
                  )}
                </div>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-[42px] font-semibold tracking-[-0.035em]">{tier.price}</span>
                  <span className="text-[14px]" style={{ color: '#6f7684' }}>{tier.period}</span>
                </div>
                <p className="mt-2.5 text-[14px] leading-relaxed" style={{ color: '#9aa0ac' }}>{tier.description}</p>
                <div className="mt-5 flex flex-col gap-2.5 text-[14px]" style={{ color: '#c8ccd4' }}>
                  {tier.features.map((f) => (
                    <div key={f} className="flex gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: tier.highlighted ? ACCENT_TX : GREEN_TX }} />
                      {f}
                    </div>
                  ))}
                </div>
                <Link
                  href={tier.href}
                  className="mt-6 block rounded-xl py-3 text-center text-[14.5px] font-semibold transition-opacity hover:opacity-90"
                  style={
                    tier.highlighted
                      ? { background: ACCENT_HI, color: '#08090c' }
                      : { border: `1px solid rgba(255,255,255,.14)`, color: '#e6e8ec' }
                  }
                >
                  {tier.cta}
                </Link>
              </div>
            </div>
          </AnimateIn>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-5 text-[13px]" style={{ color: '#767d8b' }}>
        <span>Tokens valid 60 days · unused roll over</span>
        <span>Encrypted at rest and in transit</span>
        <span>Change or cancel any time</span>
      </div>
    </section>
  )
}

function FAQ() {
  return (
    <section id="faq" className="mx-auto max-w-[880px] px-6 pt-[120px] md:px-7">
      <AnimateIn>
        <Kicker>FAQ</Kicker>
        <h2 className="mt-3.5 text-balance text-[30px] font-semibold leading-[1.11] tracking-[-0.03em] md:text-[40px]">
          Questions worth asking
        </h2>
      </AnimateIn>
      <div className="mt-8 flex flex-col gap-2.5">
        {FAQS.map((faq, i) => (
          <details
            key={faq.q}
            className="group rounded-[14px] border px-5 py-4"
            style={{ borderColor: BORDER, background: 'rgba(255,255,255,.022)' }}
            open={i === 0}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-medium [&::-webkit-details-marker]:hidden">
              {faq.q}
              <span className="text-[18px] transition-transform group-open:rotate-45" style={{ color: ACCENT_HI }}>+</span>
            </summary>
            <p className="mt-3 text-[14.5px] leading-relaxed" style={{ color: '#9aa0ac' }}>{faq.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

function FinalCTA() {
  return (
    <section className="mx-auto max-w-[1180px] px-6 pt-[120px] md:px-7">
      <AnimateIn variant="reveal-scale">
        <div
          className="relative overflow-hidden rounded-[28px] border px-10 py-[72px] text-center"
          style={{ borderColor: 'oklch(0.72 0.16 250 / .3)', background: 'linear-gradient(160deg,oklch(0.72 0.16 250 / .16),rgba(255,255,255,.02) 60%)' }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px)',
              backgroundSize: '48px 48px',
              maskImage: 'radial-gradient(60% 80% at 50% 40%,#000,transparent)',
              WebkitMaskImage: 'radial-gradient(60% 80% at 50% 40%,#000,transparent)',
            }}
          />
          <div className="pointer-events-none absolute inset-0 anim-sweep" style={{ background: 'linear-gradient(100deg,transparent,oklch(0.86 0.12 250 / .07),transparent)' }} />
          <div className="relative">
            <h2 className="mx-auto max-w-[720px] text-balance text-[34px] font-semibold leading-[1.07] tracking-[-0.035em] md:text-[50px]">
              Spend less time organising.<br />Spend it getting hired.
            </h2>
            <p className="mx-auto mt-5 max-w-[480px] text-[17px]" style={{ color: '#c8ccd4' }}>
              Your first ten applications are free. Paste a link and see the whole thing work in under five minutes.
            </p>
            <Link
              href="/auth/sign-up"
              className="anim-ring mt-8 inline-flex items-center gap-2.5 rounded-[14px] px-7 py-4 text-[16px] font-semibold transition-opacity hover:opacity-90"
              style={{ color: '#08090c', background: 'oklch(0.86 0.12 250)' }}
            >
              Start free — no card <ArrowRight className="h-[18px] w-[18px]" />
            </Link>
            <div className="mt-5 font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: '#767d8b' }}>
              Free forever for up to 10 applications
            </div>
          </div>
        </div>
      </AnimateIn>
    </section>
  )
}

function SeoContent() {
  return (
    <section className="mx-auto max-w-[1180px] px-6 pt-[120px] md:px-7">
      <AnimateIn>
        <div className="mx-auto max-w-[640px] text-center">
          <h2 className="text-balance text-[28px] font-semibold tracking-[-0.02em] md:text-[36px]">
            Why Use an AI Job Application Tracker?
          </h2>
          <p className="mt-4 text-pretty text-[16.5px] leading-relaxed" style={{ color: '#9aa0ac' }}>
            Stop juggling spreadsheets. Pursuitz combines visual tracking, AI resume tailoring, and ATS-ready exports so
            you apply to more roles with less effort.
          </p>
        </div>
      </AnimateIn>
      <div className="mt-11 grid gap-4 sm:grid-cols-2">
        {SEO_POINTS.map((point, i) => {
          const Icon = point.icon
          return (
            <AnimateIn key={point.title} delay={`reveal-delay-${(i % 4) + 1}` as 'reveal-delay-1'}>
              <div className="h-full rounded-[18px] border p-7" style={{ borderColor: BORDER, background: 'rgba(255,255,255,.022)' }}>
                <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px]" style={{ background: 'oklch(0.72 0.16 250 / .14)', color: ACCENT_TX }}>
                  <Icon className="h-[17px] w-[17px]" />
                </div>
                <h3 className="mt-4 text-[18px] font-semibold">{point.title}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed" style={{ color: '#9aa0ac' }}>{point.body}</p>
              </div>
            </AnimateIn>
          )
        })}
      </div>
    </section>
  )
}

function Footer() {
  const cols = [
    { title: 'Product', links: [['Features', '#features'], ['Pricing', '#pricing'], ['How it works', '#how'], ['FAQ', '#faq']] },
    {
      title: 'Free tools',
      links: [
        ['ATS resume scanner', '/tools/ats-resume-scanner'],
        ['Cover letter generator', '/tools/cover-letter-generator'],
        ['Take-home calculator', '/tools/salary-take-home-calculator'],
        ['Resume word counter', '/tools/resume-word-counter'],
        ['All tools', '/tools'],
      ],
    },
    { title: 'Account', links: [['Sign up', '/auth/sign-up'], ['Log in', '/auth/login']] },
    { title: 'Legal', links: [['Privacy', '/privacy'], ['Terms', '/terms'], ['info@pursuitz.co', 'mailto:info@pursuitz.co']] },
  ]
  return (
    <footer className="mx-auto max-w-[1180px] px-6 pb-10 pt-20 md:px-7">
      <div className="grid gap-10 border-t pt-10 md:grid-cols-[1.6fr_repeat(4,1fr)]" style={{ borderColor: 'rgba(255,255,255,.07)' }}>
        <div>
          <Logo />
          <p className="mt-3.5 max-w-[280px] text-[13.5px] leading-relaxed" style={{ color: '#767d8b' }}>
            AI job application management for people running a serious search.
          </p>
        </div>
        {cols.map((col) => (
          <div key={col.title} className="flex flex-col gap-2.5 text-[13.5px]">
            <div className="mb-0.5 font-medium text-foreground">{col.title}</div>
            {col.links.map(([label, href]) => (
              <a key={label} href={href} className="transition-colors hover:text-white" style={{ color: '#767d8b' }}>
                {label}
              </a>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-9 flex flex-wrap justify-between gap-4 border-t pt-6 text-[11.5px] leading-relaxed" style={{ borderColor: 'rgba(255,255,255,.05)', color: '#5c626e' }}>
        <span className="max-w-[640px]">
          Pursuitz is a personal organisation tool; using it does not guarantee employment, interviews or offers.
          AI-generated content may be inaccurate — always review before submitting.
        </span>
        <span>© 2026 Pursuitz</span>
      </div>
    </footer>
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
          { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'INR' },
          { '@type': 'Offer', name: 'Pro', price: String(SUBSCRIPTION_PRICING.pro), priceCurrency: 'INR' },
          { '@type': 'Offer', name: 'Premium', price: String(SUBSCRIPTION_PRICING.premium), priceCurrency: 'INR' },
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
          acceptedAnswer: { '@type': 'Answer', text: faq.a },
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
    <div className="min-h-screen overflow-x-hidden text-[#f3f4f6]" style={{ background: '#08090c' }}>
      <StructuredData />
      <NavBar />
      <Hero />
      <HowItWorks />
      <ProblemSection />
      <Features />
      <ProductShowcase />
      <FreeToolsSection />
      <SeoContent />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
      <div className="h-20" />
    </div>
  )
}
