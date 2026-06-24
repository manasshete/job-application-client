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
      ? `You are a professional cover letter editor. You must SUBSTANTIALLY REWRITE the draft — do not return it unchanged or only lightly edited.

OUTPUT FORMAT:
- Plain text only. No markdown. No asterisks, hyphens, bullet points, or bold formatting of any kind.
- No letterhead, date, address block, or [bracketed placeholders].
- Start with: Dear Hiring Manager,
- End with: Sincerely, followed by the applicant's full name on the next line.
- 300–420 words.

MANDATORY CHANGES — you must do ALL of these:
1. Replace every vague phrase with a specific fact from the CV: company name, job title, tool, platform, or metric. Examples of vague phrases that must be replaced: "a leading firm", "significant experience", "various clients", "strong results", "I am eager", "I am passionate", "hard worker", "diverse skill set", "team player", "comprehensive understanding".
2. If the draft says "a leading firm" or any unnamed company, replace it with the actual company name from the CV.
3. Every body paragraph must contain at least one of: a real company name, a job title, a platform/tool name, or a number/metric from the CV.
4. The closing paragraph must name the employer's company specifically — not a generic sign-off.
5. Remove any sentence that could apply to any candidate in any industry.

DO NOT return the draft as-is. The output must be visibly and substantially different from the input draft.`
      : `You are a professional cover letter writer.

OUTPUT FORMAT:
- Plain text only. No markdown. No asterisks, hyphens, bullet points, or bold formatting of any kind.
- No letterhead, date, address block, or [bracketed placeholders].
- Start with: Dear Hiring Manager,
- End with: Sincerely, followed by the applicant's full name on the next line.
- 300–420 words.
- Use only facts from the CV. Never invent companies, tools, metrics, or experience.
- Keep every number exactly as written in the CV.

BEFORE WRITING — silently identify:
- The 3 most important requirements in the job posting.
- The 2 strongest matching experiences in the CV with a specific company name and metric/outcome.

STRUCTURE — 4 paragraphs:

Paragraph 1 (2–3 sentences): Name the role and the employer's company. Give one specific reason this candidate fits this role — tied to something real in the job posting, not a generic opener.

Paragraph 2 (3–4 sentences): The candidate's strongest relevant experience. Name the actual company and role title. Describe the specific work done and the outcome — use the best metric from the CV. Connect it directly to what this employer needs.

Paragraph 3 (3–4 sentences): A second relevant skill or experience area. Name the tools, platforms, or responsibilities. Show how it adds to fit for this specific role.

Paragraph 4 (2–3 sentences): Confident close. Name the employer's company. Express clear interest in the role — specific, not generic.

FORBIDDEN PHRASES — never write: "passionate about", "hard worker", "diverse skill set", "I am excited to", "eager to bring", "I believe I would be", "highly motivated", "team player", "comprehensive understanding", "a leading firm", "various clients".`

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
      model: 'openai/gpt-4o',
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
    console.error('[cover-letter]', message)
    return Response.json({ error: 'Failed to generate cover letter. Please try again.' }, { status: 500 })
  }
}
