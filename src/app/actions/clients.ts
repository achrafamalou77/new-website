'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const clientValidationSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').default(''),
  phone: z.string().optional().nullable().default(''),
  email: z.string().optional().nullable().default(''),
  id_card_number: z.string().optional().nullable().default(''),
  passport_number: z.string().optional().nullable().default(''),
  date_of_birth: z.string().optional().nullable().default(''),
  address: z.string().optional().nullable().default(''),
  city: z.string().optional().nullable().default(''),
  source: z.enum(['whatsapp', 'facebook', 'instagram', 'walk_in', 'referral', 'phone']).default('walk_in'),
  referred_by_id: z.string().optional().nullable().default(null),
  notes: z.string().optional().nullable().default(''),
})

export async function createClientAction(formData: any) {
  const supabase = await createClient()

  // Verify auth user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }
  
  const { data: profile } = await (supabase.from('profiles').select('role, agency_id').eq('id', user.id).single() as any)
  if (!profile) return { success: false, error: 'Profile not found' }

  // Validate form data
  const validation = clientValidationSchema.safeParse(formData)
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message || 'Invalid input' }
  }

  const validatedData = validation.data
  const { error } = await (supabase as any).from('clients').insert({
    agency_id: profile.agency_id,
    full_name: validatedData.full_name,
    phone: validatedData.phone || null,
    email: validatedData.email || null,
    id_card_number: validatedData.id_card_number || null,
    passport_number: validatedData.passport_number || null,
    date_of_birth: validatedData.date_of_birth || null,
    address: validatedData.address || null,
    city: validatedData.city || null,
    source: validatedData.source,
    referred_by_id: validatedData.referred_by_id || null,
    notes: validatedData.notes || null,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/clients')
  return { success: true }
}

export async function updateClientAction(clientId: string, formData: any) {
  const supabase = await createClient()

  // Verify auth user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  // Validate form data
  const validation = clientValidationSchema.safeParse(formData)
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message || 'Invalid input' }
  }

  const validatedData = validation.data
  const { error } = await (supabase as any).from('clients').update({
    full_name: validatedData.full_name,
    phone: validatedData.phone || null,
    email: validatedData.email || null,
    id_card_number: validatedData.id_card_number || null,
    passport_number: validatedData.passport_number || null,
    date_of_birth: validatedData.date_of_birth || null,
    address: validatedData.address || null,
    city: validatedData.city || null,
    source: validatedData.source,
    referred_by_id: validatedData.referred_by_id || null,
    notes: validatedData.notes || null,
  }).eq('id', clientId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/clients')
  revalidatePath(`/dashboard/clients/${clientId}`)
  return { success: true }
}

export async function deleteClientAction(clientId: string) {
  const supabase = await createClient()

  // Verify auth user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }
  
  const { data: profile } = await (supabase.from('profiles').select('role').eq('id', user.id).single() as any)
  if (profile?.role !== 'superadmin') {
    return { success: false, error: 'Only superadmins can delete clients' }
  }

  const { error } = await (supabase as any).from('clients').delete().eq('id', clientId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/clients')
  return { success: true }
}
