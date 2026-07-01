import { createClient } from '@/lib/supabase/server'
import { InvoiceDetailsClient } from '@/components/dashboard/InvoiceDetailsClient'

export default async function InvoiceDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  let invoice: any = null
  let payments: any[] = []

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const supabase = await createClient()

      // Fetch invoice with client join
      const { data: invoiceData } = await supabase
        .from('invoices')
        .select(`
          *,
          client:clients(id, full_name, phone, email, address, city)
        `)
        .eq('id', id)
        .single()
      
      if (invoiceData) {
        invoice = invoiceData

        // Fetch invoice payments only if invoice found
        const { data: paymentsData } = await supabase
          .from('invoice_payments')
          .select('*')
          .eq('invoice_id', id)
          .order('created_at', { ascending: false })
        
        payments = paymentsData || []
      }

    } catch (e) {
      console.error('Failed to fetch invoice details from Supabase:', e)
    }
  }

  // Safe mock fallback for demo mode
  if (!invoice) {
    invoice = {
      id: id,
      invoice_number: 'FA-2026-0001',
      issue_date: '2026-05-10',
      due_date: '2026-05-17',
      status: 'partial',
      items: [
        { description: 'Forfait Istanbul Premium 8 Jours', qty: 1, unit_price: 150000, total: 150000 }
      ],
      subtotal: 150000,
      discount_amount: 0,
      discount_percent: 0,
      tax_amount: 0,
      tax_percent: 0,
      total_amount: 150000,
      amount_paid: 50000,
      balance_due: 100000,
      payment_method: 'CCP',
      payment_status: 'partial',
      notes: 'Notes de facturation de test.',
      terms: 'Paiement requis sous 7 jours. CCP Poste Algérienne.',
      created_at: new Date().toISOString(),
      client: {
        id: 'c-demo-1',
        full_name: 'Amalou Achraf',
        phone: '+213 555 12 34 56',
        email: 'achraf@demo.dz',
        address: 'Didouche Mourad',
        city: 'Alger'
      }
    }
    payments = [
      {
        id: 'p-demo-1',
        amount: 50000,
        payment_method: 'CCP',
        payment_date: '2026-05-10',
        reference_number: 'TXN-987654',
        notes: 'Acompte initial de réservation.',
        received_by: 'Amine Admin',
        created_at: new Date().toISOString()
      }
    ]
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 lg:p-8 font-geist">
      <InvoiceDetailsClient invoice={invoice} initialPayments={payments} />
    </div>
  )
}
