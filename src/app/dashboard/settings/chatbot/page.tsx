import { createClient } from '@/lib/supabase/server'
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

      if (isShowroom) {
        // Query available sales cars
        const { data: salesData } = await supabase
          .from('car_sales_inventory')
          .select('id, brand, model, year, price, status, specs')
          .eq('agency_id', profile.agency_id)
          .eq('status', 'available')
          .order('brand', { ascending: true })

        // Query available rental cars
        const { data: rentalData } = await supabase
          .from('car_rental_fleet')
          .select('id, brand, model, year, daily_rate, status, specs')
          .eq('agency_id', profile.agency_id)
          .eq('status', 'available')
          .order('brand', { ascending: true })

        const salesCars = (salesData || []).map(car => ({
          id: car.id,
          title: `${car.brand} ${car.model} (${car.year})`,
          destination: 'Vente',
          price: car.price,
          type: 'sales',
          specs: car.specs || {}
        }))

        const rentalCars = (rentalData || []).map(car => ({
          id: car.id,
          title: `${car.brand} ${car.model} (${car.year})`,
          destination: 'Location',
          price: car.daily_rate,
          type: 'rental',
          specs: car.specs || {}
        }))

        activeCars = [...salesCars, ...rentalCars]
      } else {
        const { data } = await supabase
          .from('trips')
          .select('*')
          .eq('agency_id', profile.agency_id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
        activeTrips = data || []
      }
    }
  }

  return <ChatbotSettingsClient activeTrips={activeTrips} activeCars={activeCars} agencyId={agencyId} />
}
