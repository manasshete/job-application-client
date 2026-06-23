import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { SUBSCRIPTION_LIMITS, type SubscriptionTier } from '@/lib/subscription'

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
      .select('subscription_tier, documents_generated_this_month')
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

    if (profile.documents_generated_this_month >= limits.documentGenerationLimit) {
      return Response.json(
        { error: `Monthly document generation limit (${limits.documentGenerationLimit}) reached. Resets next month.` },
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
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: isRefine
            ? `You are an elite executive cover letter editor who transforms good letters into ATS-optimized, impact-driven masterpieces.

YOUR MISSION:
- Refine the user's draft to maximize hiring impact while keeping their authentic voice
- Replace vague language with specific achievements and quantifiable results
- Weave in job description keywords naturally where they match genuine experience
- Structure each paragraph around a distinct value proposition
- Ensure every sentence earns its place by demonstrating capability or fit

STRICT GUARDRAILS:
- Never fabricate experiences, skills, metrics, or achievements
- Never add qualifications not explicitly mentioned
- Preserve the user's real accomplishments; make them SHINE

OUTPUT: Return ONLY the final cover letter, no commentary or explanations.`
            : `You are an elite executive cover letter writer who transforms raw bullet points into compelling, impact-driven narratives that get candidates hired.

YOUR MISSION:
- Write a cover letter that stands out by being SPECIFIC and RESULTS-ORIENTED
- Extract concrete achievements from the user's key points (metrics, projects, outcomes)
- Craft a narrative that directly addresses this company's needs and challenges
- Use job description keywords naturally where they honestly match
- Structure the letter: Hook (why this role/company) → Core value (specific achievement + relevance) → Alignment (how you solve their problem) → Close (call to action)

STRICT GUARDRAILS:
- Only use facts and achievements the user explicitly provided
- Never invent qualifications, experiences, or metrics
- Do not use generic phrases like "I am a hard worker" or "I bring diverse skills"

OUTPUT: Return ONLY the final, complete cover letter with no commentary.`,
        },
        {
          role: 'user',
          content: isRefine
            ? `CONTEXT:
Job Title: ${jobTitle?.slice(0, 200) ?? '[Not provided]'}
Company: ${company?.slice(0, 200) ?? '[Not provided]'}
Applicant: ${safeApplicantName || 'the candidate'}

JOB POSTING:
${jobDescription.slice(0, 3000)}

---

MY CURRENT DRAFT:
${userInput.slice(0, 10000)}

---

REFINEMENT INSTRUCTIONS:
1. Replace any vague language with specific examples and quantifiable results from my draft
2. Highlight 2-3 key achievements that directly address the job requirements
3. Ensure each paragraph has a clear purpose and drives toward the hiring decision
4. Use keywords from the job posting naturally where my experience genuinely aligns
5. Make it compelling, professional, and memorable—not generic

Return the refined cover letter only.`
            : `CONTEXT:
Job Title: ${jobTitle?.slice(0, 200) ?? '[Not provided]'}
Company: ${company?.slice(0, 200) ?? '[Not provided]'}
Applicant: ${safeApplicantName || 'the candidate'}

JOB POSTING:
${jobDescription.slice(0, 3000)}

---

MY QUALIFICATIONS & KEY POINTS TO FEATURE:
${userInput.slice(0, 10000)}

---

WRITING INSTRUCTIONS:
1. Open with a strong hook that shows you understand this company and role (not generic)
2. Feature 2-3 specific, quantifiable achievements that address the job's core requirements
3. Extract and highlight metrics: percentages, revenue impact, team size, timeline completions, awards, certifications
4. Mirror job description language where it authentically matches your experience
5. Each paragraph should answer: "Why am I uniquely qualified for THIS role at THIS company?"
6. Close with a specific, confident call to action
7. Avoid generic phrases; every sentence must demonstrate capability or fit

Return the complete cover letter only.`,
        },
      ],
    })

    // Increment document count via SECURITY DEFINER RPC (direct column writes
    // are revoked for the user-scoped client to prevent tampering).
    await supabase.rpc('increment_documents_generated', { p_user_id: user.id })

    return Response.json({ coverLetter: text })
  } catch (err) {
    console.error('[v0] cover-letter error:', err)
    return Response.json({ error: 'Failed to generate cover letter. Please try again.' }, { status: 500 })
  }
}
