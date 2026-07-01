'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export async function getBuilderConfig() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await (supabase
    .from('profiles'))
    .select('agency_id, role')
    .eq('id', user.id)
    .single()
  
  if (!profile || !(profile).agency_id) throw new Error('Agency not found')

  // Get agency details to check business type
  const { data: agency } = await (supabase
    .from('agencies'))
    .select('*')
    .eq('id', (profile).agency_id)
    .single()

  if (!agency) throw new Error('Agency not found')


  // Fetch from website_configs table
  let { data: config, error } = await (supabase
    .from('website_configs'))
    .select('*')
    .eq('agency_id', (profile).agency_id)
    .maybeSingle()

  if (error) throw error

  // If no website configs exist yet, initialize a new record
  if (!config) {
    const { data: newConfig, error: insertError } = await (supabase
      .from('website_configs'))
      .insert({
        agency_id: (profile).agency_id,
        builder_data: {},
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    if (insertError) throw insertError
    config = newConfig
  }

  // Get the last 10 revisions
  const { data: revisions } = await (supabase
    .from('website_revisions'))
    .select('id, revision_number, created_at, published_at')
    .eq('agency_id', (profile).agency_id)
    .order('revision_number', { ascending: false })
    .limit(10)

  return {
    agency,
    config,
    revisions: revisions || []
  }
}

export async function saveBuilderDraft(builderData: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await (supabase
    .from('profiles'))
    .select('agency_id')
    .eq('id', user.id)
    .single()
  
  if (!profile || !(profile).agency_id) throw new Error('Agency not found')

  const { error } = await (supabase
    .from('website_configs'))
    .update({
      builder_data: builderData,
      updated_at: new Date().toISOString()
    })
    .eq('agency_id', (profile).agency_id)

  if (error) throw error
  return { success: true }
}

export async function publishBuilderConfig(builderData: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await (supabase
    .from('profiles'))
    .select('agency_id')
    .eq('id', user.id)
    .single()
  
  if (!profile || !(profile).agency_id) throw new Error('Agency not found')

  // Find latest revision number
  const { data: latest } = await (supabase
    .from('website_revisions'))
    .select('revision_number')
    .eq('agency_id', (profile).agency_id)
    .order('revision_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextRevision = ((latest)?.revision_number || 0) + 1

  // 1. Add to revisions table
  const { error: revError } = await (supabase
    .from('website_revisions'))
    .insert({
      agency_id: (profile).agency_id,
      revision_number: nextRevision,
      builder_data: builderData,
      published_at: new Date().toISOString(),
      created_by: user.id
    })

  if (revError) throw revError

  // 2. Commit live configs
  const { error: confError } = await (supabase
    .from('website_configs'))
    .update({
      builder_data: builderData,
      updated_at: new Date().toISOString()
    })
    .eq('agency_id', (profile).agency_id)

  if (confError) throw confError

  revalidatePath('/', 'layout')
  return { success: true, revision: nextRevision }
}

export async function getRevisionData(revisionId: string) {
  const supabase = await createClient()
  const { data, error } = await (supabase
    .from('website_revisions'))
    .select('builder_data')
    .eq('id', revisionId)
    .single()
  if (error) throw error
  return (data).builder_data
}

export async function uploadBuilderImage(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non autorisé' }

  const { data: profile } = await (supabase
    .from('profiles'))
    .select('agency_id')
    .eq('id', user.id)
    .single()
  
  if (!profile || !profile.agency_id) return { success: false, error: 'Agence introuvable' }

  const file = formData.get('file')
  if (!(file instanceof File)) return { success: false, error: 'Aucun fichier fourni' }
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
    return { success: false, error: 'Seules les images JPG, PNG, WebP et GIF sont autorisées' }
  }
  if (file.size > 10 * 1024 * 1024) {
    return { success: false, error: 'L\'image doit faire moins de 10 Mo' }
  }

  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${profile.agency_id}/${crypto.randomUUID()}.${extension}`
  
  const admin: any = createAdminClient()
  const { error } = await admin.storage
    .from('ecommerce-assets')
    .upload(path, file, { contentType: file.type, cacheControl: '31536000' })
  if (error) return { success: false, error: error.message }
  
  const { data } = admin.storage.from('ecommerce-assets').getPublicUrl(path)
  return { success: true, url: data.publicUrl }
}
