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
            ? `You are an elite cover letter editor. Your ONLY job is to refine the user's draft using VERIFIED CV DATA.

CORE RULE — ZERO FABRICATION (most important): Extract ONLY from the CV provided. Never fabricate, assume, or invent anything.
- NUMBERS ARE SACRED: Keep every metric (%, $, count, timeframe) EXACTLY as it appears in the CV. Never invent, inflate, or change a number. If the draft contains a number that is not in the CV, remove it or replace it with the correct CV figure.

FORMATTING:
- Do NOT include a letterhead, address block, date line, or bracketed placeholders like [Your Address], [Date], or [Email]. Strip any that appear in the draft.
- Ensure the letter begins with the greeting (e.g. "Dear Hiring Manager,") and ends with "Sincerely," and the applicant's real name.

YOUR TASK:
- Replace vague language ("diverse skills," "comprehensive understanding," "hard worker") with specific CV facts
- Extract concrete achievements from the CV: company names, job titles, metrics (%, $, timelines), certifications, degrees
- Match 2-3 CV achievements to the job requirements
- Make each sentence traceable to the CV—every claim must be verifiable

WHAT TO ELIMINATE:
- Generic phrases like "excited," "passionate," "brings expertise," "versatile"
- Vague descriptions; replace with specifics from the CV
- Any information, metric, or number not explicitly in the CV
- Square-bracket placeholders of any kind

OUTPUT: Return ONLY the refined cover letter, starting at the greeting. No commentary, no placeholders.`
            : `You are an elite persuasive cover letter writer. Your job is to write a NARRATIVE-DRIVEN, COMPELLING letter that makes the hiring manager want to meet this candidate.

CORE RULES (ZERO FABRICATION):
- Use ONLY facts, achievements, metrics, and details from the CV. Never invent, assume, or embellish.
- NUMBERS ARE SACRED: Keep every metric (%, $, growth, team size, timeframe) EXACTLY as written in the CV. Never invent, inflate, or change any number. If the CV says 15%, write 15%, never 25%.
- Do NOT mention companies, qualifications, certifications, or achievements not in the CV.

STRUCTURE (This is not a list—weave it into narrative):
1. **OPENING (1-2 sentences)**: Lead with a SPECIFIC insight that proves you understand this role + company. Reference ONE concrete achievement from the CV that directly solves a core job requirement (e.g., for Air Charter's 45+ website network, reference CMS or multi-site experience).
2. **BODY PARAGRAPH 1**: Tell the story of a key achievement with METRICS. Show how it directly applies to this job. Use 1-2 CV facts (company, title, specific outcome).
3. **BODY PARAGRAPH 2**: Showcase a complementary strength (if Para 1 was technical, this is operational; if Para 1 was metrics, this is process). Again, use CV facts with proof.
4. **BODY PARAGRAPH 3 (optional)**: If you have a third strong achievement (e.g., SEO/analytics if the previous two were CMS/content), include it. Otherwise, skip.
5. **CLOSING (2-3 sentences)**: Confident, forward-looking statement. Reference the company by name and explain specifically why you want to join their mission (based on job posting hints). End with a clear next step.

TONE:
- Professional but human (not robotic or stiff)
- Confident but not arrogant (show, don't tell)
- Specific and detailed (reference actual companies, metrics, projects from the CV)
- AVOID: "diverse skill set," "passionate," "excited," "hard worker," "comprehensive," "versatile," "team player" (filler words)

FORMAT:
- No letterhead, date, address block, or [bracketed placeholders] like [Your Address] or [Date].
- Start: "Dear Hiring Manager,"
- End: "Sincerely," then the applicant's real name.
- 3-4 body paragraphs (keep it tight, 1 page).

OUTPUT: Return ONLY the complete cover letter. No commentary, explanations, or meta-text.`,
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

YOUR TASK:
STEP 1 — ANALYZE THE JOB:
- What are the core responsibilities? (e.g., managing global websites, CMS, SEO, analytics, workflows)
- What's the implied challenge? (e.g., 45+ sites to manage, need for attention to detail, technical + soft skills)
- What company value is hinted at? (e.g., global scale, precision, collaboration)

STEP 2 — MINE THE CV:
- Find experiences where the candidate directly handled similar challenges (e.g., CMS work, multi-site projects, SEO, analytics, content management)
- Extract SPECIFIC metrics that prove capability (%, $, numbers, team sizes, timelines)
- Identify a progression or pattern that shows growth in relevant skills

STEP 3 — BUILD THE NARRATIVE:
- **Opening**: Lead with ONE specific CV achievement that proves you understand and can excel at THIS job. Make the hiring manager think "this person gets it."
  Example: "Managing [number of] websites across [description] at [company] taught me that scalable digital infrastructure requires both technical precision and strategic thinking—exactly what your 45+ global network needs."
- **Paragraph 2**: Tell the story of how you excelled at a core job requirement (e.g., CMS mastery, SEO, content management). Use specific metrics and outcomes. Show how it applies to Air Charter's needs.
- **Paragraph 3**: Showcase a complementary strength (attention to detail, cross-functional collaboration, analytical rigor, workflow optimization). Again, use CV proof with metrics.
- **Paragraph 4** (if applicable): If you have a third strong relevant experience, include it. Otherwise, close here.
- **Closing**: Confidence + specificity. Why do you want to work at Air Charter specifically? Reference the job posting (e.g., "your commitment to growing a global digital presence," "the scale of your website network") and end with a clear ask (e.g., "I'd welcome the chance to discuss how I can bring this experience to your team").

STEP 4 — POLISH:
- Every sentence references a CV fact (company, title, metric, achievement, degree, certification). No vague claims.
- No generic phrases like "passionate," "excited," "diverse skills," "comprehensive understanding."
- Numbers stay exactly as in the CV.
- Tone: professional, confident, specific, human (not robotic).

RETURN: The complete cover letter only. No commentary.`,
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
