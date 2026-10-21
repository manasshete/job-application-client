import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/server'
import { getJobs } from '@/lib/data/jobs'
import { getProfile } from '@/lib/data/profiles'
import { getTokenBatches, getTokenSummary } from '@/lib/data/tokens'
import { getDocuments } from '@/lib/data/documents'
import { todayIso } from '@/lib/pz/format'
import { AppProvider } from '@/components/pz/app-context'
import { AppShell } from '@/components/pz/app-shell'

// Always fresh: jobs, tokens and plan change as the user works.
export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')

  let loadError = false
  const safe = async <T,>(fn: () => Promise<T>, fallback: T): Promise<T> => {
    try {
      return await fn()
    } catch {
      loadError = true
      return fallback
    }
  }

  const [jobs, profile, summary, batches, docs] = await Promise.all([
    safe(getJobs, []),
    safe(getProfile, null),
    safe(getTokenSummary, { aiExtractionBalance: 0, documentGenerationBalance: 0, nextExpiry: null }),
    safe(getTokenBatches, []),
    safe(getDocuments, []),
  ])

  return (
    <div className="pz">
      <AppProvider
        serverToday={todayIso()}
        initialJobs={jobs}
        initialAccount={{
          name: profile?.full_name?.trim() || user.email.split('@')[0],
          email: user.email,
          tier: profile?.subscription_tier ?? 'free',
        }}
        initialTokens={{ extractions: summary.aiExtractionBalance, documents: summary.documentGenerationBalance, nextExpiry: summary.nextExpiry, batches }}
        initialDocs={docs}
        loadError={loadError}
      >
        <AppShell>{children}</AppShell>
      </AppProvider>
    </div>
  )
}
