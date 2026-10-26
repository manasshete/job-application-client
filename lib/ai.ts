import { google } from '@ai-sdk/google'
import { APICallError, wrapLanguageModel, type LanguageModelMiddleware } from 'ai'

// Gemini models fail often on capacity (503), quota (429) or retirement (404), so each
// tier lists models to try in order. The first one that answers is used.
const RETRYABLE_STATUS = new Set([404, 429, 500, 503])

function shouldFallBack(error: unknown) {
  return APICallError.isInstance(error) && RETRYABLE_STATUS.has(error.statusCode ?? 0)
}

function withFallbacks(modelIds: [string, ...string[]]) {
  const [primary, ...rest] = modelIds
  const fallbacks = rest.map((id) => google(id))

  const middleware: LanguageModelMiddleware = {
    specificationVersion: 'v3',
    async wrapGenerate({ doGenerate, params }) {
      let lastError: unknown
      try {
        return await doGenerate()
      } catch (error) {
        if (!shouldFallBack(error)) throw error
        lastError = error
      }
      for (const model of fallbacks) {
        try {
          return await model.doGenerate(params)
        } catch (error) {
          if (!shouldFallBack(error)) throw error
          lastError = error
        }
      }
      throw lastError
    },
  }

  return wrapLanguageModel({ model: google(primary), middleware })
}

// Long-form writing: resume tailoring and cover letters.
export const writingModel = withFallbacks(['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3-flash-preview', 'gemini-flash-latest'])

// Cheap structured extraction: job details from a page.
export const extractionModel = withFallbacks(['gemini-3.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.1-flash-lite', 'gemini-3.5-flash'])
