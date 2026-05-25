'use server'

import { createClient } from '@/lib/supabase/server'

export async function getAvailableInventoryAction() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('agency_id').eq('id', user.id).single()
  if (!profile || !profile.agency_id) return { success: false, error: 'Agency ID not found' }

  const agencyId = profile.agency_id as string

  const { data: cars, error } = await supabase
    .from('car_sales_inventory')
    .select('id, brand, model, year, version, status, price, final_price, car_type, specs')
    .eq('agency_id', agencyId)
    .eq('status', 'available')
    .order('brand', { ascending: true })

  if (error) return { success: false, error: error.message }

  // Map to flat structure so front-end has selling_price, variant, etc.
  const mappedCars = (cars || []).map((car: any) => {
    const specs = car.specs || {}
    return {
      ...car,
      ...specs,
      variant: car.version || specs.variant || '',
      selling_price: car.price || specs.selling_price || 0,
    }
  })

  return { success: true, cars: mappedCars }
}
