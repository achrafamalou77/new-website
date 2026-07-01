import { getAdminAgencies } from '@/app/actions/admin-agencies'
import { getPlans } from '@/app/actions/admin-plans'
import { AdminAgenciesClient } from '@/components/admin/AdminAgenciesClient'

export default async function AdminAgenciesPage() {
  const [agencies, plans] = await Promise.all([getAdminAgencies(), getPlans()])
  return <AdminAgenciesClient initialAgencies={agencies} plans={plans} />
}
