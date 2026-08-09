import type { Metadata } from 'next'
import { FileSearch } from 'lucide-react'
import { getTool } from '@/lib/tools'
import { ToolHero, SignupCTA } from '@/components/tools/tools-chrome'
import { AtsScanner } from './ats-scanner'

const tool = getTool('ats-resume-scanner')!

export const metadata: Metadata = {
  title: tool.metaTitle,
  description: tool.metaDescription,
  alternates: { canonical: '/tools/ats-resume-scanner' },
}

export default function AtsResumeScannerPage() {
  return (
    <>
      <ToolHero icon={FileSearch} title="ATS Resume Scanner" description={tool.longDescription} />
      <AtsScanner />
      <SignupCTA />
    </>
  )
}
