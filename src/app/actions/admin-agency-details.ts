'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function getAgencyDetails(agencyId: string) {
  const adminClient = createAdminClient()

  const { data: agency } = await adminClient
    .from('agencies')
    .select('*, plan:plans(name)')
    .eq('id', agencyId)
    .single()

  if (!agency) return null

  // Get counts
  const { count: tripsCount } = await adminClient.from('trips').select('*', { count: 'exact', head: true }).eq('agency_id', agencyId)
  const { count: conversationsCount } = await adminClient.from('conversations').select('*', { count: 'exact', head: true }).eq('agency_id', agencyId)
  const { count: bookingsCount } = await adminClient.from('bookings').select('*', { count: 'exact', head: true }).eq('agency_id', agencyId)
  const { count: employeesCount } = await adminClient.from('profiles').select('*', { count: 'exact', head: true }).eq('agency_id', agencyId)

  // Recent activity (conversations)
  const { data: recentConversations } = await adminClient
    .from('conversations')
    .select('id, customer_name, platform, lead_score, created_at')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false })
    .limit(5)

  // Recent bookings
  const { data: recentBookings } = await adminClient
    .from('bookings')
    .select('id, status, total_price, created_at, client_manifest, trip:trips(title)')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false })
    .limit(5)

  return {
    agency,
    stats: {
      trips: tripsCount || 0,
      conversations: conversationsCount || 0,
      bookings: bookingsCount || 0,
      employees: employeesCount || 0
    },
    recentConversations: recentConversations || [],
    recentBookings: recentBookings || []
  }
}
