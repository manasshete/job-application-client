'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useApp } from '@/components/pz/app-context'
import { AI_NOTE, Note } from '@/components/pz/ui'
import { checkJobLink } from '@/components/pz/job-link-form'
import { AlertCircle, ArrowLeft, ArrowRight, Link2, PenLine } from 'lucide-react'
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

const FIELDS: { key: keyof Form; label: string; type: string; required?: boolean; wide?: boolean }[] = [
  { key: 'company', label: 'Company', type: 'text', required: true },
  { key: 'role', label: 'Role', type: 'text', required: true },
  { key: 'loc', label: 'Location', type: 'text' },
  { key: 'salary', label: 'Salary', type: 'text' },
  { key: 'applied', label: 'Date applied', type: 'date' },
  { key: 'deadline', label: 'Response deadline', type: 'date' },
  { key: 'link', label: 'Job link', type: 'url', wide: true },
  { key: 'recruiter', label: 'Recruiter name', type: 'text' },
  { key: 'email', label: 'Recruiter email', type: 'email' },
  { key: 'tags', label: 'Tags, comma separated', type: 'text' },
  { key: 'reqs', label: 'Key requirements, comma separated', type: 'text', wide: true },
]

function AddJob() {
  const app = useApp()
  const router = useRouter()
  const params = useSearchParams()
  const { today, jobs, account, tokens } = app

  const [step, setStep] = useState<Step>(params.get('manual') ? 'form' : 'paste')
  const [url, setUrl] = useState(params.get('url') ?? '')
  const [f, setF] = useState<Form>(() => blank(today))
  const [touched, setTouched] = useState(false)
  const [readError, setReadError] = useState('')
  const [saving, setSaving] = useState(false)
  const abort = useRef<AbortController | null>(null)
  const started = useRef(false)

  useEffect(() => setF((cur) => (cur.applied ? cur : { ...cur, applied: today })), [today])
  useEffect(() => () => abort.current?.abort(), [])

  const limit = account.tier === 'free' && jobs.length >= FREE_JOB_LIMIT
  const noExt = tokens.extractions === 0
  const up = upgradeTarget(account.tier)
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => setF((cur) => ({ ...cur, [k]: e.target.value }))

  const readIt = async () => {
    const checked = checkJobLink(url)
    if (!checked.url) {
      setReadError(checked.error ?? '')
      return
    }
    const u = checked.url
    setUrl(u)
    setReadError('')
    setStep('reading')
    abort.current = new AbortController()
    try {
      const res = await fetch('/api/extract-job', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: u }), signal: abort.current.signal })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setReadError(data.error || 'We couldn’t read that posting. Some sites block automatic reading.')
        setStep('paste')
        return
      }
      app.noteTokenUsed('extractions')
      setF({
        ...blank(today),
        company: data.company ?? '',
        role: data.position ?? '',
        loc: data.location ?? '',
        salary: data.salary ?? '',
        link: u,
        reqs: Array.isArray(data.requirements) ? data.requirements.join(', ') : '',
        description: data.description ?? '',
      })
      setTouched(false)
      setStep('review')
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
      setReadError('We couldn’t reach that page. Check your connection and the link.')
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
    if (!f.company.trim() || !f.role.trim()) {
      setTouched(true)
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
      requirements: split(f.reqs),
      description: f.description || undefined,
    })
    setSaving(false)
    if (!job) {
      app.toast(error ?? 'We couldn’t save this job. Your details are still here, so you can try again.')
      return
    }
    app.toast(`Saved. ${job.company} is in Applications${job.deadline ? ' and Next steps.' : '.'}`)
    router.push('/dashboard/applications')
  }

  const title = step === 'reading' ? 'Reading the posting…' : step === 'review' ? 'Check the details' : step === 'form' ? 'Add a job by hand' : 'Add a job'
  const sub = step === 'review' ? 'Here’s what we found. Edit anything that looks wrong, then save.' : step === 'form' ? 'Only company and role are required. You can add the rest later.' : step === 'paste' ? 'Paste a link to the posting and Pursuitz will fill in the details for you to check.' : ''

  return (
    <div className="pg pg-form fade">
      <Link href="/dashboard/applications" className="btn btn-t" style={{ padding: 0, marginBottom: 16, color: 'var(--text-muted)' }}><ArrowLeft aria-hidden="true" />Applications</Link>
      <h1 className="h1" role="status">{title}</h1>
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
            <input id="job-url" type="url" inputMode="url" autoComplete="url" autoFocus placeholder="https://company.com/careers/job-id" value={url} onChange={(e) => { setUrl(e.target.value); if (readError) setReadError('') }} aria-invalid={readError ? true : undefined} aria-describedby="job-url-msg" />
            <button className="btn btn-p btn-lg" type="submit" disabled={!url.trim()}><ArrowRight aria-hidden="true" />Analyze job</button>
          </div>
          {readError ? (
            <p id="job-url-msg" className="field-msg field-err" role="alert">
              <AlertCircle aria-hidden="true" />
              <span>{readError} You can try again, or <button type="button" className="btn-t" style={{ color: 'inherit', textDecoration: 'underline' }} onClick={() => { setF((cur) => ({ ...cur, link: checkJobLink(url).url ?? '' })); setStep('form') }}>enter it by hand</button> and keep the link.</span>
            </p>
          ) : (
            <p id="job-url-msg" className="muted tnum" style={{ margin: '10px 0 0', fontSize: 'var(--text-xs)' }}>
              Reading a posting uses 1 extraction. You have {tokens.extractions}
              {tokens.extractions <= 3 ? ', which is running low.' : '.'}
            </p>
          )}
          <button type="button" className="btn btn-q" style={{ marginTop: 24 }} onClick={() => { setUrl(''); setStep('form') }}><PenLine aria-hidden="true" />Enter manually instead</button>
        </form>
      )}

      {!limit && step === 'reading' && (
        <div aria-busy="true" className="panel" style={{ marginTop: 28 }}>
          <p style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 10 }}><span className="spin" aria-hidden="true" style={{ color: 'var(--accent-text)' }} />Reading {hostOf(url) || 'the posting'} and pulling out the role, company and requirements. This usually takes a few seconds.</p>
          <div className="sk" style={{ width: '46%' }} />
          <div className="sk" style={{ width: '62%', marginTop: 14 }} />
          <div className="sk" style={{ width: '38%', marginTop: 14 }} />
          <div className="sk" style={{ width: '54%', marginTop: 14 }} />
          <button className="btn btn-q" style={{ marginTop: 28 }} onClick={() => { abort.current?.abort(); setStep('paste') }}>Cancel</button>
        </div>
      )}

      {!limit && (step === 'review' || step === 'form') && (
        <div style={{ marginTop: 28 }}>
          <div className="g2">
            {FIELDS.map((d) => {
              const missing = d.required && touched && !f[d.key].trim()
              return (
                <label key={d.key} className={`fld${d.wide ? ' fld-wide' : ''}`}>
                  <span className="fl">{d.label}{d.required ? ' *' : ''}</span>
                  <input className="inp" type={d.type} value={f[d.key]} onChange={set(d.key)} onBlur={() => setTouched(true)} />
                  {missing && <span className="err">This is required.</span>}
                </label>
              )
            })}
          </div>
          {step === 'review' && <Note style={{ marginTop: 28 }}>{AI_NOTE}</Note>}
          <div className="row-actions" style={{ marginTop: 24 }}>
            <button className="btn btn-p" disabled={!f.company.trim() || !f.role.trim() || saving} aria-busy={saving || undefined} onClick={save}>{saving && <span className="spin" aria-hidden="true" />}{saving ? 'Saving…' : 'Save job'}</button>
            <button className="btn btn-q" onClick={() => { setF(blank(today)); setTouched(false); setStep('paste') }}>Start over</button>
          </div>
        </div>
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
