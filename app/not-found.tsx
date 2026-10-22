import Link from 'next/link'

export const metadata = { title: 'Page not found | Pursuitz' }

export default function NotFound() {
  return (
    <div className="pz" style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <main style={{ maxWidth: 440 }}>
        <p className="lbl" style={{ margin: 0 }}>404</p>
        <h1 className="hero-title" style={{ fontSize: 40, margin: '8px 0 0' }}>We can&apos;t find that page.</h1>
        <p className="muted" style={{ margin: '16px 0 0', lineHeight: 1.6 }}>
          The link may be old, or the page may have moved.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
          <Link href="/" className="btn btn-p">Go to the home page</Link>
          <Link href="/dashboard" className="btn btn-q">Open dashboard</Link>
        </div>
      </main>
    </div>
  )
}
