/**
 * Redline for a tailored CV.
 *
 * The tailoring API returns plain text only, so the changes are worked out here by
 * comparing the master CV with the tailored text, line by line and then word by word.
 * Changes to dates, job titles, qualifications and skills are flagged so the user
 * can keep or revert each one before approving.
 */

export type FlagType = 'Job title' | 'Date' | 'Qualification' | 'Skill'
export type FlagChoice = 'pending' | 'kept' | 'reverted'
export type FlagState = Record<number, FlagChoice>

export type Part =
  | { kind: 'text'; t: string }
  | { kind: 'chg'; old: string; new: string; gapOld: string; gapNew: string; flag?: number }

export interface DiffLine {
  cls: 'cv-name' | 'cv-meta' | 'cv-h' | 'cv-li' | 'cv-p' | 'cv-gap'
  /** Text that precedes the line in plain output, e.g. "- ". */
  prefix: string
  parts: Part[]
  /** True when the whole line exists only in the tailored CV. */
  inserted: boolean
}

export interface Flag {
  n: number
  type: FlagType
  what: string
  note: string
}

export interface CvDiff {
  lines: DiffLine[]
  flags: Flag[]
  changed: boolean
}

export interface Seg {
  t: string
  k: '' | 'del' | 'ins' | 'mk' | 'mk mk-ok'
}
export interface RenderLine {
  c: string
  segs: Seg[]
}

/* ── Tokens and LCS ─────────────────────────────────── */

const norm = (s: string) => s.replace(/\s+/g, ' ').trim()
const tokens = (s: string) => norm(s).match(/\S+\s*/g) ?? []

type Op<T> = { op: 'eq' | 'del' | 'ins'; a?: T; b?: T }

function lcsDiff<T>(a: T[], b: T[], same: (x: T, y: T) => boolean): Op<T>[] {
  const n = a.length
  const m = b.length
  const dp: Uint16Array[] = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = same(a[i], b[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const out: Op<T>[] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (same(a[i], b[j])) out.push({ op: 'eq', a: a[i++], b: b[j++] })
    else if (dp[i + 1][j] >= dp[i][j + 1]) out.push({ op: 'del', a: a[i++] })
    else out.push({ op: 'ins', b: b[j++] })
  }
  while (i < n) out.push({ op: 'del', a: a[i++] })
  while (j < m) out.push({ op: 'ins', b: b[j++] })
  return out
}

const trailingSpace = (s: string) => (/\s$/.test(s) ? ' ' : '')

function wordDiff(oldLine: string, newLine: string): Part[] {
  const ops = lcsDiff(tokens(oldLine), tokens(newLine), (x, y) => x.trim() === y.trim())
  const parts: Part[] = []
  let oldRun: string[] = []
  let newRun: string[] = []
  const flush = () => {
    if (!oldRun.length && !newRun.length) return
    parts.push({
      kind: 'chg',
      old: oldRun.join('').trim(),
      new: newRun.join('').trim(),
      gapOld: oldRun.length ? trailingSpace(oldRun[oldRun.length - 1]) : '',
      gapNew: newRun.length ? trailingSpace(newRun[newRun.length - 1]) : '',
    })
    oldRun = []
    newRun = []
  }
  for (const o of ops) {
    if (o.op === 'eq') {
      flush()
      parts.push({ kind: 'text', t: o.b! })
    } else if (o.op === 'del') oldRun.push(o.a!)
    else newRun.push(o.b!)
  }
  flush()
  return parts
}

function similarity(a: string, b: string): number {
  const ta = new Set(tokens(a).map((t) => t.trim().toLowerCase()))
  const tb = new Set(tokens(b).map((t) => t.trim().toLowerCase()))
  if (!ta.size || !tb.size) return 0
  let shared = 0
  ta.forEach((t) => tb.has(t) && shared++)
  return shared / Math.max(ta.size, tb.size)
}

/* ── Line classification ────────────────────────────── */

const BULLET = /^\s*([-•*–·])\s+/
const HEADINGS = /^(summary|profile|objective|experience|work experience|professional experience|employment|education|skills|technical skills|key skills|core skills|projects|certifications?|achievements|awards|languages|interests|references|publications)\s*:?$/i

function classify(raw: string, index: number, firstTextIndex: number): { cls: DiffLine['cls']; prefix: string; text: string } {
  const text = raw.trim()
  if (!text) return { cls: 'cv-gap', prefix: '', text: '' }
  const bullet = text.match(BULLET)
  if (bullet) return { cls: 'cv-li', prefix: `${bullet[1]} `, text: text.slice(bullet[0].length) }
  if (index === firstTextIndex) return { cls: 'cv-name', prefix: '', text }
  if (index === firstTextIndex + 1 && (/@/.test(text) || /\+?\d[\d\s-]{7,}/.test(text) || /linkedin|github/i.test(text))) return { cls: 'cv-meta', prefix: '', text }
  const letters = text.replace(/[^A-Za-z]/g, '')
  if (HEADINGS.test(text) || (letters.length >= 3 && text.length <= 40 && text === text.toUpperCase() && !/[.,;]/.test(text))) return { cls: 'cv-h', prefix: '', text }
  return { cls: 'cv-p', prefix: '', text }
}

/* ── Flag detection ─────────────────────────────────── */

const DATE_RE = /\b(19|20)\d{2}\b|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\b|\b(present|current|ongoing)\b/i
const QUAL_RE = /\b(b\.?\s?tech|b\.?\s?e\b|b\.?\s?sc|m\.?\s?sc|m\.?\s?tech|mba|bca|mca|b\.?\s?a\b|m\.?\s?a\b|bachelor|master|ph\.?\s?d|diploma|degree|certif\w*|gpa|cgpa|first class|distinction|honou?rs|cum laude)\b|\b\d{2}(\.\d+)?\s?%/i
const TITLE_RE = /\b(engineer|developer|manager|designer|analyst|lead|director|intern|consultant|architect|scientist|specialist|officer|head|associate|executive|administrator|coordinator|programmer|researcher|strategist)\b/i
const SKILL_SECTION = /skill|technolog|tools|competenc|expertise|stack/i
const EDU_SECTION = /education|qualification|academic|certif/i

const clip = (s: string, n = 80) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s)
const q = (s: string) => `“${clip(s)}”`

const splitSkills = (s: string) =>
  s
    .split(/[,;|•]/)
    .map((x) => x.trim())
    .filter(Boolean)

function describe(old: string, next: string, suffixAdded: string): string {
  if (old && next) return `${q(old)} changed to ${q(next)}`
  if (next) return `${q(next)} ${suffixAdded}`
  return `${q(old)} removed`
}

const NOTES: Record<FlagType, { added: string; changed: string }> = {
  'Job title': { added: 'Not in your original CV. Keep it only if it was your official title.', changed: 'Matches the posting’s wording. Keep it only if that was your official title.' },
  Date: { added: 'Not in your original CV. Check it is correct.', changed: 'A date was changed. Check it matches your real dates.' },
  Qualification: { added: 'Not in your original CV. Revert it unless it is true.', changed: 'A qualification was changed. Keep it only if it is accurate.' },
  Skill: { added: 'Not in your original CV. Revert it unless you have used it.', changed: 'Reordered or trimmed to lead with what the posting asks for. Check nothing you want is missing.' },
}

const MAX_FLAGS = 15

function detectFlags(lines: DiffLine[], original: string[]): Flag[] {
  const flags: Flag[] = []
  let section = ''
  void original

  const add = (type: FlagType, what: string, added: boolean): number | undefined => {
    if (flags.length >= MAX_FLAGS) return undefined
    const n = flags.length + 1
    flags.push({ n, type, what, note: added ? NOTES[type].added : NOTES[type].changed })
    return n
  }

  for (const line of lines) {
    if (line.cls === 'cv-h') {
      section = line.parts.map((p) => (p.kind === 'text' ? p.t : p.new || p.old)).join('').trim().toLowerCase()
      continue
    }
    const chgs = line.parts.filter((p): p is Extract<Part, { kind: 'chg' }> => p.kind === 'chg')
    if (!chgs.length) continue

    // A skills line is flagged once as a whole.
    if (SKILL_SECTION.test(section) && line.cls !== 'cv-gap') {
      const oldText = line.parts.map((p) => (p.kind === 'text' ? p.t : p.old + p.gapOld)).join('')
      const newText = line.parts.map((p) => (p.kind === 'text' ? p.t : p.new + p.gapNew)).join('')
      const before = new Set(splitSkills(oldText).map((x) => x.toLowerCase()))
      const after = new Set(splitSkills(newText).map((x) => x.toLowerCase()))
      const addedSkills = splitSkills(newText).filter((x) => !before.has(x.toLowerCase()))
      const removedSkills = splitSkills(oldText).filter((x) => !after.has(x.toLowerCase()))
      const bits: string[] = []
      if (addedSkills.length) bits.push(`${q(addedSkills.join(', '))} added to your skills`)
      if (removedSkills.length) bits.push(`${q(removedSkills.join(', '))} removed`)
      const what = bits.length ? bits.join('; ') : 'Skills reordered'
      const n = add('Skill', what.charAt(0).toUpperCase() + what.slice(1), addedSkills.length > 0 && removedSkills.length === 0)
      if (n) chgs.forEach((c) => (c.flag = n))
      continue
    }

    for (const c of chgs) {
      const both = `${c.old} ${c.new}`
      let type: FlagType | null = null
      if (line.cls !== 'cv-li' && DATE_RE.test(both)) type = 'Date'
      else if (EDU_SECTION.test(section) || QUAL_RE.test(both)) type = 'Qualification'
      else if (line.cls !== 'cv-li' && TITLE_RE.test(both)) type = 'Job title'
      if (!type) continue
      const n = add(type, describe(c.old, c.new, type === 'Qualification' ? 'added to your education' : 'added'), !c.old && !!c.new)
      if (n) c.flag = n
    }
  }
  return flags
}

/* ── Build ──────────────────────────────────────────── */

function lineFrom(text: string, cls: DiffLine['cls'], prefix: string, parts: Part[], inserted: boolean): DiffLine {
  void text
  return { cls, prefix, parts, inserted }
}

export function diffCv(original: string, tailored: string): CvDiff {
  const a = original.replace(/\r/g, '').split('\n')
  const b = tailored.replace(/\r/g, '').split('\n')
  const firstText = b.findIndex((l) => l.trim())
  const ops = lcsDiff(a, b, (x, y) => norm(x).toLowerCase() === norm(y).toLowerCase())

  const lines: DiffLine[] = []
  let bi = 0
  const push = (raw: string, parts: Part[] | null, inserted = false) => {
    const idx = bi++
    const c = classify(raw, idx, firstText)
    lines.push(lineFrom(c.text, c.cls, c.prefix, parts ?? (c.text ? [{ kind: 'text', t: c.text }] : []), inserted))
  }

  let i = 0
  while (i < ops.length) {
    if (ops[i].op === 'eq') {
      push(ops[i].b!, null)
      i++
      continue
    }
    // A run of deletions and insertions between two equal lines.
    const dels: string[] = []
    const inss: string[] = []
    while (i < ops.length && ops[i].op !== 'eq') {
      if (ops[i].op === 'del') dels.push(ops[i].a!)
      else inss.push(ops[i].b!)
      i++
    }
    const usedDel = new Set<number>()
    for (const raw of inss) {
      const text = classify(raw, bi, firstText).text
      let best = -1
      let bestScore = 0
      dels.forEach((d, k) => {
        if (usedDel.has(k)) return
        const score = similarity(classify(d, -1, -2).text, text)
        if (score > bestScore) {
          bestScore = score
          best = k
        }
      })
      if (best >= 0 && bestScore >= 0.3) {
        usedDel.add(best)
        const oldText = classify(dels[best], -1, -2).text
        push(raw, wordDiff(oldText, text))
      } else if (!text) {
        push(raw, null)
      } else {
        push(raw, [{ kind: 'chg', old: '', new: text, gapOld: '', gapNew: '' }], true)
      }
    }
    // Lines that only exist in the original: kept as removed lines (no tailored counterpart).
    dels.forEach((d, k) => {
      if (usedDel.has(k)) return
      const c = classify(d, -1, -2)
      if (!c.text) return
      lines.push({ cls: c.cls === 'cv-gap' ? 'cv-p' : c.cls, prefix: c.prefix, parts: [{ kind: 'chg', old: c.text, new: '', gapOld: '', gapNew: '' }], inserted: false })
    })
  }

  const flags = detectFlags(lines, a)
  const changed = lines.some((l) => l.parts.some((p) => p.kind === 'chg'))
  return { lines, flags, changed }
}

/* ── Rendering ──────────────────────────────────────── */

export type ViewMode = 'red' | 'left' | 'right'

const markerClass = (state: FlagState, n: number): Seg['k'] => (state[n] === 'pending' || state[n] === undefined ? 'mk' : 'mk mk-ok')

export function renderLines(diff: CvDiff, mode: ViewMode, state: FlagState): RenderLine[] {
  const out: RenderLine[] = []
  for (const line of diff.lines) {
    const segs: Seg[] = []
    for (const p of line.parts) {
      if (p.kind === 'text') {
        segs.push({ t: p.t, k: '' })
        continue
      }
      const reverted = p.flag !== undefined && state[p.flag] === 'reverted'
      const mk: Seg | null = p.flag !== undefined ? { t: String(p.flag), k: markerClass(state, p.flag) } : null
      if (mode === 'left') {
        if (p.old) segs.push({ t: p.old, k: 'del' })
        if (p.old && mk) segs.push(mk)
        if (p.old && p.gapOld) segs.push({ t: p.gapOld, k: '' })
        continue
      }
      if (reverted) {
        if (p.old) segs.push({ t: p.old + p.gapOld, k: '' })
        continue
      }
      if (mode === 'right') {
        if (p.new) segs.push({ t: p.new, k: 'ins' })
        if (mk) segs.push(mk)
        if (p.new && p.gapNew) segs.push({ t: p.gapNew, k: '' })
        continue
      }
      if (p.old) segs.push({ t: p.old, k: 'del' })
      if (p.old && p.new) segs.push({ t: ' ', k: '' })
      if (p.new) segs.push({ t: p.new, k: 'ins' })
      if (mk) segs.push(mk)
      const gap = p.new ? p.gapNew : p.gapOld
      if (gap) segs.push({ t: gap, k: '' })
    }
    // In the left (original) column a line that only exists in the tailored CV is empty.
    if (mode === 'left' && line.inserted && !segs.length) continue
    // Right column: a removed line has nothing to show.
    if (mode === 'right' && !segs.length && line.cls !== 'cv-gap') continue
    out.push({ c: line.cls + (mode === 'red' ? '' : ' cvl'), segs })
  }
  return out
}

/** The final text: tailored, with reverted changes restored to the original wording. */
export function plainText(diff: CvDiff, state: FlagState): string {
  const rows: string[] = []
  for (const line of diff.lines) {
    if (line.cls === 'cv-gap') {
      rows.push('')
      continue
    }
    let text = ''
    for (const p of line.parts) {
      if (p.kind === 'text') text += p.t
      else {
        const reverted = p.flag !== undefined && state[p.flag] === 'reverted'
        text += reverted ? p.old + p.gapOld : p.new + p.gapNew
      }
    }
    text = text.trimEnd()
    // A removed line (no tailored counterpart) or an inserted line that was reverted leaves nothing behind.
    if (!text) continue
    rows.push(line.prefix + text)
  }
  return rows.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

export function initialFlagState(diff: CvDiff): FlagState {
  const s: FlagState = {}
  diff.flags.forEach((f) => (s[f.n] = 'pending'))
  return s
}
