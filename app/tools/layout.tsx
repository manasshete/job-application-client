import type { ReactNode } from 'react'
import { PublicShell } from '@/components/pz/public-chrome'

export default function ToolsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="pz">
      <PublicShell>{children}</PublicShell>
    </div>
  )
}
