'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/60 via-white to-white">
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <Link href="/">
          <Button variant="ghost" className="mb-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <h1 className="mb-8 text-4xl font-bold text-slate-900">Privacy Policy</h1>
        <p className="mb-6 text-slate-500">Last updated: January 2024</p>

        <div className="space-y-8 text-slate-700">
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">1. Information We Collect</h2>
            <p className="mb-3">HireFlow collects the following information:</p>
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
              <li>Provide and maintain the HireFlow service</li>
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
            <p className="mt-3">To exercise these rights, contact us at privacy@jobtracker.com</p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">6. Cookies</h2>
            <p>
              HireFlow uses cookies to maintain your session and preferences. You can control cookie settings in your browser.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">7. Contact Us</h2>
            <p>
              If you have questions about this privacy policy, please contact us at privacy@jobtracker.com
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
