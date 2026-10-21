import { getCurrentUser } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sanitizeInput, validateLength } from '@/lib/validation'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const VALID_DOC_TYPES = ['resume', 'cover_letter', 'cv', 'other']
const MAX_DOC_CONTENT = 100000 // 100k chars
const MAX_DOC_NAME = 200

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ?id=<uuid> returns one document with its full text (the list view only carries metadata).
    const id = new URL(request.url).searchParams.get('id')
    if (id) {
      if (!UUID_REGEX.test(id)) return NextResponse.json({ error: 'Valid document ID required' }, { status: 400 })
      const { data, error } = await supabase.from('user_documents').select('*').eq('id', id).eq('user_id', user.id).maybeSingle()
      if (error) return NextResponse.json({ error: 'Failed to fetch document. Please try again.' }, { status: 500 })
      if (!data) return NextResponse.json({ error: 'Document not found' }, { status: 404 })
      return NextResponse.json(data)
    }

    const { data, error } = await supabase
      .from('user_documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[user-documents] Error fetching documents:', error)
      return NextResponse.json({ error: 'Failed to fetch documents. Please try again.' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[v0] API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { documentType, name, content, isDefault, jobId } = body as {
      documentType?: unknown
      name?: unknown
      content?: unknown
      isDefault?: unknown
      jobId?: unknown
    }

    if (typeof documentType !== 'string' || typeof name !== 'string' || typeof content !== 'string') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (!VALID_DOC_TYPES.includes(documentType)) {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 })
    }
    if (!name.trim() || !validateLength(name, MAX_DOC_NAME)) {
      return NextResponse.json({ error: 'Invalid document name' }, { status: 400 })
    }
    if (!content.trim() || !validateLength(content, MAX_DOC_CONTENT)) {
      return NextResponse.json({ error: 'Document content is missing or too large' }, { status: 400 })
    }

    const cleanName = sanitizeInput(name)

    // If this is set as default, unset other defaults of same type
    if (isDefault) {
      await supabase
        .from('user_documents')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('document_type', documentType)
    }

    // A tailored CV / cover letter is tied to the job it was made for.
    let linkedJobId: string | null = null
    if (jobId !== undefined && jobId !== null) {
      if (typeof jobId !== 'string' || !UUID_REGEX.test(jobId)) {
        return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 })
      }
      const { data: owned } = await supabase.from('jobs').select('id').eq('id', jobId).eq('user_id', user.id).maybeSingle()
      if (!owned) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
      linkedJobId = jobId
    }

    const row: Record<string, unknown> = {
      user_id: user.id,
      document_type: documentType,
      name: cleanName,
      content,
      is_default: isDefault === true,
    }

    let { data, error } = await (supabase as any)
      .from('user_documents')
      .insert(linkedJobId ? { ...row, job_id: linkedJobId } : row)
      .select()
      .single()

    // Migration 013 adds user_documents.job_id. Until it is applied, save without the link.
    if (linkedJobId && (error?.code === '42703' || error?.code === 'PGRST204')) {
      ;({ data, error } = await (supabase as any).from('user_documents').insert(row).select().single())
    }

    if (error || !data) {
      console.error('[user-documents] Error creating document:', error)
      return NextResponse.json({ error: 'Failed to save document. Please try again.' }, { status: 500 })
    }

    if (linkedJobId) {
      await supabase.from('activity_logs').insert({
        job_id: linkedJobId,
        user_id: user.id,
        action: documentType === 'cover_letter' ? 'Cover letter approved' : 'Tailored CV approved',
        new_value: cleanName,
      })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[user-documents] API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Valid document ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('user_documents')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('[user-documents] Error deleting document:', error)
      return NextResponse.json({ error: 'Failed to delete document. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[user-documents] API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
