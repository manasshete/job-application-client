import { NextResponse } from 'next/server'
import { updateProfile, getProfile } from '@/lib/data/profiles'
import { sanitizeInput, validateLength } from '@/lib/validation'

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
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const fullName = (body as { full_name?: unknown })?.full_name

    if (typeof fullName !== 'string' || !fullName.trim()) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    if (!validateLength(fullName, 200)) {
      return NextResponse.json({ error: 'Name is too long.' }, { status: 400 })
    }

    const { error } = await updateProfile({ full_name: sanitizeInput(fullName) })

    if (error) {
      console.error('[profile] Error updating profile:', error)
      return NextResponse.json({ error: 'Failed to update profile. Please try again.' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Error in PATCH /api/profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
