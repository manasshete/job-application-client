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

    const { text } = await generateText({
      model: 'openai/gpt-5-mini',
      messages: [
        {
          role: 'system',
          content: isRefine
            ? `You are an experienced hiring manager refining a cover letter draft.

CRITICAL RULES:
- Use only information found in the CV.
- Never fabricate experience, achievements, projects, industries, software, responsibilities, or results.
- Keep every metric (%, $, number, timeframe) EXACTLY as written in the CV. Never invent or change numbers.

YOUR TASK:
- Remove generic phrases ("diverse skills," "comprehensive understanding," "hard worker," "passionate," "excited").
- Replace vague statements with specific CV facts: company names, job titles, metrics, achievements.
- Ensure 2-3 strong achievements with numbers are highlighted.
- Connect each achievement to the job requirements.
- Make every sentence specific and interview-defensible.

FORMAT:
- No letterhead, date, address block, or [bracketed placeholders].
- Start: "Dear Hiring Manager,"
- End: "Sincerely," then the applicant's real name.

OUTPUT: Return ONLY the refined cover letter. No commentary.`
            : `You are an experienced hiring manager writing a professional cover letter on behalf of the candidate.

CRITICAL RULES:
- Use only information found in the CV.
- Never fabricate experience, achievements, projects, industries, software, responsibilities, or results.
- Do not claim qualifications the candidate does not possess.
- If direct experience is missing, use transferable skills instead.
- Keep every metric (%, $, number, timeframe) EXACTLY as written in the CV. Never invent or change numbers.

TASK:
Write a tailored cover letter that:
1. Explains why the candidate is interested in the position.
2. Connects the candidate's experience to the employer's requirements.
3. Highlights the most relevant skills and achievements from the CV.
4. Demonstrates understanding of the company's role and needs.
5. Maintains a professional, confident, and natural tone.
6. Avoids generic AI phrases and clichés.
7. Remains concise (300-450 words).
8. Sounds like a real person wrote it.

STRUCTURE:

Paragraph 1:
- Express interest in the role.
- Explain why the company or opportunity is appealing.

Paragraph 2:
- Highlight the candidate's most relevant experience.
- Connect it directly to the role requirements.

Paragraph 3:
- Explain how the candidate's skills can contribute to the team.
- Address transferable skills where necessary.

Paragraph 4:
- Closing statement and expression of interest in discussing the role further.

FORMAT:
- No letterhead, date, address block, or [bracketed placeholders].
- Start: "Dear Hiring Manager,"
- End: "Sincerely," then the applicant's real name.

IMPORTANT:
Before writing, identify the 5 most important requirements in the job description and ensure the letter addresses them using evidence from the CV. If a requirement is not supported by the CV, do not fabricate evidence.

OUTPUT: Return ONLY the complete cover letter.`,
        },
        {
          role: 'user',
          content: isRefine
            ? `JOB CONTEXT:
Position: ${jobTitle?.slice(0, 200) ?? '[Not provided]'}
Company: ${company?.slice(0, 200) ?? '[Not provided]'}
Applicant: ${safeApplicantName || 'the candidate'}

JOB POSTING:
${jobDescription.slice(0, 3000)}

---

DRAFT TO REFINE:
${userInput.slice(0, 10000)}

---

Refine this draft by removing vague language and replacing it with specific achievements, metrics, and CV facts. Every sentence must be specific and verifiable.`
            : `JOB CONTEXT:
Position: ${jobTitle?.slice(0, 200) ?? '[Not provided]'}
Company: ${company?.slice(0, 200) ?? '[Not provided]'}
Applicant: ${safeApplicantName || 'the candidate'}

JOB POSTING:
${jobDescription.slice(0, 3000)}

---

CV DATA:
${userInput.slice(0, 15000)}

---

Identify the 5 most important requirements in the job posting. Write a cover letter that addresses each one using specific evidence from the CV. Lead with the most relevant achievement.`,
        },
      ],
    })

    // Increment document count via SECURITY DEFINER RPC (direct column writes
    // are revoked for the user-scoped client to prevent tampering).
    await consumeToken('document_generation')

    return Response.json({ coverLetter: text })
  } catch (err) {
    console.error('[v0] cover-letter error:', err)
    return Response.json({ error: 'Failed to generate cover letter. Please try again.' }, { status: 500 })
  }
}
