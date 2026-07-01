import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'

/**
 * GET /api/meta/connect/facebook
 * Redirects to Meta OAuth dialog to connect a Facebook Page.
 * The user must be authenticated and a superadmin.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const appId = process.env.META_APP_ID
  if (!appId) {
    return NextResponse.json({ error: 'META_APP_ID not configured' }, { status: 500 })
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/meta/oauth/facebook`

  // Messaging and Marketing API access. Meta may require App Review before
  // these permissions are available to businesses outside the app's testers.
  const scopes = [
    'pages_show_list',           // List user's pages
    'pages_messaging',           // Send Messenger messages
    'pages_read_engagement',     // Read page messages
    'instagram_basic',           // Instagram basic access
    'instagram_manage_messages', // Instagram DM management
    'business_management',       // WABA access
    'ads_read',                  // Read authorized ad accounts
    'ads_management',            // Create paused campaigns and ads
  ].join(',')

  const state = randomUUID()

  const oauthUrl = new URL('https://www.facebook.com/dialog/oauth')
  oauthUrl.searchParams.set('client_id', appId)
  oauthUrl.searchParams.set('redirect_uri', redirectUri)
  oauthUrl.searchParams.set('scope', scopes)
  oauthUrl.searchParams.set('response_type', 'code')
  oauthUrl.searchParams.set('state', state)

  const response = NextResponse.redirect(oauthUrl.toString())
  response.cookies.set('meta_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600,
    path: '/',
  })
  return response
}
