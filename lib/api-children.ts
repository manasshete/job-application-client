import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { sanitizeInput, validateLength } from '@/lib/validation'

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/

export const INTERVIEW_STATUSES = ['pending', 'scheduled', 'completed', 'cancelled']
export const TASK_STATUSES = ['pending', 'in-progress', 'completed', 'submitted']

type Ctx = { supabase: Awaited<ReturnType<typeof createClient>>; userId: string }

/** Authenticates and checks the job id; returns either a context or a ready-made error response. */
export async function authForJob(jobId: string): Promise<Ctx | NextResponse> {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!UUID_REGEX.test(jobId)) return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 })
  const supabase = await createClient()
  const { data } = await supabase.from('jobs').select('id').eq('id', jobId).eq('user_id', user.id).maybeSingle()
  if (!data) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  return { supabase, userId: user.id }
}

export async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json()
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : null
  } catch {
    return null
  }
}

export function text(v: unknown, max: number): string | null | undefined {
  if (v === undefined) return undefined
  if (v === null || v === '') return null
  if (typeof v !== 'string' || !validateLength(v, max)) throw new Error('Invalid text')
  return sanitizeInput(v)
}

export function date(v: unknown): string | null | undefined {
  if (v === undefined) return undefined
  if (v === null || v === '') return null
  if (typeof v !== 'string' || !DATE_REGEX.test(v)) throw new Error('Invalid date')
  return v
}

export function time(v: unknown): string | null | undefined {
  if (v === undefined) return undefined
  if (v === null || v === '') return null
  if (typeof v !== 'string' || !TIME_REGEX.test(v)) throw new Error('Invalid time')
  return v
}

export async function logActivity(ctx: Ctx, jobId: string, action: string, newValue?: string, oldValue?: string) {
  await ctx.supabase.from('activity_logs').insert({
    job_id: jobId,
    user_id: ctx.userId,
    action,
    old_value: oldValue ?? null,
    new_value: newValue ?? null,
  })
}
