/**
 * src/lib/sentry.ts
 *
 * Thin Sentry wrapper for error and message capture.
 *
 * Usage:
 *   import { captureException, captureMessage } from '@/lib/sentry'
 *   captureException(err, { agencyId, path: '/api/billing/webhook' })
 *   captureMessage('Plan upgrade failed', 'warning', { transactionId })
 *
 * No-ops gracefully when SENTRY_DSN is not set (local dev without Sentry).
 */

import * as SentrySDK from '@sentry/nextjs'

export type SentryLevel = 'debug' | 'info' | 'warning' | 'error' | 'fatal'

/**
 * Captures an exception with structured context attached.
 * The context object is added as Sentry "extra" data for debugging.
 */
export function captureException(
  error: unknown,
  context?: Record<string, unknown>
): void {
  const dsn = process.env.SENTRY_DSN
  if (!dsn || process.env.NODE_ENV === 'test') return

  SentrySDK.withScope(scope => {
    if (context) {
      // Tag key fields for Sentry filtering
      const taggableKeys = ['agencyId', 'userId', 'path', 'platform', 'transactionId']
      for (const key of taggableKeys) {
        if (context[key]) {
          scope.setTag(key, String(context[key]))
        }
      }
      scope.setExtras(context)
    }
    SentrySDK.captureException(error)
  })
}

/**
 * Captures a plain message with level and optional context.
 * Useful for non-error anomalies (e.g., unexpected webhook payload shapes).
 */
export function captureMessage(
  message: string,
  level: SentryLevel = 'info',
  context?: Record<string, unknown>
): void {
  const dsn = process.env.SENTRY_DSN
  if (!dsn || process.env.NODE_ENV === 'test') return

  SentrySDK.withScope(scope => {
    if (context) {
      scope.setExtras(context)
    }
    SentrySDK.captureMessage(message, level)
  })
}

/**
 * Set user context for the current Sentry scope.
 * Call this after authentication in middleware/server actions.
 */
export function setSentryUser(user: { id: string; email?: string; agencyId?: string }): void {
  const dsn = process.env.SENTRY_DSN
  if (!dsn || process.env.NODE_ENV === 'test') return

  SentrySDK.setUser({
    id: user.id,
    email: user.email,
  })
  if (user.agencyId) {
    SentrySDK.setTag('agencyId', user.agencyId)
  }
}
