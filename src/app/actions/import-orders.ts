'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Get all import orders for the agency
export async function getImportOrders() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: profile } = await (supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single())

  if (!profile || !profile.agency_id) return { success: false, error: 'Agency not found' }

  // Select fields and join with clients table
  const { data, error } = await (supabase)
    .from('import_orders')
    .select('*, client:clients(full_name, phone, email)')
    .eq('agency_id', profile.agency_id)
    .order('order_date', { ascending: false })

  if (error) return { success: false, error: error.message }
  return { success: true, data }
}

// Get all clients for the agency to select from
export async function getAgencyClients() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: profile } = await (supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single())

  if (!profile || !profile.agency_id) return { success: false, error: 'Agency not found' }

  const { data, error } = await (supabase)
    .from('clients')
    .select('id, full_name, phone, email')
    .eq('agency_id', profile.agency_id)
    .order('full_name', { ascending: true })

  if (error) return { success: false, error: error.message }
  return { success: true, data }
}

// Create an import order (and optionally find/create the client)
export async function createImportOrder(orderData: {
  client_id?: string
  clientName?: string
  clientPhone?: string
  vehicle_brand: string
  vehicle_model: string
  vehicle_year: number
  color?: string
  total_cost?: number
  deposit_paid?: number
  balance_due?: number
  specs?: any
  supplier_name?: string
  origin_country?: string
  carrier?: string
  tracking_number?: string
  container_id?: string
  tracking_status?: string
  custom_duties_fee?: number
  transitaire_broker_fee?: number
  additional_logistics_fee?: number
  allocated_container_share?: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: profile } = await (supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single())

  if (!profile || !profile.agency_id) return { success: false, error: 'Agency not found' }

  let finalClientId = orderData.client_id

  // If no client_id was provided but clientName and clientPhone are, try to find or create the client
  if (!finalClientId && orderData.clientName) {
    // Look up client by phone
    const phoneToFind = orderData.clientPhone || ''
    const { data: existingClient } = await (supabase)
      .from('clients')
      .select('id')
      .eq('agency_id', profile.agency_id)
      .eq('phone', phoneToFind)
      .maybeSingle()

    if (existingClient) {
      finalClientId = existingClient.id
    } else {
      // Create new client
      const { data: newClient, error: clientErr } = await (supabase)
        .from('clients')
        .insert({
          agency_id: profile.agency_id,
          full_name: orderData.clientName,
          phone: orderData.clientPhone || 'N/A',
          source: 'direct'
        })
        .select('id')
        .single()

      if (clientErr) return { success: false, error: 'Failed to create client: ' + clientErr.message }
      finalClientId = newClient.id
    }
  }

  if (!finalClientId) {
    return { success: false, error: 'Client identification required' }
  }

  const { data, error } = await (supabase)
    .from('import_orders')
    .insert({
      agency_id: profile.agency_id,
      client_id: finalClientId,
      vehicle_brand: orderData.vehicle_brand,
      vehicle_model: orderData.vehicle_model,
      vehicle_year: Number(orderData.vehicle_year),
      color: orderData.color || null,
      total_cost: orderData.total_cost || 0,
      deposit_paid: orderData.deposit_paid || 0,
      balance_due: (orderData.total_cost || 0) - (orderData.deposit_paid || 0),
      specs: orderData.specs || {},
      supplier_name: orderData.supplier_name || null,
      origin_country: orderData.origin_country || null,
      carrier: orderData.carrier || null,
      tracking_number: orderData.tracking_number || null,
      container_id: orderData.container_id || null,
      tracking_status: orderData.tracking_status || 'At Origin Port',
      // Phase 2 financial columns
      custom_duties_fee: orderData.custom_duties_fee || 0,
      transitaire_broker_fee: orderData.transitaire_broker_fee || 0,
      additional_logistics_fee: orderData.additional_logistics_fee || 0,
      allocated_container_share: orderData.allocated_container_share || 0,
      status: 'deposit_paid', // Start after deposit is paid
      shipping_status: []
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/management/import')
  return { success: true, data }
}

// Update import order details (e.g. status, tracking, customs, balance)
export async function updateImportOrder(orderId: string, orderData: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  // Recalculate balance_due if total_cost or deposit_paid changes
  if (orderData.total_cost !== undefined || orderData.deposit_paid !== undefined) {
    const { data: currentOrder } = await (supabase)
      .from('import_orders')
      .select('total_cost, deposit_paid')
      .eq('id', orderId)
      .single()

    if (currentOrder) {
      const tc = orderData.total_cost !== undefined ? Number(orderData.total_cost) : (currentOrder.total_cost || 0)
      const dp = orderData.deposit_paid !== undefined ? Number(orderData.deposit_paid) : (currentOrder.deposit_paid || 0)
      orderData.balance_due = tc - dp;
    }
  }

  const { data, error } = await (supabase)
    .from('import_orders')
    .update(orderData)
    .eq('id', orderId)
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/management/import')
  return { success: true, data }
}

// Delete an import order
export async function deleteImportOrder(orderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { error } = await (supabase)
    .from('import_orders')
    .delete()
    .eq('id', orderId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/management/import')
  return { success: true }
}
