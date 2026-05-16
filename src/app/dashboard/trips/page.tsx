import { createClient } from '@/lib/supabase/server'
import { isSupabaseConnected } from '@/lib/supabase/client'
import { mockTrips, mockProfiles } from '@/lib/mock-data'
import { TripsClient } from '@/components/dashboard/TripsClient'

export default async function TripsPage() {
  let initialTrips = [...mockTrips]
  let userRole = mockProfiles[0].role // Default superadmin for mock

  if (isSupabaseConnected) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: profileData } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      const profile = profileData as any
      if (profile) userRole = profile.role
    }

    const { data } = await supabase.from('trips').select('*').order('created_at', { ascending: false })
    if (data) {
      initialTrips = data
    }
  }

  return <TripsClient initialTrips={initialTrips} userRole={userRole!} />
}
