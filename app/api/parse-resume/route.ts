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

    const formData = await req.formData()
    const file = formData.get('file') as File | null

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

    const result = await mammoth.extractRawText({ buffer })
    const text = result.value.trim()

    if (!text) {
      return Response.json({ error: 'Could not extract text from document.' }, { status: 400 })
    }

    return Response.json({ text })
  } catch (err) {
    console.error('[v0] parse-resume error:', err)
    return Response.json({ error: 'Failed to parse document.' }, { status: 500 })
  }
}
