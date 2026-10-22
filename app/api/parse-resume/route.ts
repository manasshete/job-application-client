import { getCurrentUser } from '@/lib/auth/server'
import mammoth from 'mammoth'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
]

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit to prevent resource-exhaustion abuse.
    const rl = rateLimit(`parse-resume:${user.id}`, 10, 60000)
    if (!rl.success) {
      return Response.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': Math.ceil((rl.resetTime - Date.now()) / 1000).toString() },
        }
      )
    }

    let formData: FormData
    try {
      formData = await req.formData()
    } catch {
      return Response.json({ error: 'Expected a multipart form upload.' }, { status: 400 })
    }
    const entry = formData.get('file')
    const file = entry instanceof File ? entry : null

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return Response.json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 })
    }

    // Only allow Word documents (mammoth only supports these anyway).
    const lowerName = file.name.toLowerCase()
    const hasValidExt = lowerName.endsWith('.docx') || lowerName.endsWith('.doc')
    if ((file.type && !ALLOWED_MIME_TYPES.includes(file.type)) || !hasValidExt) {
      return Response.json(
        { error: 'Unsupported file type. Please upload a .doc or .docx file.' },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let text: string
    try {
      const result = await mammoth.extractRawText({ buffer })
      text = result.value.trim()
    } catch (err) {
      console.error('[parse-resume] mammoth failed:', err)
      return Response.json(
        { error: 'Could not read this document. Please upload a valid .docx file.' },
        { status: 400 }
      )
    }

    if (!text) {
      return Response.json({ error: 'Could not extract text from document.' }, { status: 400 })
    }

    return Response.json({ text })
  } catch (err) {
    console.error('[v0] parse-resume error:', err)
    return Response.json({ error: 'Failed to parse document.' }, { status: 500 })
  }
}
