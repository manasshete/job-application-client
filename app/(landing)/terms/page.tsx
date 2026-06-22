'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/60 via-white to-white">
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <Link href="/">
          <Button variant="ghost" className="mb-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <h1 className="mb-8 text-4xl font-bold text-slate-900">Terms of Service</h1>
        <p className="mb-6 text-slate-500">Last updated: January 2024</p>

        <div className="space-y-8 text-slate-700">
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Pursuitz, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">2. Use License</h2>
            <p className="mb-3">Permission is granted to temporarily download one copy of the materials (information or software) on Pursuitz for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
            <ul className="list-inside list-disc space-y-2 ml-4">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to decompile or reverse engineer any software contained on Pursuitz</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
              <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">3. AI-Generated Content Disclaimer</h2>
            <p className="mb-3">Pursuitz uses AI to generate content including:</p>
            <ul className="list-inside list-disc space-y-2 ml-4">
              <li>Job posting extractions from URLs</li>
              <li>Tailored resumes based on your existing CV</li>
              <li>AI-modified or generated cover letters</li>
            </ul>
            <p className="mt-3">
              You acknowledge that AI-generated content may not be 100% accurate and you are solely responsible for reviewing, verifying, and customizing all generated content before submission to employers.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">4. Document Responsibility</h2>
            <p>
              All resumes and cover letters generated or modified by Pursuitz are drafts. You are fully responsible for:
            </p>
            <ul className="list-inside list-disc space-y-2 ml-4">
              <li>Reviewing all documents for accuracy and completeness</li>
              <li>Ensuring information is truthful and not misleading</li>
              <li>Customizing documents to match the specific job requirements</li>
              <li>Verifying all submitted documents meet legal requirements</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">5. Disclaimer of Warranties</h2>
            <p>
              The materials on Pursuitz are provided on an 'as is' basis. Pursuitz makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">6. Limitations of Liability</h2>
            <p>
              In no event shall Pursuitz or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Pursuitz, even if we or our authorized representative has been notified orally or in writing of the possibility of such damage.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">7. Accuracy of Materials</h2>
            <p>
              The materials appearing on Pursuitz could include technical, typographical, or photographic errors. Pursuitz does not warrant that any of the materials on the website are accurate, complete, or current. Pursuitz may make changes to the materials contained on the website at any time without notice.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">8. Materials on Pursuitz</h2>
            <p>
              Pursuitz has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Pursuitz of the site. Use of any such linked website is at the user's own risk.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">9. Modifications</h2>
            <p>
              Pursuitz may revise these terms of service for the website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">10. Governing Law</h2>
            <p>
              These terms and conditions are governed by and construed in accordance with the laws of the United Kingdom, and you irrevocably submit to the exclusive jurisdiction of the courts located in the UK.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">11. Contact</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at terms@pursuitz.com
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
