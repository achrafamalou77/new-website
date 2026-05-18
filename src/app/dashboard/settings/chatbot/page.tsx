import { createClient } from '@/lib/supabase/server'
import { ChatbotSettingsClient } from '@/components/dashboard/ChatbotSettingsClient'

export const metadata = {
  title: 'AI Chatbot Settings | Dashboard',
}

export default async function ChatbotSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let activeTrips: any[] = []
  if (user) {
    const { data: profileData } = await supabase.from('profiles').select('agency_id').eq('id', user.id).single()
    const profile = profileData as any
    if (profile?.agency_id) {
      const { data } = await supabase
        .from('trips')
        .select('*')
        .eq('agency_id', profile.agency_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      activeTrips = data || []
    }
  }

  return <ChatbotSettingsClient activeTrips={activeTrips} />
}
