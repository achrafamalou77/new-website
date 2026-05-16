import { getAnalyticsData } from '@/app/actions/admin-analytics'
import { AdminAnalyticsClient } from '@/components/admin/AdminAnalyticsClient'

export default async function AdminAnalyticsPage() {
  const data = await getAnalyticsData()
  return <AdminAnalyticsClient data={data} />
}
