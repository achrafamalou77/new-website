import '@testing-library/jest-dom'
import { vi } from 'vitest'

// ─── Environment Variables ───────────────────────────────────────────────────────────────────
// Stub env vars so server-side files import without throwing
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.OPENAI_API_KEY = 'test-openai-key'
process.env.GEMINI_API_KEY = 'test-gemini-key'
process.env.SENTRY_DSN = ''
process.env.LOG_LEVEL = 'silent'
// NODE_ENV is read-only in TypeScript — Vitest sets it to 'test' automatically

// ─── Next.js Module Stubs ──────────────────────────────────────────────────────
// Prevent "next/headers must be used in a Server Component" errors in tests
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  })),
  headers: vi.fn(() => ({
    get: vi.fn(() => null),
  })),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  notFound: vi.fn(),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}))

// ─── Pino Logger Stub ──────────────────────────────────────────────────────────
// Silence log output during tests
const silentLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  child: vi.fn(function() { return silentLogger }),
}

vi.mock('@/lib/logger', () => ({
  logger: silentLogger,
  createRequestLogger: vi.fn(() => silentLogger),
}))

// ─── Sentry Stub ──────────────────────────────────────────────────────────────
vi.mock('@/lib/sentry', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}))
