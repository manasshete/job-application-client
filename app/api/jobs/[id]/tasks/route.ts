import { NextResponse } from 'next/server'
import { authForJob, readBody, text, date, logActivity, TASK_STATUSES } from '@/lib/api-children'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await authForJob(id)
  if (ctx instanceof NextResponse) return ctx

  const body = await readBody(request)
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })

  try {
    const title = text(body.title, 200)
    if (!title) return NextResponse.json({ error: 'Task title is required' }, { status: 400 })
    const status = typeof body.status === 'string' && TASK_STATUSES.includes(body.status) ? body.status : 'pending'
    const { data, error } = await ctx.supabase
      .from('tasks')
      .insert({ job_id: id, user_id: ctx.userId, title, due_date: date(body.dueDate) ?? null, status, notes: text(body.notes, 5000) ?? null })
      .select()
      .single()
    if (error || !data) {
      console.error('[tasks] insert failed:', error)
      return NextResponse.json({ error: 'Could not add the task. Please try again.' }, { status: 500 })
    }
    await logActivity(ctx, id, 'Task added', title)
    return NextResponse.json({ id: data.id, title: data.title, dueDate: data.due_date, status: data.status, notes: data.notes ?? undefined })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Invalid input' }, { status: 400 })
  }
}
