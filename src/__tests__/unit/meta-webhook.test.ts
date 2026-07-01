import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

/**
 * Unit tests for the Meta Webhook route handler.
 * Tests verification (GET) and event routing (POST) for WhatsApp, Instagram, Facebook.
 */

// ─── Mock Supabase admin client ───────────────────────────────────────────────
const mockSupabaseFrom = vi.fn()
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({ from: mockSupabaseFrom })),
}))

// ─── Mock fetch for n8n forwarding ────────────────────────────────────────────
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function buildMockChain(data: unknown, error: unknown = null) {
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'eq', 'maybeSingle']
  for (const m of methods) {
    chain[m] = vi.fn(() => chain)
  }
  chain['maybeSingle'] = vi.fn(async () => ({ data, error }))
  return chain
}

async function importHandler() {
  return import('@/app/api/meta/webhook/route')
}

describe('Meta Webhook — GET (verification)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 400 for missing verification params', async () => {
    const { GET } = await importHandler()
    const req = new NextRequest('http://localhost/api/meta/webhook?hub.mode=subscribe')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  it('returns 403 when verify token not found in database', async () => {
    mockSupabaseFrom.mockReturnValue(buildMockChain(null))
    const { GET } = await importHandler()
    const url = 'http://localhost/api/meta/webhook?hub.mode=subscribe&hub.verify_token=bad-token&hub.challenge=challenge123'
    const req = new NextRequest(url)
    const res = await GET(req)
    expect(res.status).toBe(403)
  })

  it('returns the challenge string on valid verify token', async () => {
    const integrationData = { agency_id: 'agency-1', n8n_webhook_url: 'https://n8n.example.com/webhook' }
    mockSupabaseFrom.mockReturnValue(buildMockChain(integrationData))

    const { GET } = await importHandler()
    const url = 'http://localhost/api/meta/webhook?hub.mode=subscribe&hub.verify_token=valid-token&hub.challenge=my-challenge-xyz'
    const req = new NextRequest(url)
    const res = await GET(req)
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toBe('my-challenge-xyz')
  })
})

describe('Meta Webhook — POST (event processing)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 immediately for empty or invalid body', async () => {
    const { POST } = await importHandler()
    const req = new NextRequest('http://localhost/api/meta/webhook', {
      method: 'POST',
      body: 'bad-json',
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
  })

  it('returns 200 immediately for valid WhatsApp payload and forwards to n8n', async () => {
    const integrationData = {
      agency_id: 'agency-1',
      n8n_webhook_url: 'https://n8n.example.com/hook',
      whatsapp_access_token: 'test-token',
      whatsapp_phone_number_id: 'phone-id-123',
      whatsapp_enabled: true,
    }
    mockSupabaseFrom.mockReturnValue(buildMockChain(integrationData))
    mockFetch.mockResolvedValueOnce({ ok: true } as Response)

    const { POST } = await importHandler()
    const body = {
      object: 'whatsapp_business_account',
      entry: [{ changes: [{ value: { metadata: { phone_number_id: 'phone-id-123' } } }] }],
    }
    const req = new NextRequest('http://localhost/api/meta/webhook', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    await new Promise(r => setTimeout(r, 50))
    expect(mockFetch).toHaveBeenCalledWith(
      'https://n8n.example.com/hook',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('uses the native inbox processor when n8n is not configured', async () => {
    const integrationData = {
      agency_id: 'agency-native',
      n8n_webhook_url: null,
      whatsapp_access_token: 'test-token',
      whatsapp_phone_number_id: 'phone-id-123',
      whatsapp_enabled: true,
    }
    mockSupabaseFrom.mockReturnValue(buildMockChain(integrationData))
    mockFetch.mockResolvedValueOnce({ ok: true } as Response)

    const { POST } = await importHandler()
    const body = {
      object: 'whatsapp_business_account',
      entry: [{ changes: [{ value: { metadata: { phone_number_id: 'phone-id-123' } } }] }],
    }
    const req = new NextRequest('http://localhost/api/meta/webhook', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    await new Promise(r => setTimeout(r, 50))
    expect(mockFetch).toHaveBeenCalledWith(
      new URL('/api/meta/process', 'http://localhost'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"agency-native"'),
      })
    )
  })

  it('falls back to the native inbox processor when n8n forwarding fails', async () => {
    const integrationData = {
      agency_id: 'agency-fallback',
      n8n_webhook_url: 'https://n8n.example.com/hook',
      whatsapp_access_token: 'test-token',
      whatsapp_phone_number_id: 'phone-id-123',
      whatsapp_enabled: true,
    }
    mockSupabaseFrom.mockReturnValue(buildMockChain(integrationData))
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 500 } as Response)
      .mockResolvedValueOnce({ ok: true } as Response)

    const { POST } = await importHandler()
    const body = {
      object: 'whatsapp_business_account',
      entry: [{ changes: [{ value: { metadata: { phone_number_id: 'phone-id-123' } } }] }],
    }
    const req = new NextRequest('http://localhost/api/meta/webhook', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    await new Promise(r => setTimeout(r, 50))
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      new URL('/api/meta/process', 'http://localhost'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"agency-fallback"'),
      })
    )
  })

  it('returns 200 for Facebook page event', async () => {
    const integrationData = {
      agency_id: 'agency-2',
      n8n_webhook_url: 'https://n8n.example.com/hook',
      facebook_page_id: 'page-456',
      facebook_enabled: true,
    }
    mockSupabaseFrom.mockReturnValue(buildMockChain(integrationData))
    mockFetch.mockResolvedValueOnce({ ok: true } as Response)

    const { POST } = await importHandler()
    const body = {
      object: 'page',
      entry: [{ id: 'page-456', messaging: [] }],
    }
    const req = new NextRequest('http://localhost/api/meta/webhook', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
  })

  it('does not call n8n when no integration is found', async () => {
    mockSupabaseFrom.mockReturnValue(buildMockChain(null))
    mockFetch.mockClear()

    const { POST } = await importHandler()
    const body = {
      object: 'whatsapp_business_account',
      entry: [{ changes: [{ value: { metadata: { phone_number_id: 'unknown-phone-id' } } }] }],
    }
    const req = new NextRequest('http://localhost/api/meta/webhook', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    // Allow async processing — fetch should NOT be called since no integration found
    await new Promise(r => setTimeout(r, 50))
    expect(mockFetch).not.toHaveBeenCalled()
  })
})
