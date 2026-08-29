'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#08090c] text-[#f4f5f7]">
      <div className="claude-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="relative container mx-auto max-w-3xl px-6 py-12 sm:py-20">
        <Link href="/">
          <Button variant="ghost" className="mb-10 rounded-full text-[#9aafff] hover:bg-white/[0.06] hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#7894f8]">Legal</p>
        <h1 className="mt-4 text-balance text-5xl font-semibold tracking-[-0.04em] text-[#f4f5f7]">Privacy Policy</h1>
        <p className="mb-12 mt-4 font-mono text-xs uppercase tracking-[0.14em] text-[#59606d]">Last updated · January 2024</p>

        <div className="claude-legal flex flex-col gap-10 border-t border-white/[0.08] pt-10 text-[#a2a7b2]">
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">1. Information We Collect</h2>
            <p className="mb-3">Pursuitz collects the following information:</p>
            <ul className="list-inside list-disc space-y-2 ml-4">
              <li>Email address and password (for authentication)</li>
              <li>Job application details you enter (company, position, salary, etc.)</li>
              <li>Resume and cover letter content (if using document generation feature)</li>
              <li>Interview and task tracking data</li>
              <li>Usage statistics and analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">2. How We Use Your Data</h2>
            <p className="mb-3">We use your data to:</p>
            <ul className="list-inside list-disc space-y-2 ml-4">
              <li>Provide and maintain the Pursuitz service</li>
              <li>Process your job applications and tracking preferences</li>
              <li>Generate AI-tailored resumes and cover letters</li>
              <li>Extract job posting information from URLs</li>
              <li>Send service notifications and updates</li>
              <li>Improve and optimize the service</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">3. Data Security</h2>
            <p className="mb-3">
              Your data is encrypted in transit and at rest. We use industry-standard security measures including:
            </p>
            <ul className="list-inside list-disc space-y-2 ml-4">
              <li>SSL/TLS encryption for all data transmission</li>
              <li>Row-Level Security (RLS) in our database</li>
              <li>Secure password hashing</li>
              <li>Regular security audits</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">4. Data Sharing</h2>
            <p className="mb-3">
              We do not sell, trade, or rent your personal information to third parties. Your data may be shared with:
            </p>
            <ul className="list-inside list-disc space-y-2 ml-4">
              <li>Service providers (payment processors, email services) only as necessary</li>
              <li>Law enforcement if legally required</li>
              <li>AI services (OpenAI) only for document generation and job extraction features</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">5. Your Rights</h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="list-inside list-disc space-y-2 ml-4">
              <li>Access your personal data</li>
              <li>Request correction or deletion of your data</li>
              <li>Opt-out of data collection (if applicable)</li>
              <li>Export your data</li>
            </ul>
            <p className="mt-3">To exercise these rights, contact us at privacy@pursuitz.com</p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">6. Cookies</h2>
            <p>
              Pursuitz uses cookies to maintain your session and preferences. You can control cookie settings in your browser.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">7. Contact Us</h2>
            <p>
              If you have questions about this privacy policy, please contact us at privacy@pursuitz.com
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
