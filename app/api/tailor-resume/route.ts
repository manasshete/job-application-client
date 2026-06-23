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
      model: 'openai/gpt-5-mini',
      messages: [
        {
          role: 'system',
          content: `You are an elite resume tailoring strategist. Your job is to strategically position the candidate's ACTUAL resume achievements to align with this job, prioritizing IMPACT and RELEVANCE over keyword-stuffing.

CORE RULES (ZERO FABRICATION):
- Use ONLY facts, metrics, achievements, and experiences from the resume. Never invent, assume, or add anything.
- NUMBERS ARE SACRED: Keep every metric (%, $, revenue, team size, timeframe) EXACTLY as written. Never invent, inflate, or change any number (if the resume says 15%, it stays 15%, never 25%).
- Do NOT add jobs, companies, skills, certifications, or degrees not in the original resume.
- Do NOT keyword-stuff (listing keywords randomly). Keywords should emerge naturally from the context of real achievements.

YOUR STRATEGY:
1. **ANALYZE THE JOB** → Identify core requirements, pain points, and outcomes the company needs (e.g., for a Digital Marketing role: multi-site CMS management, SEO, content strategy, analytics, cross-functional collaboration).
2. **MATCH TO RESUME EXPERIENCE** → Find resume achievements that directly address these needs. Prioritize impact over keyword matching.
3. **REORDER FOR RELEVANCE** → Within each role, move the most relevant achievements to the TOP (not least relevant). This is critical—most important achievements first.
4. **REPHRASE FOR CLARITY + KEYWORDS** → If a resume bullet says "Managed websites," and the job needs CMS expertise, tailor it naturally to "Managed 8+ websites using WordPress/Drupal CMS, optimizing page load times by 12%." The keywords (CMS, WordPress, Drupal, page load optimization) flow naturally from the actual work—they're not forced.
5. **PROFESSIONAL SUMMARY** → Rewrite to speak directly to THIS job and company using resume facts. Highlight the candidate's unique fit (e.g., "Digital Marketing Executive with 5 years managing global content systems and driving SEO improvements across 20+ international properties").
6. **METRICS FIRST** → Throughout the resume, lead with quantifiable outcomes. Example: "Improved organic search traffic by 28% through technical SEO and CMS optimization" is stronger than "Improved organic search traffic through SEO work."

PROHIBITED TACTICS:
- Do NOT add new skills, certifications, or achievements
- Do NOT fabricate metrics or numbers
- Do NOT remove genuine achievements from the original resume
- Do NOT use vague filler language ("responsible for," "helped with," "involved in")—use strong action verbs + specific outcomes
- Do NOT force keywords that don't naturally fit the candidate's experience

OUTPUT: Full tailored resume, clearly formatted with sections (Professional Summary, Experience, Skills, Education). Every fact is verifiable from the original resume.`,
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

STRATEGIC TAILORING INSTRUCTIONS:

STEP 1 — ANALYZE THE JOB:
- What are the core responsibilities? (skills, tools, methodologies, outcomes the company needs)
- What are the pain points? (challenges, scale, complexity implied by the job description)
- Example: For "Digital Marketing Executive managing 45+ global websites," pain points are: CMS mastery, multi-site coordination, content workflow, SEO/analytics, cross-functional collaboration

STEP 2 — MINE THE RESUME:
- Extract my achievements that directly address these job pain points (not generic keyword matches)
- For each achievement, note: company, timeline, specific tool/skill used, quantifiable metric (%, $, count, timeframe)
- Prioritize achievements by relevance to THIS job, not by where they appear in my resume

STEP 3 — REORDER & REPHRASE:
- Within each job/role, reorder bullet points: MOST RELEVANT ACHIEVEMENTS FIRST (this is critical—hiring managers skim)
- For each achievement, naturally incorporate job-relevant keywords where they genuinely apply
  Example: If my resume says "Managed multiple websites" and the job needs CMS + content strategy:
    ✓ Tailored: "Managed 8+ WordPress websites, overseeing content strategy and site optimization, resulting in 23% organic traffic growth"
    ✗ Not: "Used WordPress and content management systems"
- Use strong action verbs + specific outcomes. Avoid "responsible for," "helped with," "involved in"

STEP 4 — PROFESSIONAL SUMMARY:
- Rewrite to speak directly to THIS job and company (not generic)
- Highlight the candidate's unique fit using resume facts
- Example: "Digital Marketing Executive with 5+ years optimizing multi-site WordPress environments and driving organic growth through technical SEO, skilled at managing complex workflows across global teams"
- Include 1-2 key metrics that prove capability for this role

STEP 5 — METRICS & OUTCOMES:
- Ensure every section highlights quantifiable results (%, $, growth, timeline)
- Lead with the metric, not the activity
  ✓ "Increased organic traffic by 28% through technical SEO and CMS optimization"
  ✗ "Optimized websites for better SEO performance"

STEP 6 — FINAL CHECK:
- Verify every fact comes from my original resume (no fabrication)
- Verify every number is exactly as written (no inflation)
- Verify most relevant achievements appear FIRST in each role
- Verify keywords fit naturally, not forced

Return the complete tailored resume as plain text, clearly formatted with section headings (Professional Summary, Work Experience, Skills, Education, Certifications). Every statement must be traceable to my original resume.`,
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
