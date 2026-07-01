import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FinanceClient } from '@/components/dashboard/FinanceClient'
import { 
  getFinancialAccounts, 
  getSuppliers, 
  getSupplierPayments, 
  getTransactions, 
  getFinanceStats 
} from '@/app/actions/finance'
import { Suspense } from 'react'
import { hasPermission } from '@/lib/permissions'

export default async function FinancePage() {
  return (
    <Suspense fallback={
      <div className="p-6 space-y-6 animate-pulse text-left">
        <div className="flex justify-between items-center bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <div className="space-y-2">
            <div className="h-6 bg-slate-200 rounded-lg w-48" />
            <div className="h-4 bg-slate-200 rounded-lg w-72" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 bg-slate-200 rounded-full w-24" />
            <div className="h-10 bg-indigo-200 rounded-full w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="h-28 bg-slate-200 rounded-2xl w-full" />
          <div className="h-28 bg-slate-200 rounded-2xl w-full" />
          <div className="h-28 bg-slate-200 rounded-2xl w-full" />
          <div className="h-28 bg-slate-200 rounded-2xl w-full" />
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 h-64 w-full" />
      </div>
    }>
      <FinanceContent />
    </Suspense>
  )
}

async function FinanceContent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('role, agency_id')
    .eq('id', user.id)
    .single()

  const profile = profileData as any
  if (!profile) {
    redirect('/login')
  }

  if (!hasPermission(profile.role, 'finance:manage')) {
    redirect('/dashboard')
  }

  // Fetch agency business type slug to isolate travel agency and car showroom modules
  let businessTypeSlug = 'travel_agency'
  if (profile.agency_id) {
    const { data: agencyData } = await supabase
      .from('agencies')
      .select('business_type_slug')
      .eq('id', profile.agency_id)
      .single()
    if (agencyData?.business_type_slug) {
      businessTypeSlug = agencyData.business_type_slug
    }
  }

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  // Fetch all parallel data from the database
  const [
    accounts,
    suppliers,
    supplierPayments,
    transactions,
    stats
  ] = await Promise.all([
    getFinancialAccounts(),
    getSuppliers(),
    getSupplierPayments(),
    getTransactions(100),
    getFinanceStats(year, month)
  ])

  return (
    <FinanceClient 
      initialAccounts={accounts}
      initialSuppliers={suppliers}
      initialSupplierPayments={supplierPayments}
      initialTransactions={transactions}
      initialStats={stats}
      currentUserRole={profile.role}
      currentUserId={user.id}
      businessTypeSlug={businessTypeSlug}
    />
  )
}
