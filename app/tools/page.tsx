import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { FREE_TOOLS } from '@/lib/tools'
import { ToolIcon } from '@/components/tools/tool-icon'
import { SignupCTA } from '@/components/tools/tools-chrome'

export const metadata: Metadata = {
  title: 'Free Job Search Tools — Pursuitz',
  description:
    'Free tools for your job search: ATS resume scanner, resume readability checker, and cover letter generator. No sign-up required.',
  alternates: { canonical: '/tools' },
}

export default function ToolsIndexPage() {
  return (
    <div className="fade pub-in" style={{ paddingTop: 48, paddingBottom: 80 }}>
      <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto' }}>
        <span className="badge badge-accent" style={{ padding: '4px 12px', fontSize: 12 }}>
          <Check style={{ width: 14, height: 14 }} aria-hidden="true" />
          <span>100% free · No account needed</span>
        </span>
        <h1 className="h1" style={{ fontSize: 'clamp(32px, 4.5vw, 48px)', marginTop: 16 }}>
          Free tools for your job search
        </h1>
        <p className="muted" style={{ marginTop: 14, fontSize: 'var(--text-lead)', lineHeight: 1.6 }}>
          Quick, private tools that run entirely in your browser. Use them anytime — no sign-up, no limits, no catch.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 20, maxWidth: 960, margin: '48px auto 0' }}>
        {FREE_TOOLS.map((tool) => (
          <Link
            key={tool.slug}
            href={`/tools/${tool.slug}`}
            className="panel"
            style={{ display: 'flex', flexDirection: 'column', padding: 24, textDecoration: 'none' }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius)', display: 'grid', placeItems: 'center', background: 'var(--accent-soft)', color: 'var(--accent-text)', marginBottom: 16 }}>
              <ToolIcon name={tool.icon} className="size-5" />
            </div>
            <h2 className="h2" style={{ fontSize: 18, margin: 0 }}>{tool.title}</h2>
            <p className="muted" style={{ margin: '8px 0 16px', fontSize: 'var(--text-sm)', lineHeight: 1.55, flex: 1 }}>
              {tool.description}
            </p>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--accent-text)' }}>
              Open tool
              <ArrowRight style={{ width: 16, height: 16 }} aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>

      <SignupCTA />
    </div>
  )
}
