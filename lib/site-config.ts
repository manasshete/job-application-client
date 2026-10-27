// Central place for site-wide SEO + brand constants.
// Swap `url` for your real production domain when ready.
export const siteConfig = {
  name: 'Pursuitz',
  url: 'https://pursuitz.co',
  title: 'Pursuitz | AI Job Application Tracker & Resume Tailoring Tool',
  description:
    'Track every job application in one place, automatically extract job details from any job link, tailor your resume and cover letter with AI, and download ATS-optimized PDFs ready to submit.',
  tagline: 'AI Job Application Tracker & Resume Tailoring Tool',
  ogImage: '/og-image.png',
  twitter: '@pursuitz',
  keywords: [
    // Primary
    'job application tracker',
    'AI job application tracker',
    'job search organizer',
    'track job applications',
    'job search tracker',
    'visual job tracker',
    'job application dashboard',
    'job search CRM',
    // Secondary
    'AI resume tailoring',
    'tailor resume to job description',
    'ATS resume optimizer',
    'resume job description matcher',
    'AI cover letter generator',
    'ATS-friendly resume',
    // Differentiation
    'job link parser',
    'AI job extraction',
    'extract job details from URL',
    'auto-fill job applications',
    'job URL tracker',
    'automatic job application tracking',
  ],
} as const
