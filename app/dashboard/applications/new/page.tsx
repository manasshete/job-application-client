'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useApp } from '@/components/pz/app-context'
import { Note } from '@/components/pz/ui'
import { checkJobLink } from '@/components/pz/job-link-form'
import { AlertCircle, ArrowLeft, ArrowRight, ClipboardPaste, Link2, PenLine } from 'lucide-react'
import { hostOf } from '@/lib/pz/format'
import { FREE_JOB_LIMIT, upgradeTarget, planOf } from '@/lib/pz/plans'

type Step = 'paste' | 'reading' | 'review' | 'form'

interface Form {
  company: string
  role: string
  loc: string
  salary: string
  applied: string
  deadline: string
  link: string
  recruiter: string
  email: string
  tags: string
  reqs: string
  description: string
}

const blank = (today: string): Form => ({ company: '', role: '', loc: '', salary: '', applied: today, deadline: '', link: '', recruiter: '', email: '', tags: '', reqs: '', description: '' })
const split = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean)
// Requirements often contain commas ("Looker, Tableau or similar"), so each line is one requirement.
const lines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean)

const FIELDS: { key: keyof Form; label: string; type: string; required?: boolean; wide?: boolean; rows?: number }[] = [
  { key: 'company', label: 'Company', type: 'text', required: true },
  { key: 'role', label: 'Role', type: 'text', required: true },
  { key: 'loc', label: 'Location', type: 'text' },
  { key: 'salary', label: 'Salary', type: 'text' },
  { key: 'applied', label: 'Date applied', type: 'date' },
  { key: 'deadline', label: 'Response deadline', type: 'date' },
  { key: 'link', label: 'Job link', type: 'url', wide: true },
  { key: 'recruiter', label: 'Recruiter name', type: 'text' },
  { key: 'email', label: 'Recruiter email', type: 'email' },
  { key: 'tags', label: 'Tags, comma separated', type: 'text', wide: true },
  { key: 'reqs', label: 'Key requirements, one per line', type: 'text', wide: true, rows: 4 },
  { key: 'description', label: 'Description', type: 'text', wide: true, rows: 5 },
]

// What reading a posting tries to fill in, as named when something wasn't found.
const READ_FIELDS: Partial<Record<keyof Form, string>> = { company: 'company', role: 'role', loc: 'location', salary: 'salary', reqs: 'requirements', description: 'description' }

function AddJob() {
  const app = useApp()
  const router = useRouter()
  const params = useSearchParams()
  const { today, jobs, account, tokens } = app

  const [step, setStep] = useState<Step>(params.get('manual') ? 'form' : 'paste')
  const [url, setUrl] = useState(params.get('url') ?? '')
  const [f, setF] = useState<Form>(() => blank(today))
  const [touched, setTouched] = useState<Partial<Record<keyof Form, boolean>>>({})
  const [readError, setReadError] = useState('')
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasted, setPasted] = useState('')
  const [readingPasted, setReadingPasted] = useState(false)
  const [canPaste, setCanPaste] = useState(false)
  const [pasteError, setPasteError] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmRestart, setConfirmRestart] = useState(false)
  const [notFound, setNotFound] = useState<(keyof Form)[]>([])
  const [source, setSource] = useState('')
  const textBox = useRef<HTMLTextAreaElement>(null)
  const restartBtn = useRef<HTMLButtonElement>(null)
  const abort = useRef<AbortController | null>(null)
  const started = useRef(false)

  useEffect(() => setF((cur) => (cur.applied ? cur : { ...cur, applied: today })), [today])
  useEffect(() => () => abort.current?.abort(), [])
  // Only offer the button where the browser lets a page read the clipboard.
  useEffect(() => setCanPaste(typeof navigator !== 'undefined' && !!navigator.clipboard?.readText), [])

  const limit = account.tier === 'free' && jobs.length >= FREE_JOB_LIMIT
  const noExt = tokens.extractions === 0
  const up = upgradeTarget(account.tier)
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((cur) => ({ ...cur, [k]: e.target.value }))

  // Whichever way someone switches to the form, the link they already gave comes with them.
  const enterByHand = () => {
    setF((cur) => ({ ...cur, link: checkJobLink(url).url ?? cur.link }))
    setStep('form')
  }

  const openPaste = () => {
    setPasteOpen(true)
    requestAnimationFrame(() => textBox.current?.focus())
  }

  const pasteFromClipboard = async () => {
    try {
      const text = (await navigator.clipboard.readText()).trim()
      if (!text) setPasteError('Nothing is copied yet. Copy the job text from the posting first.')
      else if (/^(https?:\/\/|www\.)\S+$/i.test(text)) setPasteError('That looks like a link, not the job text. Select the text on the posting, copy it and try again.')
      else {
        setPasted(text)
        setPasteError('')
        requestAnimationFrame(() => textBox.current?.focus())
      }
    } catch {
      setPasteError('Your browser didn’t allow reading the clipboard. Paste into the box yourself: Ctrl V (⌘V on Mac), or press and hold on a phone.')
    }
  }

  const readIt = async (text?: string) => {
    const checked = checkJobLink(url)
    if (!text && !checked.url) {
      setReadError(checked.error ?? '')
      return
    }
    const u = checked.url ?? ''
    if (u) setUrl(u)
    setReadError('')
    setPasteError('')
    setReadingPasted(!!text)
    setStep('reading')
    abort.current = new AbortController()
    try {
      const res = await fetch('/api/extract-job', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(text ? { text } : { url: u }), signal: abort.current.signal })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        // The server is the source of truth: if it says the tokens are gone, refresh the counter so the
        // "out of extraction tokens" view takes over instead of a generic error.
        if (res.status === 403) void app.refreshTokens()
        // A failed text read is about the text, so the message belongs under the text box, not on the link.
        if (text) setPasteError(data.error || 'We couldn’t read that text. Check it’s the job posting, or enter the details by hand.')
        else setReadError(data.error || 'We couldn’t read that posting. Some sites block automatic reading.')
        setPasteOpen(true)
        setStep('paste')
        return
      }
      app.noteTokenUsed('extractions')
      const next: Form = {
        ...blank(today),
        company: data.company ?? '',
        role: data.position ?? '',
        loc: data.location ?? '',
        salary: data.salary ?? '',
        link: u,
        reqs: Array.isArray(data.requirements) ? data.requirements.join('\n') : '',
        description: data.description ?? '',
      }
      setF(next)
      setNotFound((Object.keys(READ_FIELDS) as (keyof Form)[]).filter((k) => !next[k].trim()))
      setSource(u)
      setTouched({})
      setConfirmRestart(false)
      setStep('review')
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
      if (text) setPasteError('We couldn’t read that text just now. Check your connection and try again.')
      else setReadError('We couldn’t reach that page. Check your connection and the link.')
      setStep('paste')
    }
  }

  // Coming from Next steps with ?url=…&go=1: start reading straight away, once.
  useEffect(() => {
    if (started.current || !params.get('go') || !url.trim() || limit || noExt) return
    started.current = true
    // Drop ?go=1 so a refresh doesn't read the posting (and use an extraction) a second time.
    router.replace('/dashboard/applications/new', { scroll: false })
    void readIt()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    if (saving) return
    const missing = (['company', 'role'] as const).filter((k) => !f[k].trim())
    if (missing.length) {
      setTouched((cur) => ({ ...cur, company: true, role: true }))
      document.getElementById(`job-${missing[0]}`)?.focus()
      return
    }
    setSaving(true)
    const { job, error } = await app.addJob({
      company: f.company.trim(),
      position: f.role.trim(),
      status: 'applied',
      dateApplied: f.applied || today,
      location: f.loc.trim() || undefined,
      salary: f.salary.trim() || undefined,
      deadline: f.deadline || undefined,
      jobUrl: f.link.trim() || undefined,
      recruiterName: f.recruiter.trim() || undefined,
      recruiterEmail: f.email.trim() || undefined,
      tags: split(f.tags),
      requirements: lines(f.reqs),
      description: f.description || undefined,
    })
    setSaving(false)
    if (!job) {
      app.toast(error ?? 'We couldn’t save this job. Your details are still here, so you can try again.')
      return
    }
    app.toast(`Saved. ${job.company} is in Applications${job.deadline ? ' and Next steps.' : '.'}`)
    router.push(`/dashboard/jobs/${job.id}`)
  }

  const title = limit ? 'Add a job' : step === 'reading' ? 'Reading the posting…' : step === 'review' ? 'Check the details' : step === 'form' ? 'Add a job by hand' : 'Add a job'
  // At the plan limit or out of tokens, the message below the title says what to do instead.
  const sub = limit || (step === 'paste' && noExt) ? '' : step === 'review' ? 'Here’s what we found. Edit anything that looks wrong, then save.' : step === 'form' ? 'Only company and role are required. You can add the rest later.' : step === 'paste' ? 'Paste a link to the posting and Pursuitz will fill in the details for you to check.' : ''

  return (
    <div className="pg pg-form fade">
      <Link href="/dashboard/applications" className="btn btn-t" style={{ padding: 0, marginBottom: 16, color: 'var(--text-muted)' }}><ArrowLeft aria-hidden="true" />Applications</Link>
      <h1 className="h1">{title}</h1>
      <p className="sr-only" role="status">{title}</p>
      {sub && <p className="muted" style={{ margin: '8px 0 0' }}>{sub}</p>}

      {limit && (
        <div className="block">
          <h2 className="h2">You’ve reached {FREE_JOB_LIMIT} applications on the Free plan.</h2>
          <p className="muted" style={{ margin: '8px 0 16px' }}>Pro has unlimited applications. Upgrading takes you to Razorpay checkout.</p>
          <div className="row-actions">
            {up && <button className="btn btn-p" onClick={() => app.startCheckout(up)}>Upgrade to {planOf(up).name}</button>}
            <Link href="/dashboard/applications" className="btn btn-q">Back to Applications</Link>
          </div>
        </div>
      )}

      {!limit && step === 'paste' && noExt && (
        <div className="block">
          <h2 className="h2">You’re out of extraction tokens.</h2>
          <p className="muted" style={{ margin: '8px 0 16px' }}>You can still add this job by hand. Or upgrade for a larger monthly allowance.</p>
          <div className="row-actions">
            <button className="btn btn-p" onClick={() => setStep('form')}>Enter manually</button>
            {up && <button className="btn btn-q" onClick={() => app.startCheckout(up)}>Upgrade to {planOf(up).name}</button>}
          </div>
        </div>
      )}

      {!limit && step === 'paste' && !noExt && (
        <form
          style={{ marginTop: 28 }}
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            void readIt()
          }}
        >
          <label htmlFor="job-url" className="fl" style={{ display: 'block', marginBottom: 8 }}>Job posting link</label>
          <div className="urlbar" aria-invalid={readError ? true : undefined}>
            <Link2 aria-hidden="true" />
            <input id="job-url" type="url" inputMode="url" autoComplete="url" autoFocus={!pasted.trim()} placeholder="https://company.com/careers/job-id" value={url} onChange={(e) => { setUrl(e.target.value); if (readError) setReadError('') }} aria-invalid={readError ? true : undefined} aria-describedby="job-url-msg" />
            <button className={`btn ${pasteOpen ? 'btn-q' : 'btn-p'} btn-lg`} type="submit" disabled={!url.trim()}><ArrowRight aria-hidden="true" />Analyze job</button>
          </div>
          {readError ? (
            <p id="job-url-msg" className="field-msg field-err" role="alert">
              <AlertCircle aria-hidden="true" />
              <span>{readError} {pasteOpen ? 'Paste the job text below, or' : 'You can try again, or'} <button type="button" className="link" style={{ color: 'inherit' }} onClick={enterByHand}>enter it by hand</button> and keep the link.</span>
            </p>
          ) : (
            <p id="job-url-msg" className="muted" style={{ margin: '10px 0 0', fontSize: 'var(--text-xs)' }}>
              Reading a posting uses 1 extraction. You have {tokens.extractions}
              {tokens.extractions <= 3 ? ', which is running low.' : '.'}
            </p>
          )}
          {pasteOpen && (
            <div style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8, minHeight: canPaste ? 40 : undefined }}>
                <label htmlFor="job-text" className="fl">Job posting text</label>
                {canPaste && !pasted.trim() && <button type="button" className="btn btn-t urlbar-paste" onClick={() => void pasteFromClipboard()}><ClipboardPaste aria-hidden="true" />Paste copied text</button>}
              </div>
              <textarea ref={textBox} id="job-text" className="inp" rows={10} autoFocus={!!pasted.trim()} placeholder="Open the posting, select all the text, then copy and paste it here." value={pasted} onChange={(e) => { setPasted(e.target.value); if (pasteError) setPasteError('') }} aria-invalid={pasteError ? true : undefined} aria-describedby={pasteError ? 'job-text-err job-text-hint' : 'job-text-hint'} />
              {pasteError && (
                <p id="job-text-err" className="field-msg field-err" role="alert">
                  <AlertCircle aria-hidden="true" />
                  <span>{pasteError}</span>
                </p>
              )}
              <p id="job-text-hint" className="muted" style={{ margin: '10px 0 16px', fontSize: 'var(--text-xs)' }}>Reading the text uses 1 extraction. You have {tokens.extractions}.</p>
              <button type="button" className="btn btn-p" disabled={!pasted.trim()} onClick={() => void readIt(pasted)}><ArrowRight aria-hidden="true" />Analyze text</button>
            </div>
          )}
          <div className="row-actions" style={{ marginTop: 24 }}>
            {!pasteOpen && <button type="button" className="btn btn-q" onClick={openPaste}><ClipboardPaste aria-hidden="true" />Paste job text instead</button>}
            <button type="button" className="btn btn-q" onClick={enterByHand}><PenLine aria-hidden="true" />Enter manually instead</button>
          </div>
        </form>
      )}

      {!limit && step === 'reading' && (
        <div aria-busy="true" className="panel" style={{ marginTop: 28 }}>
          <p style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 10 }}><span className="spin" aria-hidden="true" style={{ color: 'var(--accent-text)' }} />Reading {readingPasted ? 'the job text' : hostOf(url) || 'the posting'} and pulling out the role, company and requirements. This usually takes a few seconds.</p>
          <div className="sk" style={{ width: '46%' }} />
          <div className="sk" style={{ width: '62%', marginTop: 14 }} />
          <div className="sk" style={{ width: '38%', marginTop: 14 }} />
          <div className="sk" style={{ width: '54%', marginTop: 14 }} />
          <button className="btn btn-q" style={{ marginTop: 28 }} onClick={() => { abort.current?.abort(); setStep('paste') }}>Cancel</button>
        </div>
      )}

      {!limit && (step === 'review' || step === 'form') && (
        <form
          style={{ marginTop: 28 }}
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            void save()
          }}
        >
          {step === 'review' && (
            <Note style={{ marginBottom: 24 }}>
              <b>AI read this posting and can make mistakes.</b> Check important details against {source ? <a href={source} target="_blank" rel="noopener noreferrer">the original posting</a> : 'the original posting'}.
              {notFound.length > 0 && ` We couldn’t find the ${new Intl.ListFormat('en').format(notFound.map((k) => READ_FIELDS[k] ?? k))}.`}
            </Note>
          )}
          <div className="g2">
            {FIELDS.map((d) => {
              const missing = d.required && touched[d.key] && !f[d.key].trim()
              const id = `job-${d.key}`
              const shared = {
                id,
                className: 'inp',
                value: f[d.key],
                onChange: set(d.key),
                onBlur: () => setTouched((cur) => ({ ...cur, [d.key]: true })),
                required: d.required,
                placeholder: step === 'review' && notFound.includes(d.key) ? 'Not found in the posting' : undefined,
                'aria-invalid': missing || undefined,
                'aria-describedby': missing ? `${id}-err` : undefined,
              }
              return (
                <label key={d.key} className={`fld${d.wide ? ' fld-wide' : ''}`}>
                  <span className="fl">{d.label}{d.required ? ' *' : ''}</span>
                  {d.rows
                    ? <textarea {...shared} rows={d.key === 'reqs' ? Math.min(12, Math.max(d.rows, f.reqs.split('\n').length + 1)) : d.rows} />
                    : <input {...shared} type={d.type} />}
                  {missing && <span id={`${id}-err`} className="err">This is required.</span>}
                </label>
              )
            })}
          </div>
          {confirmRestart ? (
            <div role="group" aria-labelledby="restart-q" style={{ marginTop: 24 }}>
              <p id="restart-q" style={{ marginBottom: 12 }}>Start over and clear these details? Reading the posting again uses another extraction.</p>
              <div className="row-actions">
                <button type="button" className="btn btn-q" autoFocus onClick={() => { setConfirmRestart(false); requestAnimationFrame(() => restartBtn.current?.focus()) }}>Keep editing</button>
                <button type="button" className="btn btn-d" onClick={() => { setF(blank(today)); setTouched({}); setPasted(''); setPasteOpen(false); setConfirmRestart(false); setStep('paste') }}>Clear and start over</button>
              </div>
            </div>
          ) : (
            <div className="row-actions" style={{ marginTop: 24 }}>
              <button type="submit" className="btn btn-p" disabled={saving} aria-busy={saving || undefined}>{saving && <span className="spin" aria-hidden="true" />}{saving ? 'Saving…' : 'Save job'}</button>
              {step === 'review'
                ? <button ref={restartBtn} type="button" className="btn btn-q" onClick={() => setConfirmRestart(true)}>Start over</button>
                : <button type="button" className="btn btn-q" onClick={() => { setTouched({}); setStep('paste') }}>Back</button>}
            </div>
          )}
        </form>
      )}
    </div>
  )
}

export default function AddJobPage() {
  return (
    <Suspense>
      <AddJob />
    </Suspense>
  )
}
