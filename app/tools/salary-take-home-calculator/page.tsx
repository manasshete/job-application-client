import type { Metadata } from 'next'
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

export default function SalaryCalculatorPage() {
  return (
    <>
      <ToolHero icon={Calculator} title="Salary Take-Home Calculator" description={tool.longDescription} />
      <SalaryCalculator />
      <SignupCTA />
    </>
  )
}
