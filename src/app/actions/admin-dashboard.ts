'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function getAdminDashboardStats() {
  const adminClient = createAdminClient()

  // 1. Total Agencies
  const { count: totalAgencies } = await adminClient
    .from('agencies')
    .select('*', { count: 'exact', head: true })

  // 2. Active Agencies
  const { count: activeAgencies } = await adminClient
    .from('agencies')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  // 3. Total Conversations
  const { count: totalConversations } = await adminClient
    .from('conversations')
    .select('*', { count: 'exact', head: true })

  // 4. Total Bookings & MRR
  // For MRR, we sum up the price of all active agencies' plans
  const { data: agenciesWithPlans } = await adminClient
    .from('agencies')
    .select('status, plan:plans(price)')
    
  let mrr = 0
  if (agenciesWithPlans) {
    for (const agency of agenciesWithPlans) {
      if (agency.status === 'active' && agency.plan) {
        // Handle case where plan might be an array or object
        const planData = Array.isArray(agency.plan) ? agency.plan[0] : agency.plan
        mrr += (planData).price || 0
      }
    }
  }

  const { count: totalBookings } = await adminClient
    .from('bookings')
    .select('*', { count: 'exact', head: true })

  // 5. Recent Signups
  const { data: recentSignups } = await (adminClient.from('agencies'))
    .select('id, company_name, subdomain, status, created_at, plan:plans(name)')
    .order('created_at', { ascending: false })
    .limit(5)

  return {
    totalAgencies: totalAgencies || 0,
    activeAgencies: activeAgencies || 0,
    totalConversations: totalConversations || 0,
    totalBookings: totalBookings || 0,
    mrr,
    recentSignups: recentSignups || []
  }
}
