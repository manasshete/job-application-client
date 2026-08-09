'use client'

import { useState } from 'react'
import { Check, X, Search, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

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

function scoreColor(score: number): string {
  if (score >= 75) return 'text-emerald-600'
  if (score >= 50) return 'text-amber-600'
  return 'text-red-600'
}

function scoreRing(score: number): string {
  if (score >= 75) return 'stroke-emerald-500'
  if (score >= 50) return 'stroke-amber-500'
  return 'stroke-red-500'
}

export function AtsScanner() {
  const [resume, setResume] = useState('')
  const [jd, setJd] = useState('')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState('')

  function handleScan() {
    if (resume.trim().length < 50 || jd.trim().length < 50) {
      setError('Please paste both your resume and a job description (at least a few sentences each).')
      setResult(null)
      return
    }
    setError('')
    setResult(scan(resume, jd))
  }

  const circumference = 2 * Math.PI * 52

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col">
          <label htmlFor="resume" className="mb-2 text-sm font-medium text-slate-900">
            Your resume
          </label>
          <Textarea
            id="resume"
            value={resume}
            onChange={(e) => setResume(e.target.value)}
            placeholder="Paste the full text of your resume here…"
            className="min-h-[220px] resize-y rounded-xl border-slate-200 text-sm"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="jd" className="mb-2 text-sm font-medium text-slate-900">
            Job description
          </label>
          <Textarea
            id="jd"
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Paste the job description you're applying to…"
            className="min-h-[220px] resize-y rounded-xl border-slate-200 text-sm"
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      <div className="mt-6 flex justify-center">
        <Button onClick={handleScan} size="lg" className="bg-blue-600 hover:bg-blue-700">
          <Search className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Scan my resume
        </Button>
      </div>

      {result && (
        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-10">
            <div className="relative flex h-32 w-32 shrink-0 items-center justify-center">
              <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" className="stroke-slate-100" strokeWidth="12" />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  className={scoreRing(result.score)}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (result.score / 100) * circumference}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className={`text-3xl font-bold ${scoreColor(result.score)}`}>{result.score}%</span>
                <span className="text-xs text-slate-400">match</span>
              </div>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-lg font-semibold text-slate-900">
                {result.score >= 75
                  ? 'Strong match'
                  : result.score >= 50
                    ? 'Decent match — room to improve'
                    : 'Low match — add missing keywords'}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">
                Your resume includes {result.matched.length} of {result.totalKeywords} key terms from
                this job description. Weaving in the missing keywords (where truthful) can improve how
                an ATS ranks you.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                <Check className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                Matched keywords ({result.matched.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {result.matched.length === 0 && (
                  <span className="text-sm text-slate-400">None yet</span>
                )}
                {result.matched.map((kw) => (
                  <span
                    key={kw}
                    className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                <X className="h-4 w-4 text-red-500" aria-hidden="true" />
                Missing keywords ({result.missing.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {result.missing.length === 0 && (
                  <span className="text-sm text-slate-400">Nothing missing — great!</span>
                )}
                {result.missing.map((kw) => (
                  <span
                    key={kw}
                    className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-6 text-xs leading-relaxed text-slate-400">
            This is a keyword-based estimate to guide your edits — real ATS software varies. Only add
            keywords that genuinely reflect your experience.
          </p>
        </div>
      )}
    </div>
  )
}
