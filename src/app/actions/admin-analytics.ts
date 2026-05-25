'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function getAnalyticsData() {
  const adminClient = createAdminClient()

  // For Demo purposes, we might not have a lot of historical data in DB. 
  // We'll aggregate what we have.

  // 1. Agencies by Plan (Pie Chart)
  const { data: agencies } = await adminClient
    .from('agencies')
    .select('plan, created_at, status')

  const planCounts: Record<string, number> = {}
  agencies?.forEach((a: any) => {
    const planName = Array.isArray(a.plan) ? a.plan[0] : a.plan || 'unknown'
    planCounts[planName as string] = (planCounts[planName as string] || 0) + 1
  })
  const agenciesByPlan = Object.entries(planCounts).map(([name, value]) => ({ name, value }))

  // 2. Agencies over time (Line Chart)
  // Simplifying by taking just the month
  const monthCounts: Record<string, number> = {}
  agencies?.forEach((a: any) => {
    const d = new Date(a.created_at)
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthCounts[month] = (monthCounts[month] || 0) + 1
  })
  const agenciesOverTime = Object.entries(monthCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }))

  // 3. Conversations per day (Bar Chart)
  const { data: convs } = await adminClient.from('conversations').select('created_at')
  const dayCounts: Record<string, number> = {}
  convs?.forEach((c: any) => {
    const day = new Date(c.created_at).toISOString().split('T')[0]
    dayCounts[day] = (dayCounts[day] || 0) + 1
  })
  const conversationsPerDay = Object.entries(dayCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }))
    .slice(-30) // last 30 active days

  // 4. MRR Growth (Area Chart) 
  // We'll mock historical MRR based on agency creation dates assuming plan price is static.
  // In a real app we'd track invoice payments.
  const { data: plans } = await (adminClient.from('plans')).select('id, price')
  const priceMap = new Map(plans?.map((p: any) => [p.id, p.price]) || [])
  
  let cumulativeMrr = 0
  const mrrOverTime: any[] = []
  
  // Sort agencies by creation date
  const sortedAgencies = [...(agencies || [])].sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  sortedAgencies.forEach((a: any) => {
    const d = new Date(a.created_at)
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    
    if (a.status === 'active') {
      const planId = Array.isArray(a.plan) ? a.plan[0] : a.plan
      cumulativeMrr += ((priceMap.get(planId as string) as number) || 0)
      
      const existing = mrrOverTime.find(m => m.date === month)
      if (existing) {
        existing.mrr = cumulativeMrr
      } else {
        mrrOverTime.push({ date: month, mrr: cumulativeMrr })
      }
    }
  })

  return {
    agenciesByPlan,
    agenciesOverTime,
    conversationsPerDay,
    mrrOverTime
  }
}
