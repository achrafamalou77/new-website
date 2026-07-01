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
  classification: z.enum(['retail', 'b2b', 'corporate', 'wholesale']).optional().default('retail'),
  company_legal_name: z.string().optional().nullable().default(''),
  company_nif: z.string().optional().nullable().default(''),
  company_rc: z.string().optional().nullable().default(''),
  company_address: z.string().optional().nullable().default(''),
  contact_person: z.string().optional().nullable().default(''),
  volume_discount_tier: z.number().optional().nullable().default(0),
  id_card_url: z.string().optional().nullable().default(''),
  passport_url: z.string().optional().nullable().default(''),
  license_url: z.string().optional().nullable().default(''),
})

async function getUserAgencyContext(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, profile: null, error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, agency_id')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.agency_id) {
    return { user, profile: null, error: 'Agency profile not found' }
  }

  return { user, profile, error: null }
}

export async function createClientAction(formData: any) {
  const supabase = await createClient()

  const { profile, error: contextError } = await getUserAgencyContext(supabase)
  if (contextError || !profile) return { success: false, error: contextError || 'Agency profile not found' }
  const agencyId = profile.agency_id as string

  // Validate form data
  const validation = clientValidationSchema.safeParse(formData)
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message || 'Invalid input' }
  }

  const validatedData = validation.data
  const { data: newClient, error } = await (supabase).from('clients').insert({
    agency_id: agencyId,
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
    classification: validatedData.classification,
    company_legal_name: validatedData.company_legal_name || null,
    company_nif: validatedData.company_nif || null,
    company_rc: validatedData.company_rc || null,
    company_address: validatedData.company_address || null,
    contact_person: validatedData.contact_person || null,
    volume_discount_tier: validatedData.volume_discount_tier || 0,
    id_card_url: validatedData.id_card_url || null,
    passport_url: validatedData.passport_url || null,
    license_url: validatedData.license_url || null,
  } as any).select('id').single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/clients')
  return { success: true, clientId: newClient?.id }
}

export async function updateClientAction(clientId: string, formData: any) {
  const supabase = await createClient()

  const { profile, error: contextError } = await getUserAgencyContext(supabase)
  if (contextError || !profile) return { success: false, error: contextError || 'Agency profile not found' }
  const agencyId = profile.agency_id as string

  // Validate form data
  const validation = clientValidationSchema.safeParse(formData)
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message || 'Invalid input' }
  }

  const validatedData = validation.data
  const { data: updatedClient, error } = await (supabase).from('clients').update({
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
    classification: validatedData.classification,
    company_legal_name: validatedData.company_legal_name || null,
    company_nif: validatedData.company_nif || null,
    company_rc: validatedData.company_rc || null,
    company_address: validatedData.company_address || null,
    contact_person: validatedData.contact_person || null,
    volume_discount_tier: validatedData.volume_discount_tier || 0,
    id_card_url: validatedData.id_card_url || null,
    passport_url: validatedData.passport_url || null,
    license_url: validatedData.license_url || null,
  } as any)
    .eq('id', clientId)
    .eq('agency_id', agencyId)
    .select('id')
    .maybeSingle()

  if (error) {
    return { success: false, error: error.message }
  }

  if (!updatedClient) {
    return { success: false, error: 'Client not found in this agency' }
  }

  revalidatePath('/dashboard/clients')
  revalidatePath(`/dashboard/clients/${clientId}`)
  return { success: true }
}

export async function deleteClientAction(clientId: string) {
  const supabase = await createClient()

  const { profile, error: contextError } = await getUserAgencyContext(supabase)
  if (contextError || !profile) return { success: false, error: contextError || 'Agency profile not found' }
  const agencyId = profile.agency_id as string

  if (profile?.role !== 'superadmin') {
    return { success: false, error: 'Only superadmins can delete clients' }
  }

  const { data: deletedClient, error } = await (supabase)
    .from('clients')
    .delete()
    .eq('id', clientId)
    .eq('agency_id', agencyId)
    .select('id')
    .maybeSingle()

  if (error) {
    return { success: false, error: error.message }
  }

  if (!deletedClient) {
    return { success: false, error: 'Client not found in this agency' }
  }

  revalidatePath('/dashboard/clients')
  return { success: true }
}
