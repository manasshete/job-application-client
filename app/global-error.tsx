'use client'

// Replaces the root layout when it crashes, so it must render its own <html>/<body>.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24, fontFamily: 'system-ui, sans-serif', background: '#FAFAF8', color: '#1A1A1A' }}>
        <main role="alert" style={{ maxWidth: 440 }}>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 500 }}>Something went wrong.</h1>
          <p style={{ margin: '16px 0 0', lineHeight: 1.6, color: '#5F5E58' }}>Please try again. Your saved data is not affected.</p>
          <button type="button" onClick={reset} style={{ marginTop: 24, padding: '12px 22px', border: 0, borderRadius: 6, background: '#163A66', color: '#fff', fontSize: 15, cursor: 'pointer' }}>Try again</button>
        </main>
      </body>
    </html>
  )
}
