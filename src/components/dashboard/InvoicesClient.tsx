'use client'

import { useState, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Search, Plus, Trash2, Edit3, ChevronRight, FileText, CreditCard, 
  CheckSquare, Square, Check, AlertCircle, Share2, SlidersHorizontal, 
  User, Download, Loader2, CheckCircle2, Play, Send, Copy
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { deleteInvoiceAction, updateInvoiceStatusAction } from '@/app/actions/invoices'
import { format, isPast, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface InvoicesClientProps {
  initialInvoices: any[]
}

export function InvoicesClient({ initialInvoices }: InvoicesClientProps) {
  const router = useRouter()
  const [invoices, setInvoices] = useState(initialInvoices)
  
  const parentRef = useRef<HTMLDivElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')
  
  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Modal / Overlay States for Bulk Simulation
  const [bulkDownloadOpen, setBulkDownloadOpen] = useState(false)
  const [bulkDownloadProgress, setBulkDownloadProgress] = useState(0)
  const [bulkDownloadFile, setBulkDownloadFile] = useState('')
  const [bulkDownloadDone, setBulkDownloadDone] = useState(false)

  // Bulk WhatsApp Relance sequencing modal
  const [relanceModalOpen, setRelanceModalOpen] = useState(false)
  const [relanceIndex, setRelanceIndex] = useState(0)
  const [relancedList, setRelancedList] = useState<Record<string, boolean>>({})

  // Handlers
  const handleSelectRow = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const handleSelectAll = () => {
    if (selectedIds.length === filteredInvoices.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredInvoices.map(inv => inv.id))
    }
  }

  const handleBulkStatusChange = async (status: string) => {
    if (!confirm(`Changer le statut des ${selectedIds.length} factures sélectionnées en "${status}" ?`)) return
    
    let successCount = 0
    for (const id of selectedIds) {
      const res = await updateInvoiceStatusAction(id, status)
      if (res.success) successCount++
    }
    
    alert(`${successCount} factures mises à jour avec succès.`)
    setSelectedIds([])
    window.location.reload()
  }

  const handleBulkDelete = async () => {
    if (!confirm(`ATTENTION: Êtes-vous sûr de vouloir supprimer définitivement les ${selectedIds.length} factures sélectionnées ? Cette opération est irréversible.`)) return
    
    let successCount = 0
    for (const id of selectedIds) {
      const res = await deleteInvoiceAction(id)
      if (res.success) successCount++
    }

    alert(`${successCount} factures supprimées.`)
    setSelectedIds([])
    window.location.reload()
  }

  // Auto-WhatsApp Relance
  const handleSendWhatsAppReminder = (invoice: any) => {
    if (!invoice.client?.phone) {
      alert("Ce client n'a pas de numéro de téléphone enregistré.")
      return
    }
    const cleanPhone = invoice.client.phone.replace(/[^0-9]/g, '')
    const message = `Salam alaykoum ${invoice.client.full_name}, l'équipe d'Algérie Travel vous rappelle gentiment que la facture ${invoice.invoice_number} de ${invoice.total_amount.toLocaleString()} DZD (Solde restant dû: ${invoice.balance_due.toLocaleString()} DZD) est arrivée à échéance. Nous vous prions de régulariser par virement CCP (N° 0021876532 Clé 89 au nom de Amalou Achraf) ou en agence. Baraka Allahou fikoum.`
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  // Simulated Bulk PDF downloader
  const handleBulkPDFDownload = () => {
    setBulkDownloadOpen(true)
    setBulkDownloadProgress(0)
    setBulkDownloadDone(false)
    
    const itemsToDownload = invoices.filter(inv => selectedIds.includes(inv.id))
    let idx = 0
    
    const interval = setInterval(() => {
      if (idx < itemsToDownload.length) {
        const inv = itemsToDownload[idx]
        setBulkDownloadFile(`Facture-${inv.invoice_number}.pdf`)
        setBulkDownloadProgress(Math.round(((idx + 1) / itemsToDownload.length) * 100))
        idx++
      } else {
        clearInterval(interval)
        setBulkDownloadDone(true)
        setTimeout(() => {
          setBulkDownloadOpen(false)
          setSelectedIds([])
        }, 1500)
      }
    }, 900)
  }

  // Interactive WhatsApp Relance Loop
  const overdueSelected = invoices.filter(inv => {
    const isSel = selectedIds.includes(inv.id)
    const isDatePast = isPast(parseISO(inv.due_date))
    const isOverdue = inv.status !== 'paid' && inv.status !== 'cancelled' && isDatePast
    return isSel && isOverdue
  })

  const handleStartWhatsAppRelanceLoop = () => {
    if (overdueSelected.length === 0) {
      alert("Aucune facture sélectionnée n'est en retard ou éligible aux relances.")
      return
    }
    setRelanceIndex(0)
    setRelancedList({})
    setRelanceModalOpen(true)
  }

  const triggerNextRelanceWhatsApp = (invoice: any) => {
    handleSendWhatsAppReminder(invoice)
    setRelancedList(prev => ({ ...prev, [invoice.id]: true }))
    if (relanceIndex < overdueSelected.length - 1) {
      setRelanceIndex(relanceIndex + 1)
    } else {
      setTimeout(() => {
        alert("Séquence de relance terminée.")
        setRelanceModalOpen(false)
        setSelectedIds([])
      }, 1000)
    }
  }

  // Stats calculation
  const totalInvoiced = invoices.reduce((acc, inv) => acc + Number(inv.total_amount || 0), 0)
  const totalPaid = invoices.reduce((acc, inv) => acc + Number(inv.amount_paid || 0), 0)
  const totalBalanceDue = invoices.reduce((acc, inv) => acc + Number(inv.balance_due || 0), 0)
  
  const overdueInvoices = invoices.filter(inv => {
    const isOverdueStatus = inv.status !== 'paid' && inv.status !== 'cancelled'
    const isDatePast = isPast(parseISO(inv.due_date))
    return isOverdueStatus && isDatePast
  })
  const overdueCount = overdueInvoices.length

  // Filter Invoices
  const filteredInvoices = invoices.filter(inv => {
    const query = searchQuery.toLowerCase().trim()
    const matchesQuery = 
      inv.invoice_number.toLowerCase().includes(query) || 
      (inv.client?.full_name && inv.client.full_name.toLowerCase().includes(query))
    
    let matchesStatus = true
    if (statusFilter === 'all') matchesStatus = true
    else if (statusFilter === 'overdue') {
      matchesStatus = inv.status !== 'paid' && inv.status !== 'cancelled' && isPast(parseISO(inv.due_date))
    } else {
      matchesStatus = inv.status === statusFilter
    }

    const matchesMethod = methodFilter === 'all' || inv.payment_method === methodFilter

    return matchesQuery && matchesStatus && matchesMethod
  })

  const rowVirtualizer = useVirtualizer({
    count: filteredInvoices?.length || 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 5,
  })

  const getInvoiceStatusBadge = (inv: any) => {
    const isDatePast = isPast(parseISO(inv.due_date))
    const isOverdue = inv.status !== 'paid' && inv.status !== 'cancelled' && isDatePast

    if (isOverdue) {
      return (
        <Badge variant="outline" className="rounded-xl px-2 py-0.5 text-[10px] font-bold bg-red-50 text-red-600 border-red-200 animate-pulse flex items-center gap-1 shrink-0 shadow-sm shadow-red-100 ring-2 ring-red-100">
          <AlertCircle className="h-3 w-3 text-red-500 shrink-0" />
          En retard (RAPPEL)
        </Badge>
      )
    }

    const mapping: Record<string, { label: string; style: string }> = {
      draft: { label: 'Brouillon', style: 'bg-slate-100 text-slate-655 border-slate-200' },
      sent: { label: 'Envoyée', style: 'bg-blue-50 text-blue-600 border-blue-100' },
      paid: { label: 'Payée', style: 'bg-emerald-50 text-emerald-600 border-emerald-150' },
      partial: { label: 'Partiel', style: 'bg-amber-50 text-amber-600 border-amber-150' },
      cancelled: { label: 'Annulée', style: 'bg-rose-50 text-rose-500 border-rose-100' }
    }
    const current = mapping[inv.status] || { label: inv.status, style: 'bg-slate-100 text-slate-650' }
    return (
      <Badge variant="outline" className={`rounded-xl px-2 py-0.5 text-[10px] font-bold ${current.style}`}>
        {current.label}
      </Badge>
    )
  }

  return (
    <div className="space-y-6 p-6 bg-[#f4f5f7] min-h-[calc(100vh-54px)] overflow-y-auto text-left font-geist">
      {/* Header and Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-indigo-600" />
            Gestion des Factures (Factures & CCP)
          </h1>
          <p className="text-slate-400 text-xs mt-1">Émettez des factures professionnelles A4, suivez les versements partiels et partagez les relances par WhatsApp.</p>
        </div>
        <Link href="/dashboard/invoices/new">
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold py-2.5 px-4 flex items-center gap-2 shadow-md shadow-indigo-150 transition-all duration-200 select-none"
          >
            <Plus className="h-4.5 w-4.5" />
            Nouvelle Facture
          </Button>
        </Link>
      </div>

      {/* Finance Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Facturé */}
        <div className="bg-white border border-[#e8eaed] rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-200 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border border-indigo-500/20 flex items-center justify-center text-indigo-650 shadow-sm shrink-0">
            <FileText className="h-5.5 w-5.5 text-indigo-600" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Facturé</span>
            <span className="text-lg font-bold text-slate-800 tracking-tight mt-0.5">{totalInvoiced.toLocaleString()} DZD</span>
          </div>
        </div>

        {/* Total Encaissé */}
        <div className="bg-white border border-[#e8eaed] rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-200 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 flex items-center justify-center text-emerald-650 shadow-sm shrink-0">
            <CreditCard className="h-5.5 w-5.5 text-emerald-650" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Encaissé</span>
            <span className="text-lg font-bold text-emerald-600 tracking-tight mt-0.5">{totalPaid.toLocaleString()} DZD</span>
          </div>
        </div>

        {/* Solde à Recevoir */}
        <div className="bg-white border border-[#e8eaed] rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-200 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 flex items-center justify-center text-amber-655 shadow-sm shrink-0">
            <CreditCard className="h-5.5 w-5.5 text-amber-650" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Solde à Recevoir</span>
            <span className="text-lg font-bold text-amber-650 tracking-tight mt-0.5">{totalBalanceDue.toLocaleString()} DZD</span>
          </div>
        </div>

        {/* Factures en Retard */}
        <div className="bg-white border border-[#e8eaed] rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-200 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-red-500 to-rose-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-red-500/10 to-red-650/5 border border-red-500/20 flex items-center justify-center text-red-650 shadow-sm shrink-0">
            <AlertCircle className="h-5.5 w-5.5 text-red-650" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Factures en Retard</span>
            <span className="text-lg font-bold text-red-655 text-red-600 tracking-tight mt-0.5">{overdueCount}</span>
          </div>
        </div>
      </div>

      {/* Advanced Searching & Filtering */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            className="rounded-xl bg-slate-50 border-0 text-sm focus:bg-white pl-9 transition w-full font-semibold" 
            placeholder="Rechercher par N° de facture ou nom client..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filters Grid */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold font-geist uppercase tracking-wide">Statut</span>
            <select 
              className="bg-transparent border-0 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tous</option>
              <option value="draft">Brouillon</option>
              <option value="sent">Envoyée</option>
              <option value="paid">Payée</option>
              <option value="partial">Partiel</option>
              <option value="overdue">En retard</option>
              <option value="cancelled">Annulée</option>
            </select>
          </div>

          {/* Payment Method */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold font-geist uppercase tracking-wide">Méthode</span>
            <select 
              className="bg-transparent border-0 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
            >
              <option value="all">Toutes</option>
              <option value="CCP">CCP (Algérie)</option>
              <option value="Edahabia">Edahabia</option>
              <option value="Cash">Espèces</option>
              <option value="Bank Transfer">Virement Bancaire</option>
              <option value="Check">Chèque</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Invoices Table */}
      <div className="bg-white rounded-2xl border border-[#e8eaed] shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden relative">
        {filteredInvoices.length > 0 ? (
          <div className="overflow-x-auto">
            <div className="min-w-[1000px] w-full text-left">
              {/* Header */}
              <div className="grid grid-cols-[60px_1.2fr_2fr_1.5fr_1.5fr_1.2fr_1.5fr_2fr] border-b border-[#f0f1f3] bg-[#f9fafb] text-[10px] uppercase font-bold text-gray-500 tracking-wider py-3.5 px-6 select-none items-center">
                <div className="text-center">
                  <button 
                    onClick={handleSelectAll}
                    className="text-slate-400 hover:text-slate-700 transition focus:outline-none flex justify-center mx-auto"
                  >
                    {selectedIds.length === filteredInvoices.length ? (
                      <CheckSquare className="h-4.5 w-4.5 text-indigo-650 text-indigo-600" />
                    ) : (
                      <Square className="h-4.5 w-4.5" />
                    )}
                  </button>
                </div>
                <div>N° Facture</div>
                <div>Voyageur / Client</div>
                <div>Montant Total</div>
                <div>Reste à Payer</div>
                <div>Échéance</div>
                <div className="text-center">Statut</div>
                <div className="text-right">Actions</div>
              </div>

              {/* Scrollable Virtual Body */}
              <div
                ref={parentRef}
                className="max-h-[550px] overflow-y-auto relative divide-y divide-slate-150 text-slate-700 text-xs"
              >
                <div
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const invoice = filteredInvoices[virtualRow.index]
                    const isSelected = selectedIds.includes(invoice.id)
                    
                    // Check if overdue
                    const isDatePast = isPast(parseISO(invoice.due_date))
                    const isOverdue = invoice.status !== 'paid' && invoice.status !== 'cancelled' && isDatePast

                    return (
                      <div
                        key={invoice.id}
                        data-index={virtualRow.index}
                        ref={rowVirtualizer.measureElement}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                        className={cn(
                          "grid grid-cols-[60px_1.2fr_2fr_1.5fr_1.5fr_1.2fr_1.5fr_2fr] items-center py-3 px-6 hover:bg-slate-50/50 transition duration-150 border-b border-slate-150",
                          isSelected ? "bg-indigo-50/20" : "",
                          isOverdue ? "bg-red-50/10 border-l-[3px] border-l-red-500 animate-pulse-red" : ""
                        )}
                      >
                        <div className="text-center flex justify-center">
                          <button 
                            onClick={() => handleSelectRow(invoice.id)}
                            className="text-slate-400 hover:text-slate-700 transition focus:outline-none"
                          >
                            {isSelected ? (
                              <CheckSquare className="h-4.5 w-4.5 text-indigo-650 text-indigo-600" />
                            ) : (
                              <Square className="h-4.5 w-4.5" />
                            )}
                          </button>
                        </div>
                        <div className="font-mono font-black text-slate-850 text-sm">
                          {invoice.invoice_number}
                        </div>
                        <div>
                          {invoice.client ? (
                            <Link href={`/dashboard/clients/${invoice.client.id}`} className="hover:underline font-bold text-slate-850">
                              {invoice.client.full_name}
                            </Link>
                          ) : (
                            <span className="text-slate-400 italic">Client Inconnu</span>
                          )}
                        </div>
                        <div className="font-black text-slate-850">
                          {invoice.total_amount.toLocaleString()} DZD
                        </div>
                        <div className="font-extrabold text-red-600">
                          {invoice.balance_due.toLocaleString()} DZD
                        </div>
                        <div className="text-slate-400 font-bold">
                          {format(parseISO(invoice.due_date), 'd MMM yyyy', { locale: fr })}
                        </div>
                        <div className="text-center flex justify-center">
                          {getInvoiceStatusBadge(invoice)}
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          {/* Duplicate Cloner Link */}
                          <Link href={`/dashboard/invoices/new?duplicate_id=${invoice.id}`} title="Dupliquer la facture">
                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl hover:bg-slate-100 hover:text-slate-800 text-slate-400 transition">
                              <Copy className="h-4 w-4" />
                            </Button>
                          </Link>

                          {isOverdue && invoice.client?.phone && (
                            <Button 
                              size="xs" 
                              variant="outline" 
                              onClick={() => handleSendWhatsAppReminder(invoice)}
                              className="h-8 rounded-xl px-2.5 border-red-200 text-red-655 text-red-600 bg-red-50/50 hover:bg-red-55 hover:text-white flex items-center gap-1 transition"
                            >
                              <Share2 className="h-3 w-3 shrink-0" />
                              Relance WA
                            </Button>
                          )}
                          <Link href={`/dashboard/invoices/${invoice.id}`}>
                            <Button size="icon" variant="outline" className="h-8 w-8 rounded-xl border-slate-200 text-slate-500 hover:text-indigo-650 hover:border-indigo-200 hover:bg-indigo-50/20 transition">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="py-16 px-6 text-center max-w-md mx-auto select-none">
            <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-450 border border-slate-200/50 shadow-inner">
              <FileText className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-slate-800 font-bold text-base mt-5">Aucune facture émise</h3>
            <p className="text-slate-400 text-xs mt-2">Votre agence n'a pas encore créé de facture pour ce filtre de recherche. Émettez une nouvelle facture professionnelle en quelques clics.</p>
            <div className="mt-6 flex justify-center gap-3">
              <Link href="/dashboard/invoices/new">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm transition">
                  Créer une Facture
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Floating Bulk Actions Toolbar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white py-3 px-5 rounded-3xl shadow-2xl flex items-center gap-5 z-50 animate-bounce select-none border border-slate-850">
          <span className="text-[11px] font-black text-slate-350 tracking-wider">
            <span className="text-white font-extrabold">{selectedIds.length}</span> SÉLECTIONNÉES
          </span>

          <div className="h-4 w-px bg-slate-800" />

          <div className="flex items-center gap-2 text-xs font-bold">
            <Button 
              size="sm" 
              onClick={() => handleBulkStatusChange('paid')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl py-1 px-3"
            >
              Paiement Reçu
            </Button>
            
            <Button 
              size="sm" 
              onClick={() => handleBulkStatusChange('sent')}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-1 px-3"
            >
              Marquer Envoyée
            </Button>

            <Button 
              size="sm" 
              onClick={handleBulkPDFDownload}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-1 px-3 flex items-center gap-1"
            >
              <Download className="h-3.5 w-3.5" /> PDF A4
            </Button>

            {overdueSelected.length > 0 && (
              <Button 
                size="sm" 
                onClick={handleStartWhatsAppRelanceLoop}
                className="bg-red-600 hover:bg-red-700 text-white rounded-2xl py-1 px-3 flex items-center gap-1"
              >
                <Send className="h-3.5 w-3.5" /> Relances Overdue ({overdueSelected.length})
              </Button>
            )}

            <Button 
              size="sm" 
              onClick={handleBulkDelete}
              className="bg-red-950 text-red-400 hover:bg-red-900 rounded-2xl py-1 px-3 flex items-center gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          <button 
            onClick={() => setSelectedIds([])}
            className="text-[10px] font-black uppercase text-slate-400 hover:text-white transition"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Simulated Bulk PDF Compiler Modal */}
      <Dialog open={bulkDownloadOpen} onOpenChange={setBulkDownloadOpen}>
        <DialogContent className="max-w-xs overflow-hidden font-geist text-left border border-slate-100 p-6 shadow-2xl rounded-3xl bg-white select-none">
          <div className="flex flex-col items-center gap-4 text-center">
            {bulkDownloadDone ? (
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-650 flex items-center justify-center border border-emerald-100">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
            ) : (
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-650 flex items-center justify-center border border-indigo-100 animate-spin">
                <Loader2 className="h-6 w-6 text-indigo-600" />
              </div>
            )}
            
            <div className="space-y-1">
              <h4 className="font-black text-slate-850 text-sm">
                {bulkDownloadDone ? 'Téléchargement réussi' : 'Compilateur PDF en Cours'}
              </h4>
              <p className="text-[11px] text-slate-450 font-bold uppercase tracking-wider mt-0.5">
                {bulkDownloadDone ? 'Toutes les factures ont été empaquetées' : `Assemblage de: ${bulkDownloadFile}`}
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
              <div 
                className="bg-indigo-600 h-full transition-all duration-300"
                style={{ width: `${bulkDownloadProgress}%` }}
              />
            </div>
            <span className="text-xs font-black text-indigo-600 mt-1">{bulkDownloadProgress}% completé</span>
          </div>
        </DialogContent>
      </Dialog>

      {/* Interactive Bulk WhatsApp Relance modal */}
      <Dialog open={relanceModalOpen} onOpenChange={setRelanceModalOpen}>
        <DialogContent className="max-w-md overflow-hidden font-geist text-left border border-slate-100 p-0 shadow-2xl rounded-3xl bg-white select-none">
          <DialogHeader className="p-5 bg-slate-50 border-b border-slate-150">
            <DialogTitle className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Send className="h-4.5 w-4.5 text-red-500" />
              Séquenceur de Relances Groupées WhatsApp
            </DialogTitle>
            <DialogDescription className="text-[11px] text-slate-400">
              Traitez de façon semi-automatisée les {overdueSelected.length} relances WhatsApp pour les dossiers en retard.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-4">
            {overdueSelected.map((inv, idx) => {
              const isActive = idx === relanceIndex
              const isDone = relancedList[inv.id]

              return (
                <div 
                  key={inv.id}
                  className={cn(
                    "p-3.5 border rounded-2xl transition duration-150 flex items-center justify-between text-xs",
                    isActive ? "bg-indigo-50 border-indigo-200 text-indigo-950 scale-102" : "bg-slate-50/50 border-slate-200 text-slate-500",
                    isDone ? "bg-emerald-50 border-emerald-250 text-emerald-950" : ""
                  )}
                >
                  <div className="space-y-0.5">
                    <span className="font-black text-slate-850 block">{inv.client?.full_name}</span>
                    <span className="text-[9px] font-mono tracking-wider block text-slate-400">
                      Facture {inv.invoice_number} | Retard: {inv.balance_due.toLocaleString()} DZD
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isDone ? (
                      <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1 uppercase tracking-wider bg-white px-2 py-0.5 rounded-lg border border-emerald-200">
                        ✓ Relancé
                      </span>
                    ) : isActive ? (
                      <Button
                        size="xs"
                        onClick={() => triggerNextRelanceWhatsApp(inv)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold py-1 px-2.5 flex items-center gap-1.5 shadow-sm"
                      >
                        <Play className="h-3 w-3" /> Relancer
                      </Button>
                    ) : (
                      <span className="text-[9px] text-slate-400 font-bold uppercase">En Attente</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <DialogFooter className="p-4 border-t border-slate-150 bg-slate-50 flex items-center justify-between gap-4">
            <span className="text-[10px] font-black text-indigo-650 uppercase tracking-widest block">
              Dossier {relanceIndex + 1} / {overdueSelected.length}
            </span>
            <Button 
              variant="outline" 
              onClick={() => setRelanceModalOpen(false)}
              className="text-xs h-8 border-slate-350 text-slate-700 font-bold rounded-xl"
            >
              Fermer l'Assistant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pulse Red Overdue styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-red {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.05);
          }
          50% {
            box-shadow: 0 0 8px 1px rgba(239, 68, 68, 0.12);
            background-color: rgba(239, 68, 68, 0.02);
          }
        }
        .animate-pulse-red {
          animation: pulse-red 2.5s infinite ease-in-out;
        }
      `}} />
    </div>
  )
}
