import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/meta/disconnect
 * Disconnects a specific platform from the Meta integration.
 * Body: { platform: 'facebook' | 'instagram' | 'whatsapp' }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.agency_id || profile.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { platform } = await request.json()
  const adminSupabase = createAdminClient()

  const updates: Record<string, any> = {
    facebook: {
      facebook_connected: false,
      facebook_page_id: null,
      facebook_page_name: null,
      facebook_page_access_token: null,
      // Also disconnect Instagram when Facebook is disconnected
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

  if (!updates[platform]) {
    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
  }

  const { error } = await (createAdminClient() as any)
    .from('meta_integrations')
    .update(updates[platform])
    .eq('agency_id', profile.agency_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
