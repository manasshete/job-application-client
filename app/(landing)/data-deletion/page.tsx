import type { Metadata } from 'next'
import { LegalPage, type LegalSection } from '@/components/pz/legal'

export const metadata: Metadata = { title: 'Data Deletion Request' }

const SECTIONS: LegalSection[] = [
  {
    id: 'overview',
    heading: 'Overview & Your Right to Erasure',
    blocks: [
      'Pursuitz, operated by SkyKode Solutions, is committed to protecting your personal data and respecting your privacy rights. Under applicable data privacy laws, including the General Data Protection Regulation (GDPR Article 17) and the California Consumer Privacy Act (CCPA), you have the right to request the permanent erasure of your personal data held by us.',
      'This document outlines how you can initiate a data deletion request, what data is removed, and our handling timelines.',
    ],
  },
  {
    id: 'self-service',
    heading: 'Option 1: In-App Self-Service Deletion',
    blocks: [
      'If you have an active Pursuitz account without active billing dispute obligations, you can delete your account and all associated data immediately from within the application:',
      [
        'Log in to your account at pursuitz.co',
        'Navigate to Settings (/dashboard/settings)',
        'Scroll down to the "Delete account" section',
        'Click "Delete account…" and type your account email to confirm',
      ],
      'Upon confirmation, your account is immediately deactivated and scheduled for complete database erasure.',
    ],
  },
  {
    id: 'assisted-request',
    heading: 'Option 2: Submitting a Deletion Request via Email',
    blocks: [
      'If you cannot log in, wish to delete data associated with an email without an active login, or have payment history that requires support processing, you can submit a request directly to our team:',
      [
        'Send an email to: info@pursuitz.co',
        'Subject line: "Data Deletion Request"',
        'Include: The email address associated with the account or data you wish deleted',
        'Include: Any specific details (e.g. account deletion, document removal, or full data purge)',
      ],
      'For your security, we will send a verification link or email to the requested address to verify ownership before executing deletion. Never send passwords or full credit card details in your request.',
    ],
  },
  {
    id: 'data-deleted',
    heading: 'What Data Is Deleted',
    blocks: [
      'When your data deletion request is processed, the following items are permanently removed:',
      [
        'Account profile (email address, hashed credentials, personal settings)',
        'Uploaded master resumes, CVs, and work history',
        'Generated tailored resumes, cover letters, and document exports',
        'Job tracker entries, target companies, interview logs, and notes',
        'Session tokens, authentication identifiers, and device association records',
      ],
      'Data deleted through this process cannot be restored.',
    ],
  },
  {
    id: 'exceptions',
    heading: 'Statutory Retention Exceptions',
    blocks: [
      'In accordance with applicable laws, certain limited records cannot be deleted immediately upon request:',
      [
        'Tax & Accounting: Invoices and transaction payment records retained for statutory tax compliance periods (typically up to 7 years as required by financial regulations).',
        'Legal & Security: Records strictly required to demonstrate compliance, defend against fraud, or resolve active legal disputes.',
      ],
      'Any retained records are securely archived and strictly isolated from standard operations.',
    ],
  },
  {
    id: 'timeline',
    heading: 'Response & Completion Timeline',
    blocks: [
      'We aim to acknowledge deletion requests within 48 hours of receipt.',
      'We complete the full verification and data erasure process within 30 calendar days. If an extension is required due to complexity, we will notify you within the initial period explaining the reason for delay.',
      'There is no fee for submitting or fulfilling a data deletion request.',
    ],
  },
  {
    id: 'contact',
    heading: 'Contact Us',
    blocks: [
      'For any questions regarding your data deletion request or our data practices, please reach out to our team at info@pursuitz.co.',
    ],
  },
]

export default function DataDeletionPage() {
  return <LegalPage title="Data Deletion Request" updated="November 2026" sections={SECTIONS} />
}
