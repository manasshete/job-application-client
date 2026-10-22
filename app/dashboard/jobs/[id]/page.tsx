'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ExternalLink, PenLine, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import type { InterviewStatus, JobStatus, TaskStatus } from '@/lib/types'
import { useApp } from '@/components/pz/app-context'
import { InlineArea, InlineField } from '@/components/pz/ui'
import { activityText } from '@/lib/pz/activity'
import { downloadTextAsPdf } from '@/lib/pz/export'
import { JOB_STATUSES, JOB_STATUS_LABEL, ROUND_STATUSES, ROUND_STATUS_LABEL, TASK_STATUSES, TASK_STATUS_LABEL, dayOf, fd, fdw, ft, hostOf, sourceOf } from '@/lib/pz/format'
import { docsForJob } from '@/lib/pz/docs'

export default function JobPage() {
  const { id } = useParams<{ id: string }>()
  const app = useApp()
  const router = useRouter()
  const { getJob, patchJob, tokens } = app
  const job = getJob(id)

  const [cvText, setCvText] = useState<string | null | undefined>(undefined)
  const [nr, setNr] = useState({ name: '', date: '', time: '' })
  const [nt, setNt] = useState({ title: '', due: '' })

  useEffect(() => {
    let alive = true
    app.masterCvText().then((t) => alive && setCvText(t))
    return () => {
      alive = false
    }
  }, [app.masterCv?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const reqs = useMemo(() => {
    const hay = (cvText ?? '').toLowerCase()
    return (job?.requirements ?? []).map((name) => ({ name, match: !!hay && hay.includes(name.toLowerCase()) }))
  }, [job?.requirements, cvText])

  if (!job) {
    return (
      <div className="pg pg-read fade" style={{ maxWidth: 960 }}>
        <Link href="/dashboard/applications" className="btn btn-t" style={{ padding: 0, marginBottom: 16, color: 'var(--text-muted)' }}><ArrowLeft aria-hidden="true" />Applications</Link>
        <h1 className="h1">We couldn’t find that application.</h1>
        <p className="muted" style={{ margin: '8px 0 0' }}>It may have been deleted.</p>
      </div>
    )
  }

  const matched = reqs.filter((r) => r.match).length
  const rounds = [...(job.interviews ?? [])].sort((a, b) => ((a.date ?? '') + (a.time ?? '')).localeCompare((b.date ?? '') + (b.time ?? '')))
  const tasks = [...(job.tasks ?? [])].sort((a, b) => (a.dueDate ?? '9').localeCompare(b.dueDate ?? '9'))
  const jobDocs = docsForJob(app.docs, job)
  const activity = [...(job.activityLog ?? [])].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))

  const details: { label: string; type: string; value: string; commit: (v: string) => void }[] = [
    { label: 'Location', type: 'text', value: job.location ?? '', commit: (v) => void patchJob(job.id, { location: v }) },
    { label: 'Salary', type: 'text', value: job.salary ?? '', commit: (v) => void patchJob(job.id, { salary: v }) },
    { label: 'Date applied', type: 'date', value: job.dateApplied?.slice(0, 10) ?? '', commit: (v) => void patchJob(job.id, { dateApplied: v }) },
    { label: 'Response deadline', type: 'date', value: job.deadline?.slice(0, 10) ?? '', commit: (v) => void patchJob(job.id, { deadline: v }) },
    { label: 'Recruiter', type: 'text', value: job.recruiterName ?? '', commit: (v) => void patchJob(job.id, { recruiterName: v }) },
    { label: 'Recruiter email', type: 'email', value: job.recruiterEmail ?? '', commit: (v) => void patchJob(job.id, { recruiterEmail: v }) },
    { label: 'Link', type: 'url', value: job.jobUrl ?? '', commit: (v) => void patchJob(job.id, { jobUrl: v }) },
    { label: 'Tags', type: 'text', value: (job.tags ?? []).join(', '), commit: (v) => void patchJob(job.id, { tags: v.split(',').map((t) => t.trim()).filter(Boolean) }) },
  ]

  const addRound = async () => {
    if (!nr.name.trim() || !nr.date) return
    if (await app.addRound(job.id, { round: nr.name.trim(), date: nr.date, time: nr.time })) setNr({ name: '', date: '', time: '' })
  }
  const addTask = async () => {
    if (!nt.title.trim()) return
    if (await app.addTask(job.id, { title: nt.title.trim(), dueDate: nt.due })) setNt({ title: '', due: '' })
  }
  const download = async (docId: string, name: string) => {
    const text = await app.fetchDocText(docId)
    if (!text) return app.toast('We could not open that document.')
    try {
      const file = await downloadTextAsPdf(text, name)
      app.toast(`Downloaded ${file}`)
    } catch (e) {
      app.toast((e as Error).message)
    }
  }

  return (
    <div className="pg pg-read fade" style={{ maxWidth: 960 }}>
      <Link href="/dashboard/applications" className="btn btn-t" style={{ padding: 0, marginBottom: 16, color: 'var(--text-muted)' }}><ArrowLeft aria-hidden="true" />Applications</Link>
      <div className="hd" style={{ alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0 }}>
          <h1 className="h1">{job.company}</h1>
          <div style={{ marginTop: 4, fontSize: 'var(--text-lead)' }}>{job.position}</div>
          <div className="muted" style={{ marginTop: 2, fontSize: 'var(--text-sm)' }}>{[job.location, job.salary].filter(Boolean).join(' · ')}</div>
        </div>
        <label className="fld" style={{ minWidth: 160 }}>
          <span className="fl">Status</span>
          <select className={`inp st-${job.status}`} style={{ fontWeight: 500 }} aria-label="Status" value={job.status} onChange={(e) => void app.setStatus(job.id, e.target.value as JobStatus)}>
            {JOB_STATUSES.map((s) => (
              <option key={s} value={s}>{JOB_STATUS_LABEL[s]}</option>
            ))}
          </select>
        </label>
      </div>

      {job.jobUrl && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 20px', marginTop: 20 }}>
          <a href={job.jobUrl} target="_blank" rel="noopener noreferrer" className="link" style={{ fontSize: 'var(--text-sm)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>Open posting on {hostOf(job.jobUrl) || 'the web'}<ExternalLink aria-hidden="true" style={{ width: 14, height: 14 }} /><span className="sr-only"> (opens in a new tab)</span></a>
          <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>Source: {sourceOf(job.jobUrl)}</span>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 20, alignItems: 'center' }}>
        <button className="btn btn-p" onClick={() => router.push(`/dashboard/jobs/${job.id}/cv`)}><Sparkles aria-hidden="true" />Tailor my CV</button>
        <button className="btn btn-q" onClick={() => router.push(`/dashboard/jobs/${job.id}/cover-letter`)}><PenLine aria-hidden="true" />Write a cover letter</button>
        {tokens.documents === 0 ? (
          <span className="tnum" style={{ fontSize: 'var(--text-xs)', color: 'var(--st-rejected)' }}>You’re out of document tokens. <Link href="/dashboard/settings?tab=plan" className="link">See your plan</Link></span>
        ) : (
          <span className="muted tnum" style={{ fontSize: 'var(--text-xs)' }}>Each document uses 1 token. You have {tokens.documents}.</span>
        )}
      </div>

      <section className="sec" style={{ marginTop: 32 }}>
        <h2 className="lbl" style={{ margin: '0 0 16px' }}>Details</h2>
        <div className="g2">
          {details.map((d) => (
            <label key={d.label} className="fld">
              <span className="fl">{d.label}</span>
              <InlineField type={d.type} value={d.value} onCommit={d.commit} />
            </label>
          ))}
        </div>
      </section>

      {(job.requirements?.length ?? 0) > 0 && (
        <section className="sec">
          <h2 className="lbl" style={{ margin: '0 0 4px' }}>Key requirements</h2>
          {app.masterCv ? (
            <p className="muted tnum" style={{ margin: '0 0 12px', fontSize: 'var(--text-sm)' }}>{cvText === undefined ? 'Checking your master CV…' : `${matched} of ${reqs.length} match your master CV`}</p>
          ) : (
            <p className="muted" style={{ margin: '0 0 12px', fontSize: 'var(--text-sm)' }}>Add a master CV in Settings to see which of these are on it.</p>
          )}
          {reqs.map((r) => (
            <div key={r.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '10px 0', borderTop: '1px solid var(--border)' }}>
              <span style={{ fontWeight: 500 }}>{r.name}</span>
              {app.masterCv && cvText !== undefined && <span className={r.match ? '' : 'muted'} style={{ fontSize: 'var(--text-xs)' }}>{r.match ? 'On your CV' : 'Not on your CV'}</span>}
            </div>
          ))}
          <p className="muted" style={{ margin: '12px 0 0', fontSize: 'var(--text-xs)' }}>Matched against your master CV. Replace it in <Link href="/dashboard/settings?tab=cv" className="link">Settings</Link>.</p>
        </section>
      )}

      <section className="sec">
        <h2 className="lbl" style={{ margin: '0 0 8px' }}>Interview rounds</h2>
        {rounds.map((r) => (
          <div key={r.id} className="rr">
            <div className="tnum" style={{ fontWeight: 500 }}>{r.date ? fdw(r.date) + (r.time ? `, ${ft(r.time)}` : '') : 'No date'}</div>
            <div style={{ minWidth: 0 }}>
              <div>{r.round}</div>
              <InlineField label="Notes" placeholder="Add notes" value={r.notes ?? ''} style={{ minHeight: 36, fontSize: 'var(--text-sm)', marginTop: 2 }} onCommit={(v) => void app.patchRound(job.id, r.id, { notes: v })} />
            </div>
            <select className="inp" aria-label="Round status" value={r.status} onChange={(e) => void app.patchRound(job.id, r.id, { status: e.target.value as InterviewStatus })}>
              {ROUND_STATUSES.map((s) => (
                <option key={s} value={s}>{ROUND_STATUS_LABEL[s]}</option>
              ))}
            </select>
          </div>
        ))}
        {rounds.length > 0 && <div style={{ borderTop: '1px solid var(--border)' }} />}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end', marginTop: 16 }}>
          <label className="fld" style={{ flex: '1 1 200px' }}><span className="fl">Add a round</span><input className="inp" placeholder="Round 3 · Hiring manager" value={nr.name} onChange={(e) => setNr({ ...nr, name: e.target.value })} /></label>
          <label className="fld"><span className="fl">Date</span><input className="inp" type="date" value={nr.date} onChange={(e) => setNr({ ...nr, date: e.target.value })} /></label>
          <label className="fld"><span className="fl">Time</span><input className="inp" type="time" value={nr.time} onChange={(e) => setNr({ ...nr, time: e.target.value })} /></label>
          <button className="btn btn-q" disabled={!nr.name.trim() || !nr.date} onClick={addRound}>Add round</button>
        </div>
      </section>

      <section className="sec">
        <h2 className="lbl" style={{ margin: '0 0 8px' }}>Tasks</h2>
        {tasks.map((t) => (
          <div key={t.id} className="rr">
            <div className="tnum muted" style={{ fontSize: 'var(--text-sm)' }}>{t.dueDate ? `Due ${fdw(t.dueDate)}` : 'No due date'}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 500 }}>{t.title}</div>
              <InlineField label="Notes" placeholder="Add notes" value={t.notes ?? ''} style={{ minHeight: 36, fontSize: 'var(--text-sm)', marginTop: 2 }} onCommit={(v) => void app.patchTask(job.id, t.id, { notes: v })} />
            </div>
            <select className="inp" aria-label="Task status" value={t.status} onChange={(e) => void app.patchTask(job.id, t.id, { status: e.target.value as TaskStatus })}>
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>{TASK_STATUS_LABEL[s]}</option>
              ))}
            </select>
          </div>
        ))}
        {tasks.length > 0 && <div style={{ borderTop: '1px solid var(--border)' }} />}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end', marginTop: 16 }}>
          <label className="fld" style={{ flex: '1 1 220px' }}><span className="fl">Add a task</span><input className="inp" placeholder="Send portfolio link" value={nt.title} onChange={(e) => setNt({ ...nt, title: e.target.value })} /></label>
          <label className="fld"><span className="fl">Due</span><input className="inp" type="date" value={nt.due} onChange={(e) => setNt({ ...nt, due: e.target.value })} /></label>
          <button className="btn btn-q" disabled={!nt.title.trim()} onClick={addTask}>Add task</button>
        </div>
      </section>

      <section className="sec">
        <h2 className="lbl" style={{ margin: '0 0 12px' }}>Notes</h2>
        <InlineArea label="Notes" placeholder="Anything worth remembering about this job" value={job.notes ?? ''} onCommit={(v) => void patchJob(job.id, { notes: v })} />
      </section>

      <section className="sec">
        <h2 className="lbl" style={{ margin: '0 0 8px' }}>Documents</h2>
        {jobDocs.map((d) => (
          <div key={d.id} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '8px 16px', padding: '8px 0', borderTop: '1px solid var(--border)' }}>
            <span>
              <span style={{ fontWeight: 500 }}>{d.name}</span>
              <span className="muted tnum" style={{ fontSize: 'var(--text-xs)' }}> · {d.type === 'cv' ? 'Tailored CV' : 'Cover letter'} · {fd(dayOf(d.createdAt))}</span>
            </span>
            <button className="btn btn-t" onClick={() => download(d.id, d.name)}>Download PDF</button>
          </div>
        ))}
        <p className="muted" style={{ margin: '8px 0 0', fontSize: 'var(--text-sm)' }}>Documents you approve for this job are saved here and in your Documents library.</p>
      </section>

      <section className="sec">
        <h2 className="lbl" style={{ margin: '0 0 8px' }}>Activity</h2>
        {activity.map((x) => (
          <div key={x.id} style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: 16, padding: '10px 0', borderTop: '1px solid var(--border)', fontSize: 'var(--text-sm)' }}>
            <span className="tnum muted">{fd(dayOf(x.timestamp))}</span>
            <span>{activityText(x)}</span>
          </div>
        ))}
      </section>

      <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
        <button className="btn btn-d" onClick={() => app.openModal({ type: 'delApp', id: job.id })}>Delete application</button>
      </div>
    </div>
  )
}
