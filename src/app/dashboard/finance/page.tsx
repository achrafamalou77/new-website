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

export default async function FinancePage() {
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

  // Ensure only superadmins, managers, or accountants can access the finance section
  if (!['superadmin', 'manager', 'accountant'].includes(profile.role)) {
    redirect('/dashboard')
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
    />
  )
}
