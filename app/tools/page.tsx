import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { FREE_TOOLS } from '@/lib/tools'
import { ToolIcon } from '@/components/tools/tool-icon'
import { SignupCTA } from '@/components/tools/tools-chrome'

export const metadata: Metadata = {
  title: 'Free Job Search Tools — Pursuitz',
  description:
    'Free tools for your job search: ATS resume scanner, salary take-home calculator, resume readability checker, and cover letter generator. No sign-up required.',
  alternates: { canonical: '/tools' },
}

export default function ToolsIndexPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-white/[0.07] py-16 sm:py-20">
        <div className="claude-grid absolute inset-0 opacity-40" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-[#9da3af]">
            <Check className="size-3.5 text-[#7894f8]" aria-hidden="true" />
            100% free · No account needed
          </p>
          <h1 className="mx-auto mt-6 max-w-2xl text-balance text-4xl font-semibold tracking-[-0.035em] text-[#f4f5f7] sm:text-5xl">
            Free tools for your job search
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-lg leading-relaxed text-[#8b919e]">
            Quick, private tools that run entirely in your browser. Use them anytime — no sign-up,
            no limits, no catch.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-14">
        <div className="grid gap-5 sm:grid-cols-2">
          {FREE_TOOLS.map((tool) => (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              className="group flex flex-col rounded-2xl border border-white/[0.09] bg-[#101217] p-6 transition-colors hover:border-[#7894f8]/40 hover:bg-[#13161c]"
            >
              <span className="flex size-12 items-center justify-center rounded-xl border border-[#7894f8]/30 bg-[#7894f8]/10 text-[#9aafff] transition-colors group-hover:bg-[#7894f8] group-hover:text-[#08090c]">
                <ToolIcon name={tool.icon} className="size-6" />
              </span>
              <h2 className="mt-5 text-lg font-semibold text-[#f4f5f7]">{tool.title}</h2>
              <p className="mt-2 flex-1 text-pretty text-sm leading-relaxed text-[#8b919e]">
                {tool.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#9aafff]">
                Open tool
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <SignupCTA />
    </>
  )
}
