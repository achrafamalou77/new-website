import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SubscriptionSettingsClient } from '@/components/dashboard/SubscriptionSettingsClient'
import { hasPermission } from '@/lib/permissions'

export default async function SubscriptionSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('agency_id, role')
    .eq('id', user.id)
    .single()
  
  const profile = profileData as any
  if (!profile || !profile.agency_id || !hasPermission(profile.role, 'billing:manage')) {
    redirect('/dashboard/inbox')
  }

  // Fetch agency along with detailed nested plan info
  const { data: agency } = await supabase
    .from('agencies')
    .select('*, plan:plans(*)')
    .eq('id', profile.agency_id)
    .single()

  if (!agency) {
    redirect('/dashboard')
  }

  // Fetch vertical plans matching this business type
  const vertical =
    agency.business_type_slug === 'car_showroom'
      ? 'car_showroom'
      : agency.business_type_slug === 'ecommerce'
        ? 'ecommerce'
        : 'travel'
  const { data: plans } = await (supabase
    .from('plans') as any)
    .select('*')
    .like('id', `${vertical}_%`)
    .order('price', { ascending: true })

  return (
    <SubscriptionSettingsClient 
      agency={agency} 
      plans={plans || []} 
    />
  )
}
