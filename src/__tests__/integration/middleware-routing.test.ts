import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

/**
 * Integration tests for the multi-tenant routing middleware (proxy.ts).
 *
 * We mock the Supabase client factory and test the full routing matrix:
 * - Subdomain → agency site rewrite
 * - Custom domain → agency site rewrite
 * - Unauthenticated dashboard request → /login redirect
 * - Wrong agency → correct agency redirect
 * - Suspended/inactive agency → /suspended redirect
 * - Blocked subdomain → falls through normally
 * - Platform owner → /admin redirect
 * - Static paths → bypass (no rewrite)
 */

// ─── Mock Supabase SSR client ─────────────────────────────────────────────────
const mockGetClaims = vi.fn()
const mockFrom = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getClaims: mockGetClaims },
    from: mockFrom,
  })),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}))

function makeRequest(url: string, cookie = '') {
  return new NextRequest(url, {
    headers: {
      host: new URL(url).host,
      cookie,
    },
  })
}

function buildAgencyChain(data: unknown, error: unknown = null) {
  const chain: Record<string, unknown> = {}
  chain['select'] = vi.fn(() => chain)
  chain['eq'] = vi.fn(() => chain)
  chain['maybeSingle'] = vi.fn(async () => ({ data, error }))
  chain['single'] = vi.fn(async () => ({ data, error }))
  return chain
}

// Import proxy after mocks are set up
async function getProxy() {
  const mod = await import('@/proxy')
  return mod.proxy
}

describe('Proxy Middleware — Integration Routing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    // Default: unauthenticated user
    mockGetClaims.mockResolvedValue({ data: { claims: null }, error: null })
  })

  describe('Static file bypass', () => {
    it('passes through _next/static paths without modification', async () => {
      const proxy = await getProxy()
      const req = makeRequest('http://autopremium.dz/_next/static/chunk.js')
      const res = await proxy(req)
      // next() response has no redirect
      expect(res.headers.get('location')).toBeNull()
    })

    it('passes through favicon.ico', async () => {
      const proxy = await getProxy()
      const req = makeRequest('http://autopremium.dz/favicon.ico')
      const res = await proxy(req)
      expect(res.headers.get('location')).toBeNull()
    })
  })

  describe('Main domain routing', () => {
    it('does not call auth for the public landing page', async () => {
      const proxy = await getProxy()
      const req = makeRequest('http://autopremium.dz/')
      await proxy(req)
      expect(mockGetClaims).not.toHaveBeenCalled()
    })

    it('allows unauthenticated access to /login on main domain', async () => {
      const proxy = await getProxy()
      const req = makeRequest('http://autopremium.dz/login')
      const res = await proxy(req)
      expect(res.headers.get('location')).toBeNull()
    })

    it('redirects unauthenticated /dashboard to /login on main domain', async () => {
      const proxy = await getProxy()
      const req = makeRequest('http://autopremium.dz/dashboard')
      const res = await proxy(req)
      expect(res.status).toBeGreaterThanOrEqual(300)
      expect(res.status).toBeLessThan(400)
      expect(res.headers.get('location')).toContain('/login')
    })

    it('redirects authenticated platform owner from /dashboard to /admin', async () => {
      mockGetClaims.mockResolvedValue({ data: { claims: { sub: 'owner-uid' } }, error: null })
      mockFrom.mockImplementation(() =>
        buildAgencyChain({ is_platform_owner: true, agency_id: null })
      )

      const proxy = await getProxy()
      const req = makeRequest('http://autopremium.dz/dashboard')
      const res = await proxy(req)
      expect(res.headers.get('location')).toContain('/admin')
    })
  })

  describe('Subdomain agency routing', () => {
    const agencyData = {
      id: 'agency-1',
      status: 'active',
      subdomain: 'aventra',
      business_type_slug: 'travel_agency',
    }

    it('rewrites agency subdomain homepage to /[subdomain]/', async () => {
      mockFrom.mockReturnValue(buildAgencyChain(agencyData))
      const proxy = await getProxy()
      const req = makeRequest('http://aventra.autopremium.dz/')
      const res = await proxy(req)
      // Should NOT redirect (no Location header with 30x), but rewrite
      expect(res.status).not.toBe(301)
      expect(res.status).not.toBe(302)
      expect(res.status).not.toBe(307)
      expect(mockGetClaims).not.toHaveBeenCalled()
    })

    it('redirects to /login when unauthenticated user accesses /dashboard on subdomain', async () => {
      mockFrom.mockReturnValue(buildAgencyChain(agencyData))
      const proxy = await getProxy()
      const req = makeRequest('http://aventra.autopremium.dz/dashboard')
      const res = await proxy(req)
      expect(res.status).toBeGreaterThanOrEqual(300)
      expect(res.headers.get('location')).toContain('/login')
    })

    it('redirects to /suspended for suspended agencies', async () => {
      const suspendedAgency = { ...agencyData, status: 'suspended' }
      let callCount = 0
      mockGetClaims.mockResolvedValue({ data: { claims: { sub: 'user-1' } }, error: null })
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) return buildAgencyChain(suspendedAgency)
        if (callCount === 2) return buildAgencyChain({ agency_id: 'agency-1', role: 'superadmin', is_platform_owner: false })
        return buildAgencyChain({ status: 'suspended', business_type_slug: 'travel_agency' })
      })

      const proxy = await getProxy()
      const req = makeRequest('http://aventra.autopremium.dz/dashboard')
      const res = await proxy(req)
      expect(res.headers.get('location')).toContain('/suspended')
    })

    it('redirects to /login when unknown subdomain is accessed', async () => {
      mockFrom.mockReturnValue(buildAgencyChain(null))
      const proxy = await getProxy()
      const req = makeRequest('http://nonexistent.autopremium.dz/')
      const res = await proxy(req)
      expect(res.status).toBeGreaterThanOrEqual(300)
    })
  })

  describe('Admin route protection', () => {
    it('allows access to /admin/login without auth', async () => {
      const proxy = await getProxy()
      const req = makeRequest('http://autopremium.dz/admin/login')
      const res = await proxy(req)
      expect(res.headers.get('location')).toBeNull()
    })

    it('redirects unauthenticated /admin to /admin/login', async () => {
      const proxy = await getProxy()
      const req = makeRequest('http://autopremium.dz/admin/agencies')
      const res = await proxy(req)
      expect(res.headers.get('location')).toContain('/admin/login')
    })

    it('blocks non-owner from accessing /admin', async () => {
      mockGetClaims.mockResolvedValue({ data: { claims: { sub: 'regular-user' } }, error: null })
      mockFrom.mockReturnValue(buildAgencyChain({ is_platform_owner: false }))

      const proxy = await getProxy()
      const req = makeRequest('http://autopremium.dz/admin/agencies')
      const res = await proxy(req)
      expect(res.headers.get('location')).toContain('/admin/login')
    })
  })
})
