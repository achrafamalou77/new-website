import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createRequestLogger } from '@/lib/logger'
import { captureException, captureMessage } from '@/lib/sentry'

export async function POST(request: NextRequest) {
  const log = createRequestLogger({ path: '/api/billing/webhook', method: 'POST' })
  const bodyText = await request.text()
  const signature = request.headers.get('signature') || ''
  
  // Note: For production verify Chargily HMAC signature:
  // const secret = process.env.CHARGILY_SECRET_KEY || ''
  // const computed = crypto.createHmac('sha256', secret).update(bodyText).digest('hex')
  // if (signature !== computed) return new NextResponse('Forbidden', { status: 403 })

  let payload: any = null
  try {
    payload = JSON.parse(bodyText)
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const event = payload.type // e.g. "checkout.paid"
  const checkoutData = payload.data
  
  // Read invoice parameters
  const transactionId = checkoutData?.metadata?.transaction_id || checkoutData?.id
  const status = checkoutData?.status // paid, failed, expired
  
  if (!transactionId) {
    return NextResponse.json({ success: false, error: 'Missing transaction metadata' }, { status: 400 })
  }

  const supabase = createAdminClient() as any

  // 1. Find matching ledger transaction record
  const { data: ledger, error: fetchErr } = await supabase
    .from('subscriptions_ledgers')
    .select('*')
    .eq('transaction_id', transactionId)
    .maybeSingle()

  if (fetchErr || !ledger) {
    log.error({ transactionId, err: fetchErr }, 'Transaction not found in ledgers')
    captureMessage(`Billing webhook: transaction not found: ${transactionId}`, 'warning', { transactionId })
    return NextResponse.json({ success: false, error: 'Transaction audit log not found' }, { status: 404 })
  }

  // 2. Process based on status
  if (status === 'paid') {
    // Resolve plan configuration
    const { data: plan } = await supabase
      .from('plans')
      .select('*')
      .eq('id', ledger.plan_id)
      .maybeSingle()

    if (plan) {
      // Mark transaction paid
      await supabase
        .from('subscriptions_ledgers')
        .update({ status: 'paid', updated_at: new Date().toISOString() })
        .eq('id', ledger.id)

      // Promote agency subscription plan & reset AI credits
      const { error: agencyErr } = await supabase
        .from('agencies')
        .update({
          plan: ledger.plan_id,
          ai_credits: plan.ai_credits_monthly || 0
        })
        .eq('id', ledger.agency_id)

      if (agencyErr) {
        log.error({ agencyId: ledger.agency_id, planId: ledger.plan_id, err: agencyErr }, 'Failed to update agency plan')
        captureException(new Error(agencyErr.message), { agencyId: ledger.agency_id, planId: ledger.plan_id, transactionId })
        return NextResponse.json({ success: false, error: 'Failed to update agency package' }, { status: 500 })
      }

      log.info({ agencyId: ledger.agency_id, planId: ledger.plan_id, transactionId }, 'Subscription upgrade applied successfully')
    }
  } else if (status === 'failed' || status === 'expired') {
    await supabase
      .from('subscriptions_ledgers')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', ledger.id)
  }

  return NextResponse.json({ success: true })
}
