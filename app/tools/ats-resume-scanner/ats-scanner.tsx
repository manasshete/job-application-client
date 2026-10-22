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
  'excellent', 'etc', 'one', 'two', 'both', 'being', 'order', 'within',
])

interface ScanResult {
  score: number
  matched: string[]
  missing: string[]
  totalKeywords: number
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/^[.\-]+|[.\-]+$/g, ''))
    .filter((w) => w.length > 2 && !STOPWORDS.has(w) && !/^\d+$/.test(w))
}

function extractKeywords(jd: string): string[] {
  const counts = new Map<string, number>()
  for (const token of tokenize(jd)) {
    counts.set(token, (counts.get(token) ?? 0) + 1)
  }
  // Rank by frequency, keep the most significant terms.
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([word]) => word)
}

function scan(resume: string, jd: string): ScanResult {
  const keywords = extractKeywords(jd)
  const resumeTokens = new Set(tokenize(resume))
  const matched: string[] = []
  const missing: string[] = []
  for (const kw of keywords) {
    if (resumeTokens.has(kw)) matched.push(kw)
    else missing.push(kw)
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
