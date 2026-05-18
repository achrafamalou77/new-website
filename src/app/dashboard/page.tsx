import { createClient } from '@/lib/supabase/server'
import { isSupabaseConnected } from '@/lib/supabase/client'
import { mockConversations, mockBookings, mockProfiles } from '@/lib/mock-data'
import { DashboardClient } from '@/components/dashboard/DashboardClient'
import { CarShowroomDashboard } from '@/components/dashboard/verticals/CarShowroomDashboard'
import { headers } from 'next/headers'

export const revalidate = 60;

export default async function DashboardHome() {
  const headersList = await headers()
  
  // Resolve business vertical (from DB or fallback to cookie 'demo_business_type_slug' for showcase)
  const cookieHeader = headersList.get('cookie') || ''
  const match = cookieHeader.match(/demo_business_type_slug=([^;]+)/)
  let businessTypeSlug = match ? match[1] : 'travel'

  let userName = 'Admin'
  let totalConversations = 0
  let hotLeads = 0
  let bookingsThisMonth = 0
  let aiResponseRate = 94 // Mock value
  let recentConversations: any[] = []
  let tripsCount = 0
  let invoicesCount = 0
  let accountsCount = 0
  let faqsCount = 0
  let visaApplicationsCount = 12 // Default fallback
  let visaRevenue = 340000 // Default fallback DZD

  // Car Showroom Specifics
  let carsCount = 4
  let testDrivesScheduled = 8
  let financingApps = 3
  let salesVolume = 76500000

  if (isSupabaseConnected) {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        let agencyId = user.id
        const { data: profileData } = await supabase.from('profiles').select('full_name, agency_id').eq('id', user.id).single()
        const profile = profileData as any
        if (profile) {
          userName = profile.full_name
          agencyId = profile.agency_id
        }

        // Fetch features details
        const { data: agencyData } = await supabase.from('agencies').select('business_type_slug').eq('id', agencyId).single()
        const agency = agencyData as any
        if (agency?.business_type_slug) {
          businessTypeSlug = agency.business_type_slug
        }

        const { data: stats } = await (supabase as any).rpc('get_dashboard_stats', {
          p_agency_id: agencyId
        })

        if (stats) {
          totalConversations = stats.totalConversations || 0
          hotLeads = stats.hotLeads || 0
          bookingsThisMonth = stats.bookingsThisMonth || 0
          tripsCount = stats.tripsCount || 0
          invoicesCount = stats.invoicesCount || 0
          accountsCount = stats.accountsCount || 0
          faqsCount = stats.faqsCount || 0
          visaApplicationsCount = stats.visaApplicationsCount || 0
          visaRevenue = stats.visaRevenue || 0
        }

        const { data: recent } = await supabase
          .from('conversations')
          .select('id, agency_id, customer_name, customer_phone, platform, status, unread_count, last_message_at, last_message_preview, lead_score, tags, assigned_to')
          .order('last_message_at', { ascending: false })
          .limit(5)
        
        recentConversations = recent || []

        // Load car counts
        const { count: cCount } = await supabase.from('car_inventory').select('*', { count: 'exact', head: true })
        if (cCount !== null && cCount !== undefined) carsCount = cCount

        const { count: tdCount } = await supabase.from('test_drives').select('*', { count: 'exact', head: true })
        if (tdCount !== null && tdCount !== undefined) testDrivesScheduled = tdCount

        const { count: finCount } = await supabase.from('financing_applications').select('*', { count: 'exact', head: true })
        if (finCount !== null && finCount !== undefined) financingApps = finCount
      }
    } catch (e) {
      console.error('Error fetching dashboard stats:', e)
    }
  } else {
    // Demo Mode
    userName = mockProfiles[0].full_name
    totalConversations = mockConversations.length
    hotLeads = mockConversations.filter(c => c.lead_score === 'HOT').length
    bookingsThisMonth = mockBookings.length
    tripsCount = 8
    invoicesCount = 14
    accountsCount = 2
    faqsCount = 5

    // Populate simulated showroom conversions
    recentConversations = mockConversations.map(c => ({
      ...c,
      lead_summary: c.customer_name === 'Achraf' 
        ? 'Interested in the 2024 Toyota Tucson, asking about the 30% down payment options.' 
        : c.customer_name === 'Sarah' 
        ? 'Inquired about scheduling a test drive for the Audi A4 this Saturday.' 
        : 'Wants to schedule a review for financing applications.',
      lead_score: c.customer_name === 'Achraf' ? 'HOT' : c.customer_name === 'Sarah' ? 'WARM' : 'COLD'
    })).slice(0, 5)
  }

  if (businessTypeSlug === 'car_showroom') {
    return (
      <CarShowroomDashboard
        userName={userName}
        totalConversations={totalConversations}
        hotLeads={hotLeads}
        carsCount={carsCount}
        testDrivesScheduled={testDrivesScheduled}
        financingApps={financingApps}
        salesVolume={salesVolume}
        recentLeads={recentConversations}
      />
    )
  }

  return (
    <DashboardClient 
      userName={userName}
      totalConversations={totalConversations}
      hotLeads={hotLeads}
      bookingsThisMonth={bookingsThisMonth}
      aiResponseRate={aiResponseRate}
      recentConversations={recentConversations}
      tripsCount={tripsCount}
      invoicesCount={invoicesCount}
      accountsCount={accountsCount}
      faqsCount={faqsCount}
      visaApplicationsCount={visaApplicationsCount}
      visaRevenue={visaRevenue}
    />
  )
}
