const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v25.0'
const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`

type SubscribeResult = {
  ok: boolean
  status?: number
  error?: string
}

async function graphPost(url: string, body: URLSearchParams): Promise<SubscribeResult> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    const data = await response.json().catch(() => null)

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: data?.error?.message || `Graph API error ${response.status}`,
      }
    }

    return { ok: true, status: response.status }
  } catch (error: any) {
    return { ok: false, error: error?.message || 'Graph API request failed' }
  }
}

export function getPublicMetaWebhookUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl || appUrl.includes('localhost')) return null
  return `${appUrl.replace(/\/$/, '')}/api/meta/webhook`
}

export async function getAppAccessToken() {
  if (process.env.META_APP_ACCESS_TOKEN) return process.env.META_APP_ACCESS_TOKEN

  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  if (!appId || !appSecret || appSecret.includes('your_meta_app_secret_here')) return null

  return `${appId}|${appSecret}`
}

export async function subscribeAppWebhookObject(input: {
  object: 'page' | 'instagram' | 'whatsapp_business_account'
  fields: string[]
  verifyToken: string
}) {
  const callbackUrl = getPublicMetaWebhookUrl()
  const appToken = await getAppAccessToken()
  if (!callbackUrl || !appToken) {
    return { ok: false, error: 'Public app URL or Meta app credentials are not configured.' }
  }

  return graphPost(`${GRAPH}/app/subscriptions`, new URLSearchParams({
    access_token: appToken,
    object: input.object,
    callback_url: callbackUrl,
    verify_token: input.verifyToken,
    fields: input.fields.join(','),
    include_values: 'true',
  }))
}

export async function subscribePageToMessenger(input: {
  pageId: string
  pageAccessToken: string
}) {
  return graphPost(`${GRAPH}/${input.pageId}/subscribed_apps`, new URLSearchParams({
    access_token: input.pageAccessToken,
    subscribed_fields: [
      'messages',
      'messaging_postbacks',
      'messaging_optins',
      'messaging_referrals',
    ].join(','),
  }))
}

export async function subscribeWhatsAppBusinessAccount(input: {
  wabaId: string
  accessToken: string
}) {
  return graphPost(`${GRAPH}/${input.wabaId}/subscribed_apps`, new URLSearchParams({
    access_token: input.accessToken,
    subscribed_fields: [
      'messages',
      'message_template_status_update',
      'phone_number_name_update',
      'phone_number_quality_update',
      'account_update',
      'account_alerts',
    ].join(','),
  }))
}
