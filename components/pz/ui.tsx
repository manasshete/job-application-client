'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

export function InfoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M8 7.2v4M8 4.8v.1" />
    </svg>
  )
}

export function Note({ children, style, role }: { children: ReactNode; style?: React.CSSProperties; role?: string }) {
  return (
    <div className="note" style={style} role={role}>
      <InfoIcon />
      <span>{children}</span>
    </div>
  )
}

export const AI_NOTE = (
  <>
    <b>AI-powered features.</b> Job details are extracted by AI and may not always be 100% accurate. Please review the extracted information before saving, and check important details against the original job posting.
  </>
)

export const DOC_NOTE = (
  <>
    <b>Generated documents.</b> AI-generated CVs and cover letters are drafts to review and personalise before you submit them. You’re responsible for making sure everything you submit is accurate. Always proofread, and check that it reflects your real experience and the specific job.
  </>
)

export function ErrorBlock({ what }: { what: string }) {
  const router = useRouter()
  return (
    <div role="alert" style={{ marginTop: 40, padding: '24px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', maxWidth: 560 }}>
      <h2 className="h2">We couldn’t load your {what}.</h2>
      <p className="muted" style={{ margin: '8px 0 16px' }}>Check your connection and try again. If it keeps happening, email info@pursuitz.co.</p>
      <button className="btn btn-q" onClick={() => router.refresh()}>Try again</button>
    </div>
  )
}

export function SkeletonRows({ count = 5, label }: { count?: number; label: string }) {
  const widths = ['62%', '48%', '72%', '55%', '66%']
  return (
    <div aria-busy="true" aria-label={label} style={{ marginTop: 28 }}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '96px 1fr', gap: 16, padding: '18px 0', borderTop: '1px solid var(--border)' }}>
          <div className="sk" style={{ width: 60 }} />
          <div>
            <div className="sk" style={{ width: widths[i % widths.length] }} />
            <div className="sk" style={{ width: '40%', marginTop: 10 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Text input that saves when you leave it, so typing never fires a request per keystroke. */
export function InlineField({
  value,
  onCommit,
  className = 'inl',
  type = 'text',
  label,
  placeholder,
  style,
}: {
  value: string
  onCommit: (v: string) => void
  className?: string
  type?: string
  label?: string
  placeholder?: string
  style?: React.CSSProperties
}) {
  const [v, setV] = useState(value)
  useEffect(() => setV(value), [value])
  return (
    <input
      className={className}
      type={type}
      value={v}
      aria-label={label}
      placeholder={placeholder}
      style={style}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => v !== value && onCommit(v)}
    />
  )
}

export function InlineArea({ value, onCommit, label, placeholder }: { value: string; onCommit: (v: string) => void; label: string; placeholder?: string }) {
  const [v, setV] = useState(value)
  useEffect(() => setV(value), [value])
  return <textarea className="inp" aria-label={label} placeholder={placeholder} value={v} onChange={(e) => setV(e.target.value)} onBlur={() => v !== value && onCommit(v)} />
}

/* ── Design system v2 building blocks ─────────────────── */

/** A headline number with a short label and an optional line of context. */
export function StatTile({ label, value, note }: { label: string; value: ReactNode; note?: ReactNode }) {
  return (
    <div className="stat">
      <span className="lbl">{label}</span>
      <span className="stat-v">{value}</span>
      {note && <span className="stat-n">{note}</span>}
    </div>
  )
}

/** Fills a list or page that has nothing in it yet: a serif headline, one sentence and an action. */
export function EmptyState({ title, children, actions }: { title: string; children?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="empty">
      <h2>{title}</h2>
      {children && <p>{children}</p>}
      {actions && <div className="row-actions" style={{ justifyContent: 'center' }}>{actions}</div>}
    </div>
  )
}

export function Tag({ children }: { children: ReactNode }) {
  return <span className="tag">{children}</span>
}

/** A thin bar for one ratio, with the number always written out. */
export function Meter({ label, value }: { label: string; value: number }) {
  const v = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div className="meter">
      <div className="meter-hd"><span>{label}</span><span className="tnum">{v}%</span></div>
      <div className="meter-tr" role="progressbar" aria-label={label} aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
        <div className="meter-fl" style={{ width: `${v}%` }} />
      </div>
    </div>
  )
}

/** Mutually exclusive options, such as a date range. */
export function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <span className="segs" role="group" aria-label={label}>
      {options.map(([v, l]) => (
        <button key={v} type="button" className={`seg${value === v ? ' seg-on' : ''}`} aria-pressed={value === v} onClick={() => onChange(v)}>{l}</button>
      ))}
    </span>
  )
}
