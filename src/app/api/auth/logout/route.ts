import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getSupabaseCookieOptions } from '@/lib/supabase/cookie-options'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  const host = request.headers.get('host') || 'lvh.me:3000'
  const protocol = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('lvh.me')
    ? 'http'
    : 'https'
  const redirectUrl = new URL('/login', `${protocol}://${host}`)
  let response = NextResponse.redirect(redirectUrl)

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: getSupabaseCookieOptions(host),
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, responseHeaders) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
          Object.entries(responseHeaders).forEach(([key, value]) => {
            response.headers.set(key, value)
          })
        },
      },
    }
  )

  await supabase.auth.signOut()
  return response
}
