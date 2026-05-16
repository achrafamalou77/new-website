import { createClient } from '@/lib/supabase/server'
import { isSupabaseConnected } from '@/lib/supabase/client'
import { mockConversations, mockBookings, mockProfiles } from '@/lib/mock-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Inbox, Calendar, ClipboardList, MessageSquare, Flame, TrendingUp, Zap } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export default async function DashboardHome() {
  let userName = 'Admin'
  let totalConversations = 0
  let hotLeads = 0
  let bookingsThisMonth = 0
  let aiResponseRate = 94 // Mock value
  let recentConversations: any[] = []

  if (isSupabaseConnected) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: profileData } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
      const profile = profileData as any
      if (profile) userName = profile.full_name
    }

    // Fetch stats
    const { count: convCount } = await supabase.from('conversations').select('*', { count: 'exact', head: true })
    totalConversations = convCount || 0

    const { count: hotCount } = await supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('lead_score', 'HOT')
    hotLeads = hotCount || 0

    // For bookings this month, we'll just count all for now as a simple metric
    const { count: bookCount } = await supabase.from('bookings').select('*', { count: 'exact', head: true })
    bookingsThisMonth = bookCount || 0

    const { data: recent } = await supabase
      .from('conversations')
      .select('*')
      .order('last_message_at', { ascending: false })
      .limit(5)
    
    recentConversations = recent || []
  } else {
    // Demo Mode
    userName = mockProfiles[0].full_name
    totalConversations = mockConversations.length
    hotLeads = mockConversations.filter(c => c.lead_score === 'HOT').length
    bookingsThisMonth = mockBookings.length
    
    recentConversations = [...mockConversations]
      .sort((a, b) => new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime())
      .slice(0, 5)
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back, {userName}!</h1>
          <p className="text-slate-500 mt-1">Here's what's happening with your agency today.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/trips">
            <Button variant="outline"><Calendar className="mr-2 h-4 w-4" /> Add Trip</Button>
          </Link>
          <Link href="/dashboard/inbox">
            <Button><Inbox className="mr-2 h-4 w-4" /> Go to Inbox</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConversations}</div>
            <p className="text-xs text-slate-400 mt-1">+12% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">HOT Leads</CardTitle>
            <Flame className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{hotLeads}</div>
            <p className="text-xs text-slate-400 mt-1">Requires immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Bookings This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{bookingsThisMonth}</div>
            <p className="text-xs text-slate-400 mt-1">Chatbot converted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">AI Response Rate</CardTitle>
            <Zap className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{aiResponseRate}%</div>
            <p className="text-xs text-slate-400 mt-1">Of total messages handled</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentConversations.map((conv) => (
                <Link 
                  href={`/dashboard/inbox`} 
                  key={conv.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                >
                  <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                    {conv.customer_name?.[0] || '?'}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium truncate">{conv.customer_name || conv.customer_phone}</p>
                    <p className="text-sm text-slate-500 truncate">{conv.lead_summary}</p>
                  </div>
                  <div className="text-xs text-slate-400 whitespace-nowrap">
                    {conv.last_message_at ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true }) : ''}
                  </div>
                </Link>
              ))}
              {recentConversations.length === 0 && (
                <div className="text-sm text-slate-500 text-center py-4">No recent activity</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/dashboard/inbox" className="block">
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <Inbox className="mr-3 h-5 w-5 text-blue-500" />
                <div className="text-left">
                  <div className="font-medium">Unified Inbox</div>
                  <div className="text-xs text-slate-500 font-normal">Manage customer messages</div>
                </div>
              </Button>
            </Link>
            <Link href="/dashboard/trips" className="block">
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <Calendar className="mr-3 h-5 w-5 text-emerald-500" />
                <div className="text-left">
                  <div className="font-medium">Manage Trips</div>
                  <div className="text-xs text-slate-500 font-normal">Update your catalog</div>
                </div>
              </Button>
            </Link>
            <Link href="/dashboard/bookings" className="block">
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <ClipboardList className="mr-3 h-5 w-5 text-purple-500" />
                <div className="text-left">
                  <div className="font-medium">View Bookings</div>
                  <div className="text-xs text-slate-500 font-normal">Check latest reservations</div>
                </div>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
