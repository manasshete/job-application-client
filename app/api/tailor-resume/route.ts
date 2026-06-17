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
        { error: 'Document generation requires a Pro (£10/month) or Premium (£15/month) plan.' },
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

    if (resumeText.length > 15000) {
      return Response.json({ error: 'Resume text is too long. Maximum 15,000 characters.' }, { status: 400 })
    }

    const { text } = await generateText({
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert CV/resume tailoring assistant. Your job is to tailor the user's existing resume to better match a specific job posting.

STRICT RULES you must follow:
1. Do NOT add any work experience, projects, skills, or qualifications the user does not already have.
2. Do NOT invent or fabricate anything.
3. Only reorder, rephrase, and emphasise existing content to align with the job requirements.
4. Adjust the professional summary/objective to speak directly to this role.
5. Reorder bullet points within existing roles to highlight the most relevant ones first.
6. Mirror keywords from the job description where they honestly match existing experience.
7. Keep the same overall structure and sections as the original.
8. Output the full tailored resume as plain text, preserving clear section headings.`,
        },
        {
          role: 'user',
          content: `Please tailor my resume for this job:

JOB TITLE: ${jobTitle}
COMPANY: ${company}
JOB DESCRIPTION:
${jobDescription.slice(0, 5000)}

MY CURRENT RESUME:
${resumeText}

Return the full tailored resume as plain text.`,
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
