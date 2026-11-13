'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Job, JobStatus } from '@/lib/types'
import { useApp } from '@/components/pz/app-context'
import { EmptyState, ErrorBlock } from '@/components/pz/ui'
import { ArrowRight, PenLine, Plus, Search } from 'lucide-react'
import { JOB_STATUSES, JOB_STATUS_LABEL, fd } from '@/lib/pz/format'

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
  const confettiRef = useRef<HTMLCanvasElement>(null)
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
                <div className="th lbl list-hd" style={{ margin: 0, display: 'grid' }}><span>Company</span><span>Role</span><span>Status</span><span>Applied</span><span></span></div>
                {list.map((j) => (
                  <Link key={j.id} href={href(j)} className={`rl tr${newJobId === j.id ? ' row-new' : ''}`}>
                    <span className="ell" style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 10 }}><span className="avatar" aria-hidden="true" style={{ width: 26, height: 26, fontSize: 12, borderRadius: 6 }}>{j.company.trim().charAt(0)}</span><span className="ell">{j.company}</span></span>
                    <span className="ell muted">{j.position}</span>
                    <StatusDropdown job={j} />
                    <span className="tnum muted" style={{ fontSize: 'var(--text-sm)' }}>{fd(j.dateApplied)}</span>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'end', gap: 8, minWidth: 0 }}><ArrowRight className="row-go" aria-hidden="true" style={{ width: 16, height: 16, flex: 'none' }} /></span>
                  </Link>
                ))}
              </div>
              <div className="only-phone list" style={{ marginTop: 20 }}>
                {list.map((j) => (
                  <Link key={j.id} href={href(j)} className={`rl${newJobId === j.id ? ' row-new' : ''}`} style={{ display: 'block' }}>
                    <span style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
                      <span style={{ fontWeight: 500 }}>{j.company}</span>
                      <StatusDropdown job={j} compact />
                    </span>
                    <span className="muted" style={{ display: 'block', fontSize: 'var(--text-sm)' }}>{j.position}</span>
                  </Link>
                ))}
              </div>
            </>
          )}

        </>
      )}

      {/* Confetti canvas */}
      <canvas ref={confettiRef} id="confetti-canvas" style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999 }} />
    </div>
  )
}

/* ── Confetti helper ──────────────────────────────── */

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  w: number
  h: number
  color: string
  rot: number
  rotSpeed: number
  gravity: number
  opacity: number
  decay: number
}

function fireConfetti(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#82E0AA']
  const particles: Particle[] = []

  // Create particles from multiple burst points
  const burstPoints = [
    { x: canvas.width * 0.3, y: canvas.height * 0.5 },
    { x: canvas.width * 0.5, y: canvas.height * 0.4 },
    { x: canvas.width * 0.7, y: canvas.height * 0.5 },
  ]

  for (const bp of burstPoints) {
    for (let i = 0; i < 60; i++) {
      const angle = (Math.random() * Math.PI * 2)
      const speed = 4 + Math.random() * 12
      particles.push({
        x: bp.x,
        y: bp.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 8,
        w: 6 + Math.random() * 8,
        h: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.3,
        gravity: 0.15 + Math.random() * 0.1,
        opacity: 1,
        decay: 0.006 + Math.random() * 0.006,
      })
    }
  }

  let animFrame: number
  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    let alive = false

    for (const p of particles) {
      if (p.opacity <= 0) continue
      alive = true

      p.x += p.vx
      p.y += p.vy
      p.vy += p.gravity
      p.vx *= 0.99
      p.rot += p.rotSpeed
      p.opacity -= p.decay

      ctx.save()
      ctx.globalAlpha = Math.max(0, p.opacity)
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.fillStyle = p.color
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
      ctx.restore()
    }

    if (alive) {
      animFrame = requestAnimationFrame(animate)
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  animFrame = requestAnimationFrame(animate)

  // Auto-cleanup after 4s
  setTimeout(() => {
    cancelAnimationFrame(animFrame)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }, 4000)
}

/* ── Status dropdown (inline in the table) ───────── */

function StatusDropdown({ job, compact }: { job: Job; compact?: boolean }) {
  const app = useApp()

  const handleChange = useCallback(
    (e: React.MouseEvent<HTMLSelectElement>) => {
      // Prevent navigating to the job page when clicking the dropdown
      e.preventDefault()
      e.stopPropagation()
    },
    [],
  )

  const handleStatusChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      e.preventDefault()
      e.stopPropagation()
      const newStatus = e.target.value as JobStatus
      if (newStatus === job.status) return

      void app.setStatus(job.id, newStatus).then(() => {
        if (newStatus === 'accepted') {
          const canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement | null
          if (canvas) fireConfetti(canvas)
        }
      })
    },
    [app, job.id, job.status],
  )

  return (
    <select
      className={`inp st-${job.status}`}
      style={{
        fontWeight: 500,
        fontSize: compact ? 'var(--text-xs)' : 'var(--text-sm)',
        minHeight: compact ? 28 : 34,
        padding: compact ? '2px 6px' : '4px 8px',
        width: 'auto',
        background: 'transparent',
        borderColor: 'transparent',
        cursor: 'pointer',
      }}
      aria-label={`Status for ${job.company}`}
      value={job.status}
      onClick={handleChange}
      onMouseDown={handleChange}
      onChange={handleStatusChange}
    >
      {JOB_STATUSES.map((s) => (
        <option key={s} value={s}>{JOB_STATUS_LABEL[s]}</option>
      ))}
    </select>
  )
}
