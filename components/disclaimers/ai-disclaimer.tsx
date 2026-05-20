'use client'

import { AlertCircle } from 'lucide-react'

export function AIDisclaimer() {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/30 dark:bg-blue-900/20">
      <div className="flex gap-3">
        <AlertCircle className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-500" />
        <div className="text-sm">
          <p className="font-medium text-blue-900 dark:text-blue-200">AI-Powered Features</p>
          <p className="mt-1 text-blue-800 dark:text-blue-300">
            Job extractions are powered by AI and may not always be 100% accurate. Please review extracted information before saving. We recommend verifying critical details directly from the job posting.
          </p>
        </div>
      </div>
    </div>
  )
}
