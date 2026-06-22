import * as Sentry from '@sentry/nextjs'

/**
 * Capture an error in an API route and return a 500 response.
 * Use this in API route try-catch blocks to automatically log errors to Sentry.
 */
export function captureApiError(error: unknown, context?: Record<string, unknown>) {
  const err = error instanceof Error ? error : new Error(String(error))
  Sentry.captureException(err, {
    contexts: {
      api: context,
    },
  })
  return err
}

/**
 * Wrap an async API handler to automatically catch and report errors.
 */
export function withSentryErrorHandler<T extends (...args: any[]) => Promise<any>>(
  handler: T
): T {
  return (async (...args: any[]) => {
    try {
      return await handler(...args)
    } catch (error) {
      captureApiError(error)
      throw error
    }
  }) as T
}
