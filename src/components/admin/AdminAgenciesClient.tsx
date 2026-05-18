'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toggleAgencyStatus, deleteAgency } from '@/app/actions/admin-agencies'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, MoreVertical, Loader2 } from 'lucide-react'

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

export function AdminAgenciesClient({ initialAgencies }: { initialAgencies: any[] }) {
  const [agencies, setAgencies] = useState(initialAgencies)
  const [search, setSearch] = useState('')
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  const filtered = agencies.filter(a => 
    a.company_name.toLowerCase().includes(search.toLowerCase()) || 
    a.subdomain.toLowerCase().includes(search.toLowerCase())
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
  }

  const handleDelete = async (id: string) => {
    if (!confirm('WARNING: This will permanently delete the agency, all their trips, bookings, and users. Are you absolutely sure?')) return
    setLoadingAction(`delete-${id}`)
    const res = await deleteAgency(id)
    if (res.success) {
      setAgencies(agencies.filter(a => a.id !== id))
    } else {
      alert(res.error)
    }
    setLoadingAction(null)
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Agencies</h1>
          <p className="text-slate-500 mt-1">Manage all registered travel agencies on the platform.</p>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search by company or subdomain..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
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
              <TableRow key={agency.id}>
                <TableCell className="font-medium">
                  <Link href={`/admin/agencies/${agency.id}`} className="hover:text-blue-600 hover:underline">
                    {agency.company_name}
                  </Link>
                </TableCell>
                <TableCell className="text-slate-500">
                  <a href={`http://${agency.subdomain}.localhost:3000`} target="_blank" rel="noreferrer" className="hover:underline">
                    {agency.subdomain}
                  </a>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {(Array.isArray(agency.plan) ? agency.plan[0] : agency.plan as any)?.name || 'Unknown'}
                  </Badge>
                </TableCell>
                <TableCell>{agency.ai_credits || 0}</TableCell>
                <TableCell>
                  <Badge variant={agency.status === 'active' ? 'default' : 'secondary'} className={agency.status === 'active' ? 'bg-emerald-100 text-emerald-700' : ''}>
                    {agency.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-slate-500">
                  {formatDate(agency.created_at)}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleToggle(agency.id, agency.status)}
                    disabled={loadingAction === `toggle-${agency.id}`}
                  >
                    {loadingAction === `toggle-${agency.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : (agency.status === 'active' ? 'Suspend' : 'Activate')}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(agency.id)}
                    disabled={loadingAction === `delete-${agency.id}`}
                  >
                    {loadingAction === `delete-${agency.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-500">No agencies found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
