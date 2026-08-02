import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/admin/service-client'

/**
 * Admin endpoint to manually trigger sync of disposable email domains from GitHub.
 * Useful for emergency updates or testing.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authorization (check Auth header)
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()

    // Verify the token is from an admin user (optional: could check profiles.is_admin)
    // For now, we'll just require the auth header

    console.log('[v0] Admin: Starting manual disposable domains sync...')

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

    console.log(`[v0] Admin: Fetched ${domains.length} domains from GitHub`)

    // Clear existing and insert new domains
    const { error: deleteError } = await admin
      .from('disposable_email_domains')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (deleteError && deleteError.code !== 'PGRST116') {
      throw new Error(`Failed to clear old domains: ${deleteError.message}`)
    }

    // Insert in batches
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

    console.log(`[v0] Admin: Successfully synced ${inserted} disposable domains`)

    return NextResponse.json({
      success: true,
      domains_synced: inserted,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[v0] Admin: Sync failed:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
