import { getCurrentUser } from '@/lib/auth/server'
import { writingModel } from '@/lib/ai'
import { generateChecked } from '@/lib/prompts/generate-checked'
import { TAILOR_CV_SYSTEM, tailorCvUserMessage, tailoredCvSchema, renderTailoredCv } from '@/lib/prompts/tailor-cv'
import { checkCurrency, checkSpelling, checkFacts, checkRoles, checkSkills } from '@/lib/prompts/verify'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { SUBSCRIPTION_LIMITS, type SubscriptionTier } from '@/lib/subscription'
import { getTokenBalance, consumeToken, refundToken } from '@/lib/data/tokens'

export async function POST(req: Request) {
  let reservedFor: string | null = null
  try {
    const supabase = await createClient()
    const user = await getCurrentUser()

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
        { error: 'Document generation is not available on your current plan.' },
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

    const { resumeText, jobTitle, jobDescription, company, location, candidateNotes } = await req.json()

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
    if (location && (typeof location !== 'string' || location.length > 200)) {
      return Response.json({ error: 'Location is too long.' }, { status: 400 })
    }
    if (candidateNotes && (typeof candidateNotes !== 'string' || candidateNotes.length > 3000)) {
      return Response.json({ error: 'Notes are too long. Maximum 3,000 characters.' }, { status: 400 })
    }

    // Reserve the token atomically before the AI call so parallel requests can't
    // all pass the balance check above. Refunded in the catch below if the call fails.
    if (!(await consumeToken('document_generation'))) {
      return Response.json(
        { error: 'You have no document generation tokens left. Tokens are valid for 60 days from the date they are added; renew or upgrade to get more.' },
        { status: 403 }
      )
    }
    reservedFor = user.id

    const source = [resumeText, candidateNotes ?? ''].join('\n')
    const { output, checks } = await generateChecked({
      model: writingModel,
      system: TAILOR_CV_SYSTEM,
      schema: tailoredCvSchema,
      prompt: tailorCvUserMessage({
        jobTitle,
        company,
        location,
        jobDescription: jobDescription.slice(0, 5000),
        cv: resumeText,
        candidateNotes,
      }),
      check: ({ cv }) => {
        const text = renderTailoredCv(cv)
        return [...checkFacts(text, source), ...checkCurrency(text, source), ...checkSpelling(text, jobDescription, resumeText, location), ...checkSkills(cv.skills.flatMap((s) => s.items), source), ...checkRoles(cv.headline, cv.experience, source)]
      },
    })

    const { cv, ...analysis } = output
    analysis.flags = [...analysis.flags, ...checks] as typeof analysis.flags
    return Response.json({ tailoredResume: renderTailoredCv(cv), analysis })
  } catch (err) {
    if (reservedFor) await refundToken(reservedFor, 'document_generation')
    console.error('[v0] tailor-resume error:', err)
    return Response.json({ error: 'Failed to tailor resume. Please try again.' }, { status: 500 })
  }
}
