'use client'

import { useMemo, useState } from 'react'
import { Copy, Download, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
  const reason = f.reason.trim() || `[what draws you to ${company}]`

  const openings: Record<Tone, string> = {
    professional: `I am writing to apply for the ${role} position at ${company}. With a strong background in ${skill1} and ${skill2}, I am confident I would make a valuable addition to your team.`,
    enthusiastic: `I was thrilled to come across the ${role} opening at ${company} — it is exactly the kind of role I have been working toward. My experience with ${skill1} and ${skill2} makes me excited about what I could contribute.`,
    concise: `I am applying for the ${role} role at ${company}. My core strengths in ${skill1} and ${skill2} align closely with what the position requires.`,
  }

  const middles: Record<Tone, string> = {
    professional: `In my previous work, ${achievement}. I pride myself on ${skill1}, and I consistently look for ways to deliver measurable results. I believe these strengths would translate directly to the ${role} role.`,
    enthusiastic: `One accomplishment I am especially proud of: ${achievement}. Experiences like that are why I love this work, and I would bring the same energy and focus to the ${role} role at ${company}.`,
    concise: `A recent highlight: ${achievement}. I focus on outcomes and would bring that same result-driven approach to ${company}.`,
  }

  const closings: Record<Tone, string> = {
    professional: `I am particularly drawn to ${company} because ${reason}. I would welcome the opportunity to discuss how my experience aligns with your needs. Thank you for your consideration.`,
    enthusiastic: `What excites me most about ${company} is ${reason}. I would love the chance to talk about how I can help your team succeed. Thank you so much for considering my application!`,
    concise: `I am interested in ${company} because ${reason}. I would welcome a conversation. Thank you for your time.`,
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
  const [copied, setCopied] = useState(false)

  const letter = useMemo(() => buildLetter(fields, tone), [fields, tone])

  function update(key: keyof Fields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }))
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(letter)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable — no-op */
    }
  }

  function handleDownload() {
    const blob = new Blob([letter], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cover-letter-${(fields.company || 'draft').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="mb-5">
            <p className="mb-2 text-sm font-medium text-slate-900">Tone</p>
            <div className="flex flex-wrap gap-2">
              {TONES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTone(t.value)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                    tone === t.value
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {FIELD_DEFS.map((def) => (
              <div key={def.key}>
                <label htmlFor={def.key} className="mb-1.5 block text-sm font-medium text-slate-900">
                  {def.label}
                </label>
                <input
                  id={def.key}
                  value={fields[def.key]}
                  onChange={(e) => update(def.key, e.target.value)}
                  placeholder={def.placeholder}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-900">Preview</p>
            <div className="flex gap-2">
              <Button onClick={handleCopy} size="sm" variant="outline" className="h-8 gap-1.5">
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button onClick={handleDownload} size="sm" className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700">
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
            </div>
          </div>
          <pre className="flex-1 whitespace-pre-wrap rounded-2xl border border-slate-200 bg-white p-6 font-sans text-sm leading-relaxed text-slate-700">
            {letter}
          </pre>
          <p className="mt-3 text-xs leading-relaxed text-slate-400">
            Built from a proven template — no AI, fully private. Edit freely before sending.
          </p>
        </div>
      </div>
    </div>
  )
}
