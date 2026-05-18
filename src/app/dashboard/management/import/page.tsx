'use client'

import React, { useState } from 'react'
import { 
  Car, Calendar, Plus, Search, Filter, Trash2, CheckCircle2, XCircle, Clock, 
  User, FileText, BadgePercent, TrendingUp, Edit3, ArrowUpRight, HelpCircle, 
  FileCheck2, Info, X, Ship, Landmark, Anchor, Compass, Truck, DollarSign, Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

// Interfaces
interface ImportOrder {
  id: string
  clientName: string
  clientPhone: string
  brand: string
  model: string
  year: number
  status: 'inquiry' | 'quoted' | 'ordered' | 'shipped' | 'customs_clearance' | 'delivered'
  purchase_cost: number // Price of car abroad (e.g. Europe)
  selling_price: number // Price client pays
  
  // Dédouanement breakdown (11 fields)
  droits_de_douane: number
  tva: number
  daccis: number
  redevance_statistique: number
  frais_de_dedouanement: number
  magasinage: number
  gerbage: number
  visite: number
  banque: number
  transport_local: number
  frais_divers: number

  // Shipping
  shipping_carrier: string
  tracking_number: string
  departure_port: string
  arrival_port: string
  departure_date: string
  arrival_date: string
  
  // Payments (30/30/40 milestones)
  milestone_1_amount: number // 30%
  milestone_1_paid: boolean
  milestone_2_amount: number // 30%
  milestone_2_paid: boolean
  milestone_3_amount: number // 40%
  milestone_3_paid: boolean

  // Timeline
  timeline: { stage: string; date: string; note: string }[]
  created_at: string
}

const INITIAL_IMPORT_ORDERS: ImportOrder[] = [
  {
    id: 'io-1',
    clientName: 'Amine Djemaa',
    clientPhone: '+213 555 44 33 22',
    brand: 'Mercedes-Benz',
    model: 'Classe C AMG Line',
    year: 2026,
    status: 'customs_clearance',
    purchase_cost: 6500000,
    selling_price: 11500000,
    
    // Dédouanement breakdown
    droits_de_douane: 1950000, // 30% standard
    tva: 1235000, // 19%
    daccis: 150000,
    redevance_statistique: 30000,
    frais_de_dedouanement: 75000,
    magasinage: 45000,
    gerbage: 15000,
    visite: 10000,
    banque: 20000,
    transport_local: 55000,
    frais_divers: 20000,

    // Shipping
    shipping_carrier: 'CMA CGM',
    tracking_number: 'CMAU7382910',
    departure_port: 'Port of Marseille, France',
    arrival_port: 'Port of Algiers, Algeria',
    departure_date: '2026-05-05',
    arrival_date: '2026-05-12',

    // Milestones
    milestone_1_amount: 3450000, // 30%
    milestone_1_paid: true,
    milestone_2_amount: 3450000, // 30%
    milestone_2_paid: true,
    milestone_3_amount: 4600000, // 40%
    milestone_3_paid: false,

    // Timeline
    timeline: [
      { stage: 'inquiry', date: '2026-04-10', note: 'Client requested imported quote for Mercedes C-Class.' },
      { stage: 'quoted', date: '2026-04-12', note: 'Sent full quote sheet including customs simulation.' },
      { stage: 'ordered', date: '2026-04-15', note: '30% First deposit cleared. Order registered in German network.' },
      { stage: 'shipped', date: '2026-05-05', note: 'Loaded on vessel. Marseille Port cleared.' },
      { stage: 'customs_clearance', date: '2026-05-12', note: 'Arrived at Algiers port. Transit agent handling customs dossier.' }
    ],
    created_at: '2026-04-10'
  },
  {
    id: 'io-2',
    clientName: 'Samy Ait-Hamou',
    clientPhone: '+213 770 11 22 33',
    brand: 'Toyota',
    model: 'Land Cruiser Prado',
    year: 2026,
    status: 'ordered',
    purchase_cost: 8500000,
    selling_price: 13900000,

    // Dédouanement breakdown
    droits_de_douane: 2550000,
    tva: 1615000,
    daccis: 200000,
    redevance_statistique: 40000,
    frais_de_dedouanement: 90000,
    magasinage: 0,
    gerbage: 0,
    visite: 0,
    banque: 25000,
    transport_local: 60000,
    frais_divers: 20000,

    // Shipping
    shipping_carrier: 'Maersk Line',
    tracking_number: 'MAEU9827361',
    departure_port: 'Port of Antwerp, Belgium',
    arrival_port: 'Port of Oran, Algeria',
    departure_date: '2026-05-22',
    arrival_date: '2026-05-30',

    // Milestones
    milestone_1_amount: 4170000,
    milestone_1_paid: true,
    milestone_2_amount: 4170000,
    milestone_2_paid: false,
    milestone_3_amount: 5560000,
    milestone_3_paid: false,

    // Timeline
    timeline: [
      { stage: 'inquiry', date: '2026-04-20', note: 'Client request from import quote estimator tool.' },
      { stage: 'quoted', date: '2026-04-22', note: 'Prado specs approved. Quote sent.' },
      { stage: 'ordered', date: '2026-04-28', note: 'Down payment paid. Order active.' }
    ],
    created_at: '2026-04-20'
  }
]

export default function CarImportPage() {
  const [orders, setOrders] = useState<ImportOrder[]>(INITIAL_IMPORT_ORDERS)
  const [loading, setLoading] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Modals / Details
  const [activeOrder, setActiveOrder] = useState<ImportOrder | null>(null)
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false)

  // Form State for New Import Order
  const [newClient, setNewClient] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newBrand, setNewBrand] = useState('')
  const [newModel, setNewModel] = useState('')
  const [newYear, setNewYear] = useState('2026')
  const [newPurchasePrice, setNewPurchasePrice] = useState('')
  const [newSellingPrice, setNewSellingPrice] = useState('')

  // Dédouanement detailed edit states (for active order editing)
  const [dedouanementState, setDedouanementState] = useState({
    droits_de_douane: 0,
    tva: 0,
    daccis: 0,
    redevance_statistique: 0,
    frais_de_dedouanement: 0,
    magasinage: 0,
    gerbage: 0,
    visite: 0,
    banque: 0,
    transport_local: 0,
    frais_divers: 0,
    purchase_cost: 0,
    selling_price: 0
  })

  // Sync edit states when activeOrder is loaded
  const loadOrderForEditing = (order: ImportOrder) => {
    setActiveOrder(order)
    setDedouanementState({
      droits_de_douane: order.droits_de_douane,
      tva: order.tva,
      daccis: order.daccis,
      redevance_statistique: order.redevance_statistique,
      frais_de_dedouanement: order.frais_de_dedouanement,
      magasinage: order.magasinage,
      gerbage: order.gerbage,
      visite: order.visite,
      banque: order.banque,
      transport_local: order.transport_local,
      frais_divers: order.frais_divers,
      purchase_cost: order.purchase_cost,
      selling_price: order.selling_price
    })
  }

  // Calculate sum of all customs fees dynamically
  const calculateTotalCustoms = (state: typeof dedouanementState) => {
    return state.droits_de_douane + state.tva + state.daccis + state.redevance_statistique + state.frais_de_dedouanement + state.magasinage + state.gerbage + state.visite + state.banque + state.transport_local + state.frais_divers
  }

  // Calculate dealer net margin dynamically
  const calculateImportMargin = (state: typeof dedouanementState) => {
    const totalFees = calculateTotalCustoms(state)
    return state.selling_price - state.purchase_cost - totalFees
  }

  // Save changes to active order customs
  const handleSaveCustoms = () => {
    if (!activeOrder) return
    const updated = orders.map(o => {
      if (o.id === activeOrder.id) {
        return {
          ...o,
          ...dedouanementState,
          milestone_1_amount: Math.round(dedouanementState.selling_price * 0.3),
          milestone_2_amount: Math.round(dedouanementState.selling_price * 0.3),
          milestone_3_amount: Math.round(dedouanementState.selling_price * 0.4)
        }
      }
      return o
    })
    setOrders(updated)
    const newActive = updated.find(o => o.id === activeOrder.id)
    if (newActive) setActiveOrder(newActive)
  }

  // Toggle Milestones Paid
  const handleToggleMilestone = (milestoneNumber: 1 | 2 | 3) => {
    if (!activeOrder) return
    const updated = orders.map(o => {
      if (o.id === activeOrder.id) {
        return {
          ...o,
          milestone_1_paid: milestoneNumber === 1 ? !o.milestone_1_paid : o.milestone_1_paid,
          milestone_2_paid: milestoneNumber === 2 ? !o.milestone_2_paid : o.milestone_2_paid,
          milestone_3_paid: milestoneNumber === 3 ? !o.milestone_3_paid : o.milestone_3_paid
        }
      }
      return o
    })
    setOrders(updated)
    const newActive = updated.find(o => o.id === activeOrder.id)
    if (newActive) setActiveOrder(newActive)
  }

  // Progress Pipeline Status
  const handleUpdateStatus = (newStatus: ImportOrder['status'], statusNote: string = '') => {
    if (!activeOrder) return
    const updated = orders.map(o => {
      if (o.id === activeOrder.id) {
        return {
          ...o,
          status: newStatus,
          timeline: [
            ...o.timeline,
            { stage: newStatus, date: new Date().toISOString().split('T')[0], note: statusNote || `Status updated to ${newStatus}.` }
          ]
        }
      }
      return o
    })
    setOrders(updated)
    const newActive = updated.find(o => o.id === activeOrder.id)
    if (newActive) setActiveOrder(newActive)
  }

  // Handle Create Import Order
  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newClient || !newBrand || !newModel || !newSellingPrice) return

    const sPrice = Number(newSellingPrice)
    const pPrice = Number(newPurchasePrice) || Math.round(sPrice * 0.6)

    const newOrder: ImportOrder = {
      id: `io-${Date.now()}`,
      clientName: newClient,
      clientPhone: newPhone,
      brand: newBrand,
      model: newModel,
      year: Number(newYear),
      status: 'inquiry',
      purchase_cost: pPrice,
      selling_price: sPrice,
      droits_de_douane: Math.round(pPrice * 0.3), // 30% droits estimation
      tva: Math.round(pPrice * 0.19), // 19% TVA estimation
      daccis: 100000,
      redevance_statistique: 20000,
      frais_de_dedouanement: 50000,
      magasinage: 0,
      gerbage: 0,
      visite: 0,
      banque: 15000,
      transport_local: 40000,
      frais_divers: 10000,
      shipping_carrier: '',
      tracking_number: '',
      departure_port: '',
      arrival_port: '',
      departure_date: '',
      arrival_date: '',
      milestone_1_amount: Math.round(sPrice * 0.3),
      milestone_1_paid: false,
      milestone_2_amount: Math.round(sPrice * 0.3),
      milestone_2_paid: false,
      milestone_3_amount: Math.round(sPrice * 0.4),
      milestone_3_paid: false,
      timeline: [
        { stage: 'inquiry', date: new Date().toISOString().split('T')[0], note: 'Inquiry registered.' }
      ],
      created_at: new Date().toISOString().split('T')[0]
    }

    setOrders(prev => [newOrder, ...prev])
    setIsNewOrderOpen(false)
    setNewClient('')
    setNewPhone('')
    setNewBrand('')
    setNewModel('')
    setNewSellingPrice('')
  }

  // Filter orders logic
  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.clientName.toLowerCase().includes(search.toLowerCase()) || 
                          o.brand.toLowerCase().includes(search.toLowerCase()) ||
                          o.model.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="flex-1 overflow-hidden flex flex-col gap-6">
      
      {/* Search & Actions Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs shrink-0">
        <div className="flex flex-wrap gap-2.5 items-center w-full lg:w-auto">
          <div className="relative w-full sm:w-[220px] shrink-0">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search Client or Import Car..." 
              className="pl-9 pr-4 py-2 text-xs rounded-xl border-slate-200 focus-visible:ring-indigo-500/20 w-full"
            />
          </div>

          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-slate-600 bg-slate-50 focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
          >
            <option value="all">All Pipelines</option>
            <option value="inquiry">Inquiry</option>
            <option value="quoted">Quoted</option>
            <option value="ordered">Ordered (Deposit Paid)</option>
            <option value="shipped">Shipped (Vessel)</option>
            <option value="customs_clearance">Customs Clearance</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>

        <Button 
          onClick={() => setIsNewOrderOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-sm cursor-pointer py-5 w-full lg:w-auto shrink-0"
        >
          <Plus className="h-4 w-4 mr-1.5" /> Log Custom Import Order
        </Button>
      </div>

      {/* Visual Pipeline Pipeline Cards Grid */}
      <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pr-1 scrollbar-thin">
        {filteredOrders.map(order => {
          const totalPaid = (order.milestone_1_paid ? order.milestone_1_amount : 0) + 
                            (order.milestone_2_paid ? order.milestone_2_amount : 0) + 
                            (order.milestone_3_paid ? order.milestone_3_amount : 0)
          const pctPaid = Math.round((totalPaid / order.selling_price) * 100)

          return (
            <div 
              key={order.id}
              className="bg-white border border-slate-200/80 hover:border-slate-350 rounded-2xl p-5 space-y-4 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between text-left relative"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-black text-slate-800">{order.brand} {order.model} ({order.year})</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">Client: {order.clientName}</p>
                  </div>
                  <Badge className={`uppercase text-[9px] font-black border ${
                    order.status === 'inquiry' ? 'bg-slate-50 text-slate-700 border-slate-200' :
                    order.status === 'quoted' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                    order.status === 'ordered' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                    order.status === 'shipped' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                    order.status === 'customs_clearance' ? 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse' :
                    'bg-emerald-50 text-emerald-700 border-emerald-100'
                  }`}>
                    {order.status}
                  </Badge>
                </div>

                <div className="py-2.5 border-y border-slate-100 flex justify-between items-baseline text-xs font-bold font-mono">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Selling Price</span>
                  <span className="text-slate-800">{order.selling_price.toLocaleString()} DZD</span>
                </div>

                {/* Milestone payments meters */}
                <div className="space-y-1.5 text-[10px] font-bold text-slate-500">
                  <div className="flex justify-between">
                    <span>Payment Progress</span>
                    <span className="text-indigo-600">{pctPaid}% Paid</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex gap-0.5">
                    <div className={`h-full flex-1 ${order.milestone_1_paid ? 'bg-indigo-600' : 'bg-slate-200'}`} title="Order Milestone (30%)" />
                    <div className={`h-full flex-1 ${order.milestone_2_paid ? 'bg-indigo-600' : 'bg-slate-200'}`} title="Shipping Milestone (30%)" />
                    <div className={`h-full flex-1 ${order.milestone_3_paid ? 'bg-indigo-600' : 'bg-slate-200'}`} title="Delivery Milestone (40%)" />
                  </div>
                </div>
              </div>

              {/* Action Rows */}
              <div className="flex gap-2">
                <Button 
                  onClick={() => loadOrderForEditing(order)}
                  className="bg-indigo-650 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold h-8.5 w-full cursor-pointer"
                >
                  <Edit3 className="h-3.5 w-3.5 mr-1" /> Dédouanement / Audit
                </Button>
              </div>

            </div>
          )
        })}

        {filteredOrders.length === 0 && (
          <div className="col-span-full border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center p-12 text-slate-400 text-center bg-white">
            <Compass className="h-12 w-12 text-slate-350 stroke-[1.5] mb-2" />
            <span className="text-xs font-bold">No import orders in this stage</span>
            <span className="text-[10px] mt-0.5">Try clearing filters or log a new import dossier.</span>
          </div>
        )}
      </div>

      {/* DEDOUANEMENT & TIMELINE AUDIT DRAWER */}
      {activeOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-end z-50 animate-fadeIn">
          <div className="bg-white w-full max-w-3xl h-screen overflow-y-auto scrollbar-thin shadow-2xl border-l border-slate-200 animate-slideIn flex flex-col text-left">
            
            <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between shrink-0">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Badge className="bg-indigo-600 text-white uppercase text-[9px] font-black">{activeOrder.status}</Badge>
                  <span className="text-[10px] text-slate-400 font-bold">Import Order Ledger</span>
                </div>
                <h3 className="text-sm font-black tracking-tight">{activeOrder.brand} {activeOrder.model} ({activeOrder.year})</h3>
              </div>
              <button onClick={() => setActiveOrder(null)} className="h-8 w-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"><X className="h-5 w-5" /></button>
            </div>

            {/* Split layout: Left is Dédouanement detailed breakdown, Right is milestones & timeline */}
            <div className="p-6 grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1 overflow-y-auto scrollbar-thin">
              
              {/* Left Column: Customs Tariff Breakdown */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Anchor className="h-4 w-4 text-indigo-600" /> Algerian Port Dédouanement Breakdown</h4>
                  <Button size="sm" onClick={handleSaveCustoms} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-bold h-7">
                    Save Changes
                  </Button>
                </div>

                <div className="space-y-3.5 text-xs">
                  {/* Purchase Cost & selling price */}
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <Label className="font-bold text-[9px] text-slate-400 uppercase">Purchase Cost (Europe)</Label>
                      <Input type="number" value={dedouanementState.purchase_cost} onChange={e => setDedouanementState(prev => ({ ...prev, purchase_cost: Number(e.target.value) }))} className="rounded-xl border-slate-200 text-xs font-bold" />
                    </div>
                    <div className="space-y-1">
                      <Label className="font-bold text-[9px] text-slate-400 uppercase">Selling Price (Algeria)</Label>
                      <Input type="number" value={dedouanementState.selling_price} onChange={e => setDedouanementState(prev => ({ ...prev, selling_price: Number(e.target.value) }))} className="rounded-xl border-slate-200 text-xs font-bold text-indigo-600" />
                    </div>
                  </div>

                  {/* 11 detailed custom fee fields */}
                  <div className="p-4 bg-slate-50 border rounded-2xl space-y-2.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block border-b pb-1.5">Tariff Details (11 Fields)</span>
                    
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-600">
                      <div className="space-y-1">
                        <Label className="text-[9px] text-slate-400">1. Droits de Douane</Label>
                        <Input type="number" value={dedouanementState.droits_de_douane} onChange={e => setDedouanementState(prev => ({ ...prev, droits_de_douane: Number(e.target.value) }))} className="rounded-lg border-slate-200 text-[11px] h-7 px-2" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] text-slate-400">2. TVA (Douane)</Label>
                        <Input type="number" value={dedouanementState.tva} onChange={e => setDedouanementState(prev => ({ ...prev, tva: Number(e.target.value) }))} className="rounded-lg border-slate-200 text-[11px] h-7 px-2" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] text-slate-400">3. DACCIS</Label>
                        <Input type="number" value={dedouanementState.daccis} onChange={e => setDedouanementState(prev => ({ ...prev, daccis: Number(e.target.value) }))} className="rounded-lg border-slate-200 text-[11px] h-7 px-2" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] text-slate-400">4. Redevance Statistique</Label>
                        <Input type="number" value={dedouanementState.redevance_statistique} onChange={e => setDedouanementState(prev => ({ ...prev, redevance_statistique: Number(e.target.value) }))} className="rounded-lg border-slate-200 text-[11px] h-7 px-2" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] text-slate-400">5. Frais Dédouanement</Label>
                        <Input type="number" value={dedouanementState.frais_de_dedouanement} onChange={e => setDedouanementState(prev => ({ ...prev, frais_de_dedouanement: Number(e.target.value) }))} className="rounded-lg border-slate-200 text-[11px] h-7 px-2" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] text-slate-400">6. Magasinage Port</Label>
                        <Input type="number" value={dedouanementState.magasinage} onChange={e => setDedouanementState(prev => ({ ...prev, magasinage: Number(e.target.value) }))} className="rounded-lg border-slate-200 text-[11px] h-7 px-2" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] text-slate-400">7. Gerbage Port</Label>
                        <Input type="number" value={dedouanementState.gerbage} onChange={e => setDedouanementState(prev => ({ ...prev, gerbage: Number(e.target.value) }))} className="rounded-lg border-slate-200 text-[11px] h-7 px-2" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] text-slate-400">8. Visite Douane</Label>
                        <Input type="number" value={dedouanementState.visite} onChange={e => setDedouanementState(prev => ({ ...prev, visite: Number(e.target.value) }))} className="rounded-lg border-slate-200 text-[11px] h-7 px-2" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] text-slate-400">9. Frais de Banque</Label>
                        <Input type="number" value={dedouanementState.banque} onChange={e => setDedouanementState(prev => ({ ...prev, banque: Number(e.target.value) }))} className="rounded-lg border-slate-200 text-[11px] h-7 px-2" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] text-slate-400">10. Transport Local</Label>
                        <Input type="number" value={dedouanementState.transport_local} onChange={e => setDedouanementState(prev => ({ ...prev, transport_local: Number(e.target.value) }))} className="rounded-lg border-slate-200 text-[11px] h-7 px-2" />
                      </div>
                      <div className="space-y-1 col-span-2">
                        <Label className="text-[9px] text-slate-400">11. Frais Divers / Transit</Label>
                        <Input type="number" value={dedouanementState.frais_divers} onChange={e => setDedouanementState(prev => ({ ...prev, frais_divers: Number(e.target.value) }))} className="rounded-lg border-slate-200 text-[11px] h-7 px-2" />
                      </div>
                    </div>
                  </div>

                  {/* Calculations breakdown */}
                  <div className="p-4 bg-gradient-to-br from-indigo-600/5 to-transparent border border-indigo-500/10 rounded-2xl space-y-2.5 font-bold">
                    <div className="flex justify-between text-slate-500 text-[10px]">
                      <span>Total Customs Fees:</span>
                      <span>{calculateTotalCustoms(dedouanementState).toLocaleString()} DZD</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[10px]">
                      <span>FOB Purchase + Customs:</span>
                      <span>{(dedouanementState.purchase_cost + calculateTotalCustoms(dedouanementState)).toLocaleString()} DZD</span>
                    </div>
                    
                    <div className="pt-2 border-t border-slate-200/50 flex justify-between items-baseline">
                      <span className="text-[10px] text-slate-400 uppercase">Estimated Net Margin:</span>
                      <span className={`text-sm font-black ${calculateImportMargin(dedouanementState) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {calculateImportMargin(dedouanementState).toLocaleString()} DZD
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Right Column: Timeline & Milestones */}
              <div className="space-y-6">
                
                {/* 30/30/40 Payment milestones */}
                <div className="space-y-3.5">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><DollarSign className="h-4 w-4 text-emerald-500" /> 30/30/40 Payment Milestones</h4>
                  
                  <div className="space-y-3">
                    {/* Milestone 1 */}
                    <div className="p-3.5 bg-slate-50 border rounded-2xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-black text-slate-800">1. Order Down Payment (30%)</span>
                        <span className="text-[9px] text-slate-400 block font-bold">{activeOrder.milestone_1_amount.toLocaleString()} DZD</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={activeOrder.milestone_1_paid} onCheckedChange={() => handleToggleMilestone(1)} />
                        <span className={`text-[10px] font-black uppercase ${activeOrder.milestone_1_paid ? 'text-emerald-600' : 'text-amber-500'}`}>
                          {activeOrder.milestone_1_paid ? 'Paid' : 'Pending'}
                        </span>
                      </div>
                    </div>

                    {/* Milestone 2 */}
                    <div className="p-3.5 bg-slate-50 border rounded-2xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-black text-slate-800">2. Vessel Shipped Payment (30%)</span>
                        <span className="text-[9px] text-slate-400 block font-bold">{activeOrder.milestone_2_amount.toLocaleString()} DZD</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={activeOrder.milestone_2_paid} onCheckedChange={() => handleToggleMilestone(2)} />
                        <span className={`text-[10px] font-black uppercase ${activeOrder.milestone_2_paid ? 'text-emerald-600' : 'text-amber-500'}`}>
                          {activeOrder.milestone_2_paid ? 'Paid' : 'Pending'}
                        </span>
                      </div>
                    </div>

                    {/* Milestone 3 */}
                    <div className="p-3.5 bg-slate-50 border rounded-2xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-black text-slate-800">3. Customs / Handover (40%)</span>
                        <span className="text-[9px] text-slate-400 block font-bold">{activeOrder.milestone_3_amount.toLocaleString()} DZD</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={activeOrder.milestone_3_paid} onCheckedChange={() => handleToggleMilestone(3)} />
                        <span className={`text-[10px] font-black uppercase ${activeOrder.milestone_3_paid ? 'text-emerald-600' : 'text-amber-500'}`}>
                          {activeOrder.milestone_3_paid ? 'Paid' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shipping info */}
                <div className="p-4 bg-slate-900 border rounded-3xl text-white space-y-3">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Ship className="h-4 w-4 text-indigo-500" /> Maritime Shipping & Documents</span>
                  
                  <div className="grid grid-cols-2 gap-3 text-[10px] font-bold">
                    <div>
                      <span className="text-slate-400 block">Vessel Carrier</span>
                      <span className="text-white text-xs">{activeOrder.shipping_carrier || 'Pending Assignment'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Tracking BOL</span>
                      <span className="text-white text-xs font-mono">{activeOrder.tracking_number || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[10px] font-bold">
                    <div>
                      <span className="text-slate-400 block">Departure Port</span>
                      <span className="text-white">{activeOrder.departure_port || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Arrival Port</span>
                      <span className="text-white">{activeOrder.arrival_port || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Progress Status Actions */}
                <div className="space-y-2 border-t pt-4">
                  <Label className="font-bold text-[10px] text-slate-400 uppercase">Progress Pipeline Stage</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {['inquiry', 'quoted', 'ordered', 'shipped', 'customs_clearance', 'delivered'].map(stage => {
                      const isCurrent = activeOrder.status === stage
                      return (
                        <button 
                          key={stage}
                          type="button"
                          onClick={() => handleUpdateStatus(stage as any, `Manually updated stage to ${stage}.`)}
                          className={`text-[9px] font-black px-2.5 py-1 rounded-lg border capitalize transition ${isCurrent ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                        >
                          {stage}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Vertical Timeline */}
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Activity className="h-4 w-4 text-indigo-500" /> Vertical Audit Log Timeline</h4>
                  
                  <div className="relative pl-5 border-l border-slate-200/80 space-y-5">
                    {activeOrder.timeline.map((item, idx) => (
                      <div key={idx} className="relative text-xs">
                        {/* Dot */}
                        <div className="absolute -left-[26px] top-1.5 h-3.5 w-3.5 rounded-full bg-white border-2 border-indigo-600 flex items-center justify-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                        </div>

                        <div className="space-y-0.5">
                          <span className="font-black text-slate-800 uppercase text-[9px] tracking-wider capitalize">{item.stage}</span>
                          <span className="text-[9px] text-slate-400 font-bold ml-2">{item.date}</span>
                          <p className="text-[10px] text-slate-500 font-semibold leading-normal">{item.note}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

      {/* NEW IMPORT ORDER QUICK MODAL */}
      {isNewOrderOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-scaleIn text-left">
            <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
              <h3 className="text-sm font-black flex items-center gap-1.5"><Ship className="h-4.5 w-4.5 text-indigo-400" /> Log Custom Import Order</h3>
              <button onClick={() => setIsNewOrderOpen(false)} className="text-slate-450 hover:text-white"><X className="h-4.5 w-4.5" /></button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-6 space-y-4 text-xs text-slate-700">
              <div className="space-y-1.5">
                <Label className="font-bold text-[10px] text-slate-400 uppercase">Client Full Name *</Label>
                <Input required value={newClient} onChange={e => setNewClient(e.target.value)} placeholder="Amine Ait-Ali" className="rounded-xl border-slate-200 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-bold text-[10px] text-slate-400 uppercase">Client Phone</Label>
                <Input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="+213 550..." className="rounded-xl border-slate-200 text-xs" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5 col-span-2">
                  <Label className="font-bold text-[10px] text-slate-400 uppercase">Vehicle Model *</Label>
                  <Input required value={newModel} onChange={e => setNewModel(e.target.value)} placeholder="e.g. Classe C AMG Line" className="rounded-xl border-slate-200 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-bold text-[10px] text-slate-400 uppercase">Year *</Label>
                  <Input required type="number" value={newYear} onChange={e => setNewYear(e.target.value)} className="rounded-xl border-slate-200 text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="font-bold text-[10px] text-slate-400 uppercase">Brand Name *</Label>
                  <Input required value={newBrand} onChange={e => setNewBrand(e.target.value)} placeholder="Mercedes-Benz" className="rounded-xl border-slate-200 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-bold text-[10px] text-slate-400 uppercase">Public Selling Price *</Label>
                  <Input required type="number" value={newSellingPrice} onChange={e => setNewSellingPrice(e.target.value)} placeholder="11,500,000" className="rounded-xl border-slate-200 text-xs font-bold text-indigo-600" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="font-bold text-[10px] text-slate-400 uppercase">Estimated Purchase Cost (FOB Abroad)</Label>
                <Input type="number" value={newPurchasePrice} onChange={e => setNewPurchasePrice(e.target.value)} placeholder="6,500,000 DZD" className="rounded-xl border-slate-200 text-xs" />
              </div>

              <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3 font-black text-xs cursor-pointer">
                Initialize Import dossier & Pipeline
              </Button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
