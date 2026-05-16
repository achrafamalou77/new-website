import { createClient } from '@/lib/supabase/server'
import { isSupabaseConnected } from '@/lib/supabase/client'
import { mockBookings, mockTrips } from '@/lib/mock-data'
import { BookingsClient } from '@/components/dashboard/BookingsClient'

export default async function BookingsPage() {
  let initialBookings = [...mockBookings]
  let trips = [...mockTrips]

  if (isSupabaseConnected) {
    const supabase = await createClient()

    const { data: bookingsData } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })
      
    if (bookingsData) initialBookings = bookingsData

    const { data: tripsData } = await supabase
      .from('trips')
      .select('id, title')
      
    if (tripsData) trips = tripsData as any[]
  }

  return <BookingsClient initialBookings={initialBookings} trips={trips} />
}
