'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toggleAgencyStatus, deleteAgency, changeAgencyPlan, setAgencyCredits } from '@/app/actions/admin-agencies'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Loader2, Zap, Ban, CheckCircle } from 'lucide-react'
import { getTenantUrl, getTenantUrlLabel } from '@/lib/tenant-url'

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

export function AdminAgenciesClient({ initialAgencies, plans = [] }: { initialAgencies: any[], plans: any[] }) {
  const [agencies, setAgencies] = useState(initialAgencies)
  const [search, setSearch] = useState('')
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [creditInputs, setCreditInputs] = useState<Record<string, string>>({})
  const [creditsPopupId, setCreditsPopupId] = useState<string | null>(null)

  const filtered = agencies.filter(a =>
    a.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.subdomain?.toLowerCase().includes(search.toLowerCase())
  )

  const handleToggle = async (id: string, status: string) => {
    setLoadingAction(`toggle-${id}`)
    const res = await toggleAgencyStatus(id, status)
    if (res.success) {
      setAgencies(agencies.map(a => a.id === id ? { ...a, status: status === 'active' ? 'inactive' : 'active' } : a))
    } else {
      alert(res.error)
    }
    setLoadingAction(null)
    setOpenMenuId(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('⚠️ WARNING: This permanently deletes the agency, all their trips, bookings, employees and users. Are you 100% sure?')) return
    setLoadingAction(`delete-${id}`)
    const res = await deleteAgency(id)
    if (res.success) {
      setAgencies(agencies.filter(a => a.id !== id))
    } else {
      alert(res.error)
    }
    setLoadingAction(null)
    setOpenMenuId(null)
  }

  const handlePlanChange = async (agencyId: string, planId: string) => {
    setLoadingAction(`plan-${agencyId}`)
    const plan = plans.find(p => p.id === planId)
    const res = await changeAgencyPlan(agencyId, planId)
    if (res.success) {
      setAgencies(agencies.map(a =>
        a.id === agencyId
          ? { ...a, plan: plan ? { name: plan.name, price: plan.price } : null, ai_credits: plan?.ai_credits_monthly ?? a.ai_credits }
          : a
      ))
    } else {
      alert(res.error)
    }
    setLoadingAction(null)
    setOpenMenuId(null)
  }

  const handleCreditTopup = async (agencyId: string) => {
    const credits = parseInt(creditInputs[agencyId] || '0', 10)
    if (!credits || credits < 0) return alert('Enter a valid credit amount.')
    setLoadingAction(`credits-${agencyId}`)
    const res = await setAgencyCredits(agencyId, credits)
    if (res.success) {
      setAgencies(agencies.map(a => a.id === agencyId ? { ...a, ai_credits: credits } : a))
      setCreditInputs(prev => ({ ...prev, [agencyId]: '' }))
      setCreditsPopupId(null)
    } else {
      alert(res.error)
    }
    setLoadingAction(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'inactive': return 'bg-red-100 text-red-700 border-red-200'
      case 'suspended': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-slate-100 text-slate-600 border-slate-200'
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Agency Management</h1>
          <p className="text-slate-500 mt-1">
            Control subscriptions, credits, and access for all {agencies.length} registered agencies.
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-slate-900">{agencies.filter(a => a.status === 'active').length}</div>
          <div className="text-xs text-slate-500">Active Agencies</div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-emerald-700">{agencies.filter(a => a.status === 'active').length}</div>
          <div className="text-xs text-emerald-600 mt-1 font-medium">✅ Active Subscriptions</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-red-700">{agencies.filter(a => a.status !== 'active').length}</div>
          <div className="text-xs text-red-600 mt-1 font-medium">🚫 Suspended / Inactive</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-blue-700">
            {agencies.reduce((sum, a) => sum + (a.ai_credits || 0), 0).toLocaleString()}
          </div>
          <div className="text-xs text-blue-600 mt-1 font-medium">⚡ Total AI Credits Allocated</div>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search agency name or subdomain..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Subdomain</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>AI Credits</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(agency => (
              <TableRow key={agency.id} className="hover:bg-slate-50/50">
                <TableCell className="font-medium">
                  <Link href={`/admin/agencies/${agency.id}`} className="hover:text-blue-600 hover:underline font-semibold">
                    {agency.company_name}
                  </Link>
                </TableCell>
                <TableCell className="text-slate-500 text-sm">
                  <a href={getTenantUrl(agency.subdomain, agency.custom_domain)} target="_blank" rel="noreferrer" className="hover:underline font-mono text-xs">
                    {getTenantUrlLabel(agency.subdomain, agency.custom_domain)}
                  </a>
                </TableCell>
                <TableCell>
                  {/* Plan selector inline */}
                  <div className="relative inline-block">
                    <select
                      className="text-xs border rounded-lg px-2 py-1 bg-white text-slate-700 font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                      defaultValue={(Array.isArray(agency.plan) ? agency.plan[0] : agency.plan as any)?.id || agency.plan || ''}
                      onChange={(e) => handlePlanChange(agency.id, e.target.value)}
                      disabled={loadingAction === `plan-${agency.id}`}
                    >
                      <option value="">Select Plan</option>
                      {plans
                        .filter(p => agency.business_type_slug === 'car_showroom' ? p.business_type === 'car_showroom' : agency.business_type_slug === 'ecommerce' ? p.business_type === 'ecommerce' : p.business_type === 'travel')
                        .map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({Number(p.price).toLocaleString()} DZD)</option>
                        ))
                      }
                    </select>
                    {loadingAction === `plan-${agency.id}` && (
                      <Loader2 className="h-3 w-3 animate-spin absolute right-1 top-1.5 text-slate-400" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700">{(agency.ai_credits || 0).toLocaleString()}</span>
                    <div className="relative">
                      <button
                        onClick={() => setCreditsPopupId(creditsPopupId === agency.id ? null : agency.id)}
                        className="p-1 hover:bg-blue-50 rounded text-blue-500 transition-colors"
                        title="Top up credits"
                      >
                        <Zap className="h-3.5 w-3.5" />
                      </button>
                      {creditsPopupId === agency.id && (
                        <div className="absolute left-0 top-7 bg-white border shadow-xl rounded-xl p-3 z-50 w-52 space-y-2">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Set AI Credits</p>
                          <input
                            type="number"
                            placeholder="e.g. 2000"
                            value={creditInputs[agency.id] || ''}
                            onChange={e => setCreditInputs(prev => ({ ...prev, [agency.id]: e.target.value }))}
                            className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="flex gap-2">
                            {[500, 1000, 5000].map(n => (
                              <button
                                key={n}
                                onClick={() => setCreditInputs(prev => ({ ...prev, [agency.id]: String(n) }))}
                                className="flex-1 text-[10px] bg-slate-100 hover:bg-slate-200 rounded-lg py-1 font-bold text-slate-600 transition-colors"
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                          <Button
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => handleCreditTopup(agency.id)}
                            disabled={loadingAction === `credits-${agency.id}`}
                          >
                            {loadingAction === `credits-${agency.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : '⚡ Apply Credits'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`capitalize text-xs font-semibold border ${getStatusColor(agency.status)}`}
                  >
                    {agency.status === 'active' ? '✅' : '🚫'} {agency.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-slate-500">
                  {formatDate(agency.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggle(agency.id, agency.status)}
                      disabled={loadingAction === `toggle-${agency.id}`}
                      className={agency.status === 'active'
                        ? 'text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700'
                        : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'}
                    >
                      {loadingAction === `toggle-${agency.id}`
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : agency.status === 'active'
                        ? <><Ban className="h-3.5 w-3.5 mr-1" />Suspend</>
                        : <><CheckCircle className="h-3.5 w-3.5 mr-1" />Activate</>
                      }
                    </Button>
                    <Link href={`/admin/agencies/${agency.id}`}>
                      <Button variant="ghost" size="sm" className="text-slate-600 hover:text-blue-600">
                        View →
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(agency.id)}
                      disabled={loadingAction === `delete-${agency.id}`}
                    >
                      {loadingAction === `delete-${agency.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="font-medium">No agencies found</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
