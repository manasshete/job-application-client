'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useApp } from '@/components/pz/app-context'
import { DOC_NOTE, Note } from '@/components/pz/ui'
import { diffCv, initialFlagState, plainText, renderLines, type CvDiff, type FlagState } from '@/lib/pz/cv-diff'
import { downloadTextAsPdf } from '@/lib/pz/export'
import { jobContext } from '@/lib/pz/job-text'
import { planOf, upgradeTarget } from '@/lib/pz/plans'

type Phase = 'start' | 'blocked' | 'nomaster' | 'gen' | 'review' | 'error'

export default function CvReviewPage() {
  const { id } = useParams<{ id: string }>()
  const app = useApp()
  const router = useRouter()
  const job = app.getJob(id)

  const [phase, setPhase] = useState<Phase>('start')
  const [error, setError] = useState('')
  const [diff, setDiff] = useState<CvDiff | null>(null)
  const [flags, setFlags] = useState<FlagState>({})
  const [view, setView] = useState<'red' | 'side'>('red')
  const [edit, setEdit] = useState(false)
  const [text, setText] = useState<string | null>(null)
  const [approved, setApproved] = useState(false)
  const [saving, setSaving] = useState(false)
  const started = useRef(false)

  useEffect(() => {
    if (started.current || !job) return
    started.current = true
    void (async () => {
      if (app.tokens.documents === 0) return setPhase('blocked')
      const master = await app.masterCvText()
      if (!master) return setPhase('nomaster')
      setPhase('gen')
      try {
        const res = await fetch('/api/tailor-resume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resumeText: master.slice(0, 15000), jobTitle: job.position, company: job.company, jobDescription: jobContext(job) }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data.tailoredResume) {
          if (res.status === 403 && /token/i.test(String(data.error ?? ''))) {
            void app.refreshTokens()
            return setPhase('blocked')
          }
          setError(data.error || 'We could not tailor your CV. Please try again.')
          return setPhase('error')
        }
        app.noteTokenUsed('documents')
        const d = diffCv(master, data.tailoredResume)
        setDiff(d)
        setFlags(initialFlagState(d))
        setPhase('review')
      } catch {
        setError('We could not tailor your CV. Please try again.')
        setPhase('error')
      }
    })()
  }, [job]) // eslint-disable-line react-hooks/exhaustive-deps

  const computed = useMemo(() => (diff ? plainText(diff, flags) : ''), [diff, flags])
  const finalText = text ?? computed
  const total = diff?.flags.length ?? 0
  const decided = Object.values(flags).filter((v) => v !== 'pending').length
  const left = total - decided
  const up = upgradeTarget(app.account.tier)

  if (!job) {
    return (
      <div className="pg fade">
        <Link href="/dashboard/applications" className="btn btn-t" style={{ padding: 0 }}>← Applications</Link>
        <h1 className="h1" style={{ marginTop: 16 }}>We couldn’t find that application.</h1>
      </div>
    )
  }

  const setFlag = (n: number, v: FlagState[number]) => setFlags((cur) => ({ ...cur, [n]: v }))
  const rl = (mode: 'red' | 'left' | 'right') => (diff ? renderLines(diff, mode, flags) : [])
  const docName = `Tailored CV — ${job.company}`

  const approve = async () => {
    setSaving(true)
    const meta = await app.saveDoc({ type: 'cv', name: docName, content: finalText, jobId: job.id })
    setSaving(false)
    if (!meta) return
    setApproved(true)
    app.toast(`Approved. Saved to Documents and to ${job.company}.`)
  }

  const renderDoc = (lines: ReturnType<typeof rl>) =>
    lines.map((l, i) => (
      <div key={i} className={l.c} style={l.c.startsWith('cv-gap') ? { height: 10 } : undefined}>
        {l.segs.map((s, k) => (s.k ? <span key={k} className={s.k}>{s.t}</span> : <span key={k}>{s.t}</span>))}
      </div>
    ))

  return (
    <div className="pg fade" style={{ maxWidth: 1000 }}>
      <Link href={`/dashboard/jobs/${job.id}`} className="btn btn-t" style={{ padding: 0, marginBottom: 16 }}>← {job.company}</Link>
      <h1 className="h1">Review your tailored CV</h1>
      <p className="muted" style={{ margin: '8px 0 0' }}>{job.position} at {job.company}</p>

      {(phase === 'blocked' || phase === 'nomaster' || phase === 'error') && (
        <div className="block" style={{ maxWidth: 560 }}>
          <h2 className="h2">
            {phase === 'blocked' ? 'You’re out of document tokens.' : phase === 'nomaster' ? 'Add your master CV first.' : 'Something went wrong.'}
          </h2>
          <p className="muted" style={{ margin: '8px 0 16px' }}>
            {phase === 'blocked' && (up ? 'A tailored CV or cover letter uses 1 document token. Upgrade for a larger monthly allowance.' : 'A tailored CV or cover letter uses 1 document token. You can see when more are added under Plan and tokens in Settings.')}
            {phase === 'nomaster' && 'Tailoring starts from your master CV. Upload a .docx or paste the text in Settings, then come back.'}
            {phase === 'error' && error}
          </p>
          <div className="row-actions">
            {phase === 'blocked' && up && <button className="btn btn-p" onClick={() => app.startCheckout(up)}>Upgrade to {planOf(up).name}</button>}
            {phase === 'blocked' && !up && <Link href="/dashboard/settings?tab=plan" className="btn btn-p">Plan and tokens</Link>}
            {phase === 'nomaster' && <Link href="/dashboard/settings?tab=cv" className="btn btn-p">Add master CV</Link>}
            <Link href={`/dashboard/jobs/${job.id}`} className="btn btn-q">Back to the job</Link>
          </div>
        </div>
      )}

      {(phase === 'start' || phase === 'gen') && (
        <div aria-busy="true" role="status" style={{ marginTop: 32, padding: '24px 0', borderTop: '1px solid var(--border)', maxWidth: 560 }}>
          <p style={{ margin: '0 0 20px' }}>Tailoring your master CV to this posting. It only rewords and reorders what is already on your CV.</p>
          <div className="sk" style={{ width: '80%' }} />
          <div className="sk" style={{ width: '64%', marginTop: 14 }} />
          <div className="sk" style={{ width: '72%', marginTop: 14 }} />
          <div className="sk" style={{ width: '48%', marginTop: 14 }} />
        </div>
      )}

      {phase === 'review' && diff && (
        <>
          <Note style={{ marginTop: 24 }}>{DOC_NOTE}</Note>

          {total > 0 && (
            <section style={{ marginTop: 32 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px 16px', paddingBottom: 8 }}>
                <h2 className="lbl" style={{ margin: 0 }}>Check these changes</h2>
                <span className="tnum muted" style={{ fontSize: 'var(--text-sm)' }}>{decided} of {total} checked</span>
              </div>
              {diff.flags.map((f) => {
                const st = flags[f.n]
                return (
                  <div key={f.n} style={{ display: 'grid', gridTemplateColumns: '28px minmax(0,1fr) auto', gap: '4px 12px', padding: '14px 0', borderTop: '1px solid var(--border)', alignItems: 'start' }}>
                    <span className={st === 'pending' ? 'mk' : 'mk mk-ok'} style={{ margin: '2px 0 0', justifySelf: 'start' }}>{f.n}</span>
                    <span style={{ minWidth: 0 }}>
                      <span className="lbl" style={{ display: 'block', marginBottom: 2 }}>{f.type}</span>
                      <span style={{ display: 'block', fontWeight: 500 }}>{f.what}</span>
                      <span className="muted" style={{ display: 'block', fontSize: 'var(--text-sm)', marginTop: 2 }}>{f.note}</span>
                    </span>
                    <span style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
                      {st === 'pending' && !approved && (
                        <>
                          <button className="btn btn-q" onClick={() => setFlag(f.n, 'kept')}>Keep</button>
                          <button className="btn btn-q" onClick={() => setFlag(f.n, 'reverted')}>Revert</button>
                        </>
                      )}
                      {st !== 'pending' && (
                        <>
                          <span style={{ fontSize: 'var(--text-sm)' }}>{st === 'kept' ? 'Kept' : 'Reverted to original'}</span>
                          {!approved && <button className="btn btn-t" onClick={() => setFlag(f.n, 'pending')}>Change</button>}
                        </>
                      )}
                    </span>
                  </div>
                )
              })}
              <div style={{ borderTop: '1px solid var(--border)' }} />
            </section>
          )}

          <section style={{ marginTop: 32 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <span className="segs" role="group" aria-label="CV view">
                <button className={`seg${view === 'red' ? ' seg-on' : ''}`} style={{ minHeight: 40 }} onClick={() => setView('red')}>Redline</button>
                <button className={`seg${view === 'side' ? ' seg-on' : ''}`} style={{ minHeight: 40 }} onClick={() => setView('side')}>Side by side</button>
              </span>
              {!approved && (
                <button className="btn btn-q" onClick={() => { if (!edit && text === null) setText(computed); setEdit(!edit) }}>{edit ? 'Done editing' : 'Edit text'}</button>
              )}
            </div>
            <p className="muted" style={{ margin: '12px 0 16px', fontSize: 'var(--text-xs)' }}>
              Removed text is <span className="del">struck through</span>. Added text is <span className="ins">underlined</span>. Numbered markers match the list above.
            </p>

            {edit && <textarea className="inp" aria-label="Edit CV text" style={{ minHeight: 420, maxWidth: 760, fontSize: 13.5 }} value={finalText} onChange={(e) => setText(e.target.value)} />}
            {!edit && text !== null && (
              <div className="cvpanel cv-plain" style={{ fontSize: 14, lineHeight: 1.65 }}>{text}</div>
            )}
            {!edit && text === null && view === 'red' && <div className="cvpanel" style={{ fontSize: 14, lineHeight: 1.65 }}>{renderDoc(rl('red'))}</div>}
            {!edit && text === null && view === 'side' && (
              <div className="g2" style={{ gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))' }}>
                <div><div className="lbl" style={{ marginBottom: 8 }}>Original</div><div className="cvpanel">{renderDoc(rl('left'))}</div></div>
                <div><div className="lbl" style={{ marginBottom: 8 }}>Tailored</div><div className="cvpanel">{renderDoc(rl('right'))}</div></div>
              </div>
            )}
            {text !== null && <p className="muted" style={{ margin: '12px 0 0', fontSize: 'var(--text-xs)' }}>You edited the text. Approve, download and copy use your edited version.</p>}
          </section>

          <section style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
            <p style={{ margin: '0 0 16px', fontSize: 'var(--text-sm)' }} role="status">
              {approved ? 'Approved and saved. You can download or copy it now.' : left > 0 ? `Check ${left} more change${left === 1 ? '' : 's'} to approve. Approve changes before downloading.` : 'Everything is checked. Approve to unlock download and copy.'}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
              <button className="btn btn-p" disabled={left > 0 || approved || saving || edit} onClick={approve}>Approve</button>
              <button
                className="btn btn-q"
                disabled={!approved}
                onClick={async () => {
                  try {
                    app.toast(`Downloaded ${await downloadTextAsPdf(finalText, docName)}`)
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
                    await navigator.clipboard.writeText(finalText)
                    app.toast('Copied to clipboard.')
                  } catch {
                    app.toast('Could not copy. Select the text and copy it by hand.')
                  }
                }}
              >
                Copy text
              </button>
              <button className="btn btn-t" onClick={() => (approved ? router.push(`/dashboard/jobs/${job.id}`) : app.openModal({ type: 'discard', kind: 'CV', jobId: job.id }))}>{approved ? 'Done' : 'Discard'}</button>
            </div>
            <p className="muted tnum" style={{ margin: '16px 0 0', fontSize: 'var(--text-xs)' }}>1 document token used. {app.tokens.documents} left. Once approved, this is saved to Documents and to the job.</p>
          </section>
        </>
      )}
    </div>
  )
}
