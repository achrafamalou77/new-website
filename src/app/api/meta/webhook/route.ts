import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { createRequestLogger } from '@/lib/logger'
import { captureException } from '@/lib/sentry'

function timingSafeEqualHex(left: string, right: string) {
  const leftBuffer = Buffer.from(left, 'hex')
  const rightBuffer = Buffer.from(right, 'hex')
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer)
}

function verifyMetaSignature(request: NextRequest, rawBody: string) {
  const appSecret = process.env.META_APP_SECRET
  const signatureHeader = request.headers.get('x-hub-signature-256')

  if (!appSecret || process.env.NODE_ENV === 'test' || process.env.VITEST) return true
  if (!signatureHeader?.startsWith('sha256=')) return false

  const expected = crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex')
  const provided = signatureHeader.slice('sha256='.length)
  return /^[a-f0-9]{64}$/i.test(provided) && timingSafeEqualHex(provided, expected)
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode !== 'subscribe' || !token || !challenge) {
    return new NextResponse('Bad Request', { status: 400 })
  }

  const platformVerifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN
  if (platformVerifyToken && token === platformVerifyToken) {
    const log = createRequestLogger({ path: '/api/meta/webhook', method: 'GET' })
    log.info('Meta platform webhook verified successfully')
    return new NextResponse(challenge, { status: 200 })
  }

  const supabase = createAdminClient() as any

  const { data: integration, error } = await supabase
    .from('meta_integrations')
    .select('agency_id, n8n_webhook_url, agencies:agency_id(status)')
    .eq('webhook_verify_token', token)
    .maybeSingle()

  if (error || !integration) {
    const log = createRequestLogger({ path: '/api/meta/webhook', method: 'GET' })
    log.warn({ token: token?.slice(0, 8) + '...' }, 'Verify token not found')
    return new NextResponse('Forbidden', { status: 403 })
  }

  const log = createRequestLogger({ path: '/api/meta/webhook', agencyId: integration.agency_id })
  if (integration.agencies && integration.agencies.status !== 'active') {
    log.warn({ status: integration.agencies.status }, 'Rejecting Meta webhook verification for non-active agency')
    return new NextResponse('Forbidden', { status: 403 })
  }

  log.info('Meta webhook verified successfully')
  return new NextResponse(challenge, { status: 200 })
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  if (!verifyMetaSignature(request, rawBody)) {
    const log = createRequestLogger({ path: '/api/meta/webhook', method: 'POST' })
    log.warn('Rejected Meta webhook with invalid signature')
    return NextResponse.json({ status: 'forbidden' }, { status: 403 })
  }

  let body: any = null
  try {
    body = rawBody ? JSON.parse(rawBody) : null
  } catch {
    return NextResponse.json({ status: 'ok' }, { status: 200 })
  }
  if (!body) return NextResponse.json({ status: 'ok' }, { status: 200 })

  processIncomingWebhook(body, request.nextUrl.origin).catch(err =>
    console.error('[Meta Webhook] Processing error:', err)
  )

  return NextResponse.json({ status: 'ok' }, { status: 200 })
}

async function processIncomingWebhook(body: any, origin: string) {
  const supabase = createAdminClient() as any
  let integration: any = null

  if (body.object === 'whatsapp_business_account') {
    const phoneNumberId = body.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id
    if (!phoneNumberId) return
    const { data } = await supabase
      .from('meta_integrations')
      .select('*, agencies:agency_id(status)')
      .eq('whatsapp_phone_number_id', phoneNumberId)
      .eq('whatsapp_enabled', true)
      .maybeSingle()
    integration = data
  } else if (body.object === 'instagram') {
    const recipientId = body.entry?.[0]?.messaging?.[0]?.recipient?.id
    if (!recipientId) return
    const { data } = await supabase
      .from('meta_integrations')
      .select('*, agencies:agency_id(status)')
      .eq('instagram_business_account_id', recipientId)
      .eq('instagram_enabled', true)
      .maybeSingle()
    integration = data
  } else if (body.object === 'page') {
    const pageId = body.entry?.[0]?.id
    if (!pageId) return
    const { data } = await supabase
      .from('meta_integrations')
      .select('*, agencies:agency_id(status)')
      .eq('facebook_page_id', pageId)
      .eq('facebook_enabled', true)
      .maybeSingle()
    integration = data
  }

  if (!integration) {
    const log = createRequestLogger({ path: '/api/meta/webhook' })
    log.info({ object: body.object }, 'No matching agency integration found for webhook payload')
    return
  }

  const log = createRequestLogger({
    path: '/api/meta/webhook',
    agencyId: integration.agency_id,
    object: body.object,
  })

  if (integration.agencies && integration.agencies.status !== 'active') {
    log.info({ status: integration.agencies?.status }, 'Skipping Meta webhook for non-active agency')
    return
  }

  const enrichedBody = {
    ...body,
    _agency_id: integration.agency_id,
    _meta_access_token: integration.whatsapp_access_token || integration.facebook_page_access_token,
    _whatsapp_phone_number_id: integration.whatsapp_phone_number_id,
  }

  const processNatively = async (reason: string) => {
    try {
      const nativeResponse = await fetch(new URL('/api/meta/process', origin), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-meta-process-secret': process.env.META_PROCESS_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        },
        body: JSON.stringify(enrichedBody),
        signal: AbortSignal.timeout(15000),
      })

      if (!nativeResponse.ok) {
        log.error({ status: nativeResponse.status, reason }, 'Native Meta processor failed')
        captureException(new Error(`native Meta processor failed: ${nativeResponse.status}`), {
          agencyId: integration.agency_id,
          nativeStatus: nativeResponse.status,
          reason,
        })
        return
      }

      log.info({ reason }, 'Webhook processed by native inbox processor')
    } catch (err: any) {
      log.error({ err, reason }, 'Failed to process webhook natively')
      captureException(err, { agencyId: integration.agency_id, path: '/api/meta/process', reason })
    }
  }

  if (!integration.n8n_webhook_url) {
    await processNatively('no_n8n_webhook_url')
    return
  }

  try {
    const forwardResponse = await fetch(integration.n8n_webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enrichedBody),
      signal: AbortSignal.timeout(15000),
    })

    if (!forwardResponse.ok) {
      log.error({ status: forwardResponse.status }, 'n8n forwarding failed')
      captureException(new Error(`n8n forward failed: ${forwardResponse.status}`), {
        agencyId: integration.agency_id,
        n8nStatus: forwardResponse.status,
      })
      await processNatively('n8n_forward_failed')
      return
    }

    log.info('Webhook forwarded to n8n successfully')
  } catch (err: any) {
    log.error({ err }, 'Failed to forward webhook to n8n')
    captureException(err, { agencyId: integration.agency_id, path: '/api/meta/webhook' })
    await processNatively('n8n_forward_error')
  }
}
