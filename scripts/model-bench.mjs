// Benchmarks cheap OpenRouter models on this app's three AI tasks using the
// real production prompts. Usage:
//   OPENROUTER_API_KEY=sk-or-... node scripts/model-bench.mjs [outDir]
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const KEY = process.env.OPENROUTER_API_KEY
if (!KEY) throw new Error('Set OPENROUTER_API_KEY')
const OUT = process.argv[2] ?? 'model-bench-out'

// Override with MODELS=a,b,c (e.g. to test :free variants).
const MODELS = process.env.MODELS?.split(',') ?? [
  'google/gemini-2.5-flash', // current: tailor + cover letter
  'openai/gpt-4o-mini', // current: extract-job
  'google/gemini-2.5-flash-lite',
  'openai/gpt-4.1-nano',
  'openai/gpt-5-nano',
  'openai/gpt-oss-20b',
  'openai/gpt-oss-120b',
  // Chinese labs
  'qwen/qwen3.7-flash',
  'qwen/qwen3.8-flash',
  'deepseek/deepseek-v4-flash',
  'deepseek/deepseek-v4.1-flash-1017',
  'z-ai/glm-5.3-flash',
  'inclusionai/ling-3.1-flash',
  'xiaomi/mimo-v2.6-flash',
  'bytedance-seed/seed-2.0-mini',
  'minimax/minimax-m3.1-flash',
  'tencent/hy3',
  'mistralai/mistral-small-3.2-24b-instruct',
  'mistralai/mistral-nemo',
  'anthropic/claude-haiku-5.5',
]

// Pull prompts from the routes so the bench stays faithful to production.
const tailorSrc = readFileSync('app/api/tailor-resume/route.ts', 'utf8')
const coverSrc = readFileSync('app/api/generate-cover-letter/route.ts', 'utf8')
const TAILOR_SYSTEM = tailorSrc.match(/system: `([\s\S]*?)`,\r?\n/)[1].replace(/\r/g, '')
const COVER_SYSTEM = coverSrc.match(/: `(You are an elite executive[\s\S]*?)`\r?\n/)[1].replace(/\r/g, '')

const RESUME = `PRIYA SHARMA
priya.sharma@email.com | Pune, India

SUMMARY
Full-stack developer with 3 years of experience building web applications with React and Node.js.

EXPERIENCE
Software Engineer - Finlytics Pvt Ltd, Pune (Jun 2023 - Present)
- Built a customer dashboard in React and TypeScript used by 12,000 monthly active users
- Reduced API response times by 40% by adding PostgreSQL indexes and query caching with Redis
- Wrote Jest unit tests raising coverage from 35% to 78%
- Mentored 2 interns on Git workflow and code review

Junior Developer - WebCraft Studio, Mumbai (Jul 2022 - May 2023)
- Developed REST APIs in Node.js and Express for 5 client projects
- Migrated a legacy jQuery frontend to React, cutting page load time from 4.2s to 1.8s
- Set up GitHub Actions CI pipeline for automated testing

EDUCATION
B.E. Computer Engineering - Savitribai Phule Pune University, 2022 (CGPA 8.4)

SKILLS
JavaScript, TypeScript, React, Node.js, Express, PostgreSQL, Redis, Jest, Git, GitHub Actions, Docker`

const JOB_TITLE = 'Frontend Engineer'
const COMPANY = 'Zentrix Labs'
const JD = `Zentrix Labs is hiring a Frontend Engineer to build our analytics platform.
Requirements:
- 3+ years of experience with React and TypeScript
- Experience with GraphQL and Apollo Client
- Familiarity with Kubernetes and AWS deployments
- Strong testing practices (Jest, Cypress)
- Experience with Next.js and server-side rendering
- Performance optimization of web applications
Nice to have: Figma, design systems, Storybook.`

// Skills in the JD that are NOT in the CV — any appearance is a fabrication.
const FABRICATION_TRAPS = ['GraphQL', 'Apollo', 'Kubernetes', 'AWS', 'Cypress', 'Next.js', 'Storybook', 'Figma']

const JOB_HTML = `<html><head><title>Careers | Orbital Freight</title><script>var x=1</script></head><body>
<nav>Home Jobs About</nav><div class="job"><h1>Senior Backend Developer</h1>
<p class="meta">Orbital Freight · Bengaluru, Karnataka (Hybrid) · ₹28,00,000 – ₹38,00,000 per year</p>
<section><h2>About the role</h2><p>Join our platform team to design and scale the shipment-tracking APIs that power 2M deliveries a month.</p>
<h2>What you bring</h2><ul><li>5+ years building backend services</li><li>Strong Go or Java</li><li>PostgreSQL and Kafka</li>
<li>Experience with Docker and Kubernetes</li><li>System design for high-throughput services</li></ul></section>
<button>Apply now</button></div><footer>© 2026 Orbital Freight</footer></body></html>`

const EXTRACT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['company', 'position', 'location', 'salary', 'description', 'requirements'],
  properties: {
    company: { type: ['string', 'null'] },
    position: { type: ['string', 'null'] },
    location: { type: ['string', 'null'] },
    salary: { type: ['string', 'null'] },
    description: { type: ['string', 'null'] },
    requirements: { type: ['array', 'null'], items: { type: 'string' } },
  },
}

const TASKS = {
  tailor: {
    messages: [
      { role: 'system', content: TAILOR_SYSTEM },
      {
        role: 'user',
        content: `ROLE: ${JOB_TITLE}\nCOMPANY: ${COMPANY}\n\nJOB DESCRIPTION:\n${JD}\n\nORIGINAL CV:\n${RESUME}\n\nTailor this CV for the ${JOB_TITLE} at ${COMPANY}.`,
      },
    ],
    check(text) {
      const issues = []
      for (const t of FABRICATION_TRAPS) if (new RegExp(`\\b${t.replace('.', '\\.')}`, 'i').test(text)) issues.push(`fabricated:${t}`)
      if (/\*/.test(text)) issues.push('asterisks')
      if (!/^PRIYA/i.test(text.trim())) issues.push('preamble')
      for (const m of ['12,000', '40%', '78%', '4.2s']) if (!text.includes(m)) issues.push(`lost-metric:${m}`)
      return issues
    },
  },
  cover: {
    messages: [
      { role: 'system', content: COVER_SYSTEM },
      {
        role: 'user',
        content: `APPLICANT NAME: Priya Sharma\nROLE: ${JOB_TITLE}\nEMPLOYER COMPANY: ${COMPANY}\n\nJOB POSTING:\n${JD}\n\nCV (use ONLY companies, tools, and facts from here — do not invent anything):\n${RESUME}`,
      },
    ],
    check(text) {
      const issues = []
      for (const t of FABRICATION_TRAPS) if (new RegExp(`\\b${t.replace('.', '\\.')}`, 'i').test(text)) issues.push(`mentions:${t}`)
      if (/[*#_]/.test(text)) issues.push('markdown')
      if (!text.trim().startsWith('Dear Hiring Manager,')) issues.push('bad-opening')
      if (!/Sincerely,\s*\n\s*Priya Sharma\s*$/.test(text.trim())) issues.push('bad-closing')
      const words = text.trim().split(/\s+/).length
      if (words < 280 || words > 420) issues.push(`words:${words}`)
      return issues
    },
  },
  extract: {
    messages: [
      {
        role: 'user',
        content: `Extract job details from this HTML content. Return the company name, job position/title, location, salary range (if mentioned), a brief description, and up to 10 key requirements (short skill or qualification names such as "React" or "3+ years experience", not sentences). Return null for any field that cannot be found.\n\nHTML:\n${JOB_HTML}`,
      },
    ],
    extra: {
      response_format: { type: 'json_schema', json_schema: { name: 'job', strict: true, schema: EXTRACT_SCHEMA } },
      provider: { require_parameters: true },
    },
    check(text) {
      let j
      try {
        j = JSON.parse(text.replace(/^```(json)?|```$/g, '').trim())
      } catch {
        return ['invalid-json']
      }
      const issues = []
      if (!/orbital freight/i.test(j.company ?? '')) issues.push('company')
      if (!/senior backend/i.test(j.position ?? '')) issues.push('position')
      if (!/bengaluru/i.test(j.location ?? '')) issues.push('location')
      if (!/28/.test(j.salary ?? '') || !/38/.test(j.salary ?? '')) issues.push('salary')
      if (!Array.isArray(j.requirements) || j.requirements.length < 4) issues.push('requirements')
      else if (j.requirements.some((r) => r.split(/\s+/).length > 8)) issues.push('long-requirements')
      return issues
    },
  },
}

async function run(model, taskName) {
  let task = TASKS[taskName]
  // Free endpoints don't support strict json_schema: ask for JSON in the prompt instead.
  if (model.endsWith(':free') && task.extra) {
    const keys = EXTRACT_SCHEMA.required.join(', ')
    task = {
      ...task,
      extra: { response_format: { type: 'json_object' } },
      messages: [{ role: 'user', content: `${task.messages[0].content}\n\nRespond with ONLY a JSON object with keys: ${keys}.` }],
    }
  }
  const started = Date.now()
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: task.messages,
        max_tokens: 3000,
        usage: { include: true },
        reasoning: { effort: 'low' },
        // Resumes are PII: only route to providers that don't train on prompts.
        // ALLOW_LOGGING=1 lifts this for free models (the bench CV is fictional).
        provider: { data_collection: process.env.ALLOW_LOGGING ? 'allow' : 'deny', ...task.extra?.provider },
        response_format: task.extra?.response_format,
      }),
      signal: AbortSignal.timeout(180_000),
    })
    const body = await res.json()
    if (!res.ok || body.error) throw new Error(body.error?.message ?? `HTTP ${res.status}`)
    const text = body.choices?.[0]?.message?.content ?? ''
    const dir = join(OUT, model.replace(/[/:]/g, '__'))
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, `${taskName}.txt`), text)
    return {
      ms: Date.now() - started,
      cost: body.usage?.cost ?? 0,
      outTokens: body.usage?.completion_tokens ?? 0,
      issues: text ? task.check(text) : ['empty'],
    }
  } catch (err) {
    return { ms: Date.now() - started, cost: 0, outTokens: 0, issues: [`ERROR: ${err.message}`] }
  }
}

// Three models at a time keeps us under free-tier rate limits.
const results = []
for (let i = 0; i < MODELS.length; i += 3) {
  const batch = await Promise.all(
    MODELS.slice(i, i + 3).map(async (model) => {
      const r = {}
      for (const t of Object.keys(TASKS)) r[t] = await run(model, t)
      return { model, ...r }
    })
  )
  results.push(...batch)
}

mkdirSync(OUT, { recursive: true })
writeFileSync(join(OUT, 'results.json'), JSON.stringify(results, null, 2))

const fmt = (r) => `${r.issues.length ? '✗' : '✓'} ${(r.ms / 1000).toFixed(1)}s $${r.cost.toFixed(5)}`
console.log('model'.padEnd(42), 'tailor'.padEnd(22), 'cover'.padEnd(22), 'extract'.padEnd(22), 'total $')
for (const r of results) {
  const total = r.tailor.cost + r.cover.cost + r.extract.cost
  console.log(r.model.padEnd(42), fmt(r.tailor).padEnd(22), fmt(r.cover).padEnd(22), fmt(r.extract).padEnd(22), total.toFixed(5))
}
console.log('\nIssues:')
for (const r of results)
  for (const t of Object.keys(TASKS)) if (r[t].issues.length) console.log(`  ${r.model} [${t}]: ${r[t].issues.join(', ')}`)
