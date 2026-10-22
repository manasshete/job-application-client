import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/server'
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

export default async function CoverLetterGeneratorPage() {
  // Signed-in users get the tool inside their dashboard, so it never feels like a second login.
  if (await getCurrentUser()) redirect('/dashboard/tools/cover-letter-generator')
  return (
    <>
      <ToolHero icon={Mail} title="Cover Letter Template Generator" description={tool.longDescription} />
      <div className="pz" style={{ background: "var(--bg)" }}><div className="tl-pub"><CoverLetterBuilder /></div></div>
      <SignupCTA />
    </>
  )
}
