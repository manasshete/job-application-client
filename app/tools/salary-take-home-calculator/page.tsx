import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/server'
import { Calculator } from 'lucide-react'
import { getTool } from '@/lib/tools'
import { ToolHero, SignupCTA } from '@/components/tools/tools-chrome'
import { SalaryCalculator } from './salary-calculator'

const tool = getTool('salary-take-home-calculator')!

export const metadata: Metadata = {
  title: tool.metaTitle,
  description: tool.metaDescription,
  alternates: { canonical: '/tools/salary-take-home-calculator' },
}

export default async function SalaryCalculatorPage() {
  // Signed-in users get the tool inside their dashboard, so it never feels like a second login.
  if (await getCurrentUser()) redirect('/dashboard/tools/salary-take-home-calculator')
  return (
    <>
      <ToolHero icon={Calculator} title="Salary Take-Home Calculator" description={tool.longDescription} />
      <div className="pz" style={{ background: "var(--bg)" }}><div className="tl-pub"><SalaryCalculator /></div></div>
      <SignupCTA />
    </>
  )
}
