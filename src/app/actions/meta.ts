'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function getMetaIntegration() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized', data: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single()

  if (!profile?.agency_id) return { success: false, error: 'No agency', data: null }

  const admin = createAdminClient() as any
  const { data, error } = await admin
    .from('meta_integrations')
    .select('facebook_connected,facebook_page_name,facebook_page_id,facebook_enabled,instagram_connected,instagram_username,instagram_enabled,whatsapp_connected,whatsapp_phone_display,whatsapp_business_name,whatsapp_enabled,webhook_verify_token,n8n_webhook_url,meta_token_expires_at')
    .eq('agency_id', profile.agency_id)
    .maybeSingle()

  if (error) return { success: false, error: error.message, data: null }
  return { success: true, data }
}

export async function saveMetaIntegration(payload: {
  n8n_webhook_url?: string
  facebook_enabled?: boolean
  instagram_enabled?: boolean
  whatsapp_enabled?: boolean
  webhook_verify_token?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.agency_id || profile.role !== 'superadmin') {
    return { success: false, error: 'Forbidden' }
  }

  const admin = createAdminClient() as any
  const { error } = await admin
    .from('meta_integrations')
    .upsert({
      agency_id: profile.agency_id,
      ...payload
    }, { onConflict: 'agency_id', ignoreDuplicates: false })

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function disconnectMetaPlatform(platform: 'facebook' | 'instagram' | 'whatsapp') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.agency_id || profile.role !== 'superadmin') {
    return { success: false, error: 'Forbidden' }
  }

  const updates: Record<string, any> = {
    facebook: {
      facebook_connected: false,
      facebook_page_id: null,
      facebook_page_name: null,
      facebook_page_access_token: null,
      instagram_connected: false,
      instagram_business_account_id: null,
      instagram_username: null,
    },
    instagram: {
      instagram_connected: false,
      instagram_business_account_id: null,
      instagram_username: null,
      instagram_enabled: false,
    },
    whatsapp: {
      whatsapp_connected: false,
      whatsapp_phone_number_id: null,
      whatsapp_waba_id: null,
      whatsapp_business_name: null,
      whatsapp_phone_display: null,
      whatsapp_access_token: null,
    }
  }

  const admin = createAdminClient() as any
  const { error } = await admin
    .from('meta_integrations')
    .update(updates[platform])
    .eq('agency_id', profile.agency_id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
