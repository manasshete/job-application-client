import { getCurrentUser } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { unescapeHtmlEntities } from '@/lib/validation'

export interface DocMeta {
  id: string
  type: 'cv' | 'cover_letter'
  name: string
  isDefault: boolean
  /** The job it was made for, when linked. */
  jobId: string | null
  createdAt: string
}

const BASE_COLUMNS = 'id, document_type, name, is_default, created_at'

/** Saved documents without their text, newest first. */
export async function getDocuments(): Promise<DocMeta[]> {
  const user = await getCurrentUser()
  if (!user) return []
  const supabase = await createClient()

  let { data, error } = (await supabase.from('user_documents').select(`${BASE_COLUMNS}, job_id`).eq('user_id', user.id).order('created_at', { ascending: false })) as { data: any[] | null; error: { code?: string; message: string } | null }
  // Before migration 013 the job_id column does not exist.
  if (error?.code === '42703') {
    ;({ data, error } = (await supabase.from('user_documents').select(BASE_COLUMNS).eq('user_id', user.id).order('created_at', { ascending: false })) as { data: any[] | null; error: { code?: string; message: string } | null })
  }
  if (error || !data) {
    console.error('[v0] Error fetching documents:', error?.message)
    return []
  }

  return data.map((d: any) => ({
    id: d.id,
    type: d.document_type,
    name: unescapeHtmlEntities(d.name),
    isDefault: !!d.is_default,
    jobId: d.job_id ?? null,
    createdAt: d.created_at,
  }))
}
