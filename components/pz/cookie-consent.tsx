'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Cookie, X } from 'lucide-react'

export const CONSENT_KEY = 'pz_cookie_consent_v1'

/** Open or reopen the cookie consent banner from anywhere in the app */
export function openCookieConsent() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pz_open_cookie_consent'))
  }
}

export function ManageCookiesButton({
  className,
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
      className={className ?? 'btn btn-q'}
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
      setVisible(true)
    }

    const handleOpen = () => setVisible(true)
    window.addEventListener('pz_open_cookie_consent', handleOpen)
    return () => window.removeEventListener('pz_open_cookie_consent', handleOpen)
  }, [])

  function handleChoice(choice: 'all' | 'essential') {
    try {
      localStorage.setItem(CONSENT_KEY, choice)
      localStorage.setItem('pz_cookie_consent', choice)
      document.cookie = `pz_cookie_consent=${choice}; path=/; max-age=31536000; SameSite=Lax`
    } catch {
      // Ignore storage errors
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="region"
      aria-label="Cookie consent banner"
      style={{
        position: 'fixed',
        bottom: 20,
        left: 16,
        right: 16,
        margin: '0 auto',
        maxWidth: 620,
        zIndex: 2147483647,
        background: 'var(--surface, #18191d)',
        color: 'var(--text, #f8fafc)',
        border: '1px solid var(--border-strong, #373b44)',
        borderRadius: 16,
        padding: '18px 22px',
        boxShadow: '0 20px 48px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div
            style={{
              padding: 8,
              borderRadius: 10,
              background: 'var(--surface-2, rgba(255, 255, 255, 0.06))',
              color: 'var(--accent, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Cookie style={{ width: 22, height: 22 }} aria-hidden="true" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text, #f8fafc)' }}>
              We value your privacy
            </p>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--text-muted, #94a3b8)' }}>
              We use strictly necessary cookies to keep you signed in and secure, and privacy-friendly analytics to improve Pursuitz. You can manage your preferences or read our{' '}
              <Link href="/cookies" style={{ textDecoration: 'underline', color: 'var(--accent-text, #818cf8)' }}>
                Cookie Policy
              </Link>.
            </p>
          </div>
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
            padding: 4,
            color: 'var(--text-muted, #94a3b8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 6,
          }}
        >
          <X style={{ width: 18, height: 18 }} />
        </button>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => handleChoice('essential')}
          style={{
            minHeight: 36,
            padding: '0 16px',
            fontSize: 13,
            fontWeight: 500,
            borderRadius: 8,
            cursor: 'pointer',
            background: 'var(--surface-2, #262930)',
            color: 'var(--text, #f8fafc)',
            border: '1px solid var(--border-strong, #373b44)',
            transition: 'background-color 150ms ease',
          }}
        >
          Essential only
        </button>
        <button
          type="button"
          onClick={() => handleChoice('all')}
          style={{
            minHeight: 36,
            padding: '0 18px',
            fontSize: 13,
            fontWeight: 500,
            borderRadius: 8,
            cursor: 'pointer',
            background: 'var(--accent, #163a66)',
            color: 'var(--on-accent, #ffffff)',
            border: 'none',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
            transition: 'opacity 150ms ease',
          }}
        >
          Accept all
        </button>
      </div>
    </div>
  )
}
