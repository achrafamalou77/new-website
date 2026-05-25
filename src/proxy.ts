import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const BLOCKED_SUBDOMAINS = ['www', 'admin', 'api', 'app', 'dashboard', 'login', 'onboarding', 'supabase', 'vercel']

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const subdomain = hostname.split('.')[0]
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1')
  
  // Check if we are on a subdomain
  const hasSubdomain = !BLOCKED_SUBDOMAINS.includes(subdomain) && 
    ((isLocalhost && hostname.split('.').length > 1 && subdomain !== 'localhost') || 
    (!isLocalhost && hostname.split('.').length > 2))

  const path = request.nextUrl.pathname

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
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Base URL resolution for redirects
  const protocol = request.nextUrl.protocol
  const hostParts = hostname.split(':')
  const baseDomain = isLocalhost ? `localhost:${hostParts[1] || '3000'}` : hostParts[0].split('.').slice(-2).join('.')
  const mainDomainUrl = `${protocol}//${baseDomain}`

  // 1. SUBDOMAIN ROUTING AND ISOLATION
  if (hasSubdomain) {
    // A. Fetch current subdomain agency details from database
    const { data: subdomainAgency } = await supabase
      .from('agencies')
      .select('id, status, subdomain, business_type_slug')
      .eq('subdomain', subdomain)
      .single()

    // If subdomain doesn't match any agency in database, redirect to main landing page
    if (!subdomainAgency) {
      return NextResponse.redirect(new URL('/', mainDomainUrl))
    }

    // B. Handle Login or Onboarding requests on Subdomain
    if (path === '/login' || path === '/onboarding') {
      if (user) {
        // If already logged in, redirect straight to subdomain's dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      // Rewrite internally to the main login/onboarding page to keep beautiful branding under subdomain URL
      return NextResponse.rewrite(new URL(path, request.url))
    }

    // C. Handle Dashboard requests on Subdomain
    if (path.startsWith('/dashboard')) {
      if (!user) {
        // Force authentication on subdomain
        return NextResponse.redirect(new URL('/login', request.url))
      }

      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('agency_id, role, is_platform_owner')
        .eq('id', user.id)
        .single()

      if (!profile) {
        return NextResponse.redirect(new URL('/onboarding', mainDomainUrl))
      }

      // Safeguard: Platform Owner should be on the main domain
      if (profile.is_platform_owner) {
        return NextResponse.redirect(new URL('/admin', mainDomainUrl))
      }

      // Safeguard: User tries to access a subdomain dashboard they don't belong to
      if (profile.agency_id !== subdomainAgency.id) {
        // Find their correct agency's subdomain to redirect them
        const { data: userAgency } = await supabase
          .from('agencies')
          .select('subdomain')
          .eq('id', profile.agency_id)
          .single()

        if (userAgency?.subdomain) {
          return NextResponse.redirect(new URL('/dashboard', `${protocol}//${userAgency.subdomain}.${baseDomain}`))
        } else {
          return NextResponse.redirect(new URL('/onboarding', mainDomainUrl))
        }
      }

      // Suspension/Inactive Check
      if (subdomainAgency.status === 'inactive' || subdomainAgency.status === 'suspended') {
        return NextResponse.redirect(new URL('/suspended', mainDomainUrl))
      }

      // Role Enforcement: employee cannot access dashboard settings or team
      if (profile.role === 'employee' && (path.startsWith('/dashboard/settings') || path.startsWith('/dashboard/team'))) {
        return NextResponse.redirect(new URL('/dashboard/inbox', request.url))
      }

      // Session Verified and isolated successfully! Rewrite to global /dashboard pages
      const rewriteUrl = new URL(path, request.url)
      supabaseResponse = NextResponse.rewrite(rewriteUrl)
      
      // Inject RLS headers downstream
      supabaseResponse.headers.set('x-agency-id', subdomainAgency.id)
      supabaseResponse.headers.set('x-user-role', profile.role)
      return supabaseResponse
    }

    // D. Handle custom public routes of this tenant (e.g. /, /stock, /vehicles, /contact, /location)
    // Rewrite internally to /[subdomain]/path
    return NextResponse.rewrite(new URL(`/${subdomain}${path}`, request.url))
  }

  // 2. MAIN DOMAIN ROUTING
  // If the user goes to `/dashboard` or `/login` on the main domain (e.g. localhost:3000),
  // we redirect them to their specific subdomain dashboard based on their profile!
  if (path.startsWith('/dashboard') || path === '/login') {
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('agency_id, is_platform_owner')
        .eq('id', user.id)
        .single()

      if (profile) {
        if (profile.is_platform_owner) {
          // Platform Owner goes to `/admin`
          if (path.startsWith('/dashboard')) {
            return NextResponse.redirect(new URL('/admin', request.url))
          }
          return supabaseResponse
        }

        if (profile.agency_id) {
          // Fetch agency subdomain to redirect them
          const { data: agency } = await supabase
            .from('agencies')
            .select('subdomain')
            .eq('id', profile.agency_id)
            .single()

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

    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_platform_owner')
      .eq('id', user.id)
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
