'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Download, FileText, Mail, Trash2 } from 'lucide-react'
import { useApp } from '@/components/pz/app-context'
import { EmptyState, ErrorBlock } from '@/components/pz/ui'
import { downloadTextAsPdf } from '@/lib/pz/export'
import { dayOf, fd } from '@/lib/pz/format'
import { isCoverLetter, isTailoredCv, jobForDoc, libraryDocs } from '@/lib/pz/docs'

type Tab = 'all' | 'cv' | 'cl'

export default function DocumentsPage() {
  const app = useApp()
  const [tab, setTab] = useState<Tab>('all')
  const [busyId, setBusyId] = useState<string | null>(null)

  const all = libraryDocs(app.docs)
  const counts = { all: all.length, cv: all.filter(isTailoredCv).length, cl: all.filter(isCoverLetter).length }
  const list = all.filter((d) => tab === 'all' || (tab === 'cv' && isTailoredCv(d)) || (tab === 'cl' && isCoverLetter(d))).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  const left = app.tokens.documents

  const download = async (id: string, name: string) => {
    setBusyId(id)
    try {
      const text = await app.fetchDocText(id)
      if (!text) return app.toast('We couldn’t open that document. Try again in a moment.')
      app.toast(`Downloaded ${await downloadTextAsPdf(text, name)}`)
    } catch (e) {
      app.toast((e as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="pg fade">
      <div className="hd">
        <div>
          <h1 className="h1">Documents</h1>
          <p className="muted" style={{ margin: '6px 0 0', fontSize: 'var(--text-sm)' }}>Tailored CVs and cover letters you’ve approved, ready to download as PDF.</p>
        </div>
        <Link href="/dashboard/settings?tab=plan" className="badge" style={{ minHeight: 28, padding: '0 12px' }} title="Each tailored CV or cover letter uses 1 document token">
          <span className="tnum">{left} document{left === 1 ? '' : 's'} left</span>
        </Link>
      </div>

      {app.loadError && <ErrorBlock what="documents" />}

      {!app.loadError && all.length === 0 && (
        <EmptyState
          title="No documents yet"
          actions={app.jobs.length > 0 ? <Link href="/dashboard/applications" className="btn btn-p">Choose a job</Link> : <Link href="/dashboard/applications/new" className="btn btn-p">Add your first job</Link>}
        >
          Open a job and choose Tailor my CV or Write a cover letter. Documents you approve are saved here and on the job they were made for.
          {!app.masterCv && ' Tailoring works from your master CV, which you can add in Settings.'}
        </EmptyState>
      )}

      {!app.loadError && all.length > 0 && (
        <>
          <div className="tabs" role="tablist" style={{ marginTop: 24 }}>
            {([['all', 'All'], ['cv', 'Tailored CVs'], ['cl', 'Cover letters']] as const).map(([k, label]) => (
              <button key={k} role="tab" aria-selected={tab === k} className={`tab${tab === k ? ' tab-on' : ''}`} onClick={() => setTab(k)}>
                {label} <span className="muted tnum" style={{ marginLeft: 4, fontWeight: 400 }}>{counts[k]}</span>
              </button>
            ))}
          </div>
          {list.length === 0 && <p className="muted" style={{ margin: '32px 0' }}>Nothing here yet. Make one from any job’s page.</p>}
          {list.length > 0 && (
            <div className="list" style={{ marginTop: 16 }}>
              {list.map((d) => {
                const job = jobForDoc(d, app.jobs)
                const cv = isTailoredCv(d)
                const Icon = cv ? FileText : Mail
                return (
                  <div key={d.id} className="rl dgrid">
                    <span style={{ minWidth: 0, display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span className="avatar" aria-hidden="true" style={{ borderRadius: 8 }}><Icon style={{ width: 16, height: 16 }} /></span>
                      <span style={{ minWidth: 0 }}>
                        <span className="ell" style={{ display: 'block', fontWeight: 500 }}>{d.name}</span>
                        <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>{cv ? 'Tailored CV' : 'Cover letter'}</span>
                      </span>
                    </span>
                    {job ? (
                      <Link href={`/dashboard/jobs/${job.id}`} className="ell link" style={{ fontSize: 'var(--text-sm)', minWidth: 0, textDecoration: 'none' }}>{job.company} — {job.position}</Link>
                    ) : (
                      <span className="muted" style={{ fontSize: 'var(--text-sm)' }}>Job deleted</span>
                    )}
                    <span className="tnum muted" style={{ fontSize: 'var(--text-sm)' }}>{fd(dayOf(d.createdAt))}</span>
                    <span style={{ display: 'flex', gap: 4, gridColumn: 'span 2', justifyContent: 'flex-end' }}>
                      <button className="btn btn-q" style={{ minHeight: 34, padding: '0 12px' }} disabled={busyId === d.id} onClick={() => download(d.id, d.name)}>
                        {busyId === d.id ? <span className="spin" aria-hidden="true" /> : <Download aria-hidden="true" />}
                        {busyId === d.id ? 'Preparing…' : 'PDF'}
                        <span className="sr-only"> download {d.name}</span>
                      </button>
                      <button className="icon-btn" aria-label={`Delete ${d.name}`} data-tip="Delete" onClick={() => app.openModal({ type: 'delDoc', id: d.id })} style={{ color: 'var(--st-rejected)' }}>
                        <Trash2 />
                      </button>
                    </span>
                  </div>
                )
              })}
            </div>
          )}
          <p className="muted" style={{ margin: '12px 0 0', fontSize: 'var(--text-xs)' }}>Deleting a document asks you to confirm first. Your master CV is managed in <Link href="/dashboard/settings?tab=cv" className="link">Settings</Link>.</p>
        </>
      )}
    </div>
  )
}
