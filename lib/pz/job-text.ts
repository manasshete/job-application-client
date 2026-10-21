import type { Job } from '@/lib/types'

/** The posting context handed to the AI when tailoring a CV or writing a letter. */
export function jobContext(job: Job): string {
  const parts = [
    `${job.position} at ${job.company}${job.location ? `, ${job.location}` : ''}.`,
    job.description?.trim(),
    job.requirements?.length ? `Key requirements: ${job.requirements.join(', ')}.` : '',
    // Older jobs kept the posting text in notes.
    !job.description && job.notes ? job.notes.trim() : '',
  ]
  return parts.filter(Boolean).join('\n\n').slice(0, 5000)
}
