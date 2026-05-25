'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Helper to verify auth and retrieve agency_id
async function getAuthenticatedAgency() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, agencyId: null, error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('agency_id').eq('id', user.id).single()
  if (!profile || !profile.agency_id) return { user, agencyId: null, error: 'Agency ID not found' }

  return { user, agencyId: profile.agency_id as string, error: null }
}

// Helper to map flat front-end car payloads to proper database column structures
function mapClientCarToDbSchema(carData: any, agencyId: string) {
  const dbColumns = [
    'id',
    'agency_id',
    'brand',
    'model',
    'year',
    'version',
    'color',
    'price',
    'cost_price',
    'margin',
    'status',
    'type',
    'car_type',
    'quantity',
    'rental_daily_rate',
    'tracking_number',
    'container_id',
    'owner_type',
    'owner_client_id',
    'commission_percentage',
    'commission_flat_fee',
    'owner_target_payout',
    'consignment_agreement_details',
    'description',
    'images',
    'specs',
    'created_at',
    'updated_at',
  ]

  // Construct the packed specs object
  const specs: Record<string, any> = { ...(carData.specs || {}) }
  
  // Extract images
  const images = Array.isArray(carData.images) ? carData.images : []

  // Map values from carData to direct DB columns if present, or fallback
  const directData: Record<string, any> = {}
  
  // Explicitly copy direct columns
  directData.agency_id = agencyId
  if (carData.id) directData.id = carData.id
  directData.brand = carData.brand
  directData.model = carData.model
  directData.year = Number(carData.year)
  directData.version = carData.version || null
  directData.color = carData.color || carData.color_exterior || null
  directData.price = Number(carData.price) || Number(carData.selling_price) || 0
  directData.cost_price = Number(carData.cost_price) || Number(carData.purchase_price) || null
  directData.margin = Number(carData.margin) || (directData.price - (directData.cost_price || 0)) || null
  directData.status = carData.status || 'available'
  
  // In the DB column 'type' it can only be 'stock' or 'sur_commande'
  let dbType = carData.type || carData.car_type || 'stock'
  if (dbType === 'sell') dbType = 'stock' // map form 'sell' type to db 'stock'
  if (dbType === 'sur_command') dbType = 'sur_commande' // map form 'sur_command' to db 'sur_commande'
  directData.type = dbType
  directData.car_type = carData.car_type || 'sell'
  
  if (carData.quantity !== undefined) directData.quantity = Number(carData.quantity)
  if (carData.rental_daily_rate !== undefined) directData.rental_daily_rate = Number(carData.rental_daily_rate)
  if (carData.tracking_number !== undefined) directData.tracking_number = carData.tracking_number || null
  if (carData.container_id !== undefined) directData.container_id = carData.container_id === '' ? null : carData.container_id
  
  directData.description = carData.description || null
  
  if (carData.owner_type) directData.owner_type = carData.owner_type
  if (carData.owner_client_id) directData.owner_client_id = carData.owner_client_id || null
  if (carData.commission_percentage !== undefined) directData.commission_percentage = carData.commission_percentage === '' ? null : Number(carData.commission_percentage)
  if (carData.commission_flat_fee !== undefined) directData.commission_flat_fee = carData.commission_flat_fee === '' ? null : Number(carData.commission_flat_fee)
  if (carData.owner_target_payout !== undefined) directData.owner_target_payout = carData.owner_target_payout === '' ? null : Number(carData.owner_target_payout)
  if (carData.consignment_agreement_details) directData.consignment_agreement_details = carData.consignment_agreement_details
  
  // Pack all other fields in specs
  const excludedKeys = [...dbColumns, 'car_type', 'selling_price', 'purchase_price', 'color_exterior', 'containers']
  Object.keys(carData).forEach(key => {
    if (!excludedKeys.includes(key)) {
      specs[key] = carData[key]
    }
  })

  // Put specs & images onto the final directData payload
  directData.specs = specs
  directData.images = images

  return directData
}

// ─── Get Inventory ────────────────────────────────────────────────────────────
export async function getInventoryAction() {
  const supabase = await createClient()
  const { user, agencyId, error: authErr } = await getAuthenticatedAgency()
  if (authErr || !agencyId) return { success: false, error: authErr || 'Unauthorized' }

  const { data: cars, error } = await supabase
    .from('car_sales_inventory')
    .select(`
      *,
      containers (
        id,
        container_number,
        status,
        estimated_arrival_date
      )
    `)
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false })

  if (error) return { success: false, error: error.message }

  // Unpack/Flatten specs column for front-end consumption
  const flattenedCars = (cars || []).map((car: any) => {
    const specs = car.specs || {}
    return {
      ...car,
      ...specs,
      // Ensure front-end aliases are mapped for compatibility
      color_exterior: car.color || specs.color_exterior || '',
      selling_price: car.price || specs.selling_price || 0,
      purchase_price: car.cost_price || specs.purchase_price || 0,
      car_type: car.car_type || car.type || specs.car_type || 'sell',
    }
  })

  return { success: true, cars: flattenedCars }
}

// ─── Get Containers ───────────────────────────────────────────────────────────
export async function getContainersAction() {
  const supabase = await createClient()
  const { agencyId, error: authErr } = await getAuthenticatedAgency()
  if (authErr || !agencyId) return { success: false, error: authErr || 'Unauthorized' }

  const { data: containers, error } = await supabase
    .from('containers')
    .select('id, container_number, status, estimated_arrival_date')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false })

  if (error) return { success: false, error: error.message }
  return { success: true, containers }
}

// ─── Save Car (Create or Update) ─────────────────────────────────────────────
export async function saveCarAction(carData: any) {
  const supabase = await createClient()
  const { user, agencyId, error: authErr } = await getAuthenticatedAgency()
  if (authErr || !user || !agencyId) return { success: false, error: authErr || 'Unauthorized' }

  // Map client form state to direct DB columns and pack remainder inside specs
  const payload = mapClientCarToDbSchema(carData, agencyId)

  const isUpdate = !!payload.id
  let oldStatus: string | null = null

  if (isUpdate) {
    // Fetch old status for history logging (safely select only 'status' to avoid non-existent column errors)
    const { data: existing } = await (supabase
      .from('car_sales_inventory')
      .select('status') as any)
      .eq('id', payload.id)
      .single()
    if (existing) oldStatus = (existing as any).status

    const { error } = await supabase
      .from('car_sales_inventory')
      .update(payload as any)
      .eq('id', payload.id)
      .eq('agency_id', agencyId)

    if (error) return { success: false, error: error.message }

    // Log history events
    const historyEvents: any[] = []
    if (oldStatus && oldStatus !== payload.status) {
      historyEvents.push({
        car_id: payload.id,
        agency_id: agencyId,
        event_type: 'status_change',
        title: `Status changed to ${payload.status}`,
        old_value: oldStatus,
        new_value: payload.status,
        performed_by: user.id
      })
    }
    if (historyEvents.length > 0) {
      await supabase.from('vehicle_history' as any).insert(historyEvents)
    }
  } else {
    const { data: inserted, error } = await supabase
      .from('car_sales_inventory')
      .insert([payload] as any)
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }

    // Log creation event
    if (inserted) {
      await supabase.from('vehicle_history' as any).insert([{
        car_id: inserted.id,
        agency_id: agencyId,
        event_type: 'imported',
        title: `Vehicle added to inventory`,
        description: `${payload.brand} ${payload.model} ${payload.year} added as ${payload.car_type || 'sell'}`,
        performed_by: user.id
      }])
    }
  }

  revalidatePath('/dashboard/management/sales')
  return { success: true }
}

// ─── Delete Car ───────────────────────────────────────────────────────────────
export async function deleteCarAction(carId: string) {
  const supabase = await createClient()
  const { agencyId, error: authErr } = await getAuthenticatedAgency()
  if (authErr || !agencyId) return { success: false, error: authErr || 'Unauthorized' }

  const { error } = await supabase
    .from('car_sales_inventory')
    .delete()
    .eq('id', carId)
    .eq('agency_id', agencyId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/management/sales')
  return { success: true }
}

// ─── Get Vehicle History ──────────────────────────────────────────────────────
export async function getVehicleHistoryAction(carId: string) {
  const supabase = await createClient()
  const { agencyId, error: authErr } = await getAuthenticatedAgency()
  if (authErr || !agencyId) return { success: false, error: authErr || 'Unauthorized' }

  const { data: history, error } = await supabase
    .from('vehicle_history' as any)
    .select('*')
    .eq('car_id', carId)
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false })

  if (error) return { success: false, error: error.message }
  return { success: true, history: history || [] }
}

// ─── Add Vehicle History Event ────────────────────────────────────────────────
export async function addVehicleHistoryEvent(carId: string, event: {
  event_type: string
  title: string
  description?: string
  old_value?: string
  new_value?: string
  metadata?: Record<string, any>
}) {
  const supabase = await createClient()
  const { user, agencyId, error: authErr } = await getAuthenticatedAgency()
  if (authErr || !user || !agencyId) return { success: false, error: authErr || 'Unauthorized' }

  const { error } = await supabase.from('vehicle_history' as any).insert([{
    car_id: carId,
    agency_id: agencyId,
    performed_by: user.id,
    ...event
  }])

  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ─── Get Rental Bookings ──────────────────────────────────────────────────────
export async function getRentalBookingsAction(carId: string) {
  const supabase = await createClient()
  const { agencyId, error: authErr } = await getAuthenticatedAgency()
  if (authErr || !agencyId) return { success: false, error: authErr || 'Unauthorized' }

  const { data: bookings, error } = await supabase
    .from('rental_bookings')
    .select('*, client:clients(full_name, phone, email)')
    .eq('car_id', carId)
    .eq('agency_id', agencyId)
    .order('pickup_date', { ascending: true })

  if (error) return { success: false, error: error.message }
  return { success: true, bookings: bookings || [] }
}

// ─── Get All Rental Bookings ──────────────────────────────────────────────────
export async function getAllRentalBookingsAction() {
  const supabase = await createClient()
  const { agencyId, error: authErr } = await getAuthenticatedAgency()
  if (authErr || !agencyId) return { success: false, error: authErr || 'Unauthorized' }

  const { data: bookings, error } = await supabase
    .from('rental_bookings')
    .select(`
      *,
      client:clients(id, full_name, phone, email),
      car:car_rental_fleet(id, brand, model, year, color, daily_rate, status, specs, images)
    `)
    .eq('agency_id', agencyId)
    .order('pickup_date', { ascending: true })

  if (error) return { success: false, error: error.message }
  return { success: true, bookings: bookings || [] }
}

// ─── Create Rental Booking ────────────────────────────────────────────────────
export async function createRentalBookingAction(booking: {
  car_id: string
  client_id?: string
  client_name?: string
  client_phone?: string
  pickup_date: string
  return_date: string
  total_price: number
  deposit_amount: number
  notes?: string
  metadata?: any
}) {
  const supabase = await createClient()
  const { agencyId, error: authErr } = await getAuthenticatedAgency()
  if (authErr || !agencyId) return { success: false, error: authErr || 'Unauthorized' }

  let finalClientId = booking.client_id

  // If no client_id, create client inline
  if (!finalClientId && booking.client_name) {
    const { data: newClient, error: clientErr } = await supabase
      .from('clients')
      .insert({
        agency_id: agencyId,
        full_name: booking.client_name,
        phone: booking.client_phone || '',
        source: 'walk_in'
      })
      .select('id')
      .single()

    if (clientErr) return { success: false, error: 'Client creation failed: ' + clientErr.message }
    finalClientId = newClient.id
  }

  if (!finalClientId) return { success: false, error: 'Client is required' }

  const { error } = await supabase.from('rental_bookings').insert([{
    agency_id: agencyId,
    car_id: booking.car_id,
    client_id: finalClientId,
    pickup_date: booking.pickup_date,
    return_date: booking.return_date,
    total_price: booking.total_price,
    deposit_amount: booking.deposit_amount,
    status: 'confirmed',
    notes: booking.notes || '',
    metadata: booking.metadata || {}
  }] as any)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/management/rental')
  return { success: true }
}

// ─── Update Rental Booking ────────────────────────────────────────────────────
export async function updateRentalBookingAction(bookingId: string, updates: {
  status?: string
  actual_return_date?: string
  deposit_amount?: number
  total_price?: number
  notes?: string
  metadata?: any
}) {
  const supabase = await createClient()
  const { agencyId, error: authErr } = await getAuthenticatedAgency()
  if (authErr || !agencyId) return { success: false, error: authErr || 'Unauthorized' }

  const { error } = await supabase
    .from('rental_bookings')
    .update(updates as any)
    .eq('id', bookingId)
    .eq('agency_id', agencyId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/management/rental')
  return { success: true }
}

// ─── Delete Rental Booking ────────────────────────────────────────────────────
export async function deleteRentalBookingAction(bookingId: string) {
  const supabase = await createClient()
  const { agencyId, error: authErr } = await getAuthenticatedAgency()
  if (authErr || !agencyId) return { success: false, error: authErr || 'Unauthorized' }

  const { error } = await supabase
    .from('rental_bookings')
    .delete()
    .eq('id', bookingId)
    .eq('agency_id', agencyId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/management/rental')
  return { success: true }
}

// ─── Upload Car Image to Supabase Storage ────────────────────────────────────
export async function uploadCarImageAction(formData: FormData): Promise<{ success: boolean; url?: string; error?: string }> {
  const supabase = await createClient()
  const { agencyId, error: authErr } = await getAuthenticatedAgency()
  if (authErr || !agencyId) return { success: false, error: authErr || 'Unauthorized' }

  const file = formData.get('file') as File
  if (!file) return { success: false, error: 'No file provided' }

  const ext = file.name.split('.').pop()
  const fileName = `${agencyId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { data, error } = await supabase.storage
    .from('car-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type
    })

  if (error) return { success: false, error: error.message }

  const { data: publicData } = supabase.storage
    .from('car-images')
    .getPublicUrl(data.path)

  return { success: true, url: publicData.publicUrl }
}

// ─── Bulk Import Cars from CSV data ──────────────────────────────────────────
export async function bulkImportCarsAction(carsData: any[]) {
  const supabase = await createClient()
  const { agencyId, error: authErr } = await getAuthenticatedAgency()
  if (authErr || !agencyId) return { success: false, error: authErr || 'Unauthorized' }

  const payload = carsData.map(car => mapClientCarToDbSchema(car, agencyId))

  const { error } = await supabase
    .from('car_sales_inventory')
    .insert(payload as any)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/management/sales')
  return { success: true, imported: payload.length }
}

// ─── Get Rental Fleet ────────────────────────────────────────────────────────
export async function getRentalFleetAction() {
  const supabase = await createClient()
  const { agencyId, error: authErr } = await getAuthenticatedAgency()
  if (authErr || !agencyId) return { success: false, error: authErr || 'Unauthorized' }

  const { data: fleet, error } = await supabase
    .from('car_rental_fleet')
    .select('*')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false })

  if (error) return { success: false, error: error.message }
  return { success: true, fleet: fleet || [] }
}

// ─── Save Rental Car ─────────────────────────────────────────────────────────
export async function saveRentalCarAction(carData: any) {
  const supabase = await createClient()
  const { agencyId, error: authErr } = await getAuthenticatedAgency()
  if (authErr || !agencyId) return { success: false, error: authErr || 'Unauthorized' }

  const payload = {
    ...carData,
    agency_id: agencyId
  }

  const isUpdate = !!payload.id

  if (isUpdate) {
    const { error } = await supabase
      .from('car_rental_fleet')
      .update(payload)
      .eq('id', payload.id)
      .eq('agency_id', agencyId)

    if (error) return { success: false, error: error.message }
  } else {
    const { error } = await supabase
      .from('car_rental_fleet')
      .insert([payload])

    if (error) return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/management/rental')
  return { success: true }
}

// ─── Delete Rental Car ───────────────────────────────────────────────────────
export async function deleteRentalCarAction(carId: string) {
  const supabase = await createClient()
  const { agencyId, error: authErr } = await getAuthenticatedAgency()
  if (authErr || !agencyId) return { success: false, error: authErr || 'Unauthorized' }

  const { error } = await supabase
    .from('car_rental_fleet')
    .delete()
    .eq('id', carId)
    .eq('agency_id', agencyId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/management/rental')
  return { success: true }
}
