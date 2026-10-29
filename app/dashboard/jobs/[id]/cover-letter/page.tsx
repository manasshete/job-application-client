'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useApp } from '@/components/pz/app-context'
import { DOC_NOTE, Note, ReviewNotes, type ReviewFlag } from '@/components/pz/ui'
import { downloadTextAsPdf } from '@/lib/pz/export'
import { jobContext } from '@/lib/pz/job-text'
import { planOf, upgradeTarget } from '@/lib/pz/plans'

type Phase = 'setup' | 'gen' | 'review'

export default function CoverLetterPage() {
  const { id } = useParams<{ id: string }>()
  const app = useApp()
  const router = useRouter()
  const job = app.getJob(id)

  const [phase, setPhase] = useState<Phase>('setup')
  const [mode, setMode] = useState<'generate' | 'refine'>('generate')
  const [draft, setDraft] = useState('')
  const [points, setPoints] = useState('')
  const [draftErr, setDraftErr] = useState(false)
  const [error, setError] = useState('')
  const [text, setText] = useState('')
  const [notes, setNotes] = useState<ReviewFlag[]>([])
  const [edit, setEdit] = useState(false)
  const [approved, setApproved] = useState(false)
  const [saving, setSaving] = useState(false)

  if (!job) {
    return (
      <div className="pg fade">
        <Link href="/dashboard/applications" className="btn btn-t" style={{ padding: 0 }}>← Applications</Link>
        <h1 className="h1" style={{ marginTop: 16 }}>We couldn’t find that application.</h1>
      </div>
    )
  }

  const blocked = app.tokens.documents === 0
  const up = upgradeTarget(app.account.tier)
  const docName = `Cover letter — ${job.company}`

  const generate = async () => {
    if (mode === 'refine' && !draft.trim()) return setDraftErr(true)
    setError('')
    const master = await app.masterCvText()
    if (!master) return setError('Tailoring starts from your master CV. Add one in Settings, then come back.')
    setPhase('gen')

    const candidateNotes = [
      mode === 'refine' ? `The candidate's own draft letter. Keep its points and voice where the CV supports them:\n${draft.trim()}` : '',
      points.trim() ? `Points the candidate wants included:\n${points.trim()}` : '',
    ].filter(Boolean).join('\n\n').slice(0, 8000)
    try {
      const res = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: master.slice(0, 10000), candidateNotes, jobTitle: job.position, company: job.company, location: job.location, jobDescription: jobContext(job), applicantName: app.account.name }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.coverLetter) {
        // Out of tokens on the server: refresh the counter so the "out of document tokens" view shows.
        if (res.status === 403) void app.refreshTokens()
        setError(data.error || 'We could not write the letter. Please try again.')
        return setPhase('setup')
      }
      app.noteTokenUsed('documents')
      setText(data.coverLetter.trim())
      setNotes(data.analysis?.flags ?? [])
      setPhase('review')
    } catch {
      setError('We could not write the letter. Please try again.')
      setPhase('setup')
    }
  }

  const approve = async () => {
    setSaving(true)
    const meta = await app.saveDoc({ type: 'cover_letter', name: docName, content: text, jobId: job.id })
    setSaving(false)
    if (!meta) return
    setApproved(true)
    app.toast(`Approved. Saved to Documents and to ${job.company}.`)
  }

  return (
    <div className="pg fade" style={{ maxWidth: 760 }}>
      <Link href={`/dashboard/jobs/${job.id}`} className="btn btn-t" style={{ padding: 0, marginBottom: 16 }}>← {job.company}</Link>
      <h1 className="h1">Cover letter</h1>
      <p className="muted" style={{ margin: '8px 0 0' }}>{job.position} at {job.company}</p>

      {phase === 'setup' && blocked && (
        <div className="block">
          <h2 className="h2">You’re out of document tokens.</h2>
          <p className="muted" style={{ margin: '8px 0 16px' }}>{up ? 'A tailored CV or cover letter uses 1 document token. Upgrade for a larger monthly allowance.' : 'A tailored CV or cover letter uses 1 document token. You can see when more are added under Plan and tokens in Settings.'}</p>
          <div className="row-actions">
            {up && <button className="btn btn-p" onClick={() => app.startCheckout(up)}>Upgrade to {planOf(up).name}</button>}
            {!up && <Link href="/dashboard/settings?tab=plan" className="btn btn-p">Plan and tokens</Link>}
            <Link href={`/dashboard/jobs/${job.id}`} className="btn btn-q">Back to the job</Link>
          </div>
        </div>
      )}

      {phase === 'setup' && !blocked && (
        <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="fld">
            <span className="fl">How should we start?</span>
            <span className="segs" role="group" aria-label="Start from">
              <button className={`seg${mode === 'generate' ? ' seg-on' : ''}`} style={{ minHeight: 44 }} onClick={() => { setMode('generate'); setDraftErr(false) }}>Write from scratch</button>
              <button className={`seg${mode === 'refine' ? ' seg-on' : ''}`} style={{ minHeight: 44 }} onClick={async () => { setMode('refine'); if (!draft.trim()) { const t = await app.masterClText(); if (t) setDraft(t) } }}>Improve my draft</button>
            </span>
          </div>
          {mode === 'refine' && (
            <label className="fld">
              <span className="fl">Your draft</span>
              <textarea className="inp" style={{ minHeight: 180 }} placeholder="Paste your draft letter" value={draft} onChange={(e) => { setDraft(e.target.value); setDraftErr(false) }} />
              {draftErr && <span className="err">Paste a draft to improve, or switch to writing from scratch.</span>}
            </label>
          )}
          <label className="fld">
            <span className="fl">Key points to include (optional)</span>
            <textarea className="inp" placeholder="For example: why this company, a project you are proud of" value={points} onChange={(e) => setPoints(e.target.value)} />
          </label>
          <Note>{DOC_NOTE}</Note>
          {error && <p className="err" role="alert">{error}</p>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <button className="btn btn-p" onClick={generate}>Generate letter</button>
            <span className="muted tnum" style={{ fontSize: 'var(--text-xs)' }}>Uses 1 document token. You have {app.tokens.documents}.</span>
          </div>
        </div>
      )}

      {phase === 'gen' && (
        <div aria-busy="true" role="status" style={{ marginTop: 32, padding: '24px 0', borderTop: '1px solid var(--border)' }}>
          <p style={{ margin: '0 0 20px' }}>Writing your letter from your master CV and the posting.</p>
          <div className="sk" style={{ width: '80%' }} />
          <div className="sk" style={{ width: '66%', marginTop: 14 }} />
          <div className="sk" style={{ width: '74%', marginTop: 14 }} />
        </div>
      )}

      {phase === 'review' && (
        <>
          <Note style={{ marginTop: 24 }}>{DOC_NOTE}</Note>
          <ReviewNotes flags={notes} style={{ marginTop: 28 }} />
          {!approved && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '20px 0 12px' }}>
              <button className="btn btn-q" onClick={() => setEdit(!edit)}>{edit ? 'Done editing' : 'Edit text'}</button>
            </div>
          )}
          {edit ? (
            <textarea className="inp" aria-label="Edit letter" style={{ minHeight: 360 }} value={text} onChange={(e) => setText(e.target.value)} />
          ) : (
            <div className="cvpanel" style={{ fontSize: 14.5, lineHeight: 1.7, marginTop: approved ? 20 : 0 }}>
              {text.split(/\n\s*\n/).map((p, i) => (
                <p key={i} style={{ margin: '0 0 16px', whiteSpace: 'pre-line' }}>{p}</p>
              ))}
            </div>
          )}
          <section style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
            <p style={{ margin: '0 0 16px', fontSize: 'var(--text-sm)' }} role="status">
              {approved ? 'Approved and saved. You can download or copy it now.' : edit ? 'Finish editing, then approve.' : 'Read it through and make it yours. Approve to unlock download and copy.'}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
              <button className="btn btn-p" disabled={approved || edit || saving} onClick={approve}>Approve</button>
              <button
                className="btn btn-q"
                disabled={!approved}
                onClick={async () => {
                  try {
                    app.toast(`Downloaded ${await downloadTextAsPdf(text, docName)}`)
                  } catch (e) {
                    app.toast((e as Error).message)
                  }
                }}
              >
                Download PDF
              </button>
              <button
                className="btn btn-q"
                disabled={!approved}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(text)
                    app.toast('Copied to clipboard.')
                  } catch {
                    app.toast('Could not copy. Select the text and copy it by hand.')
                  }
                }}
              >
                Copy text
              </button>
              <button className="btn btn-t" onClick={() => (approved ? router.push(`/dashboard/jobs/${job.id}`) : app.openModal({ type: 'discard', kind: 'cover letter', jobId: job.id }))}>{approved ? 'Done' : 'Discard'}</button>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
