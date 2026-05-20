'use client'

import { AlertCircle } from 'lucide-react'

export function DocumentDisclaimer() {
  return (
    <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-900/30 dark:bg-purple-900/20">
      <div className="flex gap-3">
        <AlertCircle className="h-5 w-5 shrink-0 text-purple-600 dark:text-purple-500" />
        <div className="text-sm">
          <p className="font-medium text-purple-900 dark:text-purple-200">Generated Documents</p>
          <p className="mt-1 text-purple-800 dark:text-purple-300">
            AI-generated resumes and cover letters are drafts intended to be personalized and reviewed before submission. You are responsible for ensuring accuracy and appropriateness of all submitted documents. Always proofread and customize generated content to match your unique qualifications and the specific job requirements.
          </p>
        </div>
      </div>
    </div>
  )
}
