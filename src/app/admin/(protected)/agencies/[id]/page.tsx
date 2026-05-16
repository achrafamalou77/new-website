import { getAgencyDetails } from '@/app/actions/admin-agency-details'
import { AgencyDetailClient } from '@/components/admin/AgencyDetailClient'
import { notFound } from 'next/navigation'

export default async function AdminAgencyDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const data = await getAgencyDetails(params.id)
  
  if (!data || !data.agency) {
    notFound()
  }

  return <AgencyDetailClient data={data} />
}
