import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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
    const updates = await request.json()

    const dbUpdates: any = {}
    if (updates.company) dbUpdates.company = updates.company
    if (updates.position) dbUpdates.position = updates.position
    if (updates.status) dbUpdates.status = updates.status
    if (updates.dateApplied) dbUpdates.date_applied = updates.dateApplied
    if (updates.salary !== undefined) dbUpdates.salary = updates.salary
    if (updates.location !== undefined) dbUpdates.location = updates.location
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes
    if (updates.jobUrl !== undefined) dbUpdates.job_url = updates.jobUrl
    if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline
    if (updates.recruiterName !== undefined) dbUpdates.recruiter_name = updates.recruiterName
    if (updates.recruiterEmail !== undefined) dbUpdates.recruiter_email = updates.recruiterEmail
    if (updates.tags) dbUpdates.tags = updates.tags

    const { error } = await supabase
      .from('jobs')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('[v0] Error updating job:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log status changes
    if (updates.status) {
      await supabase.from('activity_logs').insert({
        job_id: id,
        user_id: user.id,
        action: 'Status Changed',
        new_value: updates.status,
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

    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('[v0] Error deleting job:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
