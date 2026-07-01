'use client'

import React, { useState, useEffect } from 'react'
import { 
  Flame, Sun, Snowflake, MessageSquare, Plus, X, Bot, 
  ArrowUpRight, Users, Check, Phone, PlusCircle, Calendar, 
  Trash2, Send, Clock, UserCheck, CheckCircle2, ChevronRight,
  TrendingUp, BarChart3, AlertCircle, Globe, Car, PlaneTakeoff, ShoppingBag,
  Sparkles, FileText, BadgePercent, ShieldCheck
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
import { useLanguage } from '@/lib/contexts/LanguageContext'
import { Lead, LeadMessage, LeadActivity, updateLeadStageAction, sendLeadMessageAction } from '@/app/actions/leads'

interface LeadsBoardClientProps {
  initialLeads: Lead[]
  businessTypeSlug: string // 'travel', 'car_showroom', or 'ecommerce'
}

export function LeadsBoardClient({ initialLeads, businessTypeSlug: initialBusinessType }: LeadsBoardClientProps) {
  const { t } = useLanguage()
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  
  // Modals / forms state
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isActionModalOpen, setIsActionModalOpen] = useState(false) // Dynamic action modal (Test Drive, Trip Proposal, Discount code)
  const [newMessageText, setNewMessageText] = useState('')

  // New Lead Form State
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newInterest, setNewInterest] = useState('')
  const [newBudget, setNewBudget] = useState('')
  const [newScore, setNewScore] = useState<'HOT' | 'WARM' | 'COLD'>('WARM')
  const [newSource, setNewSource] = useState<'whatsapp' | 'instagram' | 'facebook' | 'walk_in' | 'phone' | 'website'>('website')
  const [newNotes, setNewNotes] = useState('')

  // Dynamic Action Form State
  const [actionDate, setActionDate] = useState('')
  const [actionTime, setActionTime] = useState('')
  const [actionEmployee, setActionEmployee] = useState('Achraf Amalou')
  const [actionNotes, setActionNotes] = useState('')
  
  // E-commerce Discount coupon code state
  const [couponCode, setCouponCode] = useState('DISCOUNT10')

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

  const handleDrop = (e: React.DragEvent, newStage: string) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain') || draggedLeadId
    if (!id) return

    moveLeadStage(id, newStage)
    setDraggedLeadId(null)
  }

  const moveLeadStage = async (id: string, newStage: string) => {
    // Optimistic UI update
    setLeads(prev => prev.map(l => {
      if (l.id === id) {
        if (l.stage === newStage) return l
        
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

    // Call server action
    await updateLeadStageAction(id, newStage)
  }

  // Handle Quick Create Lead
  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !newPhone.trim()) return

    const interestDefault = 
      initialBusinessType === 'travel' ? 'General Travel Inquiry' : 
      initialBusinessType === 'ecommerce' ? 'Store Checkout Inquiry' : 'General Showroom Inquiry'

    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      name: newName,
      phone: newPhone,
      interest: newInterest || interestDefault,
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
    setNewInterest('')
    setNewBudget('')
    setNewScore('WARM')
    setNewSource('website')
    setNewNotes('')
  }

  // Handle Dynamic CRM Actions (Test Drive / Travel Proposal / Discount Coupon)
  const handleLogCrmAction = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLead) return

    let logMessage = ''
    let newStage = selectedLead.stage

    if (initialBusinessType === 'travel') {
      logMessage = `Trip Proposal sent. Details: ${actionNotes || 'Antalya 5-Star Resort Proposal'} with price options.`
      newStage = 'proposal'
    } else if (initialBusinessType === 'ecommerce') {
      logMessage = `Discount code ${couponCode} sent via WhatsApp to recover cart. Notes: ${actionNotes || '10% Store Discount'}`
      newStage = 'negotiation'
    } else {
      // Car showroom
      logMessage = `Scheduled Test Drive on ${actionDate} at ${actionTime} with ${actionEmployee}. Notes: ${actionNotes || 'Requested variant check'}`
      newStage = 'test_drive'
    }

    setLeads(prev => prev.map(l => {
      if (l.id === selectedLead.id) {
        const newAct: LeadActivity = {
          id: `act-action-${Date.now()}`,
          action: logMessage,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          user: 'Achraf Amalou'
        }

        return {
          ...l,
          stage: newStage,
          assignedTo: actionEmployee,
          activityLog: [...l.activityLog, newAct]
        }
      }
      return l
    }))

    setIsActionModalOpen(false)
    setActionNotes('')
    setActionDate('')
    setActionTime('')
  }

  // Handle Lost Lead
  const markAsLost = async (id: string) => {
    await moveLeadStage(id, 'lost')
  }

  const sendWhatsApp = (lead: Lead) => {
    let customText = `Bonjour ${lead.name}, c'est Achraf. `
    if (initialBusinessType === 'travel') {
      customText += `Nous avons reçu votre demande pour votre voyage à destination de : ${lead.interest}. `
    } else if (initialBusinessType === 'ecommerce') {
      customText += `Nous vous contactons concernant votre panier d'achat sur notre boutique pour l'article : ${lead.interest}. `
    } else {
      customText += `Nous avons reçu votre intérêt pour le véhicule : ${lead.interest}. `
    }
    
    const text = encodeURIComponent(customText)
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
  const handleSendMessage = async () => {
    if (!selectedLead || !newMessageText.trim()) return

    const text = newMessageText
    setNewMessageText('')

    const newMsg: LeadMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: text,
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

    // Call server action
    await sendLeadMessageAction(selectedLead.id, text)

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

  const getScoreBadge = (score: 'HOT' | 'WARM' | 'COLD', hasOverlap = false) => {
    if (score === 'HOT' || hasOverlap) {
      return (
        <span className={cn(
          "inline-flex items-center gap-1 text-[9px] font-black bg-red-50 text-red-600 border border-red-150 px-2 py-0.5 rounded-full",
          hasOverlap && "bg-red-500 text-white border-red-600 shadow-sm animate-pulse-glow"
        )}>
          <Flame className="h-3 w-3 animate-pulse text-current" /> 
          {hasOverlap ? 'HOT (CROSS-SHOPPING)' : 'HOT'}
        </span>
      )
    }
    
    switch (score) {
      case 'WARM':
        return <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full"><Sun className="h-3 w-3" /> WARM</span>
      default:
        return <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full"><Snowflake className="h-3 w-3" /> COLD</span>
    }
  }

  // Get dynamic column list based on active vertical type
  const getColumns = () => {
    if (initialBusinessType === 'travel') {
      return [
        { id: 'new', label: t('leads.col_new', 'NEW'), color: 'border-t-slate-400', bg: 'bg-slate-50 text-slate-700' },
        { id: 'contacted', label: t('leads.col_contacted', 'CONTACTED'), color: 'border-t-indigo-500', bg: 'bg-indigo-50/50 text-indigo-700' },
        { id: 'proposal', label: t('leads.col_proposal', 'PROPOSAL'), color: 'border-t-purple-500', bg: 'bg-purple-50/50 text-purple-700' },
        { id: 'negotiation', label: t('leads.col_negotiation', 'NEGOTIATION'), color: 'border-t-amber-500', bg: 'bg-amber-50/50 text-amber-700' },
        { id: 'won', label: t('leads.col_booked', 'BOOKED'), color: 'border-t-emerald-500', bg: 'bg-emerald-50 text-emerald-700' },
        { id: 'lost', label: t('leads.col_lost', 'CLOSED LOST'), color: 'border-t-red-500', bg: 'bg-red-50 text-red-700' }
      ]
    } else if (initialBusinessType === 'ecommerce') {
      return [
        { id: 'new', label: t('leads.col_new', 'NEW'), color: 'border-t-slate-400', bg: 'bg-slate-50 text-slate-700' },
        { id: 'cart_abandoned', label: t('leads.col_cart_abandoned', 'CART ABANDONED'), color: 'border-t-purple-500', bg: 'bg-purple-50/50 text-purple-700' },
        { id: 'negotiation', label: t('leads.col_negotiation', 'NEGOTIATION'), color: 'border-t-amber-500', bg: 'bg-amber-50/50 text-amber-700' },
        { id: 'won', label: t('leads.col_paid', 'PAID'), color: 'border-t-emerald-500', bg: 'bg-emerald-50 text-emerald-700' },
        { id: 'lost', label: t('leads.col_cancelled', 'CANCELLED'), color: 'border-t-red-500', bg: 'bg-red-50 text-red-700' }
      ]
    } else {
      // Car showroom defaults
      return [
        { id: 'new', label: t('leads.col_new', 'NEW'), color: 'border-t-slate-400', bg: 'bg-slate-50 text-slate-700' },
        { id: 'contacted', label: t('leads.col_contacted', 'CONTACTED'), color: 'border-t-indigo-500', bg: 'bg-indigo-50/50 text-indigo-700' },
        { id: 'test_drive', label: t('leads.col_testdrive', 'TEST DRIVE'), color: 'border-t-purple-500', bg: 'bg-purple-50/50 text-purple-700' },
        { id: 'negotiation', label: t('leads.col_negotiation', 'NEGOTIATION'), color: 'border-t-amber-500', bg: 'bg-amber-50/50 text-amber-700' },
        { id: 'won', label: t('leads.col_won', 'CLOSED WON'), color: 'border-t-emerald-500', bg: 'bg-emerald-50 text-emerald-700' },
        { id: 'lost', label: t('leads.col_lost', 'CLOSED LOST'), color: 'border-t-red-500', bg: 'bg-red-50 text-red-700' }
      ]
    }
  }

  // Get active vertical labels
  const getCrmLabels = () => {
    switch (initialBusinessType) {
      case 'travel':
        return {
          boardTitle: t('leads.title_travel', 'Tableau des Prospects Voyage'),
          boardSubtitle: t('leads.subtitle_travel', 'Gérez les prospects de votre agence de voyage, proposez des itinéraires et suivez les réservations.'),
          interestLabel: t('leads.interest_travel', 'Intérêt Voyage'),
          budgetLabel: t('leads.budget_travel', 'Budget Estimé Voyage'),
          addLeadTitle: t('leads.add_title_travel', 'Créer un Prospect Voyage'),
          interestInputLabel: t('leads.interest_input_travel', 'Destination de préférence'),
          interestPlaceholder: 'Antalya, Turquie - 2 Adultes',
          actionButtonLabel: t('leads.action_btn_travel', 'Envoyer Proposition'),
          actionModalTitle: 'Envoyer une Proposition de Voyage',
          actionModalDesc: 'Renseignez les détails du devis personnalisé pour ce prospect.',
          icon: <PlaneTakeoff className="h-5 w-5 text-indigo-500 shrink-0" />
        }
      case 'ecommerce':
        return {
          boardTitle: t('leads.title_ecommerce', 'Tableau de Conversion E-Commerce'),
          boardSubtitle: t('leads.subtitle_ecommerce', 'Suivez les paniers abandonnés, relancez vos clients et offrez des remises personnalisées.'),
          interestLabel: t('leads.interest_ecommerce', 'Produits / Panier'),
          budgetLabel: t('leads.budget_ecommerce', 'Valeur du Panier'),
          addLeadTitle: t('leads.add_title_ecommerce', 'Ajouter un Prospect E-Commerce'),
          interestInputLabel: t('leads.interest_input_ecommerce', 'Article / Panier'),
          interestPlaceholder: 'iPhone 15 Pro Max 256GB',
          actionButtonLabel: t('leads.action_btn_ecommerce', 'Envoyer un Coupon'),
          actionModalTitle: 'Offrir une Remise Client',
          actionModalDesc: 'Attribuez un coupon de réduction pour motiver la validation de la commande.',
          icon: <ShoppingBag className="h-5 w-5 text-indigo-500 shrink-0" />
        }
      default:
        return {
          boardTitle: t('leads.title', 'Tableau des Leads Showroom'),
          boardSubtitle: t('leads.subtitle', 'Gérez les acquisitions clients du showroom et coordonnez les essais routiers.'),
          interestLabel: t('leads.interest', 'Véhicule d’Intérêt'),
          budgetLabel: t('leads.budget', 'Budget Estimé'),
          addLeadTitle: t('leads.add_title', 'Créer un Lead Showroom'),
          interestInputLabel: t('leads.interest_input', 'Véhicule de préférence'),
          interestPlaceholder: 'Toyota Tucson 2024 Hybrid',
          actionButtonLabel: t('leads.action_btn', 'Essai Routier'),
          actionModalTitle: 'Planifier un Essai Routier',
          actionModalDesc: 'Affectez un véhicule de démonstration et un conseiller au calendrier.',
          icon: <Car className="h-5 w-5 text-indigo-500 shrink-0" />
        }
    }
  }

  const columns = getColumns()
  const labels = getCrmLabels()

  return (
    <div className="p-6 space-y-6 font-geist text-left rtl:text-right bg-slate-50/50 h-[calc(100vh-64px)] overflow-hidden flex flex-col relative select-none">
      {/* Ambient background glows */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-indigo-200/20 blur-[100px] pointer-events-none animate-glow-1" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[45%] rounded-full bg-purple-200/20 blur-[100px] pointer-events-none animate-glow-2" />

      {/* Top Welcome Title Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-2xl p-5 shadow-xs shrink-0 relative z-10">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            {labels.icon} {labels.boardTitle}
          </h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">{labels.boardSubtitle}</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Quick Metrics display */}
          <div className="hidden md:flex gap-4 p-2.5 bg-slate-50/80 border rounded-xl items-center text-xs">
            <div className="flex items-center gap-1.5 px-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <div className="text-left rtl:text-right leading-none">
                <span className="text-[9px] font-black text-slate-400 uppercase">
                  {initialBusinessType === 'travel' ? 'Booked Trips' : initialBusinessType === 'ecommerce' ? 'Orders Paid' : 'WON Deals'}
                </span>
                <div className="text-[11px] font-bold text-slate-800 mt-0.5">
                  {leads.filter(l => l.stage === 'won').length} {initialBusinessType === 'travel' ? 'Trips' : initialBusinessType === 'ecommerce' ? 'Paid' : 'Sales'}
                </div>
              </div>
            </div>
            <div className="w-[1px] bg-slate-200 h-6" />
            <div className="flex items-center gap-1.5 px-2">
              <BarChart3 className="h-4 w-4 text-indigo-500" />
              <div className="text-left rtl:text-right leading-none">
                <span className="text-[9px] font-black text-slate-400 uppercase">Pipeline Value</span>
                <div className="text-[11px] font-bold text-slate-800 mt-0.5">
                  {leads.reduce((a, b) => a + b.budget, 0).toLocaleString()} DZD
                </div>
              </div>
            </div>
          </div>

          <Button 
            onClick={() => setIsAddOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold gap-2 shadow-xs active:scale-95 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Ajouter un Lead
          </Button>
        </div>
      </div>

      {/* Kanban Grid */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden flex gap-5 pb-2 scrollbar-thin relative z-10">
        {columns.map(col => {
          const colLeads = leads.filter(l => l.stage === col.id)
          const columnBorderColor = 
            col.id === 'won' ? '#10b981' : 
            col.id === 'lost' ? '#ef4444' : 
            col.id === 'test_drive' || col.id === 'proposal' || col.id === 'cart_abandoned' ? '#8b5cf6' : 
            col.id === 'negotiation' ? '#f59e0b' : 
            col.id === 'contacted' ? '#6366f1' : '#94a3b8'

          return (
            <div 
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className="w-[280px] shrink-0 bg-white/60 backdrop-blur-md border border-slate-200/80 rounded-2xl flex flex-col h-full shadow-xs max-h-full border-t-[4px] relative transition-all hover:bg-white/80"
              style={{ borderColor: columnBorderColor }}
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
                  {(colLeads.reduce((a, b) => a + b.budget, 0) / 1000).toFixed(0)}k DZD
                </span>
              </div>

              {/* Cards Container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 max-h-full scrollbar-thin">
                {colLeads.map(lead => {
                  const hasOverlap = !!(lead.crossTenantAgencies && lead.crossTenantAgencies.length > 0)
                  return (
                    <div 
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      onClick={() => setSelectedLead(lead)}
                      className={cn(
                        "bg-white/95 hover:bg-white border border-slate-200/50 hover:border-indigo-200 rounded-xl p-3.5 shadow-xs hover:shadow-md transition-all duration-350 cursor-pointer text-left rtl:text-right relative group hover:-translate-y-0.5",
                        draggedLeadId === lead.id && "opacity-40 scale-95",
                        hasOverlap && "border-l-4 border-l-red-500"
                      )}
                    >
                      {/* Top platform and score */}
                      <div className="flex items-center justify-between">
                        {getScoreBadge(lead.score, hasOverlap)}
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
                      <div className="mt-4 p-2 bg-slate-50 border rounded-lg border-slate-150 space-y-1">
                        <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500">
                          {initialBusinessType === 'travel' ? <PlaneTakeoff className="h-3 w-3 shrink-0 text-slate-400" /> : 
                           initialBusinessType === 'ecommerce' ? <ShoppingBag className="h-3 w-3 shrink-0 text-slate-400" /> :
                           <Car className="h-3 w-3 shrink-0 text-slate-400" />}
                          <span className="truncate">{lead.interest}</span>
                        </div>
                        <div className="flex items-center justify-between text-[9px] pt-1 border-t border-slate-100 font-bold">
                          <span className="text-slate-400 uppercase tracking-wider">{labels.budgetLabel}</span>
                          <span className="text-slate-700">{(lead.budget).toLocaleString()} DZD</span>
                        </div>
                      </div>

                      {/* extracted tone/facts preview */}
                      {lead.customerTone && (
                        <div className="mt-2 text-[9px] text-slate-500 italic bg-amber-50/50 border border-amber-100/50 rounded px-1.5 py-0.5 line-clamp-1">
                          🎭 Style: {lead.customerTone}
                        </div>
                      )}

                      {/* Cross Tenant Shopping Alert */}
                      {hasOverlap && (
                        <div className="mt-2 text-[8px] font-bold text-white bg-red-500 rounded px-1.5 py-0.5 flex items-center gap-1 animate-pulse">
                          <Sparkles className="h-2.5 w-2.5" />
                          Compare avec {lead.crossTenantAgencies?.join(', ')}
                        </div>
                      )}

                      {/* quick icons / indicators */}
                      <div className="mt-3 flex items-center justify-between text-[9px] font-semibold text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {lead.lastContacted}
                        </span>
                        {lead.messages.length > 0 && (
                          <span className="flex items-center gap-0.5 text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded font-bold">
                            <MessageSquare className="h-2.5 w-2.5" /> {lead.messages.length}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}

                {colLeads.length === 0 && (
                  <div className="h-36 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                    <span className="text-[10px] font-bold">Aucun lead à ce stade</span>
                    <span className="text-[9px] mt-0.5 leading-relaxed">Faites glisser des cartes ou ajoutez un prospect.</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* DETAILED SIDE PANEL DRAWER */}
      {selectedLead && (
        <div className="fixed inset-y-0 w-full sm:w-[480px] bg-white/95 backdrop-blur-md shadow-2xl z-30 flex flex-col h-full right-0 border-l border-white/20 animate-slideInRight rtl:right-auto rtl:left-0 rtl:border-l-0 rtl:border-r rtl:animate-slideInLeft">
          {/* Header */}
          <div className="p-6 border-b border-slate-100/50 flex items-center justify-between bg-slate-900/95 backdrop-blur-md text-white shrink-0">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h3 className="text-sm font-bold tracking-tight">{selectedLead.name}</h3>
                {getScoreBadge(selectedLead.score, !!(selectedLead.crossTenantAgencies && selectedLead.crossTenantAgencies.length > 0))}
              </div>
              <p className="text-[10px] text-indigo-300 font-semibold">{selectedLead.phone} | Assigné à {selectedLead.assignedTo}</p>
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
            
            {/* Cross-Tenant Competitor Alerts */}
            {selectedLead.crossTenantAgencies && selectedLead.crossTenantAgencies.length > 0 && (
              <div className="bg-red-50 border border-red-150 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-red-700">
                  <AlertCircle className="h-4 w-4 text-red-500 animate-bounce" />
                  <span>🚨 Détection de Multi-Inscriptions (Shopping)</span>
                </div>
                <p className="text-[11px] text-red-600 font-medium leading-relaxed">
                  Ce contact est actuellement en cours de discussion avec d'autres agences du même type. Ses offres de devis sont en cours d'évaluation chez : 
                  <strong className="underline ml-1">{selectedLead.crossTenantAgencies.join(', ')}</strong>.
                </p>
                <div className="inline-flex items-center gap-1 text-[9px] font-bold text-white bg-red-600 px-2 py-0.5 rounded-md mt-1">
                  Recommandation : Priorité Élevée / Envoyer Offre Agressive
                </div>
              </div>
            )}

            {/* Quick Actions Action Sheet */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Actions CRM</span>
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  onClick={() => sendWhatsApp(selectedLead)}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 rounded-xl text-[10px] font-bold py-2 gap-1.5 shadow-none shrink-0 cursor-pointer"
                >
                  <WhatsAppIcon className="h-3.5 w-3.5" /> WhatsApp
                </Button>
                <Button 
                  onClick={() => setIsActionModalOpen(true)}
                  className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-100 rounded-xl text-[10px] font-bold py-2 gap-1.5 shadow-none shrink-0 cursor-pointer"
                >
                  {initialBusinessType === 'travel' ? <PlaneTakeoff className="h-3.5 w-3.5" /> : 
                   initialBusinessType === 'ecommerce' ? <BadgePercent className="h-3.5 w-3.5" /> :
                   <Calendar className="h-3.5 w-3.5" />}
                  {labels.actionButtonLabel}
                </Button>
                <Button 
                  onClick={() => markAsLost(selectedLead.id)}
                  className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 rounded-xl text-[10px] font-bold py-2 gap-1.5 shadow-none shrink-0 cursor-pointer"
                  disabled={selectedLead.stage === 'lost'}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Perdu
                </Button>
              </div>
            </div>

            {/* Conversation analysis and tone */}
            <div className="bg-gradient-to-br from-indigo-50/50 to-slate-50 border border-indigo-100/80 rounded-2xl p-4 space-y-3">
              <span className="text-[9px] font-black text-indigo-700 uppercase tracking-wider block flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 animate-pulse text-indigo-500" />
                Analyse de Communication de l'IA (Conversational Facts)
              </span>

              <div className="space-y-3.5 text-xs text-slate-700 font-medium">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block mb-1">🎭 STYLE / FAÇON DE PARLER</span>
                  <div className="bg-white border border-slate-200/50 rounded-xl p-2.5 font-bold text-indigo-950 text-[11px] shadow-2xs">
                    {selectedLead.customerTone || "Poli, structuré. S'intéresse au prix et au financement. Répond rapidement."}
                  </div>
                </div>

                <div>
                  <span className="text-[9px] font-bold text-slate-400 block mb-1">📋 FAITS EXTRAITS DE LA CONVERSATION</span>
                  <div className="bg-white border border-slate-200/50 rounded-xl p-3 shadow-2xs space-y-2">
                    {selectedLead.customerFacts && selectedLead.customerFacts.length > 0 ? (
                      <ul className="space-y-1.5 list-disc list-inside text-[11px] text-slate-600 font-medium">
                        {selectedLead.customerFacts.map((fact, idx) => (
                          <li key={idx} className="leading-relaxed"><strong className="text-slate-800">{fact.split(':')[0]}:</strong>{fact.split(':')[1] || ''}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="space-y-2 text-[11px] text-slate-600">
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="text-slate-400">Intérêt ciblé :</span>
                          <span className="font-bold text-slate-700">{selectedLead.interest}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="text-slate-400">Budget estimé :</span>
                          <span className="font-bold text-slate-700">{selectedLead.budget.toLocaleString()} DZD</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-slate-400">Canal WhatsApp :</span>
                          <span className="font-bold text-emerald-600 flex items-center gap-0.5">Actif <ShieldCheck className="h-3 w-3" /></span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* General Lead Details */}
            <div className="bg-slate-50/80 border rounded-2xl p-4 space-y-3.5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Opportunité Spécifications</span>
              
              <div className="grid grid-cols-2 gap-y-3 text-xs">
                <div className="flex flex-col text-left rtl:text-right">
                  <span className="text-[9px] font-semibold text-slate-400">{labels.interestLabel}</span>
                  <span className="font-bold text-slate-700 mt-0.5 truncate">{selectedLead.interest}</span>
                </div>
                <div className="flex flex-col text-left rtl:text-right">
                  <span className="text-[9px] font-semibold text-slate-400">{labels.budgetLabel}</span>
                  <span className="font-bold text-slate-700 mt-0.5">{(selectedLead.budget).toLocaleString()} DZD</span>
                </div>
                <div className="flex flex-col text-left rtl:text-right">
                  <span className="text-[9px] font-semibold text-slate-400">Source d'Acquisition</span>
                  <span className="font-bold text-slate-700 mt-0.5 capitalize flex items-center gap-1">
                    {getSourceIcon(selectedLead.source)} {selectedLead.source}
                  </span>
                </div>
                <div className="flex flex-col text-left rtl:text-right">
                  <span className="text-[9px] font-semibold text-slate-400">Colonne Actuelle</span>
                  <span className="font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.2 rounded-full mt-0.5 uppercase tracking-wide inline-block max-w-max text-[9px]">
                    {selectedLead.stage.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {selectedLead.notes && (
                <div className="pt-3.5 border-t border-slate-200/60 text-xs">
                  <span className="text-[9px] font-semibold text-slate-400 block mb-1">Notes Internes</span>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed bg-white border p-2.5 rounded-xl">{selectedLead.notes}</p>
                </div>
              )}
            </div>

            {/* Simulated Live Messages panel */}
            <div className="space-y-2 flex flex-col h-[280px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Historique des Messages</span>
              
              <div className="flex-1 bg-slate-50/50 border rounded-2xl p-4 overflow-y-auto space-y-3.5 scrollbar-thin">
                {selectedLead.messages.map(msg => {
                  const isUser = msg.sender === 'user'
                  const isAi = msg.sender === 'ai'

                  return (
                     <div 
                       key={msg.id}
                       className={cn(
                         "flex flex-col text-xs leading-relaxed max-w-[85%] animate-fadeIn",
                         isUser ? "ml-auto text-right items-end rtl:mr-auto rtl:ml-0 rtl:text-left rtl:items-start" : "mr-auto text-left items-start rtl:ml-auto rtl:mr-0 rtl:text-right rtl:items-end"
                       )}
                     >
                       <span className="text-[8px] font-bold text-slate-400 mb-0.5">
                         {isUser ? 'Conseiller (Vous)' : isAi ? 'IA Assistant' : selectedLead.name}
                       </span>
                       <div className={cn(
                         "p-2.5 rounded-xl border font-medium text-[11px] shadow-xs",
                         isUser 
                           ? "bg-slate-900 border-slate-950 text-white rounded-br-none rtl:rounded-br-xl rtl:rounded-bl-none" 
                           : isAi 
                           ? "bg-indigo-50/90 border-indigo-100 text-indigo-600 rounded-bl-none rtl:rounded-bl-xl rtl:rounded-br-none" 
                           : "bg-white border-slate-200/80 text-slate-700 rounded-bl-none rtl:rounded-bl-xl rtl:rounded-br-none"
                       )}>
                         {msg.text}
                       </div>
                       <span className="text-[8px] text-slate-400 mt-0.5">{msg.timestamp}</span>
                     </div>
                  )
                })}

                {selectedLead.messages.length === 0 && (
                  <div className="text-xs text-slate-400 text-center py-12">Aucun message. Saisissez une réponse pour démarrer le chat.</div>
                )}
              </div>

              {/* Chat Input */}
              <div className="flex gap-2">
                <Input 
                  value={newMessageText} 
                  onChange={e => setNewMessageText(e.target.value)}
                  placeholder="Écrire un message WhatsApp..." 
                  className="rounded-xl border-slate-200 text-xs bg-white/70"
                  onKeyDown={e => { if (e.key === 'Enter') handleSendMessage() }}
                />
                <Button 
                  onClick={handleSendMessage}
                  className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-none cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Detailed Activity Logs */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Historique des Activités</span>
              <div className="bg-slate-50/80 border rounded-2xl p-4 space-y-4">
                {selectedLead.activityLog.map(act => (
                  <div key={act.id} className="flex gap-3 text-xs text-left rtl:text-right items-start relative pb-1">
                    <div className="h-6 w-6 rounded-full bg-white border shadow-xs flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-slate-700 leading-tight">{act.action}</p>
                      <p className="text-[9px] text-slate-400 font-semibold">Fait par {act.user} | {act.timestamp}</p>
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-40 p-4 animate-fadeIn">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 w-full max-w-lg overflow-hidden animate-scaleIn text-left rtl:text-right">
            <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold tracking-tight flex items-center gap-1.5"><Plus className="h-4.5 w-4.5 text-indigo-400" /> {labels.addLeadTitle}</h3>
                <p className="text-[10px] text-slate-400 font-semibold">Créez une fiche prospect dans la colonne NOUVEAU.</p>
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
                  <Label className="text-xs font-bold text-slate-700">Nom Complet du Client</Label>
                  <Input value={newName} onChange={e => setNewName(e.target.value)} required placeholder="Ali Belkacem" className="rounded-xl border-slate-200 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Téléphone (+213)</Label>
                  <Input value={newPhone} onChange={e => setNewPhone(e.target.value)} required placeholder="+213 555 12 34 56" className="rounded-xl border-slate-200 text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">{labels.interestInputLabel}</Label>
                  <Input value={newInterest} onChange={e => setNewInterest(e.target.value)} placeholder={labels.interestPlaceholder} className="rounded-xl border-slate-200 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">{labels.budgetLabel} (DZD)</Label>
                  <Input value={newBudget} onChange={e => setNewBudget(e.target.value)} type="number" placeholder="250000" className="rounded-xl border-slate-200 text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Source d'Acquisition</Label>
                  <select 
                    value={newSource} 
                    onChange={e => setNewSource(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-600 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
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
                  <Label className="text-xs font-bold text-slate-700">Score de Qualité Initial</Label>
                  <select 
                    value={newScore} 
                    onChange={e => setNewScore(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-600 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                  >
                    <option value="HOT">🔥 Prospect CHAUD</option>
                    <option value="WARM">☀️ Prospect MOYEN</option>
                    <option value="COLD">❄️ Prospect FROID</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Notes Privées (Besoins, etc.)</Label>
                <Textarea value={newNotes} onChange={(e: any) => setNewNotes(e.target.value)} placeholder="Entrez les demandes spécifiques du client..." className="rounded-xl border-slate-200 min-h-[80px] text-xs" />
              </div>

              <Button 
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3 font-bold text-xs cursor-pointer shadow-sm active:scale-98 transition-all"
              >
                Enregistrer dans le CRM
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* DYNAMIC CRM ACTION MODAL (Test Drive / Proposal / Coupon) */}
      {isActionModalOpen && selectedLead && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 w-full max-w-md overflow-hidden animate-scaleIn text-left rtl:text-right">
            <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold tracking-tight flex items-center gap-1.5">
                  {initialBusinessType === 'travel' ? <PlaneTakeoff className="h-4.5 w-4.5 text-indigo-400" /> : 
                   initialBusinessType === 'ecommerce' ? <BadgePercent className="h-4.5 w-4.5 text-emerald-400" /> :
                   <Calendar className="h-4.5 w-4.5 text-purple-400" />}
                  {labels.actionModalTitle}
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold">{labels.actionModalDesc}</p>
              </div>
              <button 
                onClick={() => setIsActionModalOpen(false)}
                className="h-8 w-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleLogCrmAction} className="p-6 space-y-4">
              <div className="space-y-1.5 text-xs text-left rtl:text-right bg-slate-50 border p-3.5 rounded-xl font-bold">
                <span className="text-[9px] text-slate-400 block mb-0.5">Détails du destinataire</span>
                <div className="text-slate-700">Client: {selectedLead.name}</div>
                <div className="text-slate-700 mt-1">{labels.interestLabel}: {selectedLead.interest}</div>
              </div>

              {initialBusinessType === 'car_showroom' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Date Prévue</Label>
                    <Input type="date" required value={actionDate} onChange={e => setActionDate(e.target.value)} className="rounded-xl border-slate-200 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Créneau Horaire</Label>
                    <Input type="time" required value={actionTime} onChange={e => setActionTime(e.target.value)} className="rounded-xl border-slate-200 text-xs" />
                  </div>
                </div>
              )}

              {initialBusinessType === 'ecommerce' && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Code de réduction à attribuer</Label>
                  <Input required value={couponCode} onChange={e => setCouponCode(e.target.value)} className="rounded-xl border-slate-200 text-xs font-mono" />
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Conseiller Responsable</Label>
                <select 
                  value={actionEmployee} 
                  onChange={e => setActionEmployee(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-700 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="Achraf Amalou">Achraf Amalou (Superadmin)</option>
                  <option value="Amine Belkadi">Amine Belkadi (Directeur Commercial)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Notes / Informations complémentaires</Label>
                <Textarea 
                  value={actionNotes} 
                  onChange={(e: any) => setActionNotes(e.target.value)} 
                  placeholder={
                    initialBusinessType === 'travel' ? "Ex: Vol via Turkish Airlines, hôtel Lara Barut Collection..." :
                    initialBusinessType === 'ecommerce' ? "Ex: Offert coupon de 10% pour débloquer le panier abandonné..." :
                    "Ex: Itinéraire routier prévu, permis de conduire vérifié..."
                  } 
                  className="rounded-xl border-slate-200 min-h-[80px] text-xs" 
                />
              </div>

              <Button 
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3 font-bold text-xs"
              >
                Valider l'Action CRM
              </Button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
