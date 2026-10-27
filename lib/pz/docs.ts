import type { DocMeta } from '@/lib/data/documents'
import type { Job } from '@/lib/types'

export const isTailoredCv = (d: DocMeta) => d.type === 'cv' && !d.isDefault && (!!d.jobId || /^Tailored CV/i.test(d.name))
export const isCoverLetter = (d: DocMeta) => d.type === 'cover_letter' && !d.isDefault && (!!d.jobId || /^Cover letter/i.test(d.name))

/** Documents the app generated (the library); the master CV, master cover letter and old drafts are left out. */
export const libraryDocs = (docs: DocMeta[]) => docs.filter((d) => isTailoredCv(d) || isCoverLetter(d))

/** The job a document belongs to. Falls back to the "… — Company" name for documents saved before the link existed. */
export function jobForDoc(d: DocMeta, jobs: Job[]): Job | undefined {
  if (d.jobId) return jobs.find((j) => j.id === d.jobId)
  const m = d.name.match(/—\s*(.+)$/)
  return m ? jobs.find((j) => j.company.toLowerCase() === m[1].trim().toLowerCase()) : undefined
}

export const docsForJob = (docs: DocMeta[], job: Job) => libraryDocs(docs).filter((d) => jobForDoc(d, [job]))
