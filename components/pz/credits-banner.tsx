'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AlertCircle, X } from 'lucide-react'
import { planOf, upgradeTarget } from '@/lib/pz/plans'
import { useApp } from './app-context'

const DISMISS_KEY = 'pz-credits-banner'

/**
 * Shown at the top of every dashboard page when a token type has run out.
 * Says exactly what is paused and what still works. Dismissing hides it for this
 * browser session only, and it comes back if a different token type runs out.
 */
export function CreditsBanner() {
  const { tokens, account, startCheckout } = useApp()
  const noExt = tokens.extractions === 0
  const noDocs = tokens.documents === 0
  const state = noExt && noDocs ? 'both' : noExt ? 'ext' : noDocs ? 'docs' : null
  const [dismissed, setDismissed] = useState<string | null>(null)

  useEffect(() => {
    try { setDismissed(sessionStorage.getItem(DISMISS_KEY)) } catch { /* storage blocked: always show */ }
  }, [])

  if (!state || dismissed === state) return null

  const up = upgradeTarget(account.tier)
  const title = state === 'both' ? 'You’ve used all your AI tokens.' : state === 'ext' ? 'You’re out of extraction tokens.' : 'You’re out of document tokens.'
  const body =
    state === 'both'
      ? 'Reading job links and writing tailored CVs or cover letters are paused. You can still add jobs by hand and track everything as usual.'
      : state === 'ext'
        ? 'Pursuitz can’t read job links until you get more. You can still add jobs by hand.'
        : 'Tailored CVs and cover letters are paused until you get more. Job links can still be read.'

  const dismiss = () => {
    setDismissed(state)
    try { sessionStorage.setItem(DISMISS_KEY, state) } catch { /* ignore */ }
  }

  return (
    <div className="credits-banner" role="status">
      <AlertCircle aria-hidden="true" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <b>{title}</b> <span>{body}</span>
      </div>
      <div className="credits-actions">
        {up && <button type="button" className="btn btn-p" style={{ minHeight: 34 }} onClick={() => startCheckout(up)}>Upgrade to {planOf(up).name}</button>}
        <Link href="/dashboard/settings?tab=plan" className="btn btn-q" style={{ minHeight: 34 }}>Plan and tokens</Link>
        <button type="button" className="icon-btn" onClick={dismiss} aria-label="Hide this message for now" data-tip="Hide for now"><X /></button>
      </div>
    </div>
  )
}
