import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WebsiteSettingsClient } from '@/components/dashboard/WebsiteSettingsClient'
import { isEcommerceBusinessType } from '@/lib/business-types'

export const metadata = {
  title: 'Builder Site Web | Dashboard',
}

export default async function WebsiteSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let businessTypeSlug = 'travel'
  let activeTrips: any[] = []
  let visaTypes: any[] = []

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

      // Car showroom → redirect to full Visual Builder
      if (businessTypeSlug === 'car_showroom') {
        redirect('/dashboard/settings/website/builder')
      }

      // Online Store → dedicated Ecommerce Storefront Builder
      if (isEcommerceBusinessType(businessTypeSlug)) {
        redirect('/dashboard/store/storefront')
      }

      // Load trips and visas in parallel (travel only)
      const [tripsRes, visaRes] = await Promise.all([
        supabase
          .from('trips')
          .select('id, title, destination, price, duration_days, image_urls, is_active, description')
          .eq('agency_id', profile.agency_id)
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
        supabase
          .from('visa_types')
          .select('id, name, country, price, processing_days, requirements, is_active')
          .eq('agency_id', profile.agency_id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
      ])

      activeTrips = tripsRes.data || []
      visaTypes = visaRes.data || []
    }
  }

  return (
    <WebsiteSettingsClient
      activeTrips={activeTrips}
      visaTypes={visaTypes}
    />
  )
}
