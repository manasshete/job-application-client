import Link from 'next/link'
import { ArrowLeft, Check, Sparkles, type LucideIcon } from 'lucide-react'

export function ToolHero({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <section style={{ borderBottom: '1px solid var(--border)', padding: '48px 24px 40px', textAlign: 'center' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <Link href="/tools" className="tl-back">
            <ArrowLeft style={{ width: 14, height: 14 }} aria-hidden="true" />
            <span>All free tools</span>
          </Link>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: 14, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--accent-text)', marginBottom: 16 }}>
          <Icon style={{ width: 26, height: 26 }} aria-hidden="true" />
        </div>
        <div className="lbl" style={{ letterSpacing: '0.14em', marginBottom: 8 }}>Pursuitz free utility</div>
        <h1 className="h1" style={{ fontSize: 'clamp(28px, 4vw, 42px)', margin: '0 auto', maxWidth: 640 }}>{title}</h1>
        <p className="muted" style={{ margin: '14px auto 0', maxWidth: 580, fontSize: 'var(--text-lead)', lineHeight: 1.6 }}>{description}</p>
        <div style={{ marginTop: 20 }}>
          <span className="badge badge-accent" style={{ padding: '4px 12px', fontSize: 12 }}>
            <Check style={{ width: 14, height: 14 }} aria-hidden="true" />
            <span>Free · No sign-up · Runs in browser</span>
          </span>
        </div>
      </div>
    </section>
  )
}

export function SignupCTA() {
  return (
    <section style={{ maxWidth: 880, margin: '64px auto 80px', padding: '0 24px' }}>
      <div className="panel" style={{ padding: '48px 32px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <span className="lbl" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <Sparkles style={{ width: 14, height: 14, color: 'var(--accent-text)' }} aria-hidden="true" />
          Beyond the free tools
        </span>
        <h2 className="h1" style={{ fontSize: 'clamp(24px, 3.2vw, 34px)', margin: '0 auto', maxWidth: 560 }}>
          Let Pursuitz run your whole job search.
        </h2>
        <p className="muted" style={{ margin: '14px auto 0', maxWidth: 520, fontSize: 'var(--text-base)', lineHeight: 1.6 }}>
          Track every application, tailor your CV for each role, and write customized cover letters from one focused workspace.
        </p>
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/auth/sign-up" className="btn btn-p">
            Get started free
          </Link>
          <Link href="/#pricing" className="btn btn-q">
            See plans
          </Link>
        </div>
      </div>
    </section>
  )
}
