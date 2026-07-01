'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentAgencyContext } from '@/lib/server/agency-context'

async function requireShowroomContext() {
  const context = await getCurrentAgencyContext()
  if (!context.userId || !context.agencyId) return { success: false as const, error: 'Unauthorized' }
  if (context.businessTypeSlug !== 'car_showroom') {
    return { success: false as const, error: 'Rental bookings are only available for car showroom agencies' }
  }
  return { success: true as const, context: { ...context, agencyId: context.agencyId as string } }
}

export async function createRentalBooking(data: {
  client_id: string
  car_id: string
  start_date: string
  end_date: string
  total_price: number
  invoice_id?: string
}) {
  const supabase = await createClient()
  const guard = await requireShowroomContext()
  if (!guard.success) return guard

  const { data: booking, error } = await supabase.from('car_rental_bookings').insert({
    agency_id: guard.context.agencyId,
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
    .eq('agency_id', guard.context.agencyId)

  revalidatePath('/dashboard/clients')
  revalidatePath(`/dashboard/clients/${data.client_id}`)
  return { success: true, booking }
}

export async function updateRentalBookingStatus(bookingId: string, status: string, carId?: string) {
  const supabase = await createClient()
  const guard = await requireShowroomContext()
  if (!guard.success) return guard

  const { data: booking, error } = await supabase.from('car_rental_bookings')
    .update({ status: status } as any)
    .eq('id', bookingId)
    .eq('agency_id', guard.context.agencyId)
    .select('id')
    .maybeSingle()

  if (error) return { success: false, error: error.message }
  if (!booking) return { success: false, error: 'Rental booking not found in this agency' }
  
  // If completed or cancelled, make car available again
  if ((status === 'completed' || status === 'cancelled') && carId) {
    await supabase.from('car_sales_inventory')
      .update({ status: 'available' } as any)
      .eq('id', carId)
      .eq('agency_id', guard.context.agencyId)
  }

  revalidatePath('/dashboard/clients')
  return { success: true }
}

export async function deleteRentalBooking(bookingId: string) {
  const supabase = await createClient()
  const guard = await requireShowroomContext()
  if (!guard.success) return guard

  const { data: booking, error } = await supabase
    .from('car_rental_bookings')
    .delete()
    .eq('id', bookingId)
    .eq('agency_id', guard.context.agencyId)
    .select('id')
    .maybeSingle()
  if (error) return { success: false, error: error.message }
  if (!booking) return { success: false, error: 'Rental booking not found in this agency' }

  revalidatePath('/dashboard/clients')
  return { success: true }
}
