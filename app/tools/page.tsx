import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/server'
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

export default async function ToolsIndexPage() {
  if (await getCurrentUser()) redirect('/dashboard/tools')
  return (
    <>
      <section className="border-b border-slate-100 bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">
            <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
            100% free · No account needed
          </p>
          <h1 className="mx-auto mt-6 max-w-2xl text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Free tools for your job search
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-lg leading-relaxed text-slate-500">
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
              className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-blue-200 hover:shadow-lg hover:shadow-slate-200/60"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                <ToolIcon name={tool.icon} className="h-6 w-6" />
              </span>
              <h2 className="mt-5 text-lg font-semibold text-slate-900">{tool.title}</h2>
              <p className="mt-2 flex-1 text-pretty text-sm leading-relaxed text-slate-500">
                {tool.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600">
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
