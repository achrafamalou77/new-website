import { getAdminDashboardStats } from '@/app/actions/admin-dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, Activity, MessageSquare, CreditCard, DollarSign } from 'lucide-react'
import Link from 'next/link'

export default async function AdminDashboard() {
  const stats = await getAdminDashboardStats()

  const formatDZD = (val: number) => {
    return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' }).format(val)
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Platform Overview</h1>
        <p className="text-slate-500 mt-1">Monitor all agencies and global platform metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agencies</CardTitle>
            <Building2 className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAgencies}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agencies</CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAgencies}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDZD(stats.mrr)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConversations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <CreditCard className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Signups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentSignups.map((agency: any) => (
                <div key={agency.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                  <div>
                    <Link href={`/admin/agencies/${agency.id}`} className="font-semibold text-blue-600 hover:underline">
                      {agency.company_name}
                    </Link>
                    <div className="text-sm text-slate-500">{agency.subdomain}.lvh.me:3000</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="capitalize">
                      {(Array.isArray(agency.plan) ? agency.plan[0] : agency.plan as any)?.name || 'Unknown'}
                    </Badge>
                    <Badge variant={agency.status === 'active' ? 'default' : 'destructive'} className={agency.status === 'active' ? 'bg-emerald-100 text-emerald-700' : ''}>
                      {agency.status}
                    </Badge>
                    <div className="text-xs text-slate-400 w-24 text-right">
                      {new Date(agency.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
              {stats.recentSignups.length === 0 && (
                <div className="text-center py-8 text-slate-500">No agencies signed up yet.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/agencies" className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
              <span className="font-medium">View All Agencies</span>
              <span className="text-blue-600">→</span>
            </Link>
            <Link href="/admin/plans" className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
              <span className="font-medium">Manage Pricing Plans</span>
              <span className="text-blue-600">→</span>
            </Link>
            <Link href="/admin/analytics" className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
              <span className="font-medium">View Analytics Report</span>
              <span className="text-blue-600">→</span>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
