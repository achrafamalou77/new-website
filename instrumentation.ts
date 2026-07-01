/**
 * instrumentation.ts
 *
 * Next.js 16 native instrumentation hook.
 * This file is automatically loaded by Next.js on server startup (not in Edge runtime).
 *
 * Responsibilities:
 * - Initialize Sentry for server-side error capture
 * - Log startup confirmation with platform details
 *
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side Sentry initialization
    const { logger } = await import('@/lib/logger')

    logger.info(
      {
        nodeVersion: process.version,
        env: process.env.NODE_ENV,
        sentryEnabled: !!process.env.SENTRY_DSN,
      },
      '🚀 SaaS Platform server starting'
    )

    if (process.env.SENTRY_DSN) {
      const Sentry = await import('@sentry/nextjs')
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV ?? 'production',
        // Use git commit SHA as release for source map attribution
        release: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GIT_COMMIT_SHA ?? undefined,
        // Capture 100% of traces in dev, 10% in production (adjust as needed)
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        // Ignore noisy non-actionable errors
        ignoreErrors: [
          'NEXT_NOT_FOUND',
          'NEXT_REDIRECT',
          'AbortError',
          'The operation was aborted',
        ],
        beforeSend(event) {
          // Scrub sensitive data from Sentry payloads
          if (event.request?.cookies) {
            delete event.request.cookies
          }
          return event
        },
      })

      logger.info({ dsn: process.env.SENTRY_DSN?.slice(0, 20) + '...' }, '✅ Sentry initialized')
    } else {
      logger.warn('SENTRY_DSN not set — error capture disabled. Set it in .env.local for local Sentry testing.')
    }
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime: Sentry Edge SDK (lighter footprint)
    if (process.env.SENTRY_DSN) {
      const Sentry = await import('@sentry/nextjs')
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV ?? 'production',
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,
      })
    }
  }
}
