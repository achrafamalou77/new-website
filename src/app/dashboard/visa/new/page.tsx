import { getVisaTypes } from '@/app/actions/visa'
import { getEmployees } from '@/app/actions/employees'
import { createClient } from '@/lib/supabase/server'
import { VisaWizard } from '@/components/visa/VisaWizard'
import Link from 'next/link'
import { ChevronLeft, PlusCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function NewVisaApplicationPage() {
  // 1. Fetch visa types
  const vtRes = await getVisaTypes()
  const visaTypes = vtRes.success && vtRes.data ? vtRes.data : []

  // 2. Fetch employees
  const employees = await getEmployees()

  // 3. Fetch clients from database
  let clients: any[] = []
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const supabase = await createClient()
      const { data } = await supabase
        .from('clients')
        .select('id, full_name, phone, email')
        .order('created_at', { ascending: false })
      clients = data || []
    } catch (e) {
      console.error('Failed to load clients in visa wizard:', e)
    }
  }

  // Pre-loaded offline mockup clients if database is disconnected or empty
  if (clients.length === 0) {
    clients = [
      { id: 'client-1', full_name: 'Yacine Benmansour', phone: '0550123456', email: 'yacine@example.com' },
      { id: 'client-2', full_name: 'Riad Belkaid', phone: '0661987654', email: 'riad@example.com' }
    ]
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 lg:p-8 font-geist">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header navigation */}
        <div className="space-y-1">
          <Link 
            href="/dashboard/visa" 
            className="inline-flex items-center text-xs font-bold text-slate-400 hover:text-slate-600 transition gap-1 uppercase"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Visa Services
          </Link>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2 mt-1">
            <PlusCircle className="h-7 w-7 text-blue-600" />
            Initialize Visa Submission File
          </h1>
          <p className="text-[12px] text-slate-500 font-semibold uppercase tracking-wide">
            Follow the multi-step wizard to setup checklists, allocate staff, and track payments
          </p>
        </div>

        {/* Wizard Form Component */}
        <VisaWizard 
          visaTypes={visaTypes}
          clients={clients}
          employees={employees}
        />

      </div>
    </div>
  )
}
