import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/admin/service-client'

/**
 * Cron job to sync disposable email domains from GitHub daily.
 * Runs at 2 AM UTC via Vercel Cron Triggers (configure in vercel.json)
 */
export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    console.error('[v0] Cron: Invalid cron secret')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[v0] Cron: Starting disposable domains sync...')

    // Fetch domains from GitHub
    const githubUrl = 'https://raw.githubusercontent.com/tompec/disposable-email-domains/master/disposable_domains.txt'
    const response = await fetch(githubUrl, {
      headers: { 'User-Agent': 'Pursuitz-AbusePrevention' },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch from GitHub: ${response.statusText}`)
    }

    const text = await response.text()
    const domains = text
      .split('\n')
      .map((line) => line.trim().toLowerCase())
      .filter((line) => line.length > 0 && !line.startsWith('#'))

    console.log(`[v0] Cron: Fetched ${domains.length} domains from GitHub`)

    // Clear existing and insert new domains
    const admin = createAdminClient()

    // Delete old domains
    const { error: deleteError } = await admin
      .from('disposable_email_domains')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (deleteError && deleteError.code !== 'PGRST116') {
      // PGRST116 = no rows match (table was empty)
      throw new Error(`Failed to clear old domains: ${deleteError.message}`)
    }

    // Insert new domains in batches (PostgreSQL has a 1000-row limit per insert)
    const batchSize = 500
    let inserted = 0

    for (let i = 0; i < domains.length; i += batchSize) {
      const batch = domains.slice(i, i + batchSize).map((domain) => ({
        domain,
        source: 'github_disposable_domains',
        synced_at: new Date().toISOString(),
      }))

      const { error: insertError } = await admin
        .from('disposable_email_domains')
        .insert(batch)

      if (insertError) {
        throw new Error(`Failed to insert batch: ${insertError.message}`)
      }

      inserted += batch.length
    }

    console.log(`[v0] Cron: Successfully synced ${inserted} disposable domains`)

    return NextResponse.json({
      success: true,
      domains_synced: inserted,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[v0] Cron: Sync failed:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
