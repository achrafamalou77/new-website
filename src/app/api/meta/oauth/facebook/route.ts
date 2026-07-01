import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { subscribeAppWebhookObject, subscribePageToMessenger } from '@/lib/meta/webhook-setup'

const GRAPH = `https://graph.facebook.com/${process.env.META_GRAPH_VERSION || 'v25.0'}`

/**
 * GET /api/meta/oauth/facebook
 * OAuth callback. Meta redirects here with a code.
 * 1. Exchange code → short-lived token
 * 2. Exchange short-lived → long-lived user token (60 days)
 * 3. Fetch pages the user manages
 * 4. For each page: get page access token + check Instagram business account
 * 5. Save everything to meta_integrations
 * 6. Redirect back to dashboard chatbot settings
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const errorParam = searchParams.get('error')
  const expectedState = request.cookies.get('meta_oauth_state')?.value

  // Handle user denial
  if (errorParam || !code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/chatbot?tab=meta&error=facebook_denied`
    )
  }

  const appId = process.env.META_APP_ID!
  const appSecret = process.env.META_APP_SECRET!
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/meta/oauth/facebook`

  if (!appId || !appSecret || appSecret === 'your_meta_app_secret_here') {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/chatbot?tab=meta&error=platform_meta_secret_missing`
    )
  }

  try {
    // Step 1: Exchange code for short-lived token
    const tokenRes = await fetch(
      `${GRAPH}/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
    )
    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) throw new Error('Failed to get access token')

    // Step 2: Exchange for long-lived user token
    const llRes = await fetch(
      `${GRAPH}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`
    )
    const llData = await llRes.json()
    const userToken = llData.access_token || tokenData.access_token
    const tokenExpiresAt = llData.expires_in
      ? new Date(Date.now() + (Number(llData.expires_in) * 1000)).toISOString()
      : null

    // Step 3: Fetch user's managed pages
    const pagesRes = await fetch(
      `${GRAPH}/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${userToken}`
    )
    const pagesData = await pagesRes.json()
    const pages: any[] = pagesData.data || []

    if (pages.length === 0) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/chatbot?tab=meta&error=no_pages`
      )
    }

    // Use the first page (most companies have one page)
    const page = pages[0]
    const pageToken = page.access_token
    const pageId = page.id
    const pageName = page.name

    // Step 4: Check for Instagram business account linked to this page
    let igAccountId: string | null = null
    let igUsername: string | null = null

    if (page.instagram_business_account?.id) {
      igAccountId = page.instagram_business_account.id
      // Fetch Instagram username
      const igRes = await fetch(
        `${GRAPH}/${igAccountId}?fields=username&access_token=${pageToken}`
      )
      const igData = await igRes.json()
      igUsername = igData.username || null
    }

    // Marketing API access uses the long-lived user token, not the Page token.
    const adAccountsRes = await fetch(
      `${GRAPH}/me/adaccounts?fields=id,account_id,name,account_status,currency,timezone_name,business&limit=100&access_token=${userToken}`
    )
    const adAccountsData = await adAccountsRes.json()
    const adAccounts: any[] = Array.isArray(adAccountsData.data) ? adAccountsData.data : []
    const selectedAdAccount = adAccounts.find((account) => account.account_status === 1) || adAccounts[0] || null
    let pixels: any[] = []
    if (selectedAdAccount?.id) {
      const pixelsRes = await fetch(
        `${GRAPH}/${selectedAdAccount.id}/adspixels?fields=id,name&limit=100&access_token=${userToken}`
      )
      const pixelsData = await pixelsRes.json()
      pixels = Array.isArray(pixelsData.data) ? pixelsData.data : []
    }

    // Step 5: Get current user's agency_id
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No authenticated user')

    const { data: profile } = await supabase
      .from('profiles')
      .select('agency_id')
      .eq('id', user.id)
      .single()

    if (!profile?.agency_id) throw new Error('No agency found')

    const agencyId = profile.agency_id
    const verifyToken = `vt_${agencyId.replace(/-/g, '').slice(0, 20)}_${Date.now()}`

    // Step 6: Upsert to meta_integrations
    const adminSupabase = createAdminClient() as any
    const { error: upsertError } = await adminSupabase
      .from('meta_integrations')
      .upsert({
        agency_id: agencyId,
        facebook_connected: true,
        facebook_page_id: pageId,
        facebook_page_name: pageName,
        facebook_page_access_token: pageToken,
        facebook_enabled: true,
        instagram_connected: igAccountId !== null,
        instagram_business_account_id: igAccountId,
        instagram_username: igUsername,
        instagram_enabled: igAccountId !== null,
        meta_user_access_token: userToken,
        meta_token_expires_at: tokenExpiresAt,
        meta_ad_accounts: adAccounts,
        selected_ad_account_id: selectedAdAccount?.id || null,
        meta_pixels: pixels,
        selected_pixel_id: pixels[0]?.id || null,
        ads_connected: adAccounts.length > 0,
        webhook_verify_token: verifyToken,
      }, {
        onConflict: 'agency_id',
        ignoreDuplicates: false
      })

    if (upsertError) {
      console.error('[Meta OAuth] Upsert error:', upsertError)
      throw new Error('Failed to save integration')
    }

    const pageSubscription = await subscribePageToMessenger({
      pageId,
      pageAccessToken: pageToken,
    })
    if (!pageSubscription.ok) {
      console.warn('[Meta OAuth] Page webhook subscription failed:', pageSubscription.error)
    }

    const pageWebhook = await subscribeAppWebhookObject({
      object: 'page',
      verifyToken,
      fields: ['messages', 'messaging_postbacks', 'messaging_optins', 'messaging_referrals'],
    })
    if (!pageWebhook.ok) {
      console.warn('[Meta OAuth] App Page webhook setup failed:', pageWebhook.error)
    }

    if (igAccountId) {
      const instagramWebhook = await subscribeAppWebhookObject({
        object: 'instagram',
        verifyToken,
        fields: [
          'messages',
          'messaging_postbacks',
          'messaging_seen',
          'messaging_referral',
          'message_reactions',
          'message_edit',
          'comments',
          'live_comments',
          'mentions',
        ],
      })
      if (!instagramWebhook.ok) {
        console.warn('[Meta OAuth] App Instagram webhook setup failed:', instagramWebhook.error)
      }
    }

    // Redirect back to dashboard with success
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/chatbot?tab=meta&success=facebook`
    )
    response.cookies.delete('meta_oauth_state')
    return response
  } catch (err: any) {
    console.error('[Meta OAuth] Error:', err.message)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/chatbot?tab=meta&error=oauth_failed`
    )
  }
}
