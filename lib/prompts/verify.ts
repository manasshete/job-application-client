/**
 * Cheap checks on model output against the candidate's own text. Anything that
 * fails is added to the review flags so the candidate checks it before approving.
 */

export interface CheckFlag {
  severity: 'medium'
  type: 'check'
  message: string
  cv_reference: string
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[‘’`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[‐-―−]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()

/** "15,000" and "15000" count as the same number. */
const numbers = (s: string) => new Set((s.match(/\d[\d,.]*/g) ?? []).map((n) => n.replace(/[.,]$/, '').replace(/,/g, '')))

const NUMBER_WORDS = 'one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty'
const YEARS_RE = new RegExp(`\\b(?:over |more than |nearly |almost )?(?:\\d+|${NUMBER_WORDS})\\+? years?\\b`, 'gi')

/** Sentence or line containing the match, for the flag's reference. */
function around(text: string, index: number) {
  const start = Math.max(text.lastIndexOf('\n', index), text.lastIndexOf('. ', index) + 1, 0)
  const end = text.indexOf('\n', index)
  return text.slice(start, end === -1 ? undefined : end).trim().slice(0, 200)
}

/** Numbers and "N years" phrases in the output that the source text never states. */
export function checkFacts(output: string, source: string): CheckFlag[] {
  const flags: CheckFlag[] = []
  const known = numbers(source)
  const seen = new Set<string>()
  for (const m of output.matchAll(/\d[\d,.]*/g)) {
    const n = m[0].replace(/[.,]$/, '').replace(/,/g, '')
    if (known.has(n) || seen.has(n)) continue
    seen.add(n)
    flags.push({ severity: 'medium', type: 'check', message: `The number ${m[0].replace(/[.,]$/, '')} does not appear on your CV.`, cv_reference: around(output, m.index) })
  }
  const src = norm(source)
  for (const m of output.matchAll(YEARS_RE)) {
    if (src.includes(norm(m[0]))) continue
    flags.push({ severity: 'medium', type: 'check', message: `"${m[0]}" is not stated on your CV. Check it is accurate or remove it.`, cv_reference: around(output, m.index) })
  }
  return flags
}

/** Skill items that are not on the CV as written. Synonyms are allowed but should be checked. */
export function checkSkills(items: string[], source: string): CheckFlag[] {
  const src = norm(source)
  return items
    .filter((item) => {
      const main = norm(item.replace(/\(.*?\)/g, ''))
      return main && !src.includes(main) && !src.includes(norm(item))
    })
    .map((item) => ({ severity: 'medium', type: 'check', message: `The skill "${item}" is not worded this way on your CV. Keep it only if it means the same as something you list.`, cv_reference: item }))
}

/** Claims whose supporting quote is not copied exactly from the CV or notes. */
export function checkQuotes(claims: { sentence: string; evidence: string }[], source: string): CheckFlag[] {
  const src = norm(source)
  return claims
    .filter((c) => !c.evidence.trim() || !src.includes(norm(c.evidence).replace(/[.;]$/, '')))
    .map((c) => ({ severity: 'medium', type: 'check', message: 'We could not match this sentence to an exact line on your CV. Check it is accurate.', cv_reference: c.sentence }))
}

/** Amounts whose currency symbol differs from the CV, e.g. "#15,000" for "£15,000". */
export function checkCurrency(output: string, source: string): CheckFlag[] {
  const src = source.replace(/,/g, '')
  const flags: CheckFlag[] = []
  for (const m of output.matchAll(/([£$€#])\s?(\d[\d,.]*)/g)) {
    const amount = m[2].replace(/[.,]$/, '').replace(/,/g, '')
    if (src.includes(`${m[1]}${amount}`) || src.includes(`${m[1]} ${amount}`)) continue
    flags.push({ severity: 'medium', type: 'check', message: `"${m[0].replace(/[.,]$/, '')}" does not match the amount on your CV. Check the currency and figure.`, cv_reference: around(output, m.index) })
  }
  return flags
}

const COURTESY = /\b(look forward|welcome the (opportunity|chance)|thank you|kind regards|discuss)\b/i
// Sentences about what the candidate could do in the new role. The prompt asks for
// these to explain relevance, and they make no claim about the past to check.
const FORWARD = /\b(will|would|prepares? me|equips? me|enables? me|allows? me|positions? me|(can|could) (support|help|contribute|add|bring))\b/i

/**
 * First-person sentences the model left out of its claims list. The prompt asks for
 * every such sentence to be listed, so an unlisted one has not been checked against the CV.
 */
export function checkUnlisted(paragraphs: string[], claims: { sentence: string }[]): CheckFlag[] {
  const listed = claims.map((c) => norm(c.sentence))
  return paragraphs
    .flatMap((p) => p.match(/[^.!?]+[.!?]+/g) ?? [p])
    .map((s) => s.trim())
    .filter((s) => /\b(I|[Mm]y|me)\b/.test(s) && !COURTESY.test(s) && !FORWARD.test(s))
    .filter((s) => !listed.some((l) => l.includes(norm(s)) || norm(s).includes(l)))
    .map((s) => ({ severity: 'medium', type: 'check', message: 'This sentence describes you but is not tied to a line on your CV. Check it is accurate.', cv_reference: s }))
}

const STEMS = 'optimi|utili|organi|priori|speciali|recogni|maximi|minimi|standardi|customi|emphasi|summari|categori|reali|capitali|moderni|visuali|personali|centrali|mobili|analy'
const US_RE = new RegExp(`\\b(?:${STEMS})z(?:e|ed|er|ers|es|ing|ation|ations)\\b`, 'gi')
const UK_RE = new RegExp(`\\b(?:${STEMS})s(?:e|ed|er|ers|es|ing|ation|ations)\\b`, 'gi')

function variety(text: string): 'uk' | 'us' | null {
  const uk = text.match(UK_RE)?.length ?? 0
  const us = text.match(US_RE)?.length ?? 0
  return uk > us ? 'uk' : us > uk ? 'us' : null
}

const UK_PLACES = /\b(UK|U\.K\.|United Kingdom|England|Scotland|Wales|Northern Ireland|Ireland|London|Manchester|Birmingham|Leeds|Liverpool|Bristol|Glasgow|Edinburgh|Cardiff|Belfast|Dublin|Australia|Sydney|Melbourne|New Zealand|Auckland)\b/i
const US_PLACES = /\b(USA|U\.S\.|United States|New York|San Francisco|Los Angeles|Chicago|Seattle|Boston|Austin|Canada|Toronto|Vancouver)\b/i

/**
 * Words spelt in the other variety from the posting. Falls back to the job location,
 * then the CV, when the posting gives no signal.
 */
export function checkSpelling(output: string, posting: string, cv: string, location = ''): CheckFlag[] {
  const place = UK_PLACES.test(location) ? 'uk' : US_PLACES.test(location) ? 'us' : null
  const want = variety(posting) ?? place ?? variety(cv)
  if (!want) return []
  const wrong = [...new Set(output.match(want === 'uk' ? US_RE : UK_RE) ?? [])]
  if (!wrong.length) return []
  return [{ severity: 'medium', type: 'check', message: `These words use ${want === 'uk' ? 'US' : 'UK'} spelling but this job uses ${want === 'uk' ? 'UK' : 'US'} spelling.`, cv_reference: wrong.join(', ') }]
}
