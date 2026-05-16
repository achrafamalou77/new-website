'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const BLOCKED_SUBDOMAINS = ['www', 'admin', 'api', 'app', 'dashboard', 'login', 'onboarding', 'supabase', 'vercel']

export async function checkSubdomainAvailability(subdomain: string): Promise<{ available: boolean; error?: string }> {
  if (!/^[a-z0-9-]{3,30}$/.test(subdomain)) {
    return { available: false, error: 'Subdomain must be 3-30 lowercase alphanumeric characters or hyphens.' }
  }
  
  if (subdomain.startsWith('-') || subdomain.endsWith('-') || subdomain.includes('--')) {
    return { available: false, error: 'Subdomain cannot have consecutive, leading, or trailing hyphens.' }
  }

  if (BLOCKED_SUBDOMAINS.includes(subdomain)) {
    return { available: false, error: 'This subdomain is reserved.' }
  }

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('agencies')
      .select('subdomain')
      .eq('subdomain', subdomain)
      .maybeSingle()

    if (error) {
      console.error('Error checking subdomain:', error)
      return { available: false, error: 'Error checking availability.' }
    }

    return { available: !data }
  } catch (err) {
    return { available: false, error: 'Service unavailable' }
  }
}

export async function createAgency(formData: any) {
  const { company_name, subdomain, admin_email, admin_password, admin_name, logo_url, primary_color, secondary_color, hero_title, hero_subtitle, phone, agency_email, address, social_links, modules } = formData

  const adminClient = createAdminClient()

  // 1. Double check subdomain
  const { available } = await checkSubdomainAvailability(subdomain)
  if (!available) {
    return { success: false, error: 'Subdomain is no longer available or invalid' }
  }

  // 2. Create user via admin API (auto-confirmed)
  const { data: userData, error: userError } = await adminClient.auth.admin.createUser({
    email: admin_email,
    password: admin_password,
    email_confirm: true,
    user_metadata: { full_name: admin_name }
  })

  if (userError || !userData.user) {
    return { success: false, error: userError?.message || 'Failed to create user' }
  }

  // 3. Create agency row
  const website_settings = {
    logo_url,
    primary_color,
    secondary_color,
    hero_title,
    hero_subtitle,
    phone,
    email: agency_email,
    address,
    social_links
  }

  const { data: agencyData, error: agencyError } = await adminClient
    .from('agencies')
    .insert({
      company_name,
      subdomain,
      website_settings,
      active_modules: modules
    } as any)
    .select()
    .single()

  if (agencyError || !agencyData) {
    // Rollback user
    await adminClient.auth.admin.deleteUser(userData.user.id)
    return { success: false, error: agencyError?.message || 'Failed to create agency' }
  }

  // 4. Create profile row linking user to agency
  const { error: profileError } = await adminClient
    .from('profiles')
    .insert({
      id: userData.user.id,
      agency_id: (agencyData as any).id,
      full_name: admin_name,
      role: 'superadmin'
    } as any)

  const agency = agencyData as any

  if (profileError) {
    // Rollback
    await adminClient.auth.admin.deleteUser(userData.user.id)
    await adminClient.from('agencies').delete().eq('id', agency.id)
    return { success: false, error: profileError.message }
  }

  // 5. Auto-login the newly created user using the standard SSR client to set cookies
  const authClient = await createClient()
  const { error: loginError } = await authClient.auth.signInWithPassword({
    email: admin_email,
    password: admin_password,
  })

  if (loginError) {
    return { success: true, redirectUrl: '/login?message=Account+created+but+login+failed.+Please+login' }
  }

  return { success: true, redirectUrl: '/dashboard' }
}

export async function updateAgencySettings(formData: any) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return { success: true }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: profileData } = await supabase.from('profiles').select('agency_id, role').eq('id', user.id).single()
  const profile = profileData as any
  if (profile?.role !== 'superadmin') {
    return { success: false, error: 'Only superadmins can update settings' }
  }

  const { company_name, logo_url, primary_color, secondary_color, hero_title, hero_subtitle, phone, agency_email, address, social_links, modules } = formData

  const website_settings = {
    logo_url,
    primary_color,
    secondary_color,
    hero_title,
    hero_subtitle,
    phone,
    email: agency_email,
    address,
    social_links
  }

  const agenciesTable: any = supabase.from('agencies')
  const { error } = await agenciesTable.update({
    company_name,
    website_settings,
    active_modules: modules
  }).eq('id', profile.agency_id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
