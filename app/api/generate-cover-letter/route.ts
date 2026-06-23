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
            ? `You are an elite cover letter editor. Your ONLY job is to refine the user's draft using VERIFIED CV DATA.

CORE RULE: Extract ONLY from the CV provided. Never fabricate, assume, or invent anything.

YOUR TASK:
- Replace vague language ("diverse skills," "comprehensive understanding," "hard worker") with specific CV facts
- Extract concrete achievements from the CV: company names, job titles, metrics (%, $, timelines), certifications, degrees
- Match 2-3 CV achievements to the job requirements
- Make each sentence traceable to the CV—every claim must be verifiable

WHAT TO ELIMINATE:
- Generic phrases like "excited," "passionate," "brings expertise," "versatile"
- Vague descriptions; replace with specifics from the CV
- Any information not explicitly in the CV

OUTPUT: Return ONLY the refined cover letter. No commentary.`
            : `You are an elite cover letter writer. Your ONLY job is to write a specific, compelling cover letter using ONLY CV data provided.

CORE RULE: Extract ONLY from the CV. Never invent qualifications, metrics, companies, certifications, or achievements.

YOUR TASK:
1. Carefully read the CV provided
2. Extract specific facts: company names, job titles, dates, metrics (revenue, %, growth, team size), certifications, degrees, awards, projects
3. Identify 2-3 achievements from the CV that match this job's requirements
4. Structure: Strong hook (company + specific CV achievement) → Achievement #1 with metrics and job relevance → Achievement #2 with job connection → Achievement #3 if strong → Close
5. Every sentence MUST reference a specific CV fact; no generalities

WHAT TO AVOID:
- Generic phrases: "diverse skill set," "comprehensive understanding," "hard worker," "versatile," "passionate," "excited"
- Any information not in the CV
- Vague language; use specific numbers and outcomes

OUTPUT: Return ONLY the complete cover letter. No commentary.`,
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

MY CURRENT DRAFT TO REFINE:
${userInput.slice(0, 10000)}

---

REFINEMENT TASK:
1. Scan the draft for vague phrases ("diverse skills," "comprehensive understanding," "hard worker," "versatile," etc.)
2. For each vague phrase, find a SPECIFIC fact from my draft that supports it (company name, metric, certification, achievement)
3. Replace the vague phrase with the specific CV fact
4. Ensure 2-3 core achievements with numbers/metrics are featured prominently
5. Connect each achievement to a job requirement

Return the refined cover letter only. Every sentence must be specific and traceable to facts in my draft.`
            : `JOB CONTEXT:
Position: ${jobTitle?.slice(0, 200) ?? '[Not provided]'}
Company: ${company?.slice(0, 200) ?? '[Not provided]'}
Applicant: ${safeApplicantName || 'the candidate'}

JOB POSTING:
${jobDescription.slice(0, 3000)}

---

MY CV DATA (use ONLY this—nothing else):
${userInput.slice(0, 15000)}

---

COVER LETTER TASK:
1. Extract from my CV: company names, job titles, dates, specific achievements, metrics (%, $, numbers), certifications, degrees, projects
2. Identify 2-3 achievements that match the job posting requirements
3. Write the cover letter with this structure:
   - Opening: Company name + specific achievement that shows relevance to this role
   - Paragraph 2: Achievement #1 with specific metrics and how it applies to the job
   - Paragraph 3: Achievement #2 with specific metrics and job relevance
   - Paragraph 4: Achievement #3 if strong, OR explain how your background solves a problem in the job posting
   - Closing: Specific next step
4. Every sentence must reference a specific CV fact (company, metric, certification, project, degree)
5. NO generic phrases. NO assumptions. ONLY CV data.

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
