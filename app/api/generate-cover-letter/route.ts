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

    const applicantFullName = safeApplicantName || null

    const systemPrompt = isRefine
      ? `You are a professional cover letter editor. You must SUBSTANTIALLY REWRITE the draft — not return it unchanged.

CRITICAL OUTPUT RULES:
- Plain text only. Zero markdown. No asterisks (*), no hashes (#), no underscores, no bullet symbols.
- No letterhead, date, address, or ANY bracketed placeholders like [Name] or [Company].
- Start exactly with: Dear Hiring Manager,
- End exactly with: Sincerely, then on the next line the applicant's real name: ${applicantFullName ?? 'use the name from the CV'}.
- 300–420 words.

FABRICATION IS FORBIDDEN:
- Use ONLY companies, job titles, tools, platforms, and metrics that appear in the CV provided.
- If the draft invented a company name like "XYZ Marketing Firm" — replace it with the real company from the CV.
- Never invent or guess company names, metrics, or achievements not in the CV.

MANDATORY REWRITES — do ALL of these:
1. Replace every vague phrase with a specific CV fact. Banned phrases: "a leading firm", "various clients", "significant experience", "strong results", "I am eager", "I am passionate", "hard worker", "diverse skill set", "team player", "comprehensive understanding", "I am excited", "highly motivated".
2. Every body paragraph must contain at least one real company name, tool, platform, or metric from the CV.
3. The closing paragraph must name the employer's company (given below) specifically.
4. Remove any sentence that could apply to any candidate in any industry.`
      : `You are a professional cover letter writer.

CRITICAL OUTPUT RULES:
- Plain text only. Zero markdown. No asterisks (*), no hashes (#), no underscores, no bullet symbols.
- No letterhead, date, address, or ANY bracketed placeholders like [Name] or [Company].
- Start exactly with: Dear Hiring Manager,
- End exactly with: Sincerely, then on the next line the applicant's real name: ${applicantFullName ?? 'use the full name from the CV'}.
- 300–420 words.

FABRICATION IS FORBIDDEN:
- Use ONLY companies, job titles, tools, platforms, and metrics that appear in the CV.
- Never invent company names, metrics, or achievements not explicitly in the CV.
- Keep every number exactly as written in the CV.

BEFORE WRITING — identify silently:
- The 3 most important requirements in the job posting.
- The 2 strongest matching experiences in the CV with a real company name and metric.

STRUCTURE — 4 paragraphs:

Paragraph 1 (2–3 sentences): Name the role and the employer's company. Give one specific reason this candidate fits — tied to something in the job posting, not generic.

Paragraph 2 (3–4 sentences): The candidate's strongest relevant experience. Name the actual company and role title from the CV. Describe what they did and the outcome using the best metric from the CV. Connect it to what this employer needs.

Paragraph 3 (3–4 sentences): A second relevant skill or experience. Name the real tools, platforms, or responsibilities. Show how it adds to fit for this specific role.

Paragraph 4 (2–3 sentences): Confident close. Name the employer's company. Express clear, specific interest in the role.

BANNED PHRASES — never write: "passionate about", "hard worker", "diverse skill set", "I am excited to", "eager to bring", "I believe I would be", "highly motivated", "team player", "comprehensive understanding", "a leading firm", "various clients", "I am eager".`

    const userMessage = isRefine
      ? `APPLICANT NAME: ${applicantFullName ?? 'use the name from the CV'}
ROLE: ${jobTitle?.slice(0, 200) ?? 'the position'}
EMPLOYER COMPANY: ${company?.slice(0, 200) ?? 'the company'}

JOB POSTING:
${jobDescription.slice(0, 3000)}

CV (use ONLY companies, tools, and facts from here — do not invent):
${userInput.slice(0, 10000)}

Rewrite the above draft substantially. Replace all vague phrases with specific CV facts. Do not return the draft unchanged.`
      : `APPLICANT NAME: ${applicantFullName ?? 'use the full name from the CV'}
ROLE: ${jobTitle?.slice(0, 200) ?? 'the position'}
EMPLOYER COMPANY: ${company?.slice(0, 200) ?? 'the company'}

JOB POSTING:
${jobDescription.slice(0, 3000)}

CV (use ONLY companies, tools, and facts from here — do not invent anything):
${userInput.slice(0, 15000)}`

    const { text } = await generateText({
      model: 'anthropic/claude-sonnet-4-5',
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
