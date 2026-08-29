import type { ReactNode } from 'react'
import { ToolsNav, ToolsFooter } from '@/components/tools/tools-chrome'

export default function ToolsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="claude-page min-h-screen bg-[#08090c] text-[#f4f5f7]">
      <ToolsNav />
      <main className="claude-tool-content">{children}</main>
      <ToolsFooter />
    </div>
  )
}
