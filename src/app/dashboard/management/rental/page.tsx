'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Car, Calendar, Plus, Search, Trash2, CheckCircle2, XCircle, Clock,
  User, FileText, TrendingUp, Edit3, Info, X, ShieldCheck, Key,
  Fuel, Gauge, DollarSign, ClipboardCheck, AlertTriangle, ChevronLeft,
  ChevronRight, ChevronDown, Wrench, Zap, Tag, ArrowRight, RotateCcw,
  MapPin, Phone, Menu, List, LayoutGrid, Eye, Loader2, AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useLanguage } from '@/lib/contexts/LanguageContext'

// import real database actions
import {
  getRentalFleetAction,
  getAllRentalBookingsAction,
  createRentalBookingAction,
  updateRentalBookingAction,
  deleteRentalBookingAction,
  saveRentalCarAction,
  deleteRentalCarAction
} from '@/app/actions/inventory-management'
import { getAgencyClients } from '@/app/actions/import-orders'

// ─── Constants & Styles ───────────────────────────────────────────────────────
const CAR_COLORS = [
  { bg: 'bg-blue-500',   light: 'bg-blue-50',     text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-500' },
  { bg: 'bg-emerald-500', light: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  { bg: 'bg-violet-500', light: 'bg-violet-50',   text: 'text-violet-700',  border: 'border-violet-200',  dot: 'bg-violet-500' },
  { bg: 'bg-amber-500',  light: 'bg-amber-50',    text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-500' },
  { bg: 'bg-rose-500',   light: 'bg-rose-50',     text: 'text-rose-700',    border: 'border-rose-200',    dot: 'bg-rose-500' },
]

const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const MONTHS_KEYS = ['rental.jan', 'rental.feb', 'rental.mar', 'rental.apr', 'rental.may', 'rental.jun', 'rental.jul', 'rental.aug', 'rental.sep', 'rental.oct', 'rental.nov', 'rental.dec']
const DAYS_KEYS = ['rental.mon', 'rental.tue', 'rental.wed', 'rental.thu', 'rental.fri', 'rental.sat', 'rental.sun']
const DAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Helper to extract JSONB specs column safely
const getCarSpecs = (car: any) => {
  const specs = car?.specs || {}
  return {
    registration_number: specs.registration_number || car?.registration_number || 'N/A',
    vin: specs.vin || '',
    mileage: Number(specs.mileage || 0),
    fuel_level_percent: Number(specs.fuel_level_percent || 100),
    transmission: specs.transmission || 'manual',
    fuel_type: specs.fuel_type || 'petrol',
    security_deposit: Number(specs.security_deposit || 40000),
    last_maintenance_km: Number(specs.last_maintenance_km || 0),
    next_maintenance_km: Number(specs.next_maintenance_km || 10000),
    condition_notes: specs.condition_notes || '',
    body_damages: Array.isArray(specs.body_damages) ? specs.body_damages : [],
  }
}

function yyyymmdd(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number) {
  // Returns 0=Mon..6=Sun
  const d = new Date(year, month, 1).getDay()
  return (d + 6) % 7
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CarRentalPage() {
  const { t } = useLanguage()
  const MONTHS = MONTHS_KEYS.map((k, i) => t(k, MONTHS_EN[i]))
  const DAYS_SHORT = DAYS_KEYS.map((k, i) => t(k, DAYS_EN[i]))
  const today = useMemo(() => new Date(), [])

  // DB States
  const [fleet, setFleet] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Navigation and Filter states
  const [viewTab, setViewTab] = useState<'calendar' | 'fleet' | 'bookings'>('calendar')
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [historyLimitThreeMonths, setHistoryLimitThreeMonths] = useState(true)

  // Day detail panel
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [isDayPanelOpen, setIsDayPanelOpen] = useState(false)

  // Mobile view tab filter
  const [mobileView, setMobileView] = useState<'upcoming' | 'active' | 'all'>('upcoming')

  // Modals
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false)
  const [isPickupWorkflowOpen, setIsPickupWorkflowOpen] = useState(false)
  const [isReturnWorkflowOpen, setIsReturnWorkflowOpen] = useState(false)
  const [isNewCarModalOpen, setIsNewCarModalOpen] = useState(false)
  const [activeBooking, setActiveBooking] = useState<any | null>(null)
  const [editingCar, setEditingCar] = useState<any | null>(null)

  // Pickup forms
  const [pickupKm, setPickupKm] = useState('')
  const [pickupFuel, setPickupFuel] = useState(100)
  const [pickupChecks, setPickupChecks] = useState<string[]>([])
  const [pickupNotes, setPickupNotes] = useState('')

  // Return forms
  const [returnKm, setReturnKm] = useState('')
  const [returnFuel, setReturnFuel] = useState(100)
  const [returnChecks, setReturnChecks] = useState<string[]>([])
  const [damageNotes, setDamageNotes] = useState('')
  const [damageCharges, setDamageCharges] = useState(0)
  const [cleaningCharges, setCleaningCharges] = useState(0)
  const [lateCharges, setLateCharges] = useState(0)
  const [selectedDamageParts, setSelectedDamageParts] = useState<string[]>([])

  // Create booking forms
  const [newClientId, setNewClientId] = useState('')
  const [newWalkInName, setNewWalkInName] = useState('')
  const [newWalkInPhone, setNewWalkInPhone] = useState('')
  const [newCarId, setNewCarId] = useState('')
  const [newPickupDate, setNewPickupDate] = useState(yyyymmdd(today))
  const [newReturnDate, setNewReturnDate] = useState(yyyymmdd(new Date(today.getTime() + 86400000 * 3)))
  const [newBookingNotes, setNewBookingNotes] = useState('')

  // Create/Edit Car forms
  const [carBrand, setCarBrand] = useState('')
  const [carModel, setCarModel] = useState('')
  const [carYear, setCarYear] = useState(2024)
  const [carColor, setCarColor] = useState('Blanc')
  const [carDailyRate, setCarDailyRate] = useState(7500)
  const [carRegNum, setCarRegNum] = useState('')
  const [carMileage, setCarMileage] = useState(1000)
  const [carTransmission, setCarTransmission] = useState<'manual' | 'automatic'>('manual')
  const [carFuelType, setCarFuelType] = useState<'petrol' | 'diesel' | 'hybrid' | 'electric'>('petrol')
  const [carSecurityDeposit, setCarSecurityDeposit] = useState(40000)
  const [carConditionNotes, setCarConditionNotes] = useState('')
  const [carType, setCarType] = useState<'rental' | 'sell' | 'sur_command'>('rental')

  // Refresh & Load Data
  const loadData = async () => {
    setIsLoading(true)
    setErrorMsg(null)
    try {
      const [fleetRes, bookingsRes, clientsRes] = await Promise.all([
        getRentalFleetAction(),
        getAllRentalBookingsAction(),
        getAgencyClients()
      ])

      if (fleetRes.success) setFleet(fleetRes.fleet || [])
      else throw new Error(fleetRes.error || 'Failed to load fleet')

      if (bookingsRes.success) setBookings(bookingsRes.bookings || [])
      else throw new Error(bookingsRes.error || 'Failed to load bookings')

      if (clientsRes.success) setClients(clientsRes.data || [])
      else throw new Error(clientsRes.error || 'Failed to load clients')
    } catch (e: any) {
      console.error(e)
      setErrorMsg(e.message || 'An unexpected error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Rolling 3-month cut-off calculation
  const threeMonthsAgoStr = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 90)
    return yyyymmdd(d)
  }, [])

  // Computed display bookings list
  const filteredBookings = useMemo(() => {
    if (!historyLimitThreeMonths) return bookings
    return bookings.filter(b => b.return_date >= threeMonthsAgoStr || b.status === 'active' || b.status === 'confirmed')
  }, [bookings, historyLimitThreeMonths, threeMonthsAgoStr])

  // Get Bookings specifically active for a selected date
  const getBookingsForDay = (dateStr: string) => {
    return filteredBookings.filter(b => {
      if (b.status === 'cancelled') return false
      // Format TIMESTAMPTZ dates to standard local strings for comparisons
      const start = b.pickup_date.split('T')[0]
      const end = b.return_date.split('T')[0]
      return dateStr >= start && dateStr <= end
    }).map(b => ({
      ...b,
      car: fleet.find(c => c.id === b.car_id)
    }))
  }

  // Selected Day Bookings computed
  const selectedDayBookings = useMemo(() => {
    if (!selectedDay) return []
    return getBookingsForDay(selectedDay)
  }, [selectedDay, filteredBookings, fleet])

  // Year overview booking counts per month
  const yearHeatmap = useMemo(() => {
    const map: Record<number, number> = {}
    for (let mi = 0; mi < 12; mi++) {
      const prefix = `${calYear}-${String(mi + 1).padStart(2, '0')}`
      map[mi] = filteredBookings.filter(b => {
        if (b.status === 'cancelled' || b.status === 'completed') return false
        const start = b.pickup_date.split('T')[0]
        const end = b.return_date.split('T')[0]
        return start.startsWith(prefix) || end.startsWith(prefix)
      }).length
    }
    return map
  }, [filteredBookings, calYear])

  // Monthly stats
  const monthStats = useMemo(() => {
    const prefix = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`
    const monthBookings = filteredBookings.filter(b => {
      if (b.status === 'cancelled') return false
      const start = b.pickup_date.split('T')[0]
      const end = b.return_date.split('T')[0]
      return start.startsWith(prefix) || end.startsWith(prefix)
    })

    const revenue = monthBookings.reduce((sum, b) => sum + Number(b.total_price || 0), 0)
    
    // Calculate total rented days in the current filtered list
    const rentedDays = monthBookings.reduce((sum, b) => {
      const start = new Date(b.pickup_date.split('T')[0])
      const end = new Date(b.return_date.split('T')[0])
      const diffTime = Math.abs(end.getTime() - start.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1
      return sum + diffDays
    }, 0)

    const activeCount = monthBookings.filter(b => b.status === 'active').length
    const bookedCount = monthBookings.filter(b => b.status === 'confirmed').length
    const completedCount = monthBookings.filter(b => b.status === 'completed').length

    return { revenue, rentedDays, activeCount, bookedCount, completedCount }
  }, [filteredBookings, calYear, calMonth])

  // Map fleet cars to distinct colors index
  const carColorMap = useMemo(() => {
    const map: Record<string, typeof CAR_COLORS[0]> = {}
    fleet.forEach((car, i) => {
      map[car.id] = CAR_COLORS[i % CAR_COLORS.length]
    })
    return map
  }, [fleet])

  // Date Navigation Helpers
  const prevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11)
      setCalYear(y => y - 1)
    } else {
      setCalMonth(m => m - 1)
    }
  }

  const nextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0)
      setCalYear(y => y + 1)
    } else {
      setCalMonth(m => m + 1)
    }
  }

  const goToToday = () => {
    setCalYear(today.getFullYear())
    setCalMonth(today.getMonth())
  }

  const handleDayClick = (dateStr: string) => {
    setSelectedDay(dateStr)
    setIsDayPanelOpen(true)
  }

  // Auto-penalty & Return calculations
  const calculateExtraKm = (booking: any, retKm: number) => {
    const car = fleet.find(c => c.id === booking.car_id)
    const specs = getCarSpecs(car)
    const pKm = booking.metadata?.pickup_km || specs.mileage
    const diffKm = retKm - pKm
    
    const start = new Date(booking.pickup_date.split('T')[0])
    const end = new Date(booking.return_date.split('T')[0])
    const days = Math.ceil(Math.abs(end.getTime() - start.getTime()) / 86400000) || 1
    
    const allowed = days * 250 // 250km allowance per day
    return diffKm > allowed ? (diffKm - allowed) * 35 : 0 // 35 DZD/km excess
  }

  const calculateFuelPenalty = (booking: any, retFuel: number) => {
    const pFuel = booking.metadata?.pickup_fuel_percent || 100
    if (retFuel < pFuel) {
      const deficit = pFuel - retFuel
      return deficit * 150 // 150 DZD per 1% deficit
    }
    return 0
  }

  // Handover (Pickup) submit
  const handleExecutePickup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeBooking || !pickupKm) return

    setIsLoading(true)
    try {
      const metadata = {
        ...activeBooking.metadata,
        pickup_km: Number(pickupKm),
        pickup_fuel_percent: pickupFuel,
        pickup_condition: pickupChecks,
        pickup_notes: pickupNotes
      }

      // Update booking to active
      const bookingRes = await updateRentalBookingAction(activeBooking.id, {
        status: 'active',
        metadata
      })

      if (!bookingRes.success) throw new Error(bookingRes.error)

      // Update car status to rented, mileage and fuel in specs
      const car = fleet.find(c => c.id === activeBooking.car_id)
      const carSpecs = getCarSpecs(car)
      const updatedSpecs = {
        ...car.specs,
        mileage: Number(pickupKm),
        fuel_level_percent: pickupFuel
      }

      const carRes = await saveRentalCarAction({
        id: car.id,
        status: 'rented',
        specs: updatedSpecs
      })

      if (!carRes.success) throw new Error(carRes.error)

      setIsPickupWorkflowOpen(false)
      setActiveBooking(null)
      loadData()
    } catch (err: any) {
      alert('Error finalizing pickup: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Check-out (Return) submit
  const handleExecuteReturn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeBooking || !returnKm) return

    setIsLoading(true)
    try {
      const rKm = Number(returnKm)
      const extraKmFee = calculateExtraKm(activeBooking, rKm)
      const fuelFee = calculateFuelPenalty(activeBooking, returnFuel)
      const totalPenalties = extraKmFee + fuelFee + damageCharges + cleaningCharges + lateCharges

      const metadata = {
        ...activeBooking.metadata,
        return_km: rKm,
        return_fuel_percent: returnFuel,
        return_condition: returnChecks,
        damage_notes: damageNotes + (selectedDamageParts.length > 0 ? ` [Logged damaged: ${selectedDamageParts.join(', ')}]` : ''),
        damage_charges: damageCharges,
        fuel_charges: fuelFee,
        extra_km_charges: extraKmFee,
        cleaning_charges: cleaningCharges,
        late_charges: lateCharges,
        penalties_total: totalPenalties
      }

      // Update booking status to completed, deposit status, actual return date
      const bookingRes = await updateRentalBookingAction(activeBooking.id, {
        status: 'completed',
        actual_return_date: new Date().toISOString(),
        metadata
      })

      if (!bookingRes.success) throw new Error(bookingRes.error)

      // Update car status to available, append new mileage, fuel, and damages log
      const car = fleet.find(c => c.id === activeBooking.car_id)
      const carSpecs = getCarSpecs(car)

      const loggedDamages = [...carSpecs.body_damages]
      selectedDamageParts.forEach(part => {
        loggedDamages.push({
          part,
          severity: 'light',
          cost: damageCharges / (selectedDamageParts.length || 1),
          date: yyyymmdd(today)
        })
      })

      const updatedSpecs = {
        ...car.specs,
        mileage: rKm,
        fuel_level_percent: returnFuel,
        body_damages: loggedDamages
      }

      const carRes = await saveRentalCarAction({
        id: car.id,
        status: 'available',
        specs: updatedSpecs
      })

      if (!carRes.success) throw new Error(carRes.error)

      setIsReturnWorkflowOpen(false)
      setActiveBooking(null)
      setSelectedDamageParts([])
      setDamageCharges(0)
      setCleaningCharges(0)
      setLateCharges(0)
      setReturnKm('')
      setDamageNotes('')
      loadData()
    } catch (err: any) {
      alert('Error processing return: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Create new booking submit
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCarId || (!newClientId && !newWalkInName)) {
      alert('Please fill out all required fields')
      return
    }

    setIsLoading(true)
    try {
      const selectedCar = fleet.find(c => c.id === newCarId)
      if (!selectedCar) throw new Error('Vehicle not found')

      const start = new Date(newPickupDate)
      const end = new Date(newReturnDate)
      const days = Math.ceil(Math.abs(end.getTime() - start.getTime()) / 86400000) || 1
      const total = Number(selectedCar.daily_rate) * days
      const carSpecs = getCarSpecs(selectedCar)

      const payload: any = {
        car_id: newCarId,
        pickup_date: new Date(newPickupDate).toISOString(),
        return_date: new Date(newReturnDate).toISOString(),
        total_price: total,
        deposit_amount: carSpecs.security_deposit,
        notes: newBookingNotes,
        metadata: {
          created_by_agent: true
        }
      }

      if (newClientId) {
        payload.client_id = newClientId
      } else {
        payload.client_name = newWalkInName
        payload.client_phone = newWalkInPhone
      }

      const res = await createRentalBookingAction(payload)
      if (!res.success) throw new Error(res.error)

      setIsNewBookingOpen(false)
      setNewClientId('')
      setNewWalkInName('')
      setNewWalkInPhone('')
      setNewCarId('')
      setNewBookingNotes('')
      loadData()
    } catch (err: any) {
      alert('Error creating booking: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Create / Edit Rental Car submit
  const handleSaveCar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!carBrand || !carModel || !carRegNum) {
      alert('Brand, Model, and Plate number are required')
      return
    }

    setIsLoading(true)
    try {
      const payload: any = {
        brand: carBrand,
        model: carModel,
        year: Number(carYear),
        color: carColor,
        daily_rate: Number(carDailyRate),
        car_type: carType,
        status: editingCar ? editingCar.status : 'available',
        specs: {
          registration_number: carRegNum,
          mileage: Number(carMileage),
          transmission: carTransmission,
          fuel_type: carFuelType,
          security_deposit: Number(carSecurityDeposit),
          condition_notes: carConditionNotes,
          body_damages: editingCar ? (editingCar.specs?.body_damages || []) : [],
          last_maintenance_km: editingCar ? (editingCar.specs?.last_maintenance_km || 0) : 0,
          next_maintenance_km: editingCar ? (editingCar.specs?.next_maintenance_km || 10000) : 10000
        }
      }

      if (editingCar) {
        payload.id = editingCar.id
      }

      const res = await saveRentalCarAction(payload)
      if (!res.success) throw new Error(res.error)

      setIsNewCarModalOpen(false)
      setEditingCar(null)
      // Reset fields
      setCarBrand('')
      setCarModel('')
      setCarYear(2024)
      setCarColor('Blanc')
      setCarDailyRate(7500)
      setCarRegNum('')
      setCarMileage(1000)
      setCarTransmission('manual')
      setCarFuelType('petrol')
      setCarSecurityDeposit(40000)
      setCarConditionNotes('')
      setCarType('rental')
      loadData()
    } catch (err: any) {
      alert('Error saving car: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Delete Rental Car
  const handleDeleteCar = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vehicle from the fleet?')) return
    setIsLoading(true)
    try {
      const res = await deleteRentalCarAction(id)
      if (!res.success) throw new Error(res.error)
      loadData()
    } catch (err: any) {
      alert('Error deleting car: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Open edit modal
  const openEditCar = (car: any) => {
    setEditingCar(car)
    setCarBrand(car.brand)
    setCarModel(car.model)
    setCarYear(Number(car.year))
    setCarColor(car.color || 'Blanc')
    setCarDailyRate(Number(car.daily_rate))
    setCarType(car.car_type || 'rental')
    
    const specs = getCarSpecs(car)
    setCarRegNum(specs.registration_number)
    setCarMileage(specs.mileage)
    setCarTransmission(specs.transmission as any)
    setCarFuelType(specs.fuel_type as any)
    setCarSecurityDeposit(specs.security_deposit)
    setCarConditionNotes(specs.condition_notes)

    setIsNewCarModalOpen(true)
  }

  // Computed Mobile Bookings Lists
  const mobileBookings = useMemo(() => {
    const nowStr = yyyymmdd(today)
    return filteredBookings.filter(b => {
      if (b.status === 'cancelled') return false
      const pickup = b.pickup_date.split('T')[0]
      const ret = b.return_date.split('T')[0]

      if (mobileView === 'upcoming') {
        return b.status === 'confirmed' && pickup >= nowStr
      }
      if (mobileView === 'active') {
        return b.status === 'active'
      }
      // all/history
      return b.status === 'completed' || (pickup < nowStr && b.status === 'confirmed')
    }).sort((a, b) => a.pickup_date.localeCompare(b.pickup_date))
  }, [filteredBookings, mobileView, today])

  // Calendar parameters
  const calendarDays = useMemo(() => getDaysInMonth(calYear, calMonth), [calYear, calMonth])
  const firstDow = useMemo(() => getFirstDayOfWeek(calYear, calMonth), [calYear, calMonth])

  return (
    <div className="flex-1 overflow-hidden flex flex-col gap-4 h-full relative text-left rtl:text-right">

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            <p className="text-xs font-black text-slate-500">Communicating with Supabase...</p>
          </div>
        </div>
      )}

      {/* Error Message banner */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center gap-2 text-xs font-bold shadow-sm shrink-0">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          <span>{errorMsg}</span>
          <Button size="sm" variant="ghost" onClick={loadData} className="ml-auto text-red-700 hover:bg-red-100/50 cursor-pointer h-7 text-[10px]">
            Retry
          </Button>
        </div>
      )}

      {/* ── TOP BAR ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 shadow-xs shrink-0">
        <div className="flex bg-slate-100 p-1 rounded-xl gap-0.5 border overflow-x-auto scrollbar-none">
          {[
            { id: 'calendar', label: t('rental.tab_calendar', 'Interactive Calendar'), icon: Calendar },
            { id: 'fleet',    label: t('rental.tab_fleet', 'Fleet & Service'), icon: Car },
            { id: 'bookings', label: t('rental.tab_ledger', 'Rental Ledger'), icon: ClipboardCheck },
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button key={tab.id} onClick={() => setViewTab(tab.id as any)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${viewTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <Icon className="h-3.5 w-3.5" />{tab.label}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {viewTab === 'fleet' ? (
            <Button onClick={() => { setEditingCar(null); setIsNewCarModalOpen(true) }} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-sm cursor-pointer gap-1.5 h-9 shrink-0 ml-auto sm:ml-0">
              <Plus className="h-4 w-4" /> {t('rental.add_vehicle', 'Add Rental Vehicle')}
            </Button>
          ) : (
            <Button onClick={() => setIsNewBookingOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-sm cursor-pointer gap-1.5 h-9 shrink-0 ml-auto sm:ml-0">
              <Plus className="h-4 w-4" /> {t('rental.new_booking', 'New Booking')}
            </Button>
          )}
        </div>
      </div>

      {/* ══════════════════ CALENDAR VIEW ══════════════════ */}
      {viewTab === 'calendar' && (
        <div className="flex-1 overflow-hidden flex flex-col min-h-0 gap-4">

          {/* ── DESKTOP CALENDAR ── (hidden on mobile) */}
          <div className="hidden md:flex flex-col flex-1 min-h-0 bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">

            {/* Calendar header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-6 py-4 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={prevMonth} className="h-8 w-8 rounded-lg hover:bg-white/10 flex items-center justify-center cursor-pointer transition"><ChevronLeft className="h-4 w-4" /></button>
                  <div>
                    <h2 className="text-base font-black tracking-tight">{MONTHS[calMonth]} {calYear}</h2>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {monthStats.completedCount} {t('rental.completed', 'completed')} · {monthStats.activeCount} {t('rental.status_active', 'active')} · {monthStats.bookedCount} {t('rental.upcoming', 'upcoming')}
                    </p>
                  </div>
                  <button onClick={nextMonth} className="h-8 w-8 rounded-lg hover:bg-white/10 flex items-center justify-center cursor-pointer transition"><ChevronRight className="h-4 w-4" /></button>
                  <button onClick={goToToday} className="ml-2 text-[10px] font-black bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1.5 rounded-lg cursor-pointer transition">{t('rental.today', 'Today')}</button>
                </div>
                
                {/* Switch for dynamic loading history */}
                <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/85 px-3 py-2 rounded-xl">
                  <span className="text-[9px] font-black text-slate-300">{t('rental.rolling3m', 'Rolling 3-Months')}</span>
                  <Switch checked={historyLimitThreeMonths} onCheckedChange={setHistoryLimitThreeMonths} />
                </div>

                {/* Month stats */}
                <div className="flex items-center gap-4 text-[11px] font-bold">
                  <div className="text-right">
                    <span className="text-slate-400 block text-[9px]">{t('rental.revenue', 'Revenue Generated')}</span>
                    <span className="text-emerald-400">{monthStats.revenue.toLocaleString('fr-DZ')} DZD</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[9px]">{t('rental.days_active', 'Days Active')}</span>
                    <span className="text-blue-400">{monthStats.rentedDays} {t('rental.days', 'days')}</span>
                  </div>
                  {/* Legend */}
                  <div className="flex items-center gap-3 text-[9px] font-bold border-l border-white/10 pl-4">
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-400 ring-2 ring-blue-300/30" /> {t('rental.status_active', 'Active')}</span>
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-amber-300/30" /> {t('rental.status_booked', 'Booked')}</span>
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate-500 ring-2 ring-slate-400/30" /> {t('rental.status_done', 'Done')}</span>
                  </div>
                </div>
              </div>

              {/* Year month strip */}
              <div className="mt-3 flex gap-1 overflow-x-auto scrollbar-none">
                {MONTHS.map((mn, mi) => {
                  const count = yearHeatmap[mi] || 0
                  const isActive = mi === calMonth
                  return (
                    <button key={mn} onClick={() => setCalMonth(mi)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-black cursor-pointer transition-all ${isActive ? 'bg-blue-600 text-white' : 'hover:bg-white/10 text-slate-400 hover:text-white'}`}>
                      {mn.slice(0, 3)}
                      {count > 0 && <span className={`block text-center mt-0.5 text-[8px] ${isActive ? 'text-blue-200' : 'text-blue-400'}`}>{count}</span>}
                    </button>
                  )
                })}
              </div>

              {/* Fleet color key */}
              <div className="mt-2.5 flex gap-3 text-[9px] font-bold flex-wrap border-t border-white/10 pt-2.5">
                {fleet.length === 0 ? (
                  <span className="text-slate-400 text-[8px]">No vehicles in the fleet. Go to "Fleet & Service" to add one!</span>
                ) : fleet.map((car, i) => {
                  const c = CAR_COLORS[i % CAR_COLORS.length] || CAR_COLORS[0]
                  return (
                    <span key={car.id} className="flex items-center gap-1.5">
                      <span className={`h-2 w-6 rounded-full ${c.bg} opacity-80`} />
                      <span className="text-slate-300">{car.brand} {car.model}</span>
                    </span>
                  )
                })}
              </div>
            </div>

            {/* Day-of-week header */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 shrink-0">
              {DAYS_SHORT.map(d => (
                <div key={d} className={`py-2.5 text-center text-[10px] font-black uppercase tracking-wider text-slate-400 ${d === 'Sat' || d === 'Sun' ? 'text-rose-400' : ''}`}>{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="grid grid-cols-7 auto-rows-fr flex-1 min-h-0">
                {/* Empty cells before first day */}
                {Array.from({ length: firstDow }).map((_, i) => (
                  <div key={`empty-${i}`} className="border-r border-b border-slate-100 bg-slate-50/50 min-h-0" />
                ))}

                {/* Day cells */}
                {Array.from({ length: calendarDays }).map((_, di) => {
                  const day = di + 1
                  const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const isToday = dateStr === yyyymmdd(today)
                  const isPast = dateStr < yyyymmdd(today)
                  const dayOfWeek = (firstDow + di) % 7
                  const isWeekend = dayOfWeek === 5 || dayOfWeek === 6
                  const dayBookings = getBookingsForDay(dateStr)

                  return (
                    <div
                      key={day}
                      onClick={() => handleDayClick(dateStr)}
                      className={`border-r border-b border-slate-100 min-h-0 p-2 flex flex-col gap-1 transition-colors duration-150 relative group cursor-pointer select-none
                        ${isToday ? 'bg-blue-50/80 border-blue-200' : ''}
                        ${isPast && !isToday ? 'bg-slate-50/40' : ''}
                        ${isWeekend && !isToday ? 'bg-rose-50/20' : ''}
                        ${dayBookings.length > 0 && !isToday ? 'hover:bg-slate-100/80' : 'hover:bg-slate-50'}
                      `}
                    >
                      {/* Day number */}
                      <div className="flex items-center justify-between shrink-0">
                        <span className={`text-[11px] font-black rounded-lg w-6 h-6 flex items-center justify-center
                          ${isToday ? 'bg-blue-600 text-white' : isPast ? 'text-slate-400' : isWeekend ? 'text-rose-500' : 'text-slate-700'}
                        `}>{day}</span>
                        {dayBookings.length > 0 && (
                          <span className="text-[9px] font-black text-slate-400 bg-slate-200/60 rounded-full px-1.5 py-0.5">{dayBookings.length}</span>
                        )}
                      </div>

                      {/* Booking pills */}
                      <div className="flex flex-col gap-0.5 flex-1 overflow-hidden">
                        {dayBookings.slice(0, 3).map(b => {
                          const c = carColorMap[b.car_id] || CAR_COLORS[0]
                          const car = b.car
                          const isStart = dateStr === b.pickup_date.split('T')[0]
                          const isEnd = dateStr === b.return_date.split('T')[0]
                          const statusColor = b.status === 'active' ? c.bg : b.status === 'confirmed' ? 'bg-amber-400' : 'bg-slate-400'
                          return (
                            <div key={b.id}
                              className={`${c.light} ${c.text} ${c.border} border rounded-md px-1.5 py-0.5 text-[8px] font-black flex items-center gap-1 overflow-hidden leading-tight`}
                              title={`${car?.brand} ${car?.model} — ${b.client?.full_name || 'Walk-in'}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${statusColor}`} />
                              <span className="truncate">{car?.brand} {car?.model}</span>
                              {isStart && <span className="shrink-0 text-[7px] font-black opacity-70">▶</span>}
                              {isEnd && <span className="shrink-0 text-[7px] font-black opacity-70">◀</span>}
                            </div>
                          )
                        })}
                        {dayBookings.length > 3 && (
                          <div className="text-[8px] font-black text-slate-500 bg-slate-200/80 rounded-md px-1.5 py-0.5">+{dayBookings.length - 3} more</div>
                        )}
                      </div>

                      {/* Hover overlay hint */}
                      {dayBookings.length === 0 && !isPast && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus className="h-4 w-4 text-slate-300" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

          </div>

          {/* ── MOBILE VIEW ── (shown on mobile only) */}
          <div className="flex md:hidden flex-col gap-4 flex-1 overflow-y-auto pb-4">
            {/* Mobile stats banner */}
            <div className="bg-gradient-to-r from-blue-900 to-slate-900 rounded-2xl p-4 text-white">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-black">{MONTHS[calMonth]} {calYear}</h2>
                  <p className="text-[10px] text-blue-200 mt-0.5">{monthStats.revenue.toLocaleString('fr-DZ')} DZD revenue</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={prevMonth} className="h-8 w-8 bg-white/10 rounded-lg flex items-center justify-center cursor-pointer"><ChevronLeft className="h-4 w-4" /></button>
                  <button onClick={nextMonth} className="h-8 w-8 bg-white/10 rounded-lg flex items-center justify-center cursor-pointer"><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
                <div className="bg-white/10 rounded-xl p-2"><p className="text-blue-200 text-[8px]">Active</p><p className="text-white text-sm font-black">{monthStats.activeCount}</p></div>
                <div className="bg-white/10 rounded-xl p-2"><p className="text-blue-200 text-[8px]">Upcoming</p><p className="text-white text-sm font-black">{monthStats.bookedCount}</p></div>
                <div className="bg-white/10 rounded-xl p-2"><p className="text-blue-200 text-[8px]">Done</p><p className="text-white text-sm font-black">{monthStats.completedCount}</p></div>
              </div>
            </div>

            {/* Mobile filter tabs */}
            <div className="flex bg-white border border-slate-200 rounded-xl p-1 gap-1 shadow-xs">
              {[
                { id: 'upcoming', label: '📅 Upcoming' },
                { id: 'active',   label: '🔵 Active' },
                { id: 'all',      label: '📋 History Ledger' },
              ].map(t => (
                <button key={t.id} onClick={() => setMobileView(t.id as any)}
                  className={`flex-1 py-2 text-[10px] font-black rounded-lg transition cursor-pointer ${mobileView === t.id ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Mobile booking cards */}
            <div className="space-y-3">
              {mobileBookings.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400">
                  <Calendar className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                  <p className="font-bold text-slate-500 text-sm">No active rentals under this tab</p>
                </div>
              ) : mobileBookings.map(b => {
                const car = fleet.find(c => c.id === b.car_id)
                const specs = getCarSpecs(car)
                const colorIdx = fleet.findIndex(c => c.id === b.car_id)
                const color = CAR_COLORS[colorIdx % CAR_COLORS.length] || CAR_COLORS[0]
                
                const start = new Date(b.pickup_date.split('T')[0])
                const end = new Date(b.return_date.split('T')[0])
                const days = Math.ceil(Math.abs(end.getTime() - start.getTime()) / 86400000) || 1

                const sc = b.status === 'active' 
                  ? { bg: 'bg-blue-50', text: 'text-blue-700', label: '🔵 Active' }
                  : b.status === 'confirmed'
                    ? { bg: 'bg-amber-50', text: 'text-amber-700', label: '🟡 Confirmed' }
                    : { bg: 'bg-emerald-50', text: 'text-emerald-700', label: '✅ Done' }

                return (
                  <div key={b.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <div className={`h-1 ${color.bg} w-full`} />
                    <div className="p-4 space-y-3 text-left rtl:text-right">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-black text-slate-800 text-sm">{b.client?.full_name || b.metadata?.client_name || 'Walk-in Client'}</p>
                          <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5"><Phone className="h-3 w-3" /> {b.client?.phone || 'N/A'}</p>
                        </div>
                        <span className={`${sc.bg} ${sc.text} text-[9px] font-black px-2.5 py-1 rounded-full`}>{sc.label}</span>
                      </div>
                      <div className={`${color.light} ${color.border} border rounded-xl px-3 py-2 flex items-center gap-2`}>
                        <Car className={`h-4 w-4 ${color.text}`} />
                        <span className={`text-xs font-black ${color.text}`}>{car?.brand} {car?.model} ({car?.year})</span>
                        <span className="text-[9px] text-slate-400 ml-auto font-mono">{specs.registration_number}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <div className="flex-1 bg-slate-50 border rounded-xl px-3 py-2 text-center">
                          <p className="text-[8px] text-slate-400 uppercase font-black">Pickup</p>
                          <p className="text-slate-700">{new Date(b.pickup_date).toLocaleDateString('fr-DZ', { day: '2-digit', month: 'short' })}</p>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <div className="flex-1 bg-slate-50 border rounded-xl px-3 py-2 text-center">
                          <p className="text-[8px] text-slate-400 uppercase font-black">Return</p>
                          <p className="text-slate-700">{new Date(b.return_date).toLocaleDateString('fr-DZ', { day: '2-digit', month: 'short' })}</p>
                        </div>
                        <div className="flex-1 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-center">
                          <p className="text-[8px] text-blue-500 uppercase font-black">Duration</p>
                          <p className="text-blue-700 font-black">{days}d</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-700">{Number(b.total_price || 0).toLocaleString('fr-DZ')} DZD</span>
                        <div className="flex gap-2">
                          {b.status === 'confirmed' && (
                            <Button onClick={() => { setActiveBooking(b); setPickupKm(String(specs.mileage)); setIsPickupWorkflowOpen(true) }} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black h-8 cursor-pointer">Pickup ▶</Button>
                          )}
                          {b.status === 'active' && (
                            <Button onClick={() => { setActiveBooking(b); setReturnKm(String(specs.mileage + 100)); setIsReturnWorkflowOpen(true) }} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black h-8 cursor-pointer">Return ◀</Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════ FLEET VIEW ══════════════════ */}
      {viewTab === 'fleet' && (
        <div className="flex-1 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs overflow-y-auto scrollbar-thin">
          <div className="border-b pb-4 mb-4 text-left rtl:text-right">
            <h3 className="text-xs font-black text-slate-800 tracking-tight flex items-center gap-1.5 uppercase"><Car className="h-4 w-4 text-blue-600" /> Fleet Maintenance & Telemetry Schedules</h3>
          </div>
          {fleet.length === 0 ? (
            <div className="bg-slate-50 border rounded-2xl p-12 text-center text-slate-400">
              <Car className="h-12 w-12 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-500 text-sm">No vehicles registered in your rental fleet yet</p>
              <Button onClick={() => { setEditingCar(null); setIsNewCarModalOpen(true) }} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black mt-4 cursor-pointer">
                Add Your First Car
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {fleet.map((car, i) => {
                const specs = getCarSpecs(car)
                const kmToMaint = specs.next_maintenance_km - specs.mileage
                const isOverdue = kmToMaint <= 0
                const progressPercent = Math.min(100, Math.max(0, ((specs.mileage - specs.last_maintenance_km) / (specs.next_maintenance_km - specs.last_maintenance_km)) * 100))
                const color = CAR_COLORS[i % CAR_COLORS.length] || CAR_COLORS[0]
                
                return (
                  <div key={car.id} className="border border-slate-200/80 rounded-2xl p-5 space-y-4 bg-slate-50/50 relative hover:shadow-sm transition text-left rtl:text-right">
                    <div className={`h-0.5 ${color.bg} absolute top-0 left-0 right-0 rounded-t-2xl`} />
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-black text-slate-800">{car.brand} {car.model} ({car.year})</h4>
                        <p className="text-[9px] font-mono text-slate-400 font-bold mt-0.5">{specs.registration_number}</p>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <Badge className={car.status === 'available' ? 'bg-emerald-500 text-white' : car.status === 'rented' ? 'bg-blue-500 text-white' : 'bg-rose-500 text-white'}>
                          {car.status}
                        </Badge>
                        <div className="flex gap-1.5 mt-1.5">
                          <button onClick={() => openEditCar(car)} className="p-1 hover:bg-slate-200 rounded text-slate-500 transition cursor-pointer"><Edit3 className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDeleteCar(car.id)} className="p-1 hover:bg-red-50 hover:text-red-600 rounded text-slate-400 transition cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs py-2 border-y border-slate-100 bg-white rounded-xl font-bold">
                      <div><span className="text-[8px] text-slate-400 uppercase block mb-0.5">Rate</span><span className="text-slate-800">{Number(car.daily_rate).toLocaleString()} DZD</span></div>
                      <div><span className="text-[8px] text-slate-400 uppercase block mb-0.5">Mileage</span><span className="text-slate-800">{specs.mileage.toLocaleString()} km</span></div>
                      <div><span className="text-[8px] text-slate-400 uppercase block mb-0.5">Fuel</span><span className="text-slate-800">{specs.fuel_level_percent}%</span></div>
                    </div>
                    <div className="space-y-1.5 text-[11px] font-bold text-slate-600">
                      <div className="flex justify-between">
                        <span>Service Progress</span>
                        <span className={isOverdue ? 'text-rose-600 animate-pulse' : 'text-slate-400'}>{isOverdue ? '⚠️ Overdue!' : `${kmToMaint.toLocaleString()} km left`}</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${isOverdue ? 'bg-rose-600' : 'bg-blue-500'}`} style={{ width: `${progressPercent}%` }} />
                      </div>
                      <p className="text-[9px] text-slate-400">Last: {specs.last_maintenance_km.toLocaleString()} km | Next: {specs.next_maintenance_km.toLocaleString()} km</p>
                    </div>
                    {specs.body_damages.length > 0 ? (
                      <div className="p-3 bg-amber-50 border border-amber-200/50 rounded-xl space-y-1 max-h-[110px] overflow-y-auto scrollbar-thin">
                        <span className="text-[9px] font-black text-amber-800 uppercase tracking-widest flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> Damage Log</span>
                        {specs.body_damages.map((d: any, idx: number) => (
                          <div key={idx} className="text-[9px] text-amber-700 font-bold flex justify-between">
                            <span>• {d.part}</span><span>{Number(d.cost || 0).toLocaleString()} DZD</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-1.5 text-[9px] font-black text-emerald-800">
                        <CheckCircle2 className="h-4 w-4 shrink-0" /> Clean body — No registered damages
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════ BOOKINGS LEDGER ══════════════════ */}
      {viewTab === 'bookings' && (
        <div className="flex-1 bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden flex flex-col min-h-0">
          <div className="px-5 pt-5 pb-4 border-b shrink-0 text-left rtl:text-right">
            <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase"><ClipboardCheck className="h-4 w-4 text-blue-600" /> Complete Rental bookings Ledger</h3>
          </div>
          <div className="overflow-y-auto scrollbar-thin flex-1 p-5">
            {bookings.length === 0 ? (
              <div className="bg-slate-50 border rounded-2xl p-12 text-center text-slate-400">
                <ClipboardCheck className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-slate-500 text-sm">No bookings recorded inside the system</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.filter(b => b.status !== 'cancelled').sort((a, b) => b.pickup_date.localeCompare(a.pickup_date)).map(b => {
                  const car = fleet.find(c => c.id === b.car_id)
                  const colorIdx = fleet.findIndex(c => c.id === b.car_id)
                  const color = CAR_COLORS[colorIdx % CAR_COLORS.length] || CAR_COLORS[0]
                  
                  const statusColors = { 
                    active: 'bg-blue-100 text-blue-700 border-blue-200 animate-pulse', 
                    confirmed: 'bg-amber-100 text-amber-700 border-amber-200', 
                    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                  }
                  const label = b.status === 'active' ? 'Active' : b.status === 'confirmed' ? 'Confirmed' : 'Completed'

                  return (
                    <div key={b.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl hover:shadow-xs transition text-left rtl:text-right">
                      <div className={`h-10 w-1.5 rounded-full ${color.bg} shrink-0 hidden sm:block`} />
                      <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase">Client</p>
                          <p className="font-black text-slate-800 truncate">{b.client?.full_name || b.metadata?.client_name || 'Walk-in'}</p>
                          <p className="text-[9px] text-slate-400">{b.client?.phone || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase">Vehicle</p>
                          <p className="font-black text-slate-800 truncate">{car?.brand} {car?.model}</p>
                          <p className="text-[9px] text-slate-400">{car?.year}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase">Pickup Date</p>
                          <p className="font-bold text-slate-700">{new Date(b.pickup_date).toLocaleDateString('fr-DZ', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase">Return Date</p>
                          <p className="font-bold text-slate-700">{new Date(b.return_date).toLocaleDateString('fr-DZ', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase">Price</p>
                          <p className="font-black text-blue-700">{Number(b.total_price || 0).toLocaleString()} DZD</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase">Deposit</p>
                          <p className="font-black text-slate-600">{Number(b.deposit_amount || 0).toLocaleString()} DZD</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <Badge className={`${(statusColors as any)[b.status] || 'bg-slate-100 text-slate-500'} border text-[10px] py-1 px-2.5 rounded-lg`}>
                          {label}
                        </Badge>
                        <button onClick={async () => {
                          if (confirm('Are you sure you want to cancel this booking?')) {
                            setIsLoading(true)
                            await deleteRentalBookingAction(b.id)
                            loadData()
                          }
                        }} className="p-1.5 hover:bg-red-50 hover:text-red-600 text-slate-400 rounded-lg transition cursor-pointer">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════ DESKTOP DAY PANEL DRAWER ═══════════════ */}
      {isDayPanelOpen && selectedDay && (
        <div className="absolute inset-0 bg-slate-955 bg-slate-950/20 backdrop-blur-xs flex justify-end z-40">
          {/* Clickable backdrop overlay to close drawer */}
          <div 
            onClick={() => setIsDayPanelOpen(false)} 
            className="absolute inset-0 cursor-pointer" 
          />
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col relative z-10 animate-slideInRight border-l border-slate-200/80 rtl:border-l-0 rtl:border-r rtl:animate-slideInLeft">
            <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between shrink-0 text-left rtl:text-right">
              <div>
                <h3 className="text-sm font-black">Daily Schedule</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">{new Date(selectedDay).toLocaleDateString('fr-DZ', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
              </div>
              <button onClick={() => setIsDayPanelOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>

            <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 shrink-0 text-left rtl:text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-wider">Fleet Status This Day</p>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {fleet.length === 0 ? (
                  <span className="text-[8px] text-slate-400">No registered fleet vehicles.</span>
                ) : fleet.map((car, i) => {
                  const color = CAR_COLORS[i % CAR_COLORS.length] || CAR_COLORS[0]
                  const booking = selectedDayBookings.find(b => b.car_id === car.id)
                  return (
                    <div key={car.id} className={`flex-1 min-w-[80px] p-2 rounded-xl border text-center ${booking ? `${color.light} ${color.border}` : 'bg-emerald-50 border-emerald-200'}`}>
                      <p className={`text-[8px] font-black uppercase truncate ${booking ? color.text : 'text-emerald-700'}`}>{car.brand}</p>
                      <p className={`text-[7px] font-semibold ${booking ? color.text : 'text-emerald-600'}`}>{booking ? (booking.status === 'active' ? '🔵 Active' : '🟡 Reserved') : '🟢 Free'}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
              {selectedDayBookings.length === 0 ? (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center">
                  <Calendar className="h-10 w-10 text-slate-200 mb-2" />
                  <p className="text-xs font-bold">No bookings active on this date.</p>
                </div>
              ) : selectedDayBookings.map(b => {
                const car = b.car
                const specs = getCarSpecs(car)
                const colorIdx = fleet.findIndex(c => c.id === b.car_id)
                const color = CAR_COLORS[colorIdx % CAR_COLORS.length] || CAR_COLORS[0]
                
                const isPickupDay = b.pickup_date.split('T')[0] === selectedDay
                const isReturnDay = b.return_date.split('T')[0] === selectedDay

                return (
                  <div key={b.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs text-left rtl:text-right">
                    <div className={`h-1.5 ${color.bg}`} />
                    <div className="p-4 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-full ${b.status === 'active' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                          {b.status === 'active' ? '🔵 Active Rental' : '🟡 Reserved'}
                        </span>
                        {isPickupDay && <span className="text-[9px] font-black px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">▶ PICKUP TODAY</span>}
                        {isReturnDay && <span className="text-[9px] font-black px-2 py-1 bg-rose-100 text-rose-700 rounded-full">◀ RETURN TODAY</span>}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-xl ${color.light} ${color.border} border flex items-center justify-center`}>
                          <User className={`h-4 w-4 ${color.text}`} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-800">{b.client?.full_name || b.metadata?.client_name || 'Walk-in Client'}</p>
                          <p className="text-[10px] text-slate-400 font-semibold">{b.client?.phone || 'N/A'}</p>
                        </div>
                      </div>

                      <div className={`${color.light} ${color.border} border rounded-xl px-3 py-2 flex items-center gap-2`}>
                        <Car className={`h-4 w-4 ${color.text}`} />
                        <div>
                          <p className={`text-[11px] font-black ${color.text}`}>{car?.brand} {car?.model} ({car?.year})</p>
                          <p className="text-[9px] text-slate-500 font-mono">{specs.registration_number}</p>
                        </div>
                        <span className={`ml-auto text-[9px] font-black ${color.text} ${color.light} px-2 py-0.5 rounded-lg`}>{Number(car?.daily_rate).toLocaleString()} DZD/d</span>
                      </div>

                      <div className="flex justify-between items-center font-bold text-xs border-t border-slate-100 pt-3">
                        <div>
                          <p className="text-[8px] text-slate-400 uppercase font-black">Total Price</p>
                          <p className="text-sm font-black text-slate-900">{Number(b.total_price || 0).toLocaleString()} DZD</p>
                        </div>
                        <div>
                          {b.status === 'confirmed' && (
                            <Button onClick={() => { setActiveBooking(b); setPickupKm(String(specs.mileage)); setIsPickupWorkflowOpen(true); setIsDayPanelOpen(false) }} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black h-8 cursor-pointer">Pickup ▶</Button>
                          )}
                          {b.status === 'active' && (
                            <Button onClick={() => { setActiveBooking(b); setReturnKm(String(specs.mileage + 120)); setIsReturnWorkflowOpen(true); setIsDayPanelOpen(false) }} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black h-8 cursor-pointer">Return ◀</Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="px-4 pb-4 shrink-0">
              <Button
                onClick={() => { setIsNewBookingOpen(true); setIsDayPanelOpen(false); setNewPickupDate(selectedDay) }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black h-11 gap-2 cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Book a Car for {new Date(selectedDay).toLocaleDateString('fr-DZ', { day: '2-digit', month: 'short' })}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ PICK-UP WORKFLOW MODAL ═══════════════ */}
      {isPickupWorkflowOpen && activeBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-3xl shadow-2xl border w-full max-w-md overflow-hidden text-left rtl:text-right flex flex-col max-h-[90vh]">
            <div className="bg-blue-900 px-6 py-5 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-black flex items-center gap-1.5"><Key className="h-4 w-4 text-blue-300" /> Execute Pick-up</h3>
                <p className="text-[10px] text-blue-200">Inspect and record telemetry before handing over keys.</p>
              </div>
              <button onClick={() => setIsPickupWorkflowOpen(false)} className="text-blue-200 hover:text-white cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleExecutePickup} className="p-6 space-y-4 text-slate-700 text-xs overflow-y-auto scrollbar-thin">
              <div className="space-y-1.5">
                <Label className="font-bold text-[10px] text-slate-400 uppercase">Handover Mileage (KM) *</Label>
                <Input required type="number" value={pickupKm} onChange={e => setPickupKm(e.target.value)} className="rounded-xl border-slate-200 text-xs font-bold" />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold uppercase"><Label className="text-slate-400">Handover Fuel level</Label><span className="text-blue-600 font-black">{pickupFuel}%</span></div>
                <input type="range" min={10} max={100} step={5} value={pickupFuel} onChange={e => setPickupFuel(Number(e.target.value))} className="w-full accent-blue-600 h-1.5 cursor-pointer mt-2" />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-[10px] text-slate-400 uppercase">Safety & Quality Checklist</Label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 border p-3 rounded-xl text-[10px] font-bold">
                  {['Spare Tire', 'Warning Triangle', 'Safety Vest', 'Jack & Tools', 'Interior Cleaned', 'Exterior Inspected'].map(item => (
                    <label key={item} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={pickupChecks.includes(item)} onChange={() => setPickupChecks(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item])} className="rounded w-4 h-4 accent-blue-600" />
                      {item}
                    </label>
                  ))}
                </div>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex justify-between font-black text-blue-700 text-[11px]">
                <span>Security Deposit required:</span>
                <span>{Number(activeBooking.deposit_amount || 40000).toLocaleString()} DZD</span>
              </div>
              <Textarea value={pickupNotes} onChange={e => setPickupNotes(e.target.value)} placeholder="Condition & Inspection notes..." className="rounded-xl border-slate-200 min-h-[60px] text-xs" />
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-black text-xs cursor-pointer">Handover Keys & Active Rental</Button>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════ RETURN WORKFLOW MODAL ═══════════════ */}
      {isReturnWorkflowOpen && activeBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-3xl shadow-2xl border w-full max-w-xl overflow-hidden text-left rtl:text-right flex flex-col max-h-[90vh]">
            <div className="bg-emerald-950 px-6 py-5 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-black flex items-center gap-1.5"><ClipboardCheck className="h-4 w-4 text-emerald-400" /> Inspection & Return Settlement</h3>
                <p className="text-[10px] text-slate-400">Assess damage, calculate penalties, and complete transaction.</p>
              </div>
              <button onClick={() => setIsReturnWorkflowOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleExecuteReturn} className="p-6 space-y-4 text-xs text-slate-700 overflow-y-auto scrollbar-thin">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="font-bold text-[10px] text-slate-400 uppercase">Return Mileage (KM) *</Label>
                  <Input required type="number" value={returnKm} onChange={e => setReturnKm(e.target.value)} className="rounded-xl border-slate-200 font-bold text-emerald-700" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold uppercase"><Label className="text-slate-400">Return Fuel</Label><span className="text-emerald-600 font-black">{returnFuel}%</span></div>
                  <input type="range" min={10} max={100} step={5} value={returnFuel} onChange={e => setReturnFuel(Number(e.target.value))} className="w-full accent-emerald-600 h-1.5 cursor-pointer mt-2" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-[10px] text-slate-400 uppercase block">Interactive Body Damage Log Dashboard</Label>
                <div className="bg-slate-900 border p-4 rounded-2xl text-center space-y-3">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Select damaged components</span>
                  <div className="grid grid-cols-3 gap-2 text-[9px] font-black text-slate-300">
                    {['Front Bumper', 'Windshield', 'Rear Bumper', 'Left Door', 'Right Door', 'Roof', 'Left Fender', 'Right Fender', 'Hood'].map(part => {
                      const isSelected = selectedDamageParts.includes(part)
                      return (
                        <button key={part} type="button" onClick={() => setSelectedDamageParts(prev => prev.includes(part) ? prev.filter(p => p !== part) : [...prev, part])}
                          className={`p-2 rounded-lg border transition cursor-pointer ${isSelected ? 'bg-red-600 text-white border-red-500' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}>
                          {part}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5"><Label className="font-bold text-[10px] text-slate-400 uppercase">Damage Fees</Label><Input type="number" value={damageCharges} onChange={e => setDamageCharges(Number(e.target.value))} className="rounded-xl border-slate-200 font-bold text-red-600" /></div>
                <div className="space-y-1.5"><Label className="font-bold text-[10px] text-slate-400 uppercase">Cleaning Fee</Label><Input type="number" value={cleaningCharges} onChange={e => setCleaningCharges(Number(e.target.value))} className="rounded-xl border-slate-200" /></div>
                <div className="space-y-1.5"><Label className="font-bold text-[10px] text-slate-400 uppercase">Late Penalty</Label><Input type="number" value={lateCharges} onChange={e => setLateCharges(Number(e.target.value))} className="rounded-xl border-slate-200" /></div>
              </div>

              {returnKm && (
                <div className="p-4 bg-slate-50 border rounded-2xl space-y-2 font-bold text-[11px] text-slate-600">
                  <span className="text-[9px] font-black text-emerald-800 uppercase tracking-widest block">Settlement Bill Summary</span>
                  {[
                    ['Base Rental Cost', `${Number(activeBooking.total_price || 0).toLocaleString()} DZD`],
                    ['Extra KM Penalty', `${calculateExtraKm(activeBooking, Number(returnKm)).toLocaleString()} DZD`],
                    ['Fuel Deficit Penalty', `${calculateFuelPenalty(activeBooking, returnFuel).toLocaleString()} DZD`],
                    ['Logged Repair + Cleaning + Late', `${(damageCharges + cleaningCharges + lateCharges).toLocaleString()} DZD`],
                    ['Security Deposit (Retained/Charged)', `+${Number(activeBooking.deposit_amount || 40000).toLocaleString()} DZD`],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between"><span>{label}:</span><span>{val}</span></div>
                  ))}
                  <div className="pt-2 border-t flex justify-between font-black text-slate-900 text-xs">
                    <span>Deposit Refund Settlement:</span>
                    <span className="text-blue-600">
                      {Math.max(0, Number(activeBooking.deposit_amount || 40000) - calculateExtraKm(activeBooking, Number(returnKm)) - calculateFuelPenalty(activeBooking, returnFuel) - damageCharges - cleaningCharges - lateCharges).toLocaleString()} DZD
                    </span>
                  </div>
                </div>
              )}
              <Textarea value={damageNotes} onChange={e => setDamageNotes(e.target.value)} placeholder="Specific remarks on mechanical/body inspection..." className="rounded-xl border-slate-200 text-xs mt-2" />
              <Button type="submit" className="w-full bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl py-3 font-black text-xs cursor-pointer">Verify inspection & Complete Rental</Button>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════ NEW BOOKING MODAL ═══════════════ */}
      {isNewBookingOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-3xl shadow-2xl border w-full max-w-md overflow-hidden text-left rtl:text-right">
            <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
              <h3 className="text-sm font-black flex items-center gap-1.5"><Plus className="h-4 w-4" /> Book New Rental Contract</h3>
              <button onClick={() => setIsNewBookingOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleCreateBooking} className="p-6 space-y-4 text-xs text-slate-700">
              <div className="space-y-1.5">
                <Label className="font-bold text-[10px] text-slate-400 uppercase">Select Registered Client</Label>
                <select value={newClientId} onChange={e => { setNewClientId(e.target.value); if (e.target.value) { setNewWalkInName(''); setNewWalkInPhone('') } }} className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white text-slate-700">
                  <option value="">-- Or register as Walk-In client below --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.full_name} ({c.phone || 'No phone'})</option>
                  ))}
                </select>
              </div>

              {!newClientId && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                  <div className="col-span-2 text-[9px] font-black text-slate-400 uppercase">Walk-in Client Details</div>
                  <div className="space-y-1.5 col-span-2"><Label className="font-bold text-[10px] text-slate-400 uppercase">Full Name *</Label><Input value={newWalkInName} onChange={e => setNewWalkInName(e.target.value)} placeholder="Karim Belkadi" className="rounded-xl border-slate-200" /></div>
                  <div className="space-y-1.5 col-span-2"><Label className="font-bold text-[10px] text-slate-400 uppercase">Phone *</Label><Input value={newWalkInPhone} onChange={e => setNewWalkInPhone(e.target.value)} placeholder="+213 550..." className="rounded-xl border-slate-200" /></div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="font-bold text-[10px] text-slate-400 uppercase">Pickup Date</Label><Input type="date" value={newPickupDate} onChange={e => setNewPickupDate(e.target.value)} className="rounded-xl border-slate-200" /></div>
                <div className="space-y-1.5"><Label className="font-bold text-[10px] text-slate-400 uppercase">Return Date</Label><Input type="date" value={newReturnDate} onChange={e => setNewReturnDate(e.target.value)} className="rounded-xl border-slate-200" /></div>
              </div>

              <div className="space-y-1.5">
                <Label className="font-bold text-[10px] text-slate-400 uppercase">Select Available Vehicle *</Label>
                <select required value={newCarId} onChange={e => setNewCarId(e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white text-slate-700">
                  <option value="">-- Choose a Vehicle --</option>
                  {fleet.filter(c => c.status === 'available').map(c => (
                    <option key={c.id} value={c.id}>{c.brand} {c.model} — {Number(c.daily_rate).toLocaleString()} DZD/day</option>
                  ))}
                </select>
              </div>

              {newCarId && newPickupDate && newReturnDate && (() => {
                const car = fleet.find(c => c.id === newCarId)
                const start = new Date(newPickupDate)
                const end = new Date(newReturnDate)
                const days = Math.ceil(Math.abs(end.getTime() - start.getTime()) / 86400000) || 1
                return car ? (
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-[11px] font-bold text-blue-800 flex justify-between">
                    <span>{days} days × {Number(car.daily_rate).toLocaleString()} DZD/day</span>
                    <span className="font-black">{(days * Number(car.daily_rate)).toLocaleString()} DZD</span>
                  </div>
                ) : null
              })()}

              <Textarea value={newBookingNotes} onChange={e => setNewBookingNotes(e.target.value)} placeholder="Additional booking notes..." className="rounded-xl border-slate-200 text-xs" />
              <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3 font-black text-xs cursor-pointer">Confirm & Book Contract</Button>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════ NEW / EDIT RENTAL CAR MODAL ═══════════════ */}
      {isNewCarModalOpen && (
        <div className="fixed inset-0 bg-slate-955/70 backdrop-blur-xs flex items-center justify-center z-[60] p-4 animate-fadeIn" onClick={() => setIsNewCarModalOpen(false)}>
          <div className="bg-white rounded-[32px] shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden text-left rtl:text-right flex flex-col max-h-[90vh] animate-scaleIn" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 px-6 py-5 text-white flex items-center justify-between shrink-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 blur-2xl rounded-full pointer-events-none" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="h-8.5 w-8.5 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0">
                  <Car className="h-4.5 w-4.5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight">{editingCar ? 'Edit Fleet Vehicle' : 'Add Fleet Vehicle'}</h3>
                  <p className="text-[9px] text-slate-400 font-extrabold tracking-wider uppercase mt-0.5">Fleet Specifications</p>
                </div>
              </div>
              <button onClick={() => setIsNewCarModalOpen(false)} className="h-8.5 w-8.5 rounded-xl hover:bg-white/10 flex items-center justify-center cursor-pointer text-slate-400 hover:text-white transition relative z-10">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Scrollable Form */}
            <form onSubmit={handleSaveCar} className="p-6 space-y-5 text-xs text-slate-700 overflow-y-auto scrollbar-thin">
              {/* SECTION 1: CATEGORY */}
              <div className="space-y-1.5 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <Label className="font-black text-[9px] text-slate-400 uppercase tracking-widest block mb-1">Vehicle Purpose & Category *</Label>
                <select 
                  value={carType} 
                  onChange={e => setCarType(e.target.value as any)} 
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white text-slate-700 font-bold transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 cursor-pointer"
                >
                  <option value="rental">Location (Rental Fleet)</option>
                  <option value="sell">À Vendre (Sales Inventory)</option>
                  <option value="sur_command">Sur Commande (On Order)</option>
                </select>
              </div>

              {/* SECTION 2: SPECS */}
              <div className="space-y-3.5">
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5">📋 Vehicle Specifications</h4>
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <Label className="font-extrabold text-[9px] text-slate-400 uppercase tracking-wider">Brand *</Label>
                    <Input required value={carBrand} onChange={e => setCarBrand(e.target.value)} placeholder="Renault" className="rounded-xl border-slate-200 font-bold text-xs h-10 focus:border-blue-550 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                  </div>
                  <div className="space-y-1">
                    <Label className="font-extrabold text-[9px] text-slate-400 uppercase tracking-wider">Model *</Label>
                    <Input required value={carModel} onChange={e => setCarModel(e.target.value)} placeholder="Clio 5" className="rounded-xl border-slate-200 font-bold text-xs h-10 focus:border-blue-550 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                  </div>
                  <div className="space-y-1">
                    <Label className="font-extrabold text-[9px] text-slate-400 uppercase tracking-wider">Year *</Label>
                    <Input type="number" required value={carYear} onChange={e => setCarYear(Number(e.target.value))} className="rounded-xl border-slate-200 font-bold text-xs h-10 focus:border-blue-550 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                  </div>
                  <div className="space-y-1">
                    <Label className="font-extrabold text-[9px] text-slate-400 uppercase tracking-wider">Color *</Label>
                    <Input required value={carColor} onChange={e => setCarColor(e.target.value)} placeholder="Blanc" className="rounded-xl border-slate-200 font-bold text-xs h-10 focus:border-blue-550 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <Label className="font-extrabold text-[9px] text-slate-400 uppercase tracking-wider">Transmission</Label>
                    <select value={carTransmission} onChange={e => setCarTransmission(e.target.value as any)} className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white text-slate-700 font-bold focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer h-10">
                      <option value="manual">Manual</option>
                      <option value="automatic">Automatic</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="font-extrabold text-[9px] text-slate-400 uppercase tracking-wider">Fuel Type</Label>
                    <select value={carFuelType} onChange={e => setCarFuelType(e.target.value as any)} className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white text-slate-700 font-bold focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer h-10">
                      <option value="petrol">Petrol (Sans Plomb)</option>
                      <option value="diesel">Diesel (Gasoil)</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="electric">Electric</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 3: TARIFS & METRICS */}
              <div className="space-y-3.5">
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5">💰 Pricing & Telemetry</h4>
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <Label className="font-extrabold text-[9px] text-slate-400 uppercase tracking-wider">Daily Rate (DZD) *</Label>
                    <Input type="number" required value={carDailyRate} onChange={e => setCarDailyRate(Number(e.target.value))} className="rounded-xl border-slate-200 font-bold text-xs h-10 text-indigo-650 focus:border-blue-550 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                  </div>
                  <div className="space-y-1">
                    <Label className="font-extrabold text-[9px] text-slate-400 uppercase tracking-wider">Plate Number *</Label>
                    <Input required value={carRegNum} onChange={e => setCarRegNum(e.target.value)} placeholder="12493-122-16" className="rounded-xl border-slate-200 font-mono font-black text-xs h-10 uppercase focus:border-blue-550 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                  </div>
                  <div className="space-y-1">
                    <Label className="font-extrabold text-[9px] text-slate-400 uppercase tracking-wider">Current Mileage (KM)</Label>
                    <Input type="number" value={carMileage} onChange={e => setCarMileage(Number(e.target.value))} className="rounded-xl border-slate-200 font-bold text-xs h-10 focus:border-blue-550 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                  </div>
                  <div className="space-y-1">
                    <Label className="font-extrabold text-[9px] text-slate-400 uppercase tracking-wider">Security Deposit (DZD)</Label>
                    <Input type="number" value={carSecurityDeposit} onChange={e => setCarSecurityDeposit(Number(e.target.value))} className="rounded-xl border-slate-200 font-bold text-xs h-10 focus:border-blue-550 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                  </div>
                </div>
              </div>

              {/* SECTION 4: CONDITION REMARKS */}
              <div className="space-y-1.5">
                <Label className="font-black text-[9px] text-slate-400 uppercase tracking-widest block mb-0.5">General Condition Remarks</Label>
                <Textarea value={carConditionNotes} onChange={e => setCarConditionNotes(e.target.value)} placeholder="Any specific maintenance remarks..." className="rounded-xl border-slate-200 text-xs min-h-[70px] p-3 focus:border-blue-550 focus:ring-4 focus:ring-blue-500/10 transition-all" />
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-750 hover:from-blue-700 hover:to-indigo-850 text-white rounded-2xl py-3.5 font-black text-xs cursor-pointer shadow-lg shadow-indigo-500/15 hover:shadow-indigo-500/25 transition-all duration-200 active:scale-98">
                  {editingCar ? 'Update Specifications' : 'Save & Add to Fleet'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
