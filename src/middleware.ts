import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const BLOCKED_SUBDOMAINS = ['www', 'admin', 'api', 'app', 'dashboard', 'login', 'onboarding', 'supabase', 'vercel']

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const subdomain = hostname.split('.')[0]
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1')
  // Check if we are on a subdomain (e.g. not localhost:3000, not example.com, but sub.localhost:3000 or sub.example.com)
  const hasSubdomain = !BLOCKED_SUBDOMAINS.includes(subdomain) && 
    ((isLocalhost && hostname.split('.').length > 1 && subdomain !== 'localhost') || 
    (!isLocalhost && hostname.split('.').length > 2))

  // 1. Subdomain Routing
  if (hasSubdomain) {
    // Rewrite to /[subdomain]/path
    return NextResponse.rewrite(new URL(`/${subdomain}${request.nextUrl.pathname}`, request.url))
  }

  // 2. Auth & Role Routing (Main Domain)
  // Demo mode check
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

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
  const path = request.nextUrl.pathname

  if (path.startsWith('/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // Check role/agency in profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('agency_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.agency_id) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    // Role Enforcement: employee cannot access /settings or /team
    if (profile.role === 'employee' && (path.startsWith('/dashboard/settings') || path.startsWith('/dashboard/team'))) {
      return NextResponse.redirect(new URL('/dashboard/inbox', request.url))
    }

    // Suspension check
    const { data: agency } = await supabase
      .from('agencies')
      .select('status')
      .eq('id', profile.agency_id)
      .single()
      
    if (agency?.status === 'inactive' || agency?.status === 'suspended') {
      return NextResponse.redirect(new URL('/suspended', request.url))
    }

    // Pass the headers downstream
    supabaseResponse.headers.set('x-agency-id', profile.agency_id)
    supabaseResponse.headers.set('x-user-role', profile.role)
  }

  // 3. Admin Routing
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

    if (!(profile as any)?.is_platform_owner) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  if (path === '/login') {
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('agency_id')
        .eq('id', user.id)
        .single()
        
      if (profile?.agency_id) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      } else {
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
