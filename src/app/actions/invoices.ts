'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const invoiceValidationSchema = z.object({
  client_id: z.string().min(1, 'Client is required'),
  trip_id: z.string().optional().nullable().default(null),
  issue_date: z.string().min(1, 'Issue date is required'),
  due_date: z.string().min(1, 'Due date is required'),
  status: z.enum(['draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled']).default('draft'),
  items: z.array(z.object({
    description: z.string().min(1, 'Description is required'),
    qty: z.number().min(1, 'Quantity must be at least 1'),
    unit_price: z.number().min(0, 'Price must be positive'),
    total: z.number().min(0)
  })).default([]),
  subtotal: z.number().default(0),
  discount_amount: z.number().default(0),
  discount_percent: z.number().default(0),
  tax_amount: z.number().default(0),
  tax_percent: z.number().default(0),
  total_amount: z.number().default(0),
  payment_method: z.enum(['CCP', 'Edahabia', 'Cash', 'Bank Transfer', 'Check']).optional().nullable().default(null),
  notes: z.string().optional().nullable().default(''),
  terms: z.string().optional().nullable().default(''),
})

const paymentValidationSchema = z.object({
  amount: z.number().min(1, 'Amount must be at least 1 DZD'),
  payment_method: z.string().min(1, 'Payment method is required'),
  payment_date: z.string().min(1, 'Payment date is required'),
  reference_number: z.string().optional().nullable().default(''),
  notes: z.string().optional().nullable().default(''),
  received_by: z.string().optional().nullable().default(''),
})

export async function createInvoiceAction(formData: any) {
  const supabase = await createClient()

  // Verify auth user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }
  
  const { data: profile } = await (supabase.from('profiles').select('role, agency_id').eq('id', user.id).single())
  if (!profile || !profile.agency_id) return { success: false, error: 'Agency ID not found' }

  const agencyId = profile.agency_id as string

  // Validate form data
  const validation = invoiceValidationSchema.safeParse(formData)
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message || 'Invalid input' }
  }

  const validatedData = validation.data

  // Auto-generate invoice number using database RPC function
  const { data: invoiceNumber, error: rpcError } = await (supabase).rpc('get_next_invoice_number', {
    p_agency_id: agencyId,
    p_issue_date: validatedData.issue_date
  })

  if (rpcError || !invoiceNumber) {
    return { success: false, error: rpcError?.message || 'Failed to generate invoice number' }
  }

  const { data: newInvoice, error } = await (supabase).from('invoices').insert({
    agency_id: agencyId,
    client_id: validatedData.client_id,
    invoice_number: invoiceNumber,
    trip_id: validatedData.trip_id || null,
    issue_date: validatedData.issue_date,
    due_date: validatedData.due_date,
    status: validatedData.status,
    items: validatedData.items,
    subtotal: validatedData.subtotal,
    discount_amount: validatedData.discount_amount,
    discount_percent: validatedData.discount_percent,
    tax_amount: validatedData.tax_amount,
    tax_percent: validatedData.tax_percent,
    total_amount: validatedData.total_amount,
    balance_due: validatedData.total_amount, // initially equals total
    payment_method: validatedData.payment_method,
    payment_status: 'unpaid',
    notes: validatedData.notes || null,
    terms: validatedData.terms || null,
  }).select().single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/invoices')
  revalidatePath(`/dashboard/clients/${validatedData.client_id}`)
  return { success: true, invoiceId: newInvoice.id }
}

export async function updateInvoiceStatusAction(invoiceId: string, status: string) {
  const supabase = await createClient()

  // Verify auth user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { error } = await (supabase).from('invoices').update({
    status: status,
    updated_at: new Date().toISOString()
  }).eq('id', invoiceId)

  if (error) {
    return { success: false, error: error.message }
  }

  if (status === 'paid') {
    const { data: invoice } = await (supabase).from('invoices').select('balance_due, agency_id').eq('id', invoiceId).single()
    if (invoice && invoice.balance_due > 0 && invoice.agency_id) {
      const { data: account } = await (supabase).from('financial_accounts').select('id').eq('agency_id', invoice.agency_id).eq('is_default', true).single()
      if (account) {
        await (supabase).from('transactions').insert({
          agency_id: invoice.agency_id,
          account_id: account.id,
          type: 'income',
          category: 'booking_payment',
          amount: invoice.balance_due,
          description: `Auto-generated: Marked as Paid`,
          related_invoice_id: invoiceId,
          transaction_date: new Date().toISOString().split('T')[0],
          recorded_by: user.id
        })
      }
      // Update balance
      await (supabase).from('invoices').update({ balance_due: 0, payment_status: 'paid' }).eq('id', invoiceId)
    }
  }

  revalidatePath('/dashboard/invoices')
  revalidatePath(`/dashboard/invoices/${invoiceId}`)
  return { success: true }
}

export async function recordPaymentAction(invoiceId: string, formData: any) {
  const supabase = await createClient()

  // Verify auth user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  // Validate form data
  const validation = paymentValidationSchema.safeParse(formData)
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message || 'Invalid input' }
  }

  const validatedData = validation.data
  const { error } = await (supabase).from('invoice_payments').insert({
    invoice_id: invoiceId,
    amount: Number(validatedData.amount),
    payment_method: validatedData.payment_method,
    payment_date: validatedData.payment_date,
    reference_number: validatedData.reference_number || null,
    notes: validatedData.notes || null,
    received_by: validatedData.received_by || null,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  // Also create a financial transaction for this partial payment
  const { data: profile } = await (supabase).from('profiles').select('agency_id').eq('id', user.id).single()
  if (profile && profile.agency_id) {
    const agencyId = profile.agency_id as string
    const { data: account } = await (supabase).from('financial_accounts').select('id').eq('agency_id', agencyId).order('is_default', { ascending: false }).limit(1).single()
    if (account) {
      let pm = validatedData.payment_method.toLowerCase().replace(' ', '_')
      if (!['ccp', 'edahabia', 'cash', 'bank_transfer', 'check', 'other'].includes(pm)) pm = 'other'
      
      await (supabase).from('transactions').insert({
        agency_id: agencyId,
        account_id: account.id,
        type: 'income',
        category: 'booking_payment',
        amount: Number(validatedData.amount),
        description: `Payment recorded for Invoice`,
        reference_number: validatedData.reference_number || null,
        related_invoice_id: invoiceId,
        payment_method: pm,
        transaction_date: validatedData.payment_date,
        recorded_by: user.id
      })
    }
  }

  revalidatePath('/dashboard/invoices')
  revalidatePath(`/dashboard/invoices/${invoiceId}`)
  return { success: true }
}

export async function deleteInvoiceAction(invoiceId: string) {
  const supabase = await createClient()

  // Verify auth user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }
  
  const { data: profile } = await (supabase.from('profiles').select('role').eq('id', user.id).single())
  if (profile?.role !== 'superadmin') {
    return { success: false, error: 'Only superadmins can delete invoices' }
  }

  const { error } = await (supabase).from('invoices').delete().eq('id', invoiceId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/invoices')
  return { success: true }
}

export async function getInvoiceAction(invoiceId: string) {
  const supabase = await createClient()

  // Verify auth user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: invoice, error } = await (supabase)
    .from('invoices')
    .select(`
      id, agency_id, client_id, trip_id, invoice_number, issue_date, due_date, status, items, subtotal, discount_amount, discount_percent, tax_amount, tax_percent, total_amount, balance_due, payment_method, payment_status, notes, terms, created_at, updated_at,
      client:clients(id, agency_id, full_name, phone, email, id_card_number, passport_number, date_of_birth, address, city, source, referred_by_id, notes, avatar_url, cni_number, created_at, updated_at)
    `)
    .eq('id', invoiceId)
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, invoice }
}

