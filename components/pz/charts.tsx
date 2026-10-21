'use client'

import { useId, useRef, useState, type ReactNode } from 'react'

export interface Datum {
  key: string
  value: number
  /** Extra line in the tooltip and the table, e.g. "8 applications". */
  note?: string
}

interface Tip { x: number; y: number; html: ReactNode }

function useTip() {
  const box = useRef<HTMLDivElement>(null)
  const [tip, setTip] = useState<Tip | null>(null)
  const [on, setOn] = useState<number | null>(null)
  const show = (i: number, html: ReactNode) => (e: React.MouseEvent | React.FocusEvent) => {
    const r = box.current?.getBoundingClientRect()
    if (!r) return
    let x: number, y: number
    if ('clientX' in e) { x = e.clientX - r.left + 12; y = e.clientY - r.top - 44 }
    else { const t = (e.target as Element).getBoundingClientRect(); x = t.left - r.left + t.width / 2; y = t.top - r.top - 44 }
    setOn(i)
    setTip({ x: Math.min(x, r.width - 150), y: Math.max(0, y), html })
  }
  const hide = () => { setOn(null); setTip(null) }
  return { box, tip, on, show, hide }
}

function Frame({ title, sub, rows, cols, children, boxRef, tip }: { title: string; sub?: string; rows: [string, string][]; cols: [string, string]; children: ReactNode; boxRef: React.RefObject<HTMLDivElement | null>; tip: Tip | null }) {
  const [table, setTable] = useState(false)
  return (
    <section className="panel chart" ref={boxRef}>
      <div className="chart-hd">
        <div>
          <h2 className="chart-t" style={{ margin: 0 }}>{title}</h2>
          {sub && <div className="chart-s">{sub}</div>}
        </div>
        <button type="button" className="btn btn-t" style={{ minHeight: 28, fontSize: 'var(--text-xs)' }} onClick={() => setTable((t) => !t)}>
          {table ? 'View as chart' : 'View as table'}
        </button>
      </div>
      {table ? (
        <table className="ctable">
          <thead><tr><th>{cols[0]}</th><th>{cols[1]}</th></tr></thead>
          <tbody>{rows.map(([k, v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}</tbody>
        </table>
      ) : children}
      {tip && !table && <div className="tip" style={{ left: tip.x, top: tip.y }} role="status">{tip.html}</div>}
    </section>
  )
}

function niceStep(max: number) {
  for (const s of [1, 2, 5, 10, 20, 25, 50, 100, 200, 500]) if (max / s <= 5) return s
  return 1000
}

/** One series of counts over time. Thin bars, rounded tops, gridlines, the last value labelled. */
export function BarChart({ title, sub, data, unit, cols, highlightLast = true }: { title: string; sub?: string; data: Datum[]; unit: string; cols: [string, string]; highlightLast?: boolean }) {
  const { box, tip, on, show, hide } = useTip()
  const id = useId()
  const W = 440, H = 200, L = 28, B = 24, T = 14
  const w = W - L, h = H - B - T
  const max = Math.max(1, ...data.map((d) => d.value))
  const step = niceStep(max)
  const top = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let g = 0; g <= top; g += step) ticks.push(g)
  const slot = w / Math.max(1, data.length)
  const bw = Math.min(24, slot * 0.55)
  const r = 4
  const every = Math.ceil(data.length / 8)
  return (
    <Frame title={title} sub={sub} rows={data.map((d) => [d.key, `${d.value}${d.note ? ` · ${d.note}` : ''}`] as [string, string])} cols={cols} boxRef={box} tip={tip}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={id} onMouseLeave={hide}>
        <title id={id}>{title}</title>
        {ticks.map((g) => {
          const y = T + h - (h * g) / top
          return (
            <g key={g}>
              <line className="gl" x1={L} x2={W} y1={y} y2={y} />
              <text className="ax" x={L - 8} y={y + 4} textAnchor="end">{g}</text>
            </g>
          )
        })}
        {data.map((d, i) => {
          const x = L + slot * i + (slot - bw) / 2
          const bh = (h * d.value) / top
          const y = T + h - bh
          const base = T + h
          const rr = Math.min(r, bh / 2)
          const path = bh > 0 ? `M${x},${base}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + bw - rr}Q${x + bw},${y} ${x + bw},${y + rr}V${base}Z` : ''
          const u = d.value === 1 ? unit.replace(/s$/, '') : unit
          const html = <>{d.key}<br /><b>{d.value}</b> {u}</>
          return (
            <g key={d.key}>
              {path && <path className={`bar${on === i ? ' on' : ''}`} d={path} />}
              {i % every === 0 && <text className="ax" x={x + bw / 2} y={H - 6} textAnchor="middle">{d.key}</text>}
              {highlightLast && i === data.length - 1 && d.value > 0 && <text className="vl" x={x + bw / 2} y={y - 6} textAnchor="middle">{d.value}</text>}
              <rect className="hit" x={L + slot * i} y={T} width={slot} height={h} tabIndex={0} aria-label={`${d.key}: ${d.value} ${u}`} onMouseMove={show(i, html)} onFocus={show(i, html)} onBlur={hide} />
            </g>
          )
        })}
      </svg>
    </Frame>
  )
}

/** Horizontal bars on a track: a funnel, or a rate per category. */
export function HBarChart({ title, sub, data, max, format = (v) => String(v), cols, labelWidth = 120 }: { title: string; sub?: string; data: Datum[]; max?: number; format?: (v: number) => string; cols: [string, string]; labelWidth?: number }) {
  const { box, tip, on, show, hide } = useTip()
  const id = useId()
  const W = 440, row = 40, VW = 52, bh = 10, r = 4
  const H = data.length * row
  const tw = W - labelWidth - VW
  const m = max ?? Math.max(1, ...data.map((d) => d.value))
  return (
    <Frame title={title} sub={sub} rows={data.map((d) => [d.key, `${format(d.value)}${d.note ? ` · ${d.note}` : ''}`] as [string, string])} cols={cols} boxRef={box} tip={tip}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={id} onMouseLeave={hide}>
        <title id={id}>{title}</title>
        {data.map((d, i) => {
          const y = i * row + (row - bh) / 2
          const bw = d.value > 0 ? Math.max(r * 2, (tw * d.value) / m) : 0
          const x0 = labelWidth
          const path = bw > 0 ? `M${x0},${y}H${x0 + bw - r}Q${x0 + bw},${y} ${x0 + bw},${y + r}V${y + bh - r}Q${x0 + bw},${y + bh} ${x0 + bw - r},${y + bh}H${x0}Z` : ''
          const html = <>{d.key}<br /><b>{format(d.value)}</b>{d.note ? ` · ${d.note}` : ''}</>
          return (
            <g key={d.key}>
              <text className="lb" x={0} y={y + bh / 2 + 4}>{d.key.length > 16 ? d.key.slice(0, 15) + '…' : d.key}</text>
              <rect className="track" x={x0} y={y} width={tw} height={bh} rx={2} />
              {path && <path className={`bar${on === i ? ' on' : ''}`} d={path} />}
              <text className="vl" x={W} y={y + bh / 2 + 4} textAnchor="end">{format(d.value)}</text>
              <rect className="hit" x={0} y={i * row} width={W} height={row} tabIndex={0} aria-label={`${d.key}: ${format(d.value)}${d.note ? `, ${d.note}` : ''}`} onMouseMove={show(i, html)} onFocus={show(i, html)} onBlur={hide} />
            </g>
          )
        })}
      </svg>
    </Frame>
  )
}
