'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type { SubscriptionTier } from '@/lib/subscription'
import { planOf } from '@/lib/pz/plans'
import { useApp } from './app-context'

export type ModalState =
  | null
  | { type: 'delApp'; id: string }
  | { type: 'discard'; kind: 'CV' | 'cover letter'; jobId: string }
  | { type: 'delDoc'; id: string }
  | { type: 'checkout'; tier: 'pro' | 'premium'; step: 'confirm' | 'handoff' }
  | { type: 'downgrade'; tier: SubscriptionTier }
  | { type: 'delAcct'; step: 'type' | 'support' }

const Actions = ({ children }: { children: ReactNode }) => <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>{children}</div>

function PlanSummary({ tier }: { tier: SubscriptionTier }) {
  const p = planOf(tier)
  return (
    <>
      <p className="tnum" style={{ margin: '8px 0 12px', fontSize: 20, fontWeight: 500 }}>
        {p.price} {p.per}
      </p>
      <ul style={{ margin: '0 0 16px', padding: 0, listStyle: 'none', fontSize: 'var(--text-sm)', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {p.lines.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
    </>
  )
}

export function Modals() {
  const app = useApp()
  const router = useRouter()
  const { modal, closeModal } = app
  const box = useRef<HTMLDivElement>(null)
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!modal) return
    setTyped('')
    setBusy(false)
    const previous = document.activeElement as HTMLElement | null
    box.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
      if (e.key !== 'Tab' || !box.current) return
      const focusable = box.current.querySelectorAll<HTMLElement>('button:not(:disabled), input, a[href]')
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      previous?.focus?.()
    }
  }, [modal?.type, closeModal]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!modal) return null

  let body: ReactNode = null

  if (modal.type === 'delApp') {
    const job = app.getJob(modal.id)
    body = (
      <>
        <h2 className="h2">Delete this application?</h2>
        <p className="muted" style={{ margin: '8px 0 24px' }}>
          {job ? `${job.company} — ${job.position}` : 'This application'} will be removed, with its rounds, tasks and notes. This can’t be undone.
        </p>
        <Actions>
          <button className="btn btn-q" onClick={closeModal}>Cancel</button>
          <button
            className="btn btn-d"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              const name = job?.company ?? 'application'
              const ok = await app.removeJob(modal.id)
              closeModal()
              if (ok) {
                router.push('/dashboard/applications')
                app.toast(`Deleted ${name}.`)
              }
            }}
          >
            Delete application
          </button>
        </Actions>
      </>
    )
  }

  if (modal.type === 'discard') {
    body = (
      <>
        <h2 className="h2">Discard this {modal.kind}?</h2>
        <p className="muted" style={{ margin: '8px 0 24px' }}>The draft won’t be saved. The document token it used isn’t refunded.</p>
        <Actions>
          <button className="btn btn-q" onClick={closeModal}>Keep reviewing</button>
          <button
            className="btn btn-d"
            onClick={() => {
              closeModal()
              router.push(`/dashboard/jobs/${modal.jobId}`)
              app.toast('Draft discarded.')
            }}
          >
            Discard
          </button>
        </Actions>
      </>
    )
  }

  if (modal.type === 'delDoc') {
    const doc = app.docs.find((d) => d.id === modal.id)
    body = (
      <>
        <h2 className="h2">Delete this document?</h2>
        <p className="muted" style={{ margin: '8px 0 24px' }}>{doc?.name ?? 'This document'} will be removed from your library and from its job. This can’t be undone.</p>
        <Actions>
          <button className="btn btn-q" onClick={closeModal}>Cancel</button>
          <button
            className="btn btn-d"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              const ok = await app.removeDoc(modal.id)
              closeModal()
              if (ok) app.toast('Document deleted.')
            }}
          >
            Delete document
          </button>
        </Actions>
      </>
    )
  }

  if (modal.type === 'checkout' && modal.step === 'confirm') {
    const p = planOf(modal.tier)
    body = (
      <>
        <h2 className="h2">Upgrade to {p.name}</h2>
        <PlanSummary tier={modal.tier} />
        <p className="muted" style={{ margin: '0 0 24px', fontSize: 'var(--text-sm)' }}>You’ll go to Razorpay to pay, then come back here.</p>
        <Actions>
          <button className="btn btn-q" onClick={closeModal}>Not now</button>
          <button className="btn btn-p" onClick={() => app.continueToRazorpay(modal.tier)}>Continue to Razorpay</button>
        </Actions>
      </>
    )
  }

  if (modal.type === 'checkout' && modal.step === 'handoff') {
    const p = planOf(modal.tier)
    body = (
      <>
        <h2 className="h2">Opening Razorpay checkout…</h2>
        <p className="muted" style={{ margin: '8px 0 24px' }}>Payment happens on Razorpay’s page. When it’s done you’ll land back in Pursuitz on the {p.name} plan.</p>
        <Actions>
          <button className="btn btn-q" onClick={closeModal}>Cancel</button>
        </Actions>
      </>
    )
  }

  if (modal.type === 'downgrade') {
    const p = planOf(modal.tier)
    body = (
      <>
        <h2 className="h2">Downgrade to {p.name}?</h2>
        <p style={{ margin: '8px 0 12px' }}>Downgrading takes effect straight away.</p>
        <p className="tnum" style={{ margin: '0 0 8px', fontWeight: 500 }}>{p.price} {p.per}</p>
        <ul style={{ margin: '0 0 24px', padding: 0, listStyle: 'none', fontSize: 'var(--text-sm)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {p.lines.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <Actions>
          <button className="btn btn-q" onClick={closeModal}>Keep my plan</button>
          <button className="btn btn-d" disabled={busy} onClick={() => { setBusy(true); void app.confirmDowngrade(modal.tier) }}>Downgrade now</button>
        </Actions>
      </>
    )
  }

  if (modal.type === 'delAcct' && modal.step === 'type') {
    const ok = typed.trim().toLowerCase() === app.account.email.toLowerCase()
    body = (
      <>
        <h2 className="h2">Delete your account?</h2>
        <p className="muted" style={{ margin: '8px 0 16px' }}>
          This removes your applications, documents and master CV. It can’t be undone. Type <b style={{ color: 'var(--text)' }}>{app.account.email}</b> to confirm.
        </p>
        <input className="inp" aria-label="Type your email to confirm" placeholder="Your email" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
        <p className="muted" style={{ margin: '12px 0 24px', fontSize: 'var(--text-xs)' }}>Accounts with payment history are closed by our support team at info@pursuitz.co.</p>
        <Actions>
          <button className="btn btn-q" onClick={closeModal}>Cancel</button>
          <button
            className="btn btn-d"
            disabled={!ok || busy}
            onClick={async () => {
              setBusy(true)
              const r = await app.deleteAccount(app.account.email)
              if (r === 'deleted') {
                closeModal()
                router.push('/')
                router.refresh()
              } else if (r === 'support') {
                app.openModal({ type: 'delAcct', step: 'support' })
              } else {
                setBusy(false)
                closeModal()
                app.toast('We could not delete your account. Please try again, or email info@pursuitz.co.')
              }
            }}
          >
            Delete account
          </button>
        </Actions>
      </>
    )
  }

  if (modal.type === 'delAcct' && modal.step === 'support') {
    body = (
      <>
        <h2 className="h2">Support will close your account</h2>
        <p className="muted" style={{ margin: '8px 0 24px' }}>Because your account has payment history, we close it for you. Email info@pursuitz.co from your account address and we’ll take care of it.</p>
        <Actions>
          <button className="btn btn-p" onClick={closeModal}>Understood</button>
        </Actions>
      </>
    )
  }

  return (
    <div className="ov" onClick={closeModal}>
      <div className="md" role="dialog" aria-modal="true" tabIndex={-1} ref={box} onClick={(e) => e.stopPropagation()} style={{ outline: 'none' }}>
        {body}
      </div>
    </div>
  )
}
