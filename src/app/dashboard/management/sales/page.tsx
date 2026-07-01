'use client'

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  Car, Plus, Search, Trash2, CheckCircle2, XCircle, Clock,
  User, FileText, TrendingUp, Edit3, Info, X, ShieldCheck, Tag, Eye, ChevronRight,
  ChevronLeft, Award, RefreshCw, Upload, MapPin, AlertTriangle,
  Wrench, ToggleLeft, Layers, BarChart3, Download, FileUp, CheckSquare,
  Square, Printer, DollarSign, Package, Calendar, ChevronDown, ChevronUp,
  ExternalLink, PlusCircle, Camera, FileImage, Hash, Zap, Play, Copy
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { addDays, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval, parseISO, differenceInDays } from 'date-fns'
import { useLanguage } from '@/lib/contexts/LanguageContext'

// ─── Types ────────────────────────────────────────────────────────────────────
interface CarSalesItem {
  id: string
  stock_number: string
  vin: string
  registration_number: string
  brand: string
  model: string
  year: number
  variant: string
  version: string
  condition: 'new' | 'used' | 'certified_pre_owned' | 'demo'
  mileage: number
  previous_owners: number
  origin_country: string
  import_type: string
  car_type?: 'sell' | 'sur_command' | 'rental'
  purchase_price: number
  selling_price: number
  negotiable: boolean
  discount_type: string
  discount_amount: number
  discount_percent: number
  final_price: number
  margin_percent: number
  fuel_type: string
  transmission: string
  engine_size: number
  horsepower: number
  torque_nm: number
  cylinders: number
  drivetrain: string
  color_exterior: string
  color_interior: string
  doors: number
  seats: number
  body_type: string
  features: string[]
  images: string[]
  wheels_size: number
  tires_brand: string
  tires_condition: string
  spare_tire_included: boolean
  jack_and_tools: boolean
  registration_card_url: string
  technical_inspection_url: string
  insurance_document_url: string
  customs_clearance_url: string
  purchase_invoice_url: string
  warranty_months: number
  warranty_km: number
  warranty_type: string
  warranty_details: string
  status: 'available' | 'reserved' | 'sold' | 'in_preparation' | 'in_transit' | 'maintenance'
  showroom_location: string
  parking_spot: string
  cover_image_url: string
  video_url: string
  video_360_url: string
  quantity: number
  rental_daily_rate: number
  tracking_number: string
  container_id: string
  owner_type?: string
  commission_percentage?: number
  commission_flat_fee?: number
  owner_target_payout?: number
  owner_client_id?: string
  created_at?: string
  containers?: { id: string; container_number: string; status: string; estimated_arrival_date: string }
  show_on_website?: boolean
}

interface VehicleHistoryItem {
  id: string
  event_type: string
  title: string
  description?: string
  old_value?: string
  new_value?: string
  created_at: string
}

interface RentalBooking {
  id: string
  client_name: string
  client_phone: string
  start_date: string
  end_date: string
  daily_rate: number
  total_amount: number
  status: string
  notes?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600'

const fmt = (n: number | null | undefined) =>
  n != null && !isNaN(n) && n > 0 ? n.toLocaleString('fr-DZ') : null

const statusConfig: Record<string, { label: string; labelKey: string; dot: string; bg: string; text: string }> = {
  available:     { label: 'Available',    labelKey: 'sales.status_available', dot: 'bg-emerald-500', bg: 'bg-emerald-50  border-emerald-200', text: 'text-emerald-700' },
  reserved:      { label: 'Reserved',     labelKey: 'sales.status_reserved',  dot: 'bg-amber-400',   bg: 'bg-amber-50   border-amber-200',   text: 'text-amber-700' },
  sold:          { label: 'Sold',         labelKey: 'sales.status_sold',      dot: 'bg-red-500',     bg: 'bg-red-50     border-red-200',     text: 'text-red-700' },
  in_preparation:{ label: 'Preparation', labelKey: 'sales.status_prep',      dot: 'bg-blue-400',    bg: 'bg-blue-50    border-blue-200',    text: 'text-blue-700' },
  in_transit:    { label: 'In Transit',   labelKey: 'sales.status_transit',   dot: 'bg-purple-500',  bg: 'bg-purple-50  border-purple-200',  text: 'text-purple-700' },
  maintenance:   { label: 'Maintenance',  labelKey: 'sales.status_maintenance',dot: 'bg-orange-500',  bg: 'bg-orange-50  border-orange-200',  text: 'text-orange-700' },
}

const historyIcons: Record<string, string> = {
  status_change: '🔄', price_change: '💰', sold: '✅', rented: '🚗',
  serviced: '🔧', note: '📝', imported: '📦', document_added: '📄'
}

const DEFAULT_FORM = {
  car_type: 'sell' as 'sell' | 'sur_command' | 'rental',
  owner_type: 'agency' as 'agency' | 'customer',
  commission_percentage: 3, commission_flat_fee: 0, owner_target_payout: 0, owner_client_id: '',
  stock_number: '', vin: '', registration_number: '', brand: '', model: '', year: 2026,
  variant: '', version: '', condition: 'new' as any, mileage: 0, previous_owners: 0,
  origin_country: '', import_type: 'local' as any, purchase_price: 0, selling_price: 0,
  negotiable: true, discount_type: 'none' as any, discount_amount: 0, discount_percent: 0,
  fuel_type: 'petrol' as any, transmission: 'automatic' as any, engine_size: 1.6,
  horsepower: 150, torque_nm: 250, cylinders: 4, drivetrain: 'fwd' as any,
  color_exterior: '', color_interior: '', doors: 5, seats: 5, body_type: 'suv' as any,
  features: [] as string[], wheels_size: 18, tires_brand: '', tires_condition: 'new' as any,
  spare_tire_included: true, jack_and_tools: true,
  cover_image_url: PLACEHOLDER_IMG, images: [] as string[], video_url: '', video_360_url: '',
  warranty_months: 12, warranty_km: 100000, warranty_type: 'dealer' as any, warranty_details: '',
  showroom_location: 'Cheraga Showroom, Algiers', parking_spot: '',
  quantity: 1, rental_daily_rate: 0, rental_weekly_rate: 0, rental_monthly_rate: 0, security_deposit: 0, tracking_number: '', container_id: '', status: 'available' as any,
  show_on_website: true,
}

// ─── CSV Export Helper ────────────────────────────────────────────────────────
function exportToCSV(cars: CarSalesItem[], filename = 'inventory') {
  const headers = ['Stock #', 'Brand', 'Model', 'Year', 'Type', 'Status', 'Condition', 'Fuel', 'Transmission', 'Mileage', 'Selling Price', 'Final Price', 'Margin %', 'VIN', 'Color Ext', 'Quantity']
  const rows = cars.map(c => [
    c.stock_number, c.brand, c.model, c.year, c.car_type, c.status, c.condition,
    c.fuel_type, c.transmission, c.mileage, c.selling_price, c.final_price,
    c.margin_percent, c.vin, c.color_exterior, c.quantity
  ])
  const csvContent = [headers, ...rows].map(row => row.map(v => `"${v ?? ''}"`).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
}

// ─── VIN Decoder ─────────────────────────────────────────────────────────────
function decodeVIN(vin: string): { year?: number; manufacturer?: string; country?: string } {
  if (!vin || vin.length < 10) return {}
  const wmi = vin.slice(0, 3).toUpperCase()
  const yearCode = vin[9].toUpperCase()
  const yearMap: Record<string, number> = {
    'A': 1980, 'B': 1981, 'C': 1982, 'D': 1983, 'E': 1984, 'F': 1985, 'G': 1986, 'H': 1987,
    'J': 1988, 'K': 1989, 'L': 1990, 'M': 1991, 'N': 1992, 'P': 1993, 'R': 1994, 'S': 1995,
    'T': 1996, 'V': 1997, 'W': 1998, 'X': 1999, 'Y': 2000, '1': 2001, '2': 2002, '3': 2003,
    '4': 2004, '5': 2005, '6': 2006, '7': 2007, '8': 2008, '9': 2009, 'A2': 2010, 'B2': 2011,
    'C2': 2012, 'D2': 2013, 'E2': 2014, 'F2': 2015, 'G2': 2016, 'H2': 2017, 'J2': 2018,
    'K2': 2019, 'L2': 2020, 'M2': 2021, 'N2': 2022, 'P2': 2023, 'R2': 2024, 'S2': 2025, 'T2': 2026
  }
  const manufacturers: Record<string, string> = {
    'WDB': 'Mercedes-Benz', 'WBA': 'BMW', 'WAU': 'Audi', 'WVW': 'Volkswagen', 'WP0': 'Porsche',
    'VF1': 'Renault', 'VF3': 'Peugeot', 'VF7': 'Citroën', 'ZFF': 'Ferrari', 'ZAR': 'Alfa Romeo',
    'KMH': 'Hyundai', 'KNA': 'Kia', 'JHM': 'Honda', 'JTD': 'Toyota', 'JN1': 'Nissan',
    '1HG': 'Honda', '1G1': 'Chevrolet', '2T1': 'Toyota', 'SCC': 'Lotus', 'SAL': 'Land Rover',
    'SAJ': 'Jaguar', 'VSS': 'SEAT', 'VF6': 'Citroën', 'TRU': 'Audi',
  }
  const countries: Record<string, string> = {
    'W': 'Germany', 'V': 'France', 'Z': 'Italy', 'K': 'South Korea', 'J': 'Japan',
    'S': 'UK', '1': 'USA', '2': 'Canada', 'Y': 'Sweden', 'T': 'Switzerland'
  }
  return {
    year: yearMap[yearCode] || yearMap[yearCode + '2'],
    manufacturer: manufacturers[wmi] || manufacturers[wmi.slice(0, 2)],
    country: countries[vin[0]] || undefined
  }
}

// ─── CSV Template ─────────────────────────────────────────────────────────────
function downloadCSVTemplate() {
  const headers = ['brand', 'model', 'year', 'car_type', 'fuel_type', 'transmission', 'body_type', 'condition', 'mileage', 'selling_price', 'purchase_price', 'quantity', 'color_exterior', 'vin', 'tracking_number', 'cover_image_url']
  const example = ['Hyundai', 'Tucson', '2026', 'sell', 'petrol', 'automatic', 'suv', 'new', '0', '5500000', '4800000', '1', 'Pearl White', '', '', '']
  const csvContent = [headers, example].map(row => row.join(',')).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = 'car_import_template.csv'
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
}

// ─── Parse CSV ────────────────────────────────────────────────────────────────
function parseCSV(text: string): any[] {
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
    const obj: any = {}
    headers.forEach((h, i) => { obj[h] = values[i] || '' })
    // Type coercions
    if (obj.year) obj.year = parseInt(obj.year) || 2026
    if (obj.mileage) obj.mileage = parseInt(obj.mileage) || 0
    if (obj.selling_price) obj.selling_price = parseFloat(obj.selling_price) || 0
    if (obj.purchase_price) obj.purchase_price = parseFloat(obj.purchase_price) || 0
    if (obj.quantity) obj.quantity = parseInt(obj.quantity) || 1
    if (!obj.car_type) obj.car_type = 'sell'
    if (!obj.condition) obj.condition = 'new'
    if (!obj.status) obj.status = 'available'
    if (!obj.cover_image_url) obj.cover_image_url = PLACEHOLDER_IMG
    obj.features = []
    obj.images = []
    obj.final_price = obj.selling_price
    return obj
  })
}

// ─── Print Window Sticker ─────────────────────────────────────────────────────
function printWindowSticker(car: CarSalesItem) {
  const price = car.final_price || car.selling_price || 0
  const features = Array.isArray(car.features) ? car.features : []
  const win = window.open('', '_blank', 'width=850,height=1100')
  if (!win) return
  win.document.write(`
    <!DOCTYPE html><html><head>
    <title>Window Sticker — ${car.brand} ${car.model}</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; font-family: Arial, sans-serif; }
      body { width:794px; padding:30px; background:#fff; color:#111; }
      .header { background:#1e293b; color:white; padding:20px 24px; border-radius:8px; margin-bottom:20px; }
      .header h1 { font-size:22px; font-weight:900; }
      .header p { font-size:12px; color:#94a3b8; margin-top:4px; }
      .grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px; }
      .section { border:1px solid #e2e8f0; border-radius:8px; padding:16px; }
      .section h2 { font-size:10px; font-weight:900; text-transform:uppercase; color:#64748b; letter-spacing:0.1em; margin-bottom:12px; }
      .row { display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px solid #f1f5f9; font-size:11px; }
      .row:last-child { border:none; }
      .row .label { color:#64748b; }
      .row .val { font-weight:700; }
      .price-box { background:#1e293b; color:white; border-radius:8px; padding:20px; text-align:center; margin-bottom:16px; }
      .price-box .label { font-size:10px; color:#94a3b8; text-transform:uppercase; letter-spacing:0.1em; }
      .price-box .amount { font-size:28px; font-weight:900; color:#ef4444; }
      .features { display:flex; flex-wrap:wrap; gap:6px; }
      .feat { background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:4px 10px; font-size:10px; font-weight:600; }
      .warranty { background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:12px 16px; margin-bottom:16px; }
      .footer { text-align:center; font-size:9px; color:#94a3b8; border-top:1px solid #e2e8f0; padding-top:12px; }
      .badge { display:inline-block; background:#dc2626; color:white; border-radius:4px; padding:2px 8px; font-size:10px; font-weight:900; text-transform:uppercase; }
      img { width:100%; height:200px; object-fit:cover; border-radius:8px; margin-bottom:16px; }
      @media print { body { padding:0; } }
    </style>
    </head><body>
    <div class="header">
      <span class="badge">${car.condition === 'certified_pre_owned' ? 'CPO' : (car.condition || 'New')}</span>
      <h1>${car.brand} ${car.model} ${car.year}</h1>
      <p>Stock: ${car.stock_number} &nbsp;|&nbsp; VIN: ${car.vin || 'N/A'} &nbsp;|&nbsp; ${car.variant || ''} ${car.version || ''}</p>
    </div>
    ${car.cover_image_url ? `<img src="${car.cover_image_url}" alt="${car.model}" onerror="this.style.display='none'" />` : ''}
    <div class="price-box">
      <div class="label">Asking Price</div>
      <div class="amount">${price > 0 ? price.toLocaleString('fr-DZ') + ' DZD' : 'Prix sur demande'}</div>
      ${car.negotiable ? '<div style="font-size:11px;color:#94a3b8;margin-top:4px">✓ Négociable</div>' : ''}
    </div>
    <div class="grid">
      <div class="section">
        <h2>Spécifications</h2>
        <div class="row"><span class="label">Carburant</span><span class="val">${car.fuel_type || '—'}</span></div>
        <div class="row"><span class="label">Boîte</span><span class="val">${car.transmission || '—'}</span></div>
        <div class="row"><span class="label">Moteur</span><span class="val">${car.engine_size ? car.engine_size + 'L' : '—'} / ${car.cylinders || '—'} Cyl</span></div>
        <div class="row"><span class="label">Puissance</span><span class="val">${car.horsepower || '—'} HP / ${car.torque_nm || '—'} Nm</span></div>
        <div class="row"><span class="label">Transmission</span><span class="val">${(car.drivetrain || '').toUpperCase()}</span></div>
        <div class="row"><span class="label">Carrosserie</span><span class="val">${car.body_type || '—'}</span></div>
        <div class="row"><span class="label">Portes / Places</span><span class="val">${car.doors || '—'} / ${car.seats || '—'}</span></div>
      </div>
      <div class="section">
        <h2>Identification</h2>
        <div class="row"><span class="label">Kilométrage</span><span class="val">${car.mileage ? car.mileage.toLocaleString() + ' km' : 'Neuf'}</span></div>
        <div class="row"><span class="label">Propriétaires</span><span class="val">${car.previous_owners || 0}</span></div>
        <div class="row"><span class="label">Couleur Ext.</span><span class="val">${car.color_exterior || '—'}</span></div>
        <div class="row"><span class="label">Couleur Int.</span><span class="val">${car.color_interior || '—'}</span></div>
        <div class="row"><span class="label">Origine</span><span class="val">${car.origin_country || '—'}</span></div>
        <div class="row"><span class="label">Showroom</span><span class="val">${car.showroom_location || '—'}</span></div>
        <div class="row"><span class="label">Parking</span><span class="val">${car.parking_spot || '—'}</span></div>
      </div>
    </div>
    ${features.length > 0 ? `
    <div class="section" style="margin-bottom:16px">
      <h2>Équipements Premium</h2>
      <div class="features">${features.map(f => `<span class="feat">✓ ${f}</span>`).join('')}</div>
    </div>` : ''}
    <div class="warranty">
      <strong>🛡️ Garantie:</strong> ${car.warranty_type === 'none' ? 'Vendu sans garantie' : `${car.warranty_months} mois / ${(car.warranty_km || 0).toLocaleString()} km — ${car.warranty_type}`}
    </div>
    <div class="footer">
      Document généré le ${new Date().toLocaleDateString('fr-DZ')} — ${car.showroom_location || 'Showroom'}
    </div>
    </body></html>
  `)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 500)
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CarSalesPage() {
  const { t } = useLanguage()
  const [cars, setCars] = useState<CarSalesItem[]>([])
  const [containers, setContainers] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [savingCar, setSavingCar] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // ── modals & panels ──
  const [activeCarDetail, setActiveCarDetail] = useState<CarSalesItem | null>(null)
  const [isAddCarOpen, setIsAddCarOpen] = useState(false)
  const [editingCarId, setEditingCarId] = useState<string | null>(null)
  const [wizardStep, setWizardStep] = useState(1)
  const [activeDrawerTab, setActiveDrawerTab] = useState('specs')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [statusChangeCarId, setStatusChangeCarId] = useState<string | null>(null)
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false)
  const [isStatsOpen, setIsStatsOpen] = useState(true)

  // ── bulk selection ──
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState('available')

  // ── vehicle history / rental ──
  const [vehicleHistory, setVehicleHistory] = useState<VehicleHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [rentalBookings, setRentalBookings] = useState<RentalBooking[]>([])
  const [rentalLoading, setRentalLoading] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [isAddBookingOpen, setIsAddBookingOpen] = useState(false)
  const [newBooking, setNewBooking] = useState({ client_name: '', client_phone: '', start_date: '', end_date: '', notes: '' })

  // ── bulk import ──
  const [csvPreview, setCsvPreview] = useState<any[]>([])
  const [csvImporting, setCsvImporting] = useState(false)
  const [csvError, setCsvError] = useState<string | null>(null)

  // ── filters ──
  const [search, setSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState('all')
  const [priceFilter, setPriceFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState('all')
  const [fuelFilter, setFuelFilter] = useState('all')
  const [conditionFilter, setConditionFilter] = useState('all')
  const [carTypeFilter, setCarTypeFilter] = useState<'all' | 'sell' | 'sur_command' | 'rental'>('all')

  // ── finance calc ──
  const [calcDownPaymentPercent, setCalcDownPaymentPercent] = useState(30)
  const [calcMonths, setCalcMonths] = useState(60)

  // ── 360 ──
  const [is360Active, setIs360Active] = useState(false)
  const [simulatedAngle, setSimulatedAngle] = useState(0)

  // ── image upload ──
  const [uploadingImage, setUploadingImage] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const docInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // ── VIN ──
  const [vinDecodeResult, setVinDecodeResult] = useState<{ year?: number; manufacturer?: string; country?: string } | null>(null)

  // ── add history note ──
  const [historyNoteText, setHistoryNoteText] = useState('')
  const [addingNote, setAddingNote] = useState(false)

  // ── form ──
  const [formState, setFormState] = useState({ ...DEFAULT_FORM })

  // ─── Load data ──────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true)
    const { getInventoryAction, getContainersAction } = await import('@/app/actions/inventory-management')
    const { getAgencyClients } = await import('@/app/actions/import-orders')
    const [invRes, contRes, clientsRes] = await Promise.all([
      getInventoryAction(),
      getContainersAction(),
      getAgencyClients()
    ])
    if (invRes.success && invRes.cars) setCars(invRes.cars as any as CarSalesItem[])
    if (contRes.success && contRes.containers) setContainers(contRes.containers)
    if (clientsRes.success && clientsRes.data) setClients(clientsRes.data)
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ─── Scroll lock ────────────────────────────────────────────────────────────
  useEffect(() => {
    const open = isAddCarOpen || !!activeCarDetail || !!deleteConfirmId || !!statusChangeCarId || isBulkImportOpen
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isAddCarOpen, activeCarDetail, deleteConfirmId, statusChangeCarId, isBulkImportOpen])

  // ─── Escape Key & History Back Navigation ────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeCarDetail) {
          setActiveCarDetail(null)
          setIs360Active(false)
          setSimulatedAngle(0)
        }
        if (isAddCarOpen) setIsAddCarOpen(false)
        if (deleteConfirmId) setDeleteConfirmId(null)
        if (statusChangeCarId) setStatusChangeCarId(null)
        if (isBulkImportOpen) setIsBulkImportOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeCarDetail, isAddCarOpen, deleteConfirmId, statusChangeCarId, isBulkImportOpen])

  useEffect(() => {
    if (activeCarDetail) {
      // Add a dummy entry to history to intercept back button
      window.history.pushState({ drawerOpen: true }, '')
      
      const handlePopState = () => {
        setActiveCarDetail(null)
        setIs360Active(false)
        setSimulatedAngle(0)
      }
      
      window.addEventListener('popstate', handlePopState)
      return () => {
        window.removeEventListener('popstate', handlePopState)
        if (window.history.state?.drawerOpen) {
          window.history.back()
        }
      }
    }
  }, [activeCarDetail])

  // ─── Auto stock number ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!editingCarId) setFormState(prev => ({ ...prev, stock_number: `V-2026-${String(cars.length + 1).padStart(3, '0')}` }))
  }, [cars.length, editingCarId])

  // ─── Load vehicle history when drawer opens ─────────────────────────────────
  useEffect(() => {
    if (!activeCarDetail) return
    if (activeDrawerTab === 'history') {
      setHistoryLoading(true)
      import('@/app/actions/inventory-management').then(({ getVehicleHistoryAction }) => {
        getVehicleHistoryAction(activeCarDetail.id).then(res => {
          if (res.success) setVehicleHistory((res.history as any) || [])
          setHistoryLoading(false)
        })
      })
    }
    if (activeDrawerTab === 'calendar' && activeCarDetail.car_type === 'rental') {
      setRentalLoading(true)
      import('@/app/actions/inventory-management').then(({ getRentalBookingsAction }) => {
        getRentalBookingsAction(activeCarDetail.id).then(res => {
          if (res.success) setRentalBookings((res.bookings as any) || [])
          setRentalLoading(false)
        })
      })
    }
  }, [activeCarDetail, activeDrawerTab])

  // ─── Derived data ───────────────────────────────────────────────────────────
  const brandList = useMemo(() => [...new Set(cars.map(c => c.brand).filter(Boolean))].sort(), [cars])

  const filteredCars = useMemo(() => cars.filter(c => {
    const sl = search.toLowerCase()
    const matchesSearch = !search ||
      (c.brand || '').toLowerCase().includes(sl) || (c.model || '').toLowerCase().includes(sl) ||
      (c.stock_number || '').toLowerCase().includes(sl) || (c.vin || '').toLowerCase().includes(sl)
    const matchesBrand = brandFilter === 'all' || (c.brand || '').toLowerCase() === brandFilter.toLowerCase()
    const matchesFuel = fuelFilter === 'all' || c.fuel_type === fuelFilter
    const matchesCondition = conditionFilter === 'all' || c.condition === conditionFilter
    const matchesCarType = carTypeFilter === 'all' || c.car_type === carTypeFilter
    const price = c.final_price || c.selling_price || 0
    let matchesPrice = true
    if (priceFilter === 'under_4m') matchesPrice = price < 4_000_000
    else if (priceFilter === '4m_8m') matchesPrice = price >= 4_000_000 && price <= 8_000_000
    else if (priceFilter === 'above_8m') matchesPrice = price > 8_000_000
    let matchesYear = true
    if (yearFilter === 'new_2025_2026') matchesYear = (c.year || 0) >= 2025
    else if (yearFilter === 'older') matchesYear = (c.year || 0) < 2025
    return matchesSearch && matchesBrand && matchesFuel && matchesCondition && matchesPrice && matchesYear && matchesCarType
  }), [cars, search, brandFilter, fuelFilter, conditionFilter, priceFilter, yearFilter, carTypeFilter])

  // ─── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const sellCars = cars.filter(c => c.car_type === 'sell')
    const totalInventoryValue = sellCars.reduce((s, c) => s + (c.final_price || c.selling_price || 0), 0)
    const totalCost = sellCars.reduce((s, c) => s + (c.purchase_price || 0), 0)
    const avgMargin = sellCars.length > 0
      ? Math.round(sellCars.reduce((s, c) => s + (c.margin_percent || 0), 0) / sellCars.length)
      : 0
    const soldCars = cars.filter(c => c.status === 'sold')
    const soldRevenue = soldCars.reduce((s, c) => s + (c.final_price || c.selling_price || 0), 0)
    const totalUnits = cars.reduce((s, c) => s + (c.quantity || 1), 0)
    return { totalInventoryValue, totalCost, avgMargin, soldRevenue, totalUnits, soldCount: soldCars.length }
  }, [cars])

  const calculateFinancing = (price: number) => {
    if (!price || price <= 0) return { downAmount: 0, principal: 0, installment: 0 }
    const downAmount = price * (calcDownPaymentPercent / 100)
    const principal = price - downAmount
    const monthlyRate = 5.5 / 100 / 12
    const installment = (principal * monthlyRate * Math.pow(1 + monthlyRate, calcMonths)) / (Math.pow(1 + monthlyRate, calcMonths) - 1)
    return { downAmount: Math.round(downAmount), principal: Math.round(principal), installment: Math.round(installment) }
  }

  // ─── Feature toggle ─────────────────────────────────────────────────────────
  const handleFeatureToggle = (feat: string) => setFormState(prev => ({
    ...prev,
    features: (prev.features || []).includes(feat) ? (prev.features || []).filter(f => f !== feat) : [...(prev.features || []), feat]
  }))

  // ─── Image Upload ───────────────────────────────────────────────────────────
  const handleImageUpload = async (file: File, field: 'cover_image_url' | 'images') => {
    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { uploadCarImageAction } = await import('@/app/actions/inventory-management')
      const res = await uploadCarImageAction(formData)
      if (res.success && res.url) {
        if (field === 'cover_image_url') {
          setFormState(prev => ({ ...prev, cover_image_url: res.url! }))
        } else {
          setFormState(prev => ({ ...prev, images: [...(prev.images || []), res.url!] }))
        }
      } else {
        // Fallback: use blob URL locally
        const blobUrl = URL.createObjectURL(file)
        if (field === 'cover_image_url') setFormState(prev => ({ ...prev, cover_image_url: blobUrl }))
        else setFormState(prev => ({ ...prev, images: [...(prev.images || []), blobUrl] }))
      }
    } finally {
      setUploadingImage(false)
    }
  }

  const handleDocumentUpload = async (file: File, docField: string) => {
    const formData = new FormData()
    formData.append('file', file)
    const { uploadCarImageAction } = await import('@/app/actions/inventory-management')
    const res = await uploadCarImageAction(formData)
    if (res.success && res.url) {
      setFormState(prev => ({ ...prev, [docField]: res.url }))
    }
  }

  // ─── VIN decode ─────────────────────────────────────────────────────────────
  const handleVINDecode = () => {
    const result = decodeVIN(formState.vin)
    setVinDecodeResult(result)
    if (result.year) setFormState(prev => ({ ...prev, year: result.year! }))
  }

  // ─── Submit form ────────────────────────────────────────────────────────────
  const handleSubmitCar = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingCar(true); setSaveError(null)
    const sPrice = Number(formState.selling_price) || 0
    const pPrice = Number(formState.purchase_price) || 0
    let fPrice = sPrice
    if (formState.discount_type === 'fixed') fPrice = sPrice - (Number(formState.discount_amount) || 0)
    else if (formState.discount_type === 'percent') fPrice = sPrice - (sPrice * (Number(formState.discount_percent) || 0) / 100)
    const marginPct = pPrice > 0 ? Math.round(((sPrice - pPrice) / pPrice) * 100) : 0
    const payload: any = {
      ...formState,
      final_price: Math.max(0, fPrice),
      margin_percent: marginPct,
      images: formState.images || [],
    }
    if (editingCarId) payload.id = editingCarId
    try {
      const { saveCarAction } = await import('@/app/actions/inventory-management')
      const res = await saveCarAction(payload)
      if (!res.success) { setSaveError(res.error || 'Failed to save'); setSavingCar(false); return }
    } catch (err: any) { setSaveError(err.message); setSavingCar(false); return }
    await loadData()
    setIsAddCarOpen(false); setEditingCarId(null); setWizardStep(1); setSavingCar(false)
    setFormState({ ...DEFAULT_FORM }); setVinDecodeResult(null)
  }

  // ─── Delete ─────────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteConfirmId) return
    const { deleteCarAction } = await import('@/app/actions/inventory-management')
    await deleteCarAction(deleteConfirmId)
    setDeleteConfirmId(null); setSelectedIds(prev => { const n = new Set(prev); n.delete(deleteConfirmId!); return n })
    await loadData()
  }

  // ─── Status change ──────────────────────────────────────────────────────────
  const handleStatusChange = async (carId: string, newStatus: string) => {
    const { saveCarAction } = await import('@/app/actions/inventory-management')
    const car = cars.find(c => c.id === carId)
    if (!car) return
    await saveCarAction({ ...car, id: carId, status: newStatus })
    setStatusChangeCarId(null)
    if (activeCarDetail?.id === carId) setActiveCarDetail(prev => prev ? { ...prev, status: newStatus as any } : null)
    await loadData()
  }

  // ─── Bulk status change ─────────────────────────────────────────────────────
  const handleBulkStatusChange = async () => {
    const { saveCarAction } = await import('@/app/actions/inventory-management')
    for (const id of selectedIds) {
      const car = cars.find(c => c.id === id)
      if (car) await saveCarAction({ ...car, id, status: bulkStatus })
    }
    setSelectedIds(new Set())
    await loadData()
  }

  // ─── Bulk CSV import ────────────────────────────────────────────────────────
  const handleCSVFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvError(null)
    const reader = new FileReader()
    reader.onload = evt => {
      const text = evt.target?.result as string
      const parsed = parseCSV(text)
      if (parsed.length === 0) { setCsvError('No valid rows found. Check your CSV format.'); return }
      setCsvPreview(parsed)
    }
    reader.readAsText(file)
  }

  const handleBulkImport = async () => {
    if (csvPreview.length === 0) return
    setCsvImporting(true); setCsvError(null)
    try {
      const { bulkImportCarsAction } = await import('@/app/actions/inventory-management')
      const res = await bulkImportCarsAction(csvPreview)
      if (!res.success) { setCsvError(res.error || 'Import failed'); setCsvImporting(false); return }
      setIsBulkImportOpen(false); setCsvPreview([])
      await loadData()
    } finally { setCsvImporting(false) }
  }

  // ─── Open edit ──────────────────────────────────────────────────────────────
  const openEdit = (car: CarSalesItem) => {
    setFormState({
      ...DEFAULT_FORM, ...car,
      car_type: car.car_type || 'sell', owner_type: (car.owner_type as any) || 'agency',
      commission_percentage: car.commission_percentage ?? 3, commission_flat_fee: car.commission_flat_fee ?? 0,
      owner_target_payout: car.owner_target_payout ?? 0, owner_client_id: car.owner_client_id || '',
      quantity: car.quantity ?? 1, 
      rental_daily_rate: car.rental_daily_rate ?? (car as any).rental_daily_rate ?? 0,
      rental_weekly_rate: (car as any).rental_weekly_rate ?? (car as any).specs?.rental_weekly_rate ?? 0,
      rental_monthly_rate: (car as any).rental_monthly_rate ?? (car as any).specs?.rental_monthly_rate ?? 0,
      security_deposit: (car as any).security_deposit ?? (car as any).specs?.security_deposit ?? 0,
      container_id: car.container_id || '', tracking_number: car.tracking_number || '',
      features: Array.isArray(car.features) ? car.features : [],
      images: Array.isArray(car.images) ? car.images : [],
      cover_image_url: car.cover_image_url || PLACEHOLDER_IMG,
      show_on_website: car.show_on_website !== false,
    })
    setEditingCarId(car.id); setWizardStep(1); setVinDecodeResult(null); setSaveError(null); setIsAddCarOpen(true)
  }

  // ─── Rental calendar helpers ─────────────────────────────────────────────────
  const getBookedDays = useCallback(() => {
    const booked: Date[] = []
    rentalBookings.filter(b => b.status !== 'cancelled').forEach(b => {
      const days = eachDayOfInterval({ start: parseISO(b.start_date), end: parseISO(b.end_date) })
      booked.push(...days)
    })
    return booked
  }, [rentalBookings])

  const handleAddBooking = async () => {
    if (!activeCarDetail || !newBooking.client_name || !newBooking.start_date || !newBooking.end_date) return
    const { createRentalBookingAction } = await import('@/app/actions/inventory-management')
    await createRentalBookingAction({
      car_id: activeCarDetail.id,
      client_name: newBooking.client_name,
      client_phone: newBooking.client_phone,
      pickup_date: newBooking.start_date,
      return_date: newBooking.end_date,
      total_price: (activeCarDetail.rental_daily_rate || 0) * 1,
      deposit_amount: 0,
      notes: newBooking.notes
    })
    setIsAddBookingOpen(false)
    setNewBooking({ client_name: '', client_phone: '', start_date: '', end_date: '', notes: '' })
    const { getRentalBookingsAction } = await import('@/app/actions/inventory-management')
    const res = await getRentalBookingsAction(activeCarDetail.id)
    if (res.success) setRentalBookings((res.bookings as any) || [])
  }

  const handleDeleteBooking = async (bookingId: string) => {
    const { deleteRentalBookingAction } = await import('@/app/actions/inventory-management')
    await deleteRentalBookingAction(bookingId)
    if (activeCarDetail) {
      const { getRentalBookingsAction } = await import('@/app/actions/inventory-management')
      const res = await getRentalBookingsAction(activeCarDetail.id)
      if (res.success) setRentalBookings((res.bookings as any) || [])
    }
  }

  // ─── Add history note ───────────────────────────────────────────────────────
  const handleAddNote = async () => {
    if (!activeCarDetail || !historyNoteText.trim()) return
    setAddingNote(true)
    const { addVehicleHistoryEvent } = await import('@/app/actions/inventory-management')
    await addVehicleHistoryEvent(activeCarDetail.id, {
      event_type: 'note', title: 'Note ajoutée', description: historyNoteText
    })
    setHistoryNoteText('')
    const { getVehicleHistoryAction } = await import('@/app/actions/inventory-management')
    const res = await getVehicleHistoryAction(activeCarDetail.id)
    if (res.success) setVehicleHistory((res.history as any) || [])
    setAddingNote(false)
  }

  const getCount = (type: 'all' | 'sell' | 'sur_command' | 'rental') =>
    type === 'all' ? cars.length : cars.filter(c => c.car_type === type).length

  const toggleSelect = (id: string) => setSelectedIds(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n
  })

  const toggleSelectAll = () => setSelectedIds(prev =>
    prev.size === filteredCars.length ? new Set() : new Set(filteredCars.map(c => c.id))
  )

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="h-full overflow-y-auto flex flex-col gap-5 text-slate-800 pb-10 pr-2 scrollbar-thin">

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-400 font-bold">Loading inventory...</span>
          </div>
        </div>
      ) : (
        <>
          {/* ── STATS PANEL ── */}
          <div className="bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden shrink-0">
            <button
              onClick={() => setIsStatsOpen(p => !p)}
              className="w-full flex items-center justify-between px-5 py-3 text-xs font-black text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-50/50"
            >
          <span className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-red-500" /> {t('sales.inventory_analytics', 'Inventory Analytics')}</span>
              {isStatsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {isStatsOpen && (
              <div className="px-5 pb-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 border-t border-slate-100">
                {[
                  { label: t('sales.total_units', 'Total Units'), value: stats.totalUnits.toString(), sub: t('sales.in_inventory', 'in inventory'), color: 'text-slate-900' },
                  { label: t('sales.inventory_value', 'Inventory Value'), value: fmt(stats.totalInventoryValue) ? `${fmt(stats.totalInventoryValue)} DZD` : '—', sub: t('sales.sell_command', 'sell + command'), color: 'text-blue-600' },
                  { label: t('sales.total_cost', 'Total Cost'), value: fmt(stats.totalCost) ? `${fmt(stats.totalCost)} DZD` : '—', sub: t('sales.purchase_prices', 'purchase prices'), color: 'text-slate-600' },
                  { label: t('sales.avg_margin', 'Avg Margin'), value: `${stats.avgMargin}%`, sub: t('sales.expected_profit', 'expected profit'), color: stats.avgMargin > 10 ? 'text-emerald-600' : 'text-amber-600' },
                  { label: t('sales.sold_revenue', 'Sold Revenue'), value: fmt(stats.soldRevenue) ? `${fmt(stats.soldRevenue)} DZD` : '—', sub: `${stats.soldCount} ${t('sales.vehicles', 'vehicles')}`, color: 'text-emerald-700' },
                  { label: t('sales.active_listings', 'Active Listings'), value: cars.filter(c => c.status === 'available').length.toString(), sub: t('sales.available_now', 'available now'), color: 'text-red-600' },
                ].map(stat => (
                  <div key={stat.label} className="pt-4 space-y-0.5">
                    <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">{stat.label}</p>
                    <p className={`text-sm font-black ${stat.color}`}>{stat.value}</p>
                    <p className="text-[9px] text-slate-400 font-semibold">{stat.sub}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── TYPE TABS ── */}
          <div className="flex items-center justify-between bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-2xl p-2.5 shadow-xs shrink-0 select-none">
            <div className="flex gap-2 overflow-x-auto scrollbar-none">
              {[
                { id: 'all', label: 'All Vehicles', count: getCount('all'), color: 'bg-slate-100 text-slate-700' },
                { id: 'sell', label: '🏷️ À Vendre', count: getCount('sell'), color: 'bg-blue-100 text-blue-700' },
                { id: 'sur_command', label: '📦 Sur Commande', count: getCount('sur_command'), color: 'bg-amber-100 text-amber-700' },
                { id: 'rental', label: '🚗 Location', count: getCount('rental'), color: 'bg-emerald-100 text-emerald-700' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setCarTypeFilter(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer border flex items-center gap-2 whitespace-nowrap ${
                    carTypeFilter === tab.id ? 'bg-slate-900 text-white border-slate-900 shadow-sm scale-[1.02]' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  {tab.label}
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${carTypeFilter === tab.id ? 'bg-white/20 text-white' : tab.color}`}>{tab.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── SEARCH & ACTIONS ── */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs shrink-0">
            <div className="flex flex-wrap gap-2 items-center w-full lg:w-auto">
              <div className="relative w-full sm:w-[200px] shrink-0">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Brand, model, VIN..." className="pl-9 text-xs rounded-xl border-slate-200 w-full" />
              </div>
              <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} className="rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-slate-600 bg-slate-50 cursor-pointer">
                <option value="all">All Brands</option>
                {brandList.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <select value={priceFilter} onChange={e => setPriceFilter(e.target.value)} className="rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-slate-600 bg-slate-50 cursor-pointer">
                <option value="all">Any Price</option>
                <option value="under_4m">Under 4M DZD</option>
                <option value="4m_8m">4M – 8M DZD</option>
                <option value="above_8m">Above 8M DZD</option>
              </select>
              <select value={fuelFilter} onChange={e => setFuelFilter(e.target.value)} className="rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-slate-600 bg-slate-50 cursor-pointer">
                <option value="all">All Fuel</option>
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="hybrid">Hybrid</option>
                <option value="electric">Electric</option>
              </select>
              <select value={conditionFilter} onChange={e => setConditionFilter(e.target.value)} className="rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-slate-600 bg-slate-50 cursor-pointer">
                <option value="all">All Conditions</option>
                <option value="new">New</option>
                <option value="used">Used</option>
                <option value="certified_pre_owned">CPO</option>
              </select>
              <select value={yearFilter} onChange={e => setYearFilter(e.target.value)} className="rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-slate-600 bg-slate-50 cursor-pointer">
                <option value="all">Any Year</option>
                <option value="new_2025_2026">2025–2026</option>
                <option value="older">Before 2025</option>
              </select>
            </div>
            <div className="flex gap-2 flex-wrap w-full lg:w-auto">
              {/* Export CSV */}
              <Button onClick={() => exportToCSV(filteredCars, 'inventory')} className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold gap-1.5 cursor-pointer h-9">
                <Download className="h-3.5 w-3.5" /> Export CSV
              </Button>
              {/* Import CSV */}
              <Button onClick={() => { setIsBulkImportOpen(true); setCsvPreview([]); setCsvError(null) }} className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold gap-1.5 cursor-pointer h-9">
                <FileUp className="h-3.5 w-3.5" /> Import CSV
              </Button>
              {/* Add Car */}
              <Button
                onClick={() => {
                  setFormState({ ...DEFAULT_FORM, stock_number: `V-2026-${String(cars.length + 1).padStart(3, '0')}` })
                  setEditingCarId(null); setWizardStep(1); setSaveError(null); setVinDecodeResult(null); setIsAddCarOpen(true)
                }}
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black gap-1.5 shadow-sm cursor-pointer h-9"
              >
                <Plus className="h-4 w-4" /> Add Vehicle
              </Button>
            </div>
          </div>

          {/* ── BULK ACTION BAR ── */}
          {selectedIds.size > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-4 border border-slate-700 animate-fadeIn">
              <span className="text-xs font-black text-slate-300">{selectedIds.size} selected</span>
              <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)} className="bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-xs font-bold text-white cursor-pointer">
                {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <Button onClick={handleBulkStatusChange} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black h-7 px-3 cursor-pointer">Apply Status</Button>
              <Button onClick={() => exportToCSV(filteredCars.filter(c => selectedIds.has(c.id)), 'selection')} className="bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold h-7 px-3 cursor-pointer">
                <Download className="h-3 w-3 mr-1" /> Export
              </Button>
              <button onClick={() => setSelectedIds(new Set())} className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer ml-2">Clear</button>
            </div>
          )}

          {/* ── Select All Row ── */}
          {filteredCars.length > 0 && (
            <div className="flex items-center gap-3 px-1">
              <button onClick={toggleSelectAll} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer">
                {selectedIds.size === filteredCars.length ? <CheckSquare className="h-4 w-4 text-red-600" /> : <Square className="h-4 w-4" />}
                {selectedIds.size === filteredCars.length ? 'Deselect All' : `Select All (${filteredCars.length})`}
              </button>
            </div>
          )}

          {/* ── CAR GRID ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCars.map(car => {
              const displayPrice = car.final_price || car.selling_price || 0
              const savings = (car.selling_price || 0) - (car.final_price || 0)
              const hasSavings = savings > 0 && car.discount_type !== 'none'
              const sc = statusConfig[car.status] || statusConfig.available
              const isSelected = selectedIds.has(car.id)
              const imgs = Array.isArray(car.images) ? car.images : []

              return (
                <div key={car.id} className={`bg-white border rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col group text-left rtl:text-right relative ${isSelected ? 'border-red-400 ring-2 ring-red-400/20' : 'border-slate-200/80 hover:border-slate-300'}`}>
                  {/* Cover Image */}
                  <div className="h-48 bg-slate-100 relative overflow-hidden shrink-0">
                    <img
                      src={car.cover_image_url || PLACEHOLDER_IMG}
                      alt={`${car.brand} ${car.model}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG }}
                    />
                    {/* Selection checkbox */}
                    <button onClick={e => { e.stopPropagation(); toggleSelect(car.id) }} className="absolute top-2 left-2 h-6 w-6 rounded-lg bg-white/90 border border-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-50">
                      {isSelected ? <CheckSquare className="h-4 w-4 text-red-600" /> : <Square className="h-4 w-4 text-slate-400" />}
                    </button>
                    {/* Badges */}
                    <div className="absolute top-2 left-10 flex flex-wrap gap-1 max-w-[70%]">
                      <span className={`px-2 py-0.5 rounded-lg flex items-center gap-1 border text-[9px] font-extrabold ${sc.bg} ${sc.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${sc.dot} ${car.status === 'available' ? 'animate-pulse' : ''}`} />
                        {t(sc.labelKey, sc.label)}
                      </span>
                      {car.condition && <span className="bg-red-600 text-white px-2 py-0.5 rounded-lg text-[9px] font-black uppercase">{car.condition === 'certified_pre_owned' ? 'CPO' : car.condition}</span>}
                      {car.car_type === 'sell' && <span className="bg-blue-600 text-white px-2 py-0.5 rounded-lg text-[9px] font-black">{t('sales.for_sale', 'For Sale')}</span>}
                      {car.car_type === 'sur_command' && <span className="bg-amber-500 text-white px-2 py-0.5 rounded-lg text-[9px] font-black">{t('sales.sur_command', 'Sur Command')}</span>}
                      {car.car_type === 'rental' && <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-lg text-[9px] font-black">{t('sales.rental', 'Rental')}</span>}
                    </div>
                    {/* Gallery indicator */}
                    {imgs.length > 0 && (
                      <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-0.5 rounded-lg text-[9px] font-black flex items-center gap-1">
                        <Camera className="h-3 w-3" /> +{imgs.length}
                      </div>
                    )}
                    {hasSavings && <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-2 py-0.5 rounded-lg text-[9px] font-black">-{savings.toLocaleString()} DZD</div>}
                    {car.car_type !== 'rental' && (car.quantity ?? 1) > 1 && <div className="absolute bottom-2 right-16 bg-slate-900/80 text-white px-2 py-0.5 rounded-lg text-[9px] font-black">Qty: {car.quantity}</div>}
                    {/* Action icons */}
                    <button onClick={e => { e.stopPropagation(); setStatusChangeCarId(car.id) }} className="absolute top-2 right-9 h-7 w-7 rounded-lg bg-white/90 hover:bg-blue-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-500 cursor-pointer" title="Change status"><ToggleLeft className="h-3.5 w-3.5" /></button>
                    <button onClick={e => { e.stopPropagation(); printWindowSticker(car) }} className="absolute top-10 right-2 h-7 w-7 rounded-lg bg-white/90 hover:bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer" title="Print sticker"><Printer className="h-3.5 w-3.5" /></button>
                    <button onClick={e => { e.stopPropagation(); setDeleteConfirmId(car.id) }} className="absolute top-2 right-2 h-7 w-7 rounded-lg bg-white/90 hover:bg-red-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 cursor-pointer" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <span>{car.stock_number || '—'}</span>
                        {car.origin_country && <span>{car.origin_country}</span>}
                      </div>
                      <h4 className="text-sm font-black text-slate-800 tracking-tight leading-snug">
                        {car.brand || '—'} {car.model} <span className="text-slate-400 font-semibold">{car.year}</span>
                      </h4>
                      <p className="text-[10px] text-slate-400 font-semibold">VIN: <span className="font-mono text-slate-500">{car.vin || 'N/A'}</span></p>
                      {car.car_type === 'sur_command' && car.tracking_number && (
                        <p className="text-[10px] text-blue-600 font-bold flex items-center gap-1"><MapPin className="h-3 w-3" /> {car.tracking_number}</p>
                      )}
                    </div>
                    <div className="space-y-2.5 pt-3 border-t border-slate-100">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{car.car_type === 'rental' ? 'Daily Rate' : 'Price'}</span>
                        <div className="text-right">
                          {hasSavings && <span className="text-[10px] line-through text-slate-400 block">{(car.selling_price || 0).toLocaleString()} DZD</span>}
                          <span className="text-sm font-black text-red-600">
                            {car.car_type === 'rental'
                              ? fmt(car.rental_daily_rate) ? `${fmt(car.rental_daily_rate)} DZD/day` : 'Sur demande'
                              : fmt(displayPrice) ? `${fmt(displayPrice)} DZD` : 'Prix sur demande'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 text-[9px] font-black text-slate-500 uppercase">
                        {car.fuel_type && <span className="bg-slate-50 border px-2 py-0.5 rounded-lg">{car.fuel_type}</span>}
                        {car.transmission && <span className="bg-slate-50 border px-2 py-0.5 rounded-lg">{car.transmission}</span>}
                        <span className="bg-slate-50 border px-2 py-0.5 rounded-lg">{!car.mileage ? 'New' : `${(car.mileage || 0).toLocaleString()} km`}</span>
                        {car.body_type && <span className="bg-slate-50 border px-2 py-0.5 rounded-lg">{car.body_type}</span>}
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <Button onClick={() => { setActiveDrawerTab('specs'); setActiveCarDetail(car) }} className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-bold h-8 cursor-pointer">
                          <Eye className="h-3 w-3 mr-1" /> View
                        </Button>
                        <Button onClick={() => openEdit(car)} className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 rounded-xl text-[10px] font-bold h-8 cursor-pointer">
                          <Edit3 className="h-3 w-3 mr-1" /> Edit
                        </Button>
                        <Button onClick={() => { setActiveDrawerTab('finance'); setActiveCarDetail(car) }} className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 rounded-xl text-[10px] font-bold h-8 cursor-pointer">
                          <TrendingUp className="h-3 w-3 mr-1" /> Calc
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {filteredCars.length === 0 && (
              <div className="col-span-full border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center p-16 text-slate-400 text-center bg-white">
                <Car className="h-12 w-12 text-slate-300 stroke-[1.5] mb-3" />
                <span className="text-sm font-bold text-slate-500">No vehicles found</span>
                <span className="text-[11px] mt-1">Try adjusting your filters or add a new vehicle.</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══════════════════════════ DELETE CONFIRM ═══════════════════════════ */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-[60] p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-6 space-y-5 animate-scaleIn">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0"><AlertTriangle className="h-5 w-5 text-red-600" /></div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Delete Vehicle?</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">This cannot be undone. All history and data for this vehicle will be deleted.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setDeleteConfirmId(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border rounded-xl text-xs font-bold cursor-pointer">Cancel</Button>
              <Button onClick={confirmDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black cursor-pointer"><Trash2 className="h-3.5 w-3.5 mr-1" /> Delete</Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════ STATUS CHANGE ════════════════════════════ */}
      {statusChangeCarId && (() => {
        const car = cars.find(c => c.id === statusChangeCarId)
        if (!car) return null
        return (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-[60] p-4 animate-fadeIn" onClick={() => setStatusChangeCarId(null)}>
            <div className="bg-white rounded-2xl shadow-2xl border w-full max-w-sm p-6 space-y-3 animate-scaleIn" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900">Change Status</h3>
                <button onClick={() => setStatusChangeCarId(null)} className="h-7 w-7 rounded-lg hover:bg-slate-100 flex items-center justify-center cursor-pointer"><X className="h-4 w-4 text-slate-400" /></button>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold">{car.brand} {car.model} {car.year}</p>
              <div className="space-y-1.5">
                {Object.entries(statusConfig).map(([key, val]) => (
                  <button key={key} onClick={() => handleStatusChange(statusChangeCarId, key)} className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${car.status === key ? `${val.bg} ${val.text} border-current` : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'}`}>
                    <span className={`h-3 w-3 rounded-full ${val.dot}`} />{val.label}
                    {car.status === key && <CheckCircle2 className="h-4 w-4 ml-auto" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )
      })()}

      {/* ═══════════════════════════ BULK IMPORT MODAL ═══════════════════════ */}
      {isBulkImportOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => setIsBulkImportOpen(false)}>
          <div className="bg-white rounded-3xl shadow-2xl border w-full max-w-3xl overflow-hidden animate-scaleIn flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-black flex items-center gap-2"><FileUp className="h-4 w-4 text-blue-400" /> Bulk Import Cars (CSV)</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Upload a CSV file to import multiple vehicles at once.</p>
              </div>
              <button onClick={() => setIsBulkImportOpen(false)} className="h-8 w-8 rounded-lg hover:bg-slate-800 flex items-center justify-center cursor-pointer text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Template download */}
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <div>
                  <p className="text-xs font-black text-blue-800">First time? Download the template</p>
                  <p className="text-[10px] text-blue-600 mt-0.5">Use our template CSV to fill in your vehicles correctly.</p>
                </div>
                <Button onClick={downloadCSVTemplate} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold h-8 gap-1.5 cursor-pointer">
                  <Download className="h-3.5 w-3.5" /> Template
                </Button>
              </div>
              {/* File upload */}
              <div>
                <Label htmlFor="csv-upload" className="cursor-pointer bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-slate-200 rounded-xl px-6 py-8 flex flex-col items-center justify-center gap-2 text-xs font-bold text-slate-500 transition">
                  <FileUp className="h-8 w-8 text-slate-300" />
                  <span>Click to upload CSV file</span>
                  <span className="text-[10px] font-normal text-slate-400">Accepts .csv format only</span>
                </Label>
                <input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={handleCSVFile} />
              </div>
              {csvError && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> {csvError}</div>}
              {/* Preview */}
              {csvPreview.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-slate-700">{csvPreview.length} vehicles to import</p>
                    <p className="text-[10px] text-slate-400">Preview (first 3 shown)</p>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-[10px] font-semibold">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          {['Brand', 'Model', 'Year', 'Type', 'Fuel', 'Selling Price', 'Condition'].map(h => (
                            <th key={h} className="px-3 py-2 text-left rtl:text-right font-black text-slate-500 uppercase text-[9px] tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {csvPreview.slice(0, 3).map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-3 py-2">{row.brand}</td>
                            <td className="px-3 py-2">{row.model}</td>
                            <td className="px-3 py-2">{row.year}</td>
                            <td className="px-3 py-2">{row.car_type}</td>
                            <td className="px-3 py-2">{row.fuel_type}</td>
                            <td className="px-3 py-2">{row.selling_price?.toLocaleString()} DZD</td>
                            <td className="px-3 py-2">{row.condition}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {csvPreview.length > 3 && <p className="text-[10px] text-slate-400 text-center">...and {csvPreview.length - 3} more vehicles</p>}
                </div>
              )}
            </div>
            <div className="px-6 pb-6 flex gap-3 shrink-0">
              <Button onClick={() => setIsBulkImportOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border rounded-xl text-xs font-bold cursor-pointer">Cancel</Button>
              <Button onClick={handleBulkImport} disabled={csvPreview.length === 0 || csvImporting} className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black cursor-pointer disabled:opacity-60">
                {csvImporting ? <span className="flex items-center gap-2"><span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Importing...</span> : `🚀 Import ${csvPreview.length} Vehicles`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════ ADD/EDIT WIZARD ════════════════════════════ */}
      {isAddCarOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-scaleIn flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-black flex items-center gap-2"><Edit3 className="h-4 w-4 text-blue-400" />{editingCarId ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">{editingCarId ? 'Update specifications, pricing, or media.' : 'Add a new vehicle to your showroom inventory.'}</p>
              </div>
              <button onClick={() => { setIsAddCarOpen(false); setWizardStep(1); setSaveError(null) }} className="h-8 w-8 rounded-lg hover:bg-slate-800 flex items-center justify-center cursor-pointer text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            {/* Progress */}
            <div className="bg-slate-50 border-b border-slate-200/50 px-6 py-2.5 flex items-center justify-between gap-1 shrink-0 overflow-x-auto">
              {['Basic Info', 'Identity', 'Finance', 'Features', 'Media'].map((label, i) => (
                <React.Fragment key={label}>
                  <button type="button" onClick={() => setWizardStep(i + 1)} className={`text-[9px] font-bold uppercase tracking-wider cursor-pointer whitespace-nowrap transition-colors ${wizardStep === i + 1 ? 'text-red-600 font-black' : wizardStep > i + 1 ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {wizardStep > i + 1 ? '✓ ' : `${i + 1}. `}{label}
                  </button>
                  {i < 4 && <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />}
                </React.Fragment>
              ))}
            </div>
            {saveError && <div className="mx-6 mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold flex items-center gap-2 shrink-0"><AlertTriangle className="h-4 w-4 shrink-0" /> {saveError}</div>}

            <form onSubmit={handleSubmitCar} className="p-6 overflow-y-auto scrollbar-thin flex-1 space-y-4 text-xs text-slate-700">

              {/* ── STEP 1: Basic ── */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b pb-2">Step 1: Basic Specifications</h4>
                  {/* Type selector */}
                  <div className="space-y-2 pb-3 border-b border-slate-100">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Vehicle Type *</Label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {[
                        { car_type: 'sell', owner_type: 'agency', label: 'À Vendre', desc: 'In lot', color: 'border-blue-400 bg-blue-50 text-blue-900', icon: '🏷️' },
                        { car_type: 'sell', owner_type: 'customer', label: 'Dépôt-Vente', desc: 'Consignment', color: 'border-purple-400 bg-purple-50 text-purple-900', icon: '👤' },
                        { car_type: 'sur_command', owner_type: 'agency', label: 'Sur Commande', desc: 'On order', color: 'border-amber-400 bg-amber-50 text-amber-900', icon: '📦' },
                        { car_type: 'rental', owner_type: 'agency', label: 'Location', desc: 'Rental fleet', color: 'border-emerald-400 bg-emerald-50 text-emerald-900', icon: '🚗' },
                      ].map(type => {
                        const isActive = formState.car_type === type.car_type && formState.owner_type === type.owner_type
                        return (
                          <button key={`${type.car_type}-${type.owner_type}`} type="button"
                            onClick={() => setFormState(prev => ({ ...prev, car_type: type.car_type as any, owner_type: type.owner_type as any }))}
                            className={`p-2.5 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer ${isActive ? `${type.color} border-[1.5px] shadow-sm scale-[1.02] font-extrabold` : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600 font-bold'}`}>
                            <span className="text-lg">{type.icon}</span>
                            <span className="text-[10px] leading-tight">{type.label}</span>
                            <span className="text-[8px] text-slate-400 font-medium">{type.desc}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">Brand *</Label><Input required value={formState.brand} onChange={e => setFormState(p => ({ ...p, brand: e.target.value }))} placeholder="e.g. Hyundai" className="rounded-xl border-slate-200 text-xs" /></div>
                    <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">Model *</Label><Input required value={formState.model} onChange={e => setFormState(p => ({ ...p, model: e.target.value }))} placeholder="e.g. Tucson" className="rounded-xl border-slate-200 text-xs" /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">Year *</Label><Input type="number" required value={formState.year} onChange={e => setFormState(p => ({ ...p, year: Number(e.target.value) }))} className="rounded-xl border-slate-200 text-xs" /></div>
                    <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">Variant</Label><Input value={formState.variant} onChange={e => setFormState(p => ({ ...p, variant: e.target.value }))} placeholder="e.g. N-Line" className="rounded-xl border-slate-200 text-xs" /></div>
                    <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">Version</Label><Input value={formState.version} onChange={e => setFormState(p => ({ ...p, version: e.target.value }))} placeholder="e.g. France" className="rounded-xl border-slate-200 text-xs" /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">Fuel</Label>
                      <select value={formState.fuel_type} onChange={e => setFormState(p => ({ ...p, fuel_type: e.target.value as any }))} className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white">
                        {['petrol', 'diesel', 'hybrid', 'electric', 'lpg'].map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
                      </select></div>
                    <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">Transmission</Label>
                      <select value={formState.transmission} onChange={e => setFormState(p => ({ ...p, transmission: e.target.value as any }))} className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white">
                        {['automatic', 'manual', 'cvt', 'dct'].map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                      </select></div>
                    <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">Body</Label>
                      <select value={formState.body_type} onChange={e => setFormState(p => ({ ...p, body_type: e.target.value as any }))} className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white">
                        {['suv', 'hatchback', 'sedan', 'pickup', 'van', 'coupe', 'convertible', 'wagon'].map(b => <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>)}
                      </select></div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">Engine (L)</Label><Input type="number" step="0.1" value={formState.engine_size} onChange={e => setFormState(p => ({ ...p, engine_size: Number(e.target.value) }))} className="rounded-xl border-slate-200 text-xs" /></div>
                    <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">HP</Label><Input type="number" value={formState.horsepower} onChange={e => setFormState(p => ({ ...p, horsepower: Number(e.target.value) }))} className="rounded-xl border-slate-200 text-xs" /></div>
                    <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">Nm</Label><Input type="number" value={formState.torque_nm} onChange={e => setFormState(p => ({ ...p, torque_nm: Number(e.target.value) }))} className="rounded-xl border-slate-200 text-xs" /></div>
                    <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">Drive</Label>
                      <select value={formState.drivetrain} onChange={e => setFormState(p => ({ ...p, drivetrain: e.target.value as any }))} className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white">
                        {['fwd', 'rwd', 'awd', '4wd'].map(d => <option key={d} value={d}>{d.toUpperCase()}</option>)}
                      </select></div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">Cyl.</Label><Input type="number" value={formState.cylinders} onChange={e => setFormState(p => ({ ...p, cylinders: Number(e.target.value) }))} className="rounded-xl border-slate-200 text-xs" /></div>
                    <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">Doors</Label><Input type="number" value={formState.doors} onChange={e => setFormState(p => ({ ...p, doors: Number(e.target.value) }))} className="rounded-xl border-slate-200 text-xs" /></div>
                    <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">Seats</Label><Input type="number" value={formState.seats} onChange={e => setFormState(p => ({ ...p, seats: Number(e.target.value) }))} className="rounded-xl border-slate-200 text-xs" /></div>
                    <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">Color Ext.</Label><Input value={formState.color_exterior} onChange={e => setFormState(p => ({ ...p, color_exterior: e.target.value }))} placeholder="White" className="rounded-xl border-slate-200 text-xs" /></div>
                  </div>
                </div>
              )}

              {/* ── STEP 2: Identity ── */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b pb-2">Step 2: Identity & Location</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">Stock Number</Label><Input value={formState.stock_number} onChange={e => setFormState(p => ({ ...p, stock_number: e.target.value }))} className="rounded-xl border-slate-200 text-xs bg-slate-50 font-bold" /></div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-2">VIN (Châssis)
                        {formState.vin.length >= 10 && <button type="button" onClick={handleVINDecode} className="text-blue-500 hover:text-blue-700 font-black text-[9px] flex items-center gap-1 cursor-pointer"><Zap className="h-3 w-3" /> Decode</button>}
                      </Label>
                      <Input value={formState.vin} onChange={e => { setFormState(p => ({ ...p, vin: e.target.value })); setVinDecodeResult(null) }} placeholder="KMHCN81C7PU..." className="rounded-xl border-slate-200 text-xs font-mono uppercase" />
                      {vinDecodeResult && (
                        <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-[10px] text-blue-800 font-semibold space-y-0.5">
                          {vinDecodeResult.manufacturer && <p>🏭 Manufacturer: <strong>{vinDecodeResult.manufacturer}</strong></p>}
                          {vinDecodeResult.year && <p>📅 Model Year: <strong>{vinDecodeResult.year}</strong> (auto-filled)</p>}
                          {vinDecodeResult.country && <p>🌍 Country: <strong>{vinDecodeResult.country}</strong></p>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">Matricule (Plaque)</Label><Input value={formState.registration_number} onChange={e => setFormState(p => ({ ...p, registration_number: e.target.value }))} placeholder="12345-123-16" className="rounded-xl border-slate-200 text-xs font-mono" /></div>
                    <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">Origin Country</Label><Input value={formState.origin_country} onChange={e => setFormState(p => ({ ...p, origin_country: e.target.value }))} placeholder="Germany" className="rounded-xl border-slate-200 text-xs" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">Showroom Branch</Label><Input value={formState.showroom_location} onChange={e => setFormState(p => ({ ...p, showroom_location: e.target.value }))} className="rounded-xl border-slate-200 text-xs" /></div>
                    <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">Parking Spot</Label><Input value={formState.parking_spot} onChange={e => setFormState(p => ({ ...p, parking_spot: e.target.value }))} placeholder="A-12" className="rounded-xl border-slate-200 text-xs uppercase" /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">Condition</Label>
                      <select value={formState.condition} onChange={e => setFormState(p => ({ ...p, condition: e.target.value as any }))} className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white">
                        <option value="new">New (0km)</option><option value="certified_pre_owned">CPO</option><option value="used">Used</option><option value="demo">Demo</option>
                      </select></div>
                    <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">Mileage (KM)</Label><Input type="number" value={formState.mileage} onChange={e => setFormState(p => ({ ...p, mileage: Number(e.target.value) }))} className="rounded-xl border-slate-200 text-xs" /></div>
                    <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">Prev. Owners</Label><Input type="number" value={formState.previous_owners} onChange={e => setFormState(p => ({ ...p, previous_owners: Number(e.target.value) }))} className="rounded-xl border-slate-200 text-xs" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">Import Type</Label>
                      <select value={formState.import_type} onChange={e => setFormState(p => ({ ...p, import_type: e.target.value as any }))} className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white">
                        <option value="local">Local (National)</option><option value="imported">Imported (Parallel)</option><option value="sur_command">Sur Commande</option>
                      </select></div>
                    <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">Vehicle Status</Label>
                      <select value={formState.status} onChange={e => setFormState(p => ({ ...p, status: e.target.value as any }))} className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white">
                        {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select></div>
                  </div>
                </div>
              )}

              {/* ── STEP 3: Finance ── */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b pb-2">Step 3: Pricing & Finance</h4>
                  {formState.owner_type === 'customer' && (
                    <div className="p-4 border border-purple-200 bg-purple-50/50 rounded-2xl space-y-3">
                      <Label className="text-[10px] font-bold uppercase text-purple-600 flex items-center gap-1"><User className="h-3 w-3" /> Consignment Structure</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">Commission %</Label><Input type="number" value={formState.commission_percentage} onChange={e => setFormState(p => ({ ...p, commission_percentage: Number(e.target.value), commission_flat_fee: 0 }))} className="rounded-xl border-slate-200 text-xs" /></div>
                        <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">OR Flat Fee</Label><Input type="number" value={formState.commission_flat_fee} onChange={e => setFormState(p => ({ ...p, commission_flat_fee: Number(e.target.value), commission_percentage: 0 }))} className="rounded-xl border-slate-200 text-xs" /></div>
                        <div className="space-y-1 col-span-2 border-t border-purple-100 pt-3"><Label className="text-[10px] font-bold uppercase text-slate-400">Client Payout (DZD)</Label>
                          <Input type="number" value={formState.owner_target_payout} onChange={e => {
                            const p = Number(e.target.value)
                            const fee = formState.commission_flat_fee > 0 ? formState.commission_flat_fee : (p * (formState.commission_percentage / 100))
                            setFormState(prev => ({ ...prev, owner_target_payout: p, purchase_price: p, selling_price: p + fee }))
                          }} className="rounded-xl border-slate-200 text-xs" /></div>
                      </div>
                      <div className="space-y-1 pt-1 border-t border-purple-100">
                        <Label className="text-[10px] font-bold uppercase text-purple-600">Consignment Client (Propriétaire Dépôt-Vente)</Label>
                        <select value={formState.owner_client_id} onChange={e => setFormState(p => ({ ...p, owner_client_id: e.target.value }))} className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white font-bold text-slate-700 transition-all focus:border-purple-500">
                          <option value="">-- Select Consignment Client --</option>
                          {clients.map(c => <option key={c.id} value={c.id}>{c.full_name} ({c.phone || c.email || 'No contact'})</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                  {(formState.car_type === 'sell' || formState.car_type === 'sur_command') && (
                    <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">Quantity in Stock</Label><Input type="number" min={1} value={formState.quantity} onChange={e => setFormState(p => ({ ...p, quantity: Number(e.target.value) }))} className="rounded-xl border-slate-200 text-xs font-bold" /></div>
                  )}
                  {formState.car_type === 'sur_command' && (
                    <div className="space-y-3 p-4 bg-amber-50/50 border border-amber-200 rounded-3xl">
                      <Label className="text-[10px] font-black uppercase text-amber-700 flex items-center gap-1">📦 Import Order Details & Shipping</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-500">Container</Label>
                          <select value={formState.container_id} onChange={e => setFormState(p => ({ ...p, container_id: e.target.value }))} className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white font-bold">
                            <option value="">-- No Container --</option>
                            {containers.map(c => <option key={c.id} value={c.id}>{c.container_number} ({c.status})</option>)}
                          </select></div>
                        <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-500">Tracking #</Label><Input value={formState.tracking_number} onChange={e => setFormState(p => ({ ...p, tracking_number: e.target.value }))} placeholder="MAEU123456" className="rounded-xl border-slate-200 text-xs font-mono font-bold" /></div>
                      </div>
                      <div className="space-y-1 pt-1 border-t border-amber-200/50">
                        <Label className="text-[10px] font-bold uppercase text-slate-500">Buyer Client (Client de commande)</Label>
                        <select value={formState.owner_client_id} onChange={e => setFormState(p => ({ ...p, owner_client_id: e.target.value }))} className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white font-bold text-slate-700 transition-all focus:border-amber-500">
                          <option value="">-- Unassigned (Loose Stock) --</option>
                          {clients.map(c => <option key={c.id} value={c.id}>{c.full_name} ({c.phone || c.email || 'No contact'})</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                  {formState.car_type === 'rental' ? (
                    <div className="p-4 border border-emerald-200 bg-emerald-50/50 rounded-2xl space-y-3">
                      <Label className="text-[10px] font-bold uppercase text-emerald-600 flex items-center gap-1">🚗 Location (Rental) Fleet Details</Label>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold uppercase text-slate-400">Daily Rate *</Label>
                          <Input type="number" required value={formState.rental_daily_rate} onChange={e => setFormState(p => ({ ...p, rental_daily_rate: Number(e.target.value) }))} className="rounded-xl border-slate-200 text-xs font-bold text-emerald-700 bg-white" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold uppercase text-slate-400">Weekly Rate</Label>
                          <Input type="number" value={formState.rental_weekly_rate} onChange={e => setFormState(p => ({ ...p, rental_weekly_rate: Number(e.target.value) }))} placeholder="e.g. 45000" className="rounded-xl border-slate-200 text-xs text-slate-700 bg-white" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold uppercase text-slate-400">Monthly Rate</Label>
                          <Input type="number" value={formState.rental_monthly_rate} onChange={e => setFormState(p => ({ ...p, rental_monthly_rate: Number(e.target.value) }))} placeholder="e.g. 150000" className="rounded-xl border-slate-200 text-xs text-slate-700 bg-white" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold uppercase text-slate-400">Plate Number (Matricule) *</Label>
                          <Input required={formState.car_type === 'rental'} value={formState.registration_number} onChange={e => setFormState(p => ({ ...p, registration_number: e.target.value }))} placeholder="e.g. 12493-122-16" className="rounded-xl border-slate-200 text-xs font-mono font-bold" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold uppercase text-slate-400">Security Deposit (Caution)</Label>
                           <Input type="number" value={formState.security_deposit} onChange={e => setFormState(p => ({ ...p, security_deposit: Number(e.target.value) }))} placeholder="e.g. 40000" className="rounded-xl border-slate-200 text-xs font-bold text-slate-700 bg-white" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">Purchase Price (DZD)</Label><Input type="number" value={formState.purchase_price} onChange={e => setFormState(p => ({ ...p, purchase_price: Number(e.target.value) }))} className="rounded-xl border-slate-200 text-xs" /></div>
                        <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">Selling Price (DZD) *</Label><Input type="number" required value={formState.selling_price} onChange={e => setFormState(p => ({ ...p, selling_price: Number(e.target.value) }))} className="rounded-xl border-slate-200 text-xs text-red-600 font-bold" /></div>
                      </div>
                      <div className="p-3 bg-slate-50 border rounded-2xl flex justify-between font-bold text-[11px]">
                        <div>Margin: <span className={`font-black ${formState.purchase_price > 0 && formState.selling_price > formState.purchase_price ? 'text-emerald-600' : 'text-slate-400'}`}>{formState.purchase_price > 0 ? `${Math.round(((formState.selling_price - formState.purchase_price) / formState.purchase_price) * 100)}%` : '—'}</span></div>
                        <div className="flex items-center gap-2"><Label className="text-slate-400">Negotiable?</Label><Switch checked={formState.negotiable} onCheckedChange={c => setFormState(p => ({ ...p, negotiable: c }))} /></div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-slate-400">Discount</Label>
                        <select value={formState.discount_type} onChange={e => setFormState(p => ({ ...p, discount_type: e.target.value as any }))} className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white">
                          <option value="none">No Discount</option><option value="fixed">Fixed (DZD)</option><option value="percent">Percent (%)</option><option value="trade_in_bonus">Trade-In Bonus</option>
                        </select>
                        {formState.discount_type === 'fixed' && <Input type="number" value={formState.discount_amount} onChange={e => setFormState(p => ({ ...p, discount_amount: Number(e.target.value) }))} placeholder="Amount in DZD" className="rounded-xl border-slate-200 text-xs text-amber-600 font-bold" />}
                        {formState.discount_type === 'percent' && <Input type="number" value={formState.discount_percent} onChange={e => setFormState(p => ({ ...p, discount_percent: Number(e.target.value) }))} placeholder="Percent %" className="rounded-xl border-slate-200 text-xs text-amber-600 font-bold" />}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── STEP 4: Features ── */}
              {wizardStep === 4 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b pb-2">Step 4: Features & Accessories</h4>
                  <div className="grid grid-cols-2 gap-1.5 bg-slate-50 border p-4 rounded-2xl">
                    {['ABS', 'ESP', 'Airbags (6+)', 'GPS Navigation', 'Bluetooth', 'Sunroof', 'Leather Seats', 'Parking Sensors', 'Rear Camera', 'Cruise Control', 'Lane Assist', 'Blind Spot Sensors', 'Keyless Entry', 'Panoramic Roof', 'LED Headlights', 'Alloy Wheels', 'Apple CarPlay', 'Android Auto', 'Heated Seats', 'Ventilated Seats', 'Wireless Charging', 'Night Vision', 'Head-Up Display', 'Ambient Lighting'].map(feat => (
                      <label key={feat} className="flex items-center gap-2 p-1.5 cursor-pointer rounded-lg hover:bg-white">
                        <input type="checkbox" checked={(formState.features || []).includes(feat)} onChange={() => handleFeatureToggle(feat)} className="rounded border-slate-300 w-4 h-4 accent-red-600" />
                        <span className="font-semibold text-slate-700 text-[11px]">{feat}</span>
                      </label>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">Wheels (Inches)</Label><Input type="number" value={formState.wheels_size} onChange={e => setFormState(p => ({ ...p, wheels_size: Number(e.target.value) }))} className="rounded-xl border-slate-200 text-xs" /></div>
                    <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">Tires Brand</Label><Input value={formState.tires_brand} onChange={e => setFormState(p => ({ ...p, tires_brand: e.target.value }))} placeholder="Michelin..." className="rounded-xl border-slate-200 text-xs" /></div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2"><Switch checked={formState.spare_tire_included} onCheckedChange={c => setFormState(p => ({ ...p, spare_tire_included: c }))} /><Label className="text-[10px] font-semibold">Spare Tire</Label></div>
                    <div className="flex items-center gap-2"><Switch checked={formState.jack_and_tools} onCheckedChange={c => setFormState(p => ({ ...p, jack_and_tools: c }))} /><Label className="text-[10px] font-semibold">Jack & Tools</Label></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">Color Interior</Label><Input value={formState.color_interior} onChange={e => setFormState(p => ({ ...p, color_interior: e.target.value }))} placeholder="Beige" className="rounded-xl border-slate-200 text-xs" /></div>
                    <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">Tires Condition</Label>
                      <select value={formState.tires_condition} onChange={e => setFormState(p => ({ ...p, tires_condition: e.target.value as any }))} className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white">
                        <option value="new">New</option><option value="good">Good</option><option value="fair">Fair</option><option value="needs_replacement">Replace</option>
                      </select></div>
                  </div>
                </div>
              )}

              {/* ── STEP 5: Media & Warranty ── */}
              {wizardStep === 5 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b pb-2">Step 5: Media, Warranty & Documents</h4>
                  {/* Cover Image */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-400">Cover Image</Label>
                    <div className="flex gap-3 items-start">
                      <div className="h-20 w-28 shrink-0 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                        <img src={formState.cover_image_url || PLACEHOLDER_IMG} alt="Cover" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG }} />
                      </div>
                      <div className="flex-1 space-y-2">
                        <label htmlFor="cover-upload" className={`cursor-pointer bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-200 rounded-xl px-4 py-3 flex items-center justify-center gap-2 text-xs font-bold text-slate-500 transition ${uploadingImage ? 'opacity-60 pointer-events-none' : ''}`}>
                          {uploadingImage ? <><span className="h-3.5 w-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> Uploading...</> : <><Upload className="h-4 w-4" /> Upload Photo</>}
                        </label>
                        <input id="cover-upload" type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, 'cover_image_url') }} />
                        <Input value={formState.cover_image_url} onChange={e => setFormState(p => ({ ...p, cover_image_url: e.target.value }))} placeholder="Or paste image URL..." className="rounded-xl border-slate-200 text-xs font-mono" />
                      </div>
                    </div>
                  </div>
                  {/* Gallery */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-2">Gallery Images <span className="font-normal text-slate-300">(max 10)</span></Label>
                    <div className="flex flex-wrap gap-2">
                      {(formState.images || []).map((img, i) => (
                        <div key={i} className="relative h-16 w-20 rounded-lg overflow-hidden border border-slate-200 group">
                          <img src={img} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG }} />
                          <button type="button" onClick={() => setFormState(p => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }))} className="absolute top-0.5 right-0.5 h-5 w-5 rounded bg-black/60 text-white flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition"><X className="h-3 w-3" /></button>
                        </div>
                      ))}
                      {(formState.images || []).length < 10 && (
                        <label htmlFor="gallery-upload" className="h-16 w-20 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition text-slate-400">
                          <PlusCircle className="h-5 w-5" />
                          <span className="text-[8px] font-bold mt-0.5">Add</span>
                        </label>
                      )}
                      <input id="gallery-upload" type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, 'images') }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">360° Panorama URL</Label><Input value={formState.video_360_url} onChange={e => setFormState(p => ({ ...p, video_360_url: e.target.value }))} placeholder="Equirectangular URL..." className="rounded-xl border-slate-200 text-xs font-mono" /></div>
                    <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">Video Tour Link</Label><Input value={formState.video_url} onChange={e => setFormState(p => ({ ...p, video_url: e.target.value }))} placeholder="YouTube / Drive..." className="rounded-xl border-slate-200 text-xs font-mono" /></div>
                  </div>
                  {/* Warranty */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">Warranty</Label>
                      <select value={formState.warranty_type} onChange={e => setFormState(p => ({ ...p, warranty_type: e.target.value as any }))} className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white">
                        <option value="dealer">Dealership</option><option value="manufacturer">Manufacturer</option><option value="extended">Extended</option><option value="none">No Warranty</option>
                      </select></div>
                    <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">Months</Label><Input type="number" value={formState.warranty_months} onChange={e => setFormState(p => ({ ...p, warranty_months: Number(e.target.value) }))} className="rounded-xl border-slate-200 text-xs" /></div>
                    <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">KM Limit</Label><Input type="number" value={formState.warranty_km} onChange={e => setFormState(p => ({ ...p, warranty_km: Number(e.target.value) }))} className="rounded-xl border-slate-200 text-xs" /></div>
                  </div>
                  <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">Warranty Notes</Label><Textarea value={formState.warranty_details} onChange={e => setFormState(p => ({ ...p, warranty_details: e.target.value }))} placeholder="Conditions..." className="rounded-xl border-slate-200 text-xs resize-none h-16" /></div>
                  {/* Document uploads */}
                  <div className="p-4 bg-slate-50 border rounded-2xl space-y-2">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Document Attachments</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Carte Grise', field: 'registration_card_url', icon: '📄' },
                        { label: 'Customs Clearance', field: 'customs_clearance_url', icon: '🛃' },
                        { label: 'Technical Inspection', field: 'technical_inspection_url', icon: '🔧' },
                        { label: 'Purchase Invoice', field: 'purchase_invoice_url', icon: '🧾' },
                      ].map(doc => (
                        <div key={doc.field}>
                          <label htmlFor={`doc-${doc.field}`} className="flex items-center justify-between bg-white border p-2.5 rounded-xl cursor-pointer hover:bg-slate-50 transition">
                            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">{doc.icon} {doc.label}</span>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${(formState as any)[doc.field] ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                              {(formState as any)[doc.field] ? '✓ Uploaded' : 'Attach'}
                            </span>
                          </label>
                          <input id={`doc-${doc.field}`} type="file" accept=".pdf,image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleDocumentUpload(f, doc.field) }} />
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Website visibility setting */}
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between">
                    <div>
                      <Label className="text-[11px] font-black text-blue-900 block">Afficher sur le site internet public</Label>
                      <span className="text-[9px] text-blue-700 font-semibold block">Activer pour lister ce véhicule sur le stock public de votre site vitrine.</span>
                    </div>
                    <Switch checked={formState.show_on_website !== false} onCheckedChange={c => setFormState(p => ({ ...p, show_on_website: c }))} />
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="pt-4 border-t border-slate-150 flex justify-between shrink-0">
                {wizardStep > 1 ? <Button type="button" onClick={() => setWizardStep(p => p - 1)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 border rounded-xl px-4 py-2 text-xs font-bold cursor-pointer"><ChevronLeft className="h-4 w-4 mr-1" /> Previous</Button> : <div />}
                {wizardStep < 5
                  ? <Button type="button" onClick={() => setWizardStep(p => p + 1)} className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-5 py-2 text-xs font-bold cursor-pointer">Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
                  : <Button type="submit" disabled={savingCar} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-2 text-xs font-black cursor-pointer disabled:opacity-60">
                      {savingCar ? <span className="flex items-center gap-2"><span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</span> : editingCarId ? '✓ Save Changes' : '🚀 Publish to Lot'}
                    </Button>
                }
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════ VEHICLE DETAIL DRAWER ════════════════════════ */}
      {activeCarDetail && (() => {
        const car = activeCarDetail
        const features = Array.isArray(car.features) ? car.features : []
        const gallery = Array.isArray(car.images) ? car.images : []
        const imgSrc = car.cover_image_url || PLACEHOLDER_IMG
        const displayPrice = car.final_price || car.selling_price || 0
        const sc = statusConfig[car.status] || statusConfig.available
        const financing = calculateFinancing(displayPrice)
        const bookedDays = getBookedDays()

        const drawerTabs = [
          { id: 'specs', label: '📋 Specs' },
          { id: 'gallery', label: '🖼️ Gallery' },
          { id: 'finance', label: '💰 Finance' },
          ...(car.car_type === 'rental' ? [{ id: 'calendar', label: '📅 Calendar' }] : []),
          { id: 'documents', label: '📂 Docs' },
          { id: 'history', label: '🕐 History' },
          { id: 'similar', label: '🚘 Similar' },
        ]

        const similarCars = cars.filter(c => c.id !== car.id && (c.brand === car.brand || c.body_type === car.body_type)).slice(0, 4)

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-end z-50 animate-fadeIn" onClick={() => { setActiveCarDetail(null); setIs360Active(false); setSimulatedAngle(0) }}>
            <div className="bg-white w-full max-w-2xl h-screen overflow-y-auto scrollbar-thin shadow-2xl border-l border-slate-200 rtl:border-l-0 rtl:border-r flex flex-col text-left rtl:text-right" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between shrink-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-red-600 text-white uppercase text-[9px] font-black">{car.condition === 'certified_pre_owned' ? 'CPO' : car.condition}</Badge>
                    <span className="text-[10px] text-slate-400 font-bold">{car.stock_number}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black border ${sc.bg} ${sc.text}`}>{sc.label}</span>
                  </div>
                  <h3 className="text-base font-black tracking-tight">{car.brand} {car.model} <span className="text-slate-400 font-semibold">({car.year})</span></h3>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => printWindowSticker(car)} className="bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-[10px] font-bold h-8 px-3 cursor-pointer"><Printer className="h-3 w-3 mr-1" /> Print</Button>
                  <Button onClick={() => { openEdit(car); setActiveCarDetail(null); setIs360Active(false) }} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold h-8 px-3 cursor-pointer"><Edit3 className="h-3 w-3 mr-1" /> Edit</Button>
                  <button onClick={() => { setActiveCarDetail(null); setIs360Active(false); setSimulatedAngle(0) }} className="h-8 w-8 rounded-lg hover:bg-slate-800 flex items-center justify-center cursor-pointer text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
                </div>
              </div>

              {/* Media */}
              <div className="h-72 bg-slate-950 relative overflow-hidden shrink-0">
                {is360Active ? (
                  <div className="w-full h-full relative">
                    <img src={car.video_360_url || imgSrc} alt="360" className="w-full h-full object-cover opacity-90" style={{ transform: `scale(1.25) translateX(${simulatedAngle * 0.5}px)` }} onError={e => { (e.target as HTMLImageElement).src = imgSrc }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
                      <span className="text-white text-[11px] font-bold flex items-center gap-1.5 mb-2"><RefreshCw className="h-4 w-4 animate-spin text-red-500" /> Drag to Rotate</span>
                      <input type="range" min={-400} max={400} value={simulatedAngle} onChange={e => setSimulatedAngle(Number(e.target.value))} className="w-full accent-red-600 h-1 cursor-pointer" />
                    </div>
                    <button onClick={() => setIs360Active(false)} className="absolute top-4 left-4 bg-black/60 text-white text-[10px] font-black rounded-lg px-2.5 py-1 flex items-center gap-1 border border-white/25 cursor-pointer"><XCircle className="h-3.5 w-3.5" /> Back</button>
                  </div>
                ) : (
                  <div className="w-full h-full relative">
                    <img src={imgSrc} alt={`${car.brand} ${car.model}`} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG }} />
                    {gallery.length > 0 && <div className="absolute bottom-3 left-3 flex gap-1">{gallery.slice(0, 4).map((img, i) => <img key={i} src={img} alt="" className="h-10 w-14 object-cover rounded-lg border-2 border-white/80 cursor-pointer hover:scale-110 transition" onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG }} />)}</div>}
                    {car.video_360_url && <Button onClick={() => setIs360Active(true)} className="absolute bottom-3 right-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-bold h-8"><RefreshCw className="h-3.5 w-3.5 mr-1" /> 360°</Button>}
                    {car.video_url && <a href={car.video_url} target="_blank" rel="noopener noreferrer" className="absolute top-3 right-3 bg-black/60 hover:bg-black text-white rounded-lg text-[10px] font-bold h-8 px-3 flex items-center gap-1.5 border border-white/20"><Play className="h-3.5 w-3.5" /> Video</a>}
                  </div>
                )}
              </div>

              {/* Price Banner */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-3 flex items-center justify-between shrink-0">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">{car.car_type === 'rental' ? 'Daily Rate' : 'Asking Price'}</span>
                  <span className="text-xl font-black text-red-400">{car.car_type === 'rental' ? (fmt(car.rental_daily_rate) ? `${fmt(car.rental_daily_rate)} DZD/day` : 'Sur demande') : (fmt(displayPrice) ? `${fmt(displayPrice)} DZD` : 'Prix sur demande')}</span>
                </div>
                <div className="text-right text-[10px] font-bold">
                  {car.negotiable && <div className="text-emerald-400">✓ Negotiable</div>}
                  {car.car_type === 'sur_command' && car.tracking_number && <div className="text-blue-400 flex items-center gap-1"><MapPin className="h-3 w-3" /> {car.tracking_number}</div>}
                  {(car.quantity ?? 1) > 1 && <div className="text-amber-400">Qty: {car.quantity} units</div>}
                </div>
              </div>

              {/* Tabs */}
              <div className="px-4 pt-4 border-b border-slate-200 flex gap-1 flex-wrap shrink-0 overflow-x-auto scrollbar-none">
                {drawerTabs.map(tab => (
                  <button key={tab.id} onClick={() => setActiveDrawerTab(tab.id)} className={`cursor-pointer text-[11px] font-bold pb-3 px-2 transition-colors whitespace-nowrap ${activeDrawerTab === tab.id ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>{tab.label}</button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-6 space-y-5 flex-1">

                {/* ── SPECS TAB ── */}
                {activeDrawerTab === 'specs' && (
                  <div className="animate-fadeIn space-y-5">
                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-1 text-xs">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Spec Sheet</h4>
                        <div className="divide-y divide-slate-100 font-semibold text-slate-700">
                          {[['Brand/Model', `${car.brand} ${car.model}`], ['Year', car.year], ['Variant', car.variant || 'N/A'], ['Fuel', car.fuel_type || 'N/A'], ['Transmission', car.transmission || 'N/A'], ['Engine', car.engine_size ? `${car.engine_size}L / ${car.cylinders} Cyl` : 'N/A'], ['Power', car.horsepower ? `${car.horsepower} HP / ${car.torque_nm} Nm` : 'N/A'], ['Drivetrain', car.drivetrain || 'N/A'], ['Body', car.body_type || 'N/A'], ['Seats/Doors', `${car.seats || '—'}/${car.doors || '—'}`], ['Colors', `${car.color_exterior || '—'}/${car.color_interior || '—'}`], ['Mileage', car.mileage ? `${car.mileage.toLocaleString()} km` : 'Brand New'], ['Owners', car.previous_owners || 0], ['Parking', car.parking_spot || 'N/A']].map(([l, v]) => (
                            <div key={l as string} className="py-2 flex justify-between"><span className="text-slate-400">{l}:</span><span className="capitalize text-right max-w-[50%] truncate">{String(v)}</span></div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Features</h4>
                          <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                            {features.length === 0 ? <span className="text-slate-400 italic text-xs">None listed.</span> : features.map(f => <span key={f} className="bg-slate-50 border px-2 py-1 rounded-lg flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> {f}</span>)}
                            {car.spare_tire_included && <span className="bg-slate-50 border px-2 py-1 rounded-lg flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Spare Tire</span>}
                          </div>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-2xl border text-xs space-y-1">
                          <div className="font-black text-[10px] text-slate-500 uppercase flex items-center gap-1"><Award className="h-4 w-4 text-red-500" /> Warranty</div>
                          <p className="text-slate-600 font-semibold leading-relaxed">{car.warranty_type === 'none' ? 'No warranty.' : `${car.warranty_months}mo / ${(car.warranty_km || 0).toLocaleString()}km — ${car.warranty_type}`}</p>
                          {car.warranty_details && <p className="text-[10px] text-slate-400 italic">"{car.warranty_details}"</p>}
                        </div>
                        {car.car_type === 'sur_command' && (
                          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs space-y-1">
                            <div className="font-black text-[10px] text-amber-700 uppercase">📦 Shipping Info</div>
                            {car.tracking_number && <p className="font-bold">Track: <span className="text-blue-600">{car.tracking_number}</span></p>}
                            {car.containers && <p className="text-slate-600">Container: {car.containers.container_number}</p>}
                            {car.containers?.estimated_arrival_date && <p className="text-slate-500">ETA: {new Date(car.containers.estimated_arrival_date).toLocaleDateString('fr-DZ')}</p>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── GALLERY TAB ── */}
                {activeDrawerTab === 'gallery' && (
                  <div className="animate-fadeIn space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><FileImage className="h-4 w-4" /> Photo Gallery</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2 h-56 rounded-2xl overflow-hidden bg-slate-100 border">
                        <img src={imgSrc} alt={`${car.brand} ${car.model}`} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG }} />
                      </div>
                      {gallery.map((img, i) => (
                        <div key={i} className="h-36 rounded-xl overflow-hidden bg-slate-100 border hover:shadow-md transition cursor-pointer">
                          <img src={img} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG }} />
                        </div>
                      ))}
                    </div>
                    {gallery.length === 0 && <p className="text-center text-sm text-slate-400 py-8">No additional photos. Edit the vehicle to add gallery images.</p>}
                  </div>
                )}

                {/* ── FINANCE TAB ── */}
                {activeDrawerTab === 'finance' && (
                  <div className="animate-fadeIn space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><TrendingUp className="h-4 w-4 text-red-500" /> CPA Credit Simulator</h4>
                    {displayPrice > 0 ? (
                      <>
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-bold uppercase">
                              <span className="text-slate-400">Down Payment ({calcDownPaymentPercent}%)</span>
                              <span className="text-red-600">{financing.downAmount.toLocaleString()} DZD</span>
                            </div>
                            <input type="range" min={20} max={80} step={5} value={calcDownPaymentPercent} onChange={e => setCalcDownPaymentPercent(parseInt(e.target.value))} className="w-full accent-red-600 h-1 bg-slate-200 rounded cursor-pointer" />
                          </div>
                          <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-400">Duration</Label>
                            <select value={calcMonths} onChange={e => setCalcMonths(parseInt(e.target.value))} className="w-full rounded-xl border border-slate-200 p-2 bg-white font-bold text-[11px]">
                              {[12, 24, 36, 48, 60].map(m => <option key={m} value={m}>{m} Months ({m / 12} Year{m > 12 ? 's' : ''})</option>)}
                            </select></div>
                          <div className="p-4 bg-gradient-to-br from-red-600/5 to-transparent border border-red-500/10 rounded-xl space-y-2 font-bold">
                            {[['Vehicle Price', `${fmt(displayPrice) ?? 0} DZD`], ['Down Payment', `${financing.downAmount.toLocaleString()} DZD`], ['Financed Amount', `${financing.principal.toLocaleString()} DZD`], ['Annual APR', '5.5% fixed']].map(([l, v]) => (
                              <div key={l} className="flex justify-between text-[10px] text-slate-500"><span>{l}:</span><span className={l === 'Annual APR' ? 'text-emerald-600' : ''}>{v}</span></div>
                            ))}
                            <div className="pt-2 border-t border-slate-200/50 flex justify-between items-baseline">
                              <span className="text-[10px] text-slate-400 uppercase">Monthly Installment:</span>
                              <span className="text-xl font-black text-red-600">{financing.installment.toLocaleString()} <span className="text-[10px] text-slate-400 font-bold">DZD/mo</span></span>
                            </div>
                          </div>
                        </div>
                        <div className="text-[9px] text-slate-400 bg-slate-50 border p-3 rounded-xl flex gap-1.5"><Info className="h-4 w-4 text-slate-300 shrink-0" /> Based on standard CPA & BDL Algerian auto loan rates. Not a binding quote.</div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 text-center">
                        <TrendingUp className="h-10 w-10 mb-3 text-slate-300" />
                        <span className="font-bold text-slate-500">No price set</span>
                        <span className="text-[11px] mt-1">Set a selling price to enable the calculator.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* ── CALENDAR TAB (rental only) ── */}
                {activeDrawerTab === 'calendar' && car.car_type === 'rental' && (
                  <div className="animate-fadeIn space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Calendar className="h-4 w-4 text-emerald-500" /> Rental Availability</h4>
                      <Button onClick={() => setIsAddBookingOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black h-8 gap-1.5 cursor-pointer"><PlusCircle className="h-3.5 w-3.5" /> Book</Button>
                    </div>
                    {/* Month navigation */}
                    <div className="flex items-center justify-between">
                      <button onClick={() => setCalendarMonth(d => addDays(startOfMonth(d), -1))} className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center cursor-pointer"><ChevronLeft className="h-4 w-4" /></button>
                      <span className="text-sm font-black text-slate-700">{format(calendarMonth, 'MMMM yyyy')}</span>
                      <button onClick={() => setCalendarMonth(d => addDays(endOfMonth(d), 1))} className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center cursor-pointer"><ChevronRight className="h-4 w-4" /></button>
                    </div>
                    {/* Calendar grid */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                      <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <div key={d} className="py-2 text-center text-[10px] font-black text-slate-400 uppercase">{d}</div>)}
                      </div>
                      <div className="grid grid-cols-7">
                        {(() => {
                          const monthStart = startOfMonth(calendarMonth)
                          const monthEnd = endOfMonth(calendarMonth)
                          const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
                          const startDow = (monthStart.getDay() + 6) % 7 // Mon = 0
                          const cells = []
                          for (let i = 0; i < startDow; i++) cells.push(<div key={`empty-${i}`} className="h-10 border-b border-r border-slate-100 bg-slate-50" />)
                          days.forEach(day => {
                            const isBooked = bookedDays.some(bd => isSameDay(bd, day))
                            const isToday = isSameDay(day, new Date())
                            cells.push(
                              <div key={day.toISOString()} className={`h-10 border-b border-r border-slate-100 flex items-center justify-center text-[11px] font-bold transition ${isBooked ? 'bg-red-100 text-red-700' : 'hover:bg-emerald-50 text-slate-600'} ${isToday ? 'ring-2 ring-inset ring-emerald-500' : ''}`}>
                                {format(day, 'd')}
                              </div>
                            )
                          })
                          return cells
                        })()}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500">
                      <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-red-100 border border-red-200" /> Booked</span>
                      <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded ring-2 ring-emerald-500" /> Today</span>
                    </div>
                    {/* Bookings list */}
                    {rentalLoading ? <div className="text-center text-xs text-slate-400 py-4">Loading bookings...</div> : rentalBookings.length === 0 ? (
                      <p className="text-center text-sm text-slate-400 py-4">No bookings yet. Click Book to add one.</p>
                    ) : (
                      <div className="space-y-2">
                        <h5 className="text-[10px] font-black text-slate-500 uppercase">Upcoming Bookings</h5>
                        {rentalBookings.map(b => (
                          <div key={b.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border text-xs">
                            <div>
                              <p className="font-black text-slate-800">{b.client_name} — {b.client_phone}</p>
                              <p className="text-slate-500 font-semibold">{format(parseISO(b.start_date), 'dd MMM')} → {format(parseISO(b.end_date), 'dd MMM yyyy')}</p>
                              <p className="text-emerald-600 font-bold">{b.total_amount.toLocaleString()} DZD</p>
                            </div>
                            <button onClick={() => handleDeleteBooking(b.id)} className="text-red-400 hover:text-red-600 cursor-pointer p-1"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Add booking panel */}
                    {isAddBookingOpen && (
                      <div className="p-4 border-2 border-emerald-200 bg-emerald-50/50 rounded-2xl space-y-3 animate-fadeIn">
                        <h5 className="text-[10px] font-black text-emerald-700 uppercase">New Booking</h5>
                        <div className="grid grid-cols-2 gap-2">
                          <div><Label className="text-[9px] font-bold uppercase text-slate-400">Client Name</Label><Input value={newBooking.client_name} onChange={e => setNewBooking(p => ({ ...p, client_name: e.target.value }))} className="rounded-xl border-slate-200 text-xs mt-0.5" /></div>
                          <div><Label className="text-[9px] font-bold uppercase text-slate-400">Phone</Label><Input value={newBooking.client_phone} onChange={e => setNewBooking(p => ({ ...p, client_phone: e.target.value }))} className="rounded-xl border-slate-200 text-xs mt-0.5" /></div>
                          <div><Label className="text-[9px] font-bold uppercase text-slate-400">Start Date</Label><Input type="date" value={newBooking.start_date} onChange={e => setNewBooking(p => ({ ...p, start_date: e.target.value }))} className="rounded-xl border-slate-200 text-xs mt-0.5" /></div>
                          <div><Label className="text-[9px] font-bold uppercase text-slate-400">End Date</Label><Input type="date" value={newBooking.end_date} onChange={e => setNewBooking(p => ({ ...p, end_date: e.target.value }))} className="rounded-xl border-slate-200 text-xs mt-0.5" /></div>
                          {newBooking.start_date && newBooking.end_date && (
                            <div className="col-span-2 text-[10px] font-black text-emerald-700 bg-white border border-emerald-200 rounded-xl p-2.5">
                              {differenceInDays(parseISO(newBooking.end_date), parseISO(newBooking.start_date))} days × {(car.rental_daily_rate || 0).toLocaleString()} DZD/day = {(differenceInDays(parseISO(newBooking.end_date), parseISO(newBooking.start_date)) * (car.rental_daily_rate || 0)).toLocaleString()} DZD
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => setIsAddBookingOpen(false)} className="flex-1 bg-slate-100 border rounded-xl text-xs font-bold cursor-pointer">Cancel</Button>
                          <Button onClick={handleAddBooking} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black cursor-pointer">Confirm Booking</Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── DOCUMENTS TAB ── */}
                {activeDrawerTab === 'documents' && (
                  <div className="animate-fadeIn space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><FileText className="h-4 w-4" /> Legal Documents</h4>
                    {[
                      { label: 'Carte Grise (Registration)', url: car.registration_card_url, icon: '📄' },
                      { label: 'Customs Clearance', url: car.customs_clearance_url, icon: '🛃' },
                      { label: 'Technical Inspection', url: car.technical_inspection_url, icon: '🔧' },
                      { label: 'Insurance Document', url: car.insurance_document_url, icon: '🛡️' },
                      { label: 'Purchase Invoice', url: car.purchase_invoice_url, icon: '🧾' },
                    ].map(doc => (
                      <div key={doc.label} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-2">{doc.icon} {doc.label}</span>
                        {doc.url
                          ? <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-3 py-1 rounded-lg hover:bg-emerald-100 flex items-center gap-1"><ExternalLink className="h-3 w-3" /> View</a>
                          : <span className="text-[10px] bg-slate-100 text-slate-400 font-bold px-3 py-1 rounded-lg">Not uploaded</span>}
                      </div>
                    ))}
                  </div>
                )}

                {/* ── HISTORY TAB ── */}
                {activeDrawerTab === 'history' && (
                  <div className="animate-fadeIn space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Clock className="h-4 w-4" /> Vehicle History</h4>
                    {/* Add note */}
                    <div className="flex gap-2">
                      <Input value={historyNoteText} onChange={e => setHistoryNoteText(e.target.value)} placeholder="Add a note to the history..." className="rounded-xl border-slate-200 text-xs flex-1" onKeyDown={e => { if (e.key === 'Enter') handleAddNote() }} />
                      <Button onClick={handleAddNote} disabled={!historyNoteText.trim() || addingNote} className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black cursor-pointer disabled:opacity-60 px-3">
                        {addingNote ? <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Add'}
                      </Button>
                    </div>
                    {historyLoading ? <div className="text-center text-xs text-slate-400 py-8">Loading history...</div>
                      : vehicleHistory.length === 0
                        ? <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 text-center"><Clock className="h-10 w-10 mb-3 text-slate-300" /><span className="font-bold text-slate-500">No history yet</span><span className="text-[11px] mt-1">Events will appear here when status changes or notes are added.</span></div>
                        : <div className="space-y-2">
                          {vehicleHistory.map(event => (
                            <div key={event.id} className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <div className="text-lg shrink-0">{historyIcons[event.event_type] || '📝'}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xs font-black text-slate-800 truncate">{event.title}</p>
                                  <p className="text-[9px] text-slate-400 font-semibold whitespace-nowrap">{new Date(event.created_at).toLocaleDateString('fr-DZ', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                                {event.description && <p className="text-[11px] text-slate-500 mt-0.5">{event.description}</p>}
                                {event.old_value && event.new_value && (
                                  <p className="text-[10px] mt-0.5"><span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded">{event.old_value}</span> → <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">{event.new_value}</span></p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                    }
                  </div>
                )}

                {/* ── SIMILAR TAB ── */}
                {activeDrawerTab === 'similar' && (
                  <div className="animate-fadeIn space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Car className="h-4 w-4" /> Similar Vehicles</h4>
                    {similarCars.length === 0
                      ? <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 text-center"><Car className="h-10 w-10 mb-3 text-slate-300" /><span className="font-bold text-slate-500">No similar vehicles</span><span className="text-[11px] mt-1">No other {car.brand} or {car.body_type} vehicles in inventory.</span></div>
                      : <div className="grid grid-cols-2 gap-3">
                        {similarCars.map(c => (
                          <button key={c.id} onClick={() => { setActiveCarDetail(c); setActiveDrawerTab('specs'); setIs360Active(false) }} className="text-left rtl:text-right bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition cursor-pointer group">
                            <div className="h-24 bg-slate-100 overflow-hidden"><img src={c.cover_image_url || PLACEHOLDER_IMG} alt={c.model} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG }} /></div>
                            <div className="p-3 space-y-0.5">
                              <p className="text-[11px] font-black text-slate-800">{c.brand} {c.model} {c.year}</p>
                              <p className="text-[10px] font-black text-red-600">{fmt(c.final_price || c.selling_price) ? `${fmt(c.final_price || c.selling_price)} DZD` : 'Sur demande'}</p>
                              <p className="text-[9px] text-slate-400">{c.fuel_type} · {c.transmission}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    }
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}

    </div>
  )
}
