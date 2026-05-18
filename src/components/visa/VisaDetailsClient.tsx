'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { EnhancedVisaApplication, VisaPayment, VisaTimelineEvent } from '@/types/visa'
import { 
  updateVisaApplicationStatus, recordVisaPayment, 
  sendVisaWhatsAppReminder 
} from '@/app/actions/visa'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DocumentChecklist } from '@/components/visa/DocumentChecklist'
import { StatusTimeline } from '@/components/visa/StatusTimeline'
import { 
  ChevronLeft, Info, FileText, CreditCard, Clock, MessageSquare, 
  User, CheckCircle2, AlertTriangle, Plus, Landmark, Phone, Mail, Award
} from 'lucide-react'
import { format } from 'date-fns'

interface VisaDetailsClientProps {
  initialData: {
    application: EnhancedVisaApplication;
    payments: VisaPayment[];
    timeline: VisaTimelineEvent[];
  }
}

export function VisaDetailsClient({ initialData }: VisaDetailsClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'payments' | 'timeline'>('overview')
  
  // Local state
  const [application, setApplication] = useState<EnhancedVisaApplication>(initialData.application)
  const [payments, setPayments] = useState<VisaPayment[]>(initialData.payments)
  const [timeline, setTimeline] = useState<VisaTimelineEvent[]>(initialData.timeline)

  // Status adjustment states
  const [submittingStatus, setSubmittingStatus] = useState(false)
  const [newStatus, setNewStatus] = useState(application.status)
  const [internalNotes, setInternalNotes] = useState(application.internal_notes || '')
  const [rejectionReason, setRejectionReason] = useState(application.rejection_reason || '')

  // Payment recording states
  const [submittingPayment, setSubmittingPayment] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState<'CCP' | 'Edahabia' | 'Cash' | 'Bank Transfer'>('CCP')
  const [payRef, setPayRef] = useState('')
  const [payNotes, setPayNotes] = useState('')

  // Simulated WhatsApp Notification template dispatch states
  const [waLoading, setWaLoading] = useState<string | null>(null)

  // Handlers
  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingStatus(true)
    const result = await updateVisaApplicationStatus(
      application.id, 
      newStatus, 
      internalNotes || undefined, 
      newStatus === 'rejected' ? rejectionReason : undefined
    )

    if (result.success) {
      // Refresh timeline & status
      setApplication(prev => ({
        ...prev,
        status: newStatus,
        internal_notes: internalNotes,
        rejection_reason: newStatus === 'rejected' ? rejectionReason : null
      }))
      
      // Auto-reload to fetch new timeline events
      router.refresh()
      alert('Application status successfully modified!')
    }
    setSubmittingStatus(false)
  }

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payAmount || Number(payAmount) <= 0) return
    
    setSubmittingPayment(true)
    const result = await recordVisaPayment({
      application_id: application.id,
      amount: Number(payAmount),
      payment_method: payMethod as any,
      payment_date: new Date().toISOString().split('T')[0],
      reference_number: payRef || undefined,
      notes: payNotes || undefined,
      receipt_url: payMethod === 'CCP' ? '/mock-ccp.png' : undefined // Simulated CCP slip
    })

    if (result.success) {
      const newP: VisaPayment = {
        id: result.data?.id || `pay-${Math.random()}`,
        application_id: application.id,
        amount: Number(payAmount),
        payment_method: payMethod as any,
        payment_date: new Date().toISOString().split('T')[0],
        reference_number: payRef || null,
        notes: payNotes || null,
        received_by: 'Self',
        created_at: new Date().toISOString()
      }
      
      setPayments(prev => [newP, ...prev])
      
      // Recalculate amount paid
      const nextPaid = application.amount_paid + newP.amount
      const nextStatus = nextPaid >= application.total_fee ? 'paid' : nextPaid > 0 ? 'partial' : 'unpaid'
      
      setApplication(prev => ({
        ...prev,
        amount_paid: nextPaid,
        payment_status: nextStatus
      }))

      setPayAmount('')
      setPayRef('')
      setPayNotes('')
      router.refresh()
      alert('Payment successfully registered!')
    }
    setSubmittingPayment(false)
  }

  const handleWhatsApp = async (type: 'document_request' | 'appointment' | 'approval') => {
    setWaLoading(type)
    const result = await sendVisaWhatsAppReminder(application.id, type)
    if (result.success) {
      alert(`WhatsApp Simulated Notice: Message dispatched! Log registered in activity.`)
      router.refresh()
    }
    setWaLoading(null)
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* 1. Header back control */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link 
            href="/dashboard/visa" 
            className="inline-flex items-center text-xs font-bold text-slate-400 hover:text-slate-600 transition gap-1 uppercase"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Visa Services
          </Link>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              Submission: {application.client?.full_name}
            </h1>
            <Badge className="bg-slate-100 text-slate-800 border text-xs px-2.5 py-0.5 rounded-full font-bold">
              {application.visa_type?.name}
            </Badge>
          </div>
        </div>

        {/* Quick WhatsApp Reminder tools */}
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline"
            disabled={waLoading !== null}
            onClick={() => handleWhatsApp('appointment')}
            className="border-slate-200 hover:bg-slate-50 text-slate-655 font-semibold text-xs h-9 px-3 rounded-lg flex items-center gap-1.5"
          >
            <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
            Biometrics Reminder
          </Button>

          {application.status === 'approved' && (
            <Button 
              size="sm" 
              onClick={() => handleWhatsApp('approval')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 px-3 rounded-lg flex items-center gap-1.5 shadow-xs"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Notify Approval
            </Button>
          )}
        </div>
      </div>

      {/* 2. Client Profile Mini card summary */}
      <Card className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
        <div className="flex items-center gap-4 col-span-1 md:col-span-2 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 pr-4">
          <Avatar className="h-14 w-14 border shadow-sm">
            <AvatarFallback className="bg-blue-50 text-blue-600 text-lg font-black">
              {application.client?.full_name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-800 text-[15px]">{application.client?.full_name}</h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-550 text-[11px] font-semibold">
              <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-slate-400" /> {application.client?.phone || 'N/A'}</span>
              <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-slate-400" /> {application.client?.email || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 col-span-1 md:col-span-2 text-xs font-semibold text-slate-500">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">CNI Card Reference</span>
            <span className="text-slate-800 font-extrabold mt-0.5">{application.client?.cni_number || 'N/A'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Assigned Handler</span>
            <span className="text-slate-800 font-extrabold mt-0.5">{application.assignee?.full_name || 'Not Assigned'}</span>
          </div>
        </div>
      </Card>

      {/* 3. Detailed Tabs selector */}
      <div className="flex gap-1.5 border-b border-slate-200 pb-px text-xs font-bold text-slate-400">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`pb-2.5 px-3 border-b-2 transition-all ${
            activeTab === 'overview' ? 'border-blue-600 text-slate-800 font-extrabold' : 'border-transparent hover:text-slate-600'
          }`}
        >
          Overview & Status
        </button>
        <button 
          onClick={() => setActiveTab('documents')}
          className={`pb-2.5 px-3 border-b-2 transition-all ${
            activeTab === 'documents' ? 'border-blue-600 text-slate-800 font-extrabold' : 'border-transparent hover:text-slate-600'
          }`}
        >
          Checklist ({application.documents_status?.length || 0})
        </button>
        <button 
          onClick={() => setActiveTab('payments')}
          className={`pb-2.5 px-3 border-b-2 transition-all ${
            activeTab === 'payments' ? 'border-blue-600 text-slate-800 font-extrabold' : 'border-transparent hover:text-slate-600'
          }`}
        >
          Payments & CCP ({payments.length})
        </button>
        <button 
          onClick={() => setActiveTab('timeline')}
          className={`pb-2.5 px-3 border-b-2 transition-all ${
            activeTab === 'timeline' ? 'border-blue-600 text-slate-800 font-extrabold' : 'border-transparent hover:text-slate-600'
          }`}
        >
          Timeline Audits
        </button>
      </div>

      {/* --- TAB CONTENT: OVERVIEW --- */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          
          {/* Status roadmap milestones */}
          <div className="lg:col-span-2 space-y-6">
            <StatusTimeline 
              currentStatus={application.status} 
              timeline={timeline} 
            />
          </div>

          {/* Sidebar configuration panel */}
          <div className="space-y-6">
            
            {/* Status change form */}
            <Card className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
              <h4 className="font-extrabold text-slate-800 text-[13px] uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Info className="h-4.5 w-4.5 text-blue-500" />
                Workflow Actions
              </h4>

              <form onSubmit={handleStatusChange} className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-slate-550 text-xs font-semibold">Change Progress Status</Label>
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs h-10 bg-slate-50 focus:bg-white focus:ring-blue-500 outline-none"
                  >
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

                {newStatus === 'rejected' && (
                  <div className="space-y-1">
                    <Label className="text-slate-550 text-xs font-semibold">Embassy Rejection Reason *</Label>
                    <Input 
                      required
                      value={rejectionReason}
                      onChange={e => setRejectionReason(e.target.value)}
                      placeholder="e.g. Passport validity insufficient"
                      className="border-slate-200 rounded-xl text-xs h-10"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-slate-550 text-xs font-semibold">Internal Roadmap Notes</Label>
                  <textarea
                    value={internalNotes}
                    onChange={e => setInternalNotes(e.target.value)}
                    placeholder="Check CNAS certificate stamps next week."
                    className="w-full border border-slate-200 rounded-xl p-3 text-xs min-h-[80px] bg-slate-50 focus:bg-white outline-none"
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={submittingStatus}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs h-10 shadow-xs"
                >
                  {submittingStatus ? 'Adjusting Status...' : 'Apply Status Change'}
                </Button>
              </form>
            </Card>

            {/* Financial tracking specs */}
            <Card className="p-5 bg-slate-900 border border-slate-800 rounded-2xl text-white space-y-4">
              <h4 className="font-extrabold text-amber-400 text-[13px] uppercase tracking-wider">
                Submission Ledger
              </h4>
              
              <div className="space-y-3.5 text-xs font-semibold text-slate-350">
                <div className="flex justify-between">
                  <span>Government Fee</span>
                  <span className="text-white font-bold">{application.government_fee.toLocaleString()} DZD</span>
                </div>
                <div className="flex justify-between">
                  <span>Service Premium</span>
                  <span className="text-white font-bold">{application.service_fee.toLocaleString()} DZD</span>
                </div>
                {application.extra_fee > 0 && (
                  <div className="flex justify-between">
                    <span>Translations & Extras</span>
                    <span className="text-white font-bold">{application.extra_fee.toLocaleString()} DZD</span>
                  </div>
                )}

                <div className="flex justify-between border-t border-slate-800 pt-3 text-[13px] font-black text-white">
                  <span>Total Due</span>
                  <span className="text-amber-400">{application.total_fee.toLocaleString()} DZD</span>
                </div>

                <div className="flex justify-between text-xs text-slate-400">
                  <span>Amount Deposited</span>
                  <span className="text-emerald-400 font-bold">{application.amount_paid.toLocaleString()} DZD</span>
                </div>
                
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Balance Pending</span>
                  <span className="text-red-400 font-bold">
                    {(application.total_fee - application.amount_paid).toLocaleString()} DZD
                  </span>
                </div>
              </div>
            </Card>

          </div>

        </div>
      )}

      {/* --- TAB CONTENT: CHECKLIST --- */}
      {activeTab === 'documents' && (
        <div className="animate-fadeIn max-w-4xl mx-auto">
          <DocumentChecklist 
            applicationId={application.id} 
            initialDocuments={application.documents_status || []} 
          />
        </div>
      )}

      {/* --- TAB CONTENT: PAYMENTS & CCP --- */}
      {activeTab === 'payments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          
          {/* Record payment slip form */}
          <div className="lg:col-span-1">
            <Card className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
              <h4 className="font-extrabold text-slate-800 text-[13px] uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="h-4.5 w-4.5 text-blue-500" />
                Record Cash/CCP Deposit
              </h4>

              <form onSubmit={handleRecordPayment} className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-slate-550 text-xs font-semibold">Payment Method</Label>
                  <select
                    value={payMethod}
                    onChange={e => setPayMethod(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs h-10 bg-slate-50 focus:bg-white outline-none"
                  >
                    <option value="CCP">CCP (Algerian Post)</option>
                    <option value="Edahabia">Edahabia Transfer</option>
                    <option value="Cash">Cash Deposit</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-slate-550 text-xs font-semibold">Deposit Amount (DZD) *</Label>
                  <Input 
                    type="number"
                    required
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    placeholder="e.g. 15000"
                    className="border-slate-200 rounded-xl text-xs h-10 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-slate-550 text-xs font-semibold">Reference Transaction ID / Slip #</Label>
                  <Input 
                    value={payRef}
                    onChange={e => setPayRef(e.target.value)}
                    placeholder="e.g. CCP-88229"
                    className="border-slate-200 rounded-xl text-xs h-10"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-slate-550 text-xs font-semibold">Slip Notes</Label>
                  <Input 
                    value={payNotes}
                    onChange={e => setPayNotes(e.target.value)}
                    placeholder="e.g. Post office slip scanned"
                    className="border-slate-200 rounded-xl text-xs h-10"
                  />
                </div>

                {payMethod === 'CCP' && (
                  <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl space-y-1 text-[10px] text-amber-800 leading-normal">
                    <span className="font-extrabold">CCP Scan Note:</span>
                    <p className="font-semibold">Simulated capture slip. Enforcing valid Reference ID matches Algerian Post CCP slips.</p>
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={submittingPayment}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs h-10 shadow-xs"
                >
                  {submittingPayment ? 'Saving Ledger...' : 'Record Payment slip'}
                </Button>
              </form>
            </Card>
          </div>

          {/* Ledger records logs */}
          <div className="lg:col-span-2">
            <Card className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
              <h4 className="font-extrabold text-slate-800 text-[13px] uppercase tracking-wider">
                Deposit Transactions Ledger ({payments.length})
              </h4>

              <div className="divide-y divide-slate-100">
                {payments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-6">No deposits have been logged for this application.</p>
                ) : (
                  payments.map((p) => (
                    <div key={p.id} className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 shrink-0">
                          <Landmark className="h-4.5 w-4.5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-extrabold text-[13px] text-slate-800">
                            {p.amount.toLocaleString()} DZD
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold flex gap-2.5 mt-0.5">
                            <span>Method: {p.payment_method}</span>
                            {p.reference_number && <span>Ref ID: {p.reference_number}</span>}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-400 font-bold block">
                          {p.payment_date ? format(new Date(p.payment_date), 'dd MMM yyyy') : 'N/A'}
                        </span>
                        {p.receipt_url && (
                          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-100 text-[9px] font-extrabold mt-1">
                            Slip Uploaded
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

        </div>
      )}

      {/* --- TAB CONTENT: TIMELINE AUDITS --- */}
      {activeTab === 'timeline' && (
        <div className="max-w-4xl mx-auto animate-fadeIn">
          <Card className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
            <h4 className="font-extrabold text-slate-800 text-[14px] mb-6 uppercase tracking-wider">
              Chronological Audit logs
            </h4>

            <div className="relative border-l border-slate-100 pl-6 ml-3 space-y-6">
              {timeline.map((evt) => (
                <div key={evt.id} className="relative group">
                  <div className="absolute -left-10 top-0.5 h-8 w-8 rounded-full border bg-slate-50 text-slate-650 flex items-center justify-center shrink-0 shadow-2xs z-2">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 justify-between">
                      <span className="font-bold text-slate-800 text-[13px]">{evt.title}</span>
                      <span className="text-[10px] text-slate-400 font-bold">
                        {evt.created_at ? format(new Date(evt.created_at), 'dd MMM hh:mm a') : 'N/A'}
                      </span>
                    </div>
                    {evt.description && (
                      <p className="text-slate-500 text-[11px] leading-relaxed font-semibold">
                        {evt.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

    </div>
  )
}
