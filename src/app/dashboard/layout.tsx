import { Sidebar } from '@/components/dashboard/Sidebar'
import { Header } from '@/components/dashboard/Header'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const userRole = headersList.get('x-user-role') || 'superadmin' // Default to superadmin for dev/demo

  let unreadInboxCount = 3
  let clientsCount = 5
  let unpaidInvoicesCount = 2
  let pendingVisasCount = 3
  let activeLeadsCount = 4

  // Resolve business vertical (from DB or fallback to cookie 'demo_business_type_slug' for showcase)
  const cookieHeader = headersList.get('cookie') || ''
  const match = cookieHeader.match(/demo_business_type_slug=([^;]+)/)
  let businessTypeSlug = match ? match[1] : 'travel'

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const supabase = await createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Get profile to resolve agency
        const { data: profileData } = await supabase
          .from('profiles')
          .select('agency_id')
          .eq('id', user.id)
          .single()
        const profile = profileData as any

        if (profile?.agency_id) {
          const { data: agencyData } = await supabase
            .from('agencies')
            .select('business_type_slug')
            .eq('id', profile.agency_id)
            .single()
          const agency = agencyData as any

          if (agency?.business_type_slug) {
            businessTypeSlug = agency.business_type_slug
          }
        }
      }

      // Fetch dynamic stats for Sidebar
      const { count: inboxCount } = await supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
        
      const { count: cCount } = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
        
      const { count: invCount } = await supabase
          .from('invoices')
          .select('*', { count: 'exact', head: true })
          .in('payment_status', ['unpaid', 'partial'])

      const { count: visaCount } = await supabase
          .from('visa_applications')
          .select('*', { count: 'exact', head: true })
          .in('status', ['documents_pending', 'under_review'])

      const { count: leadsCount } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .in('stage', ['new', 'contacted'])

      if (inboxCount !== null && inboxCount !== undefined) unreadInboxCount = inboxCount
      if (cCount !== null && cCount !== undefined) clientsCount = cCount
      if (invCount !== null && invCount !== undefined) unpaidInvoicesCount = invCount
      if (visaCount !== null && visaCount !== undefined) pendingVisasCount = visaCount
      if (leadsCount !== null && leadsCount !== undefined) activeLeadsCount = leadsCount
    } catch (e) {
      console.error('Failed to fetch sidebar counts:', e)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar 
        role={userRole} 
        businessTypeSlug={businessTypeSlug}
        unreadInboxCount={unreadInboxCount}
        clientsCount={clientsCount}
        unpaidInvoicesCount={unpaidInvoicesCount}
        pendingVisasCount={pendingVisasCount}
        activeLeadsCount={activeLeadsCount}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden flex flex-col">
          {children}
        </main>
      </div>
    </div>
  )
}
