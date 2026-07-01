import { describe, it, expect } from 'vitest'

/**
 * Unit tests for the hostname/routing logic extracted from proxy.ts.
 * These test the pure decision functions without mocking Supabase.
 */

// ─── Helpers mirrored from proxy.ts ──────────────────────────────────────────
const BLOCKED_SUBDOMAINS = ['www', 'admin', 'api', 'app', 'dashboard', 'login', 'onboarding', 'supabase', 'vercel']

function parseHost(hostname: string) {
  const hostParts = hostname.split(':')
  const hostNoPort = hostParts[0].replace(/^www\./, '')
  const subdomain = hostNoPort.split('.')[0]

  const isLocalhost =
    hostNoPort === 'localhost' ||
    hostNoPort === '127.0.0.1' ||
    hostNoPort === 'lvh.me' ||
    hostNoPort.endsWith('.localhost') ||
    hostNoPort.endsWith('.lvh.me')

  const hasSubdomain =
    !BLOCKED_SUBDOMAINS.includes(subdomain) &&
    ((isLocalhost &&
      ((hostNoPort.endsWith('.localhost') && subdomain !== 'localhost') ||
        (hostNoPort.endsWith('.lvh.me') && hostNoPort !== 'lvh.me'))) ||
      (!isLocalhost && hostNoPort.split('.').length > 2))

  return { hostNoPort, subdomain, isLocalhost, hasSubdomain }
}

function isCustomDomain(cleanHost: string, mainApexDomain: string): boolean {
  return (
    cleanHost !== 'localhost' &&
    cleanHost !== '127.0.0.1' &&
    cleanHost !== mainApexDomain &&
    !cleanHost.endsWith('.' + mainApexDomain)
  )
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('parseHost — subdomain detection', () => {
  it('detects agency subdomain on production domain', () => {
    const result = parseHost('aventra.autopremium.dz')
    expect(result.subdomain).toBe('aventra')
    expect(result.hasSubdomain).toBe(true)
    expect(result.isLocalhost).toBe(false)
  })

  it('detects agency subdomain on local lvh.me', () => {
    const result = parseHost('myagency.lvh.me:3000')
    expect(result.subdomain).toBe('myagency')
    expect(result.hasSubdomain).toBe(true)
    expect(result.isLocalhost).toBe(true)
  })

  it('does NOT detect subdomain on base domain', () => {
    const result = parseHost('autopremium.dz')
    expect(result.hasSubdomain).toBe(false)
  })

  it('does NOT detect subdomain for blocked names', () => {
    const blockedHosts = [
      'admin.autopremium.dz',
      'api.autopremium.dz',
      'dashboard.autopremium.dz',
      'www.autopremium.dz',
    ]
    for (const host of blockedHosts) {
      const result = parseHost(host)
      expect(result.hasSubdomain).toBe(false)
    }
  })

  it('strips www prefix correctly', () => {
    const result = parseHost('www.autopremium.dz')
    expect(result.hostNoPort).toBe('autopremium.dz')
    expect(result.hasSubdomain).toBe(false)
  })

  it('handles ports correctly', () => {
    const result = parseHost('localhost:3000')
    expect(result.hostNoPort).toBe('localhost')
    expect(result.isLocalhost).toBe(true)
    expect(result.hasSubdomain).toBe(false)
  })

  it('handles lvh.me base domain without subdomain', () => {
    const result = parseHost('lvh.me:3000')
    expect(result.isLocalhost).toBe(true)
    expect(result.hasSubdomain).toBe(false)
  })
})

describe('isCustomDomain — custom apex domain detection', () => {
  const apexDomain = 'autopremium.dz'

  it('identifies a truly custom domain', () => {
    expect(isCustomDomain('myagency.com', apexDomain)).toBe(true)
    expect(isCustomDomain('besttravel.dz', apexDomain)).toBe(true)
  })

  it('does NOT flag platform subdomains as custom domains', () => {
    expect(isCustomDomain('aventra.autopremium.dz', apexDomain)).toBe(false)
  })

  it('does NOT flag the apex domain itself as custom', () => {
    expect(isCustomDomain('autopremium.dz', apexDomain)).toBe(false)
  })

  it('does NOT flag localhost as a custom domain', () => {
    expect(isCustomDomain('localhost', apexDomain)).toBe(false)
  })
})

describe('Vertical route isolation logic', () => {
  const travelRoutes = ['/dashboard/trips', '/dashboard/visa', '/dashboard/bookings']
  const showroomRoutes = ['/dashboard/management']

  function shouldBlockRoute(path: string, businessTypeSlug: string): boolean {
    const isCarShowroom = businessTypeSlug === 'car_showroom'
    if (isCarShowroom) {
      return travelRoutes.some(route => path.startsWith(route))
    } else {
      return showroomRoutes.some(route => path.startsWith(route))
    }
  }

  it('blocks travel agency routes from car showroom users', () => {
    expect(shouldBlockRoute('/dashboard/trips', 'car_showroom')).toBe(true)
    expect(shouldBlockRoute('/dashboard/visa', 'car_showroom')).toBe(true)
    expect(shouldBlockRoute('/dashboard/bookings', 'car_showroom')).toBe(true)
  })

  it('allows showroom-specific routes for car showroom users', () => {
    expect(shouldBlockRoute('/dashboard/management', 'car_showroom')).toBe(false)
    expect(shouldBlockRoute('/dashboard/inbox', 'car_showroom')).toBe(false)
  })

  it('blocks showroom routes from travel agency users', () => {
    expect(shouldBlockRoute('/dashboard/management', 'travel_agency')).toBe(true)
  })

  it('allows travel routes for travel agency users', () => {
    expect(shouldBlockRoute('/dashboard/trips', 'travel_agency')).toBe(false)
    expect(shouldBlockRoute('/dashboard/visa', 'travel_agency')).toBe(false)
  })

  it('allows shared routes for both verticals', () => {
    const sharedRoutes = ['/dashboard', '/dashboard/inbox', '/dashboard/clients', '/dashboard/finance']
    for (const route of sharedRoutes) {
      expect(shouldBlockRoute(route, 'car_showroom')).toBe(false)
      expect(shouldBlockRoute(route, 'travel_agency')).toBe(false)
    }
  })
})
