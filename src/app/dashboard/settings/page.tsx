import { createClient } from '@/lib/supabase/server'
import { isSupabaseConnected } from '@/lib/supabase/client'
import { SettingsClient } from '@/components/dashboard/SettingsClient'
import { redirect } from 'next/navigation'

export default async function SettingsPage() {
  let initialSettings = {
    company_name: 'Travel Agency',
    subdomain: 'agency',
    website_settings: {},
    active_modules: ['chatbot', 'website']
  }

  if (isSupabaseConnected) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) redirect('/login')

    const { data: profileData } = await supabase.from('profiles').select('agency_id, role').eq('id', user.id).single()
    const profile = profileData as any
    
    if (profile) {
      if (profile.role === 'employee') {
        redirect('/dashboard/inbox')
      }

      const { data: agencyData } = await supabase.from('agencies').select('*').eq('id', profile.agency_id).single()
      const agency = agencyData as any
      if (agency) {
        initialSettings = agency
      }
    }
  }

  return <SettingsClient initialSettings={initialSettings} />
}
