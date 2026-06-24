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
      model: 'openai/gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert recruiter and ATS specialist tailoring a CV for a specific job.

OUTPUT FORMAT — strictly plain text:
- No markdown. No asterisks (**), no hyphens used as bullets, no hash symbols (#), no underscores.
- Section headings are written in UPPERCASE on their own line (e.g. PROFESSIONAL SUMMARY, SKILLS, EXPERIENCE, EDUCATION).
- Bullet points use a simple dash followed by a space: -  
- Do not wrap any text in asterisks or other markdown characters.

RULES:
- Only use information explicitly in the original CV. Never add, invent, or imply anything not there.
- Keep every number (%, £, $, metric, timeframe) EXACTLY as written in the CV.
- Do not add skills, tools, companies, certifications, or achievements not in the original CV.
- If the job requires something not in the CV, do not fabricate it — simply omit.

PROCESS (silently — do NOT include in output):
1. Identify the core responsibilities, required skills, and ATS keywords from the job description.
2. Map each requirement to the closest matching CV evidence.
3. Decide relevance order: most relevant experience and bullets surface first.

OUTPUT — return ONLY the clean tailored CV in this exact structure:

[Candidate Name]
[Contact details on one line]

PROFESSIONAL SUMMARY
[2–4 sentences rewritten for this specific role using only CV facts. No generic phrases.]

SKILLS
[Skills grouped by category, ordered by relevance to this job. Plain text, comma-separated within each group.]

EXPERIENCE
[Company Name | Job Title | Start Date - End Date]
- [Most relevant achievement/responsibility first, reworded to match job terminology where accurate]
- [Second bullet]
[Repeat for each role]

EDUCATION
[Degree, Institution, Year]

CERTIFICATIONS
[Only if present in original CV]

LANGUAGES
[Only if present in original CV]

No analysis, no "Job Match" sections, no ATS keyword lists, no notes, no commentary — just the CV.`,
        },
        {
          role: 'user',
          content: `ROLE: ${String(jobTitle ?? '').slice(0, 200)}
COMPANY: ${String(company ?? '').slice(0, 200)}

JOB DESCRIPTION:
${jobDescription.slice(0, 5000)}

---

ORIGINAL CV:
${resumeText}

---

Tailor this CV for the role above. Rewrite the professional summary, reorder skills and experience bullets by relevance, and naturally incorporate job-relevant terminology. Output only the clean tailored CV — no analysis, no section labels like "Job Match Analysis", no ATS keyword lists, no notes.`,
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
