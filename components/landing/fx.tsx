'use client'

/**
 * Landing-page motion helpers. Plain CSS 3D transforms + pointer events, no
 * animation library. Everything is skipped for prefers-reduced-motion and for
 * touch pointers (no hover to track).
 */

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Wraps children in a card that tilts toward the pointer, with an optional glare. */
export function TiltCard({
  children,
  max = 8,
  glare = false,
  className,
  style,
}: {
  children: ReactNode
  max?: number
  glare?: boolean
  className?: string
  style?: CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)
  const frame = useRef(0)

  const onMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType !== 'mouse' || prefersReducedMotion()) return
      const el = ref.current
      if (!el) return
      const { clientX, clientY } = e
      cancelAnimationFrame(frame.current)
      frame.current = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        const px = (clientX - r.left) / r.width
        const py = (clientY - r.top) / r.height
        el.style.setProperty('--rx', `${((0.5 - py) * max * 2).toFixed(2)}deg`)
        el.style.setProperty('--ry', `${((px - 0.5) * max * 2).toFixed(2)}deg`)
        el.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`)
        el.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`)
      })
    },
    [max],
  )

  const reset = useCallback(() => {
    cancelAnimationFrame(frame.current)
    const el = ref.current
    if (!el) return
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
  }, [])

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  return (
    <div
      ref={ref}
      className={`fx-tilt${className ? ` ${className}` : ''}`}
      style={style}
      onPointerMove={onMove}
      onPointerLeave={reset}
    >
      {children}
      {glare && <span className="fx-glare" aria-hidden />}
    </div>
  )
}

const SAMPLE_CARDS = [
  { company: 'Northwind', role: 'Frontend Engineer II', status: 'Interview', note: 'Round 2 · System design, 3:00 PM', tone: 'a' },
  { company: 'Beacon Labs', role: 'Senior Frontend Engineer', status: 'Applied', note: 'Take-home due Saturday', tone: 'b' },
  { company: 'Harbor & Co', role: 'Product Engineer', status: 'Offer', note: 'Reply by next Wednesday', tone: 'c' },
]

/**
 * 3D stack of sample application cards. Moves with the pointer; clicking (or
 * pressing Enter on) the front card sends it to the back of the stack.
 */
export function HeroScene() {
  const sceneRef = useRef<HTMLDivElement>(null)
  const frame = useRef(0)
  const [order, setOrder] = useState([0, 1, 2])

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || prefersReducedMotion()) return
    const el = sceneRef.current
    if (!el) return
    const { clientX, clientY } = e
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect()
      const px = (clientX - r.left) / r.width - 0.5
      const py = (clientY - r.top) / r.height - 0.5
      el.style.setProperty('--rx', `${(-py * 16).toFixed(2)}deg`)
      el.style.setProperty('--ry', `${(px * 22).toFixed(2)}deg`)
    })
  }
  const onLeave = () => {
    cancelAnimationFrame(frame.current)
    sceneRef.current?.style.setProperty('--rx', '0deg')
    sceneRef.current?.style.setProperty('--ry', '0deg')
  }
  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  const next = () => setOrder(([first, ...rest]) => [...rest, first])

  return (
    <div className="fx-scene" onPointerMove={onMove} onPointerLeave={onLeave} role="group" aria-label="Sample applications">
      <div className="fx-scene-3d" ref={sceneRef}>
        <span className="fx-floor" aria-hidden />
        {order.map((cardIdx, depth) => {
          const c = SAMPLE_CARDS[cardIdx]
          const front = depth === 0
          const inner = (
            <>
              <span className="fx-card-top">
                <span className={`fx-status fx-status-${c.tone}`}>{c.status}</span>
                <span className="fx-card-dots" aria-hidden><i /><i /><i /></span>
              </span>
              <span className="fx-card-co">{c.company}</span>
              <span className="fx-card-role">{c.role}</span>
              <span className="fx-card-note">{c.note}</span>
            </>
          )
          const style = { '--d': depth } as CSSProperties
          return front ? (
            <button
              key={cardIdx}
              type="button"
              className="fx-card fx-card-front"
              style={style}
              onClick={next}
              aria-label={`${c.company}, ${c.role}, ${c.status}. Show next sample application`}
            >
              {inner}
            </button>
          ) : (
            <div key={cardIdx} className="fx-card" style={style} aria-hidden>
              {inner}
            </div>
          )
        })}
        <span className="fx-chip fx-chip-1" aria-hidden><b>64%</b> response rate</span>
        <span className="fx-chip fx-chip-2" aria-hidden><b>2</b> interviews this week</span>
      </div>
      <p className="fx-hint muted">Sample data. Click the card to shuffle.</p>
    </div>
  )
}

/** Counts a numeric string like "64%" up from 0 the first time it scrolls into view. */
export function CountUp({ value }: { value: string }) {
  const match = /^(\d+)(.*)$/.exec(value)
  const target = match ? Number(match[1]) : 0
  const suffix = match ? match[2] : ''
  const ref = useRef<HTMLSpanElement>(null)
  const [n, setN] = useState(target)

  useEffect(() => {
    const el = ref.current
    if (!el || !match || prefersReducedMotion()) return
    let raf = 0
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()
        const start = performance.now()
        const dur = 1100
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / dur)
          setN(Math.round(target * (1 - Math.pow(1 - t, 3))))
          if (t < 1) raf = requestAnimationFrame(tick)
        }
        setN(0)
        raf = requestAnimationFrame(tick)
      },
      { threshold: 0.6 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])

  return <span ref={ref}>{match ? `${n}${suffix}` : value}</span>
}

/** Thin bar at the top of the viewport showing scroll progress. */
export function ScrollProgress() {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    let raf = 0
    const update = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const h = document.documentElement
        const max = h.scrollHeight - h.clientHeight
        ref.current?.style.setProperty('transform', `scaleX(${max > 0 ? h.scrollTop / max : 0})`)
      })
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])
  return <span ref={ref} className="fx-progress" aria-hidden />
}
