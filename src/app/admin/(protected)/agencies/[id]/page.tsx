import { getAgencyDetails } from '@/app/actions/admin-agency-details'
import { getPlans } from '@/app/actions/admin-plans'
import { AgencyDetailClient } from '@/components/admin/AgencyDetailClient'
import { notFound } from 'next/navigation'

export default async function AdminAgencyDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const [data, plans] = await Promise.all([
    getAgencyDetails(params.id),
    getPlans()
  ])
  
  if (!data || !data.agency) {
    notFound()
  }

  return <AgencyDetailClient data={data} plans={plans} />
}
