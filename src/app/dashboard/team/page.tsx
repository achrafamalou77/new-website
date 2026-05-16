import { createClient } from '@/lib/supabase/server'
import { isSupabaseConnected } from '@/lib/supabase/client'
import { mockProfiles } from '@/lib/mock-data'
import { TeamClient } from '@/components/dashboard/TeamClient'
import { redirect } from 'next/navigation'

export default async function TeamPage() {
  let initialProfiles = [...mockProfiles]
  let currentUserRole = 'superadmin'
  let currentUserId = 'prof-1'

  if (isSupabaseConnected) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) redirect('/login')
    currentUserId = user.id

    const { data: profileData } = await supabase.from('profiles').select('role, agency_id').eq('id', user.id).single()
    const profile = profileData as any
    if (profile) {
      currentUserRole = profile.role
      // If employee somehow accessed this route despite middleware, block them
      if (profile.role === 'employee') {
        redirect('/dashboard/inbox')
      }

      // Fetch all profiles for this agency
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('agency_id', profile.agency_id)
        .order('created_at', { ascending: false })
      
      if (allProfiles) initialProfiles = allProfiles as any[]
    }
  }

  return <TeamClient initialProfiles={initialProfiles} currentUserRole={currentUserRole} currentUserId={currentUserId} />
}
