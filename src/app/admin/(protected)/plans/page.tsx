import { getPlans } from '@/app/actions/admin-plans'
import { AdminPlansClient } from '@/components/admin/AdminPlansClient'

export default async function AdminPlansPage() {
  const plans = await getPlans()
  return <AdminPlansClient initialPlans={plans} />
}
