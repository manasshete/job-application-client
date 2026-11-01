'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { Brand } from './brand'
import { ThemeCycle } from './theme'

const LINKS: [string, string][] = [['Free tools', '/#tools'], ['Pricing', '/#pricing'], ['FAQ', '/#faq']]

export function PublicHeader() {
  return (
    <header className="pub-head">
      <div className="pub-bar">
        <Link href="/" className="brand" style={{ padding: 0 }} aria-label="Pursuitz home">
          <Brand />
        </Link>
        <span className="pub-acts">
          <span className="desk-only pub-links">
            {LINKS.map(([label, href]) => (
              <Link key={href} href={href} className="btn btn-t">{label}</Link>
            ))}
          </span>
          <ThemeCycle />
          <Link href="/auth/login" className="btn btn-t">Log in</Link>
          <Link href="/auth/sign-up" className="btn btn-q">Sign up</Link>
        </span>
      </div>
    </header>
  )
}

export function PublicFooter() {
  return (
    <footer className="pub-foot">
      <div className="pub-foot-in">
        <p className="pub-mast">Pursuitz</p>
        <div className="pub-foot-links">
          <Link href="/privacy" className="muted">Privacy Policy</Link>
          <Link href="/terms" className="muted">Terms</Link>
          <span className="muted">info@pursuitz.co</span>
        </div>
        <p className="pub-foot-legal">
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
