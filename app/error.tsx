'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[app-error]', error.digest ?? error.message)
  }, [error])

  return (
    <div className="pz" style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <main role="alert" style={{ maxWidth: 440 }}>
        <h1 className="hero-title" style={{ fontSize: 36, margin: 0 }}>Something went wrong.</h1>
        <p className="muted" style={{ margin: '16px 0 0', lineHeight: 1.6 }}>
          This has been logged. You can try again, and your saved applications are not affected.
        </p>
        {error.digest && <p className="muted" style={{ margin: '12px 0 0', fontSize: 12 }}>Reference: {error.digest}</p>}
        <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-p" onClick={reset}>Try again</button>
          <Link href="/" className="btn btn-q">Home</Link>
        </div>
      </main>
    </div>
  )
}
