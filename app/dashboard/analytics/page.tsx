'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useApp } from '@/components/pz/app-context'
import { EmptyState, ErrorBlock, InfoIcon, Segmented, StatTile } from '@/components/pz/ui'
import { BarChart, HBarChart } from '@/components/pz/charts'
import { buildAnalytics, MIN_FOR_CHARTS, MIN_FOR_SOURCES, type Range } from '@/lib/pz/analytics'
import { jobsToCsv, saveBlob } from '@/lib/pz/export'
import { addDays } from '@/lib/pz/format'

const RANGES: [Range, string][] = [['30', '30 days'], ['90', '90 days'], ['all', 'All time']]

export default function AnalyticsPage() {
  const { jobs, today, loadError } = useApp()
  const [range, setRange] = useState<Range>('all')
  const a = useMemo(() => buildAnalytics(jobs, today, range), [jobs, today, range])
  const thisWeek = a.weeks[a.weeks.length - 1]?.count ?? 0
  const rangeLine = range === 'all' ? 'Everything you have tracked so far.' : `Applications sent in the last ${range} days.`

  const exportCsv = () => {
    const since = range === 'all' ? null : addDays(today, -Number(range))
    const rows = since ? jobs.filter((j) => j.dateApplied >= since) : jobs
    saveBlob(new Blob([jobsToCsv(rows)], { type: 'text/csv;charset=utf-8' }), `pursuitz-applications-${today}.csv`)
  }

  return (
    <div className="pg fade">
      <div className="hd">
        <div>
          <h1 className="h1">Analytics</h1>
          <p className="muted" style={{ margin: '6px 0 0', fontSize: 'var(--text-sm)' }}>{rangeLine}</p>
        </div>
        {!loadError && a.totalCount >= MIN_FOR_CHARTS && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <Segmented label="Date range" value={range} options={RANGES} onChange={setRange} />
            <button type="button" className="btn btn-q" style={{ minHeight: 36 }} onClick={exportCsv}>Export CSV</button>
          </div>
        )}
      </div>

      {loadError && <ErrorBlock what="analytics" />}

      {!loadError && a.totalCount < MIN_FOR_CHARTS && (
        <EmptyState
          title="Not enough data yet"
          actions={<Link href="/dashboard/applications/new" className="btn btn-p">Add a job</Link>}
        >
          Rates and charts only mean something with a handful of applications. You have {a.totalCount}. Charts appear at {MIN_FOR_CHARTS}, and source comparisons at {MIN_FOR_SOURCES}.
        </EmptyState>
      )}

      {!loadError && a.totalCount >= MIN_FOR_CHARTS && (
        <>
          <div className="stats">
            <StatTile label="Applications" value={a.count} note={`${thisWeek} this week`} />
            <StatTile label="Response rate" value={`${a.responseRate}%`} note={`${a.repliedCount} of ${a.count} replied`} />
            <StatTile label="Interview rate" value={`${a.interviewRate}%`} note={`${a.reachedCount} reached an interview or beyond`} />
            <StatTile label="Days to first reply" value={a.daysCount ? `${a.avgDays} days` : '—'} note={a.daysCount ? `Average across ${a.daysCount} replies` : 'No dated replies yet'} />
          </div>

          {a.count === 0 ? (
            <p className="muted" style={{ marginTop: 28 }}>No applications in this range. Try a longer one.</p>
          ) : (
            <>
              <div className="grid2">
                <BarChart
                  title="Applications sent"
                  sub="Per week; each bar starts on the date shown"
                  unit="applications"
                  cols={['Week of', 'Applications']}
                  data={a.weeks.map((w) => ({ key: w.label, value: w.count }))}
                />
                <HBarChart
                  title="Pipeline"
                  sub={`How far your ${a.count} applications got`}
                  cols={['Stage', 'Applications']}
                  labelWidth={96}
                  data={a.funnel}
                />
              </div>

              <div className="grid2">
                {a.count >= MIN_FOR_SOURCES ? (
                  <HBarChart
                    title="Response rate by source"
                    sub="Worked out from each job link"
                    cols={['Source', 'Response rate']}
                    max={100}
                    format={(v) => `${v}%`}
                    data={a.sources.map((s) => ({ key: s.name, value: Math.round((100 * s.r) / s.n), note: `${s.r} of ${s.n} replied` }))}
                  />
                ) : (
                  <div className="panel">
                    <h2 className="chart-t" style={{ margin: 0 }}>Response rate by source</h2>
                    <p className="muted" style={{ margin: '6px 0 0', fontSize: 'var(--text-sm)' }}>Appears once this range has {MIN_FOR_SOURCES} applications. It has {a.count}.</p>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {a.enoughForInsight && a.best && (
                    <div className="note note-flag">
                      <InfoIcon />
                      <span>{a.best.name} replied to {a.best.r} of {a.best.n} applications, the best rate among sources you’ve used at least 3 times. With numbers this small, treat it as a pointer rather than a rule.</span>
                    </div>
                  )}
                  {a.stale > 0 && (
                    <div className="note note-flag">
                      <InfoIcon />
                      <span>
                        {a.stale} application{a.stale === 1 ? ' has' : 's have'} had no reply for 14 days or more. Send a follow-up or close {a.stale === 1 ? 'it' : 'them'}.{' '}
                        <Link href="/dashboard">See Next steps</Link>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
