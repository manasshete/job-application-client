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
      model: 'anthropic/claude-sonnet-4-5',
      system: `You are an expert CV writer tailoring a candidate's CV for a specific job posting.

STRICT OUTPUT FORMAT — plain text only:
- No markdown whatsoever. No asterisks, no hashes, no underscores, no bold, no italics.
- Section headings in UPPERCASE on their own line.
- Bullet points use a dash and space: -  
- Contact details on a single line after the name.

FABRICATION IS FORBIDDEN:
- Only use companies, job titles, tools, metrics, and facts explicitly in the original CV.
- Keep every number (%, £, $, timeframe) exactly as written.
- If the job requires something not in the CV, omit it — never invent it.

YOUR TASK — you must make ALL of these changes. A CV that looks nearly identical to the original is a failure:

1. PROFESSIONAL SUMMARY — rewrite it completely from scratch for this specific role.
   - Use the job title and employer name in the summary.
   - Mention the 2–3 skills most critical to this specific job.
   - Remove any skills or experience irrelevant to this role from the summary.
   - Do not copy sentences from the original summary.

2. SKILLS — reorder skill groups so the most relevant to this job appear first.
   - Remove skill groups entirely irrelevant to this role.
   - Within each group, put the most relevant skills first.
   - Rename skill groups to match the job's terminology if appropriate.

3. EXPERIENCE — for each role, reorder bullets so the most relevant to this job come first.
   - Rewrite each bullet using the exact terminology from the job description where accurate.
   - Example: if the job says "managing and maintaining websites" and the CV says "built database-driven websites", rewrite as "Managed and maintained client websites, ensuring content accuracy and platform performance".
   - Example: if the job says "creating and scheduling content" and the CV says "managed content calendars", rewrite as "Created and scheduled content across social media platforms, managing publishing calendars and engagement".
   - Remove bullets entirely irrelevant to this role to keep the CV focused.
   - Keep all numbers and metrics exactly as written.

4. Keep EDUCATION, CERTIFICATIONS, LANGUAGES exactly as in the original CV.

OUTPUT STRUCTURE:
[Candidate Name]
[Contact line]

PROFESSIONAL SUMMARY
[Fully rewritten 2–4 sentences]

SKILLS
[Skill Group Most Relevant to Job]: skill1, skill2, skill3
[Second Skill Group]: skill1, skill2
[continue...]

EXPERIENCE
[Company] | [Job Title] | [Dates]
- [Most relevant bullet first, rewritten in job's language]
- [Second bullet]
[Repeat for each role]

EDUCATION
[As in original]

CERTIFICATIONS
[As in original]

LANGUAGES
[As in original]

Return ONLY the tailored CV. No notes, no commentary, no analysis sections.`,
      messages: [
        {
          role: 'user',
          content: `ROLE: ${String(jobTitle ?? '').slice(0, 200)}
COMPANY: ${String(company ?? '').slice(0, 200)}

JOB DESCRIPTION:
${jobDescription.slice(0, 5000)}

ORIGINAL CV:
${resumeText}

Tailor this CV for the ${String(jobTitle ?? 'role')} at ${String(company ?? 'this company')}. The output must look visibly and substantially different from the original — rewrite the summary from scratch, reorder skills by relevance, and rewrite experience bullets using the job's own language.`,
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
