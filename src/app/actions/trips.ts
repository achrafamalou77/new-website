'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createTrip(formData: any) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { success: true } // Demo mode
  }

  const supabase = await createClient()

  // Verify superadmin role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }
  
  const { data: profileData } = await supabase.from('profiles').select('role, agency_id').eq('id', user.id).single()
  const profile = profileData as any
  if (profile?.role !== 'superadmin') {
    return { success: false, error: 'Only superadmins can create trips' }
  }

  const { title, description, price, destination, duration_days, image_urls, is_active } = formData

  const tripsTable: any = supabase.from('trips')
  const { error } = await tripsTable.insert({
    agency_id: profile.agency_id,
    title,
    description,
    price: Number(price),
    destination,
    duration_days: Number(duration_days),
    image_urls: image_urls ? image_urls.split(',').map((url: string) => url.trim()) : [],
    is_active
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/trips')
  return { success: true }
}

export async function updateTrip(tripId: string, formData: any) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return { success: true }

  const supabase = await createClient()

  // Verify superadmin role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }
  
  const { data: profileData } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const profile = profileData as any
  if (profile?.role !== 'superadmin') {
    return { success: false, error: 'Only superadmins can update trips' }
  }

  const { title, description, price, destination, duration_days, image_urls, is_active } = formData

  const tripsTable: any = supabase.from('trips')
  const { error } = await tripsTable.update({
    title,
    description,
    price: Number(price),
    destination,
    duration_days: Number(duration_days),
    image_urls: typeof image_urls === 'string' ? image_urls.split(',').map((url: string) => url.trim()) : image_urls,
    is_active
  }).eq('id', tripId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/trips')
  return { success: true }
}

export async function deleteTrip(tripId: string) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return { success: true }

  const supabase = await createClient()

  // Verify superadmin role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }
  
  const { data: profileData } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const profile = profileData as any
  if (profile?.role !== 'superadmin') {
    return { success: false, error: 'Only superadmins can delete trips' }
  }

  // Check for active bookings
  const { count, error: countError } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('trip_id', tripId)
    .neq('status', 'cancelled')

  if (countError) {
    return { success: false, error: 'Failed to verify active bookings' }
  }

  if (count && count > 0) {
    return { success: false, error: 'Cannot delete trip with active bookings.' }
  }

  const { error } = await supabase.from('trips').delete().eq('id', tripId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/trips')
  return { success: true }
}
