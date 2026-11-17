import type { Metadata } from 'next'
import { LegalPage, type LegalSection } from '@/components/pz/legal'

export const metadata: Metadata = { title: 'Cookie Policy' }

const SECTIONS: LegalSection[] = [
  {
    id: 'what-are-cookies',
    heading: 'What Are Cookies?',
    blocks: [
      'Cookies are small text files stored on your device (computer, tablet, or smartphone) when you visit a website. They allow the website to recognise your device, remember your preferences, and provide essential functionality.',
      'We also use related technologies such as local storage and session storage to maintain your preferences and security state across browsing sessions.',
    ],
  },
  {
    id: 'how-we-use-cookies',
    heading: 'How Pursuitz Uses Cookies',
    blocks: [
      'Pursuitz, operated by SkyKode Solutions, uses cookies and local storage to:',
      [
        'Keep you securely logged into your account during your session',
        'Protect against Cross-Site Request Forgery (CSRF) and unauthorized access',
        'Remember your user interface preferences (such as light or dark theme)',
        'Store your cookie consent choices',
        'Analyze aggregate, anonymized website traffic to improve user experience',
      ],
      'We do not sell personal data, nor do we use third-party advertising cookies that track you across third-party websites.',
    ],
  },
  {
    id: 'types-of-cookies',
    heading: 'Types of Cookies and Storage We Use',
    blocks: [
      '1. Strictly Necessary / Essential Cookies & Storage:',
      [
        'pz_session: An HTTP-only secure cookie containing an encrypted JWT token used to authenticate you and protect your account. Without this cookie, you cannot sign in or access protected features.',
        'CSRF / security tokens: Used to protect form submissions against forged requests.',
        'pz_cookie_consent: Stored in local storage to record whether you accepted or declined optional cookies.',
      ],
      '2. Preference & Functionality Storage:',
      [
        'pz_theme: Stored in a cookie / local storage to remember whether you prefer Light, Dark, or System appearance mode.',
      ],
      '3. Performance & Analytics:',
      [
        'Vercel Analytics: We collect privacy-preserving, aggregate performance metrics (such as page response times and web vitals) to ensure the platform operates smoothly. These analytics do not track your identity across other websites.',
      ],
    ],
  },
  {
    id: 'third-party-cookies',
    heading: 'Third-Party Services',
    blocks: [
      'When you make a payment on Pursuitz, payment processing is handled securely by our payment partners (e.g., Razorpay / Stripe). These providers may set strictly necessary cookies to detect fraud, verify payment validity, and process your transaction safely.',
      'AI processing (such as job extraction or resume tailoring) is executed entirely server-side; our AI providers do not place cookies on your browser.',
    ],
  },
  {
    id: 'managing-cookies',
    heading: 'How to Manage or Disable Cookies',
    blocks: [
      'You can update your cookie preferences at any time using our on-site Cookie Consent banner. You can choose to accept all cookies or restrict to Strictly Necessary cookies.',
      'You can also configure your web browser to block or delete cookies. If you disable strictly necessary cookies, certain core functions—such as logging in or maintaining an active session—will not work properly.',
      [
        'Google Chrome: Settings → Privacy and security → Cookies and other site data',
        'Mozilla Firefox: Settings → Privacy & Security → Cookies and Site Data',
        'Apple Safari: Preferences → Privacy → Manage Website Data',
        'Microsoft Edge: Settings → Cookies and site permissions',
      ],
    ],
  },
  {
    id: 'contact',
    heading: 'Contact Us',
    blocks: [
      'If you have questions about our use of cookies or privacy practices, please contact us at info@pursuitz.co.',
    ],
  },
]

export default function CookiePolicyPage() {
  return <LegalPage title="Cookie Policy" updated="November 2026" sections={SECTIONS} />
}
