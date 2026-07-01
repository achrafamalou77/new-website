import { createClient } from '@/lib/supabase/server'
import { isSupabaseConnected } from '@/lib/supabase/client'
import { DashboardClient } from '@/components/dashboard/DashboardClient'
import { CarShowroomDashboard } from '@/components/dashboard/verticals/CarShowroomDashboard'
import EcommerceStorePage from '@/components/dashboard/EcommerceStorePage'
import { headers } from 'next/headers'
import { Suspense } from 'react'

type MonthMetric = { month: string; revenue?: number; sales?: number }
type LeadBreakdown = { hot: number; warm: number; cold: number }

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function startOfYear(date = new Date()) {
  return new Date(date.getFullYear(), 0, 1)
}

function monthSeries(key: 'revenue' | 'sales'): MonthMetric[] {
  return MONTHS.map(month => ({ month, [key]: 0 }))
}

function normalizeLeadScore(score?: string | null): keyof LeadBreakdown | null {
  const normalized = String(score || '').toLowerCase()
  if (normalized === 'hot' || normalized === 'warm' || normalized === 'cold') return normalized
  return null
}

function countLeadRows(rows: Array<{ lead_score?: string | null; score?: string | null }>): LeadBreakdown {
  return rows.reduce<LeadBreakdown>((acc, row) => {
    const score = normalizeLeadScore(row.lead_score || row.score)
    if (score) acc[score] += 1
    return acc
  }, { hot: 0, warm: 0, cold: 0 })
}

function addToMonth<T extends MonthMetric>(
  series: T[],
  dateValue: string | null | undefined,
  amount: number | null | undefined,
  key: 'revenue' | 'sales'
) {
  if (!dateValue || !amount) return
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return
  const index = date.getMonth()
  const current = Number(series[index]?.[key] || 0)
  series[index] = { ...series[index], [key]: current + Number(amount || 0) }
}

async function countRows(query: any): Promise<number> {
  const { count, error } = await query
  if (error) {
    console.error('Dashboard count failed:', error.message)
    return 0
  }
  return count || 0
}

async function getTravelMetrics(supabase: any, agencyId: string) {
  const monthStart = startOfMonth().toISOString()
  const yearStart = startOfYear().toISOString()
  const revenueData = monthSeries('revenue')

  const [
    totalConversations,
    conversationsForLeadsRes,
    bookingsThisMonth,
    tripsCount,
    invoicesCount,
    accountsCount,
    faqsCount,
    visaApplicationsCount,
    visaPaymentsRes,
    recentRes,
    messagesRes,
    bookingRevenueRes,
    transactionRevenueRes,
  ] = await Promise.all([
    countRows(supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('agency_id', agencyId)),
    supabase.from('conversations').select('lead_score').eq('agency_id', agencyId),
    countRows(
      supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('agency_id', agencyId)
        .eq('status', 'completed')
        .gte('created_at', monthStart)
    ),
    countRows(supabase.from('trips').select('*', { count: 'exact', head: true }).eq('agency_id', agencyId).eq('is_active', true)),
    countRows(supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('agency_id', agencyId)),
    countRows(supabase.from('financial_accounts').select('*', { count: 'exact', head: true }).eq('agency_id', agencyId)),
    countRows(supabase.from('chatbot_faqs').select('*', { count: 'exact', head: true }).eq('agency_id', agencyId)),
    countRows(supabase.from('visa_applications').select('*', { count: 'exact', head: true }).eq('agency_id', agencyId)),
    supabase.from('visa_payments').select('amount, visa_applications!inner(agency_id)').eq('visa_applications.agency_id', agencyId),
    supabase
      .from('conversations')
      .select('id, agency_id, customer_name, customer_phone, platform, status, unread, last_message_at, lead_score, lead_summary')
      .eq('agency_id', agencyId)
      .order('last_message_at', { ascending: false })
      .limit(5),
    supabase
      .from('conversation_messages')
      .select('role, created_at')
      .eq('agency_id', agencyId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from('bookings')
      .select('total_price, created_at, status')
      .eq('agency_id', agencyId)
      .eq('status', 'completed')
      .gte('created_at', yearStart),
    supabase
      .from('transactions')
      .select('amount, transaction_date, type')
      .eq('agency_id', agencyId)
      .eq('type', 'income')
      .gte('transaction_date', yearStart.slice(0, 10)),
  ])

  const leadBreakdown = countLeadRows(conversationsForLeadsRes.data || [])
  const messages = messagesRes.data || []
  const inboundCount = messages.filter((m: any) => ['user', 'customer'].includes(String(m.role).toLowerCase())).length
  const assistantCount = messages.filter((m: any) => ['assistant', 'ai'].includes(String(m.role).toLowerCase())).length
  const aiResponseRate = inboundCount > 0 ? Math.min(100, Math.round((assistantCount / inboundCount) * 100)) : 0
  const transactionRows = transactionRevenueRes.data || []

  if (transactionRows.length > 0) {
    transactionRows.forEach((row: any) => addToMonth(revenueData, row.transaction_date, row.amount, 'revenue'))
  } else {
    ;(bookingRevenueRes.data || []).forEach((row: any) => addToMonth(revenueData, row.created_at, row.total_price, 'revenue'))
  }

  return {
    totalConversations,
    hotLeads: leadBreakdown.hot,
    bookingsThisMonth,
    aiResponseRate,
    recentConversations: recentRes.data || [],
    tripsCount,
    invoicesCount,
    accountsCount,
    faqsCount,
    visaApplicationsCount,
    visaRevenue: (visaPaymentsRes.data || []).reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0),
    leadBreakdown,
    revenueData,
  }
}

async function getShowroomMetrics(supabase: any, agencyId: string) {
  const yearStart = startOfYear().toISOString()
  const salesVolumeData = monthSeries('sales')

  const [
    totalConversations,
    conversationLeadsRes,
    leadRowsRes,
    carsCount,
    testDrivesScheduled,
    financingApps,
    followUpTasksCount,
    recentRes,
    salesOrdersRes,
    soldInventoryRes,
  ] = await Promise.all([
    countRows(supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('agency_id', agencyId)),
    supabase.from('conversation_analysis').select('lead_score').eq('agency_id', agencyId),
    supabase.from('leads').select('score').eq('agency_id', agencyId),
    countRows(
      supabase
        .from('car_sales_inventory')
        .select('*', { count: 'exact', head: true })
        .eq('agency_id', agencyId)
        .in('status', ['available', 'reserved', 'in_preparation', 'in_transit', 'maintenance'])
    ),
    countRows(
      supabase
        .from('test_drives')
        .select('*', { count: 'exact', head: true })
        .eq('agency_id', agencyId)
        .in('status', ['requested', 'confirmed'])
    ),
    countRows(
      supabase
        .from('financing_applications')
        .select('*', { count: 'exact', head: true })
        .eq('agency_id', agencyId)
        .in('status', ['submitted', 'under_review', 'approved'])
    ),
    countRows(
      supabase
        .from('follow_up_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('agency_id', agencyId)
        .in('status', ['open', 'in_progress'])
    ),
    supabase
      .from('conversations')
      .select('id, agency_id, customer_name, customer_phone, platform, status, unread, last_message_at, lead_score, lead_summary')
      .eq('agency_id', agencyId)
      .order('last_message_at', { ascending: false })
      .limit(5),
    supabase
      .from('car_sales_orders')
      .select('sale_price, sale_date, created_at, status')
      .eq('agency_id', agencyId)
      .eq('status', 'completed')
      .gte('created_at', yearStart),
    supabase
      .from('car_sales_inventory')
      .select('price, updated_at, sold_date, status')
      .eq('agency_id', agencyId)
      .eq('status', 'sold')
      .gte('updated_at', yearStart),
  ])

  const analysisBreakdown = countLeadRows(conversationLeadsRes.data || [])
  const leadBreakdown = countLeadRows(leadRowsRes.data || [])
  const combinedLeadBreakdown = {
    hot: Math.max(leadBreakdown.hot, analysisBreakdown.hot),
    warm: Math.max(leadBreakdown.warm, analysisBreakdown.warm),
    cold: Math.max(leadBreakdown.cold, analysisBreakdown.cold),
  }

  const salesOrders = salesOrdersRes.data || []
  if (salesOrders.length > 0) {
    salesOrders.forEach((row: any) => addToMonth(salesVolumeData, row.sale_date || row.created_at, row.sale_price, 'sales'))
  } else {
    ;(soldInventoryRes.data || []).forEach((row: any) => addToMonth(salesVolumeData, row.sold_date || row.updated_at, row.price, 'sales'))
  }

  const salesVolume = salesVolumeData.reduce((sum, row) => sum + Number(row.sales || 0), 0)

  return {
    totalConversations,
    hotLeads: combinedLeadBreakdown.hot,
    carsCount,
    testDrivesScheduled,
    financingApps,
    salesVolume,
    followUpTasksCount,
    leadBreakdown: combinedLeadBreakdown,
    recentLeads: recentRes.data || [],
    salesVolumeData,
  }
}

export default async function DashboardHome() {
  return (
    <Suspense fallback={
      <div className="p-6 space-y-6 animate-pulse text-left">
        <div className="flex justify-between items-center bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <div className="space-y-2">
            <div className="h-6 bg-slate-200 rounded-lg w-48" />
            <div className="h-4 bg-slate-200 rounded-lg w-72" />
          </div>
          <div className="h-10 bg-indigo-200 rounded-full w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="h-32 bg-slate-200 rounded-2xl w-full animate-pulse" />
          <div className="h-32 bg-slate-200 rounded-2xl w-full animate-pulse" />
          <div className="h-32 bg-slate-200 rounded-2xl w-full animate-pulse" />
          <div className="h-32 bg-slate-200 rounded-2xl w-full animate-pulse" />
          <div className="h-32 bg-slate-200 rounded-2xl w-full animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
          <div className="col-span-4 h-64 bg-slate-200 rounded-2xl w-full animate-pulse" />
          <div className="col-span-3 h-64 bg-slate-200 rounded-2xl w-full animate-pulse" />
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}

async function DashboardContent() {
  const headersList = await headers()
  const cookieHeader = headersList.get('cookie') || ''
  const match = cookieHeader.match(/demo_business_type_slug=([^;]+)/)
  let businessTypeSlug = match ? match[1] : 'travel'
  let userName = 'Admin'
  const agencyIdHeader = headersList.get('x-agency-id')
  const userIdHeader = headersList.get('x-user-id')
  const businessTypeHeader = headersList.get('x-business-type-slug')
  const userRoleHeader = headersList.get('x-user-role')

  if (businessTypeHeader) {
    businessTypeSlug = businessTypeHeader === 'travel_agency' ? 'travel' : businessTypeHeader
  }

  if (isSupabaseConnected) {
    try {
      const supabase = await createClient()
      const userId = userIdHeader || (await supabase.auth.getUser()).data.user?.id

      if (userId) {
        let agencyId = agencyIdHeader || null
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, agency_id, role')
          .eq('id', userId)
          .single()

        let currentUserRole = userRoleHeader || 'superadmin'
        if (profile) {
          userName = (profile as any).full_name || userName
          agencyId = agencyId || (profile as any).agency_id
          currentUserRole = userRoleHeader || (profile as any).role || currentUserRole
        }

        if (agencyId) {
          if (!businessTypeHeader) {
            const { data: agency } = await supabase
              .from('agencies')
              .select('business_type_slug')
              .eq('id', agencyId)
              .single()

            if ((agency as any)?.business_type_slug) {
              businessTypeSlug = (agency as any).business_type_slug === 'travel_agency' ? 'travel' : (agency as any).business_type_slug
            }
          }

          if (businessTypeSlug === 'car_showroom') {
            const metrics = await getShowroomMetrics(supabase, agencyId)
            return <CarShowroomDashboard userName={userName} {...metrics} />
          }

          if (businessTypeSlug === 'ecommerce') {
            return <EcommerceStorePage view="overview" />
          }

          const metrics = await getTravelMetrics(supabase, agencyId)
          return <DashboardClient userName={userName} currentUserRole={currentUserRole} {...metrics} />
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error)
    }
  }

  if (businessTypeSlug === 'ecommerce') {
    return <EcommerceStorePage view="overview" />
  }

  if (businessTypeSlug === 'car_showroom') {
    return (
      <CarShowroomDashboard
        userName={userName}
        totalConversations={0}
        hotLeads={0}
        carsCount={0}
        testDrivesScheduled={0}
        financingApps={0}
        salesVolume={0}
        followUpTasksCount={0}
        leadBreakdown={{ hot: 0, warm: 0, cold: 0 }}
        recentLeads={[]}
        salesVolumeData={monthSeries('sales')}
      />
    )
  }

  return (
    <DashboardClient
      userName={userName}
      totalConversations={0}
      hotLeads={0}
      bookingsThisMonth={0}
      aiResponseRate={0}
      recentConversations={[]}
      tripsCount={0}
      invoicesCount={0}
      accountsCount={0}
      faqsCount={0}
      visaApplicationsCount={0}
      visaRevenue={0}
      leadBreakdown={{ hot: 0, warm: 0, cold: 0 }}
      revenueData={monthSeries('revenue')}
    />
  )
}
