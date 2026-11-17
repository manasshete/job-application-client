'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const CONSENT_KEY = 'pz_cookie_consent'

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CONSENT_KEY)
      if (!saved) {
        setVisible(true)
      }
    } catch {
      // Ignore storage errors (e.g. private browsing storage restrictions)
    }
  }, [])

  function handleChoice(choice: 'all' | 'essential') {
    try {
      localStorage.setItem(CONSENT_KEY, choice)
    } catch {
      // Ignore
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fade pub-in"
      style={{
        position: 'fixed',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)',
        maxWidth: 620,
        zIndex: 9999,
        background: 'var(--surface, #111318)',
        border: '1px solid var(--border, #2a2e37)',
        borderRadius: 14,
        padding: '16px 20px',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p style={{ margin: 0, fontSize: 'var(--text-sm, 14px)', fontWeight: 600, color: 'var(--text, #fff)' }}>
            We value your privacy
          </p>
          <p style={{ margin: 0, fontSize: 'var(--text-xs, 13px)', lineHeight: 1.5, color: 'var(--text-muted, #94a3b8)' }}>
            We use strictly necessary cookies to keep you signed in and secure. We also use privacy-friendly analytics to improve Pursuitz. Read our{' '}
            <Link href="/cookies" style={{ textDecoration: 'underline', color: 'inherit' }}>
              Cookie Policy
            </Link>{' '}
            to learn more.
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleChoice('essential')}
          aria-label="Dismiss"
          style={{
            flexShrink: 0,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            color: 'var(--text-muted, #94a3b8)',
            fontSize: 18,
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn btn-q"
          style={{ minHeight: 34, padding: '0 14px', fontSize: 13 }}
          onClick={() => handleChoice('essential')}
        >
          Essential only
        </button>
        <button
          type="button"
          className="btn btn-p"
          style={{ minHeight: 34, padding: '0 16px', fontSize: 13 }}
          onClick={() => handleChoice('all')}
        >
          Accept all
        </button>
      </div>
    </div>
  )
}
