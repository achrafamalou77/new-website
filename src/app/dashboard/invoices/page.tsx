import { createClient } from '@/lib/supabase/server'
import { InvoicesClient } from '@/components/dashboard/InvoicesClient'

export const dynamic = 'force-dynamic'

export default async function InvoicesPage() {
  let invoices: any[] = []
  
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const supabase = await createClient()
      
      const { data } = await supabase
        .from('invoices')
        .select(`
          *,
          client:clients(id, full_name, phone)
        `)
        .order('created_at', { ascending: false })
      
      invoices = data || []
    } catch (e) {
      console.error('Failed to fetch invoices from Supabase:', e)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 lg:p-8 font-geist">
      <InvoicesClient initialInvoices={invoices} />
    </div>
  )
}
