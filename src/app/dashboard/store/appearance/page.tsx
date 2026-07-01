import { createClient } from '@/lib/supabase/server'
import { getCurrentAgencyContext } from '@/lib/server/agency-context'
import { redirect } from 'next/navigation'
import StoreAppearancePage from '@/components/dashboard/StoreAppearancePage'

export const metadata = {
  title: 'Apparence de la Boutique | Dashboard',
  description: 'Personnalisez le thème et l\'apparence de votre boutique en ligne.',
}

export default async function StoreAppearanceRoute() {
  const context = await getCurrentAgencyContext()
  if (!context.userId || !context.agencyId) {
    redirect('/login')
  }
  if (context.businessTypeSlug !== 'ecommerce') {
    redirect('/dashboard')
  }

  const supabase = await createClient()
  const { data: agency } = await (supabase as any)
    .from('agencies')
    .select('website_settings')
    .eq('id', context.agencyId)
    .single()

  const currentTheme = (agency?.website_settings as any)?.store_theme || 'sole-district'

  return <StoreAppearancePage currentTheme={currentTheme} />
}
