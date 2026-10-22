import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/server'
import { FileText } from 'lucide-react'
import { getTool } from '@/lib/tools'
import { ToolHero, SignupCTA } from '@/components/tools/tools-chrome'
import { ReadabilityChecker } from './readability-checker'

const tool = getTool('resume-word-counter')!

export const metadata: Metadata = {
  title: tool.metaTitle,
  description: tool.metaDescription,
  alternates: { canonical: '/tools/resume-word-counter' },
}

export default async function ResumeWordCounterPage() {
  // Signed-in users get the tool inside their dashboard, so it never feels like a second login.
  if (await getCurrentUser()) redirect('/dashboard/tools/resume-word-counter')
  return (
    <>
      <ToolHero icon={FileText} title="Resume Readability Checker" description={tool.longDescription} />
      <div className="pz" style={{ background: "var(--bg)" }}><div className="tl-pub"><ReadabilityChecker /></div></div>
      <SignupCTA />
    </>
  )
}
