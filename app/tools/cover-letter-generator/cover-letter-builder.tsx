'use client'

import { useMemo, useState } from 'react'
import { Copy, Download, Check } from 'lucide-react'

type Tone = 'professional' | 'enthusiastic' | 'concise'

const TONES: { value: Tone; label: string }[] = [
  { value: 'professional', label: 'Professional' },
  { value: 'enthusiastic', label: 'Enthusiastic' },
  { value: 'concise', label: 'Concise' },
]

interface Fields {
  name: string
  role: string
  company: string
  skill1: string
  skill2: string
  achievement: string
  reason: string
}

function buildLetter(f: Fields, tone: Tone): string {
  const name = f.name.trim() || '[Your Name]'
  const role = f.role.trim() || '[Role]'
  const company = f.company.trim() || '[Company]'
  const skill1 = f.skill1.trim() || '[key skill]'
  const skill2 = f.skill2.trim() || '[another skill]'
  const achievement = f.achievement.trim() || '[a specific achievement or result]'
  const reason = f.reason.trim() || `[what draws you to ${f.company.trim() || 'the company'}]`

  const openings: Record<Tone, string> = {
    professional: `I am writing to apply for the ${role} position at ${company}. With a strong background in ${skill1} and ${skill2}, I am confident I would make a valuable addition to your team.`,
    enthusiastic: `I was thrilled to come across the ${role} opening at ${company} — it is exactly the kind of role I have been working toward. My experience with ${skill1} and ${skill2} makes me excited about what I could contribute.`,
    concise: `I am applying for the ${role} role at ${company}. My core strengths in ${skill1} and ${skill2} align closely with what the position requires.`,
  }

  const middles: Record<Tone, string> = {
    professional: `In my previous work, ${achievement}. I pride myself on ${skill1}, and I consistently look for ways to deliver measurable results. I believe these strengths would translate directly to the ${role} role.`,
    enthusiastic: `One accomplishment I am especially proud of: ${achievement}. Experiences like that are why I love this work, and I would bring the same energy and focus to the ${role} role at ${company}.`,
    concise: `A recent highlight: ${achievement}. I focus on outcomes and would bring that same approach to ${company}.`,
  }

  const closings: Record<Tone, string> = {
    professional: `I am particularly drawn to ${company} for ${reason}. I would welcome the opportunity to discuss how my experience aligns with your needs. Thank you for your consideration.`,
    enthusiastic: `What excites me most about ${company} is ${reason}. I would love the chance to talk about how I can help your team succeed. Thank you so much for considering my application!`,
    concise: `I am interested in ${company} for ${reason}. I would welcome a conversation. Thank you for your time.`,
  }

  return [
    `Dear Hiring Manager,`,
    ``,
    openings[tone],
    ``,
    middles[tone],
    ``,
    closings[tone],
    ``,
    `Sincerely,`,
    name,
  ].join('\n')
}

const FIELD_DEFS: { key: keyof Fields; label: string; placeholder: string }[] = [
  { key: 'name', label: 'Your name', placeholder: 'Jordan Lee' },
  { key: 'role', label: 'Role you\u2019re applying for', placeholder: 'Product Designer' },
  { key: 'company', label: 'Company', placeholder: 'Acme Inc.' },
  { key: 'skill1', label: 'Top skill', placeholder: 'user research' },
  { key: 'skill2', label: 'Second skill', placeholder: 'design systems' },
  { key: 'achievement', label: 'A key achievement', placeholder: 'I redesigned onboarding and lifted activation by 22%' },
  { key: 'reason', label: 'Why this company', placeholder: 'its focus on accessible design' },
]

export function CoverLetterBuilder() {
  const [fields, setFields] = useState<Fields>({
    name: '', role: '', company: '', skill1: '', skill2: '', achievement: '', reason: '',
  })
  const [tone, setTone] = useState<Tone>('professional')
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')

  const letter = useMemo(() => buildLetter(fields, tone), [fields, tone])

  function update(key: keyof Fields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }))
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(letter)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
    setTimeout(() => setCopyState('idle'), 2000)
  }

  function handleDownload() {
    const blob = new Blob([letter], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const slug = fields.company.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'draft'
    const a = document.createElement('a')
    a.href = url
    a.download = `cover-letter-${slug}.txt`
    // Firefox/Safari need the link in the DOM, and revoking immediately can cancel the download.
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div className="tl-wrap">
      <div className="tl-2" style={{ alignItems: 'start', gap: 28 }}>
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="tl-field">
            <span className="tl-lbl" id="tone-l">Tone</span>
            <div className="tl-opts" role="radiogroup" aria-labelledby="tone-l">
              {TONES.map((t) => (
                <button key={t.value} type="button" role="radio" aria-checked={tone === t.value} className={`seg${tone === t.value ? ' seg-on' : ''}`} onClick={() => setTone(t.value)}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          {FIELD_DEFS.map((def) => (
            <div key={def.key} className="tl-field">
              <label htmlFor={def.key}>{def.label}</label>
              <input id={def.key} className="inp" value={fields[def.key]} onChange={(e) => update(def.key, e.target.value)} placeholder={def.placeholder} />
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gap: 12, position: 'sticky', top: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span className="tl-lbl">Preview</span>
            <div className="tl-actions">
              <button type="button" className="btn btn-q" style={{ minHeight: 36 }} onClick={handleCopy}>
                {copyState === 'copied' ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                {copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Copy failed' : 'Copy'}
              </button>
              <button type="button" className="btn btn-p" style={{ minHeight: 36 }} onClick={handleDownload}>
                <Download aria-hidden="true" />
                Download
              </button>
            </div>
          </div>
          <pre className="tl-pre" aria-live="polite">{letter}</pre>
          <p className="tl-hint" style={{ margin: 0 }}>Built from a proven template, no AI, fully private. Edit freely before sending.</p>
        </div>
      </div>
    </div>
  )
}
