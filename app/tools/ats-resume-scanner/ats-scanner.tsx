'use client'

import { useState } from 'react'
import { Check, X, Search, AlertCircle } from 'lucide-react'

/** Common English stopwords + generic resume filler to ignore when extracting keywords. */
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'if', 'then', 'else', 'for', 'to', 'of', 'in', 'on', 'at',
  'by', 'with', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'this', 'that', 'these',
  'those', 'it', 'its', 'we', 'you', 'your', 'our', 'they', 'their', 'he', 'she', 'his', 'her',
  'from', 'up', 'down', 'out', 'about', 'into', 'over', 'under', 'again', 'further', 'here', 'there',
  'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
  'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now', 'who',
  'what', 'which', 'when', 'where', 'why', 'how', 'have', 'has', 'had', 'do', 'does', 'did', 'i',
  'me', 'my', 'am', 'us', 'them', 'work', 'working', 'role', 'team', 'company', 'job', 'position',
  'looking', 'ability', 'strong', 'good', 'great', 'well', 'including', 'etc', 'e', 'g', 'per',
  'across', 'within', 'while', 'also', 'may', 'must', 'able', 'help', 'like', 'new', 'plus', 'years',
  'year', 'experience', 'experienced', 'skills', 'skill', 'requirements', 'required', 'responsibilities',
  'need', 'needs', 'needed', 'want', 'wants', 'seeking', 'seek', 'looking', 'join', 'using', 'use',
  'would', 'could', 'make', 'get', 'many', 'much', 'high', 'highly', 'based', 'ensure', 'build',
  'develop', 'support', 'provide', 'responsible', 'candidate', 'candidates', 'ideal', 'preferred',
  'excellent', 'etc', 'one', 'two', 'both', 'being', 'order', 'within', 'environment', 'opportunity',
  'opportunities', 'benefits', 'offer', 'offers', 'apply', 'applicant', 'applicants', 'salary',
  'location', 'office', 'day', 'days', 'time', 'full', 'part', 'equal', 'employer', 'employees',
  'background', 'related', 'relevant', 'knowledge', 'understanding', 'proven', 'track', 'record',
  'demonstrated', 'familiarity', 'familiar', 'proficiency', 'proficient', 'minimum', 'ideally',
  'world', 'people', 'others', 'every', 'way', 'ways', 'key', 'take', 'best', 'e.g', 'i.e', 'eg',
  'ie', 'vs', 'via', 'ok',
])

/** One-letter terms that are real skills (languages). Everything else under 2 chars is noise. */
const SHORT_TERMS = new Set(['c', 'r'])

/**
 * Light suffix stripping so "APIs" matches "API" and "managed" matches "management".
 * Only used for comparison; the original word is still what gets displayed.
 */
function stem(word: string): string {
  if (/[^a-z]/.test(word)) return word // keep c++, c#, node.js, ci-cd as-is
  const strip = (w: string, suffix: string) =>
    w.endsWith(suffix) && w.length - suffix.length >= 3 ? w.slice(0, -suffix.length) : null
  // Plurals first, then word-form suffixes, then a trailing "e" (manage/managed -> manag).
  let w = word
  const ies = strip(w, 'ies')
  if (ies) w = `${ies}y`
  else w = strip(w, 'es') ?? (w.endsWith('ss') ? w : strip(w, 's') ?? w)
  w = strip(w, 'ment') ?? strip(w, 'ing') ?? strip(w, 'ed') ?? w
  return w.length > 3 && w.endsWith('e') ? w.slice(0, -1) : w
}

interface ScanResult {
  score: number
  matched: string[]
  missing: string[]
  totalKeywords: number
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, ' ') // "/" becomes a space, so ci/cd -> ci, cd
    .split(/\s+/)
    .map((w) => w.replace(/^[.\-]+|[.\-]+$/g, ''))
    .filter((w) => (w.length >= 2 || SHORT_TERMS.has(w)) && !STOPWORDS.has(w) && !/^\d+$/.test(w))
}

/** Technical-looking terms (c++, node.js, ci-cd, s3) win frequency ties over plain words. */
function isTechnical(word: string): boolean {
  return /[^a-z]/.test(word) || word.length <= 3
}

function extractKeywords(jd: string): { stem: string; word: string }[] {
  const terms = new Map<string, { word: string; count: number; first: number }>()
  tokenize(jd).forEach((token, i) => {
    const key = stem(token)
    const entry = terms.get(key)
    if (entry) entry.count++
    else terms.set(key, { word: token, count: 1, first: i })
  })
  // Rank by frequency, then technical terms, then order of appearance.
  return [...terms.entries()]
    .sort(([, a], [, b]) =>
      b.count - a.count ||
      Number(isTechnical(b.word)) - Number(isTechnical(a.word)) ||
      a.first - b.first,
    )
    .slice(0, 30)
    .map(([key, { word }]) => ({ stem: key, word }))
}

function scan(resume: string, jd: string): ScanResult {
  const keywords = extractKeywords(jd)
  const resumeStems = new Set(tokenize(resume).map(stem))
  const matched: string[] = []
  const missing: string[] = []
  for (const kw of keywords) {
    if (resumeStems.has(kw.stem)) matched.push(kw.word)
    else missing.push(kw.word)
  }
  const totalKeywords = keywords.length
  const score = totalKeywords === 0 ? 0 : Math.round((matched.length / totalKeywords) * 100)
  return { score, matched, missing, totalKeywords }
}

function tone(score: number): { cls: string; stroke: string; title: string } {
  if (score >= 75) return { cls: 'tl-ok', stroke: 'var(--st-offer)', title: 'Strong match' }
  if (score >= 50) return { cls: 'tl-warn', stroke: 'var(--flag-ink)', title: 'Decent match, room to improve' }
  return { cls: 'tl-bad', stroke: 'var(--st-rejected)', title: 'Low match: add missing keywords' }
}

export function AtsScanner() {
  const [resume, setResume] = useState('')
  const [jd, setJd] = useState('')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState('')

  function handleScan() {
    if (resume.trim().length < 50 || jd.trim().length < 50) {
      setError('Paste both your resume and the job description, at least a few sentences each.')
      setResult(null)
      return
    }
    setError('')
    setResult(scan(resume, jd))
  }

  function reset() {
    setResume('')
    setJd('')
    setResult(null)
    setError('')
  }

  const circumference = 2 * Math.PI * 52
  const t = result ? tone(result.score) : null

  return (
    <div className="tl-wrap">
      <div className="tl-2">
        <div className="tl-field">
          <label htmlFor="resume">Your resume</label>
          <textarea id="resume" className="inp" style={{ minHeight: 240 }} value={resume} onChange={(e) => setResume(e.target.value)} placeholder="Paste the full text of your resume here" />
        </div>
        <div className="tl-field">
          <label htmlFor="jd">Job description</label>
          <textarea id="jd" className="inp" style={{ minHeight: 240 }} value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Paste the job description you are applying to" />
        </div>
      </div>

      {error && (
        <div className="field-msg field-err" role="alert" style={{ marginTop: 0 }}>
          <AlertCircle aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div className="tl-actions">
        <button type="button" className="btn btn-p" onClick={handleScan}>
          <Search aria-hidden="true" />
          Scan my resume
        </button>
        {(resume || jd || result) && (
          <button type="button" className="btn btn-q" onClick={reset}>Clear</button>
        )}
        <span className="tl-hint">Runs in your browser. Nothing is sent or saved.</span>
      </div>

      {result && t && (
        <section className="panel fade" aria-live="polite" style={{ padding: 24, display: 'grid', gap: 24 }}>
          <div className="tl-score">
            <div className="tl-ring" role="img" aria-label={`${result.score} percent keyword match`}>
              <svg viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" className="trk" strokeWidth="10" />
                <circle cx="60" cy="60" r="52" fill="none" stroke={t.stroke} strokeWidth="10" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference - (result.score / 100) * circumference} />
              </svg>
              <div className="tl-ring-n"><b className={t.cls}>{result.score}%</b><span>match</span></div>
            </div>
            <div>
              <h2 className="h2" style={{ margin: 0 }}>{t.title}</h2>
              <p className="muted" style={{ margin: '6px 0 0', fontSize: 'var(--text-sm)', lineHeight: 1.6, maxWidth: 520 }}>
                Your resume includes {result.matched.length} of {result.totalKeywords} key terms from this job description. Add the missing ones where they are true to your experience.
              </p>
            </div>
          </div>

          <div className="tl-2">
            <div>
              <p className="lbl" style={{ margin: '0 0 10px' }}>Matched ({result.matched.length})</p>
              <div className="tl-chips">
                {result.matched.length === 0 && <span className="tl-hint">None yet</span>}
                {result.matched.map((kw) => <span key={kw} className="chip chip-ok">{kw}</span>)}
              </div>
            </div>
            <div>
              <p className="lbl" style={{ margin: '0 0 10px' }}>Missing ({result.missing.length})</p>
              <div className="tl-chips">
                {result.missing.length === 0 && <span className="tl-hint">Nothing missing</span>}
                {result.missing.map((kw) => <span key={kw} className="chip chip-bad">{kw}</span>)}
              </div>
            </div>
          </div>

          <p className="tl-hint" style={{ margin: 0 }}>A keyword-based estimate to guide your edits. Real ATS software varies, so only add keywords that reflect your experience.</p>
        </section>
      )}
    </div>
  )
}
