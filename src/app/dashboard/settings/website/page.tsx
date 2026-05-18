import { createClient } from '@/lib/supabase/server'
import { WebsiteSettingsClient } from '@/components/dashboard/WebsiteSettingsClient'

export const metadata = {
  title: 'Website Settings | Dashboard',
}

export default async function WebsiteSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let activeTrips: any[] = []
  if (user) {
    const { data: profileData } = await supabase.from('profiles').select('agency_id').eq('id', user.id).single()
    const profile = profileData as any
    if (profile?.agency_id) {
      const { data } = await supabase
        .from('trips')
        .select('*')
        .eq('agency_id', profile.agency_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      activeTrips = data || []
    }
  }

  return <WebsiteSettingsClient activeTrips={activeTrips} />
}
