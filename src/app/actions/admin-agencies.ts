'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requirePlatformOwner } from '@/lib/server/platform-owner'
import { revalidatePath } from 'next/cache'

// ─── Get All Agencies ──────────────────────────────────────────────────────
export async function getAdminAgencies() {
  const owner = await requirePlatformOwner()
  if (!owner.success) return []

  const adminClient = createAdminClient()
  const { data } = await adminClient
    .from('agencies')
    .select('id, company_name, email, phone, city, subdomain, status, created_at, ai_credits, business_type_slug, plan:plans(*)')
    .order('created_at', { ascending: false })

  return data || []
}

// ─── Toggle Agency Active/Inactive Status ──────────────────────────────────
export async function toggleAgencyStatus(agencyId: string, currentStatus: string) {
  const owner = await requirePlatformOwner()
  if (!owner.success) return { success: false, error: owner.error }

  const adminClient = createAdminClient()

  const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
  const now = new Date().toISOString()
  const updatePayload: Record<string, any> = { status: newStatus }

  if (newStatus === 'active') {
    updatePayload.approved_at = now
    updatePayload.approved_by = owner.user.id
    updatePayload.suspended_at = null
    updatePayload.suspended_by = null
  } else {
    updatePayload.suspended_at = now
    updatePayload.suspended_by = owner.user.id
  }

  const { error } = await (adminClient.from('agencies') as any)
    .update(updatePayload)
    .eq('id', agencyId)

  if (error) return { success: false, error: error.message }

  if (owner.user.email) {
    await (adminClient.from('admin_audit_log') as any).insert({
      admin_email: owner.user.email,
      action: `Toggled status to ${newStatus}`,
      target_agency_id: agencyId
    })
  }

  revalidatePath('/admin/agencies')
  return { success: true }
}

// ─── Permanently Delete Agency ────────────────────────────────────────────
export async function deleteAgency(agencyId: string) {
  const owner = await requirePlatformOwner()
  if (!owner.success) return { success: false, error: owner.error }

  const adminClient = createAdminClient()

  // Delete all auth users linked to this agency
  const { data: profiles } = await adminClient
    .from('profiles')
    .select('id')
    .eq('agency_id', agencyId)

  if (profiles) {
    for (const p of profiles) {
      await adminClient.auth.admin.deleteUser((p as any).id)
    }
  }

  const { error } = await adminClient
    .from('agencies')
    .delete()
    .eq('id', agencyId)

  if (error) return { success: false, error: error.message }

  if (owner.user.email) {
    await (adminClient.from('admin_audit_log') as any).insert({
      admin_email: owner.user.email,
      action: `Deleted agency`,
      target_agency_id: agencyId
    })
  }

  revalidatePath('/admin/agencies')
  return { success: true }
}

// ─── Change Agency Plan ────────────────────────────────────────────────────
// Allows platform owner to assign a new subscription plan to any agency.
export async function changeAgencyPlan(agencyId: string, planId: string) {
  const owner = await requirePlatformOwner()
  if (!owner.success) return { success: false, error: owner.error }

  const adminClient = createAdminClient()

  // Get new plan details to update AI credits
  const { data: plan } = await (adminClient.from('plans') as any)
    .select('ai_credits_monthly, name')
    .eq('id', planId)
    .single()

  const updatePayload: any = { plan: planId }
  if (plan?.ai_credits_monthly) {
    updatePayload.ai_credits = plan.ai_credits_monthly
  }

  const { error } = await (adminClient.from('agencies') as any)
    .update(updatePayload)
    .eq('id', agencyId)

  if (error) return { success: false, error: error.message }

  if (owner.user.email) {
    await (adminClient.from('admin_audit_log') as any).insert({
      admin_email: owner.user.email,
      action: `Changed plan to ${plan?.name || planId}`,
      target_agency_id: agencyId
    })
  }

  revalidatePath('/admin/agencies')
  revalidatePath(`/admin/agencies/${agencyId}`)
  return { success: true }
}

// ─── Set Agency AI Credits ────────────────────────────────────────────────
// Allows platform owner to manually top up or set an agency's AI credit balance.
export async function setAgencyCredits(agencyId: string, credits: number) {
  const owner = await requirePlatformOwner()
  if (!owner.success) return { success: false, error: owner.error }

  const adminClient = createAdminClient()

  const { error } = await (adminClient.from('agencies') as any)
    .update({ ai_credits: credits })
    .eq('id', agencyId)

  if (error) return { success: false, error: error.message }

  if (owner.user.email) {
    await (adminClient.from('admin_audit_log') as any).insert({
      admin_email: owner.user.email,
      action: `Set AI credits to ${credits}`,
      target_agency_id: agencyId
    })
  }

  revalidatePath('/admin/agencies')
  revalidatePath(`/admin/agencies/${agencyId}`)
  return { success: true }
}
