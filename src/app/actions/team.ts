'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function inviteEmployee(formData: FormData) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { success: true }
  }

  const supabase = await createClient()
  const adminClient = createAdminClient()

  // Verify auth & role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: profileData } = await supabase.from('profiles').select('agency_id, role').eq('id', user.id).single()
  const profile = profileData as any
  if (profile?.role !== 'superadmin') {
    return { success: false, error: 'Only superadmins can invite team members' }
  }

  const email = formData.get('email') as string
  const full_name = formData.get('full_name') as string
  const role = formData.get('role') as string

  // 1. Try to invite user
  let userId: string | undefined

  const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { full_name }
  })

  if (inviteError || !inviteData.user) {
    console.log('Invite failed, falling back to createUser', inviteError)
    // Fallback: create user with random password
    const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password: Math.random().toString(36).slice(-10) + 'A1!',
      email_confirm: true,
      user_metadata: { full_name }
    })

    if (createError || !createData.user) {
      return { success: false, error: createError?.message || 'Failed to create user' }
    }

    userId = createData.user.id

    // Send reset password email so they can set their own password
    await adminClient.auth.resetPasswordForEmail(email)
  } else {
    userId = inviteData.user.id
  }

  if (!userId) return { success: false, error: 'Failed to retrieve user ID' }

  // 2. Create profile
  const profilesTable: any = adminClient.from('profiles')
  const { error: profileError } = await profilesTable.insert({
    id: userId,
    agency_id: profile.agency_id,
    full_name,
    role
  })

  if (profileError) {
    // Rollback
    await adminClient.auth.admin.deleteUser(userId)
    return { success: false, error: profileError.message }
  }

  revalidatePath('/dashboard/team')
  return { success: true }
}

export async function removeEmployee(employeeId: string) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return { success: true }

  const supabase = await createClient()
  const adminClient = createAdminClient()

  // Verify auth & role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  if (user.id === employeeId) {
    return { success: false, error: 'You cannot remove yourself' }
  }

  const { data: profileData } = await supabase.from('profiles').select('agency_id, role').eq('id', user.id).single()
  const profile = profileData as any
  if (profile?.role !== 'superadmin') {
    return { success: false, error: 'Only superadmins can remove team members' }
  }

  // Delete user from auth (cascades to profiles)
  const { error } = await adminClient.auth.admin.deleteUser(employeeId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/team')
  return { success: true }
}
