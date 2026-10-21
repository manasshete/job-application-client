import { NextResponse } from 'next/server'
import { authForJob, readBody, text, date, time, logActivity, INTERVIEW_STATUSES } from '@/lib/api-children'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await authForJob(id)
  if (ctx instanceof NextResponse) return ctx

  const body = await readBody(request)
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })

  try {
    const round = text(body.round, 200)
    if (!round) return NextResponse.json({ error: 'Round name is required' }, { status: 400 })
    const status = typeof body.status === 'string' && INTERVIEW_STATUSES.includes(body.status) ? body.status : 'scheduled'
    const row = { job_id: id, user_id: ctx.userId, round, date: date(body.date) ?? null, status, notes: text(body.notes, 5000) ?? null }

    let { data, error } = await ctx.supabase.from('interviews').insert({ ...row, time: time(body.time) ?? null }).select().single()
    // Migration 013 adds interviews.time. Until it is applied, save without it.
    if (error?.code === '42703' || error?.code === 'PGRST204') {
      ;({ data, error } = await ctx.supabase.from('interviews').insert(row).select().single())
    }
    if (error || !data) {
      console.error('[interviews] insert failed:', error)
      return NextResponse.json({ error: 'Could not add the round. Please try again.' }, { status: 500 })
    }
    await logActivity(ctx, id, 'Round added', round)
    return NextResponse.json({ id: data.id, round: data.round, date: data.date, time: data.time ?? undefined, status: data.status, notes: data.notes ?? undefined })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Invalid input' }, { status: 400 })
  }
}
