/**
 * src/lib/logger.ts
 *
 * Structured Pino logger for the SaaS platform.
 *
 * Usage:
 *   import { logger } from '@/lib/logger'
 *   logger.info({ agencyId, path }, 'Request processed')
 *   logger.error({ err, transactionId }, 'Billing webhook failed')
 *
 * In production: outputs JSON to stdout (captured by Vercel/Railway log drains)
 * In development: human-readable pretty output via pino-pretty
 * In test: silenced (LOG_LEVEL=silent via vitest.setup.ts)
 */

import pino from 'pino'

const isDev = process.env.NODE_ENV === 'development'
const isTest = process.env.NODE_ENV === 'test'
const logLevel = process.env.LOG_LEVEL ?? (isTest ? 'silent' : isDev ? 'debug' : 'info')

export const logger = pino(
  {
    level: logLevel,
    // Add base fields to every log line
    base: {
      env: process.env.NODE_ENV,
      service: 'saas-platform',
    },
    // Format timestamps as ISO strings in production for log drain compatibility
    timestamp: pino.stdTimeFunctions.isoTime,
    // Serialize Error objects automatically
    serializers: {
      err: pino.stdSerializers.err,
      error: pino.stdSerializers.err,
    },
    // Redact sensitive fields — never log these raw values
    redact: {
      paths: [
        'accessToken',
        'whatsapp_access_token',
        'facebook_page_access_token',
        'SUPABASE_SERVICE_ROLE_KEY',
        'OPENAI_API_KEY',
        'GEMINI_API_KEY',
        '*.password',
        '*.token',
        '*.secret',
      ],
      censor: '[REDACTED]',
    },
  },
  isDev && !isTest
    ? pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname,service',
          messageFormat: '[{service}] {msg}',
        },
      })
    : undefined
)

/**
 * Create a child logger pre-tagged with agency and request context.
 * Use this in API routes and server actions for consistent log correlation.
 *
 * Example:
 *   const reqLog = createRequestLogger({ agencyId, userId, path: '/api/meta/webhook' })
 *   reqLog.info('Webhook received')
 */
export function createRequestLogger(context: {
  agencyId?: string
  userId?: string
  path?: string
  method?: string
  platform?: string
  [key: string]: unknown
}) {
  return logger.child(context)
}
