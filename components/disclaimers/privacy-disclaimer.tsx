'use client'

import { AlertCircle } from 'lucide-react'

export function PrivacyDisclaimer() {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-900/20">
      <div className="flex gap-3">
        <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500" />
        <div className="text-sm">
          <p className="font-medium text-amber-900 dark:text-amber-200">Privacy Notice</p>
          <p className="mt-1 text-amber-800 dark:text-amber-300">
            Your data is encrypted and stored securely. We never share your personal information with third parties. By using JobTracker, you agree to our privacy practices as outlined in our Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  )
}
