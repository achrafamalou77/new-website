import { createClient } from '@/lib/supabase/server'
import { ClientsDirectoryClient } from '@/components/dashboard/ClientsDirectoryClient'

export const dynamic = 'force-dynamic'

export default async function ClientsPage() {
  let clients: any[] = []
  
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const supabase = await createClient()
      
      const { data } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })
      
      clients = data || []
    } catch (e) {
      console.error('Failed to fetch clients from Supabase:', e)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 lg:p-8 font-geist">
      <ClientsDirectoryClient initialClients={clients} />
    </div>
  )
}
