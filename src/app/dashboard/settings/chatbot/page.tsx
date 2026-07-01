import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ChatbotSettingsClient } from '@/components/dashboard/ChatbotSettingsClient'

export const metadata = {
  title: 'AI Chatbot Settings | Dashboard',
}

export default async function ChatbotSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let activeTrips: any[] = []
  let activeCars: any[] = []
  let agencyId = ''
  let metaIntegration: any = null
  
  if (user) {
    const { data: profileData } = await supabase.from('profiles').select('agency_id').eq('id', user.id).single()
    const profile = profileData as any
    if (profile?.agency_id) {
      agencyId = profile.agency_id
      
      // Fetch agency to resolve business vertical slug
      const { data: agencyData } = await supabase
        .from('agencies')
        .select('business_type_slug')
        .eq('id', profile.agency_id)
        .single()
      
      const isShowroom = agencyData?.business_type_slug === 'car_showroom'

      // Fetch vertical-specific catalog and Meta Integration concurrently
      if (isShowroom) {
        const [salesRes, rentalRes, metaRes] = await Promise.all([
          supabase
            .from('car_sales_inventory')
            .select('id, brand, model, year, price, status, specs')
            .eq('agency_id', profile.agency_id)
            .eq('status', 'available')
            .order('brand', { ascending: true }),
          supabase
            .from('car_rental_fleet')
            .select('id, brand, model, year, daily_rate, status, specs')
            .eq('agency_id', profile.agency_id)
            .eq('status', 'available')
            .order('brand', { ascending: true }),
          (async () => {
            try {
              const admin = createAdminClient() as any
              const { data } = await admin
                .from('meta_integrations')
                .select('*')
                .eq('agency_id', profile.agency_id)
                .maybeSingle()
              return data
            } catch (e) {
              return null
            }
          })()
        ])

        const salesCars = (salesRes.data || []).map(car => ({
          id: car.id,
          title: `${car.brand} ${car.model} (${car.year})`,
          destination: 'Vente',
          price: car.price,
          type: 'sales',
          specs: car.specs || {}
        }))

        const rentalCars = (rentalRes.data || []).map(car => ({
          id: car.id,
          title: `${car.brand} ${car.model} (${car.year})`,
          destination: 'Location',
          price: car.daily_rate,
          type: 'rental',
          specs: car.specs || {}
        }))

        activeCars = [...salesCars, ...rentalCars]
        metaIntegration = metaRes
      } else {
        const [tripsRes, metaRes] = await Promise.all([
          supabase
            .from('trips')
            .select('*')
            .eq('agency_id', profile.agency_id)
            .eq('is_active', true)
            .order('created_at', { ascending: false }),
          (async () => {
            try {
              const admin = createAdminClient() as any
              const { data } = await admin
                .from('meta_integrations')
                .select('*')
                .eq('agency_id', profile.agency_id)
                .maybeSingle()
              return data
            } catch (e) {
              return null
            }
          })()
        ])

        activeTrips = tripsRes.data || []
        metaIntegration = metaRes
      }
    }
  }

  return (
    <ChatbotSettingsClient
      activeTrips={activeTrips}
      activeCars={activeCars}
      agencyId={agencyId}
      metaIntegration={metaIntegration}
    />
  )
}
