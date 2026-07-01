'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentAgencyContext } from '@/lib/server/agency-context'

export async function updateBookingStatus(bookingId: string, status: 'pending_payment' | 'completed' | 'cancelled') {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { success: false, error: 'Database is not configured; booking status was not changed.' }
  }

  const supabase = await createClient()
  const context = await getCurrentAgencyContext()

  if (!context.userId || !context.agencyId) return { success: false, error: 'Unauthorized' }
  if (context.businessTypeSlug === 'car_showroom') {
    return { success: false, error: 'Bookings are only available for travel agencies' }
  }

  const bookingsTable: any = supabase.from('bookings')
  const { data: booking, error } = await bookingsTable
    .update({ status })
    .eq('id', bookingId)
    .eq('agency_id', context.agencyId)
    .select('id')
    .maybeSingle()

  if (error) {
    return { success: false, error: error.message }
  }

  if (!booking) return { success: false, error: 'Booking not found in this agency' }

  revalidatePath('/dashboard/bookings')
  return { success: true }
}
