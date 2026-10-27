'use client'

import Link from 'next/link'
import { ArrowRight, Calculator, CalendarClock, Check, CircleCheck, Clock, FileSearch, FileText, Link2, ListTodo, Mail, MessageSquare, WandSparkles } from 'lucide-react'
import { FREE_TOOLS } from '@/lib/tools'
import { libraryDocs } from '@/lib/pz/docs'
import { useApp } from '@/components/pz/app-context'
import { JobLinkForm } from '@/components/pz/job-link-form'
import { ErrorBlock, StatTile } from '@/components/pz/ui'
import { JOB_STATUS_LABEL, fd, longDay } from '@/lib/pz/format'
import { interviewsThisWeek, isActive, nextGroups, replied, type NextItem } from '@/lib/pz/next-steps'

const KIND_BADGE: Record<NextItem['kind'], { cls: string; Icon: typeof Clock }> = {
  Interview: { cls: 'badge badge-accent', Icon: CalendarClock },
  Task: { cls: 'badge', Icon: ListTodo },
  Deadline: { cls: 'badge badge-flag', Icon: Clock },
  'Follow up': { cls: 'badge', Icon: MessageSquare },
}

const STEPS = [
  ['Save a job posting', 'Paste a link. Pursuitz reads the role, company, location and key requirements for you to check.'],
  ['Review the role', 'See which requirements are on your CV, then tailor your CV or write a cover letter for it.'],
  ['Track what happens next', 'Log interviews, tasks and deadlines. Next steps tells you what needs you, and when.'],
] as const

const TOOL_ICONS = { FileSearch, Calculator, FileText, Mail }

/** Illustration of what reading a posting produces. Clearly an example, never the user's data. */
function PostingDemo() {
  const rows: [string, React.ReactNode][] = [
    ['Role', 'Product Designer'],
    ['Company', 'Example Co · Remote'],
    ['Requirements', <span key="r" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{['Figma', 'User research', 'Design systems'].map((t) => <span key={t} className="tag">{t}</span>)}</span>],
    ['Next step', <span key="n"><span className="st-applied"><span className="dot" />Applied</span><span className="muted"> · follow up after 7 days</span></span>],
  ]
  return (
    <figure className="demo" aria-label="Example: a job posting turned into a tracked application" style={{ margin: 0 }}>
      <div className="demo-card rise" aria-hidden="true">
        <div className="demo-url"><Link2 />example.com/careers/product-designer</div>
        <div className="demo-lines">
          <i style={{ width: '72%' }} /><i className="hl" style={{ width: '48%' }} /><i style={{ width: '88%' }} /><i className="hl" style={{ width: '36%' }} /><i style={{ width: '64%' }} />
        </div>
      </div>
      <div className="demo-arrow rise" style={{ animationDelay: '180ms' }} aria-hidden="true"><WandSparkles />Pursuitz reads it</div>
      <div className="demo-card demo-out rise" style={{ animationDelay: '320ms' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span className="lbl">In your tracker</span>
          <span className="badge">Example</span>
        </div>
        {rows.map(([k, v], n) => (
          <div key={k} className="demo-row rise" style={{ animationDelay: `${460 + n * 120}ms` }}>
            <span>{k}</span>
            <span>{v}</span>
          </div>
        ))}
      </div>
      <figcaption className="sr-only">Example only. Pursuitz reads the role, company, requirements and suggests a next step.</figcaption>
    </figure>
  )
}

function Onboarding({ first }: { first: string }) {
  const { masterCv, docs } = useApp()
  const tasks = [
    { done: !!masterCv, title: 'Add your master CV', desc: 'Pursuitz compares it with each job and tailors it for you.', href: '/dashboard/settings?tab=cv', cta: 'Add CV' },
    { done: false, title: 'Save your first job', desc: 'Paste a posting link above, or enter a job by hand.', href: '/dashboard/applications/new?manual=1', cta: 'Enter by hand' },
    { done: libraryDocs(docs).length > 0, title: 'Tailor a CV for a job', desc: 'Open a saved job and choose Tailor my CV.', href: null, cta: 'After your first job' },
  ]
  const doneCount = tasks.filter((t) => t.done).length

  return (
    <>
      <section className="welcome" aria-labelledby="welcome-t">
        <div>
          <div className="lbl">Welcome{first ? `, ${first}` : ''}</div>
          <h1 id="welcome-t" className="hero-t">Keep every application moving, without the spreadsheet.</h1>
          <p className="hero-s">Paste a job link to start. Pursuitz reads the posting, you check the details, and it keeps track of what to do next.</p>
          <div style={{ marginTop: 28 }}>
            <JobLinkForm autoFocus />
          </div>
          <p className="muted only-desk" style={{ margin: '14px 0 0', fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            Tip: drag a link from your browser onto the box, or press <span className="kbd">Ctrl K</span> to search later.
          </p>
        </div>
        <PostingDemo />
      </section>

      <div className="wl-grid">
        <section className="panel" aria-labelledby="setup-t">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
            <h2 id="setup-t" className="sec-t">Get set up</h2>
            <span className="muted tnum" style={{ fontSize: 'var(--text-xs)' }}>{doneCount} of {tasks.length} done</span>
          </div>
          <div className="meter-tr" style={{ marginTop: 10 }} role="progressbar" aria-label="Setup progress" aria-valuenow={doneCount} aria-valuemin={0} aria-valuemax={tasks.length}>
            <div className="meter-fl" style={{ width: `${(100 * doneCount) / tasks.length}%`, transition: 'width var(--dur) var(--ease)' }} />
          </div>
          <ul className="check">
            {tasks.map((t) => (
              <li key={t.title} className={t.done ? 'done' : ''}>
                <span className="check-ic" aria-hidden="true">{t.done && <Check />}</span>
                <span style={{ minWidth: 0 }}>
                  <b>{t.title}<span className="sr-only">{t.done ? ' (done)' : ' (to do)'}</span></b>
                  <p>{t.desc}</p>
                </span>
                {!t.done && (t.href ? <Link href={t.href} className="btn btn-q" style={{ minHeight: 32, padding: '0 12px', fontSize: 'var(--text-xs)' }}>{t.cta}</Link> : <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>{t.cta}</span>)}
              </li>
            ))}
          </ul>
        </section>

        <section className="panel" aria-labelledby="how-t">
          <h2 id="how-t" className="sec-t">How it works</h2>
          <ol className="hsteps">
            {STEPS.map(([t, d], i) => (
              <li key={t}>
                <span className="step-n" aria-hidden="true">{i + 1}</span>
                <b>{t}</b>
                <p>{d}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section style={{ marginTop: 32 }} aria-labelledby="tools-t">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <h2 id="tools-t" className="sec-t">Free tools for your search</h2>
          <a href="/tools" target="_blank" rel="noopener" className="link" style={{ fontSize: 'var(--text-xs)' }}>All tools</a>
        </div>
        <div className="tools">
          {FREE_TOOLS.map((t) => {
            const Icon = TOOL_ICONS[t.icon]
            return (
              <a key={t.slug} href={`/tools/${t.slug}`} target="_blank" rel="noopener" className="tool">
                <span className="tool-ic" aria-hidden="true"><Icon /></span>
                <b>{t.title}</b>
                <p>{t.description}</p>
                <span className="tool-go" aria-hidden="true">Open tool<ArrowRight /></span>
              </a>
            )
          })}
        </div>
      </section>
    </>
  )
}

export default function NextStepsPage() {
  const { jobs, today, loadError, account } = useApp()
  const first = (account.name || '').trim().split(/\s+/)[0] ?? ''

  const groups = nextGroups(jobs, today)
  const week = groups.filter((g) => g.label !== 'Later').reduce((n, g) => n + g.items.length, 0)
  const active = jobs.filter(isActive).length
  const rate = jobs.length ? Math.round((100 * jobs.filter(replied).length) / jobs.length) : 0
  const title = week === 0 ? 'Nothing needs you this week' : week === 1 ? '1 thing needs you this week' : `${week} things need you this week`
  const recent = [...jobs].sort((a, b) => (a.dateApplied < b.dateApplied ? 1 : a.dateApplied > b.dateApplied ? -1 : 0)).slice(0, 5)

  if (loadError) {
    return (
      <div className="pg fade">
        <h1 className="h1">Next steps</h1>
        <ErrorBlock what="applications" />
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="pg fade">
        <Onboarding first={first} />
      </div>
    )
  }

  return (
    <div className="pg fade">
      <div className="hd">
        <div>
          <div className="lbl tnum">{longDay(today)}</div>
          <h1 className="h1" style={{ marginTop: 8 }}>{title}</h1>
          <p className="muted" style={{ margin: '6px 0 0', fontSize: 'var(--text-sm)' }}>
            {week === 0 ? `You’re up to date${first ? `, ${first}` : ''}. Add a job or check in on a waiting application.` : `Here’s what’s coming up${first ? `, ${first}` : ''}. Open any item to update it.`}
          </p>
        </div>
      </div>

      <div className="stats">
        <StatTile label="Active applications" value={active} note={`${jobs.length} tracked in total`} />
        <StatTile label="Interviews this week" value={interviewsThisWeek(jobs, today)} note="In the next 7 days" />
        <StatTile label="Response rate" value={`${rate}%`} note="Companies that replied" />
        <StatTile label="Needs you this week" value={week} note={week ? 'Listed below' : 'All clear'} />
      </div>

      <div className="ns-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          {groups.length === 0 && (
            <div className="panel" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <CircleCheck aria-hidden="true" style={{ width: 20, height: 20, color: 'var(--st-offer)', flex: 'none', marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 500 }}>Nothing needs you right now</div>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: 'var(--text-sm)' }}>Add an interview round, a task or a response deadline on a job and it will show up here, sorted by date.</p>
              </div>
            </div>
          )}
          {groups.map((g) => (
            <section key={g.label} className="list" aria-labelledby={`g-${g.label}`}>
              <div className="list-hd">
                <h2 id={`g-${g.label}`} className="lbl" style={{ margin: 0 }}>{g.label}</h2>
                <span className="muted tnum" style={{ fontSize: 'var(--text-xs)' }}>{g.items.length}</span>
              </div>
              {g.items.map((it) => {
                const k = KIND_BADGE[it.kind]
                const overdue = it.gutter === 'Overdue'
                return (
                  <Link key={it.key} href={`/dashboard/jobs/${it.jobId}`} className="rl ng" style={{ gridTemplateColumns: '112px minmax(0,1fr) auto', alignItems: 'center' }}>
                    <span className="tnum" style={{ fontSize: 13, color: overdue ? 'var(--st-rejected)' : 'var(--text-muted)', fontWeight: overdue ? 500 : 400 }}>{it.gutter}</span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', fontWeight: 500 }}>{it.title}</span>
                      <span className="muted ell" style={{ display: 'block', fontSize: 'var(--text-sm)', marginTop: 2 }}>{it.sub}</span>
                    </span>
                    <span className="kind" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className={k.cls}><k.Icon aria-hidden="true" />{it.kind}</span>
                      <ArrowRight className="row-go" aria-hidden="true" style={{ width: 16, height: 16 }} />
                    </span>
                  </Link>
                )
              })}
            </section>
          ))}
        </div>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          <section className="panel" aria-labelledby="add-t">
            <h2 id="add-t" className="sec-t" style={{ fontSize: 16 }}>Add another job</h2>
            <p className="muted" style={{ margin: '4px 0 14px', fontSize: 'var(--text-sm)' }}>Paste a posting link and Pursuitz fills in the details.</p>
            <JobLinkForm stacked label="Another job posting link" />
          </section>
          <section className="list" aria-labelledby="recent-t">
            <div className="list-hd">
              <h2 id="recent-t" className="lbl" style={{ margin: 0 }}>Recently applied</h2>
              <Link href="/dashboard/applications" className="link" style={{ fontSize: 'var(--text-xs)' }}>View all</Link>
            </div>
            {recent.map((j) => (
              <Link key={j.id} href={`/dashboard/jobs/${j.id}`} className="rl" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 12 }}>
                <span style={{ minWidth: 0 }}>
                  <span className="ell" style={{ display: 'block', fontWeight: 500 }}>{j.position}</span>
                  <span className="muted ell" style={{ display: 'block', fontSize: 'var(--text-sm)' }}>{j.company}</span>
                </span>
                <span style={{ textAlign: 'right', fontSize: 'var(--text-xs)' }}>
                  <span className={`st-${j.status}`} style={{ display: 'block' }}><span className="dot" />{JOB_STATUS_LABEL[j.status]}</span>
                  <span className="muted tnum">{fd(j.dateApplied)}</span>
                </span>
              </Link>
            ))}
          </section>
        </aside>
      </div>
    </div>
  )
}
