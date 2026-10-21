import type { ActivityLogEntry } from '@/lib/types'
import { JOB_STATUS_LABEL, ROUND_STATUS_LABEL, TASK_STATUS_LABEL } from './format'

const cap = (s?: string | null) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '')

const label = (v?: string | null) => {
  if (!v) return ''
  return (JOB_STATUS_LABEL as Record<string, string>)[v] ?? (ROUND_STATUS_LABEL as Record<string, string>)[v] ?? (TASK_STATUS_LABEL as Record<string, string>)[v] ?? cap(v)
}

/** One readable line for the Activity list. */
export function activityText(a: ActivityLogEntry): string {
  switch (a.action) {
    case 'Created':
      return `Added to Pursuitz. Status: ${label(a.newValue) || 'Applied'}`
    case 'Status Changed':
      return `Status changed to ${label(a.newValue)}`
    case 'Round added':
      return `Round added: ${a.newValue ?? ''}`
    case 'Round status':
      return `Round: ${label(a.newValue)}`
    case 'Task added':
      return `Task added: ${a.newValue ?? ''}`
    case 'Task status':
      return `Task: ${label(a.newValue)}`
    case 'Tailored CV approved':
      return 'Tailored CV approved and saved'
    case 'Cover letter approved':
      return 'Cover letter approved and saved'
    default:
      return [a.action, a.newValue].filter(Boolean).join(': ')
  }
}
