import { createClient } from '@/lib/supabase/server'
import { NewInvoiceWizardClient } from '@/components/dashboard/NewInvoiceWizardClient'
import { getCurrentAgencyContext } from '@/lib/server/agency-context'
import { Suspense } from 'react'

export default async function NewInvoicePage() {
  let clients: any[] = []
  let trips: any[] = []
  const context = await getCurrentAgencyContext()

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && context.agencyId) {
    try {
      const supabase = await createClient()

      // Fetch clients
      const { data: clientsData } = await (supabase as any)
        .from('clients')
        .select('id, full_name, phone, email, classification, company_legal_name, company_nif, company_rc, volume_discount_tier')
        .eq('agency_id', context.agencyId)
        .order('full_name')
      
      clients = clientsData || []

      if (context.businessTypeSlug !== 'car_showroom') {
        const { data: tripsData } = await supabase
          .from('trips')
          .select('id, title, price, destination')
          .eq('agency_id', context.agencyId)
          .eq('is_active', true)
          .order('title')

        trips = tripsData || []
      }

    } catch (e) {
      console.error('Failed to fetch wizard dependencies from Supabase:', e)
    }
  }

  // Fallbacks for offline / demo mode
  if (clients.length === 0) {
    clients = [
      { id: 'c-demo-1', full_name: 'Achraf Amalou', phone: '+213 555 12 34 56', email: 'achraf@demo.dz' },
      { id: 'c-demo-2', full_name: 'Djamel Belmadi', phone: '+213 661 00 22 33', email: 'djamel@demo.dz' }
    ]
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 lg:p-8 font-geist">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-slate-400 font-medium">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent"></div>
          <span className="text-xs">Chargement du configurateur...</span>
        </div>
      }>
        <NewInvoiceWizardClient initialClients={clients} initialTrips={trips} />
      </Suspense>
    </div>
  )
}
