import Link from 'next/link'
import { siteConfig } from '@/lib/site-config'
import { FREE_TOOLS } from '@/lib/tools'
import { PLANS } from '@/lib/pz/plans'

const FAQS = [
  { q: 'Will Pursuitz make things up on my CV?', a: 'Tailoring rewords and reorders what is already on your master CV. Changes to dates, job titles, qualifications and skills are flagged, and you approve the result before you can download it. AI can still make mistakes, so always proofread.' },
  { q: 'What happens to my data?', a: 'Your data is encrypted and stored securely. We never sell your personal information. It is only shared with the services needed to run Pursuitz, for example AI processing of your CV and job posts, and payments. You can export your applications as a CSV and delete your account in Settings.' },
  { q: 'What are tokens?', a: 'AI features use tokens. Reading a job link uses one extraction. A tailored CV or a cover letter uses one document. Tokens come in batches that expire 60 days after they are added, and the oldest are used first. You can always see your balance and next expiry date.' },
  { q: 'Can I change or leave my plan?', a: 'Upgrading goes to Razorpay checkout. Downgrading takes effect straight away, after you confirm. Accounts with payment history are closed by support at info@pursuitz.co.' },
  { q: 'Will this get me a job?', a: 'No. Pursuitz is a personal organisation tool. It does not guarantee employment, interviews or offers.' },
]

// Sample data for the screenshot only.
const SHOT = {
  title: '3 things need you this week',
  summary: [{ v: '6', l: 'Active applications' }, { v: '2', l: 'Interviews this week' }, { v: '64%', l: 'Response rate' }],
  groups: [
    { label: 'Today', items: [{ gut: '3:00 PM', title: 'Round 2 · System design', sub: 'Northwind — Frontend Engineer II', kind: 'Interview' }] },
    { label: 'This week', items: [
      { gut: 'Fri 11:00 AM', title: 'Portfolio review', sub: 'Beacon Labs — Senior Frontend Engineer', kind: 'Interview' },
      { gut: 'Due Sat', title: 'Submit take-home exercise', sub: 'Beacon Labs — Senior Frontend Engineer · In progress', kind: 'Task' },
    ] },
  ],
}

const NAV = ['Next steps', 'Applications', 'Documents', 'Analytics', 'Settings']

function StructuredData() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        '@id': `${siteConfig.url}/#software`,
        name: siteConfig.name,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url: siteConfig.url,
        description: siteConfig.description,
        offers: PLANS.map((p) => ({ '@type': 'Offer', name: p.name, price: p.price.replace('₹', ''), priceCurrency: 'INR' })),
      },
      { '@type': 'WebSite', '@id': `${siteConfig.url}/#website`, url: siteConfig.url, name: siteConfig.name, description: siteConfig.description },
      {
        '@type': 'FAQPage',
        '@id': `${siteConfig.url}/#faq`,
        mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      },
    ],
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
}

const h2: React.CSSProperties = { margin: 0, fontSize: 22, fontWeight: 500, letterSpacing: '-.015em' }

export default function LandingPage() {
  return (
    <div className="pub-in">
      <StructuredData />

      <section style={{ padding: '72px 0 56px' }}>
        <h1 className="hero-title">Keep track of where you applied, and what to do next.</h1>
        <p className="muted" style={{ margin: '24px 0 0', fontSize: 18, lineHeight: 1.55, maxWidth: '34em' }}>
          Pursuitz keeps every application, interview round, task and deadline in one place, and tells you what needs doing today.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 16px', alignItems: 'center', marginTop: 32 }}>
          <Link href="/auth/sign-up" className="btn btn-p" style={{ minHeight: 48, padding: '0 24px' }}>Create a free account</Link>
          <Link href="/auth/login" className="btn btn-t">Log in</Link>
        </div>
        <p className="muted" style={{ margin: '16px 0 0', fontSize: 'var(--text-sm)' }}>Free for up to 10 applications.</p>
      </section>

      <figure style={{ margin: '0 0 24px' }}>
        <div role="img" aria-label="Screenshot of the Pursuitz Next steps screen" style={{ border: '1px solid var(--border-strong)', borderRadius: 8, overflow: 'hidden', display: 'flex', background: 'var(--bg)', pointerEvents: 'none', userSelect: 'none' }}>
          <div className="desk-only" style={{ width: 176, flex: 'none', borderRight: '1px solid var(--border)', padding: '20px 10px', display: 'flex', flexDirection: 'column', gap: 20, fontSize: 'var(--text-sm)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 8px' }}>
              <span style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--accent)', display: 'grid', placeItems: 'center' }}><span style={{ width: 8, height: 8, borderRadius: 1, background: 'var(--on-accent)', transform: 'rotate(45deg)' }} /></span>
              <span style={{ fontWeight: 600, letterSpacing: '-.02em' }}>Pursuitz</span>
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {NAV.map((n, i) => (
                <span key={n} className={i ? 'muted' : undefined} style={{ padding: 8, borderRadius: 4, ...(i ? {} : { background: 'var(--surface-2)', fontWeight: 500 }) }}>{n}</span>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0, padding: 'clamp(16px, 4vw, 32px)', paddingTop: 28 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 500, letterSpacing: '-.02em' }}>{SHOT.title}</h2>
            <div className="sum" style={{ marginTop: 20 }}>
              {SHOT.summary.map((m) => (
                <div key={m.l}><div className="tnum" style={{ fontSize: 19, fontWeight: 500, lineHeight: 1.1 }}>{m.v}</div><div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{m.l}</div></div>
              ))}
            </div>
            {SHOT.groups.map((g) => (
              <div key={g.label} style={{ marginTop: 24, borderBottom: '1px solid var(--border)' }}>
                <div className="lbl" style={{ marginBottom: 6 }}>{g.label}</div>
                {g.items.map((it) => (
                  <div key={it.title} className="rl ng" style={{ padding: '12px 0', margin: 0 }}>
                    <span className="tnum muted" style={{ fontSize: 12.5 }}>{it.gut}</span>
                    <span style={{ minWidth: 0 }}><span style={{ display: 'block', fontWeight: 500, fontSize: 'var(--text-sm)' }}>{it.title}</span><span className="muted" style={{ display: 'block', fontSize: 12.5 }}>{it.sub}</span></span>
                    <span className="kind muted" style={{ fontSize: 12 }}>{it.kind}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <figcaption className="muted" style={{ marginTop: 12, fontSize: 'var(--text-xs)' }}>The Next steps screen. Company names and dates are sample data.</figcaption>
      </figure>

      <section style={{ padding: '72px 0 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '40px 48px', paddingTop: 32, borderTop: '1px solid var(--border)' }}>
          <div><h2 style={h2}>Track</h2><p className="muted" style={{ margin: '12px 0 0', lineHeight: 1.65 }}>Paste a job link and Pursuitz reads the posting. You check the details, then save. Applications sit in a table or a board, and each job has its own page for interview rounds, tasks, notes and documents.</p></div>
          <div><h2 style={h2}>Prepare</h2><p className="lbl" style={{ margin: '2px 0 0' }}>AI with your approval</p><p className="muted" style={{ margin: '10px 0 0', lineHeight: 1.65 }}>Tailor your CV or write a cover letter for one job. Changes appear as a redline, anything touching dates, job titles, qualifications or skills is flagged for you to keep or revert, and nothing downloads until you approve it.</p></div>
          <div><h2 style={h2}>Follow up</h2><p className="muted" style={{ margin: '12px 0 0', lineHeight: 1.65 }}>Next steps lists upcoming interviews, tasks, response deadlines and applications with no reply after 7 days. Analytics show your response rate and which sources reply.</p></div>
        </div>
      </section>

      <section id="tools" style={{ padding: '88px 0 0', scrollMarginTop: 72 }}>
        <h2 style={h2}>Free tools</h2>
        <div style={{ marginTop: 20, borderBottom: '1px solid var(--border)' }}>
          {FREE_TOOLS.map((t) => (
            <div key={t.slug} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px 16px', padding: '16px 0', borderTop: '1px solid var(--border)' }}>
              <span style={{ minWidth: 0 }}><span style={{ display: 'block', fontWeight: 500 }}>{t.title}</span><span className="muted" style={{ fontSize: 'var(--text-sm)' }}>{t.description}</span></span>
              <Link href={`/tools/${t.slug}`} className="btn btn-q">Open</Link>
            </div>
          ))}
        </div>
        <p className="muted" style={{ margin: '12px 0 0', fontSize: 'var(--text-xs)' }}>Take-home salary calculator: estimates only, based on simplified tax assumptions. Not tax or financial advice.</p>
      </section>

      <section id="pricing" style={{ padding: '88px 0 0', scrollMarginTop: 72 }}>
        <h2 style={h2}>Pricing</h2>
        <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 32 }}>
          {PLANS.map((p) => (
            <div key={p.tier} style={{ borderTop: '1px solid var(--text)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontWeight: 500 }}>{p.name}</div>
              <div className="tnum"><span style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-.02em' }}>{p.price}</span> <span className="muted" style={{ fontSize: 'var(--text-sm)' }}>{p.per}</span></div>
              <ul style={{ padding: 0, listStyle: 'none', fontSize: 'var(--text-sm)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {p.lines.map((l) => (<li key={l}>{l}</li>))}
              </ul>
              <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                <Link href={p.tier === 'free' ? '/auth/sign-up' : `/auth/sign-up?plan=${p.tier}`} className="btn btn-q">{p.tier === 'free' ? 'Start free' : `Choose ${p.name}`}</Link>
              </div>
            </div>
          ))}
        </div>
        <p className="muted" style={{ margin: '20px 0 0', fontSize: 'var(--text-xs)' }}>Paid plans are billed through Razorpay.</p>
      </section>

      <section id="faq" style={{ padding: '88px 0 0', maxWidth: 760, scrollMarginTop: 72 }}>
        <h2 style={{ ...h2, marginBottom: 20 }}>Questions</h2>
        <div className="faq" style={{ borderBottom: '1px solid var(--border)' }}>
          {FAQS.map((f) => (
            <details key={f.q} style={{ borderTop: '1px solid var(--border)' }}>
              <summary>{f.q}</summary>
              <p className="muted" style={{ margin: '0 0 18px', lineHeight: 1.65 }}>{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  )
}
