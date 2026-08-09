'use client'

import { useMemo, useState } from 'react'
import { Textarea } from '@/components/ui/textarea'

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
    <div className="mx-auto max-w-4xl px-6 py-12">
      <label htmlFor="text" className="mb-2 block text-sm font-medium text-slate-900">
        Paste your resume or cover letter
      </label>
      <Textarea
        id="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your text here to analyze it live…"
        className="min-h-[240px] resize-y rounded-xl border-slate-200 text-sm"
      />

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Words', value: stats.wordCount },
          { label: 'Characters', value: stats.charCount },
          { label: 'Sentences', value: stats.sentenceCount },
          { label: 'Read time', value: `${stats.readingTime} min` },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      {hasText && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <FlagCard
            label="Filler words"
            count={stats.fillerTotal}
            tone={stats.fillerTotal === 0 ? 'good' : 'warn'}
            items={stats.fillers.map((f) => `${f.phrase} (${f.count})`)}
            emptyMsg="No filler words — crisp writing."
          />
          <FlagCard
            label="Passive voice"
            count={stats.passiveMatches}
            tone={stats.passiveMatches <= 2 ? 'good' : 'warn'}
            items={[]}
            emptyMsg="Mostly active voice — strong."
            note={
              stats.passiveMatches > 2
                ? 'Try rewriting some sentences in active voice ("Led the team" vs "The team was led").'
                : undefined
            }
          />
          <FlagCard
            label="Clichés"
            count={stats.clicheTotal}
            tone={stats.clicheTotal === 0 ? 'good' : 'warn'}
            items={stats.cliches.map((c) => `${c.phrase} (${c.count})`)}
            emptyMsg="No overused clichés — original."
          />
        </div>
      )}

      {hasText && stats.avgWordsPerSentence > 25 && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Your sentences average {stats.avgWordsPerSentence.toFixed(0)} words. Shorter sentences
          (15–20 words) read more clearly on a resume.
        </p>
      )}
    </div>
  )
}

function FlagCard({
  label,
  count,
  tone,
  items,
  emptyMsg,
  note,
}: {
  label: string
  count: number
  tone: 'good' | 'warn'
  items: string[]
  emptyMsg: string
  note?: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-bold ${
            tone === 'good' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
          }`}
        >
          {count}
        </span>
      </div>
      {count === 0 ? (
        <p className="mt-2 text-xs leading-relaxed text-slate-500">{emptyMsg}</p>
      ) : (
        <>
          {items.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {items.map((it) => (
                <span key={it} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {it}
                </span>
              ))}
            </div>
          )}
          {note && <p className="mt-2 text-xs leading-relaxed text-slate-500">{note}</p>}
        </>
      )}
    </div>
  )
}
