import { createClient } from '@/lib/supabase/server'
import { ClientDetailsClient } from '@/components/dashboard/ClientDetailsClient'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ClientDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  let client: any = null
  let invoices: any[] = []
  let allClients: any[] = []

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const supabase = await createClient()

      // Fetch client
      const { data: clientData } = await supabase
        .from('clients')
        .select(`
          *,
          referred_by:clients!clients_referred_by_id_fkey(id, full_name)
        `)
        .eq('id', id)
        .single()

      if (!clientData) {
        return notFound()
      }
      client = clientData

      // Fetch client invoices
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', id)
        .order('created_at', { ascending: false })
      
      invoices = invoicesData || []

      // Fetch all clients (for potential referred_by selection when editing)
      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, full_name')
      allClients = clientsData || []
      
    } catch (e) {
      console.error('Failed to fetch client details from Supabase:', e)
    }
  }

  // Safe mock fallback for demo mode
  if (!client) {
    client = {
      id: id,
      full_name: 'Voyageur Demo',
      phone: '+213 555 01 02 03',
      email: 'demo-voyageur@algeriatravel.dz',
      id_card_number: '123456789012345678',
      passport_number: 'N09876543',
      date_of_birth: '1990-06-15',
      address: 'Didouche Mourad, Alger Centre',
      city: 'Alger',
      source: 'whatsapp',
      referred_by_id: null,
      notes: 'Voyageur régulier. Préfère les vols du matin.',
      created_at: new Date().toISOString()
    }
    invoices = [
      {
        id: 'inv-demo-1',
        invoice_number: 'FA-2026-0001',
        issue_date: '2026-05-10',
        due_date: '2026-05-17',
        status: 'partial',
        total_amount: 150000,
        amount_paid: 50000,
        balance_due: 100000,
        payment_method: 'CCP',
        payment_status: 'partial',
        created_at: new Date().toISOString()
      }
    ]
    allClients = [client]
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 lg:p-8 font-geist">
      <ClientDetailsClient 
        client={client} 
        invoices={invoices} 
        allClients={allClients} 
      />
    </div>
  )
}
