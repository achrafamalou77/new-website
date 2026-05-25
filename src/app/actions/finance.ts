'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function getAuthSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, profile: null }

  const profilesTable: any = supabase.from('profiles')
  const { data: profileData } = await profilesTable
    .select('role, agency_id')
    .eq('id', user.id)
    .single()

  return { user, profile: profileData }
}

// 1. Financial Accounts
export async function getFinancialAccounts() {
  const supabase = await createClient()
  const session = await getAuthSession()
  if (!session.user || !session.profile) return []

  const accountsTable: any = supabase.from('financial_accounts')
  const { data, error } = await accountsTable
    .select('id, agency_id, name, type, account_number, bank_name, opening_balance, current_balance, currency, is_default, created_at, updated_at')
    .eq('agency_id', session.profile.agency_id)
    .order('created_at', { ascending: true })

  if (error) return []
  return data || []
}

export async function createFinancialAccount(payload: any) {
  const supabase = await createClient()
  const session = await getAuthSession()
  if (!session.user || !session.profile) return { success: false, error: 'Unauthorized' }

  const accountsTable: any = supabase.from('financial_accounts')
  const { error } = await accountsTable
    .insert({
      ...payload,
      agency_id: session.profile.agency_id
    })

  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard/finance')
  return { success: true }
}

// 2. Suppliers
export async function getSuppliers() {
  const supabase = await createClient()
  const session = await getAuthSession()
  if (!session.user || !session.profile) return []

  const suppliersTable: any = supabase.from('suppliers')
  const { data, error } = await suppliersTable
    .select('id, agency_id, name, type, contact_name, phone, email, address, country, payment_terms, currency, notes, created_at, updated_at')
    .eq('agency_id', session.profile.agency_id)
    .order('name', { ascending: true })

  if (error) return []
  return data || []
}

export async function createSupplier(payload: any) {
  const supabase = await createClient()
  const session = await getAuthSession()
  if (!session.user || !session.profile) return { success: false, error: 'Unauthorized' }

  const suppliersTable: any = supabase.from('suppliers')
  const { error } = await suppliersTable
    .insert({
      ...payload,
      agency_id: session.profile.agency_id
    })

  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard/finance')
  return { success: true }
}

// 3. Supplier Payments
export async function getSupplierPayments() {
  const supabase = await createClient()
  const session = await getAuthSession()
  if (!session.user || !session.profile) return []

  const paymentsTable: any = supabase.from('supplier_payments')
  const { data, error } = await paymentsTable
    .select(`
      id, agency_id, supplier_id, trip_id, description, amount_due, amount_paid, balance_due, due_date, status, created_at, updated_at,
      suppliers (
        name,
        type
      ),
      trips (
        title
      )
    `)
    .eq('agency_id', session.profile.agency_id)
    .order('due_date', { ascending: true })

  if (error) return []
  
  return (data || []).map((p: any) => ({
    ...p,
    supplier_name: p.suppliers?.name,
    trip_title: p.trips?.title
  }))
}

export async function createSupplierPayment(payload: any) {
  const supabase = await createClient()
  const session = await getAuthSession()
  if (!session.user || !session.profile) return { success: false, error: 'Unauthorized' }

  const paymentsTable: any = supabase.from('supplier_payments')
  const { error } = await paymentsTable
    .insert({
      ...payload,
      agency_id: session.profile.agency_id
    })

  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard/finance')
  return { success: true }
}

// 4. Transactions
export async function getTransactions(limit: number = 100) {
  const supabase = await createClient()
  const session = await getAuthSession()
  if (!session.user || !session.profile) return []

  const transactionsTable: any = supabase.from('transactions')
  const { data, error } = await transactionsTable
    .select(`
      id, agency_id, account_id, transfer_to_account_id, type, category, amount, currency, exchange_rate, description, reference_number, related_booking_id, related_invoice_id, related_employee_id, related_supplier_id, payment_method, payment_proof_url, transaction_date, recorded_by, is_recurring, recurring_frequency, notes, created_at, updated_at,
      financial_accounts (
        name
      ),
      profiles!transactions_recorded_by_fkey (
        full_name
      )
    `)
    .eq('agency_id', session.profile.agency_id)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching transactions", error)
    return []
  }

  return (data || []).map((t: any) => ({
    ...t,
    account_name: t.financial_accounts?.name,
    recorded_by_name: t.profiles?.full_name || 'System'
  }))
}

export async function recordTransaction(payload: any) {
  const supabase = await createClient()
  const session = await getAuthSession()
  if (!session.user || !session.profile) return { success: false, error: 'Unauthorized' }

  const transactionsTable: any = supabase.from('transactions')
  const { error } = await transactionsTable
    .insert({
      ...payload,
      agency_id: session.profile.agency_id,
      recorded_by: session.user.id
    })

  if (error) return { success: false, error: error.message }
  
  // Also revalidate bookings if related_booking_id is passed, so booking details updates
  if (payload.related_booking_id) {
    revalidatePath(`/dashboard/bookings`)
  }
  revalidatePath('/dashboard/finance')
  return { success: true }
}

// 5. Finance Stats
export async function getFinanceStats(year: number, month: number) {
  const supabase = await createClient()
  const session = await getAuthSession()
  if (!session.user || !session.profile) return { income: 0, expense: 0, net: 0, overdue_payments: 0 }

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`

  // Transactions
  const transactionsTable: any = supabase.from('transactions')
  const { data: txs } = await transactionsTable
    .select('amount, type')
    .eq('agency_id', session.profile.agency_id)
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)

  let income = 0
  let expense = 0

  if (txs) {
    txs.forEach((t: any) => {
      if (t.type === 'income') income += t.amount
      if (t.type === 'expense') expense += t.amount
    })
  }

  // Overdue supplier payments
  const paymentsTable: any = supabase.from('supplier_payments')
  const { data: payments } = await paymentsTable
    .select('balance_due')
    .eq('agency_id', session.profile.agency_id)
    .in('status', ['overdue', 'unpaid'])
    .lt('due_date', new Date().toISOString().split('T')[0])

  let overdue = 0
  if (payments) {
    payments.forEach((p: any) => {
      overdue += (p.balance_due || 0)
    })
  }

  return {
    income,
    expense,
    net: income - expense,
    overdue_payments: overdue
  }
}
