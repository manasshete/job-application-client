/**
 * Free Tools registry — single source of truth for all public, no-login tools.
 *
 * Used by:
 *  - The "Free Tools" nav dropdown (landing + tools pages)
 *  - The /tools index page
 *  - Per-tool page metadata
 *
 * Every tool here runs 100% client-side: no API calls, no server compute,
 * no database. That keeps them free and abuse-proof regardless of traffic.
 */

export interface FreeTool {
  /** URL slug under /tools */
  slug: string
  /** Short nav/card title */
  title: string
  /** One-line description for cards + dropdown */
  description: string
  /** Longer description for the tool page hero + SEO */
  longDescription: string
  /** lucide-react icon name (resolved in components) */
  icon: 'FileSearch' | 'Calculator' | 'FileText' | 'Mail'
  /** SEO page title */
  metaTitle: string
  /** SEO meta description */
  metaDescription: string
}

export const FREE_TOOLS: FreeTool[] = [
  {
    slug: 'ats-resume-scanner',
    title: 'ATS Resume Scanner',
    description: 'Check how well your resume matches a job description.',
    longDescription:
      'Paste your resume and a job description to instantly see which keywords match, which are missing, and your overall match score — the same signals an applicant tracking system looks for.',
    icon: 'FileSearch',
    metaTitle: 'Free ATS Resume Scanner — Match Your Resume to Any Job',
    metaDescription:
      'Free ATS resume checker. Paste your resume and a job description to see your keyword match score and missing keywords. No sign-up, runs in your browser.',
  },
  {
    slug: 'salary-take-home-calculator',
    title: 'Salary Take-Home Calculator',
    description: 'Estimate your net pay after income tax.',
    longDescription:
      'Enter a gross salary and country to estimate your take-home pay after income tax, with a clear monthly and annual breakdown. Great for comparing job offers.',
    icon: 'Calculator',
    metaTitle: 'Free Salary Take-Home Pay Calculator (India, US, UK)',
    metaDescription:
      'Estimate your net take-home salary after income tax for India, the US, and the UK. Free, instant, and private — all calculations run in your browser.',
  },
  {
    slug: 'resume-word-counter',
    title: 'Resume Readability Checker',
    description: 'Spot filler words, passive voice, and length issues.',
    longDescription:
      'Paste your resume or cover letter to get live word and sentence stats, plus flags for filler words, passive voice, and overused clichés that weaken your writing.',
    icon: 'FileText',
    metaTitle: 'Free Resume Readability & Word Counter Tool',
    metaDescription:
      'Analyze your resume for word count, filler words, passive voice, and clichés. Free readability checker that runs entirely in your browser — no sign-up.',
  },
  {
    slug: 'cover-letter-generator',
    title: 'Cover Letter Template Generator',
    description: 'Build a clean cover letter from a proven template.',
    longDescription:
      'Fill in a few details about you and the role, pick a tone, and get a polished cover letter you can copy or download. Built from proven templates — no AI, no sign-up.',
    icon: 'Mail',
    metaTitle: 'Free Cover Letter Template Generator',
    metaDescription:
      'Create a professional cover letter in seconds from proven templates. Choose a tone, fill in the blanks, then copy or download. Free and private.',
  },
]

export function getTool(slug: string): FreeTool | undefined {
  return FREE_TOOLS.find((t) => t.slug === slug)
}
