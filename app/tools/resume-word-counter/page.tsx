import type { Metadata } from 'next'
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

export default function ResumeWordCounterPage() {
  return (
    <>
      <ToolHero icon={FileText} title="Resume Readability Checker" description={tool.longDescription} />
      <ReadabilityChecker />
      <SignupCTA />
    </>
  )
}
