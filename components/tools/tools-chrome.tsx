import Link from 'next/link'
import { ArrowRight, Check, Sparkles, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FreeToolsMenu } from '@/components/landing/free-tools-menu'
import { BrandLogo } from '@/components/brand-logo'

export function ToolsNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#08090c]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" aria-label="Pursuitz home">
            <BrandLogo markClassName="size-8" wordmarkClassName="text-lg text-[#f4f5f7]" />
          </Link>
          <nav className="hidden items-center gap-8 md:flex" aria-label="Tools navigation">
            <FreeToolsMenu />
            <Link href="/#features" className="text-sm text-[#8b919e] transition-colors hover:text-[#f4f5f7]">Features</Link>
            <Link href="/#pricing" className="text-sm text-[#8b919e] transition-colors hover:text-[#f4f5f7]">Pricing</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="hidden text-sm font-medium text-[#8b919e] transition-colors hover:text-[#f4f5f7] sm:block">Log in</Link>
          <Button asChild size="sm" className="rounded-full bg-[#7894f8] text-[#08090c] hover:bg-[#8fa7ff]">
            <Link href="/auth/sign-up">Get started free</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

export function ToolHero({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <section className="relative overflow-hidden border-b border-white/[0.07] py-16 sm:py-20">
      <div className="claude-grid absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-[#7894f8]/30 bg-[#7894f8]/10 text-[#9aafff] shadow-[0_0_40px_rgba(120,148,248,0.12)]">
          <Icon className="size-7" aria-hidden="true" />
        </div>
        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-[#7894f8]">Pursuitz free utility</p>
        <h1 className="mx-auto mt-4 max-w-2xl text-balance text-4xl font-semibold tracking-[-0.035em] text-[#f4f5f7] sm:text-5xl">{title}</h1>
        <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-[#8b919e]">{description}</p>
        <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-[#9da3af]">
          <Check className="size-3.5 text-[#7894f8]" aria-hidden="true" /> Free · No sign-up · Private
        </p>
      </div>
    </section>
  )
}

export function SignupCTA() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-20">
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.09] bg-[#101217] px-8 py-14 text-center shadow-[0_30px_80px_rgba(0,0,0,0.28)] sm:px-12">
        <div className="claude-grid absolute inset-0 opacity-25" aria-hidden="true" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[#7894f8]"><Sparkles className="size-3.5" aria-hidden="true" /> Beyond the free tools</span>
          <h2 className="mx-auto mt-5 max-w-xl text-balance text-3xl font-semibold tracking-[-0.03em] text-[#f4f5f7] sm:text-4xl">Let Pursuitz run the whole search.</h2>
          <p className="mx-auto mt-4 max-w-lg text-pretty leading-relaxed text-[#8b919e]">Track every application, tailor each resume, and create role-specific cover letters from one focused workspace.</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="rounded-full bg-[#7894f8] text-[#08090c] hover:bg-[#8fa7ff]"><Link href="/auth/sign-up">Get started free<ArrowRight data-icon="inline-end" /></Link></Button>
            <Button asChild size="lg" variant="ghost" className="rounded-full text-[#c8ccd5] hover:bg-white/[0.06] hover:text-white"><Link href="/#pricing">See plans</Link></Button>
          </div>
        </div>
      </div>
    </section>
  )
}

export function ToolsFooter() {
  return (
    <footer className="border-t border-white/[0.07] bg-[#08090c]">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
        <Link href="/" aria-label="Pursuitz home"><BrandLogo markClassName="size-7 rounded-md" wordmarkClassName="text-sm text-[#f4f5f7]" /></Link>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#59606d]">Free job-search tools · Built by Pursuitz</p>
      </div>
    </footer>
  )
}
