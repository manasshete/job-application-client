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
          content: `You are an elite resume tailoring expert. Your ONLY job is to optimize the user's existing resume for a specific job posting.

CORE MANDATE: Use ONLY facts from the resume provided. Never add, invent, or fabricate anything.

YOUR TASK:
1. Extract key resume facts: company names, job titles, dates, metrics (%, $, revenue, time saved, team size), certifications, degrees, awards, achievements
2. Identify 2-3 resume accomplishments that match the job's core requirements
3. Reorder bullet points within each role to feature job-relevant achievements first
4. Rephrase bullet points using job description keywords where they honestly match
5. Update the professional summary to speak directly to THIS role and company
6. Highlight quantifiable results throughout (metrics, measurable outcomes)
7. Keep all facts from the original resume; never add or invent experience

WHAT NOT TO DO:
- Do NOT add new jobs, companies, skills, or certifications
- Do NOT fabricate metrics or achievements
- Do NOT remove genuine achievements from the original
- Do NOT use vague language; emphasize specific metrics and outcomes

OUTPUT: Full tailored resume as plain text, with clear section headings. Every fact must be verifiable from the original resume.`,
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
1. Extract the key facts from my resume: company names, job titles, metrics, degrees, certifications, achievements
2. Identify 2-3 resume accomplishments that directly match the job posting requirements
3. For each job/role in my resume, reorder bullet points to show most relevant achievements FIRST
4. Rewrite bullet points using job description keywords where my experience genuinely matches
5. Update my Professional Summary to address this specific job and company (use facts from my resume only)
6. Ensure metrics and quantifiable results are prominent throughout
7. Keep the same structure (Experience, Education, Skills, etc.) but optimize the content

Return the complete tailored resume as plain text, preserving all original sections and facts. No fabrication.`,
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
