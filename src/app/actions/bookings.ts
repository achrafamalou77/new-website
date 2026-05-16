'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateBookingStatus(bookingId: string, status: 'pending_payment' | 'completed' | 'cancelled') {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return { success: true }

  const supabase = await createClient()

  // Verify auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const bookingsTable: any = supabase.from('bookings')
  const { error } = await bookingsTable.update({ status }).eq('id', bookingId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/bookings')
  return { success: true }
}
