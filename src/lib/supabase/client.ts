import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'
import { getSupabaseCookieOptions } from '@/lib/supabase/cookie-options'

export const isSupabaseConnected =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  if (!isSupabaseConnected) return null

  if (browserClient) return browserClient

  browserClient = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: getSupabaseCookieOptions(
        typeof window === 'undefined' ? undefined : window.location.host
      ),
    }
  )

  return browserClient
}
