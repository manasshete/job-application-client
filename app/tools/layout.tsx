import type { ReactNode } from 'react'
import { ToolsNav, ToolsFooter } from '@/components/tools/tools-chrome'

export default function ToolsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <ToolsNav />
      <main>{children}</main>
      <ToolsFooter />
    </div>
  )
}
