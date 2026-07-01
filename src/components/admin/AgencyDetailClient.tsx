'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toggleAgencyStatus, deleteAgency, changeAgencyPlan, setAgencyCredits } from '@/app/actions/admin-agencies'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Building2, MessageSquare, CreditCard, Users, Loader2, ArrowLeft,
  Zap, Shield, Ban, CheckCircle, Package, TrendingUp, Calendar, Globe,
  ExternalLink, Clock
} from 'lucide-react'
import Link from 'next/link'
import { getTenantUrl, getTenantUrlLabel } from '@/lib/tenant-url'

export function AgencyDetailClient({ data, plans = [] }: { data: any; plans: any[] }) {
  const router = useRouter()
  const { agency, stats, recentConversations, recentBookings } = data
  
  const activePlanObj = Array.isArray(agency.plan) ? agency.plan[0] : agency.plan
  const activePlanId = activePlanObj?.id || agency.plan || ''
  
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [newCredits, setNewCredits] = useState('')
  const [selectedPlan, setSelectedPlan] = useState(activePlanId)
  const [currentCredits, setCurrentCredits] = useState(agency.ai_credits || 0)

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
    if (!confirm('⚠️ WARNING: This permanently deletes the agency, all their trips, bookings, employees and users. Are you 100% sure?')) return
    setLoadingAction('delete')
    const res = await deleteAgency(agency.id)
    if (res.success) {
      router.push('/admin/agencies')
    } else {
      alert(res.error)
      setLoadingAction(null)
    }
  }

  const handlePlanChange = async () => {
    if (!selectedPlan) return
    setLoadingAction('plan')
    const plan = plans.find(p => p.id === selectedPlan)
    const res = await changeAgencyPlan(agency.id, selectedPlan)
    if (res.success) {
      setCurrentCredits(plan?.ai_credits_monthly || currentCredits)
      router.refresh()
    } else {
      alert(res.error)
    }
    setLoadingAction(null)
  }

  const handleCreditTopup = async () => {
    const credits = parseInt(newCredits, 10)
    if (!credits || credits < 0) return alert('Please enter a valid credit amount.')
    setLoadingAction('credits')
    const res = await setAgencyCredits(agency.id, credits)
    if (res.success) {
      setCurrentCredits(credits)
      setNewCredits('')
    } else {
      alert(res.error)
    }
    setLoadingAction(null)
  }

  const formatDZD = (val: number) =>
    new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' }).format(val)

  const planInfo = (Array.isArray(agency.plan) ? agency.plan[0] : agency.plan as any)
  const isActive = agency.status === 'active'
  const isPending = agency.status === 'pending'

  return (
    <div className="p-8 space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/admin/agencies" className="p-2 hover:bg-slate-100 rounded-full transition-colors mt-1">
          <ArrowLeft className="h-5 w-5 text-slate-500" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{agency.company_name}</h1>
            <Badge
              variant="outline"
              className={`text-xs font-semibold border ${isActive
                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                : 'bg-red-100 text-red-700 border-red-200'
              }`}
            >
              {isActive ? '✅ Active' : '🚫 Suspended'}
            </Badge>
            {planInfo?.name && (
              <Badge variant="outline" className="text-xs font-semibold">
                📦 {planInfo.name}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4 mt-2">
            <a
              href={getTenantUrl(agency.subdomain, agency.custom_domain)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              <Globe className="h-3.5 w-3.5" />
              {getTenantUrlLabel(agency.subdomain, agency.custom_domain)}
              <ExternalLink className="h-3 w-3" />
            </a>
            {agency.email && (
              <span className="text-sm text-slate-500">{agency.email}</span>
            )}
            <span className="text-sm text-slate-400 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Joined {new Date(agency.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={handleToggle}
            disabled={loadingAction === 'toggle'}
            className={isActive
              ? 'text-red-600 border-red-200 hover:bg-red-50'
              : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
            }
          >
            {loadingAction === 'toggle' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> :
              isActive ? <Ban className="h-4 w-4 mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />
            }
            {isActive ? 'Suspend Agency' : isPending ? 'Approve Agency' : 'Reactivate Agency'}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loadingAction === 'delete'}
          >
            {loadingAction === 'delete' && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Delete Agency
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Trips', value: stats.trips, icon: <Building2 className="h-4 w-4 text-slate-400" />, color: 'text-slate-700' },
          { label: 'Conversations', value: stats.conversations, icon: <MessageSquare className="h-4 w-4 text-blue-400" />, color: 'text-blue-700' },
          { label: 'Bookings', value: stats.bookings, icon: <CreditCard className="h-4 w-4 text-emerald-400" />, color: 'text-emerald-700' },
          { label: 'Team Members', value: stats.employees, icon: <Users className="h-4 w-4 text-purple-400" />, color: 'text-purple-700' },
        ].map(s => (
          <Card key={s.label} className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">{s.label}</CardTitle>
              {s.icon}
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subscription Management Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Plan Management */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Package className="h-5 w-5 text-blue-500" />
              Subscription Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {plans
                .filter(p => agency.business_type_slug === 'car_showroom' ? p.business_type === 'car_showroom' : agency.business_type_slug === 'ecommerce' ? p.business_type === 'ecommerce' : p.business_type === 'travel')
                .map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPlan(p.id)}
                    className={`border-2 rounded-xl p-3 text-left transition-all cursor-pointer ${
                      selectedPlan === p.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className={`text-xs font-bold uppercase tracking-wider ${selectedPlan === p.id ? 'text-blue-600' : 'text-slate-500'}`}>
                      {p.name.replace('Car Showroom ', '').replace('Travel Agency ', '')}
                    </div>
                    <div className="text-sm font-bold text-slate-800 mt-1">
                      {Number(p.price).toLocaleString()} DZD
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">{Number(p.ai_credits_monthly || 0).toLocaleString()} AI cr/mo</div>
                  </button>
                ))
              }
            </div>
            <Button
              className="w-full"
              onClick={handlePlanChange}
              disabled={loadingAction === 'plan'}
            >
              {loadingAction === 'plan' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <TrendingUp className="h-4 w-4 mr-2" />}
              Apply Plan Change
            </Button>
            <p className="text-xs text-slate-400 text-center">
              Changing plan will automatically update the agency&apos;s monthly credit allocation.
            </p>
          </CardContent>
        </Card>

        {/* AI Credits Management */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Zap className="h-5 w-5 text-amber-500" />
              AI Credits Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
              <div className="text-4xl font-bold text-amber-700">{currentCredits.toLocaleString()}</div>
              <div className="text-sm text-amber-600 mt-1">Credits remaining</div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Set Credit Balance</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="e.g. 2000"
                  value={newCredits}
                  onChange={e => setNewCredits(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleCreditTopup}
                  disabled={loadingAction === 'credits' || !newCredits}
                  className="bg-amber-500 hover:bg-amber-600 text-white shrink-0"
                >
                  {loadingAction === 'credits' ? <Loader2 className="h-4 w-4 animate-spin" /> : '⚡ Apply'}
                </Button>
              </div>
              <div className="flex gap-2">
                {[500, 1000, 2000, 5000, 10000].map(n => (
                  <button
                    key={n}
                    onClick={() => setNewCredits(String(n))}
                    className="flex-1 text-[10px] bg-slate-100 hover:bg-amber-100 rounded-lg py-1.5 font-bold text-slate-600 hover:text-amber-700 transition-colors border border-slate-200 hover:border-amber-300"
                  >
                    {n >= 1000 ? `${n/1000}k` : n}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <MessageSquare className="h-5 w-5 text-blue-400" />
              Recent Conversations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentConversations.map((conv: any) => (
                <div key={conv.id} className="flex justify-between items-center p-3 border rounded-xl hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="font-semibold text-slate-800">{conv.customer_name || 'Unknown'}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {new Date(conv.created_at).toLocaleDateString('en-GB')}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs font-bold ${
                      conv.lead_score === 'hot' ? 'text-red-600 bg-red-50 border-red-200' :
                      conv.lead_score === 'warm' ? 'text-amber-600 bg-amber-50 border-amber-200' :
                      'text-slate-500 bg-slate-50 border-slate-200'
                    }`}
                  >
                    {conv.lead_score === 'hot' ? '🔥' : conv.lead_score === 'warm' ? '☀️' : '❄️'} {conv.lead_score?.toUpperCase()}
                  </Badge>
                </div>
              ))}
              {recentConversations.length === 0 && (
                <div className="text-slate-400 text-sm text-center py-6">No conversations yet.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <CreditCard className="h-5 w-5 text-emerald-400" />
              Recent Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentBookings.map((b: any) => (
                <div key={b.id} className="flex justify-between items-center p-3 border rounded-xl hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="font-semibold text-slate-800">
                      {Array.isArray(b.trip) ? b.trip[0]?.title : b.trip?.title || 'Unknown Trip'}
                    </div>
                    <div className="text-sm font-bold text-emerald-600">{formatDZD(b.total_price)}</div>
                  </div>
                  <Badge variant="outline" className="capitalize text-xs">
                    {b.status.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
              {recentBookings.length === 0 && (
                <div className="text-slate-400 text-sm text-center py-6">No bookings yet.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
