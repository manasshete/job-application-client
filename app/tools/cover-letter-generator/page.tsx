import type { Metadata } from 'next'
import { Mail } from 'lucide-react'
import { getTool } from '@/lib/tools'
import { ToolHero, SignupCTA } from '@/components/tools/tools-chrome'
import { CoverLetterBuilder } from './cover-letter-builder'

const tool = getTool('cover-letter-generator')!

export const metadata: Metadata = {
  title: tool.metaTitle,
  description: tool.metaDescription,
  alternates: { canonical: '/tools/cover-letter-generator' },
}

export default function CoverLetterGeneratorPage() {
  return (
    <>
      <ToolHero icon={Mail} title="Cover Letter Template Generator" description={tool.longDescription} />
      <CoverLetterBuilder />
      <SignupCTA />
    </>
  )
}
