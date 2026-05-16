'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function setupOwnerAccount(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string

  if (email !== process.env.OWNER_EMAIL) {
    return { success: false, error: 'Unauthorized email address for platform owner.' }
  }

  const supabase = await createClient()
  const adminClient = createAdminClient()

  // Check if owner already exists
  const { data: existingOwner } = await adminClient
    .from('profiles')
    .select('id')
    .eq('is_platform_owner', true)
    .single()

  if (existingOwner) {
    return { success: false, error: 'Platform owner already setup.' }
  }

  // Create user
  const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName }
  })

  if (createError || !createData.user) {
    return { success: false, error: createError?.message || 'Failed to create owner auth.' }
  }

  // Create profile
  const { error: profileError } = await (adminClient.from('profiles') as any).insert({
    id: createData.user.id,
    full_name: fullName,
    role: 'superadmin',
    is_platform_owner: true
  })

  if (profileError) {
    await adminClient.auth.admin.deleteUser(createData.user.id)
    return { success: false, error: profileError.message }
  }

  return { success: true }
}
