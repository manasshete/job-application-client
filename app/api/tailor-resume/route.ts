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
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an elite resume tailoring expert. Your ONLY job is to optimize the user's resume for ATS and hiring managers using ONLY real resume data.

CORE MANDATE: Use ONLY facts from the resume. Never add, invent, or fabricate anything.

YOUR MISSION:
1. Extract resume facts: company names, job titles, dates, metrics (%, $, revenue, impact), certifications, degrees, achievements
2. Extract job posting keywords: key skills, requirements, responsibilities that appear in the job description
3. Naturally match resume achievements to job requirements (reorder bullet points to show most relevant FIRST)
4. Rephrase existing resume bullet points to include job keywords where they genuinely apply (without forcing or keyword-stuffing)
5. Update Professional Summary to speak directly to this role using facts from the resume
6. Highlight quantifiable results and metrics throughout
7. Keep all original resume facts; optimize presentation only

KEYWORD WEAVING TECHNIQUE:
- Identify 3-5 core keywords from the job posting (skills, tools, methodologies, outcomes)
- For each keyword, find resume achievements that genuinely relate
- Naturally rephrase those achievements to include the keyword (don't force it)
- Example: Original "Managed marketing campaigns" → Tailored "Led multi-channel marketing campaigns (Google Ads, Meta, LinkedIn) resulting in 45% CTR improvement"
- The keyword (multi-channel marketing, Google Ads, etc.) comes naturally from the context of the achievement, not inserted artificially

WHAT NOT TO DO:
- Do NOT add new jobs, companies, skills, certifications, or achievements
- Do NOT fabricate metrics or outcomes
- Do NOT keyword-stuff (listing keywords randomly)
- Do NOT remove genuine resume achievements
- Do NOT use vague language; always emphasize metrics and specific outcomes

OUTPUT: Full tailored resume as plain text, with clear section headings. Every fact is verifiable from the original resume.`,
        },
        {
          role: 'user',
          content: `JOB CONTEXT:
Position: ${String(jobTitle ?? '').slice(0, 200)}
Company: ${String(company ?? '').slice(0, 200)}

JOB DESCRIPTION:
${jobDescription.slice(0, 5000)}

---

MY CURRENT RESUME (use ONLY this content):
${resumeText}

---

TAILORING TASK:
1. Extract my resume facts: company names, job titles, dates, metrics, degrees, certifications, and key achievements
2. Identify 3-5 core keywords/requirements from the job posting (skills, tools, methodologies, outcomes the company needs)
3. Match my resume achievements to these job requirements
4. For each matched achievement, reorder and naturally rephrase it to include the job keyword where it genuinely belongs
5. Reorder all bullet points within each role to show most relevant achievements FIRST
6. Update my Professional Summary to address this specific role and company (using facts from my resume only)
7. Ensure metrics and quantifiable results are prominent throughout
8. Keep all original resume content; only optimize the presentation and phrasing

EXAMPLE PROCESS:
- Job posting mentions: "Google Ads, conversion optimization, ROI"
- My resume says: "Managed ad campaigns"
- Tailored to: "Managed Google Ads campaigns with focus on conversion rate optimization, achieving 35% ROI improvement"
(The keywords come naturally from the context of my actual experience, not forced)

Return the complete tailored resume as plain text. Every statement must be traceable to my original resume.`,
        },
      ],
    })

    // Increment document count via SECURITY DEFINER RPC (direct column writes
    // are revoked for the user-scoped client to prevent tampering).
    await supabase.rpc('increment_documents_generated', { p_user_id: user.id })

    return Response.json({ tailoredResume: text })
  } catch (err) {
    console.error('[v0] tailor-resume error:', err)
    return Response.json({ error: 'Failed to tailor resume. Please try again.' }, { status: 500 })
  }
}
