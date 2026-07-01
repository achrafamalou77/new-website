import { createClient } from '@/lib/supabase/server'
import { ClientsDirectoryClient } from '@/components/dashboard/ClientsDirectoryClient'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

export default async function ClientsPage() {
  let clients: any[] = []
  let trips: any[] = []
  let businessTypeSlug = 'travel_agency'
  
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const supabase = await createClient()
      const headersList = await headers()
      let agencyId = headersList.get('x-agency-id')

      if (!agencyId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('agency_id')
            .eq('id', user.id)
            .single()
          agencyId = profile?.agency_id || null
        }
      }

      if (agencyId) {
        const { data: agency } = await supabase
          .from('agencies')
          .select('business_type_slug')
          .eq('id', agencyId)
          .single()
          
        if (agency?.business_type_slug) {
          businessTypeSlug = agency.business_type_slug
        }
      }
      
      let selectFields = '*, invoices(*)'
      if (businessTypeSlug === 'car_showroom') {
        selectFields = `
          *,
          car_sales_orders(*),
          car_rental_bookings(*),
          import_orders(*),
          invoices(*)
        `
      } else {
        selectFields = `
          *,
          visa_applications(*),
          invoices(*)
        `
      }
      
      let clientsQuery = supabase
        .from('clients')
        .select(selectFields)
        .order('created_at', { ascending: false })

      if (agencyId) {
        clientsQuery = clientsQuery.eq('agency_id', agencyId)
      }

      const { data } = await clientsQuery
      
      clients = data || []

      if (businessTypeSlug === 'car_showroom' && agencyId && clients.length > 0) {
        const vehicleIds = Array.from(new Set(
          clients.flatMap((client: any) => [
            ...(client.car_sales_orders || []).map((order: any) => order.car_id),
            ...(client.car_rental_bookings || []).map((booking: any) => booking.car_id),
          ]).filter(Boolean)
        ))

        if (vehicleIds.length > 0) {
          const [{ data: salesVehiclesData }, { data: rentalVehiclesData }] = await Promise.all([
            supabase
            .from('car_sales_inventory')
            .select('id, brand, model, year, version, color, status, price, final_price')
            .eq('agency_id', agencyId)
              .in('id', vehicleIds),
            supabase
              .from('car_rental_fleet')
              .select('id, brand, model, year, color, status, daily_rate')
              .eq('agency_id', agencyId)
              .in('id', vehicleIds),
          ])

          const vehiclesById = new Map<string, any>()
          ;(salesVehiclesData || []).forEach((vehicle: any) => vehiclesById.set(vehicle.id, vehicle))
          ;(rentalVehiclesData || []).forEach((vehicle: any) => vehiclesById.set(vehicle.id, vehicle))

          clients = clients.map((client: any) => ({
            ...client,
            car_sales_orders: (client.car_sales_orders || []).map((order: any) => ({
              ...order,
              vehicle: vehiclesById.get(order.car_id) || null,
            })),
            car_rental_bookings: (client.car_rental_bookings || []).map((booking: any) => ({
              ...booking,
              vehicle: vehiclesById.get(booking.car_id) || null,
            })),
          }))
        }
      }

      if (businessTypeSlug !== 'car_showroom') {
        const clientIds = clients.map(client => client.id)

        if (clientIds.length > 0 && agencyId) {
          const { data: bookingsData } = await supabase
            .from('bookings')
            .select('*')
            .eq('agency_id', agencyId)

          const bookingsByClientId = new Map<string, any[]>()
          ;(bookingsData || []).forEach((booking: any) => {
            const clientId = booking.client_manifest?.client_id
            if (!clientId || !clientIds.includes(clientId)) return
            const current = bookingsByClientId.get(clientId) || []
            current.push(booking)
            bookingsByClientId.set(clientId, current)
          })

          clients = clients.map(client => ({
            ...client,
            bookings: bookingsByClientId.get(client.id) || [],
          }))
        }

        const { data: tripsData } = await supabase
          .from('trips')
          .select('id, title, destination, price, duration_days')
          .eq('agency_id', agencyId as string)
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        trips = tripsData || []
      }
    } catch (e) {
      console.error('Failed to fetch clients and relationships from Supabase:', e)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 lg:p-8 font-geist">
      <ClientsDirectoryClient initialClients={clients} businessTypeSlug={businessTypeSlug} availableTrips={trips} />
    </div>
  )
}
