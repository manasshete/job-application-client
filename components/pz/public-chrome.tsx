'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { Brand } from './brand'
import { ThemeCycle, ThemeToggle } from './theme'

const LINKS: [string, string][] = [['Free tools', '/#tools'], ['Pricing', '/#pricing'], ['FAQ', '/#faq']]

export function PublicHeader() {
  return (
    <header className="pub-head">
      <div className="pub-in pub-bar">
        <Link href="/" className="brand" style={{ padding: 0 }} aria-label="Pursuitz home">
          <Brand />
        </Link>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span className="desk-only" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {LINKS.map(([label, href]) => (
              <Link key={href} href={href} className="btn btn-t" style={{ color: 'var(--text-muted)' }}>{label}</Link>
            ))}
            <ThemeToggle minHeight={36} style={{ margin: '0 12px' }} />
          </span>
          <span className="only-phone"><ThemeCycle /></span>
          <Link href="/auth/login" className="btn btn-t">Log in</Link>
          <Link href="/auth/sign-up" className="btn btn-p">Sign up</Link>
        </span>
      </div>
    </header>
  )
}

export function PublicFooter() {
  return (
    <footer className="pub-foot">
      <div className="pub-in" style={{ paddingTop: 32, paddingBottom: 40, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 24px', fontSize: 'var(--text-sm)' }}>
          <Link href="/privacy" className="muted">Privacy Policy</Link>
          <Link href="/terms" className="muted">Terms</Link>
          <span className="muted">info@pursuitz.co</span>
        </div>
        <p className="muted" style={{ fontSize: 'var(--text-xs)', lineHeight: 1.65, maxWidth: '62em' }}>
          Pursuitz is a personal organisation tool; using it does not guarantee employment, interviews or offers. AI-generated content may be inaccurate — always review before submitting.
        </p>
      </div>
    </footer>
  )
}

/** Header, page and footer for the landing page, sign-in screens and legal pages. */
export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="pub-page">
      <PublicHeader />
      <div style={{ flex: 1 }}>{children}</div>
      <PublicFooter />
    </div>
  )
}
