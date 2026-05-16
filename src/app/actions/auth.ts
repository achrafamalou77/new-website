'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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
    return { success: false, error: error.message }
  }

  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function resetPassword(formData: FormData) {
  const email = formData.get('email') as string
  if (!email) {
    return { success: false, error: 'Email is required' }
  }

  const supabase = await createClient()
  
  // Note: For this to work in production, you must set the Site URL and Reset Password Redirect URL in Supabase Auth settings
  // It will append '#access_token=...' to the redirect URL
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/settings/password-reset`,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, message: 'Password reset link sent to your email' }
}
