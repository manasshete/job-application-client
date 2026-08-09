import { FileSearch, Calculator, FileText, Mail, type LucideIcon } from 'lucide-react'
import type { FreeTool } from '@/lib/tools'

const ICONS: Record<FreeTool['icon'], LucideIcon> = {
  FileSearch,
  Calculator,
  FileText,
  Mail,
}

export function ToolIcon({
  name,
  className,
}: {
  name: FreeTool['icon']
  className?: string
}) {
  const Icon = ICONS[name]
  return <Icon className={className} />
}

export function getToolIcon(name: FreeTool['icon']): LucideIcon {
  return ICONS[name]
}
