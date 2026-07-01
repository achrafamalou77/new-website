'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { buildContainerTrackingSnapshot } from '@/lib/container-tracking'


// Fetch all containers for the current agency
export async function getContainers() {
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
    .from('containers')
    .select('*')
    .eq('agency_id', profile.agency_id)
    .order('created_at', { ascending: false })

  if (error) return { success: false, error: error.message }
  return { success: true, data }
}

// Fetch single container details and all linked vehicles
export async function getContainerDetails(containerId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data, error } = await (supabase)
    .from('containers')
    .select('*')
    .eq('id', containerId)
    .single()

  if (error) return { success: false, error: error.message }

  // Fetch cars associated with this container from import_orders
  const { data: linkedCars, error: carsError } = await (supabase)
    .from('import_orders')
    .select('*')
    .eq('container_id', containerId)

  if (carsError) return { success: false, error: carsError.message }

  return { success: true, data, linkedCars }
}

// Create a new container
export async function createContainer(containerData: {
  container_number: string
  shipping_line: string
  status: string
  vessel_name?: string
  voyage_number?: string
  departure_port?: string
  arrival_port?: string
  departure_date?: string
  estimated_arrival_date?: string
  notes?: string
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

  const { data, error } = await (supabase)
    .from('containers')
    .insert({
      ...containerData,
      agency_id: profile.agency_id,
      updated_at: new Date().toISOString()
    } as any)
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  
  revalidatePath('/dashboard/management/import')
  return { success: true, data }
}

// Update a container's status and details
export async function updateContainer(containerId: string, containerData: {
  container_number?: string
  shipping_line?: string
  status?: string
  vessel_name?: string
  voyage_number?: string
  departure_port?: string
  arrival_port?: string
  departure_date?: string
  estimated_arrival_date?: string
  notes?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data, error } = await (supabase)
    .from('containers')
    .update({
      ...containerData,
      updated_at: new Date().toISOString()
    } as any)
    .eq('id', containerId)
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  // If status is updated, propagate the status update to linked import_orders
  if (containerData.status) {
    const { error: syncError } = await (supabase)
      .from('import_orders')
      .update({ tracking_status: containerData.status })
      .eq('container_id', containerId)
    
    if (syncError) console.error('Failed to sync tracking status with linked cars:', syncError.message)
  }

  revalidatePath('/dashboard/management/import')
  return { success: true, data }
}

// Delete container (cars are automatically unlinked by Supabase via ON DELETE SET NULL)
export async function deleteContainer(containerId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { error } = await (supabase)
    .from('containers')
    .delete()
    .eq('id', containerId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/management/import')
  return { success: true }
}

// Link multiple cars (import_orders) to a container
export async function linkCarsToContainer(containerId: string, carIds: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  // Get current container status to sync it with linked cars
  const { data: container, error: containerError } = await (supabase)
    .from('containers')
    .select('status')
    .eq('id', containerId)
    .single()

  if (containerError) return { success: false, error: containerError.message }

  const { error } = await (supabase)
    .from('import_orders')
    .update({ 
      container_id: containerId,
      tracking_status: container.status
    })
    .in('id', carIds)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/management/import')
  return { success: true }
}

// Unlink multiple cars from their container
export async function unlinkCarsFromContainer(carIds: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { error } = await (supabase)
    .from('import_orders')
    .update({ 
      container_id: null,
      tracking_status: 'At Origin Port'
    })
    .in('id', carIds)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/management/import')
  return { success: true }
}

// Fetch all import orders not associated with any container
export async function getUnlinkedImportCars() {
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
    .from('import_orders')
    .select('*')
    .eq('agency_id', profile.agency_id)
    .is('container_id', null)
    .order('order_date', { ascending: false })

  if (error) return { success: false, error: error.message }
  return { success: true, data }
}

function normalizeAlgerianPhone(phone: string): string {
  let clean = phone.trim().replace(/\s+/g, '')
  if (clean.startsWith('0')) {
    clean = '+213' + clean.substring(1)
  }
  return clean
}

function maskClientName(name: string): string {
  if (!name) return ''
  return name.split(' ').map(word => {
    if (word.length <= 1) return word
    return word[0] + '•'.repeat(word.length - 1)
  }).join(' ')
}

// ─── Dynamic Live AIS Marine Vessel Tracking Simulation ──────────────────────
function getLiveTrackingInfo(containerObj: any) {
  return buildContainerTrackingSnapshot(containerObj)

/*
  if (!containerObj) return null

  const status = (containerObj.status || '').toLowerCase()
  
  let lat = 39.5
  let lng = 4.2
  let speed = 19.4
  let heading = 188
  let statusText = 'Under Way Using Engine'
  let historyLogs = [
    { time: '2026-05-24T08:00:00Z', event: 'Port Gate-In & Verified', loc: containerObj.departure_port || 'Marseille Port' },
    { time: '2026-05-24T14:30:00Z', event: 'Vessel Loaded & Secured', loc: containerObj.departure_port || 'Marseille Port' }
  ]

  if (status.includes('origin') || status.includes('depart') || status.includes('quote') || status.includes('deposit') || status.includes('ordered')) {
    lat = 43.3444
    lng = 5.3484 // Marseille
    speed = 0.0
    heading = 0
    statusText = 'Moored / Loading manifests'
    historyLogs.push({ time: '2026-05-25T08:00:00Z', event: 'Manifest Loaded into System', loc: containerObj.departure_port || 'Marseille Port' })
  } else if (status.includes('vessel') || status.includes('sea') || status.includes('transit') || status.includes('ship')) {
    lat = 39.8452
    lng = 4.3121 // Middle of Mediterranean Sea
    speed = 18.6
    heading = 194
    statusText = 'Under Way Using Engine (Sailing)'
    historyLogs.push(
      { time: '2026-05-25T02:15:00Z', event: 'Sailed Marseille Anchorage', loc: 'Gulf of Lion' },
      { time: '2026-05-26T06:30:00Z', event: 'AIS Beacon Sweep Active', loc: 'Balearic Sea (Sardinia passage)' }
    )
  } else if (status.includes('arrived') || status.includes('algiers') || status.includes('customs') || status.includes('port')) {
    lat = 36.7725
    lng = 3.0714 // Algiers Port
    speed = 0.0
    heading = 90
    statusText = 'Moored / Discharging Cargo'
    historyLogs.push(
      { time: '2026-05-25T02:15:00Z', event: 'Sailed Marseille Anchorage', loc: 'Gulf of Lion' },
      { time: '2026-05-25T23:00:00Z', event: 'Vessel Berthed', loc: 'Port of Algiers' },
      { time: '2026-05-26T09:00:00Z', event: 'Customs Transit Agent Notified', loc: 'Algiers Customs Terminal' }
    )
  } else if (status.includes('dispatch') || status.includes('deliver') || status.includes('ready')) {
    lat = 36.7525
    lng = 3.0414 // Showroom
    speed = 0.0
    heading = 0
    statusText = 'Delivered & De-consolidated'
    historyLogs.push(
      { time: '2026-05-25T23:00:00Z', event: 'Vessel Berthed', loc: 'Port of Algiers' },
      { time: '2026-05-26T08:15:00Z', event: 'Customs Clearance Finalized', loc: 'Algiers Customs Terminal' },
      { time: '2026-05-26T11:30:00Z', event: 'Dispatched to Showroom Hub', loc: 'Algeria Regional Logistics' }
    )
  }

  return {
    vessel_name: containerObj.vessel_name || 'MSC VALERIA V-88',
    vessel_speed: speed,
    vessel_heading: heading,
    vessel_lat: lat,
    vessel_lng: lng,
    vessel_status: statusText,
    vessel_route: `${containerObj.departure_port || 'Marseille, FR'} ➔ ${containerObj.arrival_port || 'Algiers, DZ'}`,
    ais_quality: 'Class-A Satellite AIS (Excellent)',
    ais_history: historyLogs
  }
*/
}

export async function getContainerTrackingInfo(query: string, agencyId: string, clientPhone?: string) {
  const supabase = createAdminClient()
  const cleanQuery = query.trim().toUpperCase()
  const agencyUuid = agencyId

  // 1. Check if the query is a Phone Number
  const isPhone = /^(0[567]\d{8}|\+213[567]\d{8}|[567]\d{8})$/.test(cleanQuery)

  if (isPhone) {
    const targetPhone = normalizeAlgerianPhone(cleanQuery)
    const { data: clientsList, error: clientErr } = await (supabase)
      .from('clients')
      .select('id, full_name, phone')
      .eq('phone', targetPhone)
      .eq('agency_id', agencyUuid)

    if (clientErr) {
      return { success: false, error: 'Erreur lors de la recherche du client.' }
    }

    if (clientsList && clientsList.length > 0) {
      const clientObj = clientsList[0]
      const { data: clientOrders, error: ordersErr } = await (supabase)
        .from('import_orders')
        .select('*, container:containers(*)')
        .eq('client_id', clientObj.id)
        .eq('agency_id', agencyUuid)
        .order('order_date', { ascending: false })

      if (ordersErr) {
        return { success: false, error: 'Erreur lors du chargement des commandes.' }
      }

      // Enrich joined container for client phone searches
      const enrichedOrders = (clientOrders || []).map((order: any) => {
        if (order.container) {
          order.container = {
            ...order.container,
            live_tracking: getLiveTrackingInfo(order.container)
          }
        }
        return order
      })

      return { 
        success: true, 
        type: 'client_phone', 
        client: clientObj, 
        data: enrichedOrders
      }
    } else {
      return { success: false, error: 'Aucun dossier client trouvé pour ce numéro de téléphone dans cet établissement.' }
    }
  }

  // 2. Check if query is a Container Number
  const isContainerNumber = /^[A-Z0-9]{4,15}$/.test(cleanQuery)

  if (isContainerNumber) {
    const { data: containers, error: containerError } = await (supabase)
      .from('containers')
      .select('*')
      .eq('agency_id', agencyUuid)
      .ilike('container_number', `%${cleanQuery}%`)

    if (containerError) {
      return { success: false, error: 'Erreur lors de la recherche du conteneur.' }
    }

    if (containers && containers.length > 0) {
      const containerObj = containers[0]

      // If a client phone was passed for cargo verification
      if (clientPhone) {
        const targetPhone = normalizeAlgerianPhone(clientPhone)
        
        // Fetch all orders in this container, joining client details
        const { data: containerOrders, error: ordersErr } = await (supabase)
          .from('import_orders')
          .select('*, client:clients(full_name, phone)')
          .eq('container_id', containerObj.id)
          .eq('agency_id', agencyUuid)

        if (ordersErr) {
          return { success: false, error: 'Erreur lors de la vérification de cargaison.' }
        }

        // Filter to return ONLY this client's vehicles
        const filteredOrders = (containerOrders || []).filter((order: any) => {
          if (!order.client?.phone) return false
          return normalizeAlgerianPhone(order.client.phone) === targetPhone
        })

        if (filteredOrders.length > 0) {
          const clientData = {
            full_name: filteredOrders[0].client.full_name,
            phone: filteredOrders[0].client.phone
          }
          return {
            success: true,
            type: 'container',
            lockedCargo: false,
            client: clientData,
            data: [{
              ...containerObj,
              live_tracking: getLiveTrackingInfo(containerObj),
              import_orders: filteredOrders
            }]
          }
        } else {
          return { 
            success: false, 
            error: 'Aucun véhicule correspondant à ce numéro de téléphone dans ce conteneur.' 
          }
        }
      } else {
        // No client phone provided. Safe container-only tracking!
        return {
          success: true,
          type: 'container',
          lockedCargo: true,
          data: [{
            ...containerObj,
            live_tracking: getLiveTrackingInfo(containerObj),
            import_orders: [] // Keep vehicle array strictly empty to preserve privacy
          }]
        }
      }
    }
  }

  // 3. Check if query is a Unique Vehicle Tracking Number
  if (cleanQuery.length >= 6) {
    const { data: matchingOrders, error: orderErr } = await (supabase)
      .from('import_orders')
      .select('*, container:containers(*), client:clients(full_name, phone)')
      .eq('agency_id', agencyUuid)
      .ilike('tracking_number', `%${cleanQuery}%`)

    if (orderErr) {
      return { success: false, error: 'Erreur lors de la recherche du numéro de suivi.' }
    }

    if (matchingOrders && matchingOrders.length > 0) {
      const order = matchingOrders[0]
      const maskedClient = {
        full_name: maskClientName(order.client?.full_name || ''),
        phone: '••••••••••'
      }

      // Stripping financial amounts to preserve strict privacy under tracking number queries
      const securedOrder = {
        ...order,
        client: maskedClient,
        total_cost: 0,
        deposit_paid: 0,
        balance_due: 0,
        container: order.container ? {
          ...order.container,
          live_tracking: getLiveTrackingInfo(order.container)
        } : null
      }

      return {
        success: true,
        type: 'tracking_number',
        client: maskedClient,
        data: [securedOrder]
      }
    }
  }

  return { 
    success: false, 
    error: 'Recherche non valide ou inexistante. Veuillez entrer un N° de Conteneur (ex: MSCU8829402), votre N° de Téléphone (ex: 0770123456) ou votre N° de Suivi Unique.' 
  }
}
