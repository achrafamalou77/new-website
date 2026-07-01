import { createClient } from '@/lib/supabase/server'

export async function requirePlatformOwner() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false as const, error: 'Unauthorized' }
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, is_platform_owner, full_name')
    .eq('id', user.id)
    .maybeSingle()

  if (error || !profile?.is_platform_owner) {
    return { success: false as const, error: 'Platform owner access required' }
  }

  return {
    success: true as const,
    user,
    profile,
  }
}
