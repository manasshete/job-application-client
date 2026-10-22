'use client'

import { useMemo, useState } from 'react'

const FILLER_WORDS = [
  'very', 'really', 'just', 'quite', 'actually', 'basically', 'literally', 'simply', 'truly',
  'various', 'several', 'numerous', 'many', 'a lot', 'stuff', 'things', 'etc',
]

const CLICHES = [
  'team player', 'hard worker', 'hard-working', 'go-getter', 'think outside the box',
  'results-driven', 'results-oriented', 'detail-oriented', 'self-starter', 'synergy',
  'go the extra mile', 'hit the ground running', 'wear many hats', 'value add', 'best of breed',
  'proven track record', 'dynamic', 'proactive',
]

const PASSIVE_RE =
  /\b(?:am|is|are|was|were|be|been|being)\s+(\w+ed|written|done|made|given|taken|seen|known|shown|built|led|held|kept|sent|paid|met|won)\b/gi

function highlightCount(text: string, phrases: string[]): { phrase: string; count: number }[] {
  const lower = text.toLowerCase()
  return phrases
    .map((phrase) => {
      const re = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g')
      const count = (lower.match(re) ?? []).length
      return { phrase, count }
    })
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count)
}

export function ReadabilityChecker() {
  const [text, setText] = useState('')

  const stats = useMemo(() => {
    const trimmed = text.trim()
    const words = trimmed ? trimmed.split(/\s+/) : []
    const sentences = trimmed ? trimmed.split(/[.!?]+\s/).filter(Boolean) : []
    const wordCount = words.length
    const charCount = text.length
    const sentenceCount = Math.max(sentences.length, trimmed ? 1 : 0)
    const avgWordsPerSentence = sentenceCount ? wordCount / sentenceCount : 0
    const readingTime = Math.max(1, Math.round(wordCount / 200))
    const fillers = highlightCount(text, FILLER_WORDS)
    const cliches = highlightCount(text, CLICHES)
    const passiveMatches = (text.match(PASSIVE_RE) ?? []).length
    return {
      wordCount,
      charCount,
      sentenceCount,
      avgWordsPerSentence,
      readingTime,
      fillers,
      cliches,
      passiveMatches,
      fillerTotal: fillers.reduce((s, f) => s + f.count, 0),
      clicheTotal: cliches.reduce((s, c) => s + c.count, 0),
    }
  }, [text])

  const hasText = stats.wordCount > 0

  return (
    <div className="tl-wrap">
      <div className="tl-field">
        <label htmlFor="text">Paste your resume or cover letter</label>
        <textarea id="text" className="inp" style={{ minHeight: 240 }} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste your text here to analyze it live" />
        <span className="tl-hint">Runs in your browser. Nothing is sent or saved.</span>
      </div>

      <div className="tl-4" aria-live="polite">
        {[
          { label: 'Words', value: stats.wordCount },
          { label: 'Characters', value: stats.charCount },
          { label: 'Sentences', value: stats.sentenceCount },
          { label: 'Read time', value: `${stats.readingTime} min` },
        ].map((s) => (
          <div key={s.label} className="stat"><span className="lbl">{s.label}</span><span className="stat-v">{s.value}</span></div>
        ))}
      </div>

      {hasText && (
        <div className="tl-3">
          <FlagCard label="Filler words" count={stats.fillerTotal} good={stats.fillerTotal === 0} items={stats.fillers.map((f) => `${f.phrase} (${f.count})`)} emptyMsg="No filler words. Crisp writing." />
          <FlagCard label="Passive voice" count={stats.passiveMatches} good={stats.passiveMatches <= 2} items={[]} emptyMsg="Mostly active voice." note={stats.passiveMatches > 2 ? 'Try active voice: "Led the team" instead of "The team was led".' : undefined} />
          <FlagCard label="Clichés" count={stats.clicheTotal} good={stats.clicheTotal === 0} items={stats.cliches.map((c) => `${c.phrase} (${c.count})`)} emptyMsg="No overused clichés." />
        </div>
      )}

      {hasText && stats.avgWordsPerSentence > 25 && (
        <div className="note note-flag" role="status">
          <span>Your sentences average {stats.avgWordsPerSentence.toFixed(0)} words. Shorter sentences, around 15 to 20 words, read more clearly on a resume.</span>
        </div>
      )}
    </div>
  )
}

function FlagCard({ label, count, good, items, emptyMsg, note }: { label: string; count: number; good: boolean; items: string[]; emptyMsg: string; note?: string }) {
  return (
    <div className="panel" style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <b style={{ fontWeight: 500 }}>{label}</b>
        <span className={`chip ${good ? 'chip-ok' : 'chip-bad'}`}>{count}</span>
      </div>
      {count === 0 ? (
        <p className="tl-hint" style={{ margin: 0 }}>{emptyMsg}</p>
      ) : (
        <>
          {items.length > 0 && <div className="tl-chips">{items.map((it) => <span key={it} className="chip">{it}</span>)}</div>}
          {note && <p className="tl-hint" style={{ margin: 0 }}>{note}</p>}
        </>
      )}
    </div>
  )
}
