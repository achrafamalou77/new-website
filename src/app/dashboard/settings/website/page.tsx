import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WebsiteSettingsClient } from '@/components/dashboard/WebsiteSettingsClient'

export const metadata = {
  title: 'Paramètres Site Web | Dashboard',
}

export default async function WebsiteSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let businessTypeSlug = 'travel'
  let activeTrips: any[] = []

  if (user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('agency_id')
      .eq('id', user.id)
      .single()

    const profile = profileData as any

    if (profile?.agency_id) {
      const { data: agencyData } = await supabase
        .from('agencies')
        .select('business_type_slug')
        .eq('id', profile.agency_id)
        .single()

      businessTypeSlug = (agencyData as any)?.business_type_slug || 'travel'

      // Car showroom → redirect directly to the full Visual Builder
      if (businessTypeSlug === 'car_showroom') {
        redirect('/dashboard/settings/website/builder')
      }

      // Travel agency → load trips data
      const { data: tripsData } = await supabase
        .from('trips')
        .select('*')
        .eq('agency_id', profile.agency_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      activeTrips = tripsData || []
    }
  }

  return <WebsiteSettingsClient activeTrips={activeTrips} />
}
