import type { Metadata } from 'next'
import { LegalPage, type LegalSection } from '@/components/pz/legal'

export const metadata: Metadata = { title: 'Privacy Policy' }

const SECTIONS: LegalSection[] = [
  {
    id: 'collect',
    heading: 'Information We Collect',
    blocks: [
      'Pursuitz collects the following information:',
      [
        'Email address and password (for authentication)',
        'Job application details you enter (company, position, salary, etc.)',
        'Resume and cover letter content (if using document generation feature)',
        'Interview and task tracking data',
        'Usage statistics and analytics',
      ],
    ],
  },
  {
    id: 'use',
    heading: 'How We Use Your Data',
    blocks: [
      'We use your data to:',
      [
        'Provide and maintain the Pursuitz service',
        'Process your job applications and tracking preferences',
        'Generate AI-tailored resumes and cover letters',
        'Extract job posting information from URLs',
        'Send service notifications and updates',
        'Improve and optimize the service',
      ],
    ],
  },
  {
    id: 'security',
    heading: 'Data Security',
    blocks: [
      'Your data is encrypted in transit and at rest. We use industry-standard security measures including:',
      ['SSL/TLS encryption for all data transmission', 'Row-Level Security (RLS) in our database', 'Secure password hashing', 'Regular security audits'],
    ],
  },
  {
    id: 'sharing',
    heading: 'Data Sharing',
    blocks: [
      'We do not sell, trade, or rent your personal information to third parties. Your data may be shared with:',
      ['Service providers (payment processors, email services) only as necessary', 'Law enforcement if legally required', 'AI services (OpenAI) only for document generation and job extraction features'],
    ],
  },
  {
    id: 'rights',
    heading: 'Your Rights & Data Deletion',
    blocks: [
      'You have the right to:',
      [
        'Access and obtain a copy of your personal data',
        'Request correction of inaccurate data',
        'Request permanent deletion of your account and personal data (Right to Erasure / GDPR Article 17)',
        'Opt-out of non-essential data collection',
        'Export your stored applications and documents',
      ],
      'To request complete data deletion, you can delete your account directly via Settings (/dashboard/settings) or visit our dedicated Data Deletion page (/data-deletion). You can also email us directly at info@pursuitz.co.',
    ],
  },
  {
    id: 'cookies',
    heading: 'Cookies & Tracking',
    blocks: [
      'Pursuitz uses strictly necessary cookies to maintain secure sessions and prevent CSRF attacks, as well as preference cookies for appearance settings. For a comprehensive breakdown and to manage your preferences, please see our dedicated Cookie Policy (/cookies).',
    ],
  },
  {
    id: 'contact',
    heading: 'Contact Us',
    blocks: ['If you have questions about this privacy policy, please contact us at info@pursuitz.co'],
  },
]

export default function PrivacyPage() {
  return <LegalPage title="Privacy Policy" updated="November 2026" sections={SECTIONS} />
}
