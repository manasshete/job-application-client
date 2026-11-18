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
    <div className="fade">
      <ToolHero icon={Mail} title={tool.title} description={tool.longDescription} />
      <div className="tl-pub"><CoverLetterBuilder /></div>
      <SignupCTA />
    </div>
  )
}
