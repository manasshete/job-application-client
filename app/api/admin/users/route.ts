import { NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/admin/service-client'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const check = await verifyAdmin()
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }

  const { searchParams } = new URL(req.url)
  const search = (searchParams.get('search') ?? '').trim().slice(0, 100)

  try {
    const admin = createAdminClient()
    let query = admin
      .from('profiles')
      .select(
        'id, email, full_name, subscription_tier, subscription_status, is_admin, ai_extractions_used, documents_generated_this_month, created_at'
      )
      .order('created_at', { ascending: false })
      .limit(50)

    if (search) {
      // Escape % and _ wildcards to prevent unexpected matches
      const safe = search.replace(/[%_]/g, '\\$&')
      query = query.or(`email.ilike.%${safe}%,full_name.ilike.%${safe}%`)
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ users: data ?? [] })
  } catch (error) {
    console.error('[v0] Admin user search error:', error)
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 })
  }
}
