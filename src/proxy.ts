import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { logger } from '@/lib/logger'
import { getSupabaseCookieOptions } from '@/lib/supabase/cookie-options'
import { canAccessPath } from '@/lib/permissions'
import { isEcommerceBusinessType, normalizeBusinessTypeSlug } from '@/lib/business-types'

const BLOCKED_SUBDOMAINS = ['www', 'admin', 'api', 'app', 'dashboard', 'login', 'onboarding', 'supabase', 'vercel']

// ────────────────────────────────────────────────────────────────────────────────
// IN-MEMORY CACHE — reduces Supabase round trips for profile+agency lookups
// TTL: 5 minutes. Cleared automatically. Works per-worker (Edge middleware).
// ────────────────────────────────────────────────────────────────────────────────
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes
const SUBDOMAIN_AGENCY_TTL_MS = 10 * 60 * 1000 // 10 minutes (rarely changes)

type CachedProfile = { agency_id: string; role: string; is_platform_owner: boolean; cachedAt: number }
type CachedAgency = { id: string; status: string; subdomain: string; business_type_slug: string; cachedAt: number }

const profileCache = new Map<string, CachedProfile>()
const agencyCache = new Map<string, CachedAgency>()
const subdomainAgencyCache = new Map<string, { data: CachedAgency | null; cachedAt: number }>()

function getCachedProfile(userId: string): CachedProfile | null {
  const entry = profileCache.get(userId)
  if (!entry) return null
  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
    profileCache.delete(userId)
    return null
  }
  return entry
}

function getCachedSubdomainAgency(subdomain: string): CachedAgency | null | undefined {
  const entry = subdomainAgencyCache.get(subdomain)
  if (!entry) return undefined // undefined = not cached
  if (Date.now() - entry.cachedAt > SUBDOMAIN_AGENCY_TTL_MS) {
    subdomainAgencyCache.delete(subdomain)
    return undefined
  }
  return entry.data // null = cached miss (no such agency)
}



export async function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const hostParts = hostname.split(':')
  const hostNoPort = hostParts[0].replace(/^www\./, '')
  const subdomain = hostNoPort.split('.')[0]
  const isLocalhost = hostNoPort === 'localhost' ||
    hostNoPort === '127.0.0.1' ||
    hostNoPort === 'lvh.me' ||
    hostNoPort.endsWith('.localhost') ||
    hostNoPort.endsWith('.lvh.me')
  
  // Check if we are on a subdomain
  const hasSubdomain = !BLOCKED_SUBDOMAINS.includes(subdomain) && 
    ((isLocalhost && (
      (hostNoPort.endsWith('.localhost') && subdomain !== 'localhost') ||
      (hostNoPort.endsWith('.lvh.me') && hostNoPort !== 'lvh.me')
    )) ||
    (!isLocalhost && hostNoPort.split('.').length > 2))

  const path = request.nextUrl.pathname

  // NOTE: We intentionally do NOT redirect localhost users to lvh.me here.
  // In HTTPS dev mode (e.g. `next dev --experimental-https`) the app runs on
  // https://localhost:3000 and lvh.me redirects would downgrade to HTTP.
  // Subdomain-based multi-tenancy is supported in production via the real domain.

  // Browser/Next preflight requests must never pay the tenant/Supabase lookup cost.
  // When these stall, the client RSC fetch can fail and show a "Failed to fetch" overlay.
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204 })
  }

  // Bypass static files or API routes to keep next.js pipeline fast
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.includes('.') ||
    path === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Set up Supabase Client with middleware cookie support
  let supabaseResponse = NextResponse.next({ request })
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookieOptions: getSupabaseCookieOptions(hostname),
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, responseHeaders) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
          Object.entries(responseHeaders).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value)
          )
        },
      },
    }
  )
  const tenantSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  let userId: string | null = null
  let authResolved = false

  async function getRequestUserId() {
    if (authResolved) return userId
    authResolved = true

    try {
      const { data, error } = await supabase.auth.getClaims()
      if (error) throw error
      userId = typeof data?.claims?.sub === 'string' ? data.claims.sub : null
    } catch (err) {
      logger.warn({ err, path: request.nextUrl.pathname }, 'Middleware auth claims validation failed')
    }

    return userId
  }

  // Base URL resolution for redirects.
  // On localhost we keep the actual host (e.g. localhost:3000 or localhost:3001) so that
  // HTTPS dev mode stays on HTTPS instead of being bounced to http://lvh.me.
  // In production the baseDomain is the apex (e.g. example.com).
  const protocol = request.nextUrl.protocol
  const baseDomain = isLocalhost
    ? `${hostNoPort}:${hostParts[1] || '3000'}`
    : hostParts[0].split('.').slice(-2).join('.')
  const mainDomainUrl = `${protocol}//${baseDomain}`

  // 1. SUBDOMAIN & CUSTOM DOMAIN ROUTING AND ISOLATION
  const cleanHost = hostNoPort
  // The apex domain without port — used to detect custom domains.
  const mainApexDomain = baseDomain.split(':')[0]
  const isCustomDomain = !isLocalhost &&
                         cleanHost !== mainApexDomain &&
                         !cleanHost.endsWith('.' + mainApexDomain)

  const shouldRouteToAgency = hasSubdomain || isCustomDomain

  if (shouldRouteToAgency) {
    // A. Fetch current agency details from database (cached)
    let subdomainAgency: CachedAgency | null = null

    if (isCustomDomain) {
      const cached = subdomainAgencyCache.get('cd_' + cleanHost)
      if (cached !== undefined) {
        subdomainAgency = cached.data
      } else {
        const { data } = await tenantSupabase
          .from('agencies')
          .select('id, status, subdomain, business_type_slug')
          .eq('custom_domain', cleanHost)
          .maybeSingle()
        subdomainAgency = data as CachedAgency | null
        subdomainAgencyCache.set('cd_' + cleanHost, { data: subdomainAgency, cachedAt: Date.now() })
      }
    } else {
      const cachedSubdomainAgency = getCachedSubdomainAgency(subdomain)
      if (cachedSubdomainAgency !== undefined) {
        subdomainAgency = cachedSubdomainAgency
      } else {
        const { data } = await tenantSupabase
          .from('agencies')
          .select('id, status, subdomain, business_type_slug')
          .eq('subdomain', subdomain)
          .maybeSingle()
        subdomainAgency = data as CachedAgency | null
        subdomainAgencyCache.set(subdomain, { data: subdomainAgency, cachedAt: Date.now() })
      }
    }

    // If agency doesn't match in database, redirect to main landing page
    if (!subdomainAgency) {
      return NextResponse.redirect(new URL('/', mainDomainUrl))
    }

    const agencySubdomain = subdomainAgency.subdomain

    if (path === '/suspended') {
      return NextResponse.next()
    }

    if (subdomainAgency.status !== 'active' && path !== '/login' && path !== '/onboarding') {
      return NextResponse.redirect(new URL('/suspended', mainDomainUrl))
    }

    // B. Handle Login or Onboarding requests on Subdomain/Custom Domain
    if (path === '/login' || path === '/onboarding') {
      const requestUserId = await getRequestUserId()
      if (requestUserId) {
        // If already logged in, redirect straight to subdomain's dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      // Rewrite internally to the main login/onboarding page to keep beautiful branding under subdomain URL
      return NextResponse.rewrite(new URL(path, request.url))
    }

    // C. Handle Dashboard requests on Subdomain/Custom Domain
    if (path.startsWith('/dashboard')) {
      const requestUserId = await getRequestUserId()
      if (!requestUserId) {
        // Force authentication on subdomain
        return NextResponse.redirect(new URL('/login', request.url))
      }

      // Fetch user profile (cached)
      let profile: CachedProfile | null = getCachedProfile(requestUserId)
      if (!profile) {
        const { data } = await supabase
          .from('profiles')
          .select('agency_id, role, is_platform_owner')
          .eq('id', requestUserId)
          .single()
        if (data) {
          profile = { ...(data as any), cachedAt: Date.now() }
          profileCache.set(requestUserId, profile!)
        }
      }

      if (!profile) {
        return NextResponse.redirect(new URL('/onboarding', mainDomainUrl))
      }

      // Safeguard: Platform Owner should be on the main domain
      if (profile.is_platform_owner) {
        return NextResponse.redirect(new URL('/admin', mainDomainUrl))
      }

      // Safeguard: User tries to access a subdomain dashboard they don't belong to
      if (profile.agency_id !== subdomainAgency.id) {
        // Find their correct agency's subdomain to redirect them (cached)
        let userAgency = agencyCache.get(profile.agency_id || '') || null
        if (!userAgency) {
          const { data } = await tenantSupabase
            .from('agencies')
            .select('id, status, subdomain, business_type_slug')
            .eq('id', profile.agency_id)
            .single()
          if (data) {
            userAgency = { ...(data as any), cachedAt: Date.now() }
            agencyCache.set(profile.agency_id, userAgency!)
          }
        }

        if (userAgency?.subdomain) {
          return NextResponse.redirect(new URL('/dashboard', `${protocol}//${userAgency.subdomain}.${baseDomain}`))
        } else {
          return NextResponse.redirect(new URL('/onboarding', mainDomainUrl))
        }
      }

      const { data: latestAgencyStatus } = await tenantSupabase
        .from('agencies')
        .select('status, business_type_slug')
        .eq('id', subdomainAgency.id)
        .single()

      if (latestAgencyStatus) {
        subdomainAgency = {
          ...subdomainAgency,
          status: latestAgencyStatus.status,
          business_type_slug: latestAgencyStatus.business_type_slug,
          cachedAt: Date.now(),
        }
        if (isCustomDomain) {
          subdomainAgencyCache.set('cd_' + cleanHost, { data: subdomainAgency, cachedAt: Date.now() })
        } else {
          subdomainAgencyCache.set(subdomain, { data: subdomainAgency, cachedAt: Date.now() })
        }
      }

      // Approval/Suspension check: no tenant dashboard access until the platform owner activates it.
      if (subdomainAgency.status !== 'active') {
        return NextResponse.redirect(new URL('/suspended', mainDomainUrl))
      }

      // Vertical Pages Isolation & Routing Enforcement
      const travelRoutes = ['/dashboard/trips', '/dashboard/visa', '/dashboard/bookings']
      const showroomRoutes = ['/dashboard/management']
      const ecommerceRoutes = ['/dashboard/store']

      const isCarShowroom = subdomainAgency.business_type_slug === 'car_showroom'
      const isEcommerce = isEcommerceBusinessType(subdomainAgency.business_type_slug)

      if (isCarShowroom) {
        if ([...travelRoutes, ...ecommerceRoutes].some(route => path.startsWith(route))) {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      } else if (isEcommerce) {
        if ([...travelRoutes, ...showroomRoutes].some(route => path.startsWith(route))) {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      } else {
        if ([...showroomRoutes, ...ecommerceRoutes].some(route => path.startsWith(route))) {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      }

      // Role enforcement: every dashboard page must match the user's permission set.
      if (!canAccessPath(profile.role, path)) {
        return NextResponse.redirect(new URL('/dashboard/inbox', request.url))
      }

      // Session Verified and isolated successfully! Rewrite to global /dashboard pages
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-agency-id', subdomainAgency.id)
      requestHeaders.set('x-user-role', profile.role)
      requestHeaders.set('x-user-id', requestUserId)
      requestHeaders.set('x-business-type-slug', normalizeBusinessTypeSlug(subdomainAgency.business_type_slug))

      const rewriteUrl = new URL(path, request.url)
      supabaseResponse = NextResponse.rewrite(rewriteUrl, {
        request: {
          headers: requestHeaders,
        }
      })
      
      // Inject RLS headers downstream
      supabaseResponse.headers.set('x-agency-id', subdomainAgency.id)
      supabaseResponse.headers.set('x-user-role', profile.role)
      return supabaseResponse
    }

    // D. Handle custom public routes of this tenant (e.g. /, /stock, /vehicles, /contact, /location)
    // Rewrite internally to /[subdomain]/path
    if (path === `/${agencySubdomain}` || path.startsWith(`/${agencySubdomain}/`)) {
      return NextResponse.next()
    }
    return NextResponse.rewrite(new URL(`/${agencySubdomain}${path}`, request.url))
  }

  // 2. MAIN DOMAIN ROUTING
  // If the user goes to `/dashboard` or `/login` on the main domain (e.g. localhost:3000),
  // we redirect them to their specific subdomain dashboard based on their profile!
  if (path.startsWith('/dashboard') || path === '/login') {
    const requestUserId = await getRequestUserId()
    if (requestUserId) {
      let profile: CachedProfile | null = getCachedProfile(requestUserId)
      if (!profile) {
        const { data } = await supabase
          .from('profiles')
          .select('agency_id, role, is_platform_owner')
          .eq('id', requestUserId)
          .single()
        if (data) {
          profile = { ...(data as any), cachedAt: Date.now() }
          profileCache.set(requestUserId, profile!)
        }
      }

      if (profile) {
        if (profile.is_platform_owner) {
          // Platform Owner goes to `/admin`
          if (path.startsWith('/dashboard')) {
            return NextResponse.redirect(new URL('/admin', request.url))
          }
          return supabaseResponse
        }

        if (profile.agency_id) {
          // Fetch agency subdomain to redirect them (cached)
          let agency = agencyCache.get(profile.agency_id) || null
          if (!agency) {
            const { data } = await tenantSupabase
              .from('agencies')
              .select('id, status, subdomain, business_type_slug')
              .eq('id', profile.agency_id)
              .single()
            if (data) {
              agency = { ...(data as any), cachedAt: Date.now() }
              agencyCache.set(profile.agency_id, agency!)
            }
          }

          if (agency?.status && agency.status !== 'active') {
            return NextResponse.redirect(new URL('/suspended', request.url))
          }

          if (agency?.subdomain) {
            // Redirect to their specific subdomain dashboard
            return NextResponse.redirect(new URL('/dashboard', `${protocol}//${agency.subdomain}.${baseDomain}`))
          }
        }
        
        // If they have no agency, they must complete onboarding
        if (path !== '/onboarding') {
          return NextResponse.redirect(new URL('/onboarding', request.url))
        }
      }
    } else {
      // Not logged in:
      if (path.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }
  }

  // 3. Platform Admin Control Routing
  if (path.startsWith('/admin')) {
    if (path === '/admin/login' || path === '/admin/setup') {
      return supabaseResponse
    }

    const requestUserId = await getRequestUserId()
    if (!requestUserId) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_platform_owner')
      .eq('id', requestUserId)
      .single()

    if (!profile?.is_platform_owner) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
