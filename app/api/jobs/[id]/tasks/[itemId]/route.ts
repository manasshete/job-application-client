import { NextResponse } from 'next/server'
import { authForJob, readBody, text, date, logActivity, TASK_STATUSES, UUID_REGEX } from '@/lib/api-children'

type P = { params: Promise<{ id: string; itemId: string }> }

export async function PATCH(request: Request, { params }: P) {
  const { id, itemId } = await params
  const ctx = await authForJob(id)
  if (ctx instanceof NextResponse) return ctx
  if (!UUID_REGEX.test(itemId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  const body = await readBody(request)
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })

  try {
    const updates: Record<string, unknown> = {}
    const title = text(body.title, 200)
    if (title) updates.title = title
    const due = date(body.dueDate)
    if (due !== undefined) updates.due_date = due
    const notes = text(body.notes, 5000)
    if (notes !== undefined) updates.notes = notes
    if (body.status !== undefined) {
      if (typeof body.status !== 'string' || !TASK_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      updates.status = body.status
    }
    if (!Object.keys(updates).length) return NextResponse.json({ success: true })

    const { error } = await ctx.supabase.from('tasks').update(updates).eq('id', itemId).eq('job_id', id)
    if (error) {
      console.error('[tasks] update failed:', error)
      return NextResponse.json({ error: 'Could not save the task. Please try again.' }, { status: 500 })
    }
    if (typeof updates.status === 'string') await logActivity(ctx, id, 'Task status', updates.status)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Invalid input' }, { status: 400 })
  }
}

export async function DELETE(_request: Request, { params }: P) {
  const { id, itemId } = await params
  const ctx = await authForJob(id)
  if (ctx instanceof NextResponse) return ctx
  if (!UUID_REGEX.test(itemId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  const { error } = await ctx.supabase.from('tasks').delete().eq('id', itemId).eq('job_id', id)
  if (error) return NextResponse.json({ error: 'Could not delete the task.' }, { status: 500 })
  return NextResponse.json({ success: true })
}
