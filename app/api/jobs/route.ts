import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const job = await request.json()

    const { data, error } = await supabase
      .from('jobs')
      .insert({
        user_id: user.id,
        company: job.company,
        position: job.position,
        status: job.status,
        date_applied: job.dateApplied,
        salary: job.salary,
        location: job.location,
        notes: job.notes,
        job_url: job.jobUrl,
        deadline: job.deadline,
        recruiter_name: job.recruiterName,
        recruiter_email: job.recruiterEmail,
        tags: job.tags || [],
      })
      .select()
      .single()

    if (error) {
      console.error('[v0] Error creating job:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Create initial activity log
    await supabase.from('activity_logs').insert({
      job_id: data.id,
      action: 'Created',
      new_value: 'Applied',
    })

    return NextResponse.json({
      id: data.id,
      company: data.company,
      position: data.position,
      status: data.status,
      dateApplied: data.date_applied,
      salary: data.salary,
      location: data.location,
      notes: data.notes,
      jobUrl: data.job_url,
      deadline: data.deadline,
      recruiterName: data.recruiter_name,
      recruiterEmail: data.recruiter_email,
      tags: data.tags,
      interviews: [],
      tasks: [],
      activityLog: [],
    })
  } catch (error) {
    console.error('[v0] API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
