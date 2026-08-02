import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/admin/service-client'
import { DISPOSABLE_DOMAINS } from '@/lib/disposable-domains'

/**
 * POST /api/admin/populate-disposable-domains
 * 
 * Admin-only route to populate the disposable email domain blocklist.
 * Requires CRON_SECRET header for security.
 * 
 * Idempotent: safe to call multiple times (upserts domains).
 */
export async function POST(request: NextRequest) {
  try {
    // Verify CRON_SECRET
    const secret = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!secret || secret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const admin = createAdminClient()

    // Insert all domains (ignore conflicts if already exists)
    const domainsToInsert = DISPOSABLE_DOMAINS.map((domain) => ({
      domain: domain.toLowerCase(),
    }))

    const { error: insertError, data } = await admin
      .from('disposable_email_domains')
      .upsert(domainsToInsert, { onConflict: 'domain' })
      .select('domain')

    if (insertError) {
      console.error('[v0] Failed to populate disposable domains:', insertError.message)
      return NextResponse.json(
        { error: 'Failed to populate domains' },
        { status: 500 }
      )
    }

    console.log('[v0] Populated disposable email domains:', data?.length || 0, 'domains')

    return NextResponse.json(
      {
        success: true,
        message: `Populated ${data?.length || 0} disposable email domains`,
        domainsCount: data?.length || 0,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Populate disposable domains error:', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
