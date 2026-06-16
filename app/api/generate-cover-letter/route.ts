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

    const rl = rateLimit(`cover-letter:${user.id}`, 5, 60000)
    if (!rl.success) {
      return Response.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 })
    }

    const { mode, userInput, jobTitle, jobDescription, company, applicantName } = await req.json()

    // mode: 'refine' (user wrote a draft) | 'generate' (user provided key points)
    if (!userInput || !jobDescription) {
      return Response.json({ error: 'User input and job description are required.' }, { status: 400 })
    }

    const isRefine = mode === 'refine'

    const { text } = await generateText({
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: isRefine
            ? `You are an expert cover letter editor. The user has written a draft cover letter. Your job is to refine and improve it to make it more compelling, professional, and relevant to the specific job. Keep the user's personal voice, specific examples, and key points. Do not add fake experiences or achievements. Output only the final cover letter with no commentary.`
            : `You are an expert cover letter writer. The user has provided key points or details they want included. Write a complete, professional, and compelling cover letter based only on these points. Do not invent qualifications or experiences not mentioned. Output only the final cover letter with no commentary.`,
        },
        {
          role: 'user',
          content: isRefine
            ? `Please refine my cover letter draft for this job:

JOB TITLE: ${jobTitle}
COMPANY: ${company}
APPLICANT NAME: ${applicantName || 'the applicant'}
JOB DESCRIPTION:
${jobDescription.slice(0, 3000)}

MY DRAFT COVER LETTER:
${userInput}

Return the refined cover letter only.`
            : `Please write a cover letter for this job using my key points:

JOB TITLE: ${jobTitle}
COMPANY: ${company}
APPLICANT NAME: ${applicantName || 'the applicant'}
JOB DESCRIPTION:
${jobDescription.slice(0, 3000)}

MY KEY POINTS / DETAILS TO INCLUDE:
${userInput}

Return the complete cover letter only.`,
        },
      ],
    })

    // Increment document count
    await supabase
      .from('profiles')
      .update({ documents_generated_this_month: (profile.documents_generated_this_month || 0) + 1 })
      .eq('id', user.id)

    return Response.json({ coverLetter: text })
  } catch (err) {
    console.error('[v0] cover-letter error:', err)
    return Response.json({ error: 'Failed to generate cover letter. Please try again.' }, { status: 500 })
  }
}
