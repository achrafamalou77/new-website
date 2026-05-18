'use client'

import { useState, useMemo } from 'react'
import { Booking, Trip } from '@/lib/mock-data'
import { updateBookingStatus } from '@/app/actions/bookings'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { 
  CheckCircle2, Clock, User, Phone, Mail, Users2, CalendarDays, ArrowUpRight,
  DollarSign, FileText, CheckCircle, AlertCircle, RefreshCw, X, Send, Trash2,
  Printer, Check, Clipboard, Eye, Calendar, Sparkles, Filter, ChevronDown,
  Award, BookOpen, MessageSquare, Download, ShieldCheck, HelpCircle, ArrowRight,
  MessageCircle, Info, Landmark, ShieldAlert, CreditCard, Plus
} from 'lucide-react'

// Extended local structures to enrich standard mock bookings data
interface EnhancedBooking extends Omit<Booking, 'status'> {
  status: 'pending' | 'confirmed' | 'paid' | 'departed' | 'completed' | 'cancelled';
  amount_paid: number;
  documents: {
    id: string;
    name: string;
    status: 'approved' | 'pending' | 'missing';
    uploadedAt?: string;
  }[];
  payments: {
    id: string;
    amount: number;
    method: 'ccp' | 'edahabia' | 'cash' | 'bank_transfer' | 'check';
    reference: string;
    date: string;
  }[];
  notes: {
    id: string;
    text: string;
    date: string;
    author: string;
  }[];
  timeline: {
    status: string;
    label: string;
    date: string;
    by: string;
  }[];
}

const TIMELINE_STEPS = [
  { key: 'pending', label: 'En attente', desc: 'Réservation créée, en attente de validation ou dépôt.' },
  { key: 'confirmed', label: 'Confirmé', desc: 'Réservation validée par l\'agence, visa en cours.' },
  { key: 'paid', label: 'Payé', desc: 'Paiement total reçu et vérifié.' },
  { key: 'departed', label: 'Parti', desc: 'Le voyageur a débuté le circuit / embarqué.' },
  { key: 'completed', label: 'Terminé', desc: 'Voyage complété avec succès.' }
]

export function BookingsClient({ initialBookings, trips }: { initialBookings: Booking[], trips: Trip[] }) {
  // Enrich initialBookings with payment meters, checklists, notes and timeline steps
  const enrichedBookings: EnhancedBooking[] = useMemo(() => {
    return initialBookings.map(b => {
      const manifest = (b.client_manifest as any) || {}
      const clientName = manifest.name || 'Client'
      
      // Determine status from db raw
      let targetStatus: any = 'pending'
      if (b.status === 'completed') targetStatus = 'paid'
      else if (b.status === 'cancelled') targetStatus = 'cancelled'
      else if (b.status === 'pending_payment') targetStatus = 'pending'

      // Pre-fill logical payment amounts based on status
      let amountPaid = 0
      if (targetStatus === 'paid' || targetStatus === 'departed' || targetStatus === 'completed') {
        amountPaid = b.total_price || 0
      } else if (targetStatus === 'confirmed') {
        amountPaid = Math.floor((b.total_price || 0) * 0.6) // 60% deposit paid
      } else {
        amountPaid = 0 // unpaid
      }

      // Initial Algerian documentation requirements
      const documents = [
        { id: 'doc-1', name: 'Copie du Passeport (Validité > 6 Mois)', status: targetStatus !== 'pending' ? 'approved' as const : 'pending' as const, uploadedAt: '2026-05-10T14:30:00Z' },
        { id: 'doc-2', name: 'Photo d\'identité sur Fond Blanc', status: targetStatus !== 'pending' ? 'approved' as const : 'pending' as const, uploadedAt: '2026-05-10T14:32:00Z' },
        { id: 'doc-3', name: 'Attestation de voyage / Assurance', status: targetStatus === 'completed' || targetStatus === 'paid' ? 'approved' as const : 'missing' as const }
      ]

      // Initial simulation payments history
      const payments: EnhancedBooking['payments'] = []
      if (amountPaid > 0) {
        payments.push({
          id: 'pay-initial',
          amount: amountPaid,
          method: amountPaid === b.total_price ? 'bank_transfer' : 'cash',
          reference: amountPaid === b.total_price ? 'CCP-90887321' : 'CASH-REC-88',
          date: b.created_at ? new Date(new Date(b.created_at).getTime() + 1000 * 60 * 60).toISOString() : new Date().toISOString()
        })
      }

      // Private agency annotations
      const notes = [
        { id: 'n-1', text: `Dossier initial enregistré pour ${clientName}. Préfère les places à l'avant du bus/avion.`, date: b.created_at || new Date().toISOString(), author: 'Système automatique' }
      ]

      // Step transition timelines
      const timeline = [
        { status: 'pending', label: 'Réservation Enregistrée', date: b.created_at || new Date().toISOString(), by: 'Algérie Travel Bot' }
      ]
      if (targetStatus !== 'pending' && targetStatus !== 'cancelled') {
        timeline.push({ status: 'confirmed', label: 'Réservation Validée par l\'Agence', date: new Date(new Date(b.created_at || '').getTime() + 1000 * 60 * 120).toISOString(), by: 'Amel (Agente)' })
      }
      if (amountPaid === b.total_price) {
        timeline.push({ status: 'paid', label: 'Paiement Total Reçu', date: new Date(new Date(b.created_at || '').getTime() + 1000 * 60 * 240).toISOString(), by: 'Comptable Principal' })
      }

      return {
        ...b,
        status: targetStatus,
        amount_paid: amountPaid,
        documents,
        payments,
        notes,
        timeline
      }
    })
  }, [initialBookings])

  const [bookings, setBookings] = useState<EnhancedBooking[]>(enrichedBookings)
  
  // High-End Filters State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTripId, setSelectedTripId] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | EnhancedBooking['status']>('all')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'fully' | 'partially' | 'unpaid'>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Detailed sheet & invoice modal states
  const [selectedBooking, setSelectedBooking] = useState<EnhancedBooking | null>(null)
  const [invoiceBooking, setInvoiceBooking] = useState<EnhancedBooking | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  // Payment form dialog inside detail sheet
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'ccp' | 'edahabia' | 'cash' | 'bank_transfer' | 'check'>('ccp')
  const [paymentRef, setPaymentRef] = useState('')
  const [isRecordingPayment, setIsRecordingPayment] = useState(false)

  // Agent note creation inside sheet
  const [newNoteText, setNewNoteText] = useState('')

  // Filter application
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const manifest = (b.client_manifest as any) || {}
      const clientName = (manifest.name || '').toLowerCase()
      const clientPhone = (manifest.phone || '').toLowerCase()
      const clientEmail = (manifest.email || '').toLowerCase()
      const search = searchQuery.toLowerCase()

      // 1. Text Search
      const matchesSearch = searchQuery === '' || 
        clientName.includes(search) || 
        clientPhone.includes(search) || 
        clientEmail.includes(search)

      // 2. Trip selection
      const matchesTrip = selectedTripId === 'all' || b.trip_id === selectedTripId

      // 3. Status select
      const matchesStatus = statusFilter === 'all' || b.status === statusFilter

      // 4. Payment status calculation
      const unpaidAmount = (b.total_price || 0) - b.amount_paid
      let matchesPayment = true
      if (paymentStatusFilter === 'fully') {
        matchesPayment = b.amount_paid >= (b.total_price || 0) && (b.total_price || 0) > 0
      } else if (paymentStatusFilter === 'partially') {
        matchesPayment = b.amount_paid > 0 && b.amount_paid < (b.total_price || 0)
      } else if (paymentStatusFilter === 'unpaid') {
        matchesPayment = b.amount_paid === 0
      }

      // 5. Date Range filter
      let matchesDates = true
      if (startDate) {
        matchesDates = matchesDates && new Date(b.created_at || '') >= new Date(startDate)
      }
      if (endDate) {
        // Add 23:59:59 to make date inclusive
        const endDateTime = new Date(endDate)
        endDateTime.setHours(23, 59, 59, 999)
        matchesDates = matchesDates && new Date(b.created_at || '') <= endDateTime
      }

      return matchesSearch && matchesTrip && matchesStatus && matchesPayment && matchesDates
    })
  }, [bookings, searchQuery, selectedTripId, statusFilter, paymentStatusFilter, startDate, endDate])

  // Overview calculations
  const totalSales = bookings.reduce((sum, b) => sum + (b.total_price || 0), 0)
  const totalCollected = bookings.reduce((sum, b) => sum + b.amount_paid, 0)
  const totalPendingReceivable = totalSales - totalCollected
  const activeTravelersCount = bookings.filter(b => b.status === 'departed').length

  const getTripInfo = (tripId: string | null) => {
    const trip = trips.find(t => t.id === tripId)
    return {
      title: trip?.title || 'Formule Sur Mesure',
      thumbnail: (trip as any)?.image_urls?.[0] || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=150&q=80',
      duration: trip?.duration_days || 7,
      type: (trip as any)?.transport_type || 'Avion'
    }
  }

  // Transitions the lifecycle status
  const handleStatusChange = async (bookingId: string, newStatus: EnhancedBooking['status']) => {
    setIsUpdating(true)
    
    // Attempt standard Supabase update if action is functional
    try {
      let dbStatus: 'pending_payment' | 'completed' | 'cancelled' = 'pending_payment'
      if (newStatus === 'paid' || newStatus === 'departed' || newStatus === 'completed') dbStatus = 'completed'
      else if (newStatus === 'cancelled') dbStatus = 'cancelled'
      
      await updateBookingStatus(bookingId, dbStatus)
    } catch (e) {
      console.warn('Supabase offline or action errored. Updating state locally.', e)
    }

    // Always update React state to guarantee snappy UI
    setBookings(prev => prev.map(b => {
      if (b.id !== bookingId) return b
      
      const newTimelineItem = {
        status: newStatus,
        label: `Statut modifié en: ${newStatus.toUpperCase()}`,
        date: new Date().toISOString(),
        by: 'Responsable Agence'
      }

      // Automatically adjust payments if transitioning to Paid/Completed
      let newAmountPaid = b.amount_paid
      if (newStatus === 'paid' || newStatus === 'completed' || newStatus === 'departed') {
        newAmountPaid = b.total_price || 0
      }

      return {
        ...b,
        status: newStatus,
        amount_paid: newAmountPaid,
        timeline: [...b.timeline, newTimelineItem]
      }
    }))

    // Sync selectedBooking details sheet if open
    setSelectedBooking(prev => {
      if (!prev || prev.id !== bookingId) return prev
      
      let newAmountPaid = prev.amount_paid
      if (newStatus === 'paid' || newStatus === 'completed' || newStatus === 'departed') {
        newAmountPaid = prev.total_price || 0
      }

      return {
        ...prev,
        status: newStatus,
        amount_paid: newAmountPaid,
        timeline: [...prev.timeline, {
          status: newStatus,
          label: `Statut modifié en: ${newStatus.toUpperCase()}`,
          date: new Date().toISOString(),
          by: 'Responsable Agence'
        }]
      }
    })

    setIsUpdating(false)
  }

  // Send polite WhatsApp Reminder in French/Arabic
  const handleSendWhatsAppReminder = (booking: EnhancedBooking) => {
    const manifest = (booking.client_manifest as any) || {}
    const clientName = manifest.name || 'Cher client'
    const phone = manifest.phone || ''
    const tripTitle = getTripInfo(booking.trip_id).title
    const unpaidAmount = (booking.total_price || 0) - booking.amount_paid
    
    if (!phone) {
      alert('Aucun numéro de téléphone disponible pour ce client.')
      return
    }

    const message = `Salam alaykoum ${clientName}, 

L'agence de voyage Algérie Travel vous contacte concernant votre réservation pour le circuit *${tripTitle}*. 

Pour finaliser votre dossier (Visa & Billets), veuillez noter qu'un montant de *${unpaidAmount.toLocaleString()} DZD* reste en attente de règlement. 

Vous pouvez effectuer le paiement via :
- Versement CCP principal
- Carte Edahabia en agence
- Espèces à notre bureau d'Alger

Merci pour votre confiance ! 🌟`

    const encodedMsg = encodeURIComponent(message)
    const formattedPhone = phone.replace(/[^0-9+]/g, '')
    const cleanPhone = formattedPhone.startsWith('+') ? formattedPhone.substring(1) : formattedPhone

    window.open(`https://wa.me/${cleanPhone}?text=${encodedMsg}`, '_blank')
  }

  // Add agent annotation notes inside drawer
  const handleAddNote = () => {
    if (!newNoteText.trim() || !selectedBooking) return
    
    const newNote = {
      id: `n-${Date.now()}`,
      text: newNoteText.trim(),
      date: new Date().toISOString(),
      author: 'Agent Conseil'
    }

    setBookings(prev => prev.map(b => {
      if (b.id !== selectedBooking.id) return b
      return { ...b, notes: [newNote, ...b.notes] }
    }))

    setSelectedBooking(prev => prev ? { ...prev, notes: [newNote, ...prev.notes] } : null)
    setNewNoteText('')
  }

  // Delete agent note
  const handleDeleteNote = (noteId: string) => {
    if (!selectedBooking) return

    setBookings(prev => prev.map(b => {
      if (b.id !== selectedBooking.id) return b
      return { ...b, notes: b.notes.filter(n => n.id !== noteId) }
    }))

    setSelectedBooking(prev => prev ? { ...prev, notes: prev.notes.filter(n => n.id !== noteId) } : null)
  }

  // Record a payment directly inside the billing ledger tab
  const handleRecordPayment = () => {
    const amount = Number(paymentAmount)
    if (!amount || amount <= 0 || !selectedBooking) return

    const remaining = (selectedBooking.total_price || 0) - selectedBooking.amount_paid
    if (amount > remaining) {
      alert(`Le montant saisi (${amount.toLocaleString()} DZD) dépasse le solde restant à payer (${remaining.toLocaleString()} DZD).`)
      return
    }

    const newPayment = {
      id: `pay-${Date.now()}`,
      amount,
      method: paymentMethod,
      reference: paymentRef || `REC-${Math.floor(Math.random()*100000)}`,
      date: new Date().toISOString()
    }

    setBookings(prev => prev.map(b => {
      if (b.id !== selectedBooking.id) return b
      const updatedAmount = b.amount_paid + amount
      const isNowFullyPaid = updatedAmount >= (b.total_price || 0)
      const nextStatus = isNowFullyPaid ? 'paid' as const : b.status

      return {
        ...b,
        amount_paid: updatedAmount,
        status: nextStatus,
        payments: [...b.payments, newPayment],
        timeline: [
          ...b.timeline,
          {
            status: 'payment',
            label: `Paiement enregistré: +${amount.toLocaleString()} DZD par ${paymentMethod.toUpperCase()}`,
            date: new Date().toISOString(),
            by: 'Comptable Principal'
          }
        ]
      }
    }))

    setSelectedBooking(prev => {
      if (!prev) return null
      const updatedAmount = prev.amount_paid + amount
      const isNowFullyPaid = updatedAmount >= (prev.total_price || 0)
      const nextStatus = isNowFullyPaid ? 'paid' as const : prev.status

      return {
        ...prev,
        amount_paid: updatedAmount,
        status: nextStatus,
        payments: [...prev.payments, newPayment],
        timeline: [
          ...prev.timeline,
          {
            status: 'payment',
            label: `Paiement enregistré: +${amount.toLocaleString()} DZD par ${paymentMethod.toUpperCase()}`,
            date: new Date().toISOString(),
            by: 'Comptable Principal'
          }
        ]
      }
    })

    // Reset payment inputs
    setPaymentAmount('')
    setPaymentRef('')
    setIsRecordingPayment(false)
  }

  // Toggle Client Document approval checkbox
  const handleToggleDocStatus = (docId: string) => {
    if (!selectedBooking) return

    setBookings(prev => prev.map(b => {
      if (b.id !== selectedBooking.id) return b
      const updatedDocs = b.documents.map(d => {
        if (d.id !== docId) return d
        const nextStatus: 'approved' | 'pending' | 'missing' = 
          d.status === 'approved' ? 'pending' : 'approved'
        return { ...d, status: nextStatus }
      })
      return { ...b, documents: updatedDocs }
    }))

    setSelectedBooking(prev => {
      if (!prev) return null
      const updatedDocs = prev.documents.map(d => {
        if (d.id !== docId) return d
        const nextStatus: 'approved' | 'pending' | 'missing' = 
          d.status === 'approved' ? 'pending' : 'approved'
        return { ...d, status: nextStatus }
      })
      return { ...prev, documents: updatedDocs }
    })
  }

  return (
    <div className="p-6 space-y-6 font-geist text-left bg-[#f8fafc] h-[calc(100vh-64px)] overflow-y-auto page-enter">
      
      {/* Top Title Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-r from-transparent to-indigo-50/20 pointer-events-none rounded-r-3xl" />
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-650 bg-indigo-600 animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-indigo-600">Console de Ventes</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-850">Suivi des Réservations</h1>
          <p className="text-xs text-slate-400 font-medium">Contrôlez les étapes voyageurs, validez les dossiers de visas et pilotez la trésorerie client.</p>
        </div>
      </div>

      {/* Modern High-End Metrics (Finexa-inspired) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3 hover:border-slate-300 duration-200 transition">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Réservations</span>
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Users2 className="h-4 w-4" />
            </span>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-850 tracking-tight">{bookings.length}</span>
            <span className="text-[10px] block text-slate-400 mt-1 font-semibold">Dossiers clients actifs</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3 hover:border-slate-300 duration-200 transition">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Volume Encaissé</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Landmark className="h-4 w-4" />
            </span>
          </div>
          <div>
            <span className="text-2xl font-black text-emerald-600 tracking-tight">{totalCollected.toLocaleString()} DZD</span>
            <span className="text-[10px] block text-emerald-500 mt-1 font-semibold">Taux de recouvrement: {totalSales > 0 ? Math.round((totalCollected/totalSales)*100) : 0}%</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3 hover:border-slate-300 duration-200 transition">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-semibold">Reste à Recouvrer</span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-2xl">
              <CreditCard className="h-4 w-4" />
            </span>
          </div>
          <div>
            <span className="text-2xl font-black text-amber-600 tracking-tight">{totalPendingReceivable.toLocaleString()} DZD</span>
            <span className="text-[10px] block text-amber-500 mt-1 font-semibold">Alerte encaissement en attente</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3 hover:border-slate-300 duration-200 transition">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Voyageurs Actifs</span>
            <span className="p-2 bg-indigo-550 bg-indigo-650 bg-indigo-50 text-indigo-650 rounded-2xl">
              <CalendarDays className="h-4 w-4 text-indigo-600" />
            </span>
          </div>
          <div>
            <span className="text-2xl font-black text-indigo-600 tracking-tight">{activeTravelersCount}</span>
            <span className="text-[10px] block text-indigo-400 mt-1 font-semibold">Actuellement sur le terrain</span>
          </div>
        </div>
      </div>

      {/* Advanced Filter Control Center */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-slate-700 font-bold text-xs">
            <Filter className="h-4 w-4 text-indigo-600" />
            <span>Filtres de Recherche & Requêtes</span>
          </div>
          {(searchQuery || selectedTripId !== 'all' || statusFilter !== 'all' || paymentStatusFilter !== 'all' || startDate || endDate) && (
            <Button 
              variant="ghost" 
              onClick={() => {
                setSearchQuery('')
                setSelectedTripId('all')
                setStatusFilter('all')
                setPaymentStatusFilter('all')
                setStartDate('')
                setEndDate('')
              }}
              className="h-7 text-xs font-semibold text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg px-2"
            >
              Effacer tout
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Client Search */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Client (Nom, Tél, Email)</label>
            <input 
              type="text" 
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-0 rounded-xl px-3 py-2.5 outline-none transition text-slate-750"
            />
          </div>

          {/* Trip selection */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Circuit / Formule</label>
            <select
              value={selectedTripId}
              onChange={(e) => setSelectedTripId(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-2 py-2.5 outline-none transition text-slate-750"
            >
              <option value="all">Tous les circuits</option>
              {trips.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>

          {/* Lifecycle Status */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Étape Voyageur</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full text-xs bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-2 py-2.5 outline-none transition text-slate-750"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente (Pending)</option>
              <option value="confirmed">Confirmé (Confirmed)</option>
              <option value="paid">Payé en totalité (Paid)</option>
              <option value="departed">Parti en voyage (Departed)</option>
              <option value="completed">Terminé (Completed)</option>
              <option value="cancelled">Annulé (Cancelled)</option>
            </select>
          </div>

          {/* Payment Status */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Statut Trésorerie</label>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value as any)}
              className="w-full text-xs bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-2 py-2.5 outline-none transition text-slate-750"
            >
              <option value="all">Tous les règlements</option>
              <option value="fully">Réglé (100%)</option>
              <option value="partially">Acompte versé</option>
              <option value="unpaid">Non réglé (0%)</option>
            </select>
          </div>

          {/* Date range picker */}
          <div className="space-y-1.5 text-left col-span-1 sm:col-span-2 lg:col-span-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Période d'Enregistrement</label>
            <div className="flex gap-2">
              <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-1/2 text-[10px] bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 outline-none focus:border-indigo-500"
              />
              <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-1/2 text-[10px] bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bookings catalog database grid */}
      {filteredBookings.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
          <div className="h-12 w-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-slate-700 font-bold text-sm">Aucun dossier trouvé</p>
            <p className="text-slate-400 text-xs mt-1">Ajustez vos filtres de recherche ou sélectionnez d'autres dates.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50 text-slate-450 border-b border-slate-100">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-bold text-[10px] py-4 px-6 text-slate-400 uppercase tracking-widest text-left">Client Voyageur</TableHead>
                  <TableHead className="font-bold text-[10px] py-4 px-6 text-slate-400 uppercase tracking-widest text-left">Circuit</TableHead>
                  <TableHead className="font-bold text-[10px] py-4 px-6 text-slate-400 uppercase tracking-widest text-left">Étape Logistique</TableHead>
                  <TableHead className="font-bold text-[10px] py-4 px-6 text-slate-400 uppercase tracking-widest text-left">Trésorerie & Encaissement</TableHead>
                  <TableHead className="font-bold text-[10px] py-4 px-6 text-slate-400 uppercase tracking-widest text-left">Date</TableHead>
                  <TableHead className="font-bold text-[10px] py-4 px-6 text-slate-400 uppercase tracking-widest text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map(b => {
                  const manifest = (b.client_manifest as any) || {}
                  const clientName = manifest.name || 'Client Anonyme'
                  const clientPhone = manifest.phone || 'Aucun numéro'
                  const trip = getTripInfo(b.trip_id)
                  
                  const isFullyPaid = b.amount_paid >= (b.total_price || 0)
                  const unpaidAmount = (b.total_price || 0) - b.amount_paid
                  const paymentPercentage = b.total_price ? Math.min(100, Math.round((b.amount_paid / b.total_price) * 100)) : 0

                  return (
                    <TableRow key={b.id} className="border-b border-slate-100 hover:bg-slate-50/30 transition duration-150">
                      {/* Client Info Column */}
                      <TableCell className="py-4.5 px-6 text-left">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-indigo-100 shadow-sm shrink-0">
                            <AvatarFallback className="bg-indigo-50 text-indigo-600 font-extrabold text-xs">
                              {clientName[0]?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-800 text-xs block">{clientName}</span>
                            <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                              <Phone className="h-2.5 w-2.5" /> {clientPhone}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Trip Column */}
                      <TableCell className="py-4.5 px-6 text-left">
                        <div className="flex items-center gap-3 max-w-[200px]">
                        <div className="relative h-9 w-12 shrink-0">
                          <Image 
                            src={trip.thumbnail} 
                            alt={trip.title} 
                            fill
                            sizes="48px"
                            quality={75}
                            className="rounded-lg object-cover shadow-sm border border-slate-100"
                          />
                        </div>
                          <div className="space-y-0.5 truncate">
                            <span className="font-semibold text-slate-700 text-xs block truncate" title={trip.title}>
                              {trip.title}
                            </span>
                            <span className="text-[10px] text-indigo-550 font-bold block">
                              {trip.duration} Jours • {trip.type}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Inline Status Lifecycle timeline */}
                      <TableCell className="py-4.5 px-6 text-left">
                        {b.status === 'cancelled' ? (
                          <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100 border border-slate-200 rounded-full font-bold text-[10px] px-2 py-0.5 shadow-sm">
                            Réservation Annulée
                          </Badge>
                        ) : (
                          <div className="space-y-1.5">
                            {/* Visual Timeline Bar */}
                            <div className="flex items-center gap-1">
                              {TIMELINE_STEPS.map((step, idx) => {
                                const stepIndex = TIMELINE_STEPS.findIndex(s => s.key === b.status)
                                const isCurrent = step.key === b.status
                                const isPast = idx < stepIndex
                                
                                return (
                                  <div key={step.key} className="flex items-center">
                                    <div 
                                      className={cn(
                                        "h-2 w-2 rounded-full transition-all duration-300",
                                        isCurrent ? "bg-indigo-600 scale-125 ring-2 ring-indigo-200 animate-pulse" : "",
                                        isPast ? "bg-emerald-500" : "",
                                        !isCurrent && !isPast ? "bg-slate-200" : ""
                                      )}
                                      title={step.label}
                                    />
                                    {idx < TIMELINE_STEPS.length - 1 && (
                                      <div 
                                        className={cn(
                                          "h-[2px] w-4 transition-all duration-300",
                                          idx < stepIndex ? "bg-emerald-400" : "bg-slate-150 bg-slate-200"
                                        )}
                                      />
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                            {/* Current Step Label */}
                            <span className="text-[10px] font-extrabold text-slate-500 block">
                              {TIMELINE_STEPS.find(s => s.key === b.status)?.label || b.status}
                            </span>
                          </div>
                        )}
                      </TableCell>

                      {/* Payment Meter Progress Bar */}
                      <TableCell className="py-4.5 px-6 text-left">
                        <div className="space-y-1.5 max-w-[150px]">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-extrabold text-slate-500">
                              {b.amount_paid.toLocaleString()} / {(b.total_price || 0).toLocaleString()} DZD
                            </span>
                            <span className={cn(
                              "font-black text-[9px] px-1 rounded",
                              isFullyPaid ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50"
                            )}>
                              {paymentPercentage}%
                            </span>
                          </div>
                          {/* visual progress bar fill */}
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                            <div 
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                isFullyPaid ? "bg-emerald-500" : "bg-indigo-600"
                              )}
                              style={{ width: `${paymentPercentage}%` }}
                            />
                          </div>
                          {unpaidAmount > 0 && (
                            <span className="text-[9px] text-amber-600 font-semibold block">
                              Reste: {unpaidAmount.toLocaleString()} DZD
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Created date */}
                      <TableCell className="py-4.5 px-6 text-left text-slate-400 text-xs font-semibold">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-350" />
                          <span>{b.created_at ? format(new Date(b.created_at), 'dd MMM yyyy') : ''}</span>
                        </div>
                      </TableCell>

                      {/* Operations / Actions dropdown or rows */}
                      <TableCell className="py-4.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Details sheet */}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-xs font-bold text-slate-600 border-slate-250 border-slate-200 bg-white rounded-xl hover:bg-slate-50 hover:text-slate-800"
                            onClick={() => setSelectedBooking(b)}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" /> Gérer
                          </Button>

                          {/* Quick Send WhatsApp Reminder if partially/unpaid */}
                          {unpaidAmount > 0 && b.status !== 'cancelled' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              title="Envoyer rappel WhatsApp d'acompte"
                              className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl"
                              onClick={() => handleSendWhatsAppReminder(b)}
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          )}

                          {/* Quick Generate Invoice */}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="Imprimer Facture"
                            className="h-8 w-8 p-0 text-indigo-650 text-indigo-600 hover:bg-indigo-50 rounded-xl"
                            onClick={() => setInvoiceBooking(b)}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          
                          {/* Compact Advance Lifecycle controls */}
                          {b.status === 'paid' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              title="Marquer comme Parti"
                              className="h-8 w-8 p-0 text-sky-600 hover:bg-sky-50 rounded-xl"
                              onClick={() => handleStatusChange(b.id, 'departed')}
                            >
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          )}

                          {b.status === 'departed' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              title="Marquer comme Terminé"
                              className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-50 rounded-xl"
                              onClick={() => handleStatusChange(b.id, 'completed')}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Dynamic Booking Details Slide Drawer Sheet */}
      <Sheet open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <SheetContent className="sm:max-w-xl overflow-y-auto font-geist text-left border-l border-slate-200/80 p-0">
          {selectedBooking && (
            <div className="flex flex-col h-full bg-[#f8fafc]">
              
              {/* Drawer Header Area */}
              <div className="bg-white border-b border-slate-200/80 p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-widest font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                      Dossier Voyageur #{selectedBooking.id.substring(0, 8).toUpperCase()}
                    </span>
                    <h2 className="text-lg font-black text-slate-800 mt-1">
                      {((selectedBooking.client_manifest as any)?.name) || 'Client Voyageur'}
                    </h2>
                  </div>
                  <div>
                    {selectedBooking.status === 'cancelled' ? (
                      <Badge className="bg-slate-100 text-slate-500 border border-slate-200 rounded-full font-bold text-xs px-2.5 py-0.5">
                        Annulé
                      </Badge>
                    ) : (
                      <Badge className="bg-indigo-50 text-indigo-600 border border-indigo-150 border-indigo-200 rounded-full font-extrabold text-xs px-2.5 py-0.5">
                        {TIMELINE_STEPS.find(s => s.key === selectedBooking.status)?.label || selectedBooking.status}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Progress Timeline inside Details Drawer */}
                {selectedBooking.status !== 'cancelled' && (
                  <div className="bg-slate-50 border border-slate-150 border-slate-200 rounded-2xl p-4">
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block mb-2">Suivi du dossier</span>
                    <div className="flex items-center justify-between">
                      {TIMELINE_STEPS.map((step, idx) => {
                        const stepIndex = TIMELINE_STEPS.findIndex(s => s.key === selectedBooking.status)
                        const isCurrent = step.key === selectedBooking.status
                        const isPast = idx < stepIndex

                        return (
                          <div key={step.key} className="flex flex-col items-center flex-1 relative">
                            {/* Dot */}
                            <button
                              disabled={isUpdating}
                              onClick={() => handleStatusChange(selectedBooking.id, step.key as any)}
                              className={cn(
                                "h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-black z-10 transition-all duration-300 shadow-sm border focus:outline-none",
                                isCurrent ? "bg-indigo-600 text-white border-indigo-600 ring-4 ring-indigo-100" : "",
                                isPast ? "bg-emerald-500 text-white border-emerald-500" : "",
                                !isCurrent && !isPast ? "bg-white text-slate-400 border-slate-200 hover:bg-slate-100" : ""
                              )}
                              title={`Basculer vers: ${step.label}`}
                            >
                              {isPast ? <Check className="h-3 w-3" /> : (idx + 1)}
                            </button>

                            {/* Connection bar */}
                            {idx < TIMELINE_STEPS.length - 1 && (
                              <div 
                                className={cn(
                                  "absolute top-2.5 left-[calc(50%+10px)] right-[calc(-50%+10px)] h-[2px] -z-0",
                                  idx < stepIndex ? "bg-emerald-400" : "bg-slate-200"
                                )}
                              />
                            )}
                            
                            <span className={cn(
                              "text-[8px] font-extrabold mt-1.5 text-center block whitespace-nowrap",
                              isCurrent ? "text-indigo-600" : "text-slate-400"
                            )}>
                              {step.label}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Scrollable Tabs Segment */}
              <div className="flex-1 overflow-y-auto p-6">
                <Tabs defaultValue="summary" className="w-full space-y-5">
                  <TabsList className="grid w-full grid-cols-4 bg-white border border-slate-200 rounded-2xl p-1 h-auto shadow-sm">
                    <TabsTrigger value="summary" className="text-[10px] font-bold py-2 rounded-xl">Résumé</TabsTrigger>
                    <TabsTrigger value="documents" className="text-[10px] font-bold py-2 rounded-xl">Documents</TabsTrigger>
                    <TabsTrigger value="payments" className="text-[10px] font-bold py-2 rounded-xl">Paiements</TabsTrigger>
                    <TabsTrigger value="notes" className="text-[10px] font-bold py-2 rounded-xl">Notes</TabsTrigger>
                  </TabsList>

                  {/* TAB 1: SUMMARY DETAILS */}
                  <TabsContent value="summary" className="space-y-4 outline-none">
                    {/* General Summary Card */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                      <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2">
                        Détails de la réservation
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-y-3.5 text-xs">
                        <div className="text-slate-400 font-semibold">Téléphone</div>
                        <div className="font-bold text-slate-700">{((selectedBooking.client_manifest as any)?.phone) || 'N/A'}</div>

                        <div className="text-slate-400 font-semibold">Adresse Email</div>
                        <div className="font-bold text-slate-700 truncate">{((selectedBooking.client_manifest as any)?.email) || 'N/A'}</div>

                        <div className="text-slate-400 font-semibold">Adultes / Enfants</div>
                        <div className="font-bold text-slate-700">
                          {((selectedBooking.client_manifest as any)?.adults) || 1} Adulte(s) • {((selectedBooking.client_manifest as any)?.children) || 0} Enfant(s)
                        </div>

                        <div className="text-slate-400 font-semibold">Date de création</div>
                        <div className="font-bold text-slate-700">
                          {selectedBooking.created_at ? format(new Date(selectedBooking.created_at), 'PPP p') : ''}
                        </div>
                      </div>
                    </div>

                    {/* Circuit Summary Card */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wide">
                          Circuit Réservé
                        </h3>
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                          {getTripInfo(selectedBooking.trip_id).type}
                        </span>
                      </div>
                      
                      <div className="flex gap-4">
                        <div className="relative h-16 w-20 shrink-0">
                          <Image 
                            src={getTripInfo(selectedBooking.trip_id).thumbnail} 
                            alt="thumbnail" 
                            fill
                            sizes="80px"
                            quality={75}
                            className="object-cover rounded-2xl shadow-sm border border-slate-200"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="font-extrabold text-slate-800 text-sm block">
                            {getTripInfo(selectedBooking.trip_id).title}
                          </span>
                          <span className="text-xs text-slate-400 font-medium block">
                            Durée: {getTripInfo(selectedBooking.trip_id).duration} Jours / {getTripInfo(selectedBooking.trip_id).duration - 1} Nuits
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Budget & Receivable Card */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                      <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2">
                        Résumé Comptable
                      </h3>

                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Prix Total Facturé</span>
                          <span className="text-2xl font-black text-slate-800">
                            {(selectedBooking.total_price || 0).toLocaleString()} DZD
                          </span>
                        </div>
                        <div className="text-right space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Solde Restant</span>
                          <span className="text-sm font-black text-amber-600">
                            {((selectedBooking.total_price || 0) - selectedBooking.amount_paid).toLocaleString()} DZD
                          </span>
                        </div>
                      </div>

                      {/* Visual Ledger bar indicator */}
                      <div className="space-y-1.5 pt-2">
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                          <div 
                            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                            style={{ width: `${selectedBooking.total_price ? Math.round((selectedBooking.amount_paid/selectedBooking.total_price)*100) : 0}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold">
                          <span>Montant Encaissé: {selectedBooking.amount_paid.toLocaleString()} DZD</span>
                          <span>{selectedBooking.total_price ? Math.round((selectedBooking.amount_paid/selectedBooking.total_price)*100) : 0}%</span>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* TAB 2: CLIENT DOCUMENTS CHECKLIST */}
                  <TabsContent value="documents" className="space-y-4 outline-none">
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wide">
                          Pièces Justificatives (Dossier Visa/Vol)
                        </h3>
                        <span className="text-[10px] font-semibold text-slate-400">Cliquez pour valider la pièce</span>
                      </div>

                      <div className="space-y-3">
                        {selectedBooking.documents.map(doc => (
                          <div 
                            key={doc.id} 
                            className={cn(
                              "p-3.5 border rounded-2xl transition flex items-center justify-between gap-3",
                              doc.status === 'approved' ? "bg-emerald-50/20 border-emerald-100" : "bg-slate-50/50 border-slate-200"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleToggleDocStatus(doc.id)}
                                className={cn(
                                  "h-5 w-5 rounded-lg border flex items-center justify-center transition focus:outline-none",
                                  doc.status === 'approved' 
                                    ? "bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-100" 
                                    : "bg-white border-slate-300 hover:border-slate-400"
                                )}
                              >
                                {doc.status === 'approved' && <Check className="h-3.5 w-3.5" />}
                              </button>

                              <div className="space-y-0.5">
                                <span className={cn(
                                  "text-xs font-bold block",
                                  doc.status === 'approved' ? "text-emerald-800" : "text-slate-700"
                                )}>
                                  {doc.name}
                                </span>
                                {doc.uploadedAt && (
                                  <span className="text-[9px] text-slate-400 font-semibold block">
                                    Chargé le: {format(new Date(doc.uploadedAt), 'dd MMM yyyy à HH:mm')}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              {doc.status !== 'missing' ? (
                                <>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    title="Visualiser le document" 
                                    className="h-7 w-7 p-0 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"
                                    onClick={() => alert(`Visualisation simulée de: ${doc.name}`)}
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    title="Télécharger" 
                                    className="h-7 w-7 p-0 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"
                                    onClick={() => alert(`Téléchargement simulé de: ${doc.name}`)}
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              ) : (
                                <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                  Absent
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Info alert banner */}
                      <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex gap-2">
                        <Info className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-indigo-750 font-medium leading-relaxed">
                          La validation de tous les documents est requise par notre agent de comptoir pour l'attribution définitive des sièges et l'émission des e-Visas.
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  {/* TAB 3: BILLING LEDGER HISTORY & ADD PAYMENT */}
                  <TabsContent value="payments" className="space-y-4 outline-none">
                    {/* Add Payment Dialog Form inside Sheet Drawer */}
                    {isRecordingPayment ? (
                      <div className="bg-white border border-indigo-200 rounded-3xl p-5 shadow-sm space-y-4 relative overflow-hidden">
                        <div className="absolute right-0 top-0 h-full w-1 bg-indigo-500" />
                        
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <h4 className="font-black text-xs text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                            <Plus className="h-4 w-4" /> Enregistrer un Encaissement
                          </h4>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setIsRecordingPayment(false)}
                            className="h-7 w-7 p-0 rounded-full hover:bg-slate-100"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        <div className="space-y-3.5 text-xs">
                          {/* Amount */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Montant à Encaisser (DZD)</label>
                            <div className="relative">
                              <input 
                                type="number" 
                                placeholder="Ex: 50000"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                className="w-full text-xs bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl pl-8 pr-3 py-2.5 outline-none font-bold text-slate-800"
                              />
                              <span className="absolute left-3 top-2.5 text-slate-400 font-extrabold">DZD</span>
                            </div>
                          </div>

                          {/* Method select */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Mode de Règlement</label>
                            <select
                              value={paymentMethod}
                              onChange={(e) => setPaymentMethod(e.target.value as any)}
                              className="w-full text-xs bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-2 py-2.5 outline-none font-bold text-slate-800"
                            >
                              <option value="ccp">Versement CCP</option>
                              <option value="cash">Espèces en Agence</option>
                              <option value="edahabia">Carte Edahabia (CIB)</option>
                              <option value="bank_transfer">Virement Bancaire</option>
                              <option value="check">Chèque de Banque</option>
                            </select>
                          </div>

                          {/* Reference Receipt */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Référence / Reçu</label>
                            <input 
                              type="text" 
                              placeholder="Ex: CCP-992211 ou Numéro de reçu"
                              value={paymentRef}
                              onChange={(e) => setPaymentRef(e.target.value)}
                              className="w-full text-xs bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-3 py-2.5 outline-none font-semibold text-slate-800"
                            />
                          </div>

                          <div className="pt-2 flex gap-2">
                            <Button 
                              onClick={handleRecordPayment}
                              disabled={!paymentAmount || Number(paymentAmount) <= 0}
                              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl transition"
                            >
                              Valider l'encaissement
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => setIsRecordingPayment(false)}
                              className="w-full border-slate-200 text-slate-600 text-xs font-bold py-2.5 rounded-xl hover:bg-slate-50"
                            >
                              Annuler
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">Mouvements comptables</span>
                        {((selectedBooking.total_price || 0) - selectedBooking.amount_paid) > 0 && selectedBooking.status !== 'cancelled' && (
                          <Button 
                            onClick={() => setIsRecordingPayment(true)}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 h-8 text-xs font-black rounded-xl px-3 flex items-center gap-1.5"
                          >
                            <Plus className="h-3.5 w-3.5" /> Ajouter un paiement
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Payments History Ledger List */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                      <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2">
                        Historique des règlements
                      </h3>

                      {selectedBooking.payments.length === 0 ? (
                        <p className="text-center py-6 text-slate-400 text-xs font-medium">Aucune transaction enregistrée.</p>
                      ) : (
                        <div className="space-y-3">
                          {selectedBooking.payments.map((p, idx) => (
                            <div key={p.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-150 flex items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-3">
                                <span className="h-8 w-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-black">
                                  {idx + 1}
                                </span>
                                <div className="space-y-0.5">
                                  <span className="font-black text-slate-850 block">{p.amount.toLocaleString()} DZD</span>
                                  <span className="text-[9px] text-slate-400 font-semibold block">
                                    Mode: {p.method.toUpperCase()} • Réf: {p.reference}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right space-y-0.5">
                                <span className="text-[9px] text-slate-400 font-bold block">
                                  {format(new Date(p.date), 'dd MMM yyyy à HH:mm')}
                                </span>
                                <Button 
                                  variant="ghost" 
                                  className="h-6 px-1.5 text-[9px] text-indigo-650 text-indigo-600 rounded-lg hover:bg-indigo-50/50 font-bold"
                                  onClick={() => alert(`Impression du reçu de transaction #${p.id} simulée.`)}
                                >
                                  Imprimer reçu
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* TAB 4: PRIVATE NOTES SYSTEM */}
                  <TabsContent value="notes" className="space-y-4 outline-none">
                    {/* Note input area */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
                      <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide">
                        Nouvelle Annotation Privée (Équipe)
                      </h4>
                      <textarea
                        rows={2}
                        placeholder="Ex: Demande un lit bébé ou a payé par CCP principal..."
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl p-3 outline-none text-slate-800 transition leading-relaxed resize-none"
                      />
                      <div className="flex justify-end">
                        <Button
                          onClick={handleAddNote}
                          disabled={!newNoteText.trim()}
                          className="bg-indigo-650 bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs font-bold rounded-xl px-4"
                        >
                          Publier la note
                        </Button>
                      </div>
                    </div>

                    {/* Agent private yellow notes layout */}
                    <div className="space-y-3">
                      {selectedBooking.notes.map(n => (
                        <div key={n.id} className="p-4 bg-yellow-50/50 border border-yellow-100 rounded-3xl space-y-2 relative group shadow-sm text-xs">
                          <div className="flex justify-between items-center text-[10px] text-yellow-800/80 font-semibold border-b border-yellow-100/50 pb-1.5">
                            <span>Écrit par: {n.author}</span>
                            <span>{format(new Date(n.date), 'dd MMM à HH:mm')}</span>
                          </div>
                          <p className="text-slate-700 leading-relaxed font-semibold text-xs py-1">
                            {n.text}
                          </p>
                          <button
                            onClick={() => handleDeleteNote(n.id)}
                            className="absolute top-2.5 right-2.5 h-6 w-6 text-slate-400 hover:text-red-500 rounded-lg hover:bg-yellow-100/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition focus:outline-none"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Drawer footer operations actions */}
              <div className="bg-white border-t border-slate-200/80 p-6 flex gap-3">
                <Button
                  onClick={() => setInvoiceBooking(selectedBooking)}
                  className="w-full bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 text-xs font-bold py-2.5 rounded-xl shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Printer className="h-4 w-4 text-indigo-600" /> Imprimer Facture
                </Button>
                {selectedBooking.status !== 'cancelled' && (
                  <Button
                    onClick={() => handleStatusChange(selectedBooking.id, 'cancelled')}
                    className="w-full bg-white border border-slate-200/80 text-red-600 hover:bg-red-50 text-xs font-bold py-2.5 rounded-xl shadow-sm"
                  >
                    Annuler Réservation
                  </Button>
                )}
              </div>

            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Modern High-End Travel Invoice Modal & Printer */}
      <Dialog open={!!invoiceBooking} onOpenChange={(open) => !open && setInvoiceBooking(null)}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto font-geist text-left border border-slate-200 p-0 shadow-2xl rounded-3xl">
          {invoiceBooking && (
            <div className="flex flex-col bg-white">
              
              {/* Actions row floating inside popup */}
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
                <span className="text-slate-500 text-xs font-extrabold uppercase tracking-wider">Aperçu avant Impression</span>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => window.print()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold h-8 rounded-xl px-3.5 flex items-center gap-1.5 shadow-sm"
                  >
                    <Printer className="h-3.5 w-3.5" /> Imprimer
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setInvoiceBooking(null)}
                    className="text-xs h-8 border-slate-200 rounded-xl px-3 hover:bg-slate-100 text-slate-600"
                  >
                    Fermer
                  </Button>
                </div>
              </div>

              {/* Real Print-ready Document Container */}
              <div id="print-area" className="p-8 space-y-6 text-slate-800 leading-normal text-xs print:p-0">
                {/* Invoice Letterhead */}
                <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="h-4 w-4 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-[10px] text-white">✈</span>
                      <h2 className="text-lg font-black text-slate-900 tracking-tight">ALGÉRIE TRAVEL SAAS</h2>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">Bureaux d'Alger Centre, Algérie • Tél: +213 21 00 00 00</p>
                    <p className="text-[10px] text-slate-400 font-medium">Email: contact@algerietravel.dz • RC: 16/00-99831B</p>
                  </div>
                  <div className="text-right space-y-1">
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">FACTURE</h1>
                    <span className="text-[10px] text-slate-400 block font-bold">Réf: FACT-{invoiceBooking.id.substring(0,8).toUpperCase()}</span>
                    <span className="text-[10px] text-slate-400 block font-semibold">Date d'émission: {format(new Date(), 'dd/MM/yyyy')}</span>
                  </div>
                </div>

                {/* Billing details row */}
                <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4.5 rounded-2xl border border-slate-100">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">Facturé à (Client Voyageur)</span>
                    <span className="font-extrabold text-slate-800 text-sm block">
                      {((invoiceBooking.client_manifest as any)?.name) || 'Client Voyageur'}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-medium">Tél: {((invoiceBooking.client_manifest as any)?.phone) || 'N/A'}</span>
                    <span className="text-[10px] text-slate-400 block font-medium">Email: {((invoiceBooking.client_manifest as any)?.email) || 'N/A'}</span>
                  </div>
                  <div className="space-y-1 text-right">
                    <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">Détails du Séjour</span>
                    <span className="font-extrabold text-slate-800 text-xs block truncate">
                      {getTripInfo(invoiceBooking.trip_id).title}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-medium">Type: {getTripInfo(invoiceBooking.trip_id).type}</span>
                    <span className="text-[10px] text-slate-400 block font-medium">Date réservation: {invoiceBooking.created_at ? format(new Date(invoiceBooking.created_at), 'dd/MM/yyyy') : ''}</span>
                  </div>
                </div>

                {/* Table Breakdown ledger */}
                <div className="space-y-2">
                  <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">Détails de la prestation</span>
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/50">
                        <th className="py-2.5 px-3 font-bold text-slate-500 text-[10px] uppercase">Description Prestation</th>
                        <th className="py-2.5 px-3 font-bold text-slate-500 text-[10px] uppercase text-center">Voyageurs</th>
                        <th className="py-2.5 px-3 font-bold text-slate-500 text-[10px] uppercase text-right">Prix Unitaire</th>
                        <th className="py-2.5 px-3 font-bold text-slate-500 text-[10px] uppercase text-right">Total HT</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-100">
                        <td className="py-3.5 px-3">
                          <span className="font-bold text-slate-800 block">{getTripInfo(invoiceBooking.trip_id).title}</span>
                          <span className="text-[10px] text-slate-400 font-semibold block">Hébergement, vols & transferts inclus</span>
                        </td>
                        <td className="py-3.5 px-3 text-center font-bold">
                          {((invoiceBooking.client_manifest as any)?.adults || 1) + ((invoiceBooking.client_manifest as any)?.children || 0)} Pax
                        </td>
                        <td className="py-3.5 px-3 text-right font-medium">
                          {(invoiceBooking.total_price || 0).toLocaleString()} DZD
                        </td>
                        <td className="py-3.5 px-3 text-right font-bold text-slate-800">
                          {(invoiceBooking.total_price || 0).toLocaleString()} DZD
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Totals and QR Code block */}
                <div className="flex justify-between items-start pt-4 border-t border-slate-200">
                  {/* Terms & QR */}
                  <div className="space-y-2 max-w-[300px]">
                    <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">Conditions & Cachet</span>
                    <p className="text-[9px] text-slate-400 font-semibold leading-relaxed">
                      Conditions de voyage soumises à la réglementation algérienne en vigueur. Aucun remboursement n'est possible après émission des billets sauf conditions d'assurance.
                    </p>
                    {/* Mock QR Code for validation */}
                    <div className="flex items-center gap-2 pt-2">
                      <div className="h-14 w-14 bg-slate-100 border border-slate-250 border-slate-200 rounded-lg flex items-center justify-center font-black text-slate-300 text-[8px] select-none uppercase tracking-widest shrink-0">
                        QR SCAN
                      </div>
                      <span className="text-[8px] text-slate-400 font-semibold leading-normal">
                        Facture certifiée conforme par le système national de billetterie d'Algérie Travel SaaS.
                      </span>
                    </div>
                  </div>

                  {/* Calculations breakdown block */}
                  <div className="w-[200px] space-y-2 text-right">
                    <div className="flex justify-between text-xs font-semibold text-slate-500">
                      <span>Total Brut :</span>
                      <span>{(invoiceBooking.total_price || 0).toLocaleString()} DZD</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-slate-500">
                      <span>Montant Encaissé :</span>
                      <span>{invoiceBooking.amount_paid.toLocaleString()} DZD</span>
                    </div>
                    <div className="flex justify-between text-xs font-black text-indigo-650 text-indigo-600 bg-indigo-50/50 p-2.5 rounded-2xl mt-1.5 border border-indigo-100/50">
                      <span>Solde Restant :</span>
                      <span>{((invoiceBooking.total_price || 0) - invoiceBooking.amount_paid).toLocaleString()} DZD</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  )
}
