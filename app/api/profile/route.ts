import { NextResponse } from 'next/server'
import { updateProfile, getProfile } from '@/lib/data/profiles'

export async function GET() {
  try {
    const profile = await getProfile()
    
    if (!profile) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('[v0] Error in GET /api/profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { full_name } = body

    if (!full_name || typeof full_name !== 'string') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const { error } = await updateProfile({ full_name })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Error in PATCH /api/profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
