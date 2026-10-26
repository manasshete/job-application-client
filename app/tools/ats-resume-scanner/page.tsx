import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/server'
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

export default async function AtsResumeScannerPage() {
  // Signed-in users get the tool inside their dashboard, so it never feels like a second login.
  if (await getCurrentUser()) redirect('/dashboard/tools/ats-resume-scanner')
  return (
    <>
      <ToolHero icon={FileSearch} title={tool.title} description={tool.longDescription} />
      <div className="pz" style={{ background: "var(--bg)" }}><div className="tl-pub"><AtsScanner /></div></div>
      <SignupCTA />
    </>
  )
}
