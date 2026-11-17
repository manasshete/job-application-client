'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export const CONSENT_KEY = 'pz_cookie_consent'

/** Open or reopen the cookie consent banner from anywhere in the app */
export function openCookieConsent() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pz_open_cookie_consent'))
  }
}

export function ManageCookiesButton({
  className = 'btn btn-q',
  style,
  label = 'Manage Cookie Preferences',
}: {
  className?: string
  style?: React.CSSProperties
  label?: string
}) {
  return (
    <button
      type="button"
      onClick={openCookieConsent}
      className={className}
      style={style}
    >
      {label}
    </button>
  )
}

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

    const handleOpen = () => setVisible(true)
    window.addEventListener('pz_open_cookie_consent', handleOpen)
    return () => window.removeEventListener('pz_open_cookie_consent', handleOpen)
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
    <div className="pz">
      <div
        role="region"
        aria-label="Cookie consent banner"
        className="fade"
        style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 32px)',
          maxWidth: 620,
          zIndex: 99999,
          background: 'var(--surface)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-lg, 16px)',
          padding: '20px 24px',
          boxShadow: '0 20px 48px rgba(0, 0, 0, 0.28), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <p style={{ margin: 0, fontSize: 'var(--text-base, 16px)', fontWeight: 600, color: 'var(--text)' }}>
              We value your privacy
            </p>
            <p style={{ margin: 0, fontSize: 'var(--text-sm, 14px)', lineHeight: 1.5, color: 'var(--text-muted)' }}>
              We use strictly necessary cookies to keep you signed in and secure. We also use privacy-friendly analytics to improve Pursuitz. Read our{' '}
              <Link href="/cookies" style={{ textDecoration: 'underline', color: 'var(--accent-text)' }}>
                Cookie Policy
              </Link>{' '}
              to learn more.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleChoice('essential')}
            aria-label="Dismiss cookie notice"
            style={{
              flexShrink: 0,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 6,
              color: 'var(--text-muted)',
              fontSize: 18,
              lineHeight: 1,
              borderRadius: 6,
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-q"
            style={{ minHeight: 36, padding: '0 16px', fontSize: 13 }}
            onClick={() => handleChoice('essential')}
          >
            Essential only
          </button>
          <button
            type="button"
            className="btn btn-p"
            style={{ minHeight: 36, padding: '0 18px', fontSize: 13 }}
            onClick={() => handleChoice('all')}
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  )
}
