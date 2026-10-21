import type { Job } from '@/lib/types'
import { JOB_STATUS_LABEL, sourceOf } from './format'

const quote = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`

export function jobsToCsv(jobs: Job[]): string {
  const header = ['Company', 'Role', 'Location', 'Salary', 'Status', 'Date applied', 'Response deadline', 'Source', 'Link', 'Recruiter', 'Recruiter email', 'Tags', 'Key requirements', 'Notes']
  const rows = jobs.map((j) =>
    [j.company, j.position, j.location, j.salary, JOB_STATUS_LABEL[j.status], j.dateApplied, j.deadline, sourceOf(j.jobUrl), j.jobUrl, j.recruiterName, j.recruiterEmail, (j.tags ?? []).join('; '), (j.requirements ?? []).join('; '), j.notes]
      .map(quote)
      .join(','),
  )
  return [header.map(quote).join(','), ...rows].join('\n')
}

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export function safeFileName(title: string): string {
  return title.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'document'
}

/** Renders text to a PDF on the server and saves it. Throws with a readable message on failure. */
export async function downloadTextAsPdf(content: string, title: string) {
  const filename = `${safeFileName(title)}.pdf`
  const res = await fetch('/api/generate-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, filename }),
  })
  if (!res.ok) throw new Error('Could not make the PDF. Please try again.')
  saveBlob(await res.blob(), filename)
  return filename
}
