import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sanitizeInput, validateLength, isValidUrl, MAX_LENGTHS } from '@/lib/validation'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 })
    }

    let updates: Record<string, unknown>
    try {
      updates = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const str = (v: unknown, max: number, label: string): string | null | undefined => {
      if (v === undefined) return undefined
      if (v === null || v === '') return null
      if (typeof v !== 'string') throw new Error(`${label} must be a string`)
      if (!validateLength(v, max)) throw new Error(`${label} is too long`)
      return sanitizeInput(v)
    }

    const dbUpdates: Record<string, unknown> = {}
    try {
      const company = str(updates.company, MAX_LENGTHS.COMPANY, 'Company')
      if (company) dbUpdates.company = company
      const position = str(updates.position, MAX_LENGTHS.POSITION, 'Position')
      if (position) dbUpdates.position = position
      if (typeof updates.status === 'string') dbUpdates.status = sanitizeInput(updates.status)
      if (typeof updates.dateApplied === 'string' && updates.dateApplied) dbUpdates.date_applied = updates.dateApplied

      const salary = str(updates.salary, MAX_LENGTHS.SALARY, 'Salary')
      if (salary !== undefined) dbUpdates.salary = salary
      const location = str(updates.location, MAX_LENGTHS.LOCATION, 'Location')
      if (location !== undefined) dbUpdates.location = location
      const notes = str(updates.notes, MAX_LENGTHS.NOTES, 'Notes')
      if (notes !== undefined) dbUpdates.notes = notes

      if (updates.jobUrl !== undefined) {
        if (updates.jobUrl === null || updates.jobUrl === '') {
          dbUpdates.job_url = null
        } else if (typeof updates.jobUrl === 'string' && isValidUrl(updates.jobUrl) && validateLength(updates.jobUrl, MAX_LENGTHS.URL)) {
          dbUpdates.job_url = updates.jobUrl
        } else {
          throw new Error('Invalid job URL')
        }
      }
      if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline || null
      const recruiterName = str(updates.recruiterName, MAX_LENGTHS.COMPANY, 'Recruiter name')
      if (recruiterName !== undefined) dbUpdates.recruiter_name = recruiterName
      const recruiterEmail = str(updates.recruiterEmail, MAX_LENGTHS.COMPANY, 'Recruiter email')
      if (recruiterEmail !== undefined) dbUpdates.recruiter_email = recruiterEmail
      if (Array.isArray(updates.tags)) dbUpdates.tags = updates.tags.slice(0, 20).map((t) => sanitizeInput(String(t)))
    } catch (validationError) {
      return NextResponse.json(
        { error: validationError instanceof Error ? validationError.message : 'Invalid input' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('jobs')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('[jobs/id] Error updating job:', error)
      return NextResponse.json({ error: 'Failed to update job. Please try again.' }, { status: 500 })
    }

    // Log status changes
    if (typeof updates.status === 'string' && updates.status) {
      await supabase.from('activity_logs').insert({
        job_id: id,
        user_id: user.id,
        action: 'Status Changed',
        new_value: sanitizeInput(updates.status),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 })
    }

    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('[jobs/id] Error deleting job:', error)
      return NextResponse.json({ error: 'Failed to delete job. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[jobs/id] API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
