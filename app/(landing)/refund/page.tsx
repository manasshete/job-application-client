import type { Metadata } from 'next'
import { LegalPage, type LegalSection } from '@/components/pz/legal'

export const metadata: Metadata = { title: 'Refund and Cancellation Policy' }

const SECTIONS: LegalSection[] = [
  {
    id: 'cancelling',
    heading: 'Cancelling Your Subscription',
    blocks: [
      'You can cancel your subscription by contacting us at info@pursuitz.co.',
      'Cancellation stops future renewals. Unless you request and receive a refund, your paid features remain available until the end of your current billing period, after which your account moves to the Free plan.',
      'Cancelling your subscription does not automatically request a refund. You can request both together.',
    ],
  },
  {
    id: 'first-subscription',
    heading: 'Your First Subscription',
    blocks: [
      'You may request a full refund within 14 calendar days of your first paid subscription purchase, provided you have used less than 10% of the AI tokens included in your plan.',
      'If you have used 10% or more of your plan’s included tokens, you are not eligible for a refund under this offer.',
      'Once refunded, your paid subscription ends, any remaining tokens included with that subscription are removed, and your account returns to the Free plan.',
      'This usage condition does not limit any refund or cancellation rights you have under applicable consumer law.',
    ],
  },
  {
    id: 'renewals',
    heading: 'Subscription Renewals',
    blocks: [
      'If your subscription renews unintentionally, contact us within 7 calendar days of the renewal charge. We will refund that renewal in full if you have not used paid features or consumed paid-plan tokens since it renewed.',
      'Outside this offer, renewal payments are generally non-refundable for a change of mind or non-use. Exceptions include billing mistakes, service failures covered below, and refunds required by applicable law.',
    ],
  },
  {
    id: 'tokens-failures',
    heading: 'AI Tokens and Failed Requests',
    blocks: [
      'Tokens included with a subscription are part of that plan and cannot ordinarily be exchanged separately for cash. Any applicable expiry dates and usage limits will be shown before purchase and in your account.',
      'If a technical failure deducts tokens without delivering the requested result, contact us with the approximate time and affected feature. Once confirmed, we will restore the incorrectly deducted tokens.',
      'Restoring tokens does not replace any right you have to a monetary refund or another remedy under applicable law.',
    ],
  },
  {
    id: 'billing-problems',
    heading: 'Billing Mistakes and Service Problems',
    blocks: [
      'We will refund verified duplicate charges, overcharges, and subscription charges taken after a cancellation became effective.',
      'If a paid feature is unavailable or materially fails to work as described, contact us so we can investigate. Depending on the problem, we will provide a correction, an appropriate partial refund, or a full refund. Any mandatory legal remedy takes priority, and we will not require you to accept account credit instead of a refund you are entitled to receive.',
    ],
  },
  {
    id: 'employment-outcomes',
    heading: 'AI-Generated Documents and Employment Outcomes',
    blocks: [
      'Pursuitz helps you organise applications and prepare documents. It does not guarantee interviews, employer responses, job offers, or employment.',
      'AI-generated content may contain errors and should be reviewed before use. Outside the refund offers above, an unsuccessful application or a preference for different wording does not, by itself, qualify for a refund.',
      'This does not limit your rights where a feature is defective, misleadingly described, or not supplied as promised.',
    ],
  },
  {
    id: 'request-refund',
    heading: 'How to Request a Refund',
    blocks: [
      'Email info@pursuitz.co with:',
      [
        'The email address associated with your account.',
        'The payment date and transaction or invoice reference, if available.',
        'Whether you want a refund, cancellation, or both.',
        'A brief description if you are reporting a billing or technical problem.',
      ],
      'You do not need to provide a reason. Never send your password or full payment-card details.',
      'We aim to acknowledge requests within 48 hours and provide a decision within 7 calendar days.',
    ],
  },
  {
    id: 'receiving-refund',
    heading: 'Receiving Your Refund',
    blocks: [
      'Refunds are returned to the original payment method without a refund processing fee.',
      'For eligible requests, we will issue the refund within 14 calendar days of receiving your request, or sooner where required by law. Your bank or payment provider may take additional time to display it.',
    ],
  },
  {
    id: 'consumer-rights',
    heading: 'Your Consumer Rights',
    blocks: [
      'This policy provides benefits in addition to your statutory rights. It does not exclude or restrict any applicable cancellation, withdrawal, refund, or defective-service rights.',
      'Where local law provides stronger protection or longer claim periods, those protections apply. The voluntary deadlines above do not shorten statutory deadlines.',
    ],
  },
]

export default function RefundPolicyPage() {
  return <LegalPage title="Refund and Cancellation Policy" updated="17 November 2026" sections={SECTIONS} />
}
