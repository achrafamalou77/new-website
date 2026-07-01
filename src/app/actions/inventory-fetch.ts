'use server'

import { createClient } from '@/lib/supabase/server'

type InventoryMode = 'ventes' | 'location' | 'commande'

const mapSalesCar = (car: any) => {
  const specs = car.specs || {}
  return {
    ...car,
    ...specs,
    source_table: 'car_sales_inventory',
    variant: car.version || specs.variant || '',
    selling_price: car.price || specs.selling_price || car.final_price || 0,
    daily_rate: specs.daily_rate || specs.rental_daily_rate || car.rental_daily_rate || 0,
  }
}

const mapRentalCar = (car: any) => {
  const specs = car.specs || {}
  return {
    ...car,
    ...specs,
    source_table: 'car_rental_fleet',
    version: specs.version || '',
    variant: specs.variant || '',
    price: car.daily_rate || specs.daily_rate || 0,
    final_price: car.daily_rate || specs.daily_rate || 0,
    selling_price: car.daily_rate || specs.daily_rate || 0,
    daily_rate: car.daily_rate || specs.daily_rate || 0,
    car_type: 'rental',
  }
}

export async function getAvailableInventoryAction(mode: InventoryMode = 'ventes') {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('agency_id').eq('id', user.id).single()
  if (!profile || !profile.agency_id) return { success: false, error: 'Agency ID not found' }

  const agencyId = profile.agency_id as string

  const { data: salesCars, error } = await supabase
    .from('car_sales_inventory')
    .select('id, brand, model, year, version, color, status, price, final_price, car_type, specs')
    .eq('agency_id', agencyId)
    .order('brand', { ascending: true })

  if (error) return { success: false, error: error.message }

  let mappedCars = (salesCars || [])
    .map(mapSalesCar)
    .filter((car: any) => !['sold', 'rented', 'maintenance'].includes(car.status || ''))

  if (mode === 'ventes') {
    mappedCars = mappedCars.filter((car: any) => !['sur_command', 'rental'].includes(car.car_type || car.type || ''))
  }

  if (mode === 'commande') {
    mappedCars = mappedCars.filter((car: any) => (car.car_type || car.type || 'sur_command') === 'sur_command' || car.status === 'pending_import' || car.status === 'in_transit')
  }

  if (mode === 'location') {
    const rentalFromSales = mappedCars.filter((car: any) => (car.car_type || car.type) === 'rental')

    const { data: rentalFleet, error: rentalError } = await supabase
      .from('car_rental_fleet')
      .select('id, brand, model, year, color, status, daily_rate, specs')
      .eq('agency_id', agencyId)
      .order('brand', { ascending: true })

    if (rentalError) return { success: false, error: rentalError.message }

    mappedCars = [
      ...rentalFromSales,
      ...(rentalFleet || []).map(mapRentalCar).filter((car: any) => !['rented', 'maintenance'].includes(car.status || '')),
    ]
  }

  return { success: true, cars: mappedCars }
}
