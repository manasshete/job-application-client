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
    heading: 'Your Rights',
    blocks: [
      'You have the right to:',
      ['Access your personal data', 'Request correction or deletion of your data', 'Opt-out of data collection (if applicable)', 'Export your data'],
      'To exercise these rights, contact us at privacy@pursuitz.com',
    ],
  },
  {
    id: 'cookies',
    heading: 'Cookies',
    blocks: ['Pursuitz uses cookies to maintain your session and preferences. You can control cookie settings in your browser.'],
  },
  {
    id: 'contact',
    heading: 'Contact Us',
    blocks: ['If you have questions about this privacy policy, please contact us at privacy@pursuitz.com'],
  },
]

export default function PrivacyPage() {
  return <LegalPage title="Privacy Policy" updated="January 2024" sections={SECTIONS} />
}
