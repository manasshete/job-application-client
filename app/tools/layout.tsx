import type { ReactNode } from 'react'
import { PublicHeader, PublicFooter } from '@/components/pz/public-chrome'

export default function ToolsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="pz min-h-screen">
      <PublicHeader />
      <main className="claude-tool-content">{children}</main>
      <PublicFooter />
    </div>
  )
}
