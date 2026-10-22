import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { FREE_TOOLS } from '@/lib/tools'
import { ToolIcon } from '@/components/tools/tool-icon'

export const metadata: Metadata = { title: 'Free tools · Pursuitz' }

export default function DashboardToolsPage() {
  return (
    <div className="pg fade">
      <div className="hd">
        <div>
          <h1 className="h1">Free tools</h1>
          <p className="muted" style={{ margin: '6px 0 0', fontSize: 'var(--text-sm)' }}>
            Quick checks for your search. They run in your browser, so nothing is sent or saved.
          </p>
        </div>
      </div>
      <div className="tools" style={{ marginTop: 24 }}>
        {FREE_TOOLS.map((t) => (
          <Link key={t.slug} href={`/dashboard/tools/${t.slug}`} className="tool">
            <span className="tool-ic" aria-hidden="true"><ToolIcon name={t.icon} /></span>
            <b>{t.title}</b>
            <p>{t.description}</p>
            <span className="tool-go" aria-hidden="true">Open tool<ArrowRight /></span>
          </Link>
        ))}
      </div>
    </div>
  )
}
