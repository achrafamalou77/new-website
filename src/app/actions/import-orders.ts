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

// Export/import dossiers must be created from eligible inventory, not free text.
export async function getExportEligibleInventoryCars() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: profile } = await (supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single())

  if (!profile || !profile.agency_id) return { success: false, error: 'Agency not found' }

  const { data, error } = await supabase
    .from('car_sales_inventory')
    .select('*')
    .eq('agency_id', profile.agency_id)
    .eq('status', 'available')
    .order('brand', { ascending: true })

  if (error) return { success: false, error: error.message }

  const cars = (data || []).filter((car: any) => {
    const specs = car.specs || {}
    const quantity = Number(car.quantity ?? 1)
    const eligibleType =
      car.car_type === 'sur_command' ||
      car.type === 'sur_commande' ||
      specs.import_type === 'sur_command' ||
      specs.import_type === 'export' ||
      specs.export_eligible === true

    return eligibleType && quantity > 0
  }).map((car: any) => {
    const specs = car.specs || {}
    return {
      ...car,
      ...specs,
      quantity: Number(car.quantity ?? specs.quantity ?? 1),
      selling_price: Number(car.price ?? specs.selling_price ?? 0),
      purchase_price: Number(car.cost_price ?? specs.purchase_price ?? 0),
      color_exterior: car.color || specs.color_exterior || '',
      display_name: `${car.brand} ${car.model}${car.version ? ` ${car.version}` : ''} (${car.year})`
    }
  })

  return { success: true, data: cars }
}

// Create an import order (and optionally find/create the client)
export async function createImportOrder(orderData: {
  client_id?: string
  clientName?: string
  clientPhone?: string
  clientEmail?: string
  clientIdCardNumber?: string
  clientPassportNumber?: string
  clientDateOfBirth?: string
  clientAddress?: string
  clientCity?: string
  clientNotes?: string
  inventory_car_id: string
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
  let selectedInventoryCar: any = null

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
      const extraClientNotes = [
        orderData.clientIdCardNumber ? `ID/NIN: ${orderData.clientIdCardNumber}` : '',
        orderData.clientPassportNumber ? `Passport: ${orderData.clientPassportNumber}` : '',
        orderData.clientDateOfBirth ? `Date of birth: ${orderData.clientDateOfBirth}` : '',
        orderData.clientCity ? `City: ${orderData.clientCity}` : '',
        orderData.clientAddress ? `Address: ${orderData.clientAddress}` : '',
        orderData.clientNotes || ''
      ].filter(Boolean).join('\n')

      const { data: newClient, error: clientErr } = await (supabase)
        .from('clients')
        .insert({
          agency_id: profile.agency_id,
          full_name: orderData.clientName,
          phone: orderData.clientPhone || 'N/A',
          email: orderData.clientEmail || null,
          notes: extraClientNotes || null,
          source: 'walk_in'
        } as any)
        .select('id')
        .single()

      if (clientErr) return { success: false, error: 'Failed to create client: ' + clientErr.message }
      finalClientId = newClient.id
    }
  }

  if (!finalClientId) {
    return { success: false, error: 'Client identification required' }
  }

  if (!orderData.inventory_car_id) {
    return { success: false, error: 'Please choose an export vehicle from inventory' }
  }

  const { data: inventoryCar, error: inventoryErr } = await supabase
    .from('car_sales_inventory')
    .select('*')
    .eq('id', orderData.inventory_car_id)
    .eq('agency_id', profile.agency_id)
    .eq('status', 'available')
    .single()

  if (inventoryErr || !inventoryCar) {
    return { success: false, error: 'Selected vehicle is not available in inventory' }
  }

  const inventorySpecs = (inventoryCar as any).specs || {}
  const inventoryQuantity = Number((inventoryCar as any).quantity ?? inventorySpecs.quantity ?? 1)
  const exportEligible =
    (inventoryCar as any).car_type === 'sur_command' ||
    (inventoryCar as any).type === 'sur_commande' ||
    inventorySpecs.import_type === 'sur_command' ||
    inventorySpecs.import_type === 'export' ||
    inventorySpecs.export_eligible === true

  if (!exportEligible) {
    return { success: false, error: 'Only export / Sur Commande inventory can be imported for a client' }
  }

  if (inventoryQuantity <= 0) {
    return { success: false, error: 'This vehicle has no quantity left in inventory' }
  }

  selectedInventoryCar = inventoryCar
  const nextQuantity = inventoryQuantity - 1
  const { error: stockErr } = await supabase
    .from('car_sales_inventory')
    .update({
      quantity: nextQuantity,
      status: nextQuantity > 0 ? 'available' : 'pending_import',
      updated_at: new Date().toISOString()
    } as any)
    .eq('id', orderData.inventory_car_id)
    .eq('agency_id', profile.agency_id)
    .eq('status', 'available')

  if (stockErr) return { success: false, error: 'Failed to reserve inventory: ' + stockErr.message }

  const vehicleBrand = selectedInventoryCar.brand || orderData.vehicle_brand
  const vehicleModel = selectedInventoryCar.model || orderData.vehicle_model
  const vehicleYear = Number(selectedInventoryCar.year || orderData.vehicle_year)
  const vehicleColor = selectedInventoryCar.color || inventorySpecs.color_exterior || orderData.color || null
  const totalCost = orderData.total_cost || Number(selectedInventoryCar.price || inventorySpecs.selling_price || 0)
  const depositPaid = orderData.deposit_paid || 0

  const { data, error } = await (supabase)
    .from('import_orders')
    .insert({
      agency_id: profile.agency_id,
      client_id: finalClientId,
      vehicle_brand: vehicleBrand,
      vehicle_model: vehicleModel,
      vehicle_year: vehicleYear,
      color: vehicleColor,
      total_cost: totalCost,
      deposit_paid: depositPaid,
      balance_due: totalCost - depositPaid,
      specs: {
        ...(orderData.specs || {}),
        inventory_car_id: orderData.inventory_car_id,
        inventory_stock_number: selectedInventoryCar.stock_number || null,
        reserved_quantity: 1,
        source_inventory: {
          brand: selectedInventoryCar.brand,
          model: selectedInventoryCar.model,
          year: selectedInventoryCar.year,
          version: selectedInventoryCar.version,
          previous_quantity: inventoryQuantity,
          remaining_quantity: nextQuantity
        }
      },
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

  if (error) {
    await supabase
      .from('car_sales_inventory')
      .update({
        quantity: inventoryQuantity,
        status: 'available',
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', orderData.inventory_car_id)
      .eq('agency_id', profile.agency_id)

    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/management/import')
  revalidatePath('/dashboard/management/sales')
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

  const { data: existingOrder } = await (supabase)
    .from('import_orders')
    .select('status, specs')
    .eq('id', orderId)
    .single()

  const { error } = await (supabase)
    .from('import_orders')
    .delete()
    .eq('id', orderId)

  if (error) return { success: false, error: error.message }

  const inventoryCarId = (existingOrder as any)?.specs?.inventory_car_id
  if (inventoryCarId && (existingOrder as any)?.status !== 'delivered') {
    const { data: car } = await supabase
      .from('car_sales_inventory')
      .select('quantity')
      .eq('id', inventoryCarId)
      .single()

    if (car) {
      await supabase
        .from('car_sales_inventory')
        .update({
          quantity: Number((car as any).quantity ?? 0) + 1,
          status: 'available',
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', inventoryCarId)
    }
  }

  revalidatePath('/dashboard/management/import')
  revalidatePath('/dashboard/management/sales')
  return { success: true }
}
