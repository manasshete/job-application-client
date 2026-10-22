import { getCurrentUser } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/data/profiles'
import { sanitizeInput, validateLength, isValidUrl, unescapeHtmlEntities, MAX_LENGTHS } from '@/lib/validation'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check job creation limits
    const profile = await getProfile()
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Count user's existing jobs
    const { count } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // Free tier: 10 jobs, Pro: unlimited, Premium: unlimited
    const jobLimits: Record<string, number> = {
      free: 10,
      pro: Infinity,
      premium: Infinity,
    }

    const limit = jobLimits[profile.subscription_tier] || 10

    if ((count || 0) >= limit) {
      return NextResponse.json(
        {
          error: `Job limit reached for ${profile.subscription_tier} plan (${limit}). Upgrade to add more jobs.`,
        },
        { status: 403 }
      )
    }

    let job: Record<string, unknown>
    try {
      job = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    // Required fields
    if (typeof job.company !== 'string' || !job.company.trim()) {
      return NextResponse.json({ error: 'Company is required' }, { status: 400 })
    }
    if (typeof job.position !== 'string' || !job.position.trim()) {
      return NextResponse.json({ error: 'Position is required' }, { status: 400 })
    }

    // Length validation on free-text fields
    const lengthChecks: [unknown, number, string][] = [
      [job.company, MAX_LENGTHS.COMPANY, 'Company'],
      [job.position, MAX_LENGTHS.POSITION, 'Position'],
      [job.location, MAX_LENGTHS.LOCATION, 'Location'],
      [job.salary, MAX_LENGTHS.SALARY, 'Salary'],
      [job.notes, MAX_LENGTHS.NOTES, 'Notes'],
      [job.jobUrl, MAX_LENGTHS.URL, 'Job URL'],
    ]
    for (const [val, max, label] of lengthChecks) {
      if (typeof val === 'string' && !validateLength(val, max)) {
        return NextResponse.json({ error: `${label} is too long.` }, { status: 400 })
      }
    }

    // Validate optional URL
    if (typeof job.jobUrl === 'string' && job.jobUrl.trim() && !isValidUrl(job.jobUrl)) {
      return NextResponse.json({ error: 'Invalid job URL.' }, { status: 400 })
    }

    const clean = (v: unknown) => (typeof v === 'string' && v.trim() ? sanitizeInput(v) : null)

    // Convert empty strings to null for date fields
    const dateApplied = (typeof job.dateApplied === 'string' && job.dateApplied) || new Date().toISOString().split('T')[0]
    const deadline = (typeof job.deadline === 'string' && job.deadline) || null

    // jobs.status must be one of: applied, interview, offer, accepted, rejected.
    const ALLOWED_STATUSES = ['applied', 'interview', 'offer', 'accepted', 'rejected']
    const requestedStatus =
      typeof job.status === 'string' && job.status.trim() ? job.status.trim().toLowerCase() : 'applied'
    if (!ALLOWED_STATUSES.includes(requestedStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    const normalizedStatus = requestedStatus

    const requirements = Array.isArray(job.requirements)
      ? job.requirements.slice(0, 30).map((r) => sanitizeInput(String(r))).filter(Boolean)
      : []
    const description =
      typeof job.description === 'string' && job.description.trim() && validateLength(job.description, 20000)
        ? sanitizeInput(job.description)
        : null

    const baseRow = {
        user_id: user.id,
        company: sanitizeInput(job.company as string),
        position: sanitizeInput(job.position as string),
        status: normalizedStatus,
        date_applied: dateApplied,
        salary: clean(job.salary),
        location: clean(job.location),
        notes: clean(job.notes),
        job_url: typeof job.jobUrl === 'string' && job.jobUrl.trim() ? job.jobUrl : null,
        deadline: deadline,
        recruiter_name: clean(job.recruiterName),
        recruiter_email: clean(job.recruiterEmail),
        tags: Array.isArray(job.tags) ? job.tags.slice(0, 20).map((t) => sanitizeInput(String(t))) : [],
    }

    let { data, error } = await supabase
      .from('jobs')
      .insert({ ...baseRow, requirements, description })
      .select()
      .single()

    // Migration 013 adds requirements/description. Until it is applied, save without them.
    if (error?.code === '42703' || error?.code === 'PGRST204') {
      ;({ data, error } = await supabase.from('jobs').insert(baseRow).select().single())
    }

    if (error || !data) {
      console.error('[jobs] Error creating job:', error)
      return NextResponse.json({ error: 'Failed to create job. Please try again.' }, { status: 500 })
    }

    // Create initial activity log
    await supabase.from('activity_logs').insert({
      job_id: data.id,
      user_id: user.id,
      action: 'Created',
      new_value: normalizedStatus,
    })

    return NextResponse.json({
      id: data.id,
      company: unescapeHtmlEntities(data.company),
      position: unescapeHtmlEntities(data.position),
      status: data.status,
      dateApplied: data.date_applied,
      salary: data.salary ? unescapeHtmlEntities(data.salary) : data.salary,
      location: data.location ? unescapeHtmlEntities(data.location) : data.location,
      notes: data.notes ? unescapeHtmlEntities(data.notes) : data.notes,
      jobUrl: data.job_url,
      deadline: data.deadline,
      recruiterName: data.recruiter_name ? unescapeHtmlEntities(data.recruiter_name) : data.recruiter_name,
      recruiterEmail: data.recruiter_email ? unescapeHtmlEntities(data.recruiter_email) : data.recruiter_email,
      tags: (data.tags || []).map((t: string) => unescapeHtmlEntities(t)),
      requirements: (data.requirements || []).map((t: string) => unescapeHtmlEntities(t)),
      description: data.description ? unescapeHtmlEntities(data.description) : undefined,
      interviews: [],
      tasks: [],
      activityLog: [],
    })
  } catch (error) {
    console.error('[v0] API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
