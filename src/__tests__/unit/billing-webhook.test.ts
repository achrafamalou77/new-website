import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

/**
 * Unit tests for the Billing Webhook route handler.
 * Mocks the Supabase admin client to isolate handler logic.
 */

// ─── Mock Supabase admin client ───────────────────────────────────────────────
const mockSupabaseFrom = vi.fn()
const mockAdminClient = { from: mockSupabaseFrom }

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => mockAdminClient),
}))

// ─── Helper to build mock chain ───────────────────────────────────────────────
function buildMockChain(data: unknown, error: unknown = null) {
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'eq', 'update', 'maybeSingle', 'single']
  for (const m of methods) {
    chain[m] = vi.fn(() => chain)
  }
  chain['maybeSingle'] = vi.fn(async () => ({ data, error }))
  chain['single'] = vi.fn(async () => ({ data, error }))
  return chain
}

// ─── Import after mocking ─────────────────────────────────────────────────────
// Dynamic import avoids "module evaluated before mock" issues
async function importHandler() {
  const mod = await import('@/app/api/billing/webhook/route')
  return mod.POST
}

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/billing/webhook', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', signature: 'test-sig' },
  })
}

describe('Billing Webhook Route Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 for invalid JSON body', async () => {
    const POST = await importHandler()
    const req = new NextRequest('http://localhost/api/billing/webhook', {
      method: 'POST',
      body: 'not-valid-json',
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.success).toBe(false)
  })

  it('returns 400 when transaction_id is missing', async () => {
    const POST = await importHandler()
    const req = makeRequest({ type: 'checkout.paid', data: { status: 'paid', metadata: {} } })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/missing transaction/i)
  })

  it('returns 404 when ledger record not found in database', async () => {
    // Mock: ledger lookup returns null
    const chain = buildMockChain(null)
    mockSupabaseFrom.mockReturnValue(chain)

    const POST = await importHandler()
    const req = makeRequest({
      type: 'checkout.paid',
      data: { status: 'paid', id: 'txn-123', metadata: { transaction_id: 'txn-123' } },
    })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })

  it('returns 200 on successful "paid" event and upgrades agency plan', async () => {
    // First call: find ledger
    const ledgerData = { id: 'ledger-1', agency_id: 'agency-1', plan_id: 'pro', status: 'pending' }
    const planData = { id: 'pro', ai_credits_monthly: 1000 }

    let callCount = 0
    mockSupabaseFrom.mockImplementation((table: string) => {
      callCount++
      if (table === 'subscriptions_ledgers' && callCount === 1) {
        return buildMockChain(ledgerData)
      }
      if (table === 'plans') {
        return buildMockChain(planData)
      }
      // Update calls
      const updateChain: Record<string, unknown> = {}
      updateChain['update'] = vi.fn(() => updateChain)
      updateChain['eq'] = vi.fn(() => updateChain)
      updateChain['then'] = vi.fn((cb: (v: unknown) => unknown) => Promise.resolve(cb({ error: null })))
      return updateChain
    })

    const POST = await importHandler()
    const req = makeRequest({
      type: 'checkout.paid',
      data: { status: 'paid', id: 'txn-123', metadata: { transaction_id: 'txn-123' } },
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
  })

  it('handles "failed" status event gracefully', async () => {
    const ledgerData = { id: 'ledger-1', agency_id: 'agency-1', plan_id: 'pro', status: 'pending' }

    let firstCall = true
    mockSupabaseFrom.mockImplementation(() => {
      if (firstCall) {
        firstCall = false
        return buildMockChain(ledgerData)
      }
      const chain: Record<string, unknown> = {}
      chain['update'] = vi.fn(() => chain)
      chain['eq'] = vi.fn(() => chain)
      chain['then'] = vi.fn((cb: (v: unknown) => unknown) => Promise.resolve(cb({ error: null })))
      return chain
    })

    const POST = await importHandler()
    const req = makeRequest({
      type: 'checkout.failed',
      data: { status: 'failed', id: 'txn-456', metadata: { transaction_id: 'txn-456' } },
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
  })
})
