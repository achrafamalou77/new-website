'use client'

import React, { useState, useEffect } from 'react'
import { 
  Car, Calendar, Plus, Search, Filter, Trash2, CheckCircle2, XCircle, Clock, 
  User, FileText, BadgePercent, TrendingUp, Edit3, ArrowUpRight, HelpCircle, 
  FileCheck2, Info, X, ShieldAlert, Key, Fuel, Gauge, DollarSign, PenTool, ClipboardCheck, AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

// Interfaces
interface RentalCar {
  id: string
  stock_number: string
  vin: string
  registration_number: string
  brand: string
  model: string
  year: number
  mileage: number
  fuel_level_percent: number
  transmission: 'manual' | 'automatic'
  fuel_type: 'petrol' | 'diesel' | 'hybrid' | 'electric'
  daily_rate: number
  security_deposit: number
  status: 'available' | 'rented' | 'maintenance'
  last_maintenance_km: number
  next_maintenance_km: number
  condition_notes: string
  body_damages: { part: string; severity: 'light' | 'medium' | 'severe'; cost: number }[]
}

interface RentalBooking {
  id: string
  clientName: string
  clientPhone: string
  carId: string
  status: 'booked' | 'active' | 'completed' | 'cancelled'
  pickup_date: string
  return_date: string
  total_days: number
  daily_rate: number
  subtotal: number
  security_deposit_amount: number
  security_deposit_status: 'pending' | 'paid' | 'refunded' | 'retained_partial' | 'retained_full'
  
  // Pickup Checkpoint
  pickup_km?: number
  pickup_fuel_percent?: number
  pickup_condition?: string[] // clean, tools, spare_tire
  pickup_notes?: string
  
  // Return Checkpoint
  return_km?: number
  return_fuel_percent?: number
  return_condition?: string[]
  damage_notes?: string
  damage_charges?: number
  fuel_charges?: number
  extra_km_charges?: number
  cleaning_charges?: number
  late_charges?: number
  final_settlement_amount?: number
}

const INITIAL_FLEET: RentalCar[] = [
  {
    id: 'rc-1',
    stock_number: 'R-2026-001',
    vin: 'KL1TC81D3PU012938',
    registration_number: '09832-121-16',
    brand: 'Dacia',
    model: 'Sandero Stepway',
    year: 2023,
    mileage: 48000,
    fuel_level_percent: 80,
    transmission: 'manual',
    fuel_type: 'petrol',
    daily_rate: 6500, // 6,500 DZD/day
    security_deposit: 40000,
    status: 'available',
    last_maintenance_km: 45000,
    next_maintenance_km: 50000,
    condition_notes: 'Excellent mechanics, tiny scratch on rear bumper.',
    body_damages: [{ part: 'Rear Bumper', severity: 'light', cost: 5000 }]
  },
  {
    id: 'rc-2',
    stock_number: 'R-2026-002',
    vin: 'VSSZZZKJZM0918237',
    registration_number: '12493-122-16',
    brand: 'Renault',
    model: 'Symbol',
    year: 2022,
    mileage: 82000,
    fuel_level_percent: 100,
    transmission: 'manual',
    fuel_type: 'petrol',
    daily_rate: 5500,
    security_deposit: 30000,
    status: 'rented',
    last_maintenance_km: 80000,
    next_maintenance_km: 85000,
    condition_notes: 'Perfect utility rental, very popular.',
    body_damages: []
  },
  {
    id: 'rc-3',
    stock_number: 'R-2026-003',
    vin: 'KMHCN81C3PU018239',
    registration_number: '01823-123-16',
    brand: 'Hyundai',
    model: 'Accent',
    year: 2023,
    mileage: 29000,
    fuel_level_percent: 45,
    transmission: 'automatic',
    fuel_type: 'diesel',
    daily_rate: 8500,
    security_deposit: 50000,
    status: 'maintenance',
    last_maintenance_km: 25000,
    next_maintenance_km: 30000,
    condition_notes: 'Scheduled for brake pad replacements.',
    body_damages: []
  }
]

const INITIAL_RENTAL_BOOKINGS: RentalBooking[] = [
  {
    id: 'rb-1',
    clientName: 'Karim Ait-Ali',
    clientPhone: '+213 550 12 34 56',
    carId: 'rc-2',
    status: 'active',
    pickup_date: '2026-05-18',
    return_date: '2026-05-23',
    total_days: 5,
    daily_rate: 5500,
    subtotal: 27500,
    security_deposit_amount: 30000,
    security_deposit_status: 'paid',
    pickup_km: 82000,
    pickup_fuel_percent: 100,
    pickup_condition: ['clean_interior', 'clean_exterior', 'spare_tire', 'safety_kit'],
    pickup_notes: 'Customer left credit card pre-auth print.'
  },
  {
    id: 'rb-2',
    clientName: 'Yasmin Boumedienne',
    clientPhone: '+213 661 77 88 99',
    carId: 'rc-1',
    status: 'booked',
    pickup_date: '2026-05-24',
    return_date: '2026-05-28',
    total_days: 4,
    daily_rate: 6500,
    subtotal: 26000,
    security_deposit_amount: 40000,
    security_deposit_status: 'pending'
  }
]

export default function CarRentalPage() {
  const [fleet, setFleet] = useState<RentalCar[]>(INITIAL_FLEET)
  const [bookings, setBookings] = useState<RentalBooking[]>(INITIAL_RENTAL_BOOKINGS)

  // Tab views
  const [viewTab, setViewTab] = useState<'calendar' | 'fleet' | 'bookings'>('calendar')

  // Modals / workflows
  const [activeBooking, setActiveBooking] = useState<RentalBooking | null>(null)
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false)
  const [isPickupWorkflowOpen, setIsPickupWorkflowOpen] = useState(false)
  const [isReturnWorkflowOpen, setIsReturnWorkflowOpen] = useState(false)

  // Pickup workflow form state
  const [pickupKm, setPickupKm] = useState('')
  const [pickupFuel, setPickupFuel] = useState(100)
  const [pickupChecks, setPickupChecks] = useState<string[]>([])
  const [pickupNotes, setPickupNotes] = useState('')

  // Return workflow form state
  const [returnKm, setReturnKm] = useState('')
  const [returnFuel, setReturnFuel] = useState(100)
  const [returnChecks, setReturnChecks] = useState<string[]>([])
  const [damageNotes, setDamageNotes] = useState('')
  const [damageCharges, setDamageCharges] = useState(0)
  const [cleaningCharges, setCleaningCharges] = useState(0)
  const [lateCharges, setLateCharges] = useState(0)
  
  // Custom Interactive Body damage inspector states
  const [selectedDamageParts, setSelectedDamageParts] = useState<string[]>([])

  // Calendar Day array for current month (May 2026)
  const daysInMay = Array.from({ length: 31 }, (_, i) => i + 1)

  // Calculate automatically extra KM fee if mileage exceeds 200km/day limit
  const calculateExtraKm = (booking: RentalBooking, retKm: number) => {
    const pKm = booking.pickup_km || 0
    const totalKmDriven = retKm - pKm
    const allowedKm = booking.total_days * 200 // 200km per day limit
    if (totalKmDriven > allowedKm) {
      const extraKm = totalKmDriven - allowedKm
      return extraKm * 20 // 20 DZD per extra KM penalty
    }
    return 0
  }

  // Calculate Fuel Penalty charges if fuel level is lower than pick-up level
  const calculateFuelPenalty = (booking: RentalBooking, retFuel: number) => {
    const pFuel = booking.pickup_fuel_percent || 100
    if (retFuel < pFuel) {
      const fuelDeficitPercent = pFuel - retFuel
      return Math.round(fuelDeficitPercent * 150) // 150 DZD per % missing
    }
    return 0
  }

  // Handle Pick-up execution
  const handleExecutePickup = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeBooking || !pickupKm) return

    const updatedBookings = bookings.map(b => {
      if (b.id === activeBooking.id) {
        return {
          ...b,
          status: 'active' as const,
          security_deposit_status: 'paid' as const,
          pickup_km: Number(pickupKm),
          pickup_fuel_percent: pickupFuel,
          pickup_condition: pickupChecks,
          pickup_notes: pickupNotes
        }
      }
      return b
    })

    // Update fleet status
    const updatedFleet = fleet.map(c => {
      if (c.id === activeBooking.carId) {
        return {
          ...c,
          status: 'rented' as const,
          mileage: Number(pickupKm),
          fuel_level_percent: pickupFuel
        }
      }
      return c
    })

    setBookings(updatedBookings)
    setFleet(updatedFleet)
    setIsPickupWorkflowOpen(false)
    setActiveBooking(null)
  }

  // Handle Return execution & Final Settlement
  const handleExecuteReturn = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeBooking || !returnKm) return

    const rKm = Number(returnKm)
    const extraKmCost = calculateExtraKm(activeBooking, rKm)
    const fuelCost = calculateFuelPenalty(activeBooking, returnFuel)
    const totalExtraPenalties = extraKmCost + fuelCost + Number(damageCharges) + Number(cleaningCharges) + Number(lateCharges)

    const updatedBookings = bookings.map(b => {
      if (b.id === activeBooking.id) {
        return {
          ...b,
          status: 'completed' as const,
          return_km: rKm,
          return_fuel_percent: returnFuel,
          return_condition: returnChecks,
          damage_notes: damageNotes + (selectedDamageParts.length > 0 ? ` damages on: ${selectedDamageParts.join(', ')}` : ''),
          damage_charges: Number(damageCharges),
          fuel_charges: fuelCost,
          extra_km_charges: extraKmCost,
          cleaning_charges: Number(cleaningCharges),
          late_charges: Number(lateCharges),
          security_deposit_status: totalExtraPenalties >= b.security_deposit_amount ? 'retained_full' as const : (totalExtraPenalties > 0 ? 'retained_partial' as const : 'refunded' as const),
          final_settlement_amount: b.security_deposit_amount - totalExtraPenalties
        }
      }
      return b
    })

    // Update fleet status and mileage
    const updatedFleet = fleet.map(c => {
      if (c.id === activeBooking.carId) {
        // Append damages if any
        const currentDamages = [...c.body_damages]
        selectedDamageParts.forEach(p => {
          currentDamages.push({ part: p, severity: 'light', cost: Number(damageCharges) / (selectedDamageParts.length || 1) })
        })

        return {
          ...c,
          status: 'available' as const,
          mileage: rKm,
          fuel_level_percent: returnFuel,
          body_damages: currentDamages
        }
      }
      return c
    })

    setBookings(updatedBookings)
    setFleet(updatedFleet)
    setIsReturnWorkflowOpen(false)
    setActiveBooking(null)
    setSelectedDamageParts([])
    setDamageCharges(0)
    setCleaningCharges(0)
    setLateCharges(0)
  }

  // Create new rental booking state
  const [newClient, setNewClient] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newCarId, setNewCarId] = useState('')
  const [newPickupDate, setNewPickupDate] = useState('2026-05-19')
  const [newReturnDate, setNewReturnDate] = useState('2026-05-22')

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newClient || !newCarId) return

    const car = fleet.find(c => c.id === newCarId)
    if (!car) return

    const days = Math.max(1, Math.round((new Date(newReturnDate).getTime() - new Date(newPickupDate).getTime()) / (1000 * 60 * 60 * 24)))
    
    const newBooking: RentalBooking = {
      id: `rb-${Date.now()}`,
      clientName: newClient,
      clientPhone: newPhone,
      carId: newCarId,
      status: 'booked',
      pickup_date: newPickupDate,
      return_date: newReturnDate,
      total_days: days,
      daily_rate: car.daily_rate,
      subtotal: car.daily_rate * days,
      security_deposit_amount: car.security_deposit,
      security_deposit_status: 'pending'
    }

    setBookings(prev => [newBooking, ...prev])
    setIsNewBookingOpen(false)
    setNewClient('')
    setNewPhone('')
    setNewCarId('')
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col gap-6">
      
      {/* Top Controller Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs shrink-0">
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 border">
          <button 
            onClick={() => setViewTab('calendar')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${viewTab === 'calendar' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}
          >
            <Calendar className="h-4 w-4" /> Grid Calendar View
          </button>
          <button 
            onClick={() => setViewTab('fleet')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${viewTab === 'fleet' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}
          >
            <Car className="h-4 w-4" /> Fleet Management & Service
          </button>
          <button 
            onClick={() => setViewTab('bookings')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${viewTab === 'bookings' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}
          >
            <ClipboardCheck className="h-4 w-4" /> Rental Ledger
          </button>
        </div>

        <Button 
          onClick={() => setIsNewBookingOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-sm cursor-pointer py-5"
        >
          <Plus className="h-4 w-4 mr-1.5" /> New Rental Booking
        </Button>
      </div>

      {/* RENTAL CONTENT PANELS */}
      {viewTab === 'calendar' && (
        <div className="flex-1 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs overflow-hidden flex flex-col min-h-0">
          
          <div className="flex items-center justify-between border-b pb-4 mb-4 shrink-0">
            <h3 className="text-xs font-black text-slate-800 tracking-tight flex items-center gap-1.5 uppercase">
              <Calendar className="h-4.5 w-4.5 text-blue-600" /> Interactive Month Calendar Matrix (May 2026)
            </h3>
            <div className="flex gap-4 text-[10px] font-bold text-slate-500">
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-blue-100 border border-blue-200" /> Active Rental</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-amber-100 border border-amber-200" /> Upcoming Booking</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-rose-100 border border-rose-200" /> Maintenance</span>
            </div>
          </div>

          {/* Grid Layout Container */}
          <div className="flex-1 overflow-auto scrollbar-thin select-none">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b text-[10px] font-bold uppercase text-slate-400">
                  <th className="pb-3 pr-4 font-black text-slate-600 sticky left-0 bg-white z-10 w-[180px]">Vehicle (Fleet Lot)</th>
                  {daysInMay.map(day => (
                    <th key={day} className="pb-3 text-center w-8 text-[9px] font-black">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {fleet.map(car => {
                  return (
                    <tr key={car.id} className="hover:bg-slate-50/50">
                      <td className="py-4 font-bold text-slate-800 sticky left-0 bg-white z-10 pr-4 flex flex-col text-left border-r border-slate-100">
                        <span>{car.brand} {car.model}</span>
                        <span className="text-[9px] font-mono text-slate-400 font-semibold mt-0.5">{car.registration_number}</span>
                      </td>

                      {daysInMay.map(day => {
                        const dayString = `2026-05-${String(day).padStart(2, '0')}`
                        
                        // Check if day matches any booking
                        const booking = bookings.find(b => b.carId === car.id && dayString >= b.pickup_date && dayString <= b.return_date)
                        const inMaintenance = car.status === 'maintenance' && day <= 15 // Mock first half of month in maint

                        let cellStyle = "bg-slate-50/50 border-r border-slate-100 text-center relative"
                        let cellContent = null

                        if (inMaintenance) {
                          cellStyle = "bg-rose-50 border-r border-slate-200 text-center text-[9px] text-rose-700 font-bold"
                          cellContent = "MNT"
                        } else if (booking) {
                          if (booking.status === 'active') {
                            cellStyle = "bg-blue-100 border-r border-blue-200 text-center text-[8px] text-blue-700 font-black cursor-pointer hover:bg-blue-200"
                            cellContent = "RENT"
                          } else if (booking.status === 'booked') {
                            cellStyle = "bg-amber-100 border-r border-amber-200 text-center text-[8px] text-amber-700 font-black cursor-pointer hover:bg-amber-200"
                            cellContent = "RSVD"
                          }
                        }

                        return (
                          <td 
                            key={day} 
                            className={cellStyle}
                            onClick={() => booking && setActiveBooking(booking)}
                          >
                            {cellContent}
                          </td>
                        )
                      })}

                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {viewTab === 'fleet' && (
        <div className="flex-1 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs overflow-y-auto scrollbar-thin">
          <div className="border-b pb-4 mb-4">
            <h3 className="text-xs font-black text-slate-800 tracking-tight flex items-center gap-1.5 uppercase">
              <Car className="h-4.5 w-4.5 text-blue-600" /> Fleet Maintenance & Mileage Schedules
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fleet.map(car => {
              const kmToMaint = car.next_maintenance_km - car.mileage
              const isOverdue = kmToMaint <= 0
              const progressPercent = Math.min(100, Math.max(0, ((car.mileage - car.last_maintenance_km) / (car.next_maintenance_km - car.last_maintenance_km)) * 100))

              return (
                <div key={car.id} className="border border-slate-200/80 rounded-2xl p-5 space-y-4 bg-slate-50/50 relative hover:shadow-xs transition duration-200 text-left">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-black text-slate-800">{car.brand} {car.model} ({car.year})</h4>
                      <p className="text-[9px] font-mono text-slate-400 font-bold mt-0.5">{car.registration_number}</p>
                    </div>
                    <Badge className={car.status === 'available' ? 'bg-emerald-500 text-white' : car.status === 'rented' ? 'bg-blue-500 text-white' : 'bg-rose-500 text-white'}>
                      {car.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 text-center text-xs py-2 border-y border-slate-100 bg-white rounded-xl font-bold">
                    <div>
                      <span className="text-[8px] text-slate-400 uppercase block mb-0.5">Rate</span>
                      <span className="text-slate-800">{car.daily_rate.toLocaleString()} DZD</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-400 uppercase block mb-0.5">Mileage</span>
                      <span className="text-slate-800">{car.mileage.toLocaleString()} km</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-400 uppercase block mb-0.5">Fuel</span>
                      <span className="text-slate-800">{car.fuel_level_percent}%</span>
                    </div>
                  </div>

                  {/* Maintenance scheduler */}
                  <div className="space-y-1.5 text-[11px] font-bold text-slate-600">
                    <div className="flex justify-between">
                      <span>Service Interval Progress</span>
                      <span className={isOverdue ? 'text-rose-600 animate-pulse' : 'text-slate-400'}>
                        {isOverdue ? 'Overdue!' : `${kmToMaint.toLocaleString()} km left`}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${isOverdue ? 'bg-rose-600 animate-pulse' : 'bg-blue-600'}`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <p className="text-[9px] text-slate-400 font-semibold">Last: {car.last_maintenance_km.toLocaleString()} km | Next Target: {car.next_maintenance_km.toLocaleString()} km</p>
                  </div>

                  {/* Damage log summary */}
                  {car.body_damages.length > 0 ? (
                    <div className="p-3 bg-amber-50 border border-amber-200/50 rounded-xl space-y-1">
                      <span className="text-[9px] font-black text-amber-800 uppercase tracking-widest flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" /> Registered damages log
                      </span>
                      {car.body_damages.map((d, i) => (
                        <div key={i} className="text-[9px] text-amber-700 font-bold flex justify-between">
                          <span>• {d.part} (Light Scratch)</span>
                          <span>Est. {d.cost.toLocaleString()} DZD</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-1.5 text-[9px] font-black text-emerald-800 uppercase">
                      <CheckCircle2 className="h-4 w-4" /> Clean body (No registered scratches)
                    </div>
                  )}

                </div>
              )
            })}
          </div>

        </div>
      )}

      {viewTab === 'bookings' && (
        <div className="flex-1 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs overflow-y-auto scrollbar-thin">
          <div className="border-b pb-4 mb-4">
            <h3 className="text-xs font-black text-slate-800 tracking-tight flex items-center gap-1.5 uppercase">
              <ClipboardCheck className="h-4.5 w-4.5 text-blue-600" /> Active Rental Bookings Ledger
            </h3>
          </div>

          <table className="w-full text-xs font-medium text-slate-500">
            <thead>
              <tr className="border-b text-[10px] text-slate-400 font-bold uppercase text-left">
                <th className="pb-3 pl-2">Client</th>
                <th className="pb-3">Vehicle</th>
                <th className="pb-3">Period & Days</th>
                <th className="pb-3">Deposit Status</th>
                <th className="pb-3">Financials</th>
                <th className="pb-3">Workflow status</th>
                <th className="pb-3 pr-2 text-right">Checkpoint Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700 text-left">
              {bookings.map(b => {
                const car = fleet.find(c => c.id === b.carId)
                return (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 pl-2">
                      <div className="font-black text-slate-800">{b.clientName}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{b.clientPhone}</div>
                    </td>
                    <td className="py-4">
                      <div className="font-black text-slate-800">{car ? `${car.brand} ${car.model}` : 'Unknown'}</div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">{car?.registration_number}</div>
                    </td>
                    <td className="py-4">
                      <div>{b.pickup_date} to {b.return_date}</div>
                      <div className="text-[10px] text-slate-450 mt-0.5">{b.total_days} Days @ {b.daily_rate.toLocaleString()} DZD</div>
                    </td>
                    <td className="py-4">
                      <Badge className={b.security_deposit_status === 'paid' ? 'bg-emerald-500 text-white' : b.security_deposit_status === 'refunded' ? 'bg-slate-400 text-white' : 'bg-amber-500 text-white'}>
                        {b.security_deposit_status} ({b.security_deposit_amount.toLocaleString()} DZD)
                      </Badge>
                    </td>
                    <td className="py-4">
                      <div className="font-black text-slate-800">{b.subtotal.toLocaleString()} DZD</div>
                      {b.final_settlement_amount !== undefined && (
                        <div className="text-[9px] text-blue-600 mt-0.5">Refund: {b.final_settlement_amount.toLocaleString()} DZD</div>
                      )}
                    </td>
                    <td className="py-4">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                        b.status === 'active' ? 'bg-blue-50 text-blue-700 border-blue-100 animate-pulse' :
                        b.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-4 pr-2 text-right">
                      {b.status === 'booked' && (
                        <Button 
                          onClick={() => { setActiveBooking(b); setIsPickupWorkflowOpen(true) }}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold h-7.5"
                        >
                          Execute Pick-up
                        </Button>
                      )}
                      {b.status === 'active' && (
                        <Button 
                          onClick={() => { setActiveBooking(b); setIsReturnWorkflowOpen(true) }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold h-7.5"
                        >
                          Execute Return
                        </Button>
                      )}
                      {b.status === 'completed' && (
                        <Badge className="bg-slate-100 text-slate-600 border text-[9px]">Closed</Badge>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

        </div>
      )}

      {/* PICK-UP WORKFLOW MODAL */}
      {isPickupWorkflowOpen && activeBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-scaleIn text-left">
            <div className="bg-blue-900 px-6 py-5 text-white flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-black flex items-center gap-1.5"><Key className="h-4.5 w-4.5" /> Execute Car Rental Pick-up Check</h3>
                <p className="text-[10px] text-blue-200 font-semibold">Inspect and validate initial fleet state before keys handover.</p>
              </div>
              <button onClick={() => setIsPickupWorkflowOpen(false)} className="text-blue-200 hover:text-white"><X className="h-4.5 w-4.5" /></button>
            </div>

            <form onSubmit={handleExecutePickup} className="p-6 space-y-4 text-slate-700 text-xs">
              <div className="space-y-1.5">
                <Label className="font-bold text-[10px] text-slate-400 uppercase">Current Mileage Check (KM) *</Label>
                <Input required type="number" value={pickupKm} onChange={e => setPickupKm(e.target.value)} placeholder="e.g. 48010" className="rounded-xl border-slate-200 text-xs font-bold" />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                  <Label className="text-slate-400">Fuel Level Percent *</Label>
                  <span className="text-blue-600">{pickupFuel}%</span>
                </div>
                <input 
                  type="range" min={10} max={100} step={5} value={pickupFuel} 
                  onChange={e => setPickupFuel(Number(e.target.value))} 
                  className="w-full accent-blue-600 h-1 cursor-pointer bg-slate-200" 
                />
              </div>

              <div className="space-y-2 pt-2">
                <Label className="font-bold text-[10px] text-slate-400 uppercase">Lot Handover Checklist</Label>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-bold bg-slate-50 border p-3 rounded-xl">
                  {['Spare Tire', 'Warning Triangle', 'Safety Vest', 'Jack & Tools', 'Interior Cleaned', 'Exterior Inspected'].map(item => (
                    <label key={item} className="flex items-center gap-2 cursor-pointer p-0.5">
                      <input 
                        type="checkbox" 
                        checked={pickupChecks.includes(item)}
                        onChange={() => setPickupChecks(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item])}
                        className="rounded border-slate-300 w-4 h-4 text-blue-600" 
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="font-bold text-[10px] text-slate-400 uppercase">Deposit Payment</Label>
                <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex justify-between font-black text-blue-700">
                  <span>Guaranteed Security Deposit:</span>
                  <span>{activeBooking.security_deposit_amount.toLocaleString()} DZD</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="font-bold text-[10px] text-slate-400 uppercase">Inspection Notes</Label>
                <Textarea value={pickupNotes} onChange={e => setPickupNotes(e.target.value)} placeholder="Note preexisting bumper scratches or customer pre-auth codes..." className="rounded-xl border-slate-200 min-h-[60px]" />
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-black text-xs">
                Handover Keys & Unlock Rental
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* RETURN INSPECTION & SETTLEMENT WORKFLOW MODAL */}
      {isReturnWorkflowOpen && activeBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-scaleIn text-left flex flex-col max-h-[85vh]">
            
            <div className="bg-emerald-950 px-6 py-5 text-white flex items-center justify-between shrink-0">
              <div className="space-y-0.5">
                <h3 className="text-sm font-black flex items-center gap-1.5"><ClipboardCheck className="h-4.5 w-4.5 text-emerald-400" /> Execute Vehicle Return Inspection & Settlement</h3>
                <p className="text-[10px] text-slate-400 font-semibold">Assess body damage, check fuel/mileage limits, and finalize credit balance.</p>
              </div>
              <button onClick={() => setIsReturnWorkflowOpen(false)} className="text-slate-400 hover:text-white"><X className="h-4.5 w-4.5" /></button>
            </div>

            <form onSubmit={handleExecuteReturn} className="p-6 overflow-y-auto scrollbar-thin space-y-4 text-xs text-slate-700">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="font-bold text-[10px] text-slate-400 uppercase">Check-In Return Mileage (KM) *</Label>
                  <Input required type="number" value={returnKm} onChange={e => setReturnKm(e.target.value)} placeholder={`Out: ${activeBooking.pickup_km || 0}`} className="rounded-xl border-slate-200 text-xs font-bold text-emerald-700" />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                    <Label className="text-slate-400">Return Fuel Level *</Label>
                    <span className="text-emerald-600">{returnFuel}%</span>
                  </div>
                  <input 
                    type="range" min={10} max={100} step={5} value={returnFuel} 
                    onChange={e => setReturnFuel(Number(e.target.value))} 
                    className="w-full accent-emerald-600 h-1 cursor-pointer bg-slate-200 mt-2" 
                  />
                </div>
              </div>

              {/* Interactive body damage schematic diagram */}
              <div className="space-y-2">
                <Label className="font-bold text-[10px] text-slate-400 uppercase block">Interactive Car Body Damage Log</Label>
                <div className="bg-slate-900 border p-4 rounded-2xl text-center space-y-3">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Double click part to log damage scratches</span>
                  <div className="grid grid-cols-3 gap-2 text-[10px] font-black text-slate-300">
                    {['Front Bumper', 'Windshield', 'Rear Bumper', 'Left Door', 'Right Door', 'Roof'].map(part => {
                      const isSelected = selectedDamageParts.includes(part)
                      return (
                        <button 
                          key={part} 
                          type="button" 
                          onClick={() => setSelectedDamageParts(prev => prev.includes(part) ? prev.filter(p => p !== part) : [...prev, part])}
                          className={`p-2 rounded-lg border transition ${isSelected ? 'bg-red-600 text-white border-red-500 shadow-sm animate-pulse' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}
                        >
                          {part}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="font-bold text-[10px] text-slate-400 uppercase">Damage Repair Fees (DZD)</Label>
                  <Input type="number" value={damageCharges} onChange={e => setDamageCharges(Number(e.target.value))} className="rounded-xl border-slate-200 text-xs font-bold text-red-600" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-bold text-[10px] text-slate-400 uppercase">Cleaning Surcharge (DZD)</Label>
                  <Input type="number" value={cleaningCharges} onChange={e => setCleaningCharges(Number(e.target.value))} className="rounded-xl border-slate-200 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-bold text-[10px] text-slate-400 uppercase">Late Return Penalties</Label>
                  <Input type="number" value={lateCharges} onChange={e => setLateCharges(Number(e.target.value))} className="rounded-xl border-slate-200 text-xs" />
                </div>
              </div>

              {/* Dynamic Cost Settlement breakdown */}
              {returnKm && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 font-bold text-[11px] text-slate-600 animate-fadeIn">
                  <span className="text-[9px] font-black text-emerald-800 uppercase tracking-widest block">Final Rent Settlement Checklist</span>
                  <div className="flex justify-between">
                    <span>Base Rental (Contracted):</span>
                    <span>{activeBooking.subtotal.toLocaleString()} DZD</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Extra Mileage Penalty (Driven: {Number(returnKm) - (activeBooking.pickup_km || 0)}km):</span>
                    <span className="text-red-600">{calculateExtraKm(activeBooking, Number(returnKm)).toLocaleString()} DZD</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fuel Deficit Surcharge (Refueling):</span>
                    <span className="text-red-600">{calculateFuelPenalty(activeBooking, returnFuel).toLocaleString()} DZD</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 text-slate-800 text-xs">
                    <span>Guaranteed Deposit Deposit:</span>
                    <span className="text-emerald-600">+{activeBooking.security_deposit_amount.toLocaleString()} DZD</span>
                  </div>
                  <div className="flex justify-between text-slate-800 text-xs">
                    <span>Total Check-out Penalties:</span>
                    <span className="text-red-655 text-red-600">
                      -{(
                        calculateExtraKm(activeBooking, Number(returnKm)) + 
                        calculateFuelPenalty(activeBooking, returnFuel) + 
                        damageCharges + cleaningCharges + lateCharges
                      ).toLocaleString()} DZD
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-slate-900 text-xs">
                    <span>Final Deposit Refund Balance:</span>
                    <span className="text-blue-600">
                      {(
                        activeBooking.security_deposit_amount - 
                        (calculateExtraKm(activeBooking, Number(returnKm)) + 
                         calculateFuelPenalty(activeBooking, returnFuel) + 
                         damageCharges + cleaningCharges + lateCharges)
                      ).toLocaleString()} DZD
                    </span>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl py-3 font-black text-xs shrink-0 cursor-pointer">
                Validate Inspection & Process Settlement
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* NEW RENTAL BOOKING QUICK FORM */}
      {isNewBookingOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-scaleIn text-left">
            <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
              <h3 className="text-sm font-black flex items-center gap-1.5"><Key className="h-4.5 w-4.5" /> Book New Rental Rental</h3>
              <button onClick={() => setIsNewBookingOpen(false)} className="text-slate-400 hover:text-white"><X className="h-4.5 w-4.5" /></button>
            </div>

            <form onSubmit={handleCreateBooking} className="p-6 space-y-4 text-xs text-slate-700">
              <div className="space-y-1.5">
                <Label className="font-bold text-[10px] text-slate-400 uppercase">Client Full Name *</Label>
                <Input required value={newClient} onChange={e => setNewClient(e.target.value)} placeholder="Karim Belkadi" className="rounded-xl border-slate-200 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-bold text-[10px] text-slate-400 uppercase">Client Phone *</Label>
                <Input required value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="+213 550..." className="rounded-xl border-slate-200 text-xs" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="font-bold text-[10px] text-slate-400 uppercase">Pickup Date</Label>
                  <Input type="date" value={newPickupDate} onChange={e => setNewPickupDate(e.target.value)} className="rounded-xl border-slate-200 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-bold text-[10px] text-slate-400 uppercase">Return Date</Label>
                  <Input type="date" value={newReturnDate} onChange={e => setNewReturnDate(e.target.value)} className="rounded-xl border-slate-200 text-xs" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="font-bold text-[10px] text-slate-400 uppercase">Select Available Vehicle Lot *</Label>
                <select required value={newCarId} onChange={e => setNewCarId(e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-700 bg-white">
                  <option value="">-- Choose Rental Fleet Car --</option>
                  {fleet.filter(c => c.status === 'available').map(c => (
                    <option key={c.id} value={c.id}>{c.brand} {c.model} (Rate: {c.daily_rate} DZD/day)</option>
                  ))}
                </select>
              </div>

              <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3 font-black text-xs cursor-pointer">
                Confirm Reservation & Book
              </Button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
