'use server'

import { createClient } from '@/lib/supabase/server'
import { getAuthErrorMessage } from '@/lib/auth-errors'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { success: false, error: 'Email and password are required' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { success: false, ...getAuthErrorMessage(error) }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('agency_id, is_platform_owner')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.is_platform_owner && profile?.agency_id) {
      const { data: agency } = await supabase
        .from('agencies')
        .select('status')
        .eq('id', profile.agency_id)
        .maybeSingle()

      if (agency?.status !== 'active') {
        await supabase.auth.signOut()
        const status = agency?.status || 'inactive'
        return {
          success: false,
          error: status === 'pending'
            ? 'Your account is waiting for platform owner approval.'
            : 'Your account is not active. Please contact support.',
          code: `account_${status}`,
        }
      }
    }
  }

  return { success: true }
}

export async function logout() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()
  if (error) {
    return { success: false, error: error.message }
  }
  return { success: true }
}

export async function resetPassword(formData: FormData) {
  const email = formData.get('email') as string
  if (!email) {
    return { success: false, error: 'Email is required' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/settings/password-reset`,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, message: 'Password reset link sent to your email' }
}
