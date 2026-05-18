'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { VisaType } from '@/types/visa'
import { createVisaApplication } from '@/app/actions/visa'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  User, CheckCircle2, ChevronRight, ChevronLeft, Search, 
  Settings, Users, DollarSign, Calendar, Landmark, Globe
} from 'lucide-react'

interface VisaWizardProps {
  visaTypes: VisaType[];
  clients: any[];
  employees: any[];
}

export function VisaWizard({ visaTypes, clients, employees }: VisaWizardProps) {
  const router = useRouter()
  
  // Steps: 0: Client & Group, 1: Visa Type, 2: Service Level, 3: Assignment & Dates, 4: Review & Submit
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Wizard State
  const [selectedClientId, setSelectedClientId] = useState('')
  const [clientSearch, setClientSearch] = useState('')
  const [groupName, setGroupName] = useState('')
  const [customClients, setCustomClients] = useState<string[]>([]) // linked client IDs
  
  const [selectedVisaTypeId, setSelectedVisaTypeId] = useState('')
  const [serviceLevel, setServiceLevel] = useState<'standard' | 'express' | 'vip'>('standard')
  const [extraFee, setExtraFee] = useState(0)
  
  const [assignedTo, setAssignedTo] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [appointmentDate, setAppointmentDate] = useState('')
  
  const [clientNotes, setClientNotes] = useState('')
  const [internalNotes, setInternalNotes] = useState('')

  // Simulated quick create client fields
  const [showQuickCreate, setShowQuickCreate] = useState(false)
  const [qcName, setQcName] = useState('')
  const [qcPhone, setQcPhone] = useState('')
  const [qcCNI, setQcCNI] = useState('')

  const [createdClients, setCreatedClients] = useState<any[]>([])

  // Combined client lists
  const allClients = useMemo(() => {
    return [...clients, ...createdClients]
  }, [clients, createdClients])

  // Filter clients
  const filteredClients = useMemo(() => {
    if (!clientSearch) return []
    return allClients.filter(c => 
      c.full_name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.phone?.includes(clientSearch)
    )
  }, [allClients, clientSearch])

  // Current selected entities
  const selectedClient = useMemo(() => {
    return allClients.find(c => c.id === selectedClientId)
  }, [allClients, selectedClientId])

  const selectedVisaType = useMemo(() => {
    return visaTypes.find(vt => vt.id === selectedVisaTypeId)
  }, [visaTypes, selectedVisaTypeId])

  // Financial auto-calculations
  const finances = useMemo(() => {
    if (!selectedVisaType) return { gov: 0, serv: 0, extra: 0, total: 0 }
    const gov = selectedVisaType.government_fee
    let serv = selectedVisaType.service_fee
    if (serviceLevel === 'express') serv = selectedVisaType.express_fee
    if (serviceLevel === 'vip') serv = selectedVisaType.express_fee + 10000 // VIP premium
    const ext = Number(extraFee) || 0
    return {
      gov,
      serv,
      extra: ext,
      total: gov + serv + ext
    }
  }, [selectedVisaType, serviceLevel, extraFee])

  // Quick Client Creation
  const handleQuickCreate = () => {
    if (!qcName || !qcPhone) return
    const newC = {
      id: `client-${Math.random().toString(36).substr(2, 9)}`,
      full_name: qcName,
      phone: qcPhone,
      cni_number: qcCNI || 'N/A'
    }
    setCreatedClients(prev => [...prev, newC])
    setSelectedClientId(newC.id)
    setClientSearch('')
    setShowQuickCreate(false)
    setQcName('')
    setQcPhone('')
    setQcCNI('')
  }

  // Group client additions
  const addLinkedClient = (cId: string) => {
    if (cId === selectedClientId) return
    if (!customClients.includes(cId)) {
      setCustomClients(prev => [...prev, cId])
    }
  }

  const removeLinkedClient = (cId: string) => {
    setCustomClients(prev => prev.filter(id => id !== cId))
  }

  const handleNext = () => {
    if (currentStep === 0 && !selectedClientId) {
      setError('Please select or create a primary client first.')
      return
    }
    if (currentStep === 1 && !selectedVisaTypeId) {
      setError('Please select a Visa Type for this application.')
      return
    }
    setError('')
    setCurrentStep(prev => prev + 1)
  }

  const handleBack = () => {
    setError('')
    setCurrentStep(prev => prev - 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    const payload = {
      client_id: selectedClientId,
      visa_type_id: selectedVisaTypeId,
      service_level: serviceLevel,
      assigned_to: assignedTo || undefined,
      target_application_date: targetDate || undefined,
      appointment_date: appointmentDate || undefined,
      group_name: groupName || undefined,
      extra_fee: Number(extraFee) || 0,
      client_notes: clientNotes || undefined,
      internal_notes: internalNotes || undefined,
      custom_clients: customClients
    }

    const result = await createVisaApplication(payload)
    if (result.success) {
      router.push('/dashboard/visa')
      router.refresh()
    } else {
      setError(result.error || 'Failed to initialize visa application.')
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-4xl mx-auto bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
      
      {/* 1. Steps Header indicator */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 text-xs font-bold text-slate-400">
        {['Client Selection', 'Visa Category', 'Tier & Extras', 'Dates & Staff', 'Submit'].map((lbl, idx) => (
          <div key={lbl} className="flex items-center gap-2">
            <span className={`h-6 w-6 rounded-full border flex items-center justify-center ${
              currentStep === idx ? 'bg-blue-600 text-white border-blue-600' :
              currentStep > idx ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-slate-50 border-slate-200'
            }`}>
              {currentStep > idx ? '✓' : idx + 1}
            </span>
            <span className={`hidden md:inline ${currentStep === idx ? 'text-slate-800' : ''}`}>{lbl}</span>
            {idx < 4 && <ChevronRight className="h-3.5 w-3.5 text-slate-300 hidden md:block" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* --- STEP 0: CLIENT SELECTION --- */}
      {currentStep === 0 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-800 text-[16px]">Select Primary Client</h3>
            <p className="text-[11px] text-slate-400 font-semibold uppercase">Search database or create a new transient client scan</p>
          </div>

          {selectedClient ? (
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-blue-100">
                  <AvatarFallback className="bg-blue-50 text-blue-600 font-bold">
                    {selectedClient.full_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800 text-[14px]">{selectedClient.full_name}</span>
                  <span className="text-[10px] text-slate-400 font-bold flex gap-3 mt-0.5">
                    <span>Phone: {selectedClient.phone || 'N/A'}</span>
                    <span>CNI Number: {selectedClient.cni_number || 'N/A'}</span>
                  </span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                onClick={() => setSelectedClientId('')}
                className="text-xs text-red-500 font-bold hover:bg-red-50 px-3 py-1 rounded-lg"
              >
                Change Client
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
                <Input 
                  placeholder="Type client name or phone..." 
                  value={clientSearch}
                  onChange={e => setClientSearch(e.target.value)}
                  className="pl-10 rounded-xl h-11 border-slate-200 text-slate-700 placeholder:text-slate-400 focus:bg-white"
                />
              </div>

              {/* Autocomplete list */}
              {filteredClients.length > 0 && (
                <div className="border border-slate-200/80 rounded-xl divide-y divide-slate-100 overflow-hidden bg-white max-h-[180px] overflow-y-auto shadow-2xs">
                  {filteredClients.map(c => (
                    <div 
                      key={c.id} 
                      onClick={() => {
                        setSelectedClientId(c.id)
                        setClientSearch('')
                      }}
                      className="p-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-xs font-semibold text-slate-655"
                    >
                      <span className="text-slate-800 font-bold">{c.full_name}</span>
                      <span className="text-slate-400">{c.phone}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick create drawer activator */}
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowQuickCreate(!showQuickCreate)}
                  className="border-dashed border-slate-350 text-slate-600 hover:bg-slate-50 font-bold rounded-xl text-xs h-10 w-full"
                >
                  {showQuickCreate ? 'Close Form' : '+ Quick-Add New Transient Client (Scan CNI)'}
                </Button>
              </div>

              {showQuickCreate && (
                <Card className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                  <h4 className="font-bold text-slate-700 text-xs uppercase">Transient Client Form</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-500">Full Name *</Label>
                      <Input value={qcName} onChange={e => setQcName(e.target.value)} placeholder="Achraf Amalou" className="bg-white border-slate-200 text-xs h-9 rounded-lg" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-500">Phone Number *</Label>
                      <Input value={qcPhone} onChange={e => setQcPhone(e.target.value)} placeholder="0550112233" className="bg-white border-slate-200 text-xs h-9 rounded-lg" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-500">National ID (CNI)</Label>
                      <Input value={qcCNI} onChange={e => setQcCNI(e.target.value)} placeholder="CNI-99882201" className="bg-white border-slate-200 text-xs h-9 rounded-lg" />
                    </div>
                  </div>
                  <Button size="sm" onClick={handleQuickCreate} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg px-4 py-1.5">
                    Save and Select Client
                  </Button>
                </Card>
              )}
            </div>
          )}

          {/* Group linking section */}
          {selectedClientId && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-800 text-[14px] flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-purple-600" />
                  Link to a Group Visa (Umrah / Families)
                </h3>
                <p className="text-[11px] text-slate-400">If this is a group/family submission, specify a group name and link multiple applicants together.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-slate-500 font-bold text-xs">Group / Family Name</Label>
                  <Input 
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                    placeholder="e.g. Belkadi Family Schengen"
                    className="border-slate-200 rounded-xl text-xs h-10 bg-slate-50 focus:bg-white"
                  />
                </div>

                {groupName && (
                  <div className="space-y-1">
                    <Label className="text-slate-500 font-bold text-xs">Add Other Applicants to this Group</Label>
                    <select
                      onChange={e => {
                        if (e.target.value) {
                          addLinkedClient(e.target.value)
                          e.target.value = ''
                        }
                      }}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs h-10 bg-slate-50 outline-none"
                    >
                      <option value="">-- Choose and add applicant --</option>
                      {allClients.filter(c => c.id !== selectedClientId).map(c => (
                        <option key={c.id} value={c.id}>{c.full_name} ({c.phone})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Render linked group clients */}
              {customClients.length > 0 && (
                <div className="p-3 bg-purple-50/30 border border-purple-100 rounded-xl space-y-2">
                  <span className="text-[10px] text-purple-700 font-extrabold uppercase tracking-wide">
                    Linked Group Applicants ({customClients.length})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {customClients.map(cId => {
                      const c = allClients.find(client => client.id === cId)
                      return (
                        <Badge key={cId} className="bg-purple-150 text-purple-900 border-purple-250 py-1 pl-2 pr-1 rounded flex items-center gap-1.5">
                          {c?.full_name}
                          <button 
                            type="button" 
                            onClick={() => removeLinkedClient(cId)}
                            className="h-4 w-4 rounded-full hover:bg-purple-200 text-purple-700 text-xs font-bold leading-none shrink-0"
                          >
                            ×
                          </button>
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* --- STEP 1: VISA TYPE SELECTION --- */}
      {currentStep === 1 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-800 text-[16px]">Select Visa Class & Country</h3>
            <p className="text-[11px] text-slate-400 font-semibold uppercase">Choose one of the configured defaults or customized services</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {visaTypes.map(vt => {
              const isSelected = selectedVisaTypeId === vt.id
              return (
                <Card 
                  key={vt.id}
                  onClick={() => setSelectedVisaTypeId(vt.id)}
                  className={`p-4 border rounded-xl flex flex-col justify-between cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50/20 ring-2 ring-blue-100' 
                      : 'border-slate-200 hover:border-slate-350 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-2xl leading-none">
                        {vt.destination_country === 'France' ? '🇫🇷' :
                         vt.destination_country === 'Spain' ? '🇪🇸' :
                         vt.destination_country === 'Turkey' ? '🇹🇷' :
                         vt.destination_country === 'Saudi Arabia' ? '🇸🇦' : '🌍'}
                      </span>
                      <Badge className="bg-slate-100 text-slate-700 text-[9px] py-0 px-1 border">
                        {vt.category}
                      </Badge>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 text-[13px]">{vt.name}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">{vt.destination_country}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                    <span>Gov: {vt.government_fee.toLocaleString()} DZD</span>
                    <span>Std: {vt.service_fee.toLocaleString()} DZD</span>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* --- STEP 2: TIER AND EXTRAS --- */}
      {currentStep === 2 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-800 text-[16px]">Processing Tier & Extra Options</h3>
            <p className="text-[11px] text-slate-400 font-semibold uppercase">Apply express premiums or translation/courier service fees</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Standard Tier */}
            <Card 
              onClick={() => setServiceLevel('standard')}
              className={`p-5 border rounded-xl cursor-pointer flex flex-col justify-between transition-all ${
                serviceLevel === 'standard' ? 'border-blue-500 bg-blue-50/20 ring-2 ring-blue-100' : 'border-slate-200'
              }`}
            >
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase">Standard Tier</span>
                <h4 className="font-bold text-slate-800 text-[14px]">Regular Processing</h4>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Embassy timeline queue. Standard service fee applies.
                </p>
              </div>
              <span className="text-xs font-extrabold text-slate-800 mt-4">Standard Fee</span>
            </Card>

            {/* Express Tier */}
            <Card 
              onClick={() => setServiceLevel('express')}
              className={`p-5 border rounded-xl cursor-pointer flex flex-col justify-between transition-all ${
                serviceLevel === 'express' ? 'border-blue-500 bg-blue-50/20 ring-2 ring-blue-100' : 'border-slate-200'
              }`}
            >
              <div className="space-y-2">
                <span className="text-[10px] text-amber-500 font-extrabold uppercase">Express Premium</span>
                <h4 className="font-bold text-slate-800 text-[14px]">Priority Action</h4>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Priority appointment book matching and urgent tracking.
                </p>
              </div>
              <span className="text-xs font-extrabold text-slate-800 mt-4">Express Fee Applied</span>
            </Card>

            {/* VIP Tier */}
            <Card 
              onClick={() => setServiceLevel('vip')}
              className={`p-5 border rounded-xl cursor-pointer flex flex-col justify-between transition-all ${
                serviceLevel === 'vip' ? 'border-blue-500 bg-blue-50/20 ring-2 ring-blue-100' : 'border-slate-200'
              }`}
            >
              <div className="space-y-2">
                <span className="text-[10px] text-purple-600 font-extrabold uppercase">VIP Concierge</span>
                <h4 className="font-bold text-slate-800 text-[14px]">Home Courier & BLS Lounge</h4>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Full translation extra packages, document home pickup, and courier.
                </p>
              </div>
              <span className="text-xs font-extrabold text-slate-800 mt-4">Express + 10,000 DZD</span>
            </Card>
          </div>

          {/* Extra fee inputs */}
          <div className="space-y-4 pt-4 border-t border-slate-100 max-w-md">
            <div className="space-y-1">
              <Label className="text-slate-550 text-xs font-bold">Extra Fees (DZD) - e.g. Translation / Couriers</Label>
              <Input 
                type="number"
                value={extraFee || ''}
                onChange={e => setExtraFee(Number(e.target.value) || 0)}
                placeholder="3000"
                className="border-slate-200 rounded-xl text-xs h-10 bg-slate-50 focus:bg-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* --- STEP 3: STAFF & DATES --- */}
      {currentStep === 3 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-800 text-[16px]">Assignment, Timeline & Appointments</h3>
            <p className="text-[11px] text-slate-400 font-semibold uppercase">Choose handling staff agent and schedule embassy date</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Handling employee */}
            <div className="space-y-1 flex flex-col">
              <Label className="text-slate-500 font-bold text-xs">Assign Handling Agent</Label>
              <select
                value={assignedTo}
                onChange={e => setAssignedTo(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs h-10 bg-slate-50 outline-none"
              >
                <option value="">-- Select Employee --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                ))}
              </select>
            </div>

            {/* Target Entry Date */}
            <div className="space-y-1 flex flex-col">
              <Label className="text-slate-500 font-bold text-xs">Target Application Date</Label>
              <Input 
                type="date"
                value={targetDate}
                onChange={e => setTargetDate(e.target.value)}
                className="border-slate-200 rounded-xl text-xs h-10 bg-slate-50 outline-none"
              />
            </div>

            {/* VFS/BLS Appointment Date */}
            <div className="space-y-1 flex flex-col">
              <Label className="text-slate-500 font-bold text-xs">Embassy Biometric Appointment</Label>
              <Input 
                type="datetime-local"
                value={appointmentDate}
                onChange={e => setAppointmentDate(e.target.value)}
                className="border-slate-200 rounded-xl text-xs h-10 bg-slate-50 outline-none"
              />
            </div>

          </div>

          {/* Special Notes / Ramadan business alerts */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-slate-500 font-bold text-xs">Client Requirements / Special Instructions</Label>
                <textarea
                  value={clientNotes}
                  onChange={e => setClientNotes(e.target.value)}
                  placeholder="Need family rooms coordinated, Ramadan special travel dates requested."
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs min-h-[80px] bg-slate-50 outline-none focus:bg-white focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-slate-500 font-bold text-xs">Internal Checklist Notes</Label>
                <textarea
                  value={internalNotes}
                  onChange={e => setInternalNotes(e.target.value)}
                  placeholder="Awaiting marriage certif translation. Check if child passport needs tutor signature."
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs min-h-[80px] bg-slate-50 outline-none focus:bg-white focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- STEP 4: REVIEW & SUBMIT --- */}
      {currentStep === 4 && selectedClient && selectedVisaType && (
        <div className="space-y-6 animate-fadeIn">
          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-800 text-[16px]">Review Visa Specifications</h3>
            <p className="text-[11px] text-slate-400 font-semibold uppercase">Verify fees and linked group details before initializing</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Overview specs */}
            <Card className="p-4 bg-slate-50 border rounded-xl space-y-3 col-span-2">
              <h4 className="font-bold text-slate-700 text-xs uppercase">Application Overview</h4>
              
              <div className="grid grid-cols-2 gap-3 text-[12px]">
                <div>
                  <span className="text-slate-400">Applicant:</span>
                  <p className="text-slate-800 font-bold mt-0.5">{selectedClient.full_name}</p>
                </div>
                <div>
                  <span className="text-slate-400">Visa Class:</span>
                  <p className="text-slate-800 font-bold mt-0.5">{selectedVisaType.name}</p>
                </div>
                <div>
                  <span className="text-slate-400">Service Level:</span>
                  <p className="text-amber-600 font-bold mt-0.5 capitalize">{serviceLevel}</p>
                </div>
                <div>
                  <span className="text-slate-400">Handling Agent:</span>
                  <p className="text-slate-800 font-bold mt-0.5">
                    {employees.find(emp => emp.id === assignedTo)?.full_name || 'Not Assigned'}
                  </p>
                </div>
              </div>

              {/* Group info if set */}
              {groupName && (
                <div className="mt-3 pt-3 border-t border-slate-200 text-xs">
                  <span className="text-slate-400">Group Name:</span>
                  <p className="font-bold text-purple-700">{groupName}</p>
                  {customClients.length > 0 && (
                    <p className="text-[10px] text-slate-500 font-semibold mt-1">
                      Includes {customClients.length} other applicants.
                    </p>
                  )}
                </div>
              )}
            </Card>

            {/* Financial summaries */}
            <Card className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-white space-y-4">
              <h4 className="font-bold text-amber-400 text-xs uppercase">Financial Breakdown</h4>
              
              <div className="space-y-2 text-[11px] font-semibold text-slate-350">
                <div className="flex justify-between">
                  <span>Government Fee</span>
                  <span>{finances.gov.toLocaleString()} DZD</span>
                </div>
                <div className="flex justify-between">
                  <span>Standard Service Fee</span>
                  <span>{finances.serv.toLocaleString()} DZD</span>
                </div>
                {finances.extra > 0 && (
                  <div className="flex justify-between">
                    <span>Extras & Translations</span>
                    <span>{finances.extra.toLocaleString()} DZD</span>
                  </div>
                )}
                
                <div className="flex justify-between border-t border-slate-800 pt-3 text-[13px] font-black text-white">
                  <span>Grand Total</span>
                  <span className="text-amber-400">{finances.total.toLocaleString()} DZD</span>
                </div>
              </div>
            </Card>

          </div>
        </div>
      )}

      {/* --- FOOTER BUTTONS CONTROLS --- */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        {currentStep > 0 ? (
          <Button 
            variant="outline" 
            onClick={handleBack}
            className="border-slate-200 hover:bg-slate-50 text-slate-655 font-bold rounded-xl text-xs h-10 px-4"
          >
            <ChevronLeft className="h-4 w-4 mr-1.5" />
            Back Step
          </Button>
        ) : (
          <div />
        )}

        {currentStep < 4 ? (
          <Button 
            onClick={handleNext}
            className="bg-blue-650 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs h-10 px-5"
          >
            Next Step
            <ChevronRight className="h-4 w-4 ml-1.5" />
          </Button>
        ) : (
          <Button 
            disabled={loading}
            onClick={handleSubmit}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs h-10 px-6"
          >
            {loading ? 'Initializing Process...' : 'Create Visa Applications'}
          </Button>
        )}
      </div>

    </Card>
  )
}
