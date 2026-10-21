import type { Metadata } from 'next'
import { LegalPage, type LegalSection } from '@/components/pz/legal'

export const metadata: Metadata = { title: 'Terms of Service' }

const SECTIONS: LegalSection[] = [
  {
    id: 'acceptance',
    heading: 'Acceptance of Terms',
    blocks: ['By accessing and using Pursuitz, you accept and agree to be bound by the terms and provision of this agreement.'],
  },
  {
    id: 'license',
    heading: 'Use License',
    blocks: [
      'Permission is granted to temporarily download one copy of the materials (information or software) on Pursuitz for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:',
      [
        'Modify or copy the materials',
        'Use the materials for any commercial purpose or for any public display',
        'Attempt to decompile or reverse engineer any software contained on Pursuitz',
        'Remove any copyright or other proprietary notations from the materials',
        'Transfer the materials to another person or "mirror" the materials on any other server',
      ],
    ],
  },
  {
    id: 'ai',
    heading: 'AI-Generated Content Disclaimer',
    blocks: [
      'Pursuitz uses AI to generate content including:',
      ['Job posting extractions from URLs', 'Tailored resumes based on your existing CV', 'AI-modified or generated cover letters'],
      'You acknowledge that AI-generated content may not be 100% accurate and you are solely responsible for reviewing, verifying, and customizing all generated content before submission to employers.',
    ],
  },
  {
    id: 'documents',
    heading: 'Document Responsibility',
    blocks: [
      'All resumes and cover letters generated or modified by Pursuitz are drafts. You are fully responsible for:',
      [
        'Reviewing all documents for accuracy and completeness',
        'Ensuring information is truthful and not misleading',
        'Customizing documents to match the specific job requirements',
        'Verifying all submitted documents meet legal requirements',
      ],
    ],
  },
  {
    id: 'warranties',
    heading: 'Disclaimer of Warranties',
    blocks: [
      "The materials on Pursuitz are provided on an 'as is' basis. Pursuitz makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.",
    ],
  },
  {
    id: 'liability',
    heading: 'Limitations of Liability',
    blocks: [
      'In no event shall Pursuitz or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Pursuitz, even if we or our authorized representative has been notified orally or in writing of the possibility of such damage.',
    ],
  },
  {
    id: 'accuracy',
    heading: 'Accuracy of Materials',
    blocks: [
      'The materials appearing on Pursuitz could include technical, typographical, or photographic errors. Pursuitz does not warrant that any of the materials on the website are accurate, complete, or current. Pursuitz may make changes to the materials contained on the website at any time without notice.',
    ],
  },
  {
    id: 'links',
    heading: 'Materials on Pursuitz',
    blocks: [
      "Pursuitz has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Pursuitz of the site. Use of any such linked website is at the user's own risk.",
    ],
  },
  {
    id: 'tokens',
    heading: 'Tokens, Billing & Validity',
    blocks: [
      'Paid plans and any add-ons are delivered as tokens for AI extractions and document generation. Tokens are valid for 60 days from the date they are added to your account, whether they are obtained through a new purchase, an upgrade, or a downgrade. Unused tokens roll over and remain usable on top of newly added tokens until their individual 60-day validity period expires, after which they are forfeited. Tokens are consumed oldest-expiring first. Tokens have no cash value, are non-transferable, and are non-refundable once added to your account.',
    ],
  },
  {
    id: 'modifications',
    heading: 'Modifications',
    blocks: [
      'Pursuitz may revise these terms of service for the website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.',
    ],
  },
  {
    id: 'law',
    heading: 'Governing Law',
    blocks: [
      'These terms and conditions are governed by and construed in accordance with the laws of the United Kingdom, and you irrevocably submit to the exclusive jurisdiction of the courts located in the UK.',
    ],
  },
  {
    id: 'contact',
    heading: 'Contact',
    blocks: ['If you have any questions about these Terms of Service, please contact us at terms@pursuitz.com'],
  },
]

export default function TermsPage() {
  return <LegalPage title="Terms of Service" updated="January 2024" sections={SECTIONS} />
}
