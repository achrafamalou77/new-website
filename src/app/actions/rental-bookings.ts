'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createRentalBooking(data: {
  client_id: string
  car_id: string
  start_date: string
  end_date: string
  total_price: number
  invoice_id?: string
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('agency_id').eq('id', user.id).single()
  if (!profile || !profile.agency_id) return { success: false, error: 'Agency ID not found' }

  const { data: booking, error } = await supabase.from('car_rental_bookings').insert({
    agency_id: profile.agency_id,
    client_id: data.client_id,
    car_id: data.car_id,
    start_date: data.start_date,
    end_date: data.end_date,
    total_price: data.total_price,
    invoice_id: data.invoice_id || null,
    status: 'active'
  } as any).select().single()

  if (error) return { success: false, error: error.message }

  // Update car inventory status to 'rented' if it's currently active
  await supabase.from('car_sales_inventory')
    .update({ status: 'rented' } as any)
    .eq('id', data.car_id)

  revalidatePath('/dashboard/clients')
  revalidatePath(`/dashboard/clients/${data.client_id}`)
  return { success: true, booking }
}

export async function updateRentalBookingStatus(bookingId: string, status: string, carId?: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { error } = await supabase.from('car_rental_bookings')
    .update({ status: status } as any)
    .eq('id', bookingId)

  if (error) return { success: false, error: error.message }
  
  // If completed or cancelled, make car available again
  if ((status === 'completed' || status === 'cancelled') && carId) {
    await supabase.from('car_sales_inventory')
      .update({ status: 'available' } as any)
      .eq('id', carId)
  }

  revalidatePath('/dashboard/clients')
  return { success: true }
}

export async function deleteRentalBooking(bookingId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { error } = await supabase.from('car_rental_bookings').delete().eq('id', bookingId)
  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/clients')
  return { success: true }
}
