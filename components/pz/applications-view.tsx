'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Job, JobStatus } from '@/lib/types'
import { useApp } from '@/components/pz/app-context'
import { EmptyState, ErrorBlock } from '@/components/pz/ui'
import { ArrowRight, PenLine, Plus, Search } from 'lucide-react'
import { JOB_STATUSES, JOB_STATUS_LABEL, fd } from '@/lib/pz/format'
import { nextStep } from '@/lib/pz/next-steps'

type Sort = 'recent' | 'company' | 'status'

/** The Applications screen at /dashboard/applications. */
export function ApplicationsView() {
  const { jobs, today, loadError, newJobId, nudge, setNudge } = useApp()
  const router = useRouter()
  const [q, setQ] = useState('')
  const [fStatus, setFStatus] = useState<'all' | JobStatus>('all')
  const [sort, setSort] = useState<Sort>('recent')

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const out = jobs.filter((j) => (fStatus === 'all' || j.status === fStatus) && (!needle || `${j.company} ${j.position} ${j.location ?? ''} ${(j.tags ?? []).join(' ')}`.toLowerCase().includes(needle)))
    if (sort === 'recent') out.sort((a, b) => (a.dateApplied < b.dateApplied ? 1 : a.dateApplied > b.dateApplied ? -1 : 0))
    else if (sort === 'company') out.sort((a, b) => a.company.localeCompare(b.company))
    else out.sort((a, b) => JOB_STATUSES.indexOf(a.status) - JOB_STATUSES.indexOf(b.status))
    return out
  }, [jobs, q, fStatus, sort])

  const newJob = jobs.find((j) => j.id === newJobId)
  const step = (j: Job) => nextStep(j, today, nudge && newJobId === j.id)
  const href = (j: Job) => `/dashboard/jobs/${j.id}`

  return (
    <div className="pg fade">
      <div className="hd">
        <div>
          <h1 className="h1">Applications</h1>
          <div className="muted tnum" style={{ marginTop: 6, fontSize: 'var(--text-sm)' }}>
            {jobs.length === 0 ? 'Nothing tracked yet' : `${jobs.length} application${jobs.length === 1 ? '' : 's'}`}
            {list.length !== jobs.length ? ` · ${list.length} shown` : ''}
          </div>
        </div>
        <Link href="/dashboard/applications/new" className="btn btn-p"><Plus aria-hidden="true" />Add a job</Link>
      </div>

      {nudge && newJob && (
        <div className="note fade" role="status" style={{ marginTop: 24, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, background: 'var(--accent-soft)', borderColor: 'var(--border-strong)' }}>
          <span style={{ color: 'var(--text)' }}>
            <b>Saved {newJob.company}.</b> Suggested next step: tailor your CV for this role. It is also in Next steps if it has a deadline.
          </span>
          <span style={{ display: 'flex', gap: 4 }}>
            <button className="btn btn-q" onClick={() => router.push(`/dashboard/jobs/${newJob.id}/cv`)}>Tailor my CV</button>
            <button className="btn btn-t" onClick={() => setNudge(false)}>Dismiss</button>
          </span>
        </div>
      )}

      {loadError && <ErrorBlock what="applications" />}

      {!loadError && jobs.length === 0 && (
        <EmptyState
          title="Your applications will live here"
          actions={
            <>
              <Link href="/dashboard/applications/new" className="btn btn-p"><Plus aria-hidden="true" />Paste a job link</Link>
              <Link href="/dashboard/applications/new?manual=1" className="btn btn-q"><PenLine aria-hidden="true" />Enter manually</Link>
            </>
          }
        >
          Paste a job link and Pursuitz fills in the details for you to check. Every job you save shows up here.
        </EmptyState>
      )}

      {!loadError && jobs.length > 0 && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginTop: 28 }}>
            <span className="inp-ic" style={{ flex: '1 1 240px', minWidth: 0 }}>
              <Search aria-hidden="true" />
              <input className="inp" type="search" placeholder="Search company, role or tag" aria-label="Search applications" value={q} onChange={(e) => setQ(e.target.value)} />
            </span>
            <select className="inp" aria-label="Filter by status" value={fStatus} onChange={(e) => setFStatus(e.target.value as 'all' | JobStatus)}>
              <option value="all">All statuses</option>
              {JOB_STATUSES.map((s) => (
                <option key={s} value={s}>{JOB_STATUS_LABEL[s]}</option>
              ))}
            </select>
            <select className="inp" aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              <option value="recent">Date applied, newest</option>
              <option value="company">Company A–Z</option>
              <option value="status">Status</option>
            </select>
          </div>

          {list.length === 0 && (
            <div className="empty" style={{ padding: '32px 24px' }}>
              <p style={{ color: 'var(--text)' }}>No applications match {q.trim() ? <>“{q.trim()}”</> : 'this filter'}.</p>
              <button className="btn btn-q" onClick={() => { setQ(''); setFStatus('all') }}>Clear search and filters</button>
            </div>
          )}

          {list.length > 0 && (
            <>
              <div className="only-desk list" style={{ marginTop: 20 }}>
                <div className="th lbl list-hd" style={{ margin: 0, display: 'grid' }}><span>Company</span><span>Role</span><span>Status</span><span>Applied</span><span>Next step</span></div>
                {list.map((j) => (
                  <Link key={j.id} href={href(j)} className={`rl tr${newJobId === j.id ? ' row-new' : ''}`}>
                    <span className="ell" style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 10 }}><span className="avatar" aria-hidden="true" style={{ width: 26, height: 26, fontSize: 12, borderRadius: 6 }}>{j.company.trim().charAt(0)}</span><span className="ell">{j.company}</span></span>
                    <span className="ell muted">{j.position}</span>
                    <span className={`st-${j.status}`} style={{ fontSize: 'var(--text-sm)' }}><span className="dot" />{JOB_STATUS_LABEL[j.status]}</span>
                    <span className="tnum muted" style={{ fontSize: 'var(--text-sm)' }}>{fd(j.dateApplied)}</span>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, minWidth: 0 }}><span className="ell" style={{ fontSize: 'var(--text-sm)' }}>{step(j)}</span><ArrowRight className="row-go" aria-hidden="true" style={{ width: 16, height: 16, flex: 'none' }} /></span>
                  </Link>
                ))}
              </div>
              <div className="only-phone list" style={{ marginTop: 20 }}>
                {list.map((j) => (
                  <Link key={j.id} href={href(j)} className={`rl${newJobId === j.id ? ' row-new' : ''}`} style={{ display: 'block' }}>
                    <span style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
                      <span style={{ fontWeight: 500 }}>{j.company}</span>
                      <span className={`st-${j.status}`} style={{ fontSize: 'var(--text-xs)' }}><span className="dot" />{JOB_STATUS_LABEL[j.status]}</span>
                    </span>
                    <span className="muted" style={{ display: 'block', fontSize: 'var(--text-sm)' }}>{j.position}</span>
                    <span style={{ display: 'block', fontSize: 'var(--text-xs)', marginTop: 6 }}>{step(j)}</span>
                  </Link>
                ))}
              </div>
            </>
          )}

        </>
      )}
    </div>
  )
}
