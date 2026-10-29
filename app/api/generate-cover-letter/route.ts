import { getCurrentUser } from '@/lib/auth/server'
import { writingModel } from '@/lib/ai'
import { generateChecked } from '@/lib/prompts/generate-checked'
import { COVER_LETTER_SYSTEM, coverLetterUserMessage, coverLetterSchema, renderCoverLetter } from '@/lib/prompts/cover-letter'
import { checkCurrency, checkSpelling, checkFacts, checkQuotes, checkUnlisted } from '@/lib/prompts/verify'
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

    const rl = rateLimit(`cover-letter:${user.id}`, 5, 60000)
    if (!rl.success) {
      return Response.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 })
    }

    // userInput is the candidate's CV. Drafts and key points arrive in candidateNotes.
    const { userInput, jobTitle, jobDescription, company, location, applicantName, tailoredCv, candidateNotes } = await req.json()

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
    if (location && (typeof location !== 'string' || location.length > 200)) {
      return Response.json({ error: 'Location is too long.' }, { status: 400 })
    }
    if (tailoredCv && (typeof tailoredCv !== 'string' || tailoredCv.length > 15000)) {
      return Response.json({ error: 'Tailored CV is too long. Maximum 15,000 characters.' }, { status: 400 })
    }
    if (candidateNotes && (typeof candidateNotes !== 'string' || candidateNotes.length > 8000)) {
      return Response.json({ error: 'Notes are too long. Maximum 8,000 characters.' }, { status: 400 })
    }
    // Strip any HTML/control characters from applicantName to prevent prompt injection.
    const safeApplicantName = applicantName
      ? String(applicantName).replace(/<[^>]*>/g, '').slice(0, 100)
      : undefined

    const notes = [safeApplicantName ? `Sign the letter as: ${safeApplicantName}` : '', candidateNotes ?? '']
      .filter(Boolean)
      .join('\n\n')

    // Reserve the token atomically before the AI call so parallel requests can't
    // all pass the balance check above. Refunded in the catch below if the call fails.
    if (!(await consumeToken('document_generation'))) {
      return Response.json(
        { error: 'You have no document generation tokens left. Tokens are valid for 60 days from the date they are added; renew or upgrade to get more.' },
        { status: 403 }
      )
    }
    reservedFor = user.id

    const source = [userInput, notes].join('\n')
    const { output, checks } = await generateChecked({
      model: writingModel,
      system: COVER_LETTER_SYSTEM,
      schema: coverLetterSchema,
      prompt: coverLetterUserMessage({
        jobTitle,
        company,
        location,
        jobDescription: jobDescription.slice(0, 5000),
        cv: userInput,
        tailoredCv,
        candidateNotes: notes,
      }),
      check: ({ letter, claims }) => {
        const text = renderCoverLetter(letter)
        return [
          ...checkFacts(text, source),
          ...checkCurrency(text, source),
          ...checkSpelling(text, jobDescription, userInput, location),
          ...checkQuotes(claims, source),
          ...checkUnlisted(letter.paragraphs, claims),
        ]
      },
    })

    const { letter, ...analysis } = output
    analysis.flags = [...analysis.flags, ...checks] as typeof analysis.flags
    return Response.json({ coverLetter: renderCoverLetter(letter), analysis })
  } catch (err: unknown) {
    if (reservedFor) await refundToken(reservedFor, 'document_generation')
    const message = err instanceof Error ? err.message : String(err)
    console.error('[cover-letter]', message)
    return Response.json({ error: 'Failed to generate cover letter. Please try again.' }, { status: 500 })
  }
}
