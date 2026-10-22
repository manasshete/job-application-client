import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { FREE_TOOLS, getTool } from '@/lib/tools'
import { ToolIcon } from '@/components/tools/tool-icon'
import { AtsScanner } from '@/app/tools/ats-resume-scanner/ats-scanner'
import { SalaryCalculator } from '@/app/tools/salary-take-home-calculator/salary-calculator'
import { ReadabilityChecker } from '@/app/tools/resume-word-counter/readability-checker'
import { CoverLetterBuilder } from '@/app/tools/cover-letter-generator/cover-letter-builder'

const VIEWS: Record<string, () => React.JSX.Element> = {
  'ats-resume-scanner': () => <AtsScanner />,
  'salary-take-home-calculator': () => <SalaryCalculator />,
  'resume-word-counter': () => <ReadabilityChecker />,
  'cover-letter-generator': () => <CoverLetterBuilder />,
}

export function generateStaticParams() {
  return FREE_TOOLS.map((t) => ({ slug: t.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const tool = getTool((await params).slug)
  return { title: tool ? `${tool.title} · Pursuitz` : 'Free tools · Pursuitz' }
}

export default async function DashboardToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tool = getTool(slug)
  const View = VIEWS[slug]
  if (!tool || !View) notFound()

  return (
    <div className="pg fade">
      <Link href="/dashboard/tools" className="tl-back"><ArrowLeft aria-hidden="true" />Free tools</Link>
      <div className="tl-hd">
        <span className="tool-ic" aria-hidden="true"><ToolIcon name={tool.icon} /></span>
        <div>
          <h1 className="h1">{tool.title}</h1>
          <p className="muted" style={{ margin: '6px 0 0', fontSize: 'var(--text-sm)', maxWidth: 680, lineHeight: 1.6 }}>{tool.longDescription}</p>
        </div>
      </div>
      <View />
    </div>
  )
}
