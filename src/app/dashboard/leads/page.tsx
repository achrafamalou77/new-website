'use client'

import React, { useState, useEffect } from 'react'
import { 
  Flame, Sun, Snowflake, MessageSquare, Plus, X, Bot, 
  ArrowUpRight, Users, Check, Phone, PlusCircle, Calendar, 
  Trash2, Send, Clock, UserCheck, CheckCircle2, ChevronRight,
  TrendingUp, BarChart3, AlertCircle, Globe, Car
} from 'lucide-react'
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon'
import { MessengerIcon } from '@/components/icons/MessengerIcon'
import { InstagramIcon } from '@/components/icons/InstagramIcon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'

interface LeadActivity {
  id: string
  action: string
  timestamp: string
  user: string
}

interface LeadMessage {
  id: string
  sender: 'user' | 'client' | 'ai'
  text: string
  timestamp: string
}

interface Lead {
  id: string
  name: string
  phone: string
  carInterest: string
  budget: number
  source: 'whatsapp' | 'instagram' | 'facebook' | 'walk_in' | 'phone' | 'website'
  score: 'HOT' | 'WARM' | 'COLD'
  stage: 'new' | 'contacted' | 'test_drive' | 'negotiation' | 'won' | 'lost'
  assignedTo: string
  lastContacted: string
  notes?: string
  activityLog: LeadActivity[]
  messages: LeadMessage[]
}

const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead-1',
    name: 'Yacine Bouazza',
    phone: '+213 550 44 88 12',
    carInterest: 'Toyota Tucson 2024 Hybrid',
    budget: 6800000,
    source: 'whatsapp',
    score: 'HOT',
    stage: 'new',
    assignedTo: 'Achraf Amalou',
    lastContacted: '2 hours ago',
    notes: 'Very interested in Hybrid variants. Asks if there is a 30% down payment plan matching BADR bank networks.',
    activityLog: [
      { id: 'act-1-1', action: 'Lead captured via WhatsApp Chatbot', timestamp: '2026-05-18 10:15', user: 'AI Assistant' },
      { id: 'act-1-2', action: 'Auto-qualified as HOT Lead', timestamp: '2026-05-18 10:17', user: 'AI Assistant' }
    ],
    messages: [
      { id: 'msg-1-1', sender: 'client', text: 'Salam, is the Toyota Tucson 2024 in stock?', timestamp: '10:14 AM' },
      { id: 'msg-1-2', sender: 'ai', text: 'Waalikoum Salam! Yes, we have 2 units of the Tucson 2024 Hybrid available in Polar White and Phantom Black. Would you like to check the price or financing?', timestamp: '10:15 AM' },
      { id: 'msg-1-3', sender: 'client', text: 'Yes, what are the bank financing rates for CCP or BADR Bank? Can I do a 30% down payment?', timestamp: '10:17 AM' }
    ]
  },
  {
    id: 'lead-2',
    name: 'Amel Mansouri',
    phone: '+213 661 99 22 34',
    carInterest: 'Hyundai Creta 2023 Certified',
    budget: 4200000,
    source: 'instagram',
    score: 'WARM',
    stage: 'contacted',
    assignedTo: 'Amine Belkadi',
    lastContacted: '1 day ago',
    notes: 'Negotiating a trade-in option for her older 2018 Kia Picanto.',
    activityLog: [
      { id: 'act-2-1', action: 'Lead captured from Instagram DM ad', timestamp: '2026-05-17 14:20', user: 'Marketing' },
      { id: 'act-2-2', action: 'Stage updated to CONTACTED', timestamp: '2026-05-17 16:40', user: 'Amine Belkadi' }
    ],
    messages: [
      { id: 'msg-2-1', sender: 'client', text: 'Do you accept trade-in (reprise) for Kia Picanto?', timestamp: '2:19 PM' },
      { id: 'msg-2-2', sender: 'user', text: 'Hello! Yes, we offer trade-in assessments. Please bring the Picanto by our showroom in Algiers for our mechanics to inspect and value it.', timestamp: '4:40 PM' }
    ]
  },
  {
    id: 'lead-3',
    name: 'Kamel Rezgui',
    phone: '+213 770 12 34 56',
    carInterest: 'Audi A4 2.0 TDI S-Line',
    budget: 9200000,
    source: 'walk_in',
    score: 'HOT',
    stage: 'test_drive',
    assignedTo: 'Achraf Amalou',
    lastContacted: '3 hours ago',
    notes: 'Test drive scheduled and completed. Customer was extremely happy with performance, s-line trim level matches his budget.',
    activityLog: [
      { id: 'act-3-1', action: 'Lead created manually via Walk-in', timestamp: '2026-05-15 11:00', user: 'Achraf Amalou' },
      { id: 'act-3-2', action: 'Test Drive Scheduled for Audi A4', timestamp: '2026-05-16 10:00', user: 'Achraf Amalou' },
      { id: 'act-3-3', action: 'Moved to TEST DRIVE column', timestamp: '2026-05-16 11:30', user: 'Achraf Amalou' }
    ],
    messages: [
      { id: 'msg-3-1', sender: 'client', text: 'The Audi felt amazing. Let me review the final CCP wire transfer details.', timestamp: 'Yesterday' }
    ]
  },
  {
    id: 'lead-4',
    name: 'Meriem Haddad',
    phone: '+213 555 77 11 99',
    carInterest: 'Seat Ibiza 2021 Highline',
    budget: 3100000,
    source: 'website',
    score: 'COLD',
    stage: 'negotiation',
    assignedTo: 'Amine Belkadi',
    lastContacted: '3 days ago',
    notes: 'Requesting discount. Original price is 3.2M, she bid 3.0M maximum. Waiting on manager appraisal.',
    activityLog: [
      { id: 'act-4-1', action: 'Lead captured from Website finance calculator', timestamp: '2026-05-12 09:30', user: 'Website' },
      { id: 'act-4-2', action: 'Moved to NEGOTIATION column', timestamp: '2026-05-14 15:20', user: 'Amine Belkadi' }
    ],
    messages: [
      { id: 'msg-4-1', sender: 'client', text: 'My budget maximum is 3,000,000 DZD cash. Please check if we can close it.', timestamp: 'May 14' }
    ]
  }
]

export default function LeadsBoardPage() {
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  
  // Modals / forms state
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isTestDriveOpen, setIsTestDriveOpen] = useState(false)
  const [newMessageText, setNewMessageText] = useState('')

  // New Lead Form State
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newCar, setNewCar] = useState('')
  const [newBudget, setNewBudget] = useState('')
  const [newScore, setNewScore] = useState<'HOT' | 'WARM' | 'COLD'>('WARM')
  const [newSource, setNewSource] = useState<'whatsapp' | 'instagram' | 'facebook' | 'walk_in' | 'phone' | 'website'>('website')
  const [newNotes, setNewNotes] = useState('')

  // Test Drive Form State
  const [tdDate, setTdDate] = useState('')
  const [tdTime, setTdTime] = useState('')
  const [tdEmployee, setTdEmployee] = useState('Achraf Amalou')

  // Dragging states
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null)

  // Sync selected lead when leads state updates
  useEffect(() => {
    if (selectedLead) {
      const updated = leads.find(l => l.id === selectedLead.id)
      if (updated) setSelectedLead(updated)
    }
  }, [leads, selectedLead])

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedLeadId(id)
    e.dataTransfer.setData('text/plain', id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, newStage: Lead['stage']) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain') || draggedLeadId
    if (!id) return

    moveLeadStage(id, newStage)
    setDraggedLeadId(null)
  }

  const moveLeadStage = (id: string, newStage: Lead['stage']) => {
    setLeads(prev => prev.map(l => {
      if (l.id === id) {
        if (l.stage === newStage) return l
        
        // Log transition in activity
        const newAct: LeadActivity = {
          id: `act-move-${Date.now()}`,
          action: `Moved stage from ${l.stage.toUpperCase()} to ${newStage.toUpperCase()}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          user: 'Achraf Amalou'
        }
        
        return {
          ...l,
          stage: newStage,
          activityLog: [...l.activityLog, newAct]
        }
      }
      return l
    }))

    // Audio sound effect feedback
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-120.wav')
      audio.volume = 0.08
      audio.play().catch(() => {})
    } catch (e) {}
  }

  // Handle Quick Create Lead
  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !newPhone.trim()) return

    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      name: newName,
      phone: newPhone,
      carInterest: newCar || 'General Showroom Inquiry',
      budget: parseInt(newBudget) || 0,
      source: newSource,
      score: newScore,
      stage: 'new',
      assignedTo: 'Achraf Amalou',
      lastContacted: 'Just now',
      notes: newNotes,
      activityLog: [
        { id: `act-${Date.now()}`, action: 'Lead created manually via dashboard', timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16), user: 'Achraf Amalou' }
      ],
      messages: []
    }

    setLeads(prev => [newLead, ...prev])
    setIsAddOpen(false)

    // Reset Form
    setNewName('')
    setNewPhone('')
    setNewCar('')
    setNewBudget('')
    setNewScore('WARM')
    setNewSource('website')
    setNewNotes('')
  }

  // Handle Schedule Test Drive
  const handleScheduleTestDrive = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLead || !tdDate || !tdTime) return

    setLeads(prev => prev.map(l => {
      if (l.id === selectedLead.id) {
        const newAct: LeadActivity = {
          id: `act-td-${Date.now()}`,
          action: `Scheduled Test Drive on ${tdDate} at ${tdTime} with ${tdEmployee}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          user: 'Achraf Amalou'
        }

        return {
          ...l,
          stage: 'test_drive',
          assignedTo: tdEmployee,
          activityLog: [...l.activityLog, newAct]
        }
      }
      return l
    }))

    setIsTestDriveOpen(false)
    setTdDate('')
    setTdTime('')
  }

  // Send WhatsApp or mark lost actions
  const markAsLost = (id: string) => {
    moveLeadStage(id, 'lost')
  }

  const sendWhatsApp = (lead: Lead) => {
    const text = encodeURIComponent(`Bonjour ${lead.name}, c'est Achraf de l'Auto Showroom. Nous avons reçu votre intérêt pour le véhicule : ${lead.carInterest}.`)
    const url = `https://web.whatsapp.com/send?phone=${lead.phone.replace(/[^0-9]/g, '')}&text=${text}`
    window.open(url, '_blank')
    
    // Log WhatsApp action
    setLeads(prev => prev.map(l => {
      if (l.id === lead.id) {
        return {
          ...l,
          activityLog: [...l.activityLog, {
            id: `act-wa-${Date.now()}`,
            action: 'Sent WhatsApp template message',
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
            user: 'Achraf Amalou'
          }]
        }
      }
      return l
    }))
  }

  // Send custom client message inside detail sidebar
  const handleSendMessage = () => {
    if (!selectedLead || !newMessageText.trim()) return

    const newMsg: LeadMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: newMessageText,
      timestamp: 'Just now'
    }

    setLeads(prev => prev.map(l => {
      if (l.id === selectedLead.id) {
        return {
          ...l,
          messages: [...l.messages, newMsg],
          lastContacted: 'Just now'
        }
      }
      return l
    }))

    setNewMessageText('')

    // Auto simulated reply from lead after 1.5 seconds!
    setTimeout(() => {
      setLeads(prev => prev.map(l => {
        if (l.id === selectedLead.id) {
          const autoReply: LeadMessage = {
            id: `msg-reply-${Date.now()}`,
            sender: 'client',
            text: `Perfect! Thank you for the response, I'll review it and get back to you soon.`,
            timestamp: 'Just now'
          }
          return {
            ...l,
            messages: [...l.messages, autoReply]
          }
        }
        return l
      }))
    }, 1500)
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'whatsapp': return <WhatsAppIcon className="h-4 w-4 shrink-0 text-emerald-500" />
      case 'facebook': return <MessengerIcon className="h-4 w-4 shrink-0 text-blue-500" />
      case 'instagram': return <InstagramIcon className="h-4 w-4 shrink-0 text-pink-500" />
      case 'walk_in': return <Users className="h-4 w-4 shrink-0 text-slate-500" />
      case 'phone': return <Phone className="h-4 w-4 shrink-0 text-indigo-500" />
      default: return <Globe className="h-4 w-4 shrink-0 text-sky-500" />
    }
  }

  const getScoreBadge = (score: 'HOT' | 'WARM' | 'COLD') => {
    switch (score) {
      case 'HOT':
        return <span className="inline-flex items-center gap-1 text-[9px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full"><Flame className="h-3 w-3 animate-pulse" /> HOT</span>
      case 'WARM':
        return <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full"><Sun className="h-3 w-3" /> WARM</span>
      default:
        return <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full"><Snowflake className="h-3 w-3" /> COLD</span>
    }
  }

  const columns = [
    { id: 'new' as const, label: 'NEW', color: 'border-t-slate-400', bg: 'bg-slate-50 text-slate-700' },
    { id: 'contacted' as const, label: 'CONTACTED', color: 'border-t-indigo-500', bg: 'bg-indigo-50/50 text-indigo-700' },
    { id: 'test_drive' as const, label: 'TEST DRIVE', color: 'border-t-purple-500', bg: 'bg-purple-50/50 text-purple-700' },
    { id: 'negotiation' as const, label: 'NEGOTIATION', color: 'border-t-amber-500', bg: 'bg-amber-50/50 text-amber-700' },
    { id: 'won' as const, label: 'CLOSED WON', color: 'border-t-emerald-500', bg: 'bg-emerald-50 text-emerald-700' },
    { id: 'lost' as const, label: 'CLOSED LOST', color: 'border-t-red-500', bg: 'bg-red-50 text-red-700' }
  ]

  return (
    <div className="p-6 space-y-6 font-geist text-left bg-[#f4f5f7] h-[calc(100vh-64px)] overflow-hidden flex flex-col relative select-none">
      
      {/* Top Welcome Title Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            🔥 Car Showroom Leads Board
          </h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">Manage showroom client acquisitions, track active interest, and coordinate test drives.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Quick Metrics display */}
          <div className="hidden md:flex gap-4 p-2.5 bg-slate-50 border rounded-xl items-center text-xs">
            <div className="flex items-center gap-1.5 px-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <div className="text-left leading-none">
                <span className="text-[9px] font-black text-slate-400 uppercase">WON Deals</span>
                <div className="text-[11px] font-bold text-slate-800 mt-0.5">{leads.filter(l => l.stage === 'won').length} Sales</div>
              </div>
            </div>
            <div className="w-[1px] bg-slate-200 h-6" />
            <div className="flex items-center gap-1.5 px-2">
              <BarChart3 className="h-4 w-4 text-indigo-500" />
              <div className="text-left leading-none">
                <span className="text-[9px] font-black text-slate-400 uppercase">Pipe Value</span>
                <div className="text-[11px] font-bold text-slate-800 mt-0.5">
                  {leads.reduce((a, b) => a + b.budget, 0).toLocaleString()} DZD
                </div>
              </div>
            </div>
          </div>

          <Button 
            onClick={() => setIsAddOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold gap-2 shadow-xs active:scale-95 transition"
          >
            <Plus className="h-4 w-4" /> Add Lead
          </Button>
        </div>
      </div>

      {/* Kanban Grid */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden flex gap-5 pb-2 scrollbar-thin">
        {columns.map(col => {
          const colLeads = leads.filter(l => l.stage === col.id)

          return (
            <div 
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className="w-[280px] shrink-0 bg-white border border-slate-200/80 rounded-2xl flex flex-col h-full shadow-xs max-h-full border-t-[4px] relative"
              style={{ borderColor: col.id === 'won' ? '#10b981' : col.id === 'lost' ? '#ef4444' : '' }}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between border-b border-slate-100 p-4 shrink-0">
                <h3 className="text-xs font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${col.bg}`}>
                    {col.label}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">
                    {colLeads.length}
                  </span>
                </h3>
                
                <span className="text-[10px] font-bold text-slate-400">
                  {(colLeads.reduce((a, b) => a + b.budget, 0) / 1000000).toFixed(1)}M DZD
                </span>
              </div>

              {/* Cards Container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 max-h-full scrollbar-thin">
                {colLeads.map(lead => {
                  return (
                    <div 
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      onClick={() => setSelectedLead(lead)}
                      className={cn(
                        "bg-slate-50/50 hover:bg-slate-50 border border-slate-200/60 hover:border-slate-350 rounded-xl p-3.5 shadow-xs hover:shadow-sm transition-all duration-200 cursor-pointer text-left relative group",
                        draggedLeadId === lead.id && "opacity-40 scale-95"
                      )}
                    >
                      {/* Top platform and score */}
                      <div className="flex items-center justify-between">
                        {getScoreBadge(lead.score)}
                        <span className="h-6 w-6 rounded-lg bg-white border border-slate-100 shadow-xs flex items-center justify-center">
                          {getSourceIcon(lead.source)}
                        </span>
                      </div>

                      {/* Header details */}
                      <div className="mt-3.5 space-y-1">
                        <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition truncate">
                          {lead.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-semibold">{lead.phone}</p>
                      </div>

                      {/* Interest & Budget banner */}
                      <div className="mt-4 p-2 bg-white rounded-lg border border-slate-150 space-y-1">
                        <div className="flex items-center gap-1 text-[9px] font-bold text-slate-550 text-slate-500">
                          <Car className="h-3 w-3 shrink-0 text-slate-400" />
                          <span className="truncate">{lead.carInterest}</span>
                        </div>
                        <div className="flex items-center justify-between text-[9px] pt-1 border-t border-slate-100 font-bold">
                          <span className="text-slate-400 uppercase tracking-wider">Est. Budget</span>
                          <span className="text-slate-700">{(lead.budget).toLocaleString()} DZD</span>
                        </div>
                      </div>

                      {/* quick icons / indicators */}
                      <div className="mt-3 flex items-center justify-between text-[9px] font-semibold text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {lead.lastContacted}
                        </span>
                        {lead.messages.length > 0 && (
                          <span className="flex items-center gap-0.5 text-indigo-650 bg-indigo-50 text-indigo-600 px-1.5 py-0.2 rounded font-bold">
                            <MessageSquare className="h-2.5 w-2.5" /> {lead.messages.length}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}

                {colLeads.length === 0 && (
                  <div className="h-36 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                    <span className="text-[10px] font-bold">No leads in this stage</span>
                    <span className="text-[9px] mt-0.5 leading-relaxed">Drag cards from other columns or add a new prospect.</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* DETAILED SIDE PANEL DRAWER */}
      {selectedLead && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white border-l border-slate-200/80 shadow-2xl z-30 flex flex-col h-full animate-slideIn">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h3 className="text-sm font-bold tracking-tight">{selectedLead.name}</h3>
                {getScoreBadge(selectedLead.score)}
              </div>
              <p className="text-[10px] text-indigo-300 font-semibold">{selectedLead.phone} | Assigned to {selectedLead.assignedTo}</p>
            </div>
            <button 
              onClick={() => setSelectedLead(null)}
              className="h-8 w-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Core Content scrollable split panes */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
            
            {/* Quick Actions Action Sheet */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Quick Actions</span>
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  onClick={() => sendWhatsApp(selectedLead)}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 rounded-xl text-[10px] font-bold py-2 gap-1.5 shadow-none shrink-0"
                >
                  <WhatsAppIcon className="h-3.5 w-3.5" /> WhatsApp
                </Button>
                <Button 
                  onClick={() => setIsTestDriveOpen(true)}
                  className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-100 rounded-xl text-[10px] font-bold py-2 gap-1.5 shadow-none shrink-0"
                >
                  <Calendar className="h-3.5 w-3.5" /> Test Drive
                </Button>
                <Button 
                  onClick={() => markAsLost(selectedLead.id)}
                  className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 rounded-xl text-[10px] font-bold py-2 gap-1.5 shadow-none shrink-0"
                  disabled={selectedLead.stage === 'lost'}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Mark Lost
                </Button>
              </div>
            </div>

            {/* General Lead Details */}
            <div className="bg-slate-50 border rounded-2xl p-4 space-y-3.5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Lead Opportunity Specs</span>
              
              <div className="grid grid-cols-2 gap-y-3 text-xs">
                <div className="flex flex-col text-left">
                  <span className="text-[9px] font-semibold text-slate-400">Car Interest</span>
                  <span className="font-bold text-slate-700 mt-0.5">{selectedLead.carInterest}</span>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[9px] font-semibold text-slate-400">Estimated Budget</span>
                  <span className="font-bold text-slate-700 mt-0.5">{(selectedLead.budget).toLocaleString()} DZD</span>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[9px] font-semibold text-slate-400">Lead Source</span>
                  <span className="font-bold text-slate-700 mt-0.5 capitalize flex items-center gap-1">
                    {getSourceIcon(selectedLead.source)} {selectedLead.source}
                  </span>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[9px] font-semibold text-slate-400">Status Stage</span>
                  <span className="font-bold text-indigo-650 bg-indigo-50 border border-indigo-100 text-indigo-600 px-2 py-0.2 rounded-full mt-0.5 uppercase tracking-wide inline-block max-w-max text-[9px]">
                    {selectedLead.stage.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {selectedLead.notes && (
                <div className="pt-3.5 border-t border-slate-200/60 text-xs">
                  <span className="text-[9px] font-semibold text-slate-400 block mb-1">Deal Notes</span>
                  <p className="text-[11px] text-slate-550 text-slate-500 font-medium leading-relaxed bg-white border p-2.5 rounded-xl">{selectedLead.notes}</p>
                </div>
              )}
            </div>

            {/* Simulated Live Messages panel */}
            <div className="space-y-2 flex flex-col h-[280px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Customer Chat Stream</span>
              
              <div className="flex-1 bg-slate-50 border rounded-2xl p-4 overflow-y-auto space-y-3.5 scrollbar-thin">
                {selectedLead.messages.map(msg => {
                  const isUser = msg.sender === 'user'
                  const isAi = msg.sender === 'ai'

                  return (
                    <div 
                      key={msg.id}
                      className={cn(
                        "flex flex-col text-xs leading-relaxed max-w-[80%]",
                        isUser ? "ml-auto text-right items-end" : "mr-auto text-left items-start"
                      )}
                    >
                      <span className="text-[8px] font-bold text-slate-400 mb-0.5">
                        {isUser ? 'Achraf (You)' : isAi ? 'AI Salesperson' : selectedLead.name}
                      </span>
                      <div className={cn(
                        "p-2.5 rounded-xl border font-medium text-[11px]",
                        isUser 
                          ? "bg-slate-900 border-slate-950 text-white rounded-br-none" 
                          : isAi 
                          ? "bg-indigo-50 border-indigo-100 text-indigo-755 text-indigo-600 rounded-bl-none" 
                          : "bg-white border-slate-200/80 text-slate-700 rounded-bl-none"
                      )}>
                        {msg.text}
                      </div>
                      <span className="text-[8px] text-slate-400 mt-0.5">{msg.timestamp}</span>
                    </div>
                  )
                })}

                {selectedLead.messages.length === 0 && (
                  <div className="text-xs text-slate-400 text-center py-12">No messages logged. Click send to initiate chat history.</div>
                )}
              </div>

              {/* Chat Input */}
              <div className="flex gap-2">
                <Input 
                  value={newMessageText} 
                  onChange={e => setNewMessageText(e.target.value)}
                  placeholder="Type a WhatsApp response..." 
                  className="rounded-xl border-slate-200 text-xs"
                  onKeyDown={e => { if (e.key === 'Enter') handleSendMessage() }}
                />
                <Button 
                  onClick={handleSendMessage}
                  className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-none"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Detailed Activity Logs */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Deal Activity Log</span>
              <div className="bg-slate-50 border rounded-2xl p-4 space-y-4">
                {selectedLead.activityLog.map(act => (
                  <div key={act.id} className="flex gap-3 text-xs text-left items-start relative pb-1">
                    <div className="h-6 w-6 rounded-full bg-white border shadow-xs flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-slate-700 leading-tight">{act.action}</p>
                      <p className="text-[9px] text-slate-400 font-semibold">Done by {act.user} | {act.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* QUICK ADD LEAD MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-40 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-scaleIn text-left">
            <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold tracking-tight flex items-center gap-1.5"><Plus className="h-4.5 w-4.5 text-indigo-400" /> Create Showroom Lead</h3>
                <p className="text-[10px] text-slate-400 font-semibold">Pre-load a prospect card into your NEW active pipeline column.</p>
              </div>
              <button 
                onClick={() => setIsAddOpen(false)}
                className="h-8 w-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Client Full Name</Label>
                  <Input value={newName} onChange={e => setNewName(e.target.value)} required placeholder="Ali Belkacem" className="rounded-xl border-slate-200" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Phone Number (+213)</Label>
                  <Input value={newPhone} onChange={e => setNewPhone(e.target.value)} required placeholder="+213 555 12 34 56" className="rounded-xl border-slate-200" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Vehicle of Interest</Label>
                  <Input value={newCar} onChange={e => setNewCar(e.target.value)} placeholder="Kia Sportage 2023" className="rounded-xl border-slate-200" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Client Budget (DZD)</Label>
                  <Input value={newBudget} onChange={e => setNewBudget(e.target.value)} type="number" placeholder="5,200,000" className="rounded-xl border-slate-200" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Acquisition Source</Label>
                  <select 
                    value={newSource} 
                    onChange={e => setNewSource(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-700 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="whatsapp">WhatsApp dm</option>
                    <option value="instagram">Instagram DM</option>
                    <option value="facebook">Facebook Msg</option>
                    <option value="walk_in">Showroom Walk-in</option>
                    <option value="phone">Direct Call</option>
                    <option value="website">Public Web Portal</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Prospect Score Rating</Label>
                  <select 
                    value={newScore} 
                    onChange={e => setNewScore(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-700 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="HOT">🔥 HOT Opportunity</option>
                    <option value="WARM">☀️ WARM discussion</option>
                    <option value="COLD">❄️ COLD archived</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Private Deal Notes</Label>
                <Textarea value={newNotes} onChange={(e: any) => setNewNotes(e.target.value)} placeholder="Enter details about client specifications or preferences..." className="rounded-xl border-slate-200 min-h-[80px]" />
              </div>

              <Button 
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3 font-bold text-xs"
              >
                Save Prospect to Pipeline
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* SCHEDULE TEST DRIVE MODAL */}
      {isTestDriveOpen && selectedLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-scaleIn text-left">
            <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold tracking-tight flex items-center gap-1.5"><Calendar className="h-4.5 w-4.5 text-purple-400" /> Plan Test Drive Appointment</h3>
                <p className="text-[10px] text-slate-400 font-semibold">Assign a vehicle time slot and log to CRM calendar.</p>
              </div>
              <button 
                onClick={() => setIsTestDriveOpen(false)}
                className="h-8 w-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleScheduleTestDrive} className="p-6 space-y-4">
              <div className="space-y-1.5 text-xs text-left bg-slate-50 border p-3.5 rounded-xl font-bold">
                <span className="text-[9px] text-slate-400 block mb-0.5">Assigned Target details</span>
                <div className="text-slate-700">Client: {selectedLead.name}</div>
                <div className="text-slate-700 mt-1">Car Interest: {selectedLead.carInterest}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Target Date</Label>
                  <Input type="date" required value={tdDate} onChange={e => setTdDate(e.target.value)} className="rounded-xl border-slate-200 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Time Slot</Label>
                  <Input type="time" required value={tdTime} onChange={e => setTdTime(e.target.value)} className="rounded-xl border-slate-200 text-xs" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Accompanying Employee</Label>
                <select 
                  value={tdEmployee} 
                  onChange={e => setTdEmployee(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-700 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="Achraf Amalou">Achraf Amalou (Superadmin)</option>
                  <option value="Amine Belkadi">Amine Belkadi (Sales Manager)</option>
                </select>
              </div>

              <Button 
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3 font-bold text-xs"
              >
                Log Appointment slot
              </Button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
