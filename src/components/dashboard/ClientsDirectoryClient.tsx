'use client'

import { useState, useMemo, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search, Trash2, Edit3, Phone, Mail, UserPlus, FileSpreadsheet, MapPin, Eye,
  LayoutGrid, List, Calendar, MessageCircle, Car, Key, Package, FileText, Globe, Compass
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { AddClientModal } from './AddClientModal'
import { deleteClientAction } from '@/app/actions/clients'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/contexts/LanguageContext'

interface ClientsDirectoryClientProps {
  initialClients: any[]
  businessTypeSlug?: string
  availableTrips?: any[]
}

type ClientTypeTab = 'normal' | 'gros'
type TransactionTab = 'ventes' | 'location' | 'commande' | 'bookings' | 'visa' | 'invoices'

export function ClientsDirectoryClient({ initialClients, businessTypeSlug = 'travel_agency', availableTrips = [] }: ClientsDirectoryClientProps) {
  const { language } = useLanguage()
  const router = useRouter()
  const [clients, setClients] = useState<any[]>(initialClients)
  const languageReady = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
  const uiLanguage = languageReady ? language : 'fr'
  
  // Navigation Tabs
  const [clientTypeTab, setClientTypeTab] = useState<ClientTypeTab>('normal')
  const [transactionTab, setTransactionTab] = useState<TransactionTab>(
    businessTypeSlug === 'car_showroom' ? 'ventes' : 'bookings'
  )

  // High-End View Type & Filters
  const [viewType, setViewType] = useState<'table' | 'grid'>('table')
  const [searchQuery, setSearchQuery] = useState('')
  const [cityFilter, setCityFilter] = useState('all')
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false)
  const [clientToEdit, setClientToEdit] = useState<any | null>(null)

  // Enriched Clients with computed relationships
  const enrichedClients = useMemo(() => {
    return clients.map((c) => {
      const isRetail = !c.classification || c.classification === 'retail'
      
      const sales = c.car_sales_orders || []
      const rentals = c.car_rental_bookings || []
      const imports = c.import_orders || []
      const bookings = c.bookings || []
      const visas = c.visa_applications || []
      const invoices = c.invoices || []

      // Calculate totals specific to the client
      const totalSalesMoney = sales.reduce((sum: number, s: any) => sum + Number(s.sale_price || 0), 0)
      const totalRentalMoney = rentals.reduce((sum: number, r: any) => sum + Number(r.total_price || 0), 0)
      const totalImportMoney = imports.reduce((sum: number, i: any) => sum + Number(i.total_cost || i.total_price || 0), 0)
      const totalBookingsMoney = bookings.reduce((sum: number, b: any) => sum + Number(b.total_amount || b.total_price || b.price || 0), 0)
      const totalVisasMoney = visas.reduce((sum: number, v: any) => sum + Number(v.total_fee || v.price || 0), 0)

      // Get paid invoices amount
      const moneyPaid = invoices.filter((inv: any) => inv.payment_status === 'paid').reduce((sum: number, inv: any) => sum + Number(inv.amount_paid || inv.total_amount), 0)

      return {
        ...c,
        isRetail,
        sales,
        rentals,
        imports,
        bookings,
        visas,
        invoices,
        totalSalesMoney,
        totalRentalMoney,
        totalImportMoney,
        totalBookingsMoney,
        totalVisasMoney,
        moneyPaid,
        hasSales: sales.length > 0,
        hasRentals: rentals.length > 0,
        hasImports: imports.length > 0
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

  const handleSendWhatsApp = (client: any) => {
    if (!client.phone) {
      alert('Aucun numéro de téléphone disponible pour ce client.')
      return
    }
    const message = `Salam alaykoum ${client.full_name}, nous espérons que vous allez bien ! L'équipe reste à votre entière disposition.`
    const encoded = encodeURIComponent(message)
    const cleanPhone = client.phone.replace(/[^0-9+]/g, '')
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank')
  }

  // Filter based on Tabs and Search
  const filteredClients = useMemo(() => {
    return enrichedClients.filter(c => {
      // 1. Filter by Client Type (Normal vs Gros)
      if (clientTypeTab === 'normal' && !c.isRetail) return false
      if (clientTypeTab === 'gros' && c.isRetail) return false

      // 2. Filter by Transaction Tab (Ventes vs Location vs Commande)
      // If a client has NO transactions in that tab, we probably shouldn't show them, 
      // or we can show them with 0 transactions. Let's show ONLY those who have transactions, 
      // OR show all if they are a specific client type. 
      // Actually, let's show all clients of that type, so users can create a new transaction for them!
      // But we will highlight the transaction tab data.

      // 3. Search Query
      const query = searchQuery.toLowerCase().trim()
      const matchesQuery = !query || 
        c.full_name?.toLowerCase().includes(query) || 
        c.phone?.toLowerCase().includes(query) ||
        (c.company_legal_name && c.company_legal_name.toLowerCase().includes(query))
      
      const matchesCity = cityFilter === 'all' || (c.city && c.city.toLowerCase() === cityFilter.toLowerCase())
      
      return matchesQuery && matchesCity
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [enrichedClients, clientTypeTab, searchQuery, cityFilter])

  const uniqueCities = useMemo(() => {
    return Array.from(new Set(enrichedClients.map(c => c.city).filter(Boolean))) as string[]
  }, [enrichedClients])

  const getSourceBadge = (source: string) => {
    const mapping: Record<string, { label: string; style: string }> = {
      walk_in: { label: 'Walk-in', style: 'bg-slate-100 text-slate-700' },
      whatsapp: { label: 'WhatsApp', style: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
      facebook: { label: 'Facebook', style: 'bg-blue-50 text-blue-600 border-blue-100' },
      instagram: { label: 'Instagram', style: 'bg-rose-50 text-rose-600 border-rose-100' },
    }
    const current = mapping[source] || { label: source || 'N/A', style: 'bg-slate-100 text-slate-600' }
    return (
      <Badge variant="outline" className={cn("rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide", current.style)}>
        {current.label}
      </Badge>
    )
  }

  const getLatestRecord = (records: any[] = []) => {
    return [...records].sort((a, b) => {
      const dateA = new Date(a.created_at || a.order_date || a.start_date || 0).getTime()
      const dateB = new Date(b.created_at || b.order_date || b.start_date || 0).getTime()
      return dateB - dateA
    })[0]
  }

  const getVehicleSummary = (client: any) => {
    if (businessTypeSlug !== 'car_showroom') {
      const booking = getLatestRecord(client.bookings)
      const manifest = booking?.client_manifest || {}
      const tripTitle = booking?.trips?.title || manifest.trip_title || 'Voyage / service'

      return {
        label: tripTitle,
        detail: `${manifest.adults || 1} adulte(s), ${manifest.children || 0} enfant(s)`,
        date: booking?.created_at,
        status: booking?.status,
      }
    }

    if (transactionTab === 'location') {
      const rental = getLatestRecord(client.rentals)
      const vehicle = rental?.vehicle
      const vehicleLabel = vehicle ? `${vehicle.brand} ${vehicle.model} ${vehicle.year}` : rental?.car_id ? `Vehicule #${String(rental.car_id).slice(0, 8)}` : 'Aucune voiture'
      const period = rental?.start_date && rental?.end_date
        ? `${format(new Date(rental.start_date), 'dd/MM/yyyy')} - ${format(new Date(rental.end_date), 'dd/MM/yyyy')}`
        : 'Pas de dates'

      return {
        label: vehicleLabel,
        detail: period,
        date: rental?.start_date,
        status: rental?.status,
      }
    }

    if (transactionTab === 'commande') {
      const order = getLatestRecord(client.imports)
      const vehicleLabel = order ? `${order.vehicle_brand || ''} ${order.vehicle_model || ''} ${order.vehicle_year || ''}`.trim() : 'Aucune commande'

      return {
        label: vehicleLabel || 'Commande sans vehicule',
        detail: order?.tracking_number || order?.container_number || order?.origin_country || 'Import / suivi a completer',
        date: order?.estimated_arrival || order?.order_date,
        status: order?.status,
      }
    }

    const sale = getLatestRecord(client.sales)
    const vehicle = sale?.vehicle
    const vehicleLabel = vehicle ? `${vehicle.brand} ${vehicle.model} ${vehicle.year}` : sale?.car_id ? `Vehicule #${String(sale.car_id).slice(0, 8)}` : 'Aucune voiture'

    return {
      label: vehicleLabel,
      detail: sale?.status || 'Vente stock',
      date: sale?.created_at,
      status: sale?.status,
    }
  }

  const getDocumentStats = (client: any) => {
    const docs = [
      { label: 'CNI', url: client.id_card_url, number: client.id_card_number },
      { label: businessTypeSlug === 'car_showroom' ? 'Permis' : 'Passeport', url: businessTypeSlug === 'car_showroom' ? client.license_url : client.passport_url, number: client.passport_number },
      { label: 'Passeport', url: businessTypeSlug === 'car_showroom' ? client.passport_url : null, number: null },
    ].filter(doc => doc.url || doc.number)

    return {
      docs,
      uploadedCount: docs.filter(doc => doc.url).length,
    }
  }

  // Custom UI metric renderer based on active transaction tab
  const renderTransactionMetrics = (client: any) => {
    if (businessTypeSlug === 'car_showroom') {
      if (transactionTab === 'ventes') {
        return (
          <div className="flex gap-4">
            <div className="text-center text-left">
              <span className="block text-[10px] text-slate-400 font-bold uppercase">Achats Stock</span>
              <span className="font-black text-slate-800">{client.sales?.length || 0}</span>
            </div>
            <div className="text-right ml-auto">
              <span className="block text-[10px] text-slate-400 font-bold uppercase">Total Facturé</span>
              <span className="font-black text-indigo-650 text-indigo-650/80 text-indigo-650 text-indigo-600">{client.totalSalesMoney.toLocaleString()} DZD</span>
            </div>
          </div>
        )
      }
      if (transactionTab === 'location') {
        return (
          <div className="flex gap-4">
            <div className="text-center text-left">
              <span className="block text-[10px] text-slate-400 font-bold uppercase">Locations</span>
              <span className="font-black text-slate-800">{client.rentals?.length || 0}</span>
            </div>
            <div className="text-right ml-auto">
              <span className="block text-[10px] text-slate-400 font-bold uppercase">Total Payé</span>
              <span className="font-black text-teal-650 text-teal-650/80 text-teal-650 text-teal-605 text-teal-600">{client.totalRentalMoney.toLocaleString()} DZD</span>
            </div>
          </div>
        )
      }
      if (transactionTab === 'commande') {
        return (
          <div className="flex gap-4">
            <div className="text-center text-left">
              <span className="block text-[10px] text-slate-400 font-bold uppercase">Importations</span>
              <span className="font-black text-slate-800">{client.imports?.length || 0}</span>
            </div>
            <div className="text-right ml-auto">
              <span className="block text-[10px] text-slate-400 font-bold uppercase">Total Facturé</span>
              <span className="font-black text-orange-650 text-orange-650/80 text-orange-655 text-orange-600">{client.totalImportMoney.toLocaleString()} DZD</span>
            </div>
          </div>
        )
      }
    } else {
      if (transactionTab === 'bookings') {
        return (
          <div className="flex gap-4">
            <div className="text-center text-left">
              <span className="block text-[10px] text-slate-400 font-bold uppercase">Réservations</span>
              <span className="font-black text-slate-800">{client.bookings?.length || 0}</span>
            </div>
            <div className="text-right ml-auto">
              <span className="block text-[10px] text-slate-400 font-bold uppercase">Total Réservé</span>
              <span className="font-black text-indigo-650 text-indigo-650/80 text-indigo-650 text-indigo-600">{client.totalBookingsMoney.toLocaleString()} DZD</span>
            </div>
          </div>
        )
      }
      if (transactionTab === 'visa') {
        return (
          <div className="flex gap-4">
            <div className="text-center text-left">
              <span className="block text-[10px] text-slate-400 font-bold uppercase">Dossiers Visa</span>
              <span className="font-black text-slate-800">{client.visas?.length || 0}</span>
            </div>
            <div className="text-right ml-auto">
              <span className="block text-[10px] text-slate-400 font-bold uppercase">Frais Visas</span>
              <span className="font-black text-teal-650 text-teal-650/80 text-teal-650 text-teal-600">{client.totalVisasMoney.toLocaleString()} DZD</span>
            </div>
          </div>
        )
      }
      if (transactionTab === 'invoices') {
        return (
          <div className="flex gap-4">
            <div className="text-center text-left">
              <span className="block text-[10px] text-slate-400 font-bold uppercase">Total Factures</span>
              <span className="font-black text-slate-800">{client.invoices?.length || 0}</span>
            </div>
            <div className="text-right ml-auto">
              <span className="block text-[10px] text-slate-400 font-bold uppercase">Total Payé</span>
              <span className="font-black text-emerald-650 text-emerald-650/80 text-emerald-600">{client.moneyPaid.toLocaleString()} DZD</span>
            </div>
          </div>
        )
      }
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-5 bg-[#f4f5f7] min-h-[calc(100vh-54px)] overflow-y-auto font-geist text-left">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-[#e8eaed] rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-r from-transparent to-indigo-50/25 pointer-events-none rounded-r-2xl" />
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className={cn("h-2 w-2 rounded-full animate-pulse", clientTypeTab === 'normal' ? "bg-indigo-600" : "bg-purple-600")} />
            <span className={cn("text-[10px] uppercase tracking-widest font-extrabold", clientTypeTab === 'normal' ? "text-indigo-600" : "text-purple-600")}>
              {businessTypeSlug === 'car_showroom' 
                ? (clientTypeTab === 'normal' ? (uiLanguage === 'ar' ? 'فئة الأفراد' : uiLanguage === 'fr' ? 'Module Particuliers' : 'Retail Clients') : (uiLanguage === 'ar' ? 'فئة الشركات والجملة' : uiLanguage === 'fr' ? 'Module B2B & Grossistes' : 'B2B & Enterprise'))
                : (clientTypeTab === 'normal' ? (uiLanguage === 'ar' ? 'المسافرين الأفراد' : uiLanguage === 'fr' ? 'Clients Individuels' : 'Retail Clients') : (uiLanguage === 'ar' ? 'المجموعات والشركات' : uiLanguage === 'fr' ? 'Clients Groupes & Corporate' : 'Group & Corporate'))
              }
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-850">
            {businessTypeSlug === 'car_showroom'
              ? (clientTypeTab === 'normal' ? (uiLanguage === 'ar' ? 'العملاء الأفراد' : uiLanguage === 'fr' ? 'Clients Particuliers' : 'Retail Clients') : (uiLanguage === 'ar' ? 'عملاء الجملة B2B' : uiLanguage === 'fr' ? 'Clients B2B & Grossistes' : 'Wholesale Clients B2B'))
              : (clientTypeTab === 'normal' ? (uiLanguage === 'ar' ? 'أدلة المسافرين' : uiLanguage === 'fr' ? 'Fiches Voyageurs' : 'Travelers List') : (uiLanguage === 'ar' ? 'حسابات المجموعات والشركات' : uiLanguage === 'fr' ? 'Comptes Groupes & Corporate' : 'Corporate Accounts'))
            }
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {businessTypeSlug === 'car_showroom'
              ? (uiLanguage === 'ar' ? 'إدارة الخصائص والفواتير والمستندات والمدفوعات لعملائك.' : uiLanguage === 'fr' ? 'Gerez vos acheteurs, revendeurs, factures, documents et paiements showroom.' : 'Manage specifications, invoices, and payments of your clients.')
              : (uiLanguage === 'ar' ? 'إدارة العملاء والحجوزات وملفات التأشيرات ومستحقات العملاء.' : uiLanguage === 'fr' ? 'Gérez les clients, réservations, dossiers de visa et règlements de vos clients.' : 'Manage clients, bookings, visa applications, and financial settlements.')
            }
          </p>
        </div>
        
        <Button 
          onClick={handleAddClick}
          className={cn(
            "text-white rounded-2xl font-bold py-2.5 px-4 flex items-center gap-1.5 shadow-md transition z-10 shrink-0",
            clientTypeTab === 'normal' ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200" : "bg-purple-600 hover:bg-purple-700 shadow-purple-200"
          )}
        >
          <UserPlus className="h-4.5 w-4.5" /> 
          {businessTypeSlug === 'car_showroom'
            ? (clientTypeTab === 'normal' ? (uiLanguage === 'ar' ? 'عميل جديد' : uiLanguage === 'fr' ? 'Nouveau Client' : 'New Client') : (uiLanguage === 'ar' ? 'شريك جديد' : uiLanguage === 'fr' ? 'Nouveau Partenaire' : 'New Partner'))
            : (clientTypeTab === 'normal' ? (uiLanguage === 'ar' ? 'مسافر جديد' : uiLanguage === 'fr' ? 'Nouveau Voyageur' : 'New Traveler') : (uiLanguage === 'ar' ? 'حساب جديد' : uiLanguage === 'fr' ? 'Nouveau Compte' : 'New Account'))
          }
        </Button>
      </div>

      {/* Top Level Tabs: Normal vs Gros */}
      <div className="flex bg-[#f3f4f6] p-1 rounded-xl w-fit">
        <button
          onClick={() => setClientTypeTab('normal')}
          className={cn(
            "px-6 py-2.5 rounded-[9px] font-bold text-sm transition duration-200 flex items-center gap-2",
            clientTypeTab === 'normal' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <UserPlus className="h-4 w-4" /> 
          {businessTypeSlug === 'car_showroom' 
            ? (uiLanguage === 'ar' ? 'العملاء الأفراد' : uiLanguage === 'fr' ? 'Clients Particuliers' : 'Retail Clients') 
            : (uiLanguage === 'ar' ? 'مسافرين أفراد' : uiLanguage === 'fr' ? 'Voyageurs Individuels' : 'Individual Travelers')
          }
        </button>
        <button
          onClick={() => setClientTypeTab('gros')}
          className={cn(
            "px-6 py-2.5 rounded-[9px] font-bold text-sm transition duration-200 flex items-center gap-2",
            clientTypeTab === 'gros' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <FileSpreadsheet className="h-4 w-4" /> 
          {businessTypeSlug === 'car_showroom' 
            ? (uiLanguage === 'ar' ? 'عملاء الجملة' : uiLanguage === 'fr' ? 'Revendeurs / B2B' : 'Wholesale / B2B') 
            : (uiLanguage === 'ar' ? 'مجموعات / شركات' : uiLanguage === 'fr' ? 'Comptes Groupes / CE' : 'Corporate / Groups')
          }
        </button>
      </div>

      {/* Secondary Tabs: Ventes, Location, Sur Commande OR Bookings, Visa, Invoices */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {businessTypeSlug === 'car_showroom' ? (
          <>
            <button
              onClick={() => setTransactionTab('ventes')}
              className={cn(
                "px-5 py-3 rounded-2xl font-extrabold text-xs transition duration-200 flex flex-col gap-1 min-w-[160px] border",
                transactionTab === 'ventes' 
                  ? "bg-blue-600 text-white border-blue-700 shadow-sm shadow-blue-200/60" 
                  : "bg-white text-gray-600 border-[#e8eaed] hover:border-blue-200 hover:bg-blue-50/30"
              )}
            >
              <div className="flex items-center justify-between w-full">
                <span className="uppercase tracking-widest text-[9px] opacity-80">Stock Auto</span>
                <Car className="h-4 w-4 opacity-90" />
              </div>
              <span className="text-sm">Ventes Stock</span>
            </button>

            <button
              onClick={() => setTransactionTab('location')}
              className={cn(
                "px-5 py-3 rounded-2xl font-extrabold text-xs transition duration-200 flex flex-col gap-1 min-w-[160px] border",
                transactionTab === 'location' 
                  ? "bg-blue-600 text-white border-blue-700 shadow-sm shadow-blue-200/60" 
                  : "bg-white text-gray-600 border-[#e8eaed] hover:border-blue-200 hover:bg-blue-50/30"
              )}
            >
              <div className="flex items-center justify-between w-full">
                <span className="uppercase tracking-widest text-[9px] opacity-80">Flotte Auto</span>
                <Key className="h-4 w-4 opacity-90" />
              </div>
              <span className="text-sm">Location Voitures</span>
            </button>

            <button
              onClick={() => setTransactionTab('commande')}
              className={cn(
                "px-5 py-3 rounded-2xl font-extrabold text-xs transition duration-200 flex flex-col gap-1 min-w-[160px] border",
                transactionTab === 'commande' 
                  ? "bg-blue-600 text-white border-blue-700 shadow-sm shadow-blue-200/60" 
                  : "bg-white text-gray-600 border-[#e8eaed] hover:border-blue-200 hover:bg-blue-50/30"
              )}
            >
              <div className="flex items-center justify-between w-full">
                <span className="uppercase tracking-widest text-[9px] opacity-80">Import & Tracking</span>
                <Package className="h-4 w-4 opacity-90" />
              </div>
              <span className="text-sm">Sur Commande</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setTransactionTab('bookings')}
              className={cn(
                "px-5 py-3 rounded-2xl font-extrabold text-xs transition duration-200 flex flex-col gap-1 min-w-[160px] border",
                transactionTab === 'bookings' 
                  ? "bg-blue-600 text-white border-blue-700 shadow-sm shadow-blue-200/60" 
                  : "bg-white text-gray-600 border-[#e8eaed] hover:border-blue-200 hover:bg-blue-50/30"
              )}
            >
              <div className="flex items-center justify-between w-full">
                <span className="uppercase tracking-widest text-[9px] opacity-80">Voyages</span>
                <Compass className="h-4 w-4 opacity-90" />
              </div>
              <span className="text-sm">Réservations Vols & Hôtels</span>
            </button>

            <button
              onClick={() => setTransactionTab('visa')}
              className={cn(
                "px-5 py-3 rounded-2xl font-extrabold text-xs transition duration-200 flex flex-col gap-1 min-w-[160px] border",
                transactionTab === 'visa' 
                  ? "bg-blue-600 text-white border-blue-700 shadow-sm shadow-blue-200/60" 
                  : "bg-white text-gray-600 border-[#e8eaed] hover:border-blue-200 hover:bg-blue-50/30"
              )}
            >
              <div className="flex items-center justify-between w-full">
                <span className="uppercase tracking-widest text-[9px] opacity-80">Services Visa</span>
                <Globe className="h-4 w-4 opacity-90" />
              </div>
              <span className="text-sm">Dossiers & Consulats</span>
            </button>

            <button
              onClick={() => setTransactionTab('invoices')}
              className={cn(
                "px-5 py-3 rounded-2xl font-extrabold text-xs transition duration-200 flex flex-col gap-1 min-w-[160px] border",
                transactionTab === 'invoices' 
                  ? "bg-blue-600 text-white border-blue-700 shadow-sm shadow-blue-200/60" 
                  : "bg-white text-gray-600 border-[#e8eaed] hover:border-blue-200 hover:bg-blue-50/30"
              )}
            >
              <div className="flex items-center justify-between w-full">
                <span className="uppercase tracking-widest text-[9px] opacity-80">Factures</span>
                <FileText className="h-4 w-4 opacity-90" />
              </div>
              <span className="text-sm">Paiements & Ledger</span>
            </button>
          </>
        )}
      </div>

      {/* Advanced Searching & Multi-Filter Panel */}
      <div className="bg-white border border-[#e8eaed] rounded-2xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              className="rounded-xl bg-slate-50 border-0 text-xs focus:bg-white pl-9 transition w-full outline-none focus:ring-0 text-slate-800" 
              placeholder={clientTypeTab === 'normal' ? "Rechercher un client..." : "Rechercher une entreprise..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 select-none">
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-2 outline-none font-bold text-slate-700"
            >
              <option value="all">Toutes Wilayas</option>
              {uniqueCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>

            <div className="bg-slate-100 border border-slate-200/50 p-1 rounded-2xl flex items-center shadow-inner ml-2">
              <button
                onClick={() => setViewType('grid')}
                className={cn("p-2 rounded-xl transition", viewType === 'grid' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400")}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewType('table')}
                className={cn("p-2 rounded-xl transition", viewType === 'table' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400")}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid / Table View */}
      {filteredClients.length === 0 ? (
        <div className="text-center py-20 bg-white border border-[#e8eaed] rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <UserPlus className="h-8 w-8 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-bold">Aucun résultat trouvé.</p>
        </div>
      ) : viewType === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
          {filteredClients.map((client) => {
            const initials = client.full_name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() || 'C'
            const avatarColor = clientTypeTab === 'normal' ? 'from-indigo-500 to-indigo-600' : 'from-purple-500 to-purple-600'
            
            return (
              <div key={client.id} className="bg-white rounded-2xl border border-[#e8eaed] shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200 group relative">
                
                {/* Transaction Badge */}
                <div className="absolute right-5 top-5">
                  {businessTypeSlug === 'car_showroom' ? (
                    <>
                      {transactionTab === 'commande' && client.hasImports && <Badge className="bg-orange-100 text-orange-700 border-none">Import Actif</Badge>}
                      {transactionTab === 'ventes' && client.hasSales && <Badge className="bg-indigo-100 text-indigo-700 border-none">Achat Historique</Badge>}
                      {transactionTab === 'location' && client.hasRentals && <Badge className="bg-teal-100 text-teal-700 border-none">Location Active</Badge>}
                    </>
                  ) : (
                    <>
                      {transactionTab === 'bookings' && client.bookings?.length > 0 && <Badge className="bg-indigo-100 text-indigo-700 border-none">Voyageur</Badge>}
                      {transactionTab === 'visa' && client.visas?.length > 0 && <Badge className="bg-teal-100 text-teal-700 border-none">Visa Client</Badge>}
                      {transactionTab === 'invoices' && client.invoices?.length > 0 && <Badge className="bg-emerald-100 text-emerald-700 border-none">Facturé</Badge>}
                    </>
                  )}
                </div>

                <div className="flex items-center gap-4 mb-5">
                  <div className={`h-12 w-12 rounded-[14px] bg-gradient-to-tr ${avatarColor} text-white font-black text-lg flex items-center justify-center shadow-md`}>
                    {initials}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-sm group-hover:text-indigo-600 transition">
                      {client.full_name}
                    </h3>
                    {clientTypeTab === 'gros' && client.company_legal_name && (
                      <span className="text-[10px] text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-md mt-1 inline-block">
                        {client.company_legal_name}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 block mt-1">{client.phone}</span>
                  </div>
                </div>

                {/* Specific Tab Metrics */}
                <div className="bg-[#f9fafb] rounded-xl p-4 mb-4 border border-[#f0f1f3]">
                  {renderTransactionMetrics(client)}
                </div>

                {/* Operations */}
                <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
                  <Link href={`/dashboard/clients/${client.id}`} className="flex-1">
                    <Button variant="outline" className="w-full h-9 text-xs font-bold bg-white rounded-xl shadow-sm">
                      <Eye className="h-3.5 w-3.5 mr-1.5" /> Fiche Client
                    </Button>
                  </Link>

                  <Button onClick={() => handleSendWhatsApp(client)} variant="ghost" className="h-9 w-9 p-0 text-emerald-600 hover:bg-emerald-50 rounded-xl">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  
                  <Link href={`/dashboard/invoices/new?client_id=${client.id}`}>
                    <Button variant="ghost" className="h-9 w-9 p-0 text-amber-600 hover:bg-amber-50 rounded-xl">
                      <FileText className="h-4 w-4" />
                    </Button>
                  </Link>
                  
                  <Button onClick={() => handleEditClick(client)} variant="ghost" className="h-9 w-9 p-0 text-slate-500 hover:bg-slate-50 rounded-xl">
                    <Edit3 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#e8eaed] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-left border-collapse rtl:text-right">
              <thead>
                <tr className="border-b border-[#e8eaed] bg-[#f9fafb] text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-4">{uiLanguage === 'ar' ? 'العميل' : 'Client'}</th>
                  <th className="px-5 py-4">{uiLanguage === 'ar' ? 'الاتصال والموقع' : 'Contact'}</th>
                  <th className="px-5 py-4">
                    {businessTypeSlug === 'car_showroom'
                      ? (transactionTab === 'location' ? 'Voiture a recuperer' : transactionTab === 'commande' ? 'Commande voiture' : 'Voiture / vente')
                      : 'Voyage / dossier'
                    }
                  </th>
                  <th className="px-5 py-4">{uiLanguage === 'ar' ? 'وثائق الهوية' : 'Documents'}</th>
                  <th className="px-5 py-4">Transactions</th>
                  <th className="px-5 py-4">{uiLanguage === 'ar' ? 'الوضعية المالية' : 'Finance'}</th>
                  <th className="px-5 py-4">Statut</th>
                  <th className="px-5 py-4 text-center">{uiLanguage === 'ar' ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredClients.map((client) => {
                  const initials = client.full_name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() || 'C'
                  const avatarColor = clientTypeTab === 'normal' ? 'from-indigo-500 to-indigo-600' : 'from-purple-500 to-purple-600'
                  const operational = getVehicleSummary(client)
                  const documentStats = getDocumentStats(client)
                  
                  let transactionSummary = ''
                  let transactionCount = 0
                  let transactionAmount = 0

                  if (businessTypeSlug === 'car_showroom') {
                    if (transactionTab === 'ventes') {
                      transactionCount = client.sales?.length || 0
                      transactionAmount = client.totalSalesMoney
                      transactionSummary = `${transactionCount} achat(s)`
                    } else if (transactionTab === 'location') {
                      transactionCount = client.rentals?.length || 0
                      transactionAmount = client.totalRentalMoney
                      transactionSummary = `${transactionCount} location(s)`
                    } else if (transactionTab === 'commande') {
                      transactionCount = client.imports?.length || 0
                      transactionAmount = client.totalImportMoney
                      transactionSummary = `${transactionCount} import(s)`
                    }
                  } else {
                    if (transactionTab === 'bookings') {
                      transactionCount = client.bookings?.length || 0
                      transactionAmount = client.totalBookingsMoney
                      transactionSummary = `${transactionCount} voyage(s)`
                    } else if (transactionTab === 'visa') {
                      transactionCount = client.visas?.length || 0
                      transactionAmount = client.totalVisasMoney
                      transactionSummary = `${transactionCount} dossier(s)`
                    } else if (transactionTab === 'invoices') {
                      transactionCount = client.invoices?.length || 0
                      transactionAmount = client.moneyPaid
                      transactionSummary = `${transactionCount} facture(s)`
                    }
                  }

                  return (
                    <tr key={client.id} className="hover:bg-[#f9fafb] transition-colors duration-100 group align-top">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 shrink-0 rounded-xl bg-gradient-to-tr ${avatarColor} text-white font-black text-xs flex items-center justify-center shadow-xs`}>
                            {initials}
                          </div>
                          <div>
                            <span className="font-black text-slate-800 text-[13px] block group-hover:text-indigo-600 transition">
                              {client.full_name}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {clientTypeTab === 'gros' && client.company_legal_name && (
                                <span className="text-[9px] text-purple-600 font-extrabold bg-purple-50 px-1.5 py-0.2 rounded-md">
                                  {client.company_legal_name}
                                </span>
                              )}
                              {client.classification && (
                                <span className="text-[9px] text-slate-505 font-bold bg-slate-100 px-1.5 py-0.2 rounded-md uppercase tracking-wider">
                                  {client.classification}
                                </span>
                              )}
                            </div>
                            {client.created_at && (
                              <div className="mt-1 text-[10px] font-semibold text-slate-400">
                                Cree le {format(new Date(client.created_at), 'dd/MM/yyyy')}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 space-y-1">
                        <div className="font-semibold text-slate-805 flex items-center gap-1">
                          <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>{client.phone || 'N/A'}</span>
                        </div>
                        {client.email && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Mail className="h-2.5 w-2.5 shrink-0" />
                            <span className="truncate max-w-[150px]">{client.email}</span>
                          </div>
                        )}
                        {client.city && (
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 font-bold">
                            <MapPin className="h-2.5 w-2.5 text-indigo-500 shrink-0" />
                            <span>{client.city}</span>
                          </div>
                        )}
                        {client.address && (
                          <div className="text-[10px] text-slate-400 max-w-[180px] truncate">{client.address}</div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="max-w-[230px]">
                          <div className="flex items-center gap-2 font-black text-slate-850">
                            <Car className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                            <span className="truncate">{operational.label}</span>
                          </div>
                          <div className="mt-1 text-[10px] font-semibold text-slate-500">
                            {operational.detail}
                          </div>
                          {operational.date && (
                            <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-slate-400">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(operational.date), 'dd/MM/yyyy')}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="mb-2 flex items-center gap-1.5">
                          <Badge variant="outline" className={cn(
                            'rounded-full px-2 py-0.5 text-[9px] font-black',
                            documentStats.uploadedCount > 0 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-500'
                          )}>
                            {documentStats.uploadedCount} upload(s)
                          </Badge>
                          {documentStats.docs.length === 0 && (
                            <span className="text-[10px] font-semibold text-slate-400">A completer</span>
                          )}
                        </div>
                        <div className="flex max-w-[230px] flex-wrap gap-1.5">
                          {documentStats.docs.map((doc) => (
                            doc.url ? (
                              <a
                                key={doc.label}
                                href={doc.url}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-lg border border-indigo-100 bg-indigo-50 px-2 py-1 text-[9px] font-black text-indigo-700 hover:bg-indigo-100"
                              >
                                {doc.label}
                              </a>
                            ) : (
                              <span key={doc.label} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[9px] font-black text-slate-500">
                                {doc.label}: {doc.number}
                              </span>
                            )
                          ))}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-black text-slate-800 text-[13px]">
                          {transactionSummary}
                        </div>
                        <div className="mt-1 text-[10px] text-slate-400 font-semibold">
                          {businessTypeSlug === 'car_showroom'
                            ? `${client.sales?.length || 0} vente(s), ${client.rentals?.length || 0} location(s), ${client.imports?.length || 0} commande(s)`
                            : `${client.bookings?.length || 0} voyage(s), ${client.visas?.length || 0} visa(s), ${client.invoices?.length || 0} facture(s)`
                          }
                        </div>
                        {getSourceBadge(client.source)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-black text-indigo-600 text-[13px]">
                          {transactionAmount.toLocaleString()} DZD
                        </div>
                        <div className="mt-1 text-[10px] text-slate-400 font-medium">
                          Paye: <span className="font-bold text-emerald-600">{client.moneyPaid.toLocaleString()} DZD</span>
                        </div>
                        <div className="mt-1 text-[10px] font-bold text-slate-500">
                          {client.invoices?.length || 0} facture(s)
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1.5">
                          <Badge variant="outline" className="w-fit rounded-full border-slate-200 bg-white px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-slate-600">
                            {operational.status || 'profil client'}
                          </Badge>
                          {client.notes && (
                            <div className="max-w-[170px] truncate text-[10px] font-medium text-slate-400" title={client.notes}>
                              {client.notes}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link href={`/dashboard/clients/${client.id}`} title="Fiche Client">
                            <Button variant="outline" className="h-8 px-2 text-[10px] font-bold bg-white rounded-lg shadow-xs hover:bg-slate-50">
                              <Eye className="h-3 w-3 mr-1" /> Fiche
                            </Button>
                          </Link>

                          <Button 
                            onClick={() => handleSendWhatsApp(client)} 
                            variant="ghost" 
                            className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                            title="Chat WhatsApp"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </Button>
                          
                          <Link href={`/dashboard/invoices/new?client_id=${client.id}`} title="Facturer">
                            <Button variant="ghost" className="h-8 w-8 p-0 text-amber-600 hover:bg-amber-50 rounded-lg">
                              <FileText className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          
                          <Button 
                            onClick={() => handleEditClick(client)} 
                            variant="ghost" 
                            className="h-8 w-8 p-0 text-slate-500 hover:bg-slate-50 rounded-lg"
                            title="Modifier"
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>

                          <Button 
                            onClick={() => handleDelete(client.id)} 
                            variant="ghost" 
                            className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50 rounded-lg"
                            title="Supprimer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
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
          activeTransactionTab={transactionTab}
          activeClientTypeTab={clientTypeTab}
          businessTypeSlug={businessTypeSlug}
          availableTrips={availableTrips}
        />
      )}
    </div>
  )
}


