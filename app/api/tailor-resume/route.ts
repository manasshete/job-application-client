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

    // Rate limit per user
    const rl = rateLimit(`tailor-resume:${user.id}`, 5, 60000)
    if (!rl.success) {
      return Response.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 })
    }

    const { resumeText, jobTitle, jobDescription, company } = await req.json()

    if (!resumeText || !jobDescription) {
      return Response.json({ error: 'Resume and job description are required.' }, { status: 400 })
    }

    if (typeof resumeText !== 'string' || resumeText.length > 15000) {
      return Response.json({ error: 'Resume text is too long. Maximum 15,000 characters.' }, { status: 400 })
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

    const { text } = await generateText({
      model: 'openai/gpt-5-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert recruiter, ATS specialist, and hiring manager.

CRITICAL RULES:
- Never fabricate, exaggerate, or invent experience, achievements, responsibilities, certifications, tools, industries, projects, or metrics.
- Only use information explicitly present in the original CV.
- Do not add skills the candidate has not listed.
- Do not claim experience in industries or functions not supported by the CV.
- Keep every metric (%, $, number, timeframe) EXACTLY as written. Never invent or change numbers.
- If a requirement is missing, do not invent it.

OBJECTIVES:

1. Analyze the job description and identify:
   - Core responsibilities
   - Required skills
   - Preferred skills
   - ATS keywords

2. Rewrite the CV to maximize relevance for the role by:
   - Reordering content based on relevance (most relevant first).
   - Rewriting existing bullet points using terminology from the job description where accurate.
   - Highlighting transferable skills.
   - Improving ATS keyword coverage.
   - Emphasizing accomplishments most relevant to the role.

3. Improve:
   - Professional Summary
   - Skills Section
   - Experience Bullet Points

4. Keep all claims interview-defensible.

OUTPUT FORMAT:

SECTION 1: Job Match Analysis
- Strong Matches
- Partial Matches
- Missing Requirements

SECTION 2: Tailored Professional Summary

SECTION 3: Tailored Skills Section

SECTION 4: Tailored Experience Section

SECTION 5: ATS Keywords Included

The final CV should be optimized for ATS and recruiter review while remaining 100% truthful to the original CV.`,
        },
        {
          role: 'user',
          content: `JOB CONTEXT:
Position: ${String(jobTitle ?? '').slice(0, 200)}
Company: ${String(company ?? '').slice(0, 200)}

JOB DESCRIPTION:
${jobDescription.slice(0, 5000)}

---

ORIGINAL RESUME:
${resumeText}

---

Analyze the job description to identify core responsibilities, required skills, and ATS keywords. Then reorder and rewrite the resume to maximize relevance while keeping all facts from the original resume. Reorder achievements with most relevant first. Include a Job Match Analysis section at the top, then the tailored resume.`,
        },
      ],
    })

    // Increment document count via SECURITY DEFINER RPC (direct column writes
    // are revoked for the user-scoped client to prevent tampering).
    await consumeToken('document_generation')

    return Response.json({ tailoredResume: text })
  } catch (err) {
    console.error('[v0] tailor-resume error:', err)
    return Response.json({ error: 'Failed to tailor resume. Please try again.' }, { status: 500 })
  }
}
