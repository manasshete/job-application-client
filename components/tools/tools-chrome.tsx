import Link from 'next/link'
import { ArrowRight, Check, Sparkles, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FreeToolsMenu } from '@/components/landing/free-tools-menu'

/**
 * ToolsNav — top navigation for all /tools pages.
 * Mirrors the landing nav styling (light, slate, blue-600 accent).
 */
export function ToolsNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
              P
            </span>
            <span className="text-lg font-bold tracking-tight text-slate-900">Pursuitz</span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <FreeToolsMenu />
            <Link href="/#features" className="text-sm text-slate-600 transition-colors hover:text-slate-900">
              Features
            </Link>
            <Link href="/#pricing" className="text-sm text-slate-600 transition-colors hover:text-slate-900">
              Pricing
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="hidden text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 sm:block"
          >
            Log in
          </Link>
          <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Link href="/auth/sign-up">Get started free</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

/**
 * ToolHero — consistent page header for each free tool.
 */
export function ToolHero({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <section className="border-b border-slate-100 bg-slate-50 py-14 sm:py-16">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-sm">
          <Icon className="h-7 w-7 text-white" />
        </div>
        <h1 className="mx-auto mt-6 max-w-2xl text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg leading-relaxed text-slate-500">
          {description}
        </p>
        <p className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">
          <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
          Free · No sign-up · Runs in your browser
        </p>
      </div>
    </section>
  )
}

/**
 * SignupCTA — soft upsell shown below every tool's results.
 */
export function SignupCTA() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-14">
      <div className="overflow-hidden rounded-3xl bg-slate-900 px-8 py-12 text-center sm:px-12">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-blue-200">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Pursuitz
        </span>
        <h2 className="mx-auto mt-5 max-w-xl text-balance text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Let Pursuitz do this automatically
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-pretty leading-relaxed text-slate-300">
          These free tools are just the start. Pursuitz tracks every application, tailors your resume
          with AI, and writes cover letters for each role — all in one place.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
            <Link href="/auth/sign-up">
              Get started free
              <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="ghost"
            className="text-slate-200 hover:bg-white/10 hover:text-white"
          >
            <Link href="/#pricing">See plans</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

/**
 * ToolsFooter — compact footer for /tools pages.
 */
export function ToolsFooter() {
  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-xs font-bold text-white">
            P
          </span>
          <span className="text-sm font-semibold text-slate-900">Pursuitz</span>
        </Link>
        <p className="text-xs text-slate-400">
          Free job-search tools · Built by Pursuitz
        </p>
      </div>
    </footer>
  )
}
