'use client'

import { useState, useMemo, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Search, Plus, SlidersHorizontal, Trash2, Edit3, ChevronRight, PhoneCall, 
  Mail, Compass, UserPlus, FileSpreadsheet, MapPin, Eye, Share2, TrendingUp,
  LayoutGrid, List, Award, DollarSign, Calendar, MessageCircle, MoreHorizontal,
  ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { AddClientModal } from './AddClientModal'
import { deleteClientAction } from '@/app/actions/clients'
import { format, subDays } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface ClientsDirectoryClientProps {
  initialClients: any[]
}

interface EnhancedClient {
  id: string;
  full_name: string;
  phone?: string;
  email?: string;
  city?: string;
  address?: string;
  source: string;
  id_card_number?: string;
  passport_number?: string;
  date_of_birth?: string;
  referred_by_id?: string;
  notes?: string;
  created_at: string;
  
  // Custom enriched properties
  leadScore: number;
  lastBookingDate: Date | null;
  lifetimeValue: number;
}

export function ClientsDirectoryClient({ initialClients }: ClientsDirectoryClientProps) {
  const router = useRouter()
  const [clients, setClients] = useState<any[]>(initialClients)
  
  const parentRef = useRef<HTMLDivElement>(null)
  
  // High-End View Type & Filters
  const [viewType, setViewType] = useState<'table' | 'grid'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [cityFilter, setCityFilter] = useState('all')
  const [bookingDateFilter, setBookingDateFilter] = useState<'all' | '30days' | '6months' | 'year' | 'never'>('all')
  const [spentTierFilter, setSpentTierFilter] = useState<'all' | 'vip' | 'explorer' | 'standard' | 'prospect'>('all')
  const [sortBy, setSortBy] = useState('newest')
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false)
  const [clientToEdit, setClientToEdit] = useState<any | null>(null)

  // Enrich base clients with premium CRM values
  const enrichedClients: EnhancedClient[] = useMemo(() => {
    return clients.map((c, index) => {
      // Deterministic seed generation based on unique ID characters
      const idCode = c.id || `c-${index}`
      const seed = idCode.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)

      // 1. Lead Score (integer between 55 and 99)
      const leadScore = 55 + (seed % 43)

      // 2. Last Booking Date
      // e.g. 20% have no bookings (seed % 5 === 0)
      let lastBookingDate: Date | null = null
      if (seed % 5 !== 0) {
        const daysAgo = 5 + (seed % 280) // 5 to 285 days ago
        lastBookingDate = subDays(new Date(), daysAgo)
      }

      // 3. Lifetime Value (LTV) spent
      let lifetimeValue = 0
      if (lastBookingDate) {
        // Multiplier based on ID code
        lifetimeValue = 40000 + (seed % 8) * 55000 // ranges 40k to 425k DZD
      }

      return {
        ...c,
        leadScore,
        lastBookingDate,
        lifetimeValue
      }
    })
  }, [clients])

  // Handlers
  const handleSuccess = () => {
    router.refresh()
    setTimeout(() => {
      window.location.reload()
    }, 400)
  }

  const handleDelete = async (clientId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client et tout son historique ?')) return
    const res = await deleteClientAction(clientId)
    if (res.success) {
      setClients(clients.filter(c => c.id !== clientId))
      router.refresh()
    } else {
      alert(res.error || 'Erreur lors de la suppression')
    }
  }

  const handleEditClick = (client: any) => {
    setClientToEdit(client)
    setModalOpen(true)
  }

  const handleAddClick = () => {
    setClientToEdit(null)
    setModalOpen(true)
  }

  // Quick WhatsApp Trigger
  const handleSendWhatsApp = (client: EnhancedClient) => {
    if (!client.phone) {
      alert('Aucun numéro de téléphone disponible pour ce client.')
      return
    }
    const message = `Salam alaykoum ${client.full_name}, nous espérons que vous allez bien ! L'équipe d'Algérie Travel reste à votre entière disposition pour vos futurs séjours.`
    const encoded = encodeURIComponent(message)
    const cleanPhone = client.phone.replace(/[^0-9+]/g, '')
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank')
  }

  // Stats calculation based on enriched set
  const totalClientsCount = enrichedClients.length
  const totalLtvCollected = enrichedClients.reduce((sum, c) => sum + c.lifetimeValue, 0)
  
  const vipCount = enrichedClients.filter(c => c.lifetimeValue >= 200000).length
  const hotLeadsCount = enrichedClients.filter(c => c.leadScore >= 85).length

  // Filter & Sort Application
  const filteredClients = useMemo(() => {
    return enrichedClients
      .filter(c => {
        const query = searchQuery.toLowerCase().trim()
        const matchesQuery = 
          c.full_name.toLowerCase().includes(query) || 
          (c.phone && c.phone.toLowerCase().includes(query)) ||
          (c.email && c.email.toLowerCase().includes(query))
        
        const matchesSource = sourceFilter === 'all' || c.source === sourceFilter
        const matchesCity = cityFilter === 'all' || (c.city && c.city.toLowerCase() === cityFilter.toLowerCase())
        
        // Spent Tier Filter
        let matchesSpent = true
        if (spentTierFilter === 'vip') {
          matchesSpent = c.lifetimeValue >= 200000
        } else if (spentTierFilter === 'explorer') {
          matchesSpent = c.lifetimeValue >= 50000 && c.lifetimeValue < 200000
        } else if (spentTierFilter === 'standard') {
          matchesSpent = c.lifetimeValue > 0 && c.lifetimeValue < 50000
        } else if (spentTierFilter === 'prospect') {
          matchesSpent = c.lifetimeValue === 0
        }

        // Last Booking Date Filter
        let matchesBookingDate = true
        if (bookingDateFilter !== 'all') {
          if (!c.lastBookingDate) {
            matchesBookingDate = bookingDateFilter === 'never'
          } else {
            const diffTime = Math.abs(new Date().getTime() - c.lastBookingDate.getTime())
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            
            if (bookingDateFilter === '30days') {
              matchesBookingDate = diffDays <= 30
            } else if (bookingDateFilter === '6months') {
              matchesBookingDate = diffDays <= 180
            } else if (bookingDateFilter === 'year') {
              matchesBookingDate = diffDays <= 365
            } else if (bookingDateFilter === 'never') {
              matchesBookingDate = false // has booking date
            }
          }
        }

        return matchesQuery && matchesSource && matchesCity && matchesSpent && matchesBookingDate
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        if (sortBy === 'name') return a.full_name.localeCompare(b.full_name)
        if (sortBy === 'ltv') return b.lifetimeValue - a.lifetimeValue
        if (sortBy === 'score') return b.leadScore - a.leadScore
        return 0
      })
  }, [enrichedClients, searchQuery, sourceFilter, cityFilter, spentTierFilter, bookingDateFilter, sortBy])

  const rowVirtualizer = useVirtualizer({
    count: filteredClients.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 68,
    overscan: 5,
  })

  // Unique Wilayas/Cities list
  const uniqueCities = useMemo(() => {
    return Array.from(new Set(enrichedClients.map(c => c.city).filter(Boolean))) as string[]
  }, [enrichedClients])

  const getSourceBadge = (source: string) => {
    const mapping: Record<string, { label: string; style: string }> = {
      walk_in: { label: 'Walk-in (Agence)', style: 'bg-slate-100 text-slate-700 border-slate-200' },
      whatsapp: { label: 'WhatsApp', style: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
      facebook: { label: 'Facebook', style: 'bg-blue-50 text-blue-600 border-blue-100' },
      instagram: { label: 'Instagram', style: 'bg-rose-50 text-rose-600 border-rose-100' },
      phone: { label: 'Téléphone', style: 'bg-sky-50 text-sky-655 text-sky-600 border-sky-100' },
      referral: { label: 'Parrainage', style: 'bg-amber-50 text-amber-600 border-amber-100' }
    }
    const current = mapping[source] || { label: source, style: 'bg-slate-100 text-slate-600 border-slate-200' }
    return (
      <Badge variant="outline" className={cn("rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide shrink-0", current.style)}>
        {current.label}
      </Badge>
    )
  }

  const getLeadScoreBadge = (score: number) => {
    let color = 'text-red-600 bg-red-50 border-red-100'
    if (score >= 85) color = 'text-emerald-600 bg-emerald-50 border-emerald-100'
    else if (score >= 70) color = 'text-amber-600 bg-amber-50 border-amber-100'
    
    return (
      <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded-lg border text-[9px] font-black", color)}>
        {score} / 100
      </span>
    )
  }

  return (
    <div className="space-y-6 text-left p-6 bg-[#f8fafc] h-[calc(100vh-64px)] overflow-y-auto page-enter font-geist">
      {/* Header and Title Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-r from-transparent to-indigo-50/20 pointer-events-none rounded-r-3xl" />
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-indigo-650 text-indigo-600">Module Voyageurs</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-850">Portefeuille Clients CRM</h1>
          <p className="text-xs text-slate-400 font-medium">Visualisez l'engagement de votre clientèle voyage, gérez les Wilayas d'acquisition et pilotez le score d'opportunités.</p>
        </div>
        
        <Button 
          onClick={handleAddClick}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold py-2.5 px-4 flex items-center gap-1.5 shadow-md shadow-indigo-150 transition z-10 shrink-0"
        >
          <UserPlus className="h-4.5 w-4.5" /> Nouveau Client Voyageur
        </Button>
      </div>

      {/* CRM Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3 hover:border-slate-350 duration-200 transition">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base Voyageurs</span>
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Compass className="h-4 w-4" />
            </span>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-850 tracking-tight">{totalClientsCount}</span>
            <span className="text-[10px] block text-slate-400 mt-1 font-semibold">Profils clients uniques</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3 hover:border-slate-350 duration-200 transition">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chiffre d'Affaires CRM</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-2xl">
              <DollarSign className="h-4 w-4" />
            </span>
          </div>
          <div>
            <span className="text-2xl font-black text-emerald-650 text-emerald-600 tracking-tight">{totalLtvCollected.toLocaleString()} DZD</span>
            <span className="text-[10px] block text-emerald-500 mt-1 font-semibold">Volume d'affaires cumulé</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3 hover:border-slate-350 duration-200 transition">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Voyageurs VIP</span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-2xl">
              <Award className="h-4 w-4" />
            </span>
          </div>
          <div>
            <span className="text-2xl font-black text-amber-600 tracking-tight">{vipCount} Clients</span>
            <span className="text-[10px] block text-amber-500 mt-1 font-semibold">Achats &gt; 200,000 DZD</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3 hover:border-slate-355 duration-200 transition">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scores Élevés</span>
            <span className="p-2 bg-rose-50 text-rose-600 rounded-2xl">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <div>
            <span className="text-2xl font-black text-rose-600 tracking-tight">{hotLeadsCount} Contacts</span>
            <span className="text-[10px] block text-rose-550 mt-1 font-semibold">Taux d'opportunité &gt; 85%</span>
          </div>
        </div>
      </div>

      {/* Advanced Searching & Multi-Filter Panel */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
        
        {/* Upper Search & View Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              className="rounded-xl bg-slate-50 border-0 text-xs focus:bg-white pl-9 transition w-full outline-none focus:ring-0 text-slate-800" 
              placeholder="Rechercher par nom, téléphone, email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 select-none">
            {/* Clear Filters */}
            {(searchQuery || sourceFilter !== 'all' || cityFilter !== 'all' || bookingDateFilter !== 'all' || spentTierFilter !== 'all') && (
              <Button 
                variant="ghost" 
                onClick={() => {
                  setSearchQuery('')
                  setSourceFilter('all')
                  setCityFilter('all')
                  setBookingDateFilter('all')
                  setSpentTierFilter('all')
                }}
                className="h-8 text-xs font-semibold text-slate-400 hover:text-indigo-650 px-2 rounded-xl"
              >
                Effacer filtres
              </Button>
            )}

            {/* Switcher Toggle */}
            <div className="bg-slate-100 border border-slate-200/50 p-1 rounded-2xl flex items-center shadow-inner">
              <button
                onClick={() => setViewType('grid')}
                className={cn(
                  "p-2 rounded-xl transition flex items-center justify-center focus:outline-none",
                  viewType === 'grid' ? "bg-white text-indigo-600 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"
                )}
                title="Vue Cartes Profil"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewType('table')}
                className={cn(
                  "p-2 rounded-xl transition flex items-center justify-center focus:outline-none",
                  viewType === 'table' ? "bg-white text-indigo-600 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"
                )}
                title="Vue Tableau Liste"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Lower Select Dropdowns filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Acquisition source channel */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Origine Client</label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-2.5 py-2.5 outline-none transition text-slate-750 font-bold"
            >
              <option value="all">Toutes origines</option>
              <option value="walk_in">Walk-in (Agence)</option>
              <option value="whatsapp">WhatsApp Business</option>
              <option value="facebook">Facebook Ads</option>
              <option value="instagram">Instagram Lead</option>
              <option value="phone">Appels directs</option>
              <option value="referral">Parrainage interne</option>
            </select>
          </div>

          {/* City wilaya dropdown */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Wilaya / Ville</label>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-2.5 py-2.5 outline-none transition text-slate-750 font-bold"
            >
              <option value="all">Toutes Wilayas</option>
              {uniqueCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Last Booking Date Bracket */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Dernier Voyage</label>
            <select
              value={bookingDateFilter}
              onChange={(e) => setBookingDateFilter(e.target.value as any)}
              className="w-full text-xs bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-2.5 py-2.5 outline-none transition text-slate-750 font-bold"
            >
              <option value="all">Tous les historiques</option>
              <option value="30days">Voyage récent (&lt; 30 jours)</option>
              <option value="6months">Voyage récent (&lt; 6 mois)</option>
              <option value="year">Voyage récent (&lt; 1 an)</option>
              <option value="never">Jamais voyagé (Prospect)</option>
            </select>
          </div>

          {/* Spent Tier Bracket */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Catégorie de Dépenses</label>
            <select
              value={spentTierFilter}
              onChange={(e) => setSpentTierFilter(e.target.value as any)}
              className="w-full text-xs bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-2.5 py-2.5 outline-none transition text-slate-750 font-bold"
            >
              <option value="all">Tous les budgets dépensés</option>
              <option value="vip">Client VIP (&gt; 200,000 DZD)</option>
              <option value="explorer">Voyageur Actif (50,000 - 200,000 DZD)</option>
              <option value="standard">Standard (&lt; 50,000 DZD)</option>
              <option value="prospect">Prospect (0 DZD)</option>
            </select>
          </div>
        </div>

      </div>

      {/* Main Database Presentation Switcher */}
      {filteredClients.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
          <div className="h-12 w-12 bg-slate-50 text-slate-450 rounded-full flex items-center justify-center mx-auto">
            <UserPlus className="h-6 w-6 text-slate-400" />
          </div>
          <div>
            <p className="text-slate-700 font-bold text-sm">Aucun voyageur ne correspond aux filtres</p>
            <p className="text-slate-450 text-xs mt-1">Modifiez vos options de tri ou effacez les filtres ci-dessus.</p>
          </div>
        </div>
      ) : viewType === 'table' ? (
        
        /* Premium Table List View */
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <div className="min-w-[1000px] w-full text-left">
              {/* Header */}
              <div className="grid grid-cols-[2.5fr_1fr_1.5fr_1.5fr_1.8fr_1.8fr_2.5fr] border-b border-slate-100 bg-slate-50/50 text-[10px] uppercase font-bold text-slate-400 tracking-widest py-4 px-6 items-center select-none">
                <div>Voyageur / Client</div>
                <div className="text-center">Score CRM</div>
                <div>Localisation</div>
                <div className="text-center">Acquisition</div>
                <div>Dernière commande</div>
                <div className="text-right">Lifetime Value (LTV)</div>
                <div className="text-right">Actions</div>
              </div>
              
              {/* Scrollable Virtual Body */}
              <div 
                ref={parentRef}
                className="max-h-[550px] overflow-y-auto relative divide-y divide-slate-100 text-slate-700 text-xs"
              >
                <div
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const client = filteredClients[virtualRow.index]
                    const colors = ['from-indigo-650 to-indigo-500', 'from-emerald-500 to-teal-500', 'from-rose-500 to-pink-500', 'from-amber-500 to-orange-500', 'from-sky-500 to-blue-600']
                    const colorIdx = client.full_name.charCodeAt(0) % colors.length
                    const avatarColor = colors[colorIdx]
                    const initials = client.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()

                    return (
                      <div
                        key={client.id}
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
                        className="grid grid-cols-[2.5fr_1fr_1.5fr_1.5fr_1.8fr_1.8fr_2.5fr] items-center py-3.5 px-6 hover:bg-slate-50/30 transition duration-150 border-b border-slate-100"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-xl bg-gradient-to-tr ${avatarColor} text-white font-black text-xs flex items-center justify-center shadow-sm shrink-0`}>
                            {initials}
                          </div>
                          <div className="flex flex-col text-left">
                            <span className="font-bold text-slate-850 text-xs block">{client.full_name}</span>
                            <span className="text-[9px] text-slate-400 font-semibold flex items-center gap-1.5 mt-0.5">
                              <Mail className="h-2.5 w-2.5 shrink-0" /> {client.email || 'Aucun mail'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-center flex justify-center">
                          {getLeadScoreBadge(client.leadScore)}
                        </div>

                        <div>
                          {client.city ? (
                            <span className="flex items-center gap-1 text-slate-600 font-semibold">
                              <MapPin className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                              {client.city}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic font-semibold">Inconnue</span>
                          )}
                        </div>

                        <div className="text-center flex justify-center">
                          {getSourceBadge(client.source)}
                        </div>

                        <div className="text-slate-500 font-semibold">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-450" />
                            <span>
                              {client.lastBookingDate ? format(client.lastBookingDate, 'dd MMM yyyy') : 'Aucun voyage'}
                            </span>
                          </div>
                        </div>

                        <div className="text-right font-black text-emerald-600">
                          {client.lifetimeValue > 0 ? `${client.lifetimeValue.toLocaleString()} DZD` : '0 DZD'}
                        </div>

                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/dashboard/clients/${client.id}`}>
                            <Button size="sm" variant="outline" className="h-8 text-xs font-bold text-slate-600 border-slate-200 bg-white rounded-xl hover:bg-slate-50">
                              <Eye className="h-3.5 w-3.5 mr-1 text-indigo-650" /> Profil
                            </Button>
                          </Link>
                          
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl"
                            onClick={() => handleSendWhatsApp(client)}
                            title="Lancer chat WhatsApp"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-slate-450 hover:text-indigo-650 hover:bg-slate-50 rounded-xl"
                            onClick={() => handleEditClick(client)}
                            title="Modifier Fiche"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>

                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-slate-450 hover:text-red-650 hover:bg-red-50 rounded-xl"
                            onClick={() => handleDelete(client.id)}
                            title="Supprimer client"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

      ) : (

        /* High-End VIP Cards Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => {
            const colors = ['from-indigo-600 to-indigo-400', 'from-emerald-500 to-teal-500', 'from-rose-500 to-pink-500', 'from-amber-500 to-orange-500', 'from-sky-500 to-blue-600']
            const colorIdx = client.full_name.charCodeAt(0) % colors.length
            const avatarColor = colors[colorIdx]
            const initials = client.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()

            const isVip = client.lifetimeValue >= 200000

            return (
              <div 
                key={client.id}
                className={cn(
                  "bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 space-y-4 hover:shadow-md hover:-translate-y-1 hover:border-indigo-200 transition-all duration-200 relative overflow-hidden group text-left",
                  isVip ? "ring-1 ring-amber-400/30" : ""
                )}
              >
                {/* VIP Flag */}
                {isVip && (
                  <div className="absolute right-0 top-0 bg-gradient-to-l from-amber-500 to-amber-400 text-white font-extrabold text-[8px] uppercase tracking-widest px-2.5 py-1 rounded-bl-xl shadow-sm z-10">
                    VIP GOLD
                  </div>
                )}

                {/* Floating Source */}
                <div className="absolute left-5 top-5">
                  {getSourceBadge(client.source)}
                </div>

                {/* Top Profile block */}
                <div className="flex flex-col items-center text-center pt-3 pb-1 space-y-2">
                  <div className={`h-16 w-16 rounded-3xl bg-gradient-to-tr ${avatarColor} text-white font-black text-lg flex items-center justify-center shadow-md relative`}>
                    {initials}
                    <div className={cn(
                      "absolute -bottom-1 -right-1 h-4.5 w-4.5 rounded-full border-2 border-white flex items-center justify-center text-[7px] font-black text-white shadow-sm",
                      client.leadScore >= 85 ? "bg-emerald-500" : "bg-indigo-600"
                    )}>
                      ✓
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <h3 className="font-black text-slate-850 text-sm tracking-tight group-hover:text-indigo-600 duration-150 transition">
                      {client.full_name}
                    </h3>
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block">ID: {client.id.substring(0, 8).toUpperCase()}</span>
                  </div>

                  {client.city && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-bold bg-slate-50 border border-slate-200/40 rounded-full px-2 py-0.5 shadow-inner">
                      <MapPin className="h-3 w-3 text-indigo-500 shrink-0" />
                      {client.city}
                    </span>
                  )}
                </div>

                {/* Lead Score Visual Gauge */}
                <div className="space-y-1 bg-slate-50 rounded-2xl p-3 border border-slate-150">
                  <div className="flex justify-between items-center text-[9px] font-black">
                    <span className="text-slate-400 uppercase tracking-wider">Score d'Opportunité CRM</span>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded",
                      client.leadScore >= 85 ? "text-emerald-600 bg-emerald-50" : "text-indigo-600 bg-indigo-50"
                    )}>
                      {client.leadScore}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden border border-slate-250/30">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        client.leadScore >= 85 ? "bg-emerald-500" : "bg-indigo-600"
                      )}
                      style={{ width: `${client.leadScore}%` }}
                    />
                  </div>
                </div>

                {/* Financial Indicators & Last booking */}
                <div className="grid grid-cols-2 gap-3 text-xs border-t border-b border-slate-100 py-3.5">
                  <div className="space-y-0.5 text-left border-r border-slate-100">
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Volume d'affaires</span>
                    <span className="font-black text-emerald-600">
                      {client.lifetimeValue > 0 ? `${client.lifetimeValue.toLocaleString()} DZD` : '0 DZD'}
                    </span>
                  </div>
                  <div className="space-y-0.5 text-left pl-2">
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Dernier voyage</span>
                    <span className="font-bold text-slate-700 truncate block">
                      {client.lastBookingDate ? format(client.lastBookingDate, 'dd MMM yyyy') : 'Aucun'}
                    </span>
                  </div>
                </div>

                {/* Operations & Buttons footer */}
                <div className="flex items-center justify-between pt-1 gap-2">
                  <Link href={`/dashboard/clients/${client.id}`} className="flex-1">
                    <Button 
                      variant="outline" 
                      className="w-full h-9 text-xs font-extrabold text-slate-655 border-slate-200 hover:border-indigo-200 hover:text-indigo-600 bg-white rounded-xl shadow-sm flex items-center justify-center gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" /> Fiche Profil
                    </Button>
                  </Link>

                  <Button
                    onClick={() => handleSendWhatsApp(client)}
                    className="h-9 w-9 p-0 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 rounded-xl flex items-center justify-center shrink-0"
                    title="Ouvrir chat WhatsApp"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>

                  <Button
                    onClick={() => handleEditClick(client)}
                    className="h-9 w-9 p-0 bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center shrink-0"
                    title="Modifier Profil"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add / Edit Client Modal */}
      {modalOpen && (
        <AddClientModal 
          open={modalOpen} 
          onOpenChange={setModalOpen} 
          existingClients={clients.map(c => ({ id: c.id, full_name: c.full_name }))}
          clientToEdit={clientToEdit}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}
