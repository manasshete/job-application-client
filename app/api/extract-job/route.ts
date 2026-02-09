import { generateText, Output } from 'ai'
import { z } from 'zod'

const jobDetailsSchema = z.object({
  company: z.string().nullable(),
  position: z.string().nullable(),
  location: z.string().nullable(),
  salary: z.string().nullable(),
  description: z.string().nullable(),
})

export async function POST(req: Request) {
  try {
    const { url } = await req.json()

    if (!url) {
      return Response.json({ error: 'URL is required' }, { status: 400 })
    }

    // Fetch the job posting HTML
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    })

    if (!response.ok) {
      return Response.json(
        { error: 'Failed to fetch job posting' },
        { status: 400 }
      )
    }

    const html = await response.text()

    // Use AI to extract job details
    const result = await generateText({
      model: 'openai/gpt-4o-mini',
      output: Output.object({
        schema: jobDetailsSchema,
      }),
      messages: [
        {
          role: 'system',
          content:
            'You are a job posting analyzer. Extract the following information from the HTML content: company name, job position/title, location, salary range (if mentioned), and a brief description. Return null for any field that cannot be found.',
        },
        {
          role: 'user',
          content: `Extract job details from this HTML:\n\n${html.slice(0, 15000)}`,
        },
      ],
    })

    return Response.json(result.output)
  } catch (error) {
    console.error('[v0] Job extraction error:', error)
    return Response.json(
      { error: 'Failed to extract job details' },
      { status: 500 }
    )
  }
}
