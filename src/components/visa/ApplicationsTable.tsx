'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { EnhancedVisaApplication } from '@/types/visa'
import { updateVisaApplicationStatus, sendVisaWhatsAppReminder } from '@/app/actions/visa'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  FileText, Search, User, Filter, RefreshCw, Calendar, 
  MessageSquare, MoreHorizontal, Eye, Edit3, CheckCircle, 
  XCircle, Clock, AlertCircle, FileCheck, Globe, CreditCard
} from 'lucide-react'
import { format } from 'date-fns'

interface ApplicationsTableProps {
  initialApplications: EnhancedVisaApplication[];
  employees: any[];
}

export function ApplicationsTable({ initialApplications, employees }: ApplicationsTableProps) {
  const router = useRouter()
  const [applications, setApplications] = useState<EnhancedVisaApplication[]>(initialApplications)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  
  // Filtering states
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [countryFilter, setCountryFilter] = useState('all')

  // Status badge config
  const statusConfig = {
    inquiry: { label: 'Inquiry', color: 'bg-slate-100 text-slate-800 border-slate-200' },
    documents_pending: { label: 'Doc Pending', color: 'bg-red-50 text-red-700 border-red-200 animate-pulse font-bold' },
    documents_received: { label: 'Doc Received', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    application_submitted: { label: 'Submitted', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    under_review: { label: 'Under Review', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    approved: { label: 'Approved 🎉', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold border-2' },
    rejected: { label: 'Rejected ❌', color: 'bg-rose-50 text-rose-700 border-rose-200 font-bold' },
    completed: { label: 'Completed', color: 'bg-slate-900 text-white border-slate-800' }
  }

  // Country Flags Mapping
  const countryFlags: { [key: string]: string } = {
    france: '🇫🇷',
    spain: '🇪🇸',
    italy: '🇮🇹',
    turkey: '🇹🇷',
    egypt: '🇪🇬',
    'saudi arabia': '🇸🇦',
    'united arab emirates': '🇦🇪',
    'united kingdom': '🇬🇧',
    'united states': '🇺🇸',
    canada: '🇨🇦'
  }

  // Handle Quick Status Change
  const handleStatusChange = async (appId: string, newStatus: any) => {
    setLoadingId(appId)
    const result = await updateVisaApplicationStatus(appId, newStatus)
    if (result.success) {
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a))
      router.refresh()
    }
    setLoadingId(null)
  }

  // Handle WhatsApp Notification Reminder Trigger
  const triggerWhatsApp = async (appId: string, type: 'document_request' | 'appointment' | 'approval') => {
    const result = await sendVisaWhatsAppReminder(appId, type)
    if (result.success) {
      alert(result.message || 'Reminder draft saved. No WhatsApp message was sent.')
    }
  }

  // Countries extracted from list for filter dropdown
  const uniqueCountries = useMemo(() => {
    const countries = new Set<string>()
    applications.forEach(a => {
      if (a.visa_type?.destination_country) {
        countries.add(a.visa_type.destination_country)
      }
    })
    return Array.from(countries)
  }, [applications])

  // Filtered applications
  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      const matchSearch = 
        app.client?.full_name.toLowerCase().includes(search.toLowerCase()) ||
        app.client?.phone?.includes(search) ||
        app.visa_type?.name.toLowerCase().includes(search.toLowerCase()) ||
        app.group_name?.toLowerCase().includes(search.toLowerCase())

      const matchStatus = statusFilter === 'all' || app.status === statusFilter
      const matchPayment = paymentFilter === 'all' || app.payment_status === paymentFilter
      const matchAssignee = assigneeFilter === 'all' || app.assigned_to === assigneeFilter
      const matchCountry = countryFilter === 'all' || app.visa_type?.destination_country === countryFilter

      return matchSearch && matchStatus && matchPayment && matchAssignee && matchCountry
    })
  }, [applications, search, statusFilter, paymentFilter, assigneeFilter, countryFilter])

  // Appointments today list
  const todayAppointments = useMemo(() => {
    const today = new Date().toDateString()
    return applications.filter(a => a.appointment_date && new Date(a.appointment_date).toDateString() === today)
  }, [applications])

  return (
    <div className="space-y-6">
      
      {/* Search & Filter Options Bar */}
      <Card className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Search box */}
          <div className="relative col-span-1 md:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
            <Input 
              placeholder="Search client, visa, group..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200 rounded-xl text-slate-700 text-[13px] h-10 placeholder:text-slate-400 focus:bg-white focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-[13px] h-10 outline-none focus:bg-white focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="inquiry">Inquiry</option>
              <option value="documents_pending">Documents Pending</option>
              <option value="documents_received">Documents Received</option>
              <option value="application_submitted">Application Submitted</option>
              <option value="under_review">Under Embassy Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Country filter */}
          <div>
            <select
              value={countryFilter}
              onChange={e => setCountryFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-[13px] h-10 outline-none focus:bg-white focus:ring-blue-500"
            >
              <option value="all">All Countries</option>
              {uniqueCountries.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Payment filter */}
          <div>
            <select
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-[13px] h-10 outline-none focus:bg-white"
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>

          {/* Assignee filter */}
          <div>
            <select
              value={assigneeFilter}
              onChange={e => setAssigneeFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-[13px] h-10 outline-none focus:bg-white"
            >
              <option value="all">All Assigned Staff</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.full_name}</option>
              ))}
            </select>
          </div>

        </div>
      </Card>

      {/* Quick Info Box: Today's Appointments Panel */}
      {todayAppointments.length > 0 && (
        <Card className="p-4 border-l-4 border-amber-500 bg-amber-50/50 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-amber-600 animate-bounce" />
            <div>
              <h4 className="font-bold text-slate-800 text-[13px]">Today's Biometric & Embassy Appointments</h4>
              <p className="text-[11px] text-slate-500">There are {todayAppointments.length} appointments scheduled for today.</p>
            </div>
          </div>
          <div className="flex gap-2">
            {todayAppointments.map(app => (
              <Badge key={app.id} className="bg-amber-100 text-amber-800 border-amber-200">
                {app.client?.full_name} ({app.visa_type?.name})
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Main Responsive Grid Table */}
      <Card className="overflow-hidden border border-slate-200/80 rounded-2xl bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4 pl-6">Client / Applicant</th>
                <th className="p-4">Visa Type & Class</th>
                <th className="p-4">Destination</th>
                <th className="p-4">Status & Action</th>
                <th className="p-4">Documents (Received)</th>
                <th className="p-4">Appointment</th>
                <th className="p-4">Assigned To</th>
                <th className="p-4">Total Price</th>
                <th className="p-4 text-right pr-6 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px] text-slate-700">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400 font-medium">
                    <FileText className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                    No visa applications match the active filters.
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => {
                  const status = statusConfig[app.status] || { label: app.status, color: 'bg-slate-100' }
                  
                  // Compute document checklist ratio
                  const totalDocs = app.documents_status?.length || 0
                  const receivedDocs = app.documents_status?.filter(d => d.status === 'received').length || 0
                  const ratio = totalDocs > 0 ? (receivedDocs / totalDocs) * 100 : 0
                  
                  const destCountry = app.visa_type?.destination_country || 'France'
                  const flag = countryFlags[destCountry.toLowerCase()] || '🌍'

                  return (
                    <tr 
                      key={app.id} 
                      className={`hover:bg-slate-50/50 transition-colors ${app.status === 'documents_pending' ? 'bg-red-50/10' : ''}`}
                    >
                      {/* 1. Client cell */}
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-slate-200 shadow-2xs">
                            <AvatarFallback className="bg-blue-50 text-blue-600 font-bold text-[12px]">
                              {app.client?.full_name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-slate-800 truncate hover:text-blue-600 transition">
                              {app.client?.full_name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                              {app.client?.phone}
                              {app.group_name && (
                                <Badge className="bg-purple-100 text-purple-800 border-purple-200 py-0 px-1.5 text-[9px] font-bold">
                                  Group: {app.group_name}
                                </Badge>
                              )}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Visa Type cell */}
                      <td className="p-4 font-semibold text-slate-700">
                        <div className="flex flex-col">
                          <span>{app.visa_type?.name || 'France Schengen'}</span>
                          <span className="text-[10px] text-slate-400 capitalize">{app.service_level} Service</span>
                        </div>
                      </td>

                      {/* 3. Destination Country Flag cell */}
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 font-bold text-slate-800">
                          <span className="text-lg leading-none">{flag}</span>
                          {destCountry}
                        </span>
                      </td>

                      {/* 4. Status Badge + Quick Action cell */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Badge className={`${status.color} border px-2 py-0.5 text-[10px] font-bold rounded-full shadow-2xs`}>
                            {status.label}
                          </Badge>
                          
                          {/* Quick dropdown select to modify status */}
                          <select
                            disabled={loadingId === app.id}
                            value={app.status}
                            onChange={e => handleStatusChange(app.id, e.target.value as any)}
                            className="bg-transparent text-[10px] text-slate-400 hover:text-slate-600 font-bold border-0 cursor-pointer outline-none w-16"
                          >
                            <option value="inquiry">Inquiry</option>
                            <option value="documents_pending">Doc Pend</option>
                            <option value="documents_received">Doc Recv</option>
                            <option value="application_submitted">Submit</option>
                            <option value="under_review">Review</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                      </td>

                      {/* 5. Documents collection cell */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${ratio === 100 ? 'bg-emerald-500' : ratio > 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${ratio}%` }}
                            />
                          </div>
                          <span className={`text-[11px] font-bold ${ratio === 100 ? 'text-emerald-600' : 'text-slate-500'}`}>
                            {receivedDocs}/{totalDocs}
                          </span>
                        </div>
                      </td>

                      {/* 6. Appointment Date cell */}
                      <td className="p-4 font-semibold text-slate-600">
                        {app.appointment_date ? (
                          <div className="flex flex-col">
                            <span className="text-[12px] text-slate-800">{format(new Date(app.appointment_date), 'dd MMM yyyy')}</span>
                            <span className="text-[10px] text-slate-400 font-semibold">{format(new Date(app.appointment_date), 'hh:mm a')}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Not Scheduled</span>
                        )}
                      </td>

                      {/* 7. Assigned Employee Employee avatar */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <Avatar className="h-6 w-6 border shadow-3xs">
                            <AvatarFallback className="bg-slate-100 text-slate-600 text-[9px] font-bold">
                              {app.assignee?.full_name ? app.assignee.full_name[0] : 'N'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[11px] font-semibold text-slate-500 truncate max-w-[80px]">
                            {app.assignee?.full_name.split(' ')[0]}
                          </span>
                        </div>
                      </td>

                      {/* 8. Total Price & Payment Status cell */}
                      <td className="p-4 font-semibold text-slate-700">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-slate-800">{app.total_fee.toLocaleString()} DZD</span>
                          <span className="mt-0.5 inline-flex items-center gap-1">
                            <Badge className={`text-[9px] px-1 py-0 rounded ${
                              app.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                              app.payment_status === 'partial' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-red-100 text-red-800 border-red-200'
                            }`}>
                              {app.payment_status}
                            </Badge>
                            {app.amount_paid > 0 && app.payment_status !== 'paid' && (
                              <span className="text-[9px] text-slate-400">({app.amount_paid.toLocaleString()} paid)</span>
                            )}
                          </span>
                        </div>
                      </td>

                      {/* 9. Operations Column actions */}
                      <td className="p-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Send whatsapp reminders quick actions */}
                          {app.status === 'documents_pending' && (
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              title="WhatsApp Remind Document"
                              onClick={() => triggerWhatsApp(app.id, 'document_request')}
                              className="h-8 w-8 hover:bg-emerald-50 text-emerald-500 rounded-lg"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => router.push(`/dashboard/visa/${app.id}`)}
                            title="View Details"
                            className="h-8 w-8 hover:bg-slate-100 text-slate-500 rounded-lg"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>

                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
    </div>
  )
}
