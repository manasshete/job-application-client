import { getCurrentUser } from '@/lib/auth/server'
import { generateText } from 'ai'
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

    // Reserve the token atomically before the AI call so parallel requests can't
    // all pass the balance check above. Refunded in the catch below if the call fails.
    if (!(await consumeToken('document_generation'))) {
      return Response.json(
        { error: 'You have no document generation tokens left. Tokens are valid for 60 days from the date they are added; renew or upgrade to get more.' },
        { status: 403 }
      )
    }
    reservedFor = user.id

    const { text } = await generateText({
      model: 'google/gemini-2.5-flash',
      system: `You are an expert ATS Resume Writer, Technical Recruiter, and Career Coach. Your task is to tailor the provided CV to the provided Job Description while remaining 100% truthful.

PRIMARY OBJECTIVE
Maximize ATS compatibility and recruiter appeal WITHOUT inventing, exaggerating, or implying experience that is not explicitly supported by the CV.

STRICT GUARDRAILS
- Never fabricate skills, tools, achievements, certifications, projects, responsibilities, or metrics.
- Never imply the candidate has experience with a technology simply because it appears in the job description.
- Never replace existing achievements with generic keywords.
- Never remove measurable achievements unless absolutely necessary for space.
- Never downgrade strong evidence just to include more keywords.
- Never strengthen responsibilities beyond what the original CV supports. Rewrite for clarity, not seniority. Do not elevate titles or scale of work.
- If a job requirement is unsupported by the CV, do not add it.
- If experience is partially related, emphasize the relevant parts without exaggerating.

CHRONOLOGY AND SELECTION RULES
- Preserve employment chronology exactly. Do not reorder jobs unless the original CV already uses a functional resume format. Only reorder bullet points within each individual position to prioritize relevance.
- If multiple experiences satisfy the same requirement, choose the strongest evidence rather than mentioning every relevant experience. Avoid clutter.
- Prefer evidence over claims. Prioritize specific actions and results over vague introductory skill claims.

TAILORING AND FORMATTING RULES
- Naturally incorporate relevant keywords from the job description only where they truthfully describe existing experience. Prefer existing CV wording whenever it is equally effective to avoid unnecessary rewriting.
- Never sacrifice readability for keyword density. The document must read naturally for a human recruiter, not look like a stuffed keyword list.
- Do not use asterisks, stars, or markdown bold symbols anywhere in the output text.
- Use simple hyphens (-) for bullet points.
- Use plain capitalized text for section headers if emphasis is needed.

QUALITY CHECK AND FINAL VALIDATION
Before producing the final CV, silently verify that every skill and tool exists in the original CV, metrics are unchanged, and no unsupported claims were introduced.
Apply this final validation check: "If I were the hiring manager interviewing this candidate tomorrow, could they confidently explain every sentence in this CV?" If the answer is no, rewrite that sentence.

OUTPUT RESTRICTION:
Return ONLY the tailored CV text. Do not include any introductory remarks, concluding remarks, notes, or explanations. The very first character of your response must be the start of the CV document.`,
      messages: [
        {
          role: 'user',
          content: `ROLE: ${String(jobTitle ?? '').slice(0, 200)}
COMPANY: ${String(company ?? '').slice(0, 200)}

JOB DESCRIPTION:
${jobDescription.slice(0, 5000)}

ORIGINAL CV:
${resumeText}

Tailor this CV for the ${String(jobTitle ?? 'role')} at ${String(company ?? 'this company')}.`,
        },
      ],
    })

    return Response.json({ tailoredResume: text })
  } catch (err) {
    if (reservedFor) await refundToken(reservedFor, 'document_generation')
    console.error('[v0] tailor-resume error:', err)
    return Response.json({ error: 'Failed to tailor resume. Please try again.' }, { status: 500 })
  }
}
