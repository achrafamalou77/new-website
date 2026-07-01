'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { isManagerRole, isOwnerRole, normalizeRole } from '@/lib/permissions'
import { revalidatePath } from 'next/cache'

const INVITABLE_ROLES = ['superadmin', 'manager', 'sales', 'support', 'employee'] as const
const OFFLINE_ROLES = ['manager', 'sales', 'support', 'employee'] as const

function normalizeEmail(value: FormDataEntryValue | string | null | undefined) {
  return String(value || '').trim().toLowerCase()
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function inviteEmployee(formData: FormData) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { success: false, error: 'Supabase admin environment is not configured' }
  }

  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('agency_id, role')
    .eq('id', user.id)
    .single()

  const profile = profileData
  if (!profile?.agency_id || !isOwnerRole(profile.role)) {
    return { success: false, error: 'Only owners can invite team members' }
  }

  const email = normalizeEmail(formData.get('email'))
  const fullName = String(formData.get('full_name') || '').trim()
  const role = normalizeRole(formData.get('role') as string)

  if (!fullName || !email) {
    return { success: false, error: 'Email and full name are required' }
  }
  if (!isValidEmail(email)) {
    return { success: false, error: 'Enter a valid email address' }
  }
  if (!INVITABLE_ROLES.includes(role as any)) {
    return { success: false, error: 'Invalid role selected' }
  }

  const { data: existingProfile } = await (adminClient.from('profiles') as any)
    .select('id, agency_id')
    .eq('email', email)
    .maybeSingle()

  if (existingProfile?.agency_id === profile.agency_id) {
    return { success: false, error: 'This email is already a member of your team' }
  }
  if (existingProfile) {
    return { success: false, error: 'This email already belongs to another company' }
  }

  const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: {
      full_name: fullName,
      agency_id: profile.agency_id,
      role,
    },
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`,
  })

  if (inviteError || !inviteData.user) {
    const message = inviteError?.message || 'Failed to send invitation'
    if (/already|registered|exists/i.test(message)) {
      return { success: false, error: 'This email has already been invited or registered. Remove the existing member before inviting again.' }
    }
    return { success: false, error: message }
  }

  const profilesTable: any = adminClient.from('profiles')
  const { error: profileError } = await profilesTable.insert({
    id: inviteData.user.id,
    agency_id: profile.agency_id,
    email,
    full_name: fullName,
    role,
    has_login_access: true,
  })

  if (profileError) {
    await adminClient.auth.admin.deleteUser(inviteData.user.id)
    return { success: false, error: profileError.message }
  }

  revalidatePath('/dashboard/team')
  return { success: true }
}

export async function removeEmployee(employeeId: string) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { success: false, error: 'Supabase admin environment is not configured' }
  }

  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  if (user.id === employeeId) {
    return { success: false, error: 'You cannot remove yourself' }
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('agency_id, role')
    .eq('id', user.id)
    .single()

  const profile = profileData
  if (!profile?.agency_id || !isOwnerRole(profile.role)) {
    return { success: false, error: 'Only owners can remove team members' }
  }

  const { data: targetProfile } = await (adminClient.from('profiles') as any)
    .select('id, agency_id, role')
    .eq('id', employeeId)
    .maybeSingle()

  if (!targetProfile || targetProfile.agency_id !== profile.agency_id) {
    return { success: false, error: 'Team member not found in this company' }
  }
  if (isOwnerRole(targetProfile.role)) {
    return { success: false, error: 'Owners cannot remove another owner from this screen' }
  }

  const { error } = await adminClient.auth.admin.deleteUser(employeeId)

  if (error) {
    const { error: profileDelError } = await adminClient
      .from('profiles')
      .delete()
      .eq('id', employeeId)
      .eq('agency_id', profile.agency_id)

    if (profileDelError) {
      return { success: false, error: profileDelError.message }
    }
  }

  revalidatePath('/dashboard/team')
  return { success: true }
}

export async function createOfflineEmployeeAction(payload: {
  full_name: string
  email?: string
  phone?: string
  role: string
  department: string
  base_salary: number
  employment_type: string
  ccp_account?: string
  bank_account?: string
}) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('agency_id, role')
    .eq('id', user.id)
    .single()

  const profile = profileData
  if (!profile?.agency_id || !isManagerRole(profile.role)) {
    return { success: false, error: 'Only owners or managers can add offline staff' }
  }

  const fullName = payload.full_name?.trim()
  const email = normalizeEmail(payload.email)
  const safeRole = normalizeRole(payload.role)

  if (!fullName) {
    return { success: false, error: 'Full name is required' }
  }
  if (email && !isValidEmail(email)) {
    return { success: false, error: 'Enter a valid email address' }
  }
  if (!OFFLINE_ROLES.includes(safeRole as any)) {
    return { success: false, error: 'Invalid offline staff role' }
  }
  if (safeRole === 'manager' && !isOwnerRole(profile.role)) {
    return { success: false, error: 'Only owners can create managers' }
  }

  if (email) {
    const { data: existingProfile } = await (adminClient.from('profiles') as any)
      .select('id, agency_id')
      .eq('email', email)
      .maybeSingle()

    if (existingProfile) {
      return { success: false, error: 'This email is already assigned to a team member' }
    }
  }

  const generatedId = crypto.randomUUID()
  const { error: profileError } = await (adminClient.from('profiles') as any).insert({
    id: generatedId,
    agency_id: profile.agency_id,
    full_name: fullName,
    role: safeRole,
    phone: payload.phone || null,
    email: email || null,
    has_login_access: false,
  })

  if (profileError) {
    return { success: false, error: profileError.message }
  }

  const { error: employeeError } = await adminClient.from('employees').update({
    department: payload.department,
    role: (payload as any).job_title || safeRole,
    employment_type: payload.employment_type,
    base_salary: Number(payload.base_salary) || 40000,
    ccp_account: payload.ccp_account || null,
    bank_account: payload.bank_account || null,
    status: 'active',
  }).eq('id', generatedId)

  if (employeeError) {
    await adminClient.from('profiles').delete().eq('id', generatedId)
    return { success: false, error: employeeError.message }
  }

  revalidatePath('/dashboard/team')
  return { success: true }
}
