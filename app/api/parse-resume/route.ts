import { getCurrentUser } from '@/lib/auth/server'
import mammoth from 'mammoth'
import { getDocumentProxy } from 'unpdf'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
  'application/pdf', // .pdf
]

// Rebuilds line breaks from pdf.js text items (end-of-line markers and vertical
// position), since the AI tools rely on the CV's line structure.
async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer))
  const pages: string[] = []
  for (let n = 1; n <= pdf.numPages; n++) {
    const { items } = await (await pdf.getPage(n)).getTextContent()
    let text = ''
    let lastY: number | undefined
    for (const item of items) {
      if (!('str' in item)) continue
      const y = item.transform[5]
      if (lastY !== undefined && Math.abs(y - lastY) > 1 && !text.endsWith('\n')) text += '\n'
      text += item.str
      if (item.hasEOL && !text.endsWith('\n')) text += '\n'
      if (item.str) lastY = y
    }
    pages.push(text.replace(/[ \t]+\n/g, '\n').trim())
  }
  return pages.join('\n\n')
}

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

    // Only allow Word documents and PDFs.
    const lowerName = file.name.toLowerCase()
    const isPdf = lowerName.endsWith('.pdf')
    const hasValidExt = isPdf || lowerName.endsWith('.docx') || lowerName.endsWith('.doc')
    if ((file.type && !ALLOWED_MIME_TYPES.includes(file.type)) || !hasValidExt) {
      return Response.json(
        { error: 'Unsupported file type. Please upload a .pdf, .doc or .docx file.' },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let text: string
    try {
      if (isPdf) {
        text = (await extractPdfText(buffer)).trim()
      } else {
        const result = await mammoth.extractRawText({ buffer })
        text = result.value.trim()
      }
    } catch (err) {
      console.error(`[parse-resume] ${isPdf ? 'pdf' : 'mammoth'} failed:`, err)
      return Response.json(
        { error: `Could not read this document. Please upload a valid ${isPdf ? '.pdf' : '.docx'} file.` },
        { status: 400 }
      )
    }

    if (!text) {
      return Response.json(
        {
          error: isPdf
            ? 'This PDF has no selectable text (it may be a scanned image). Please upload a .docx or paste the text instead.'
            : 'Could not extract text from document.',
        },
        { status: 400 }
      )
    }

    return Response.json({ text })
  } catch (err) {
    console.error('[v0] parse-resume error:', err)
    return Response.json({ error: 'Failed to parse document.' }, { status: 500 })
  }
}
