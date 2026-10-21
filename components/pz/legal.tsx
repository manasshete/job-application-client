import type { ReactNode } from 'react'

/** A paragraph, or a list of bullet points. */
export type LegalBlock = string | string[]
export interface LegalSection {
  id: string
  heading: string
  blocks: LegalBlock[]
}

/** Long-form layout shared by the Privacy Policy and Terms of Service. */
export function LegalPage({ title, updated, sections, children }: { title: string; updated: string; sections: LegalSection[]; children?: ReactNode }) {
  return (
    <div className="fade pub-in" style={{ paddingTop: 56, paddingBottom: 80, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '32px 64px' }}>
      <nav aria-label="On this page" style={{ alignSelf: 'start', display: 'flex', flexDirection: 'column', gap: 2, fontSize: 'var(--text-sm)' }}>
        <div className="lbl" style={{ marginBottom: 8 }}>On this page</div>
        {sections.map((s, i) => (
          <a key={s.id} href={`#lg-${s.id}`} className="muted" style={{ padding: '8px 0' }}>
            {i + 1}. {s.heading}
          </a>
        ))}
      </nav>
      <article style={{ gridColumn: 'span 2', maxWidth: 660, minWidth: 0 }}>
        <h1 className="h1" style={{ fontSize: 32 }}>{title}</h1>
        <p className="muted tnum" style={{ margin: '8px 0 0', fontSize: 'var(--text-sm)' }}>Last updated · {updated}</p>
        {children}
        {sections.map((s, i) => (
          <section key={s.id} id={`lg-${s.id}`} style={{ marginTop: 40, scrollMarginTop: 80 }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 500, letterSpacing: '-.01em' }}>{i + 1}. {s.heading}</h2>
            {s.blocks.map((b, k) =>
              Array.isArray(b) ? (
                <ul key={k} style={{ margin: '0 0 14px', paddingLeft: 22, fontSize: 16, lineHeight: 1.7 }}>
                  {b.map((li) => (
                    <li key={li}>{li}</li>
                  ))}
                </ul>
              ) : (
                <p key={k} style={{ margin: '0 0 14px', fontSize: 16, lineHeight: 1.7 }}>{b}</p>
              ),
            )}
          </section>
        ))}
      </article>
    </div>
  )
}
