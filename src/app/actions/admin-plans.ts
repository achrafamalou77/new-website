'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requirePlatformOwner } from '@/lib/server/platform-owner'
import { revalidatePath } from 'next/cache'

export async function getPlans() {
  const owner = await requirePlatformOwner()
  if (!owner.success) return []

  const adminClient = createAdminClient()
  const { data } = await (adminClient.from('plans'))
    .select('id, name, description, price, max_trips, max_employees, ai_credits_monthly, features, business_type, created_at, updated_at')
    .order('price', { ascending: true })
  
  return data || []
}

export async function savePlan(formData: FormData) {
  const owner = await requirePlatformOwner()
  if (!owner.success) return { success: false, error: owner.error }

  const adminClient = createAdminClient()
  
  const isNew = formData.get('isNew') === 'true'
  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const price = parseInt(formData.get('price') as string, 10)
  const max_trips = parseInt(formData.get('max_trips') as string, 10)
  const max_employees = parseInt(formData.get('max_employees') as string, 10)
  const ai_credits_monthly = parseInt(formData.get('ai_credits_monthly') as string, 10)
  const business_type = (formData.get('business_type') as string) || 'travel'
  
  const features = {
    chatbot: formData.get('feat_chatbot') === 'on',
    website: formData.get('feat_website') === 'on',
    priority_support: formData.get('feat_priority') === 'on',
  }

  const payload = {
    id: isNew ? id.toLowerCase().replace(/\s+/g, '-') : id,
    name,
    description,
    price,
    max_trips,
    max_employees,
    ai_credits_monthly,
    features,
    business_type
  }

  const { error } = await (adminClient.from('plans') as any)
    .upsert(payload)

  if (error) return { success: false, error: error.message }
  
  revalidatePath('/admin/plans')
  return { success: true }
}
