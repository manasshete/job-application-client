import Link from 'next/link'
import type { ReactNode } from 'react'
import { BrandLogo } from '@/components/brand-logo'

const BG = '#08090c'
const TEXT = '#f3f4f6'
const MUTED = '#767d8b'
const ACCENT_TX = 'oklch(0.78 0.14 250)'

type Highlight = { label: string }

export function AuthShell({
  children,
  kicker,
  headline,
  subhead,
  highlights,
}: {
  children: ReactNode
  kicker: string
  headline: ReactNode
  subhead: string
  highlights?: Highlight[]
}) {
  return (
    <div
      className="dark relative flex min-h-svh w-full overflow-hidden font-sans"
      style={{ background: BG, color: TEXT }}
    >
      {/* Grid + glow backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.04) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
          maskImage: 'radial-gradient(circle at 30% 20%, black, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(circle at 30% 20%, black, transparent 75%)',
        }}
      />
      <div
        aria-hidden="true"
        className="anim-glow pointer-events-none absolute -left-40 top-[-10rem] h-[34rem] w-[34rem] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, oklch(0.72 0.16 250 / .30), transparent 65%)' }}
      />

      {/* Left branding panel */}
      <aside className="relative z-10 hidden w-1/2 flex-col justify-between p-12 lg:flex">
        <Link href="/" aria-label="Pursuitz home">
          <BrandLogo markClassName="h-9 w-9 rounded-xl" wordmarkClassName="text-lg" />
        </Link>

        <div className="max-w-md">
          <p
            className="font-mono text-[11px] uppercase tracking-[0.18em]"
            style={{ color: ACCENT_TX }}
          >
            {kicker}
          </p>
          <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.08] tracking-tight">
            {headline}
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed" style={{ color: MUTED }}>
            {subhead}
          </p>

          {highlights && highlights.length > 0 && (
            <ul className="mt-9 flex flex-col gap-3.5">
              {highlights.map((h) => (
                <li key={h.label} className="flex items-center gap-3 text-sm" style={{ color: '#c7cbd4' }}>
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: 'oklch(0.72 0.16 250)' }}
                  />
                  {h.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="font-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: '#4b515e' }}>
          Job search, run like a system
        </p>
      </aside>

      {/* Right content panel */}
      <main className="relative z-10 flex w-full items-center justify-center p-6 sm:p-8 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link href="/" className="mb-8 flex justify-center lg:hidden" aria-label="Pursuitz home">
            <BrandLogo markClassName="h-9 w-9 rounded-xl" wordmarkClassName="text-2xl" />
          </Link>
          {children}
        </div>
      </main>
    </div>
  )
}

export const AUTH_CARD_STYLE = {
  background: 'rgba(14,16,21,.9)',
  borderColor: 'rgba(255,255,255,.08)',
  boxShadow: '0 34px 70px -30px rgba(0,0,0,.9)',
} as const
