'use client'

import { AlertCircle } from 'lucide-react'

export function DataDisclaimer() {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-900/20">
      <div className="flex gap-3">
        <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-500" />
        <div className="text-sm">
          <p className="font-medium text-red-900 dark:text-red-200">Data Responsibility</p>
          <p className="mt-1 text-red-800 dark:text-red-300">
            JobTracker stores job application data for your personal use only. You are responsible for maintaining backups of important information. While we implement security measures, no system is 100% secure. We are not liable for data loss or unauthorized access due to circumstances beyond our control.
          </p>
        </div>
      </div>
    </div>
  )
}
