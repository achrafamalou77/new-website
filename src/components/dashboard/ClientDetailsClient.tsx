'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, User, Mail, Phone, MapPin, Calendar, FileText, CreditCard, 
  ChevronRight, Edit3, Save, MessageSquare, ClipboardList, BadgeCheck, 
  CheckCircle, MessageCircle, Clock, FolderOpen, ShieldCheck, Eye, 
  Download, Check, AlertCircle, Plus, Trash2, ArrowUpRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import { AddClientModal } from './AddClientModal'
import { updateClientAction } from '@/app/actions/clients'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

interface ClientDetailsClientProps {
  client: any
  invoices: any[]
  allClients: any[]
}

interface VaultDoc {
  id: string;
  name: string;
  type: 'passport' | 'id_card' | 'contract';
  status: 'approved' | 'pending' | 'missing';
  uploadedAt: string;
  previewUrl: string;
}

interface CommTouchpoint {
  id: string;
  platform: 'whatsapp' | 'call' | 'facebook' | 'instagram' | 'email';
  sender: 'customer' | 'agent';
  content: string;
  date: string;
  duration?: string; // for calls
}

export function ClientDetailsClient({ client, invoices, allClients }: ClientDetailsClientProps) {
  const router = useRouter()
  
  // Tabs: overview, invoices, history, timeline, vault, notes
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'history' | 'timeline' | 'vault' | 'notes'>('overview')
  const [modalOpen, setModalOpen] = useState(false)
  const [notesText, setNotesText] = useState(client.notes || '')
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Document Vault State
  const [vaultDocs, setVaultDocs] = useState<VaultDoc[]>([
    { id: 'v-1', name: 'Scannage Passeport Principal', type: 'passport', status: 'approved', uploadedAt: '2026-05-12T10:00:00Z', previewUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop' },
    { id: 'v-2', name: 'Carte CNI Algérienne (Recto/Verso)', type: 'id_card', status: 'approved', uploadedAt: '2026-05-12T10:02:00Z', previewUrl: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400&auto=format&fit=crop' },
    { id: 'v-3', name: 'Contrat d\'Engagement Circuit Turquie', type: 'contract', status: 'pending', uploadedAt: '2026-05-15T14:30:00Z', previewUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=400&auto=format&fit=crop' }
  ])

  // Communication History State
  const [commsFeed, setCommsFeed] = useState<CommTouchpoint[]>([
    { id: 'c-1', platform: 'whatsapp', sender: 'customer', content: 'Salam alaykoum, rani bghit nchouf les disponibilités pour la Turquie le mois prochain svp.', date: '2026-05-14T09:30:00Z' },
    { id: 'c-2', platform: 'whatsapp', sender: 'agent', content: 'وعليكم السلام! لدينا رحلتان مؤكدتان في 10 و18 جوان. هل تفضلون فندق 4 نجوم أو 5 نجوم؟', date: '2026-05-14T09:35:00Z' },
    { id: 'c-3', platform: 'call', sender: 'agent', content: 'Appel sortant - Le client a confirmé sa préférence pour la formule Istanbul 4* avec hébergement en chambre double.', date: '2026-05-14T11:15:00Z', duration: '2 min 45 s' },
    { id: 'c-4', platform: 'whatsapp', sender: 'customer', content: 'C\'est parfait. Je vous envoie les photos des passeports tout de suite pour préparer le visa.', date: '2026-05-14T11:30:00Z' },
    { id: 'c-5', platform: 'email', sender: 'agent', content: 'Confirmation de Réservation & Reçu d\'acompte envoyé automatiquement.', date: '2026-05-14T11:45:00Z' }
  ])

  // New Note addition flow inside tab
  const [newQuickNote, setNewQuickNote] = useState('')
  
  // Document preview modal
  const [activePreviewDoc, setActivePreviewDoc] = useState<VaultDoc | null>(null)

  const handleUpdateSuccess = () => {
    router.refresh()
    setTimeout(() => {
      window.location.reload()
    }, 400)
  }

  // Save notes handler
  const handleSaveNotes = async () => {
    setIsSavingNotes(true)
    setSaveSuccess(false)
    try {
      const res = await updateClientAction(client.id, {
        full_name: client.full_name,
        phone: client.phone,
        email: client.email,
        id_card_number: client.id_card_number,
        passport_number: client.passport_number,
        date_of_birth: client.date_of_birth,
        address: client.address,
        city: client.city,
        source: client.source,
        referred_by_id: client.referred_by_id,
        notes: notesText,
      })

      if (res.success) {
        setSaveSuccess(true)
        router.refresh()
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        alert(res.error || 'Erreur lors de la sauvegarde des notes')
      }
    } catch (e: any) {
      alert(e.message || 'Erreur lors de la sauvegarde')
    } finally {
      setIsSavingNotes(false)
    }
  }

  // Send WhatsApp Invitation
  const handleSendWhatsApp = () => {
    if (!client.phone) {
      alert('Aucun numéro de téléphone disponible.')
      return
    }
    const message = `Salam alaykoum ${client.full_name}, nous espérons que vous allez bien ! L'équipe d'Algérie Travel reste à votre entière disposition pour vos futurs séjours.`
    const encoded = encodeURIComponent(message)
    const cleanPhone = client.phone.replace(/[^0-9+]/g, '')
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank')
  }

  // Add internal quick note
  const handleAddQuickNote = () => {
    if (!newQuickNote.trim()) return
    const appended = `${notesText ? notesText + '\n\n' : ''}[Note du ${format(new Date(), 'dd/MM/yyyy HH:mm')}] : ${newQuickNote.trim()}`
    setNotesText(appended)
    setNewQuickNote('')
    alert('Note ajoutée à la fiche profil. Pensez à sauvegarder les modifications !')
  }

  // Toggle Document Approval Checkbox
  const handleToggleDocApproval = (docId: string) => {
    setVaultDocs(prev => prev.map(d => {
      if (d.id !== docId) return d
      const nextStatus: VaultDoc['status'] = d.status === 'approved' ? 'pending' : 'approved'
      return { ...d, status: nextStatus }
    }))
  }

  // Calculate stats
  const totalInvoiced = invoices.reduce((acc, inv) => acc + Number(inv.total_amount || 0), 0)
  const totalPaid = invoices.reduce((acc, inv) => acc + Number(inv.amount_paid || 0), 0)
  const outstandingBalance = totalInvoiced - totalPaid

  // Spent Tier Category
  const spentTier = useMemo(() => {
    if (totalInvoiced >= 200000) return { label: 'VIP GOLD', style: 'bg-gradient-to-r from-amber-500 to-amber-400 text-white border-amber-300' }
    if (totalInvoiced >= 50000) return { label: 'EXPLORER ACTIVE', style: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
    if (totalInvoiced > 0) return { label: 'STANDARD STANDARD', style: 'bg-slate-50 text-slate-700 border-slate-200' }
    return { label: 'PROSPECT PROSPECT', style: 'bg-slate-100 text-slate-400 border-slate-250 border-slate-200' }
  }, [totalInvoiced])

  const getSourceBadge = (source: string) => {
    const mapping: Record<string, { label: string; style: string }> = {
      walk_in: { label: 'Walk-in (Sur Place)', style: 'bg-slate-100 text-slate-700 border-slate-200' },
      whatsapp: { label: 'WhatsApp', style: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
      facebook: { label: 'Facebook', style: 'bg-blue-50 text-blue-600 border-blue-100' },
      instagram: { label: 'Instagram', style: 'bg-rose-50 text-rose-600 border-rose-100' },
      phone: { label: 'Téléphone', style: 'bg-sky-50 text-sky-655 text-sky-600 border-sky-100' },
      referral: { label: 'Parrainage', style: 'bg-amber-50 text-amber-600 border-amber-100' }
    }
    const current = mapping[source] || { label: source, style: 'bg-slate-100 text-slate-650' }
    return (
      <Badge variant="outline" className={`rounded-xl px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${current.style}`}>
        {current.label}
      </Badge>
    )
  }

  const getInvoiceStatusBadge = (status: string) => {
    const mapping: Record<string, { label: string; style: string }> = {
      draft: { label: 'Brouillon', style: 'bg-slate-100 text-slate-600 border-slate-200' },
      sent: { label: 'Envoyée', style: 'bg-blue-50 text-blue-600 border-blue-100' },
      paid: { label: 'Payée', style: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
      partial: { label: 'Acompte', style: 'bg-amber-50 text-amber-600 border-amber-100' },
      overdue: { label: 'En retard', style: 'bg-red-50 text-red-600 border-red-100' },
      cancelled: { label: 'Annulée', style: 'bg-rose-50 text-rose-500 border-rose-100' }
    }
    const current = mapping[status] || { label: status, style: 'bg-slate-100 text-slate-650' }
    return (
      <Badge variant="outline" className={`rounded-xl px-2 py-0.5 text-[10px] font-bold ${current.style}`}>
        {current.label}
      </Badge>
    )
  }

  const initials = client.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="space-y-6 text-left font-geist p-6 bg-[#f8fafc] h-[calc(100vh-64px)] overflow-y-auto page-enter">
      
      {/* Back button */}
      <Link href="/dashboard/clients" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-700 transition select-none">
        <ArrowLeft className="h-4 w-4" /> Retour au Répertoire
      </Link>

      {/* Main Profile Header Command Center */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white font-black text-xl flex items-center justify-center shadow-md shrink-0 relative">
            {initials}
            <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white" />
          </div>
          <div className="flex flex-col text-left space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-black text-slate-850 tracking-tight">{client.full_name}</h1>
              {getSourceBadge(client.source)}
              <Badge variant="outline" className={cn("rounded-full px-2 py-0.5 text-[9px] font-black tracking-widest", spentTier.style)}>
                {spentTier.label}
              </Badge>
            </div>
            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block">Client ID: {client.id.toUpperCase()}</span>
            {client.phone && (
              <span className="text-xs text-slate-500 flex items-center gap-1 font-semibold">
                <Phone className="h-3.5 w-3.5 text-slate-400" /> {client.phone}
              </span>
            )}
          </div>
        </div>

        {/* Global Operations Bar */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 z-10 select-none">
          
          <Button 
            onClick={handleSendWhatsApp}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl font-bold py-2 px-3.5 flex items-center gap-1.5 border border-emerald-100 transition shadow-sm"
          >
            <MessageCircle className="h-4 w-4" /> Écrire WhatsApp
          </Button>

          <Link href={`/dashboard/invoices/new?client_id=${client.id}`}>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold py-2 px-3.5 flex items-center gap-1.5 shadow-sm shadow-indigo-150 transition">
              <Plus className="h-4 w-4" /> Créer Facture
            </Button>
          </Link>

          <Button 
            onClick={() => setModalOpen(true)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold py-2 px-3.5 flex items-center gap-1.5 transition border border-slate-200/50"
          >
            <Edit3 className="h-4 w-4 text-indigo-650 text-indigo-600" /> Modifier Fiche
          </Button>
        </div>
      </div>

      {/* Financial analytical metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-slate-300 duration-200 transition">
          <div className="h-10 w-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Volume Facturé</span>
            <span className="text-lg font-black text-slate-850 tracking-tight block mt-0.5">{totalInvoiced.toLocaleString()} DZD</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-slate-300 duration-200 transition">
          <div className="h-10 w-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 shadow-sm">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Volume Encaissé</span>
            <span className="text-lg font-black text-emerald-600 tracking-tight block mt-0.5">{totalPaid.toLocaleString()} DZD</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-slate-300 duration-200 transition">
          <div className="h-10 w-10 rounded-2xl bg-red-50 flex items-center justify-center text-red-650 text-red-600 shrink-0 shadow-sm">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Reste à Encaisser</span>
            <span className="text-lg font-black text-red-600 tracking-tight block mt-0.5">{outstandingBalance.toLocaleString()} DZD</span>
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Navigation Sidebar (Vertical on Desktop) */}
        <div className="col-span-1 bg-white p-3 rounded-3xl border border-slate-200 shadow-sm space-y-1 select-none text-xs">
          <button 
            onClick={() => setActiveTab('overview')}
            className={cn(
              "w-full text-left rounded-2xl px-4 py-3 font-extrabold flex items-center gap-3 transition",
              activeTab === 'overview' ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <User className="h-4.5 w-4.5" /> Informations Générales
          </button>
          <button 
            onClick={() => setActiveTab('invoices')}
            className={cn(
              "w-full text-left rounded-2xl px-4 py-3 font-extrabold flex items-center gap-3 transition",
              activeTab === 'invoices' ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <FileText className="h-4.5 w-4.5" /> Factures & Règlements ({invoices.length})
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={cn(
              "w-full text-left rounded-2xl px-4 py-3 font-extrabold flex items-center gap-3 transition",
              activeTab === 'history' ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <MessageSquare className="h-4.5 w-4.5" /> Historique de Comms
          </button>
          <button 
            onClick={() => setActiveTab('timeline')}
            className={cn(
              "w-full text-left rounded-2xl px-4 py-3 font-extrabold flex items-center gap-3 transition",
              activeTab === 'timeline' ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <Clock className="h-4.5 w-4.5" /> Suivi des Voyages
          </button>
          <button 
            onClick={() => setActiveTab('vault')}
            className={cn(
              "w-full text-left rounded-2xl px-4 py-3 font-extrabold flex items-center gap-3 transition",
              activeTab === 'vault' ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <FolderOpen className="h-4.5 w-4.5" /> Coffre-fort Docs ({vaultDocs.length})
          </button>
          <button 
            onClick={() => setActiveTab('notes')}
            className={cn(
              "w-full text-left rounded-2xl px-4 py-3 font-extrabold flex items-center gap-3 transition",
              activeTab === 'notes' ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <ClipboardList className="h-4.5 w-4.5" /> Fiche Profil & Notes
          </button>
        </div>

        {/* Tab contents panel */}
        <div className="lg:col-span-3">
          
          {/* TAB 1: OVERVIEW GENERAL DETAILS */}
          {activeTab === 'overview' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                <User className="h-4.5 w-4.5 text-indigo-500" /> Dossier Personnel du Client
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold uppercase tracking-wider block text-[9px]">Nom Complet / Full Name</span>
                  <span className="block font-bold text-slate-700 text-sm">{client.full_name}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-bold uppercase tracking-wider block text-[9px]">Adresse Email</span>
                  <span className="block font-bold text-slate-700 text-sm truncate">{client.email || <span className="text-slate-400 font-normal italic">Non renseignée</span>}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-bold uppercase tracking-wider block text-[9px]">Téléphone de Contact</span>
                  <span className="block font-bold text-slate-700 text-sm">{client.phone || <span className="text-slate-400 font-normal italic">Non renseigné</span>}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-bold uppercase tracking-wider block text-[9px]">Date de Naissance</span>
                  <span className="block font-bold text-slate-700 text-sm">
                    {client.date_of_birth ? format(new Date(client.date_of_birth), 'd MMMM yyyy', { locale: fr }) : <span className="text-slate-400 font-normal italic">Non renseignée</span>}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-bold uppercase tracking-wider block text-[9px]">Wilaya / Ville</span>
                  <span className="block font-bold text-slate-700 text-sm">{client.city || <span className="text-slate-400 font-normal italic">Non renseignée</span>}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-bold uppercase tracking-wider block text-[9px]">Adresse Physique</span>
                  <span className="block font-bold text-slate-700 text-sm">{client.address || <span className="text-slate-400 font-normal italic">Non renseignée</span>}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-bold uppercase tracking-wider block text-[9px]">N° de Carte d'Identité (CNI)</span>
                  <span className="block font-mono font-bold text-slate-700 text-sm">{client.id_card_number || <span className="text-slate-400 font-normal italic font-sans">Non renseigné</span>}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-bold uppercase tracking-wider block text-[9px]">N° de Passeport Voyageur</span>
                  <span className="block font-mono font-bold text-slate-700 text-sm">{client.passport_number || <span className="text-slate-400 font-normal italic font-sans">Non renseigné</span>}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-bold uppercase tracking-wider block text-[9px]">Parrainé par / Referred by</span>
                  <span className="block font-bold text-slate-700 text-sm">
                    {client.referred_by?.full_name ? (
                      <Link href={`/dashboard/clients/${client.referred_by.id}`} className="text-indigo-650 text-indigo-600 hover:underline">
                        {client.referred_by.full_name}
                      </Link>
                    ) : (
                      <span className="text-slate-400 font-normal italic">Aucun parrain</span>
                    )}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-bold uppercase tracking-wider block text-[9px]">Création Profil SaaS</span>
                  <span className="block font-bold text-slate-700 text-sm">
                    {format(new Date(client.created_at), 'd MMMM yyyy HH:mm', { locale: fr })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INVOICES LEDGER */}
          {activeTab === 'invoices' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-indigo-500" /> Historique des Factures Client
              </h3>

              {invoices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        <th className="py-3 px-4">N° Facture</th>
                        <th className="py-3 px-4 text-right">Montant Brut</th>
                        <th className="py-3 px-4 text-right">Montant Encaissé</th>
                        <th className="py-3 px-4 text-center">Statut</th>
                        <th className="py-3 px-4">Mode règlement</th>
                        <th className="py-3 px-4">Date Émission</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-700">
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/30 transition">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-850">{inv.invoice_number}</td>
                          <td className="py-3.5 px-4 text-right font-bold text-slate-800">{(inv.total_amount || 0).toLocaleString()} DZD</td>
                          <td className="py-3.5 px-4 text-right text-emerald-600 font-black">{(inv.amount_paid || 0).toLocaleString()} DZD</td>
                          <td className="py-3.5 px-4 text-center">{getInvoiceStatusBadge(inv.status)}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-500 uppercase tracking-wider">{inv.payment_method || 'Acompte'}</td>
                          <td className="py-3.5 px-4 text-slate-400 font-semibold">
                            {format(new Date(inv.issue_date), 'd MMM yyyy', { locale: fr })}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Link href={`/dashboard/invoices/${inv.id}`}>
                              <Button size="icon" variant="outline" className="h-7 w-7 rounded-lg border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200">
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 px-6 text-center max-w-sm mx-auto space-y-4">
                  <div className="h-12 w-12 bg-slate-50 rounded-2xl border border-slate-200/50 shadow-inner flex items-center justify-center mx-auto text-slate-400">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-slate-800 font-bold text-sm">Aucune facture enregistrée</h4>
                    <p className="text-slate-400 text-xs mt-1">Émettez une facture de voyage pour enregistrer des règlements comptables.</p>
                  </div>
                  <Link href={`/dashboard/invoices/new?client_id=${client.id}`} className="inline-block pt-2">
                    <Button className="bg-indigo-650 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold py-2 px-4 shadow-sm">
                      Créer la première facture
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: COMMUNICATION HISTORY FEED */}
          {activeTab === 'history' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                <MessageSquare className="h-4.5 w-4.5 text-indigo-500" /> Fil des Communications Omnicanal
              </h3>

              {/* Touchpoints feed */}
              <div className="relative pl-6 space-y-6 before:absolute before:left-[10px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 before:z-0">
                {commsFeed.map((comm) => {
                  
                  // Platform config
                  const config: Record<string, { bg: string; icon: string; text: string }> = {
                    whatsapp: { bg: 'bg-emerald-500 border-emerald-500 text-white', icon: '💬', text: 'WhatsApp Business' },
                    call: { bg: 'bg-indigo-600 border-indigo-600 text-white', icon: '📞', text: 'Appel Direct' },
                    email: { bg: 'bg-sky-500 border-sky-500 text-white', icon: '✉️', text: 'E-mail Notification' },
                    facebook: { bg: 'bg-blue-600 border-blue-600 text-white', icon: 'F', text: 'Facebook Ads' },
                    instagram: { bg: 'bg-pink-500 border-pink-500 text-white', icon: 'I', text: 'Instagram Chat' }
                  }
                  const current = config[comm.platform] || { bg: 'bg-slate-500', icon: '?', text: comm.platform }

                  return (
                    <div key={comm.id} className="relative text-xs text-left group">
                      
                      {/* Timeline icon */}
                      <span className={cn(
                        "absolute -left-[24px] top-1 h-5 w-5 rounded-full border border-white flex items-center justify-center text-[9px] font-bold z-10 shadow-sm",
                        current.bg
                      )}>
                        {current.icon}
                      </span>

                      {/* Bubble box */}
                      <div className="bg-slate-50/70 border border-slate-200/60 hover:border-slate-300 rounded-2xl p-4.5 space-y-2 transition shadow-sm max-w-xl">
                        <div className="flex justify-between items-center text-[9px] font-black tracking-wider text-slate-450 border-b border-slate-200/30 pb-1.5">
                          <span className="uppercase text-indigo-600">{current.text}</span>
                          <div className="flex items-center gap-1.5 font-bold">
                            <span>{format(new Date(comm.date), 'dd MMM yyyy à HH:mm')}</span>
                            {comm.duration && (
                              <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 text-[8px] rounded px-1">
                                Durée: {comm.duration}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className={cn(
                          "leading-relaxed font-semibold text-slate-700",
                          comm.sender === 'agent' ? "italic text-indigo-950" : ""
                        )}>
                          {comm.content}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* TAB 4: BOOKING TIMELINE STATUS MILIESTONES */}
          {activeTab === 'timeline' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-indigo-500" /> Suivi Logistique des Voyages Réservés
              </h3>

              {invoices.length === 0 ? (
                <p className="text-center py-6 text-slate-450 text-xs font-semibold">Aucun voyage ou dossier actif enregistré.</p>
              ) : (
                <div className="space-y-8">
                  {invoices.map((inv, index) => {
                    const seed = inv.id.charCodeAt(0) + inv.id.charCodeAt(inv.id.length - 1)
                    
                    // Logical status mapping
                    const steps = [
                      { key: 'pending', label: 'Créé' },
                      { key: 'confirmed', label: 'Confirmé' },
                      { key: 'paid', label: 'Payé' },
                      { key: 'departed', label: 'Parti' },
                      { key: 'completed', label: 'Terminé' }
                    ]
                    
                    // Determine current step index based on invoice state
                    let currentStepIdx = 1
                    if (inv.status === 'paid') currentStepIdx = 4 // Completed
                    else if (inv.status === 'partial') currentStepIdx = 2 // Paid deposit
                    else if (inv.status === 'sent') currentStepIdx = 1

                    return (
                      <div key={inv.id} className="border border-slate-200/80 rounded-3xl p-5 bg-slate-50/40 space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-150 pb-2">
                          <div className="space-y-0.5">
                            <span className="font-black text-slate-800 text-xs block">Dossier Facture #{inv.invoice_number}</span>
                            <span className="text-[9px] text-slate-400 font-extrabold block">Montant: {inv.total_amount.toLocaleString()} DZD</span>
                          </div>
                          <Badge className="bg-indigo-50 text-indigo-600 border-indigo-200 text-[10px] font-black rounded-full px-2.5 py-0.5">
                            {inv.status.toUpperCase()}
                          </Badge>
                        </div>

                        {/* Milestones horizontal bar */}
                        <div className="flex items-center justify-between pt-2">
                          {steps.map((step, idx) => {
                            const isCurrent = idx === currentStepIdx
                            const isPast = idx < currentStepIdx

                            return (
                              <div key={step.key} className="flex flex-col items-center flex-1 relative">
                                <div className={cn(
                                  "h-4 w-4 rounded-full flex items-center justify-center text-[7px] font-black z-10 border shadow-sm",
                                  isCurrent ? "bg-indigo-650 bg-indigo-600 border-indigo-600 text-white ring-4 ring-indigo-50 animate-pulse" : "",
                                  isPast ? "bg-emerald-500 border-emerald-500 text-white" : "",
                                  !isCurrent && !isPast ? "bg-white text-slate-400 border-slate-200" : ""
                                )}>
                                  {isPast ? '✓' : (idx + 1)}
                                </div>

                                {idx < steps.length - 1 && (
                                  <div 
                                    className={cn(
                                      "absolute top-2 left-[calc(50%+8px)] right-[calc(-50%+8px)] h-[2px] -z-0",
                                      idx < currentStepIdx ? "bg-emerald-400" : "bg-slate-200"
                                    )}
                                  />
                                )}

                                <span className={cn(
                                  "text-[8px] font-black uppercase tracking-wider mt-1 text-slate-450",
                                  isCurrent ? "text-indigo-600 font-extrabold" : ""
                                )}>
                                  {step.label}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SECURE DOCUMENT VAULT */}
          {activeTab === 'vault' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <FolderOpen className="h-4.5 w-4.5 text-indigo-500" /> Coffre-fort Numérique des Pièces
                </h3>
                <Button 
                  onClick={() => alert('Simuler le chargement d\'un document PDF/Photo depuis votre ordinateur.')}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100 text-xs font-black h-8 rounded-xl px-3 flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" /> Ajouter un scan
                </Button>
              </div>

              {/* Document vault cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {vaultDocs.map((doc) => (
                  <div 
                    key={doc.id}
                    className={cn(
                      "p-4 border rounded-3xl transition-all duration-200 flex flex-col justify-between gap-4 text-xs",
                      doc.status === 'approved' ? "bg-emerald-50/20 border-emerald-100 hover:border-emerald-200" : "bg-slate-50/50 border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-black tracking-widest text-indigo-650 text-indigo-600 block">
                          Fichier {doc.type.replace('_', ' ').toUpperCase()}
                        </span>
                        <h4 className="font-bold text-slate-800 text-xs leading-snug">
                          {doc.name}
                        </h4>
                        <span className="text-[9px] text-slate-400 font-semibold block">
                          Chargé le: {format(new Date(doc.uploadedAt), 'dd MMM yyyy à HH:mm')}
                        </span>
                      </div>
                      
                      {/* Interactive toggle status */}
                      <button
                        onClick={() => handleToggleDocApproval(doc.id)}
                        className={cn(
                          "h-5 w-5 rounded-lg border flex items-center justify-center shrink-0 transition focus:outline-none",
                          doc.status === 'approved' 
                            ? "bg-emerald-500 border-emerald-500 text-white" 
                            : "bg-white border-slate-300 hover:border-slate-400"
                        )}
                        title={doc.status === 'approved' ? "Révoquer la validation" : "Valider le document"}
                      >
                        {doc.status === 'approved' && <Check className="h-3.5 w-3.5" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100/50">
                      <span className={cn(
                        "text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider block",
                        doc.status === 'approved' ? "text-emerald-700 bg-emerald-50" : "text-amber-700 bg-amber-50"
                      )}>
                        {doc.status === 'approved' ? 'Vérifié' : 'En attente'}
                      </span>

                      <div className="flex gap-1.5">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setActivePreviewDoc(doc)}
                          className="h-7 px-2 text-[10px] font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" /> Aperçu
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => alert(`Téléchargement simulé de: ${doc.name}`)}
                          className="h-7 px-2 text-[10px] font-bold text-slate-655 hover:bg-slate-100 rounded-xl"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: PROFILE NOTES */}
          {activeTab === 'notes' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <ClipboardList className="h-4.5 w-4.5 text-indigo-500" /> Fiche Voyageur & Spécificités
                </h3>
                <div className="flex items-center gap-2 select-none">
                  {saveSuccess && (
                    <span className="text-emerald-600 text-xs font-bold flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" /> Sauvegardé !
                    </span>
                  )}
                  <Button 
                    onClick={handleSaveNotes} 
                    disabled={isSavingNotes}
                    className="bg-indigo-650 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black py-1.5 px-3 flex items-center gap-1.5 shadow-sm shadow-indigo-150 transition"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {isSavingNotes ? 'Sauvegarde...' : 'Sauvegarder la Fiche'}
                  </Button>
                </div>
              </div>

              {/* Add sticky note quick-action */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-3">
                <span className="text-[9px] uppercase font-black text-slate-450 tracking-wider block">Ajouter une annotation rapide</span>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Ex: Demande un hôtel non-fumeur à Istanbul..."
                    value={newQuickNote}
                    onChange={(e) => setNewQuickNote(e.target.value)}
                    className="flex-1 text-xs bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-2 outline-none text-slate-800 transition"
                  />
                  <Button 
                    onClick={handleAddQuickNote}
                    disabled={!newQuickNote.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold px-3 shrink-0"
                  >
                    Insérer
                  </Button>
                </div>
              </div>

              {/* Textarea notes */}
              <div className="space-y-2">
                <Label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest block">Registre Complet de la Fiche Voyageur</Label>
                <textarea 
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  className="flex min-h-[220px] w-full rounded-2xl border-0 bg-slate-50 px-4 py-3.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition resize-y font-semibold leading-relaxed" 
                  placeholder="Rédigez les remarques ou exigences spécifiques de ce voyageur..." 
                />
              </div>

            </div>
          )}

        </div>

      </div>

      {/* Vault document preview dialog */}
      <Dialog open={!!activePreviewDoc} onOpenChange={(open) => !open && setActivePreviewDoc(null)}>
        <DialogContent className="sm:max-w-md overflow-hidden font-geist text-left border border-slate-200 p-0 shadow-2xl rounded-3xl bg-white">
          {activePreviewDoc && (
            <div className="flex flex-col">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <span className="text-slate-500 text-xs font-black uppercase tracking-wider">Aperçu du scan officiel</span>
                <Button 
                  variant="outline" 
                  onClick={() => setActivePreviewDoc(null)}
                  className="text-xs h-7 border-slate-200 rounded-lg px-2 hover:bg-slate-100 text-slate-600 font-bold"
                >
                  Fermer
                </Button>
              </div>
              <div className="p-6 flex flex-col items-center gap-4 text-center">
                <div className="relative h-[260px] w-full shrink-0 rounded-2xl shadow-md border border-slate-200 bg-slate-50 overflow-hidden">
                  <Image 
                    src={activePreviewDoc.previewUrl} 
                    alt={activePreviewDoc.name} 
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="object-contain"
                  />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-slate-800 text-xs">{activePreviewDoc.name}</h4>
                  <span className="text-[9px] text-slate-400 font-semibold block">Statut: {activePreviewDoc.status.toUpperCase()}</span>
                </div>
                <div className="w-full flex gap-2 pt-2">
                  <Button 
                    onClick={() => {
                      handleToggleDocApproval(activePreviewDoc.id)
                      setActivePreviewDoc(null)
                    }}
                    className={cn(
                      "w-full text-xs font-bold py-2 rounded-xl transition shadow-sm",
                      activePreviewDoc.status === 'approved' ? "bg-red-500 hover:bg-red-600 text-white" : "bg-emerald-500 hover:bg-emerald-600 text-white"
                    )}
                  >
                    {activePreviewDoc.status === 'approved' ? 'Révoquer validation' : 'Valider ce document'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => alert('Téléchargement en cours...')}
                    className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold py-2 rounded-xl"
                  >
                    Télécharger le PDF
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add / Edit Client Modal */}
      {modalOpen && (
        <AddClientModal 
          open={modalOpen} 
          onOpenChange={setModalOpen} 
          existingClients={allClients.filter(c => c.id !== client.id)}
          clientToEdit={client}
          onSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  )
}
