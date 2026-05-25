'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Car, Plus, Search, Trash2, CheckCircle2,
  User, FileText, Edit3, X, Ship, Landmark, Anchor,
  DollarSign, Activity, Layers, Package, Check, Loader2,
  RefreshCw, AlertCircle, Globe, Zap, Navigation
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

import {
  getImportOrders,
  getAgencyClients,
  createImportOrder,
  updateImportOrder,
  deleteImportOrder
} from '@/app/actions/import-orders'
import {
  getContainers,
  getContainerDetails,
  createContainer,
  updateContainer,
  deleteContainer,
  linkCarsToContainer,
  unlinkCarsFromContainer,
  getUnlinkedImportCars
} from '@/app/actions/containers'

// ─── Constants ──────────────────────────────────────────────────────────────
const SHIPPING_LINES = ['MSC', 'CMA CGM', 'Maersk', 'Evergreen', 'ONE', 'HMM', 'Other']

const PIPELINE_STAGES = [
  { key: 'quote_requested', label: 'Quote',      color: 'slate',   icon: FileText },
  { key: 'deposit_paid',    label: 'Deposit',    color: 'blue',    icon: DollarSign },
  { key: 'ordered',         label: 'Ordered',    color: 'violet',  icon: Package },
  { key: 'in_production',   label: 'Production', color: 'purple',  icon: Zap },
  { key: 'shipped',         label: 'On Vessel',  color: 'indigo',  icon: Ship },
  { key: 'at_port_algiers', label: 'Arrived',    color: 'amber',   icon: Anchor },
  { key: 'customs',         label: 'Customs',    color: 'rose',    icon: Landmark },
  { key: 'delivered',       label: 'Delivered',  color: 'emerald', icon: CheckCircle2 },
]

const SHIPMENT_STAGES = [
  { key: 'At Origin Port',          label: 'Origin Port',     desc: 'Loading & gate-in at departure yard',  emoji: '🏗️' },
  { key: 'On Vessel',               label: 'On Vessel',       desc: 'Sailing on international waters',       emoji: '🚢' },
  { key: 'Arrived Port of Algiers', label: 'Arrived Algiers', desc: 'Vessel berthed at Algiers Port',       emoji: '⚓' },
  { key: 'In Customs',              label: 'In Customs',      desc: 'Transit agent clearing dossier',       emoji: '🏛️' },
  { key: 'Dispatched',              label: 'Dispatched',      desc: 'Loaded onto regional carrier truck',   emoji: '🚛' },
  { key: 'Delivered',               label: 'Delivered',       desc: 'Arrived at showroom & handed over',    emoji: '✅' },
]

const CUSTOMS_FIELDS = [
  { key: 'droits_de_douane',      label: 'Droits de Douane',      group: 'taxes' },
  { key: 'tva',                   label: 'TVA (Douane)',           group: 'taxes' },
  { key: 'daccis',                label: 'DACCIS',                 group: 'taxes' },
  { key: 'redevance_statistique', label: 'Redevance Statistique',  group: 'taxes' },
  { key: 'frais_de_dedouanement', label: 'Frais Dédouanement',     group: 'fees' },
  { key: 'magasinage',            label: 'Magasinage Port',        group: 'fees' },
  { key: 'gerbage',               label: 'Gerbage Port',           group: 'fees' },
  { key: 'visite',                label: 'Visite Douane',          group: 'fees' },
  { key: 'banque',                label: 'Frais de Banque',        group: 'fees' },
  { key: 'transport_local',       label: 'Transport Local',        group: 'fees' },
  { key: 'frais_divers',          label: 'Frais Divers',           group: 'fees' },
]

// ─── Style helpers ───────────────────────────────────────────────────────────
const STAGE_STYLES: Record<string, { badge: string; bar: string }> = {
  slate:   { badge: 'bg-slate-100 text-slate-700 border-slate-200',            bar: 'bg-slate-400' },
  blue:    { badge: 'bg-blue-100 text-blue-700 border-blue-200',               bar: 'bg-blue-500' },
  violet:  { badge: 'bg-violet-100 text-violet-700 border-violet-200',         bar: 'bg-violet-500' },
  purple:  { badge: 'bg-purple-100 text-purple-700 border-purple-200',         bar: 'bg-purple-500' },
  indigo:  { badge: 'bg-indigo-100 text-indigo-700 border-indigo-200',         bar: 'bg-indigo-500' },
  amber:   { badge: 'bg-amber-100 text-amber-700 border-amber-200',            bar: 'bg-amber-500' },
  rose:    { badge: 'bg-rose-100 text-rose-700 border-rose-200',               bar: 'bg-rose-500' },
  emerald: { badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',      bar: 'bg-emerald-500' },
}

function getPipelineStage(status: string) {
  return PIPELINE_STAGES.find(s => s.key === status) || PIPELINE_STAGES[0]
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function CarImportPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'containers'>('orders')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [orders, setOrders] = useState<any[]>([])
  const [containers, setContainers] = useState<any[]>([])
  const [unlinkedCars, setUnlinkedCars] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [activeOrder, setActiveOrder] = useState<any | null>(null)
  const [activeContainer, setActiveContainer] = useState<any | null>(null)
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false)
  const [isNewContainerOpen, setIsNewContainerOpen] = useState(false)
  const [isLinkingModalOpen, setIsLinkingModalOpen] = useState(false)

  const [selectedUnlinkedCars, setSelectedUnlinkedCars] = useState<string[]>([])
  const [linkingContainerId, setLinkingContainerId] = useState<string>('')

  const [newOrderForm, setNewOrderForm] = useState({
    client_id: '', clientName: '', clientPhone: '',
    vehicle_brand: '', vehicle_model: '', vehicle_year: '2026',
    color: '', total_cost: '', deposit_paid: '',
    supplier_name: '', origin_country: '',
  })

  const [newContainerForm, setNewContainerForm] = useState({
    container_number: '', shipping_line: 'MSC', status: 'At Origin Port',
    vessel_name: '', voyage_number: '', departure_port: 'Marseille',
    arrival_port: 'Algiers', departure_date: '', estimated_arrival_date: '', notes: '',
  })

  const [customsEditState, setCustomsEditState] = useState({
    droits_de_douane: 0, tva: 0, daccis: 0, redevance_statistique: 0,
    frais_de_dedouanement: 0, magasinage: 0, gerbage: 0, visite: 0,
    banque: 0, transport_local: 0, frais_divers: 0, total_cost: 0, deposit_paid: 0,
  })

  // ── Data loading ─────────────────────────────────────────────────────────
  const loadAllData = async () => {
    setLoading(true); setError(null)
    try {
      const [ordersRes, containersRes, unlinkedRes, clientsRes] = await Promise.all([
        getImportOrders(), getContainers(), getUnlinkedImportCars(), getAgencyClients()
      ])
      if (ordersRes.success)     setOrders(ordersRes.data || [])
      else throw new Error(ordersRes.error)
      if (containersRes.success) setContainers(containersRes.data || [])
      else throw new Error(containersRes.error)
      if (unlinkedRes.success)   setUnlinkedCars(unlinkedRes.data || [])
      else throw new Error(unlinkedRes.error)
      if (clientsRes.success)    setClients(clientsRes.data || [])
      else throw new Error(clientsRes.error)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAllData() }, [])

  // ── Customs helpers ───────────────────────────────────────────────────────
  const loadOrderForEditing = (order: any) => {
    setActiveOrder(order)
    const specs = order.specs || {}
    setCustomsEditState({
      droits_de_douane:      Number(specs.droits_de_douane || 0),
      tva:                   Number(specs.tva || 0),
      daccis:                Number(specs.daccis || 0),
      redevance_statistique: Number(specs.redevance_statistique || 0),
      frais_de_dedouanement: Number(specs.frais_de_dedouanement || 0),
      magasinage:            Number(specs.magasinage || 0),
      gerbage:               Number(specs.gerbage || 0),
      visite:                Number(specs.visite || 0),
      banque:                Number(specs.banque || 0),
      transport_local:       Number(specs.transport_local || 0),
      frais_divers:          Number(specs.frais_divers || 0),
      total_cost:            Number(order.total_cost || 0),
      deposit_paid:          Number(order.deposit_paid || 0),
    })
  }

  const calcCustomsTotal = (s: typeof customsEditState) =>
    s.droits_de_douane + s.tva + s.daccis + s.redevance_statistique +
    s.frais_de_dedouanement + s.magasinage + s.gerbage + s.visite +
    s.banque + s.transport_local + s.frais_divers

  // ── Save handlers ─────────────────────────────────────────────────────────
  const handleSaveCustoms = async () => {
    if (!activeOrder) return
    const totalFees = calcCustomsTotal(customsEditState)
    const updatedSpecs = {
      ...(activeOrder.specs || {}),
      ...Object.fromEntries(CUSTOMS_FIELDS.map(f => [f.key, (customsEditState as any)[f.key]])),
      total_customs_fees: totalFees,
    }
    const res = await updateImportOrder(activeOrder.id, {
      total_cost:    customsEditState.total_cost,
      deposit_paid:  customsEditState.deposit_paid,
      balance_due:   customsEditState.total_cost - customsEditState.deposit_paid,
      specs: updatedSpecs,
      custom_duties_fee:        customsEditState.droits_de_douane + customsEditState.tva + customsEditState.daccis + customsEditState.redevance_statistique,
      transitaire_broker_fee:   customsEditState.frais_de_dedouanement,
      additional_logistics_fee: customsEditState.magasinage + customsEditState.gerbage + customsEditState.visite + customsEditState.banque + customsEditState.transport_local + customsEditState.frais_divers,
    })
    if (res.success) {
      loadAllData()
      setActiveOrder({ ...activeOrder, total_cost: customsEditState.total_cost, deposit_paid: customsEditState.deposit_paid, balance_due: customsEditState.total_cost - customsEditState.deposit_paid, specs: updatedSpecs })
    } else alert('Failed to save: ' + res.error)
  }

  const handleToggleMilestone = async (n: 1 | 2 | 3) => {
    if (!activeOrder) return
    const specs = activeOrder.specs || {}
    const key = `milestone_${n}_paid`
    const updatedSpecs = { ...specs, [key]: !specs[key] }
    const res = await updateImportOrder(activeOrder.id, { specs: updatedSpecs })
    if (res.success) { loadAllData(); setActiveOrder({ ...activeOrder, specs: updatedSpecs }) }
  }

  const handleUpdateStatus = async (newStatus: string) => {
    if (!activeOrder) return
    const timeline = activeOrder.specs?.timeline || []
    const updatedTimeline = [...timeline, { stage: newStatus, date: new Date().toISOString().split('T')[0], note: `Status updated to ${newStatus}.` }]
    const res = await updateImportOrder(activeOrder.id, { status: newStatus, specs: { ...(activeOrder.specs || {}), timeline: updatedTimeline } })
    if (res.success) { loadAllData(); setActiveOrder({ ...activeOrder, status: newStatus, specs: { ...(activeOrder.specs || {}), timeline: updatedTimeline } }) }
  }

  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const tCost = Number(newOrderForm.total_cost) || 0
    const dPaid = Number(newOrderForm.deposit_paid) || 0
    const res = await createImportOrder({
      client_id: newOrderForm.client_id || undefined,
      clientName: newOrderForm.clientName || undefined,
      clientPhone: newOrderForm.clientPhone || undefined,
      vehicle_brand: newOrderForm.vehicle_brand,
      vehicle_model: newOrderForm.vehicle_model,
      vehicle_year: Number(newOrderForm.vehicle_year),
      color: newOrderForm.color || undefined,
      total_cost: tCost, deposit_paid: dPaid, balance_due: tCost - dPaid,
      supplier_name: newOrderForm.supplier_name || undefined,
      origin_country: newOrderForm.origin_country || undefined,
      specs: {
        droits_de_douane: Math.round((tCost * 0.6) * 0.3),
        tva: Math.round((tCost * 0.6) * 0.19),
        daccis: 100000, redevance_statistique: 20000, frais_de_dedouanement: 50000,
        banque: 15000, transport_local: 40000, frais_divers: 10000,
        milestone_1_paid: dPaid >= (tCost * 0.3),
        milestone_2_paid: false, milestone_3_paid: false,
        timeline: [{ stage: 'ordered', date: new Date().toISOString().split('T')[0], note: 'Import order registered.' }]
      }
    })
    if (res.success) {
      setIsNewOrderOpen(false)
      setNewOrderForm({ client_id: '', clientName: '', clientPhone: '', vehicle_brand: '', vehicle_model: '', vehicle_year: '2026', color: '', total_cost: '', deposit_paid: '', supplier_name: '', origin_country: '' })
      loadAllData()
    } else alert('Failed: ' + res.error)
  }

  const handleDeleteOrder = async (id: string) => {
    if (!confirm('Delete this import dossier permanently?')) return
    const res = await deleteImportOrder(id)
    if (res.success) { setActiveOrder(null); loadAllData() }
    else alert('Error: ' + res.error)
  }

  const handleCreateContainerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await createContainer({
      ...newContainerForm,
      departure_date: newContainerForm.departure_date ? new Date(newContainerForm.departure_date).toISOString() : undefined,
      estimated_arrival_date: newContainerForm.estimated_arrival_date ? new Date(newContainerForm.estimated_arrival_date).toISOString() : undefined,
    })
    if (res.success) {
      setIsNewContainerOpen(false)
      setNewContainerForm({ container_number: '', shipping_line: 'MSC', status: 'At Origin Port', vessel_name: '', voyage_number: '', departure_port: 'Marseille', arrival_port: 'Algiers', departure_date: '', estimated_arrival_date: '', notes: '' })
      loadAllData()
    } else alert('Failed: ' + res.error)
  }

  const handleUpdateContainerStatus = async (containerId: string, newStatus: string) => {
    const res = await updateContainer(containerId, { status: newStatus })
    if (res.success) {
      loadAllData()
      if (activeContainer?.id === containerId) setActiveContainer({ ...activeContainer, status: newStatus })
    } else alert('Failed: ' + res.error)
  }

  const handleDeleteContainer = async (id: string) => {
    if (!confirm('Delete this container? Linked cars will be safely unlinked.')) return
    const res = await deleteContainer(id)
    if (res.success) { setActiveContainer(null); loadAllData() }
    else alert('Failed: ' + res.error)
  }

  const openLinkingModal = (containerId: string) => {
    setLinkingContainerId(containerId); setSelectedUnlinkedCars([]); setIsLinkingModalOpen(true)
  }

  const handleLinkCars = async () => {
    if (selectedUnlinkedCars.length === 0) return
    const res = await linkCarsToContainer(linkingContainerId, selectedUnlinkedCars)
    if (res.success) {
      setIsLinkingModalOpen(false); loadAllData()
      if (activeContainer?.id === linkingContainerId) {
        const details = await getContainerDetails(linkingContainerId)
        if (details.success) setActiveContainer(details.data)
      }
    } else alert('Failed: ' + res.error)
  }

  const handleUnlinkCar = async (carId: string) => {
    if (!confirm('Unlink this vehicle from the container?')) return
    const res = await unlinkCarsFromContainer([carId])
    if (res.success) {
      loadAllData()
      if (activeContainer) {
        const details = await getContainerDetails(activeContainer.id)
        if (details.success) setActiveContainer(details.data)
      }
    }
  }

  const viewContainerDetails = async (container: any) => {
    const res = await getContainerDetails(container.id)
    if (res.success) setActiveContainer({ ...res.data, linkedCars: (res as any).linkedCars || [] })
    else setActiveContainer(container)
  }

  // ── Computed ──────────────────────────────────────────────────────────────
  const filteredOrders = orders.filter(o => {
    const name = o.client?.full_name || ''
    const matchSearch = name.toLowerCase().includes(search.toLowerCase()) ||
      o.vehicle_brand.toLowerCase().includes(search.toLowerCase()) ||
      o.vehicle_model.toLowerCase().includes(search.toLowerCase()) ||
      (o.container_number || '').toLowerCase().includes(search.toLowerCase())
    return matchSearch && (statusFilter === 'all' || o.status === statusFilter)
  })

  const filteredContainers = containers.filter(c =>
    c.container_number.toLowerCase().includes(search.toLowerCase()) ||
    (c.vessel_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.shipping_line || '').toLowerCase().includes(search.toLowerCase())
  )

  const stats = useMemo(() => ({
    total:     orders.length,
    active:    containers.filter(c => c.status !== 'Delivered').length,
    inCustoms: orders.filter(o => o.status === 'customs' || o.status === 'at_port_algiers').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  }), [orders, containers])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-hidden flex flex-col gap-5 text-left">

      {/* ── STATS ROW ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {[
          { label: 'Import Volume',    value: stats.total,     sub: 'total dossiers',       icon: Globe,         color: 'indigo', pulse: false },
          { label: 'Active Shipments', value: stats.active,    sub: 'at sea or in port',    icon: Ship,          color: 'blue',   pulse: false },
          { label: 'In Customs',       value: stats.inCustoms, sub: 'awaiting clearance',   icon: Landmark,      color: 'amber',  pulse: stats.inCustoms > 0 },
          { label: 'Delivered',        value: stats.delivered, sub: 'closed & received',    icon: CheckCircle2,  color: 'emerald',pulse: false },
        ].map(s => {
          const Icon = s.icon
          const iconClass: Record<string,string> = {
            indigo:  'bg-indigo-50 text-indigo-600 border-indigo-100',
            blue:    'bg-blue-50 text-blue-600 border-blue-100',
            amber:   'bg-amber-50 text-amber-600 border-amber-100',
            emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
          }
          return (
            <div key={s.label} className="bg-white border border-slate-200/80 rounded-2xl p-5 flex items-center gap-4 hover:shadow-sm transition-shadow">
              <div className={`h-12 w-12 rounded-xl border flex items-center justify-center shrink-0 ${iconClass[s.color]}`}>
                <Icon className={`h-5 w-5${s.pulse ? ' animate-pulse' : ''}`} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{s.label}</p>
                <p className="text-2xl font-black text-slate-900 leading-tight">{s.value}</p>
                <p className="text-[10px] text-slate-400 font-semibold">{s.sub}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── CONTROL BAR ── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 bg-white border border-slate-200/80 rounded-2xl px-4 py-3 shadow-xs shrink-0">
        <div className="flex bg-slate-100 p-1 rounded-xl gap-0.5 border">
          <button onClick={() => { setActiveTab('orders'); setSearch('') }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-black rounded-lg transition cursor-pointer ${activeTab === 'orders' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <Layers className="h-3.5 w-3.5" /> Import Dossiers
            {orders.length > 0 && <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${activeTab === 'orders' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>{orders.length}</span>}
          </button>
          <button onClick={() => { setActiveTab('containers'); setSearch('') }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-black rounded-lg transition cursor-pointer ${activeTab === 'containers' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <Ship className="h-3.5 w-3.5" /> Shipping Containers
            {containers.length > 0 && <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${activeTab === 'containers' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>{containers.length}</span>}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={activeTab === 'orders' ? 'Search dossiers...' : 'Search containers...'}
              className="pl-8 text-xs rounded-xl border-slate-200 h-9 w-52" />
          </div>

          {activeTab === 'orders' && (
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 bg-white h-9 cursor-pointer">
              <option value="all">All Stages</option>
              {PIPELINE_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          )}

          <Button onClick={() => activeTab === 'orders' ? setIsNewOrderOpen(true) : setIsNewContainerOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black h-9 gap-1.5 cursor-pointer shadow-sm">
            <Plus className="h-3.5 w-3.5" />
            {activeTab === 'orders' ? 'New Import Order' : 'New Container'}
          </Button>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-white border border-slate-200/80 rounded-2xl">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
          <p className="text-xs font-bold text-slate-400 mt-3">Loading from database...</p>
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center">
          <AlertCircle className="h-10 w-10 text-rose-500 mb-3" />
          <h4 className="text-sm font-black text-rose-800">Database Connection Failed</h4>
          <p className="text-xs text-rose-600 mt-1 max-w-md">{error}</p>
          <Button onClick={loadAllData} className="mt-4 bg-rose-600 text-white rounded-xl text-xs h-9 gap-1.5 cursor-pointer">
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </Button>
        </div>

      ) : activeTab === 'orders' ? (
        /* ═══════════════ ORDERS GRID ═══════════════ */
        <div className="flex-1 overflow-y-auto scrollbar-thin pr-1">
          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-slate-200 rounded-2xl bg-white text-center">
              <div className="h-16 w-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-indigo-400" />
              </div>
              <p className="font-black text-slate-700">No import dossiers found</p>
              <p className="text-xs text-slate-400 mt-1">Log your first import order to activate the pipeline.</p>
              <Button onClick={() => setIsNewOrderOpen(true)} className="mt-4 bg-indigo-600 text-white rounded-xl text-xs h-9 gap-1.5 cursor-pointer">
                <Plus className="h-3.5 w-3.5" /> New Import Order
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredOrders.map(order => {
                const specs = order.specs || {}
                const stage = getPipelineStage(order.status)
                const ss = STAGE_STYLES[stage.color]
                const stageIdx = PIPELINE_STAGES.findIndex(s => s.key === order.status)
                const progressPct = Math.round(((stageIdx + 1) / PIPELINE_STAGES.length) * 100)
                const msPaid = [specs.milestone_1_paid, specs.milestone_2_paid, specs.milestone_3_paid].filter(Boolean).length
                const Icon = stage.icon

                return (
                  <div key={order.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col">
                    {/* Stage accent bar */}
                    <div className={`h-1.5 w-full ${ss.bar}`} />

                    <div className="p-5 flex flex-col gap-4 flex-1">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-slate-900 text-sm leading-tight truncate">
                            {order.vehicle_brand} {order.vehicle_model}
                          </h4>
                          <p className="text-xs text-slate-500 font-semibold mt-0.5">
                            {order.vehicle_year}{order.color ? ` · ${order.color}` : ''}
                          </p>
                          <div className="flex items-center gap-1 mt-1.5">
                            <User className="h-3 w-3 text-slate-400" />
                            <span className="text-xs text-slate-500 font-semibold truncate">
                              {order.client?.full_name || 'Walk-in client'}
                            </span>
                          </div>
                        </div>
                        <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[10px] font-black uppercase shrink-0 ${ss.badge}`}>
                          <Icon className="h-3 w-3" />
                          {stage.label}
                        </div>
                      </div>

                      {/* Pipeline progress */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-slate-400">Pipeline Progress</span>
                          <span className={`font-black ${ss.badge.split(' ')[1]}`}>{progressPct}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${ss.bar}`} style={{ width: `${progressPct}%` }} />
                        </div>
                        <div className="flex gap-0.5">
                          {PIPELINE_STAGES.map((s, i) => (
                            <div key={s.key} title={s.label}
                              className={`flex-1 h-1 rounded-sm transition-all ${i <= stageIdx ? ss.bar : 'bg-slate-100'}`} />
                          ))}
                        </div>
                      </div>

                      {/* Financials */}
                      <div className="bg-slate-50 rounded-xl border border-slate-100 p-3 grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase">Total Price</p>
                          <p className="text-sm font-black text-slate-900">{(order.total_cost || 0).toLocaleString()}</p>
                          <p className="text-[9px] text-slate-400">DZD</p>
                        </div>
                        <div className="border-l border-slate-200 pl-3">
                          <p className="text-[9px] font-black text-slate-400 uppercase">Balance Due</p>
                          <p className={`text-sm font-black ${(order.balance_due || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {(order.balance_due || 0).toLocaleString()}
                          </p>
                          <p className="text-[9px] text-slate-400">DZD</p>
                        </div>
                      </div>

                      {/* Container link */}
                      {order.container_id ? (
                        <div className="flex items-center gap-2 bg-slate-900 text-white rounded-xl px-3 py-2.5 text-[10px] font-bold">
                          <Ship className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                          <span className="text-slate-400">Container:</span>
                          <span className="font-mono text-indigo-300 font-black">{order.container_number || 'Linked'}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 bg-slate-50 border border-dashed border-slate-200 rounded-xl px-3 py-2.5 text-[10px] font-bold text-slate-400">
                          <Package className="h-3.5 w-3.5" />
                          No container linked — loose cargo
                        </div>
                      )}

                      {/* Payment milestones */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-black">
                          <span className="text-slate-400 uppercase">Payment Milestones</span>
                          <span className={msPaid === 3 ? 'text-emerald-600' : 'text-indigo-500'}>{msPaid}/3 Settled</span>
                        </div>
                        <div className="flex gap-1.5">
                          {[specs.milestone_1_paid, specs.milestone_2_paid, specs.milestone_3_paid].map((paid, i) => (
                            <div key={i} title={['30% Deposit', '30% On Vessel', '40% Clearance'][i]}
                              className={`flex-1 h-2 rounded-full transition-all ${paid ? 'bg-indigo-500' : 'bg-slate-100'}`} />
                          ))}
                        </div>
                      </div>

                      {/* CTA */}
                      <Button onClick={() => loadOrderForEditing(order)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black h-9 gap-1.5 cursor-pointer mt-auto">
                        <Edit3 className="h-3.5 w-3.5" /> Open Dossier & Dédouanement
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      ) : (
        /* ═══════════════ CONTAINERS GRID ═══════════════ */
        <div className="flex-1 overflow-y-auto scrollbar-thin pr-1">
          {filteredContainers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-slate-200 rounded-2xl bg-white text-center">
              <div className="h-16 w-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
                <Ship className="h-8 w-8 text-blue-400" />
              </div>
              <p className="font-black text-slate-700">No containers registered</p>
              <p className="text-xs text-slate-400 mt-1">Register a shipping container BOL to track maritime logistics.</p>
              <Button onClick={() => setIsNewContainerOpen(true)} className="mt-4 bg-indigo-600 text-white rounded-xl text-xs h-9 gap-1.5 cursor-pointer">
                <Plus className="h-3.5 w-3.5" /> Register Container
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filteredContainers.map(container => {
                const linkedV = orders.filter(o => o.container_id === container.id)
                const currentStageIdx = SHIPMENT_STAGES.findIndex(s => s.key === container.status)
                const currentStage = SHIPMENT_STAGES[currentStageIdx] || SHIPMENT_STAGES[0]

                return (
                  <div key={container.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition-all duration-200">
                    {/* Dark header */}
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                          <Ship className="h-4 w-4 text-indigo-300" />
                        </div>
                        <div>
                          <p className="font-black text-white font-mono text-sm tracking-wide uppercase">{container.container_number}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] font-black text-indigo-300 bg-indigo-900/50 border border-indigo-800/50 px-2 py-0.5 rounded-full uppercase">{container.shipping_line}</span>
                            <span className="text-[9px] text-slate-400 font-semibold">{container.vessel_name || 'Vessel TBA'}</span>
                          </div>
                        </div>
                      </div>
                      <select value={container.status} onChange={e => handleUpdateContainerStatus(container.id, e.target.value)}
                        className="bg-white/10 border border-white/20 text-white text-[9px] font-black rounded-lg px-2 py-1.5 cursor-pointer focus:outline-none">
                        {SHIPMENT_STAGES.map(s => <option key={s.key} value={s.key} className="text-slate-900 bg-white">{s.label}</option>)}
                      </select>
                    </div>

                    <div className="p-5 space-y-4">
                      {/* Route bar */}
                      <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                        <div className="text-center">
                          <p className="text-[9px] font-black text-slate-400 uppercase">From</p>
                          <p className="text-xs font-black text-slate-800">{container.departure_port}</p>
                        </div>
                        <div className="flex-1 flex items-center gap-1">
                          <div className="flex-1 h-px bg-slate-200" />
                          <div className="h-6 w-6 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center">
                            <Ship className="h-3 w-3 text-indigo-500" />
                          </div>
                          <div className="flex-1 h-px bg-slate-200" />
                        </div>
                        <div className="text-center">
                          <p className="text-[9px] font-black text-slate-400 uppercase">To</p>
                          <p className="text-xs font-black text-slate-800">{container.arrival_port}</p>
                        </div>
                        {container.estimated_arrival_date && (
                          <div className="border-l border-slate-200 pl-3 text-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase">ETA</p>
                            <p className="text-[10px] font-black text-indigo-600">
                              {new Date(container.estimated_arrival_date).toLocaleDateString('fr-DZ', { day: '2-digit', month: 'short' })}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Journey progress */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-400 uppercase">Maritime Journey</span>
                          <span className="text-[10px] font-black text-indigo-600">{currentStage.emoji} {currentStage.label}</span>
                        </div>
                        <div className="flex gap-0.5">
                          {SHIPMENT_STAGES.map((s, idx) => (
                            <div key={s.key} title={s.label}
                              className={`flex-1 h-2.5 rounded-sm transition-all cursor-help ${
                                idx < currentStageIdx ? 'bg-emerald-500' : idx === currentStageIdx ? 'bg-indigo-500 animate-pulse' : 'bg-slate-100'
                              }`} />
                          ))}
                        </div>
                        <div className="flex justify-between text-[9px] font-bold text-slate-400">
                          {SHIPMENT_STAGES.map((s, i) => (
                            <span key={s.key} className={i === currentStageIdx ? 'text-indigo-600 font-black' : ''}>{s.emoji}</span>
                          ))}
                        </div>
                      </div>

                      {/* Vehicles */}
                      <div className="border-t border-slate-100 pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black text-slate-500 uppercase">Manifest ({linkedV.length} vehicles)</span>
                          <button onClick={() => openLinkingModal(container.id)}
                            className="flex items-center gap-1 text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg hover:bg-indigo-100 transition cursor-pointer">
                            <Plus className="h-3 w-3" /> Link Car
                          </button>
                        </div>
                        {linkedV.length > 0 ? (
                          <div className="space-y-1.5">
                            {linkedV.map(car => (
                              <div key={car.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                                  <span className="text-xs font-bold text-slate-700">{car.vehicle_brand} {car.vehicle_model} ({car.vehicle_year})</span>
                                </div>
                                <button onClick={() => handleUnlinkCar(car.id)}
                                  className="text-rose-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition cursor-pointer" title="Unlink">
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="border border-dashed border-slate-200 rounded-xl p-4 text-center text-[10px] text-slate-400 font-bold">
                            No vehicles assigned yet
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 border-t border-slate-100 pt-3">
                        <Button onClick={() => viewContainerDetails(container)}
                          className="flex-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-[10px] font-black h-9 cursor-pointer">
                          Vessel Timeline
                        </Button>
                        <Button onClick={() => handleDeleteContainer(container.id)}
                          className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-xl text-[10px] font-black h-9 px-3 cursor-pointer">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ ORDER DOSSIER DRAWER ═══════════════ */}
      {activeOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-end z-50 animate-fadeIn"
          onClick={() => setActiveOrder(null)}>
          <div className="bg-white w-full max-w-3xl h-screen flex flex-col shadow-2xl border-l border-slate-200 animate-slideInRight"
            onClick={e => e.stopPropagation()}>

            {/* Drawer header */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 px-6 py-5 text-white shrink-0">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {(() => {
                      const s = getPipelineStage(activeOrder.status)
                      const Icon = s.icon
                      const c = STAGE_STYLES[s.color]
                      return (
                        <span className={`flex items-center gap-1.5 text-[9px] font-black px-2.5 py-1 rounded-full border uppercase ${c.badge}`}>
                          <Icon className="h-3 w-3" />{s.label}
                        </span>
                      )
                    })()}
                    <span className="text-[10px] text-slate-400 font-bold">Import Dossier</span>
                  </div>
                  <h3 className="text-lg font-black tracking-tight">
                    {activeOrder.vehicle_brand} {activeOrder.vehicle_model} ({activeOrder.vehicle_year})
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <User className="h-3 w-3" />
                    {activeOrder.client?.full_name || 'Walk-in client'}
                    {activeOrder.origin_country && (
                      <><span className="text-slate-600">·</span><Globe className="h-3 w-3" />{activeOrder.origin_country}</>
                    )}
                  </p>
                </div>
                <button onClick={() => setActiveOrder(null)}
                  className="h-8 w-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Financial strip */}
              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/10">
                <div>
                  <p className="text-[9px] text-slate-400 uppercase font-black">Total Price</p>
                  <p className="text-sm font-black text-white">{(activeOrder.total_cost || 0).toLocaleString()} DZD</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 uppercase font-black">Deposit Paid</p>
                  <p className="text-sm font-black text-emerald-400">{(activeOrder.deposit_paid || 0).toLocaleString()} DZD</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 uppercase font-black">Balance Due</p>
                  <p className={`text-sm font-black ${(activeOrder.balance_due || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {(activeOrder.balance_due || 0).toLocaleString()} DZD
                  </p>
                </div>
              </div>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              <div className="p-6 grid grid-cols-1 xl:grid-cols-2 gap-6">

                {/* LEFT: Pricing + Customs */}
                <div className="space-y-5">
                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5 text-indigo-500" /> Pricing
                      </h4>
                      <Button onClick={handleSaveCustoms}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black h-7 px-3 cursor-pointer gap-1">
                        <Check className="h-3 w-3" /> Save Changes
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black text-slate-400 uppercase">Client Selling Price (DZD)</Label>
                        <Input type="number" value={customsEditState.total_cost}
                          onChange={e => setCustomsEditState(p => ({ ...p, total_cost: Number(e.target.value) }))}
                          className="rounded-xl border-slate-200 font-black text-indigo-600 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black text-slate-400 uppercase">Deposit Collected (DZD)</Label>
                        <Input type="number" value={customsEditState.deposit_paid}
                          onChange={e => setCustomsEditState(p => ({ ...p, deposit_paid: Number(e.target.value) }))}
                          className="rounded-xl border-slate-200 font-black text-emerald-600 text-sm" />
                      </div>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Anchor className="h-3.5 w-3.5 text-rose-500" /> Dédouanement — Algerian Port Fees
                    </h4>

                    {/* Taxes group */}
                    <div className="bg-rose-50/60 border border-rose-100 rounded-2xl p-4 space-y-3">
                      <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest">🏛️ Taxes Douanières</p>
                      <div className="grid grid-cols-2 gap-2.5">
                        {CUSTOMS_FIELDS.filter(f => f.group === 'taxes').map(f => (
                          <div key={f.key} className="space-y-1">
                            <Label className="text-[9px] font-bold text-slate-500">{f.label}</Label>
                            <Input type="number" value={(customsEditState as any)[f.key]}
                              onChange={e => setCustomsEditState(p => ({ ...p, [f.key]: Number(e.target.value) }))}
                              className="rounded-lg border-slate-200 text-xs font-bold h-8 px-2 bg-white" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Fees group */}
                    <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4 space-y-3">
                      <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">🚛 Frais Logistiques & Transitaire</p>
                      <div className="grid grid-cols-2 gap-2.5">
                        {CUSTOMS_FIELDS.filter(f => f.group === 'fees').map(f => (
                          <div key={f.key} className="space-y-1">
                            <Label className="text-[9px] font-bold text-slate-500">{f.label}</Label>
                            <Input type="number" value={(customsEditState as any)[f.key]}
                              onChange={e => setCustomsEditState(p => ({ ...p, [f.key]: Number(e.target.value) }))}
                              className="rounded-lg border-slate-200 text-xs font-bold h-8 px-2 bg-white" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Totals */}
                    <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 space-y-2">
                      <div className="flex justify-between text-xs font-bold text-slate-600">
                        <span>Total Customs Duties & Fees</span>
                        <span className="text-rose-600 font-black">{calcCustomsTotal(customsEditState).toLocaleString()} DZD</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold text-slate-600">
                        <span>Est. Purchase Cost (60%)</span>
                        <span>{Math.round(customsEditState.total_cost * 0.6).toLocaleString()} DZD</span>
                      </div>
                      <div className="border-t border-indigo-200/50 pt-2 flex justify-between items-baseline">
                        <span className="text-xs font-black text-slate-700">Estimated Gross Margin</span>
                        <span className={`text-base font-black ${
                          (customsEditState.total_cost - calcCustomsTotal(customsEditState) - customsEditState.total_cost * 0.6) >= 0
                            ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {(customsEditState.total_cost - calcCustomsTotal(customsEditState) - customsEditState.total_cost * 0.6).toLocaleString()} DZD
                        </span>
                      </div>
                    </div>
                  </section>
                </div>

                {/* RIGHT: Milestones, Status, Timeline */}
                <div className="space-y-5">

                  {/* 30/30/40 Milestones */}
                  <section className="space-y-3">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> 30 / 30 / 40 Payment Milestones
                    </h4>
                    {[
                      { n: 1 as const, label: '1. Sign-on Deposit',   pct: 0.3, desc: 'Paid at order signature' },
                      { n: 2 as const, label: '2. Ocean Departure',   pct: 0.3, desc: 'Paid when vessel departs' },
                      { n: 3 as const, label: '3. Port Clearance',    pct: 0.4, desc: 'Paid at customs handover' },
                    ].map(m => {
                      const paid = activeOrder.specs?.[`milestone_${m.n}_paid`]
                      return (
                        <div key={m.n} className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${paid ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${paid ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                              {paid ? <Check className="h-4 w-4 stroke-[3]" /> : <span className="text-xs font-black">{m.n}</span>}
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-800">{m.label}</p>
                              <p className="text-[10px] text-slate-400">{m.desc} · {(activeOrder.total_cost * m.pct).toLocaleString()} DZD</p>
                            </div>
                          </div>
                          <Switch checked={paid || false} onCheckedChange={() => handleToggleMilestone(m.n)} />
                        </div>
                      )
                    })}
                  </section>

                  {/* Shipping info */}
                  <section className="p-4 bg-slate-900 rounded-2xl space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1.5">
                      <Ship className="h-3.5 w-3.5 text-indigo-400" /> Maritime Shipping Info
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {[
                        { l: 'Carrier',       v: activeOrder.carrier || 'Pending' },
                        { l: 'Container BOL', v: activeOrder.container_number || 'N/A', mono: true },
                        { l: 'Transit Status',v: activeOrder.tracking_status || 'At Origin Port' },
                        { l: 'Supplier',      v: activeOrder.supplier_name || 'N/A' },
                      ].map(item => (
                        <div key={item.l}>
                          <p className="text-[9px] text-slate-500 uppercase font-black">{item.l}</p>
                          <p className={`text-white font-bold mt-0.5 ${item.mono ? 'font-mono text-indigo-300' : ''}`}>{item.v}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Stage override */}
                  <section className="space-y-2">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Navigation className="h-3.5 w-3.5 text-indigo-500" /> Pipeline Stage Override
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {PIPELINE_STAGES.map(s => {
                        const isCurrent = activeOrder.status === s.key
                        const ss = STAGE_STYLES[s.color]
                        const Icon = s.icon
                        return (
                          <button key={s.key} onClick={() => handleUpdateStatus(s.key)}
                            className={`flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                              isCurrent ? `${ss.badge} shadow-sm` : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                            }`}>
                            <Icon className="h-3 w-3" /> {s.label}
                          </button>
                        )
                      })}
                    </div>
                  </section>

                  {/* Audit log */}
                  <section className="space-y-3">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5 text-slate-400" /> Audit Log
                    </h4>
                    <div className="relative pl-5 border-l border-slate-200 space-y-4">
                      {(activeOrder.specs?.timeline || [{ stage: 'ordered', date: activeOrder.order_date, note: 'Order registered.' }]).map((item: any, idx: number) => (
                        <div key={idx} className="relative">
                          <div className="absolute -left-[22px] top-1 h-3 w-3 rounded-full bg-white border-2 border-indigo-500" />
                          <p className="text-[10px] font-black text-slate-700 uppercase tracking-wide capitalize">{item.stage?.replace(/_/g, ' ')}</p>
                          <p className="text-[9px] text-slate-400 font-mono">{item.date}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{item.note}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Danger zone */}
                  <section className="border-t pt-4">
                    <Button onClick={() => handleDeleteOrder(activeOrder.id)}
                      className="w-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-black text-xs rounded-xl h-10 gap-1.5 cursor-pointer">
                      <Trash2 className="h-4 w-4" /> Archive & Delete Dossier
                    </Button>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ CONTAINER TIMELINE MODAL ═══════════════ */}
      {activeContainer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border w-full max-w-2xl overflow-hidden animate-scaleIn text-left max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <Ship className="h-5 w-5 text-indigo-400" />
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Container Tracking</p>
                  <h3 className="font-black text-sm font-mono uppercase">{activeContainer.container_number}</h3>
                </div>
              </div>
              <button onClick={() => setActiveContainer(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto scrollbar-thin space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs border-b pb-4">
                {[
                  { l: 'Shipping Line',  v: activeContainer.shipping_line },
                  { l: 'Vessel / Voyage',v: `${activeContainer.vessel_name || 'TBA'} / ${activeContainer.voyage_number || 'TBA'}` },
                  { l: 'ETA',            v: activeContainer.estimated_arrival_date ? new Date(activeContainer.estimated_arrival_date).toLocaleDateString() : 'N/A' },
                  { l: 'Current Status', v: activeContainer.status },
                ].map(item => (
                  <div key={item.l}>
                    <p className="text-[9px] font-black text-slate-400 uppercase">{item.l}</p>
                    <p className="font-bold text-slate-800 mt-0.5">{item.v}</p>
                  </div>
                ))}
              </div>

              {/* Vertical timeline */}
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase mb-4 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5" /> Vessel Journey Timeline
                </h4>
                <div className="relative pl-7 border-l border-slate-200 space-y-5">
                  {SHIPMENT_STAGES.map((stage, idx) => {
                    const currentIdx = SHIPMENT_STAGES.findIndex(s => s.key === activeContainer.status)
                    const isCompleted = idx < currentIdx
                    const isCurrent = idx === currentIdx
                    return (
                      <div key={stage.key} className="relative">
                        <div className={`absolute -left-[34px] top-0.5 h-6 w-6 rounded-full border-2 bg-white flex items-center justify-center text-sm transition-all ${
                          isCompleted ? 'border-emerald-500 bg-emerald-50' :
                          isCurrent ? 'border-indigo-500 bg-indigo-50 ring-4 ring-indigo-100' :
                          'border-slate-200'
                        }`}>
                          {isCompleted ? <Check className="h-3 w-3 text-emerald-600 stroke-[3]" /> : <span>{stage.emoji}</span>}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className={`text-xs font-black uppercase ${isCurrent ? 'text-indigo-600' : isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>{stage.label}</p>
                            {isCurrent && <span className="text-[9px] font-black bg-indigo-100 text-indigo-600 border border-indigo-200 px-2 py-0.5 rounded-full">Current</span>}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">{stage.desc}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Linked vehicles */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase">
                    Linked Vehicles ({(activeContainer.linkedCars || []).length})
                  </h4>
                  <button onClick={() => { setActiveContainer(null); openLinkingModal(activeContainer.id) }}
                    className="flex items-center gap-1 text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg hover:bg-indigo-100 cursor-pointer transition">
                    <Plus className="h-3 w-3" /> Associate Cars
                  </button>
                </div>
                {(activeContainer.linkedCars || []).length > 0 ? (
                  <div className="space-y-2">
                    {activeContainer.linkedCars.map((car: any) => (
                      <div key={car.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-indigo-500" />
                          <span className="text-xs font-black text-slate-800">{car.vehicle_brand} {car.vehicle_model} ({car.vehicle_year})</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleUnlinkCar(car.id)}
                          className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 h-7 text-[9px] font-bold rounded-lg cursor-pointer">
                          Unlink
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-400">
                    No vehicles in this manifest yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ NEW ORDER MODAL ═══════════════ */}
      {isNewOrderOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border w-full max-w-lg overflow-hidden animate-scaleIn text-left">
            <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">New Import Dossier</p>
                <h3 className="font-black flex items-center gap-1.5"><Ship className="h-4 w-4 text-indigo-400" /> Log Custom Import Order</h3>
              </div>
              <button onClick={() => setIsNewOrderOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="h-4 w-4" /></button>
            </div>

            <form onSubmit={handleCreateOrderSubmit} className="p-6 space-y-4 text-slate-700 max-h-[75vh] overflow-y-auto scrollbar-thin">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase">Existing Client</Label>
                <select value={newOrderForm.client_id} onChange={e => setNewOrderForm(p => ({ ...p, client_id: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold bg-white cursor-pointer">
                  <option value="">— Create new client below —</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.full_name} ({c.phone})</option>)}
                </select>
              </div>

              {!newOrderForm.client_id && (
                <div className="p-4 bg-slate-50 border rounded-2xl space-y-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">New Client Info</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black text-slate-400">Full Name *</Label>
                      <Input required={!newOrderForm.client_id} value={newOrderForm.clientName}
                        onChange={e => setNewOrderForm(p => ({ ...p, clientName: e.target.value }))}
                        placeholder="Amine Djemaa" className="rounded-xl text-xs bg-white" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black text-slate-400">Phone *</Label>
                      <Input required={!newOrderForm.client_id} value={newOrderForm.clientPhone}
                        onChange={e => setNewOrderForm(p => ({ ...p, clientPhone: e.target.value }))}
                        placeholder="+213 555..." className="rounded-xl text-xs bg-white" />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-400 uppercase">Brand *</Label>
                  <Input required value={newOrderForm.vehicle_brand}
                    onChange={e => setNewOrderForm(p => ({ ...p, vehicle_brand: e.target.value }))}
                    placeholder="Mercedes-Benz" className="rounded-xl text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-400 uppercase">Year *</Label>
                  <Input required type="number" value={newOrderForm.vehicle_year}
                    onChange={e => setNewOrderForm(p => ({ ...p, vehicle_year: e.target.value }))}
                    className="rounded-xl text-xs font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-400 uppercase">Model *</Label>
                  <Input required value={newOrderForm.vehicle_model}
                    onChange={e => setNewOrderForm(p => ({ ...p, vehicle_model: e.target.value }))}
                    placeholder="Classe C AMG" className="rounded-xl text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-400 uppercase">Color</Label>
                  <Input value={newOrderForm.color}
                    onChange={e => setNewOrderForm(p => ({ ...p, color: e.target.value }))}
                    placeholder="Gris Dauphin" className="rounded-xl text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-400 uppercase">Selling Price (DZD) *</Label>
                  <Input required type="number" value={newOrderForm.total_cost}
                    onChange={e => setNewOrderForm(p => ({ ...p, total_cost: e.target.value }))}
                    placeholder="11 500 000" className="rounded-xl text-xs font-black text-indigo-600" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-400 uppercase">Down Payment (DZD) *</Label>
                  <Input required type="number" value={newOrderForm.deposit_paid}
                    onChange={e => setNewOrderForm(p => ({ ...p, deposit_paid: e.target.value }))}
                    placeholder="3 450 000" className="rounded-xl text-xs font-black text-emerald-600" />
                </div>
              </div>

              {/* Live balance preview */}
              {newOrderForm.total_cost && newOrderForm.deposit_paid && (
                <div className="flex justify-between items-center p-3 bg-slate-50 border rounded-xl text-xs font-bold">
                  <span className="text-slate-500">Balance Due after Deposit:</span>
                  <span className={`font-black ${(Number(newOrderForm.total_cost) - Number(newOrderForm.deposit_paid)) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {(Number(newOrderForm.total_cost) - Number(newOrderForm.deposit_paid)).toLocaleString()} DZD
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-400 uppercase">Supplier</Label>
                  <Input value={newOrderForm.supplier_name}
                    onChange={e => setNewOrderForm(p => ({ ...p, supplier_name: e.target.value }))}
                    placeholder="Audi Center Munich" className="rounded-xl text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-400 uppercase">Origin Country</Label>
                  <Input value={newOrderForm.origin_country}
                    onChange={e => setNewOrderForm(p => ({ ...p, origin_country: e.target.value }))}
                    placeholder="Germany" className="rounded-xl text-xs" />
                </div>
              </div>

              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 font-black text-xs cursor-pointer">
                Initialize Import Dossier
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════ NEW CONTAINER MODAL ═══════════════ */}
      {isNewContainerOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border w-full max-w-lg overflow-hidden animate-scaleIn text-left">
            <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Ocean Freight</p>
                <h3 className="font-black flex items-center gap-1.5"><Ship className="h-4 w-4 text-indigo-400" /> Register Shipping Container</h3>
              </div>
              <button onClick={() => setIsNewContainerOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="h-4 w-4" /></button>
            </div>

            <form onSubmit={handleCreateContainerSubmit} className="p-6 space-y-4 text-slate-700 max-h-[75vh] overflow-y-auto scrollbar-thin">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-400 uppercase">Container Number (BOL) *</Label>
                  <Input required value={newContainerForm.container_number}
                    onChange={e => setNewContainerForm(p => ({ ...p, container_number: e.target.value }))}
                    placeholder="MSCU9827361" className="rounded-xl text-xs font-mono uppercase" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-400 uppercase">Shipping Line *</Label>
                  <select value={newContainerForm.shipping_line}
                    onChange={e => setNewContainerForm(p => ({ ...p, shipping_line: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold bg-white cursor-pointer">
                    {SHIPPING_LINES.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-400 uppercase">Vessel Name</Label>
                  <Input value={newContainerForm.vessel_name}
                    onChange={e => setNewContainerForm(p => ({ ...p, vessel_name: e.target.value }))}
                    placeholder="MSC Hamburg" className="rounded-xl text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-400 uppercase">Voyage Number</Label>
                  <Input value={newContainerForm.voyage_number}
                    onChange={e => setNewContainerForm(p => ({ ...p, voyage_number: e.target.value }))}
                    placeholder="VY-202B" className="rounded-xl text-xs font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-400 uppercase">Departure Port</Label>
                  <Input value={newContainerForm.departure_port}
                    onChange={e => setNewContainerForm(p => ({ ...p, departure_port: e.target.value }))}
                    className="rounded-xl text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-400 uppercase">Arrival Port</Label>
                  <Input value={newContainerForm.arrival_port}
                    onChange={e => setNewContainerForm(p => ({ ...p, arrival_port: e.target.value }))}
                    className="rounded-xl text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-400 uppercase">Departure Date</Label>
                  <Input type="date" value={newContainerForm.departure_date}
                    onChange={e => setNewContainerForm(p => ({ ...p, departure_date: e.target.value }))}
                    className="rounded-xl text-xs font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-400 uppercase">ETA (Est. Arrival)</Label>
                  <Input type="date" value={newContainerForm.estimated_arrival_date}
                    onChange={e => setNewContainerForm(p => ({ ...p, estimated_arrival_date: e.target.value }))}
                    className="rounded-xl text-xs font-mono" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase">Shipping Notes</Label>
                <Textarea value={newContainerForm.notes}
                  onChange={e => setNewContainerForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Loading weights, special instructions, supplier contacts..."
                  className="rounded-xl text-xs min-h-[80px]" />
              </div>

              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 font-black text-xs cursor-pointer">
                Create Shipment BOL Card
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════ CAR LINKING MODAL ═══════════════ */}
      {isLinkingModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border w-full max-w-md overflow-hidden animate-scaleIn text-left">
            <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Manifest Manager</p>
                <h3 className="font-black flex items-center gap-1.5"><Car className="h-4 w-4 text-indigo-400" /> Link Vehicles to Container</h3>
              </div>
              <button onClick={() => setIsLinkingModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="h-4 w-4" /></button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Unassigned Vehicles ({unlinkedCars.length} available)
              </p>

              {unlinkedCars.length > 0 ? (
                <div className="space-y-2 max-h-[280px] overflow-y-auto scrollbar-thin pr-1">
                  {unlinkedCars.map(car => {
                    const isSelected = selectedUnlinkedCars.includes(car.id)
                    return (
                      <div key={car.id}
                        onClick={() => setSelectedUnlinkedCars(prev =>
                          isSelected ? prev.filter(id => id !== car.id) : [...prev, car.id]
                        )}
                        className={`flex items-center justify-between p-3.5 border rounded-2xl cursor-pointer transition ${
                          isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'
                        }`}>
                        <div>
                          <p className="text-xs font-black text-slate-800">{car.vehicle_brand} {car.vehicle_model} ({car.vehicle_year})</p>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{(car.total_cost || 0).toLocaleString()} DZD</p>
                        </div>
                        <div className={`h-5 w-5 rounded-lg border-2 flex items-center justify-center transition ${
                          isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                        }`}>
                          {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="border border-dashed border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-400">
                  All import vehicles are already linked to containers.
                </div>
              )}

              <Button onClick={handleLinkCars} disabled={selectedUnlinkedCars.length === 0}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl py-3 font-black text-xs cursor-pointer">
                Link {selectedUnlinkedCars.length > 0 ? `${selectedUnlinkedCars.length} Vehicle${selectedUnlinkedCars.length > 1 ? 's' : ''}` : 'Vehicles'} to Container
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
