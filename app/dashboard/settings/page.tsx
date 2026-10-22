'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useApp } from '@/components/pz/app-context'
import { ThemeToggle } from '@/components/pz/theme'
import { Note, StatTile } from '@/components/pz/ui'
import { jobsToCsv, saveBlob } from '@/lib/pz/export'
import { dayOf, fd, fdw } from '@/lib/pz/format'
import { PLANS, planOf, upgradeTarget } from '@/lib/pz/plans'

type Tab = 'plan' | 'profile' | 'cv' | 'data' | 'account'
const TABS: [Tab, string][] = [['plan', 'Plan and tokens'], ['profile', 'Profile'], ['cv', 'Master CV'], ['data', 'Data'], ['account', 'Account']]

const PRIVACY = (
  <>
    <b>Privacy notice.</b> Your data is encrypted and stored securely. We never sell your personal information. It’s only shared with the services needed to run Pursuitz (for example, AI processing of your CV and job posts, and payments). See our <Link href="/privacy">Privacy Policy</Link>.
  </>
)

function Settings() {
  const app = useApp()
  const router = useRouter()
  const params = useSearchParams()
  const { tokens, account } = app

  const initial = params.get('tab')
  const [tab, setTab] = useState<Tab>(TABS.some(([k]) => k === initial) ? (initial as Tab) : 'plan')
  const [name, setName] = useState(account.name)
  const [pasteOn, setPasteOn] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => setName(account.name), [account.name])

  // Coming from the pricing section: /dashboard/settings?checkout=pro opens the upgrade dialog once.
  useEffect(() => {
    const c = params.get('checkout')
    if ((c === 'pro' || c === 'premium') && account.tier !== c) {
      app.startCheckout(c)
      router.replace('/dashboard/settings')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const out = tokens.extractions === 0 && tokens.documents === 0
  const partOut = !out && (tokens.extractions === 0 || tokens.documents === 0)
  const warn = !out && (tokens.extractions <= 3 || tokens.documents <= 1)
  const tkMsg = out
    ? 'You have no tokens left. Reading job links and writing documents are paused until you get more.'
    : partOut
      ? tokens.extractions === 0
        ? `You’re out of extraction tokens, so job links can’t be read. You still have ${tokens.documents} document${tokens.documents === 1 ? '' : 's'}.`
        : `You’re out of document tokens, so CVs and cover letters can’t be written. You still have ${tokens.extractions} extraction${tokens.extractions === 1 ? '' : 's'}.`
      : `You are running low: ${tokens.extractions} extraction${tokens.extractions === 1 ? '' : 's'} and ${tokens.documents} document${tokens.documents === 1 ? '' : 's'} left.`
  const curIdx = PLANS.findIndex((p) => p.tier === account.tier)
  const up = upgradeTarget(account.tier)

  const saveCv = async (label: string, content: string) => {
    setBusy(true)
    const meta = await app.saveDoc({ type: 'cv', name: label, content, isDefault: true })
    setBusy(false)
    if (meta) app.toast(`Master CV replaced with ${label}.`)
    return !!meta
  }

  const onFile = async (file?: File) => {
    if (!file) return
    setBusy(true)
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await fetch('/api/parse-resume', { method: 'POST', body: form })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.text) {
        app.toast(data.error || 'We could not read that file. Try a .docx, or paste the text instead.')
        return
      }
      await saveCv(file.name, data.text)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="pg fade" style={{ maxWidth: 1040 }}>
      <h1 className="h1">Settings</h1>
      <p className="muted" style={{ margin: '6px 0 0', fontSize: 'var(--text-sm)' }}>Your plan, profile, master CV, data and account.</p>
      <div className="tabs" role="tablist" style={{ marginTop: 24 }}>
        {TABS.map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={`tab${tab === k ? ' tab-on' : ''}`} onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>

      {tab === 'plan' && (
        <>
          {(warn || out) && (
            <Note style={{ marginTop: 24 }} role="status">
              <b>{out || partOut ? 'Out of tokens.' : 'Running low.'}</b> {tkMsg}
            </Note>
          )}
          <section style={{ marginTop: 32 }}>
            <h2 className="lbl" style={{ margin: '0 0 16px' }}>Token balance</h2>
            <div className="stats" style={{ marginTop: 0 }}>
              <StatTile label="Extractions" value={tokens.extractions} note="Each job link you analyze uses 1" />
              <StatTile label="Documents" value={tokens.documents} note="Each tailored CV or cover letter uses 1" />
              <StatTile label="Next expiry" value={<span style={{ fontSize: 20 }}>{tokens.nextExpiry ? fdw(tokens.nextExpiry.slice(0, 10)) : '—'}</span>} note="Oldest tokens are used first" />
            </div>
            {tokens.batches.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div className="lbl" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12 }}><span>Added</span><span>Expires</span><span>Extractions</span><span>Documents</span></div>
                {tokens.batches.map((b) => (
                  <div key={b.added} className="tnum" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12, padding: '10px 0', marginTop: 8, borderTop: '1px solid var(--border)', fontSize: 'var(--text-sm)' }}>
                    <span>{fd(b.added)}</span><span>{fd(b.expires)}</span><span>{b.extractions}</span><span>{b.documents}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="muted" style={{ margin: '12px 0 0', fontSize: 'var(--text-xs)' }}>Tokens come in batches that expire 60 days after they’re added. The oldest are used first. Each job link uses 1 extraction. Each CV or cover letter uses 1 document.</p>
          </section>

          <section style={{ marginTop: 40 }}>
            <h2 className="lbl" style={{ margin: '0 0 16px' }}>Plan</h2>
            <div className="g2" style={{ gap: 24 }}>
              {PLANS.map((p, i) => (
                <div key={p.tier} className="panel" style={{ borderColor: i === curIdx ? 'var(--focus)' : undefined, boxShadow: i === curIdx ? 'inset 0 0 0 1px var(--focus)' : undefined, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{p.name}</div>
                    <div className="tnum" style={{ marginTop: 4 }}><span style={{ fontSize: 24, fontWeight: 500 }}>{p.price}</span> <span className="muted" style={{ fontSize: 'var(--text-sm)' }}>{p.per}</span></div>
                  </div>
                  <ul style={{ padding: 0, listStyle: 'none', fontSize: 'var(--text-sm)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {p.lines.map((l) => (<li key={l}>{l}</li>))}
                  </ul>
                  <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                    {i === curIdx && <span className="badge badge-accent" style={{ minHeight: 28, padding: '0 12px' }}>Your current plan</span>}
                    {i > curIdx && p.tier !== 'free' && <button className="btn btn-p" onClick={() => app.startCheckout(p.tier as 'pro' | 'premium')}>Upgrade to {p.name}</button>}
                    {i < curIdx && <button className="btn btn-q" onClick={() => app.openModal({ type: 'downgrade', tier: p.tier })}>Downgrade to {p.name}</button>}
                  </div>
                </div>
              ))}
            </div>
            <p className="muted" style={{ margin: '16px 0 0', fontSize: 'var(--text-xs)' }}>Upgrading opens Razorpay checkout. Downgrading takes effect straight away, after you confirm.</p>
            {up && out && <p style={{ margin: '12px 0 0', fontSize: 'var(--text-sm)' }}>Need more? <button className="btn-t" onClick={() => app.startCheckout(up)}>Upgrade to {planOf(up).name}</button></p>}
          </section>
        </>
      )}

      {tab === 'profile' && (
        <section style={{ marginTop: 32, maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <label className="fld"><span className="fl">Display name</span><input className="inp" value={name} onChange={(e) => setName(e.target.value)} /></label>
          <div className="fld"><span className="fl">Email</span><span>{account.email}</span></div>
          <div><button className="btn btn-p" disabled={!name.trim() || name.trim() === account.name} onClick={() => app.saveName(name)}>Save</button></div>
          <div className="fld">
            <span className="fl">Theme</span>
            <ThemeToggle minHeight={40} style={{ maxWidth: 320 }} />
            <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>System follows your device setting. Your choice is remembered.</span>
          </div>
        </section>
      )}

      {tab === 'cv' && (
        <section style={{ marginTop: 32, maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div className="lbl" style={{ marginBottom: 6 }}>Current master CV</div>
            {app.masterCv ? (
              <>
                <div style={{ fontWeight: 500 }}>{app.masterCv.name}</div>
                <div className="muted tnum" style={{ fontSize: 'var(--text-sm)' }}>Uploaded {fd(dayOf(app.masterCv.createdAt))}</div>
              </>
            ) : (
              <div className="muted">None yet. Add one to start tailoring.</div>
            )}
          </div>
          <p className="muted" style={{ margin: 0, fontSize: 'var(--text-sm)' }}>One CV is used for tailoring and for matching keywords against each job’s requirements.</p>
          <label className="fld">
            <span className="fl">{app.masterCv ? 'Replace with a .docx file' : 'Upload a .docx file'}</span>
            <input className="inp" type="file" accept=".docx,.doc" disabled={busy} style={{ padding: 8 }} onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = '' }} />
          </label>
          <div><button className="btn btn-t" style={{ padding: 0 }} onClick={() => setPasteOn(!pasteOn)}>Or paste text instead</button></div>
          {pasteOn && (
            <div className="fld">
              <textarea className="inp" style={{ minHeight: 200 }} aria-label="Paste CV text" value={pasteText} onChange={(e) => setPasteText(e.target.value)} />
              <div>
                <button className="btn btn-p" disabled={!pasteText.trim() || busy} onClick={async () => { if (await saveCv('Pasted text', pasteText)) { setPasteOn(false); setPasteText('') } }}>Use this text</button>
              </div>
            </div>
          )}
          <Note>{PRIVACY}</Note>
        </section>
      )}

      {tab === 'data' && (
        <section style={{ marginTop: 32, maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div className="lbl" style={{ marginBottom: 8 }}>Export</div>
            <p className="muted" style={{ margin: '0 0 12px', fontSize: 'var(--text-sm)' }}>Download every application as a CSV file.</p>
            <button className="btn btn-q" onClick={() => { saveBlob(new Blob([jobsToCsv(app.jobs)], { type: 'text/csv' }), 'pursuitz-applications.csv'); app.toast(`Exported ${app.jobs.length} applications to CSV.`) }}>Export applications as CSV</button>
          </div>
          <Note><b>Data responsibility.</b> Pursuitz stores your job search data for your personal use. Keep your own copies of anything important (you can export a CSV at any time). We use strong security measures, but no system is 100% secure.</Note>
          <Note>{PRIVACY}</Note>
        </section>
      )}

      {tab === 'account' && (
        <section style={{ marginTop: 32, maxWidth: 560 }}>
          <div className="lbl" style={{ marginBottom: 8 }}>Delete account</div>
          <p className="muted" style={{ margin: '0 0 8px', fontSize: 'var(--text-sm)' }}>This removes your account and everything in it. You’ll be asked to type your email to confirm.</p>
          <p className="muted" style={{ margin: '0 0 16px', fontSize: 'var(--text-sm)' }}>Accounts with payment history are closed by our support team at info@pursuitz.co.</p>
          <button className="btn btn-d" onClick={() => app.openModal({ type: 'delAcct', step: 'type' })}>Delete account…</button>
        </section>
      )}
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense>
      <Settings />
    </Suspense>
  )
}
