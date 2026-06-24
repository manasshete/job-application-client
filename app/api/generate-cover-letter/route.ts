import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { SUBSCRIPTION_LIMITS, type SubscriptionTier } from '@/lib/subscription'
import { getTokenBalance, consumeToken } from '@/lib/data/tokens'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check subscription tier (Pro or Premium have document generation)
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()

    const tier = (profile?.subscription_tier ?? 'free') as SubscriptionTier
    const limits = SUBSCRIPTION_LIMITS[tier]

    if (!profile || !limits?.hasDocumentGeneration) {
      return Response.json(
        { error: 'Document generation requires a Pro (₹299/month) or Premium (₹499/month) plan.' },
        { status: 403 }
      )
    }

    const docBalance = await getTokenBalance('document_generation')
    if (docBalance <= 0) {
      return Response.json(
        { error: 'You have no document generation tokens left. Tokens are valid for 60 days from the date they are added; renew or upgrade to get more.' },
        { status: 403 }
      )
    }

    const rl = rateLimit(`cover-letter:${user.id}`, 5, 60000)
    if (!rl.success) {
      return Response.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 })
    }

    const { mode, userInput, jobTitle, jobDescription, company, applicantName } = await req.json()

    // mode: 'refine' (user wrote a draft) | 'generate' (user provided key points)
    if (!userInput || !jobDescription) {
      return Response.json({ error: 'User input and job description are required.' }, { status: 400 })
    }

    // Hard length caps to prevent oversized AI prompts and prompt injection.
    if (typeof userInput !== 'string' || userInput.length > 10000) {
      return Response.json({ error: 'User input is too long. Maximum 10,000 characters.' }, { status: 400 })
    }
    if (typeof jobDescription !== 'string' || jobDescription.length > 10000) {
      return Response.json({ error: 'Job description is too long. Maximum 10,000 characters.' }, { status: 400 })
    }
    if (jobTitle && (typeof jobTitle !== 'string' || jobTitle.length > 200)) {
      return Response.json({ error: 'Job title is too long.' }, { status: 400 })
    }
    if (company && (typeof company !== 'string' || company.length > 200)) {
      return Response.json({ error: 'Company name is too long.' }, { status: 400 })
    }
    // Strip any HTML/control characters from applicantName to prevent prompt injection.
    const safeApplicantName = applicantName
      ? String(applicantName).replace(/<[^>]*>/g, '').slice(0, 100)
      : undefined

    const isRefine = mode === 'refine'

    const systemPrompt = isRefine
      ? `You are a professional cover letter writer refining a draft.

RULES — follow these without exception:
- Only use facts present in the CV. Never add, invent, or imply anything not there.
- Keep every number (%, £, $, metric, timeframe) EXACTLY as written in the CV.
- Do not output any commentary, headers, or meta-text — only the finished letter.
- No letterhead, date, or address block. No [bracketed placeholders] of any kind.
- Start with: Dear Hiring Manager,
- End with: Sincerely, then the applicant's full name on the next line.

WHAT TO FIX IN THE DRAFT:
- Cut any sentence that could apply to literally any candidate ("I am a hard worker", "I am passionate about marketing", "I have a diverse skill set") — replace with a specific fact from the CV.
- Every paragraph must contain at least one concrete detail: a company name, a role title, a metric, a tool, a result.
- The letter should sound like a confident real person wrote it — not a template.
- 300–420 words maximum.`
      : `You are a professional cover letter writer. Write a cover letter for the applicant below.

RULES — follow these without exception:
- Only use facts present in the CV. Never add, invent, or imply anything not in the CV.
- Keep every number (%, £, $, metric, timeframe) EXACTLY as written in the CV.
- Do not output any commentary, headers, labels, or meta-text — only the finished letter.
- No letterhead, date, or address block. No [bracketed placeholders] of any kind.
- Start with: Dear Hiring Manager,
- End with: Sincerely, then the applicant's full name on the next line.
- 300–420 words maximum.

HOW TO WRITE IT:
Before writing, silently identify the 3 most important things the employer needs from this role. Then write 4 paragraphs:

Paragraph 1 — Opening (2–3 sentences): State the role and company. Give ONE specific reason why this candidate wants this job — rooted in something real about the company or role, not a generic statement.

Paragraph 2 — Strongest proof (3–4 sentences): Lead with the candidate's single most relevant experience. Name the company, describe what they actually did, and include the most impressive metric or outcome from the CV. Connect it directly to what this employer needs.

Paragraph 3 — Second proof + breadth (3–4 sentences): Bring in a second relevant experience or skill area. Be specific — name tools, platforms, or responsibilities. Show how this rounds out the candidate's fit.

Paragraph 4 — Close (2–3 sentences): Confident, direct close. Reference the company by name. End with a clear expression of interest in next steps.

TONE: Confident, specific, natural. Reads like a real person — not a template. No clichés.
FORBIDDEN PHRASES: "passionate about", "hard worker", "diverse skill set", "I am excited to", "comprehensive understanding", "team player", "I believe I would be", "I am a highly motivated".`

    const userMessage = isRefine
      ? `JOB POSTING:
${jobDescription.slice(0, 3000)}

APPLICANT: ${safeApplicantName || 'the candidate'}
ROLE: ${jobTitle?.slice(0, 200) ?? 'the position'}
COMPANY: ${company?.slice(0, 200) ?? 'the company'}

DRAFT TO REFINE:
${userInput.slice(0, 10000)}`
      : `JOB POSTING:
${jobDescription.slice(0, 3000)}

APPLICANT: ${safeApplicantName || 'the candidate'}
ROLE: ${jobTitle?.slice(0, 200) ?? 'the position'}
COMPANY: ${company?.slice(0, 200) ?? 'the company'}

CV:
${userInput.slice(0, 15000)}`

    const { text } = await generateText({
      // Claude is used for cover letters because it produces natural, persuasive prose.
      // gpt-5-mini (a reasoning/analysis model) produces structured but flat text—
      // good for resume analysis, poor for human-sounding persuasive writing.
      model: 'anthropic/claude-opus-4.6',
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
      system: systemPrompt,
    })

    // Increment document count via SECURITY DEFINER RPC (direct column writes
    // are revoked for the user-scoped client to prevent tampering).
    await consumeToken('document_generation')

    return Response.json({ coverLetter: text })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    const cause = err instanceof Error && (err as Error & { cause?: unknown }).cause
    console.error('[v0] cover-letter error message:', message)
    console.error('[v0] cover-letter error cause:', cause)
    console.error('[v0] cover-letter error full:', err)
    return Response.json({ error: `Failed to generate cover letter: ${message}` }, { status: 500 })
  }
}
