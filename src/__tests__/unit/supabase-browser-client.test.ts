import { beforeEach, describe, expect, it, vi } from 'vitest'

const createBrowserClientMock = vi.fn(() => ({ auth: {} }))

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: createBrowserClientMock,
}))

describe('Supabase browser client', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-key')
  })

  it('reuses one client so only one token refresher is created per tab', async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const first = createClient()
    const second = createClient()

    expect(first).toBe(second)
    expect(createBrowserClientMock).toHaveBeenCalledTimes(1)
  })
})
