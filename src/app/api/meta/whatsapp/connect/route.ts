import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { subscribeAppWebhookObject, subscribeWhatsAppBusinessAccount } from '@/lib/meta/webhook-setup'

/**
 * POST /api/meta/whatsapp/connect
 * Called by the client after Meta Embedded Signup completes.
 * Body: { code: string, waba_id: string, phone_number_id: string }
 * 
 * Meta Embedded Signup returns these values in the callback JS event.
 * We exchange the code for a system user token and store everything.
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

  const { code, waba_id, phone_number_id } = await request.json()

  if (!code || !phone_number_id) {
    return NextResponse.json({ error: 'Missing required fields: code, phone_number_id' }, { status: 400 })
  }

  const appId = process.env.META_APP_ID!
  const appSecret = process.env.META_APP_SECRET!

  if (!appId || !appSecret) {
    return NextResponse.json({ error: 'Meta App ID or App Secret is not configured by the platform owner.' }, { status: 500 })
  }

  // Guard against common misconfiguration: placeholder text or an email address used as the secret
  const looksLikePlaceholder = appSecret === 'your_meta_app_secret_here'
  const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(appSecret)
  if (looksLikePlaceholder || looksLikeEmail) {
    return NextResponse.json({
      error: 'META_APP_SECRET appears to be misconfigured (a placeholder or email address was found). ' +
        'The platform owner must set the real App Secret from developers.facebook.com → Your App → Settings → Basic.'
    }, { status: 500 })
  }

  try {
    // Exchange code for user access token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${code}`
    )
    const tokenData = await tokenRes.json()

    if (!tokenData.access_token) {
      throw new Error(`Token exchange failed: ${JSON.stringify(tokenData)}`)
    }

    const accessToken = tokenData.access_token
    const tokenExpiresAt = tokenData.expires_in
      ? new Date(Date.now() + (Number(tokenData.expires_in) * 1000)).toISOString()
      : null

    // Fetch phone number display info
    let phoneDisplay = ''
    let businessName = ''

    try {
      const phoneRes = await fetch(
        `https://graph.facebook.com/v19.0/${phone_number_id}?fields=display_phone_number,verified_name&access_token=${accessToken}`
      )
      const phoneData = await phoneRes.json()
      phoneDisplay = phoneData.display_phone_number || ''
      businessName = phoneData.verified_name || ''
    } catch (e) {
      console.warn('[WhatsApp Connect] Could not fetch phone details:', e)
    }

    const agencyId = profile.agency_id
    const adminSupabase = createAdminClient() as any

    const verifyToken = `vt_${agencyId.replace(/-/g, '').slice(0, 20)}`

    const { error: upsertError } = await adminSupabase
      .from('meta_integrations')
      .upsert({
        agency_id: agencyId,
        whatsapp_connected: true,
        whatsapp_phone_number_id: phone_number_id,
        whatsapp_waba_id: waba_id || null,
        whatsapp_business_name: businessName,
        whatsapp_phone_display: phoneDisplay,
        whatsapp_access_token: accessToken,
        whatsapp_enabled: true,
        webhook_verify_token: verifyToken,
        meta_token_expires_at: tokenExpiresAt,
      }, {
        onConflict: 'agency_id',
        ignoreDuplicates: false
      })

    if (upsertError) {
      throw new Error(upsertError.message)
    }

    if (waba_id) {
      const wabaSubscription = await subscribeWhatsAppBusinessAccount({
        wabaId: waba_id,
        accessToken,
      })
      if (!wabaSubscription.ok) {
        console.warn('[WhatsApp Connect] WABA webhook subscription failed:', wabaSubscription.error)
      }
    }

    const appWebhook = await subscribeAppWebhookObject({
      object: 'whatsapp_business_account',
      verifyToken,
      fields: [
        'messages',
        'message_template_status_update',
        'phone_number_name_update',
        'phone_number_quality_update',
        'account_update',
        'account_alerts',
      ],
    })
    if (!appWebhook.ok) {
      console.warn('[WhatsApp Connect] App WhatsApp webhook setup failed:', appWebhook.error)
    }

    return NextResponse.json({
      success: true,
      phone_display: phoneDisplay,
      business_name: businessName,
      token_expires_at: tokenExpiresAt,
    })
  } catch (err: any) {
    console.error('[WhatsApp Connect] Error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * PATCH /api/meta/whatsapp/connect
 * Save n8n webhook URL and platform toggles.
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.agency_id || profile.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const adminSupabase = createAdminClient() as any

  const { error } = await adminSupabase
    .from('meta_integrations')
    .upsert({
      agency_id: profile.agency_id,
      ...body
    }, { onConflict: 'agency_id', ignoreDuplicates: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
