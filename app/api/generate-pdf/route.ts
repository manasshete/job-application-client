import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.error('[v0] generate-pdf: Not authenticated')
      return new Response('Unauthorized', { status: 401 })
    }

    const { content, filename } = await req.json()

    if (!content) {
      console.error('[v0] generate-pdf: No content provided')
      return new Response('Content is required', { status: 400 })
    }

    console.log('[v0] generate-pdf: Starting PDF generation, filename:', filename)

    const pdfDoc = await PDFDocument.create()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const pageWidth = 595   // A4
    const pageHeight = 842  // A4
    const margin = 50
    const maxWidth = pageWidth - margin * 2
    const lineHeight = 14
    const fontSize = 10

    let page = pdfDoc.addPage([pageWidth, pageHeight])
    let y = pageHeight - margin

    const lines = content.split('\n')

    for (const rawLine of lines) {
      const line = rawLine.trimEnd()

      // Detect headings (all caps lines or lines ending with colon)
      const isHeading =
        (line === line.toUpperCase() && line.trim().length > 2 && /[A-Z]/.test(line)) ||
        line.trim().endsWith(':')

      const currentFont = isHeading ? boldFont : font
      const currentSize = isHeading ? 11 : fontSize

      // Word wrap
      const words = line.split(' ')
      let currentLineText = ''

      for (const word of words) {
        const testLine = currentLineText ? `${currentLineText} ${word}` : word
        const textWidth = currentFont.widthOfTextAtSize(testLine, currentSize)

        if (textWidth > maxWidth && currentLineText) {
          // New page if needed
          if (y - lineHeight < margin) {
            page = pdfDoc.addPage([pageWidth, pageHeight])
            y = pageHeight - margin
          }

          page.drawText(currentLineText, {
            x: margin,
            y,
            size: currentSize,
            font: currentFont,
            color: rgb(0.1, 0.1, 0.1),
          })
          y -= lineHeight
          currentLineText = word
        } else {
          currentLineText = testLine
        }
      }

      // Draw remaining text
      if (currentLineText) {
        if (y - lineHeight < margin) {
          page = pdfDoc.addPage([pageWidth, pageHeight])
          y = pageHeight - margin
        }

        page.drawText(currentLineText, {
          x: margin,
          y,
          size: currentSize,
          font: currentFont,
          color: isHeading ? rgb(0.05, 0.05, 0.05) : rgb(0.15, 0.15, 0.15),
        })
      }

      // Extra space after headings
      y -= isHeading ? lineHeight * 1.4 : lineHeight

      // Empty line spacing
      if (line.trim() === '') {
        y -= lineHeight * 0.5
      }
    }

    const pdfBytes = await pdfDoc.save()
    console.log('[v0] generate-pdf: PDF generated successfully, size:', pdfBytes.length)

    return new Response(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename || 'document.pdf'}"`,
      },
    })
  } catch (err) {
    console.error('[v0] generate-pdf error:', err instanceof Error ? err.message : String(err))
    return new Response('Failed to generate PDF', { status: 500 })
  }
}
