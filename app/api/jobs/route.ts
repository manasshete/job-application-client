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

    // Convert empty strings to null for date fields
    const dateApplied = job.dateApplied || new Date().toISOString().split('T')[0]
    const deadline = job.deadline || null

    const { data, error } = await supabase
      .from('jobs')
      .insert({
        user_id: user.id,
        company: job.company,
        position: job.position,
        status: job.status,
        date_applied: dateApplied,
        salary: job.salary || null,
        location: job.location || null,
        notes: job.notes || null,
        job_url: job.jobUrl || null,
        deadline: deadline,
        recruiter_name: job.recruiterName || null,
        recruiter_email: job.recruiterEmail || null,
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
      user_id: user.id,
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
