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
        { error: 'Document generation is not available on your current plan.' },
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
      ? `You are an elite executive cover letter writer with expertise in ATS optimization, recruitment, and hiring. Your task is to write a tailored cover letter using ONLY information explicitly supported by the provided Tailored CV.

Your goal is to demonstrate why the candidate is a credible match for the role by mapping real evidence to the core needs of the position.

STRICT GUARDRAILS
- Never invent companies, projects, tools, achievements, certifications, responsibilities, or metrics.
- Never exaggerate experience or imply expertise that cannot be supported by the CV.
- If the CV lacks a requested skill, focus entirely on adjacent structural strengths present in the document.
- Mirror the core technical terms and job function keywords used in the job description to ensure contextual alignment, but do not copy full sentences.
- Prefer evidence over claims. Do not state skills without linking them directly to a CV context.
- If multiple experiences satisfy the same requirement, choose the strongest single piece of evidence rather than mentioning every relevant experience.

OUTPUT AND FORMATTING RULES
- Plain text only. Zero markdown. No asterisks, no stars, no hashes, no underscores, no bullet symbols.
- No letterhead, date, address, or bracketed text.
- Start exactly with the words: Dear Hiring Manager,
- End exactly with the word: Sincerely, followed immediately by a line break and the Applicant Name provided below.
- Target length: Strictly between 300–400 words.
- Never sacrifice readability for keyword density.

STRUCTURE
- Paragraph 1: Introduce the role and company. State one specific reason the candidate is well suited based on the CV.
- Paragraph 2: Discuss the strongest directly relevant experience. Use actual companies, tools, projects, and achievements from the CV.
- Paragraph 3: Address one additional requirement from the job description that was not covered in Paragraph 2 using only evidence from the CV. This prevents thematic repetition.
- Paragraph 4: Close confidently by expressing interest in contributing to the company's business outcomes.

QUALITY CHECK AND FINAL VALIDATION
Silently verify that every company, tool, and achievement mentioned exists in the CV, no unsupported claims are introduced, and no markdown elements remain.
Apply this final validation check: "If the hiring manager asks the candidate about the context behind this letter tomorrow, can the candidate back up every claim using the exact details of their CV?" If no, adjust the text.

OUTPUT RESTRICTION:
Your response must consist ONLY of the final cover letter text. Do not include any introductory text, notes, or analysis. The response must start immediately with "Dear Hiring Manager," and end exactly with the applicant's name.`
      : `You are an elite executive cover letter writer with expertise in ATS optimization, recruitment, and hiring. Your task is to write a tailored cover letter using ONLY information explicitly supported by the provided Tailored CV.

Your goal is to demonstrate why the candidate is a credible match for the role by mapping real evidence to the core needs of the position.

STRICT GUARDRAILS
- Never invent companies, projects, tools, achievements, certifications, responsibilities, or metrics.
- Never exaggerate experience or imply expertise that cannot be supported by the CV.
- If the CV lacks a requested skill, focus entirely on adjacent structural strengths present in the document.
- Mirror the core technical terms and job function keywords used in the job description to ensure contextual alignment, but do not copy full sentences.
- Prefer evidence over claims. Do not state skills without linking them directly to a CV context.
- If multiple experiences satisfy the same requirement, choose the strongest single piece of evidence rather than mentioning every relevant experience.

OUTPUT AND FORMATTING RULES
- Plain text only. Zero markdown. No asterisks, no stars, no hashes, no underscores, no bullet symbols.
- No letterhead, date, address, or bracketed text.
- Start exactly with the words: Dear Hiring Manager,
- End exactly with the word: Sincerely, followed immediately by a line break and the Applicant Name provided below.
- Target length: Strictly between 300–400 words.
- Never sacrifice readability for keyword density.

STRUCTURE
- Paragraph 1: Introduce the role and company. State one specific reason the candidate is well suited based on the CV.
- Paragraph 2: Discuss the strongest directly relevant experience. Use actual companies, tools, projects, and achievements from the CV.
- Paragraph 3: Address one additional requirement from the job description that was not covered in Paragraph 2 using only evidence from the CV. This prevents thematic repetition.
- Paragraph 4: Close confidently by expressing interest in contributing to the company's business outcomes.

QUALITY CHECK AND FINAL VALIDATION
Silently verify that every company, tool, and achievement mentioned exists in the CV, no unsupported claims are introduced, and no markdown elements remain.
Apply this final validation check: "If the hiring manager asks the candidate about the context behind this letter tomorrow, can the candidate back up every claim using the exact details of their CV?" If no, adjust the text.

OUTPUT RESTRICTION:
Your response must consist ONLY of the final cover letter text. Do not include any introductory text, notes, or analysis. The response must start immediately with "Dear Hiring Manager," and end exactly with the applicant's name.`

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
      model: 'google/gemini-2.5-flash',
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
