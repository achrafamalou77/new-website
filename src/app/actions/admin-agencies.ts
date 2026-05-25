'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getAdminAgencies() {
  const adminClient = createAdminClient()
  const { data } = await adminClient
    .from('agencies')
    .select('id, company_name, subdomain, status, created_at, ai_credits, plan:plans(name)')
    .order('created_at', { ascending: false })
  
  return data || []
}

export async function toggleAgencyStatus(agencyId: string, currentStatus: string) {
  const adminClient = createAdminClient()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const newStatus = currentStatus === 'active' ? 'inactive' : 'active'

  const { error } = await (adminClient.from('agencies'))
    .update({ status: newStatus })
    .eq('id', agencyId)

  if (error) return { success: false, error: error.message }

  if (user?.email) {
    await (adminClient.from('admin_audit_log')).insert({
      admin_email: user.email,
      action: `Toggled status to ${newStatus}`,
      target_agency_id: agencyId
    })
  }

  revalidatePath('/admin/agencies')
  return { success: true }
}

export async function deleteAgency(agencyId: string) {
  const adminClient = createAdminClient()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Find all profiles linked to this agency to delete the auth users
  const { data: profiles } = await adminClient
    .from('profiles')
    .select('id')
    .eq('agency_id', agencyId)

  if (profiles) {
    for (const p of profiles) {
      await adminClient.auth.admin.deleteUser((p).id)
    }
  }

  const { error } = await adminClient
    .from('agencies')
    .delete()
    .eq('id', agencyId)

  if (error) return { success: false, error: error.message }

  if (user?.email) {
    await (adminClient.from('admin_audit_log')).insert({
      admin_email: user.email,
      action: `Deleted agency`,
      target_agency_id: agencyId
    })
  }

  revalidatePath('/admin/agencies')
  return { success: true }
}
