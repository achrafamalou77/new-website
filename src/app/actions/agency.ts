'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  ECOMMERCE_CATEGORIES,
  ECOMMERCE_STOREFRONT_TEMPLATES,
  createEcommerceStorefrontConfig,
} from '@/lib/ecommerce-storefront'

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
  const {
    company_name,
    legal_name,
    registration_number,
    subdomain,
    admin_email,
    admin_password,
    admin_name,
    logo_url,
    primary_color,
    secondary_color,
    hero_title,
    hero_subtitle,
    phone,
    whatsapp_phone,
    agency_email,
    address,
    city,
    business_focus,
    ccp_account,
    social_links,
    modules,
    store_category,
    store_template_id,
  } = formData

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

  const allowedVerticals = ['travel_agency', 'car_showroom', 'ecommerce']
  const vertical = allowedVerticals.includes(formData.business_type_slug)
    ? formData.business_type_slug
    : 'travel_agency'
  const validCategory = ECOMMERCE_CATEGORIES.some((category) => category.id === store_category)
  const validTemplate = ECOMMERCE_STOREFRONT_TEMPLATES.some((template) => template.id === store_template_id)
  const storefrontConfig = vertical === 'ecommerce'
    ? createEcommerceStorefrontConfig(
        validTemplate ? store_template_id : 'sole-district',
        company_name
      )
    : null

  if (storefrontConfig && validCategory) {
    storefrontConfig.category = store_category
  }

  // 3. Create agency row
  const website_settings = {
    logo_url,
    primary_color,
    secondary_color,
    hero_title,
    hero_subtitle,
    phone,
    whatsapp_phone: whatsapp_phone || phone,
    email: agency_email,
    address,
    city,
    legal_name,
    registration_number,
    business_focus,
    ccp_account,
    social_links,
    modules,
    ...(storefrontConfig ? {
      store_category: storefrontConfig.category,
      store_template_id: storefrontConfig.templateId,
      store_theme: storefrontConfig.templateId,
      storefront_config: storefrontConfig,
    } : {}),
  }

  const defaultPlan =
    vertical === 'car_showroom'
      ? 'car_free'
      : vertical === 'ecommerce'
        ? 'ecommerce_free'
        : 'travel_free'

  const agencyPayload: Record<string, any> = {
    name: company_name,
    company_name,
    subdomain,
    phone,
    email: agency_email,
    address,
    city,
    website_settings,
    business_type_slug: vertical,
    plan: defaultPlan,
    status: 'pending',
    chatbot_enabled: Boolean(modules?.chatbot),
    social_links: social_links || {},
    theme_config: {
      primary_color,
      secondary_color,
    },
  }

  const { data: agencyData, error: agencyError } = await (adminClient
    .from('agencies') as any)
    .insert(agencyPayload)
    .select()
    .single()

  if (agencyError || !agencyData) {
    // Rollback user
    await adminClient.auth.admin.deleteUser(userData.user.id)
    return { success: false, error: agencyError?.message || 'Failed to create agency' }
  }

  if (storefrontConfig) {
    const { error: storefrontError } = await (adminClient.from('website_configs') as any).upsert({
      agency_id: agencyData.id,
      builder_data: {
        kind: 'ecommerce-storefront',
        version: 1,
        storefront: storefrontConfig,
      },
      updated_at: new Date().toISOString(),
    }, { onConflict: 'agency_id' })

    if (storefrontError) {
      await adminClient.auth.admin.deleteUser(userData.user.id)
      await adminClient.from('agencies').delete().eq('id', agencyData.id)
      return { success: false, error: storefrontError.message }
    }
  }

  // 4. Create profile row linking user to agency
  const { error: profileError } = await adminClient
    .from('profiles')
    .insert({
      id: userData.user.id,
      agency_id: (agencyData).id,
      full_name: admin_name,
      role: 'superadmin'
    })

  const agency = agencyData

  if (profileError) {
    // Rollback
    await adminClient.auth.admin.deleteUser(userData.user.id)
    await adminClient.from('agencies').delete().eq('id', agency.id)
    return { success: false, error: profileError.message }
  }

  await (adminClient.from('admin_audit_log') as any).insert({
    admin_email: 'system',
    action: `New agency pending approval: ${company_name}`,
    target_agency_id: agency.id,
  })

  return {
    success: true,
    pendingApproval: true,
    redirectUrl: '/login?message=Account+created.+The+platform+owner+must+activate+it+before+dashboard+access.',
  }
}

import { websiteConfigSchema, chatbotConfigSchema, businessHoursSchema, socialMediaSchema, agencyInfoSchema } from '@/lib/validations/settings';

export async function updateWebsiteConfig(config: any, revalidate: boolean = true) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: profileData } = await supabase.from('profiles').select('agency_id, role').eq('id', user.id).single()
  const profile = profileData
  if (!profile || profile.role !== 'superadmin' || !profile.agency_id) {
    return { success: false, error: 'Only superadmins can update settings' }
  }

  // Detect builder format (has global_styles + structure.sections) vs legacy format
  const isBuilderFormat = !!(config?.global_styles || config?.structure?.sections)

  if (isBuilderFormat) {
    // New builder format: save to website_configs table as builder_data
    // Also update agencies.website_config for legacy rendering fallback
    const { error: configError } = await (supabase.from('website_configs') as any)
      .upsert({
        agency_id: profile.agency_id,
        builder_data: config,
        updated_at: new Date().toISOString()
      }, { onConflict: 'agency_id' })

    if (configError) {
      // If table doesn't exist yet, fall through to legacy update
      console.warn('website_configs upsert failed, falling back to agencies table:', configError.message)
    }

    // Fetch existing website_settings to merge the logo URL
    const { data: agencyData } = await (supabase
      .from('agencies') as any)
      .select('website_settings')
      .eq('id', profile.agency_id)
      .maybeSingle()

    const existingSettings = (agencyData)?.website_settings || {}
    const logoUrl = config.logo_url || config.design?.logo_url || ''
    const website_settings = {
      ...existingSettings,
      logo_url: logoUrl
    }

    // Also update the agencies.website_config and website_settings columns for the subdomain page fallback
    const agenciesTable: any = supabase.from('agencies')
    const { error: agencyError } = await agenciesTable.update({
      website_config: config as any,
      website_settings: website_settings as any
    }).eq('id', profile.agency_id)

    if (agencyError) return { success: false, error: agencyError.message }
    
    if (revalidate) {
      const { revalidatePath } = await import('next/cache')
      revalidatePath('/', 'layout')

      const { data: agencyRow } = await (supabase
        .from('agencies') as any)
        .select('subdomain')
        .eq('id', profile.agency_id)
        .maybeSingle()

      const subdomain = (agencyRow as any)?.subdomain
      if (subdomain) {
        revalidatePath(`/${subdomain}`)
      }
    }

    return { success: true }
  }

  // Legacy format: validate using Zod
  const validation = websiteConfigSchema.safeParse(config);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message, details: validation.error.issues }
  }

  const { error } = await (supabase.from('agencies')).update({
    website_config: validation.data as any
  }).eq('id', profile.agency_id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function updateChatbotConfig(config: any) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: profileData } = await supabase.from('profiles').select('agency_id, role').eq('id', user.id).single()
  const profile = profileData
  if (!profile || profile.role !== 'superadmin' || !profile.agency_id) {
    return { success: false, error: 'Only superadmins can update settings' }
  }

  // Validate using Zod
  const validation = chatbotConfigSchema.safeParse(config);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message, details: validation.error.issues }
  }

  const { error } = await (supabase.from('agencies')).update({
    chatbot_config: validation.data as any
  }).eq('id', profile.agency_id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function updateAgencyInfo(data: any) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: profileData } = await supabase.from('profiles').select('agency_id, role').eq('id', user.id).single()
  const profile = profileData
  if (!profile || profile.role !== 'superadmin' || !profile.agency_id) {
    return { success: false, error: 'Only superadmins can update settings' }
  }

  // Robust Zod validation with default values to handle any missing/undefined inputs
  const validation = agencyInfoSchema.safeParse(data)
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message }
  }

  const {
    company_name,
    phone,
    whatsapp_phone,
    email,
    address,
    logo_url,
    currency,
    payment_info,
    bank_integrations,
    business_hours,
    social_media
  } = validation.data

  // Fetch existing website_settings to merge phone, email, and address
  const { data: agencyData } = await (supabase
    .from('agencies') as any)
    .select('website_settings')
    .eq('id', profile.agency_id)
    .single()

  const existingSettings = (agencyData)?.website_settings || {}
  const website_settings = {
    ...existingSettings,
    phone,
    whatsapp_phone: whatsapp_phone || phone,
    email,
    address,
    logo_url,
    currency,
    payment_info,
    bank_integrations,
    social_links: social_media,
    social_facebook: social_media.facebook,
    social_instagram: social_media.instagram,
    social_tiktok: social_media.tiktok,
    social_youtube: social_media.youtube,
    social_twitter: social_media.twitter,
    social_linkedin: social_media.linkedin
  }

  const updatePayload: any = {
    name: company_name,
    company_name,
    phone,
    email,
    address,
    business_hours,
    social_media,
    social_links: social_media,
    website_settings
  }

  const { error } = await (supabase.from('agencies'))
    .update(updatePayload)
    .eq('id', profile.agency_id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function applyDirectUpgrade(planId: string, transactionId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('agency_id, role').eq('id', user.id).single()
  if (!profile || profile.role !== 'superadmin' || !profile.agency_id) {
    return { success: false, error: 'Only superadmins can upgrade plans' }
  }

  // Fetch plan details
  const { data: plan } = await supabase.from('plans').select('*').eq('id', planId).single()
  if (!plan) return { success: false, error: 'Target plan not found' }

  // Insert a ledger record tracking this subscription transaction
  const admin = createAdminClient() as any
  const { error: ledgerError } = await admin
    .from('subscriptions_ledgers')
    .upsert({
      agency_id: profile.agency_id,
      plan_id: planId,
      transaction_id: transactionId,
      amount: plan.price || 0,
      currency: 'DZD',
      status: 'paid', // CCP direct transfer simulation instantly flags as paid
      payment_method: 'ccp'
    }, { onConflict: 'transaction_id' })

  if (ledgerError) {
    console.error('Ledger logging error:', ledgerError)
    return { success: false, error: 'Failed to record transaction log: ' + ledgerError.message }
  }

  // Update plan and credits in database
  const { error } = await supabase
    .from('agencies')
    .update({ 
      plan: planId, 
      ai_credits: plan.ai_credits_monthly || 0 
    })
    .eq('id', profile.agency_id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
