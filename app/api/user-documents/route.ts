import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sanitizeInput, validateLength } from '@/lib/validation'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const VALID_DOC_TYPES = ['resume', 'cover_letter', 'cv', 'other']
const MAX_DOC_CONTENT = 100000 // 100k chars
const MAX_DOC_NAME = 200

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('user_documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] Error fetching documents:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
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
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { documentType, name, content, isDefault } = body as {
      documentType?: unknown
      name?: unknown
      content?: unknown
      isDefault?: unknown
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

    const { data, error } = await supabase
      .from('user_documents')
      .insert({
        user_id: user.id,
        document_type: documentType,
        name: cleanName,
        content,
        is_default: isDefault === true,
      })
      .select()
      .single()

    if (error) {
      console.error('[v0] Error creating document:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[v0] API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

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
      console.error('[v0] Error deleting document:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
