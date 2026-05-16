import { getAdminAgencies } from '@/app/actions/admin-agencies'
import { AdminAgenciesClient } from '@/components/admin/AdminAgenciesClient'

export default async function AdminAgenciesPage() {
  const agencies = await getAdminAgencies()
  return <AdminAgenciesClient initialAgencies={agencies} />
}
