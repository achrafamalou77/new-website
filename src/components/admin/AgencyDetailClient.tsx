'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toggleAgencyStatus, deleteAgency } from '@/app/actions/admin-agencies'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, MessageSquare, CreditCard, Users, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export function AgencyDetailClient({ data }: { data: any }) {
  const router = useRouter()
  const { agency, stats, recentConversations, recentBookings } = data
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  const handleToggle = async () => {
    setLoadingAction('toggle')
    const res = await toggleAgencyStatus(agency.id, agency.status)
    if (res.success) {
      router.refresh()
    } else {
      alert(res.error)
    }
    setLoadingAction(null)
  }

  const handleDelete = async () => {
    if (!confirm('WARNING: This will permanently delete the agency, all their trips, bookings, and users. Are you absolutely sure?')) return
    setLoadingAction('delete')
    const res = await deleteAgency(agency.id)
    if (res.success) {
      router.push('/admin/agencies')
    } else {
      alert(res.error)
      setLoadingAction(null)
    }
  }

  const formatDZD = (val: number) => {
    return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' }).format(val)
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/admin/agencies" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="h-5 w-5 text-slate-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{agency.company_name}</h1>
          <p className="text-slate-500 mt-1">
            <a href={`http://${agency.subdomain}.localhost:3000`} target="_blank" rel="noreferrer" className="hover:underline">
              {agency.subdomain}.localhost:3000
            </a>
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={handleToggle}
            disabled={loadingAction === 'toggle'}
          >
            {loadingAction === 'toggle' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {agency.status === 'active' ? 'Suspend Agency' : 'Activate Agency'}
          </Button>
          <Button 
            variant="destructive"
            onClick={handleDelete}
            disabled={loadingAction === 'delete'}
          >
            {loadingAction === 'delete' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Delete Agency
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
            <Building2 className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.trips}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.conversations}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bookings</CardTitle>
            <CreditCard className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.bookings}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employees</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.employees}</div></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentConversations.map((conv: any) => (
                <div key={conv.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{conv.customer_name || 'Unknown'}</div>
                    <div className="text-sm text-slate-500">{new Date(conv.created_at).toLocaleDateString()}</div>
                  </div>
                  <Badge variant={conv.lead_score === 'HOT' ? 'destructive' : 'secondary'}>{conv.lead_score}</Badge>
                </div>
              ))}
              {recentConversations.length === 0 && <div className="text-slate-500 text-sm">No conversations yet.</div>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBookings.map((b: any) => (
                <div key={b.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{Array.isArray(b.trip) ? b.trip[0]?.title : b.trip?.title || 'Unknown Trip'}</div>
                    <div className="text-sm font-semibold text-emerald-600">{formatDZD(b.total_price)}</div>
                  </div>
                  <Badge variant="outline" className="capitalize">{b.status.replace('_', ' ')}</Badge>
                </div>
              ))}
              {recentBookings.length === 0 && <div className="text-slate-500 text-sm">No bookings yet.</div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
