'use client'

import React, { useState, useEffect } from 'react'
import { 
  Car, Plus, Search, Filter, Trash2, CheckCircle2, XCircle, Clock, 
  User, FileText, BadgePercent, TrendingUp, Edit3, ArrowUpRight, 
  HelpCircle, FileCheck2, Info, X, ShieldCheck, Tag, Eye, ChevronRight, 
  ChevronLeft, Award, HelpCircle as HelpIcon, Play, RefreshCw, Upload, MapPin
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { isSupabaseConnected } from '@/lib/supabase/client'
import { createClient } from '@/lib/supabase/client'

// Interfaces
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
  import_type: 'local' | 'imported' | 'sur_command'
  purchase_price: number
  selling_price: number
  negotiable: boolean
  discount_type: 'none' | 'fixed' | 'percent' | 'trade_in_bonus'
  discount_amount: number
  discount_percent: number
  final_price: number
  margin_percent: number
  fuel_type: 'petrol' | 'diesel' | 'hybrid' | 'electric' | 'lpg'
  transmission: 'manual' | 'automatic' | 'cvt' | 'dct'
  engine_size: number
  horsepower: number
  torque_nm: number
  cylinders: number
  drivetrain: 'fwd' | 'rwd' | 'awd' | '4wd'
  color_exterior: string
  color_interior: string
  doors: number
  seats: number
  body_type: 'sedan' | 'hatchback' | 'suv' | 'pickup' | 'van' | 'coupe' | 'convertible' | 'wagon'
  features: string[]
  wheels_size: number
  tires_brand: string
  tires_condition: 'new' | 'good' | 'fair' | 'needs_replacement'
  spare_tire_included: boolean
  jack_and_tools: boolean
  registration_card_url: string
  technical_inspection_url: string
  insurance_document_url: string
  customs_clearance_url: string
  purchase_invoice_url: string
  warranty_months: number
  warranty_km: number
  warranty_type: 'manufacturer' | 'dealer' | 'extended' | 'none'
  warranty_details: string
  status: 'available' | 'reserved' | 'sold' | 'in_preparation' | 'in_transit' | 'maintenance'
  showroom_location: string
  parking_spot: string
  cover_image_url: string
  images: string[]
  video_url: string
  video_360_url: string
}

const INITIAL_SALES_CARS: CarSalesItem[] = [
  {
    id: 'sales-1',
    stock_number: 'V-2026-001',
    vin: 'KMHCN81C7PU028371',
    registration_number: '01827-124-16',
    brand: 'Hyundai',
    model: 'Tucson N-Line',
    year: 2024,
    variant: 'N-Line Executive',
    version: 'Europe (France)',
    condition: 'new',
    mileage: 15,
    previous_owners: 0,
    origin_country: 'Germany',
    import_type: 'imported',
    purchase_price: 5200000,
    selling_price: 6800000,
    negotiable: true,
    discount_type: 'none',
    discount_amount: 0,
    discount_percent: 0,
    final_price: 6800000,
    margin_percent: 30,
    fuel_type: 'hybrid',
    transmission: 'automatic',
    engine_size: 1.6,
    horsepower: 230,
    torque_nm: 350,
    cylinders: 4,
    drivetrain: 'awd',
    color_exterior: 'Shadow Grey Matte',
    color_interior: 'Alcantara Red Stitched',
    doors: 5,
    seats: 5,
    body_type: 'suv',
    features: ['Panoramic Sunroof', '360° Camera', 'Adaptive Cruise Control', 'Lane Keep Assist', 'Apple CarPlay', 'Leather Seats', 'Wireless Charger', 'LED Headlights', 'Alloy Wheels (19)'],
    wheels_size: 19,
    tires_brand: 'Michelin Pilot Sport',
    tires_condition: 'new',
    spare_tire_included: true,
    jack_and_tools: true,
    registration_card_url: 'uploaded_grise.pdf',
    technical_inspection_url: '',
    insurance_document_url: '',
    customs_clearance_url: 'customs_doc_7382.pdf',
    purchase_invoice_url: '',
    warranty_months: 36,
    warranty_km: 100000,
    warranty_type: 'manufacturer',
    warranty_details: 'Standard manufacturer warranty valid in Hyundai Algeria network.',
    status: 'available',
    showroom_location: 'Cheraga Showroom, Algiers',
    parking_spot: 'Spot A-01',
    cover_image_url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600',
    images: [
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-153359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=600'
    ],
    video_url: 'https://youtube.com/watch?v=demo',
    video_360_url: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'sales-2',
    stock_number: 'V-2026-002',
    vin: 'VSSZZZKJZM0283728',
    registration_number: '12389-122-16',
    brand: 'Seat',
    model: 'Ibiza Highline',
    year: 2022,
    variant: 'Highline Beats',
    version: 'France',
    condition: 'certified_pre_owned',
    mileage: 38000,
    previous_owners: 1,
    origin_country: 'Spain',
    import_type: 'local',
    purchase_price: 2400000,
    selling_price: 3450000,
    negotiable: false,
    discount_type: 'fixed',
    discount_amount: 150000,
    discount_percent: 0,
    final_price: 3300000,
    margin_percent: 38,
    fuel_type: 'petrol',
    transmission: 'manual',
    engine_size: 1.0,
    horsepower: 110,
    torque_nm: 200,
    cylinders: 3,
    drivetrain: 'fwd',
    color_exterior: 'Desire Red Metallic',
    color_interior: 'Beats Fabric Dark Grey',
    doors: 5,
    seats: 5,
    body_type: 'hatchback',
    features: ['Beats Premium Sound System', 'Digital Cockpit', 'Keyless Entry', 'Rear Parking Sensors', 'Apple CarPlay'],
    wheels_size: 17,
    tires_brand: 'Bridgestone Turanza',
    tires_condition: 'good',
    spare_tire_included: true,
    jack_and_tools: true,
    registration_card_url: 'uploaded_grise.pdf',
    technical_inspection_url: 'inspection_ok.pdf',
    insurance_document_url: '',
    customs_clearance_url: '',
    purchase_invoice_url: '',
    warranty_months: 12,
    warranty_km: 20000,
    warranty_type: 'dealer',
    warranty_details: '1 Year dealership warranty covering engine and gearbox.',
    status: 'available',
    showroom_location: 'Cheraga Showroom, Algiers',
    parking_spot: 'Spot B-14',
    cover_image_url: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=600',
    images: [
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?auto=format&fit=crop&q=80&w=600'
    ],
    video_url: '',
    video_360_url: ''
  }
]

export default function CarSalesPage() {
  const [cars, setCars] = useState<CarSalesItem[]>(INITIAL_SALES_CARS)
  const [loading, setLoading] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState('all')
  const [priceFilter, setPriceFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState('all')
  const [fuelFilter, setFuelFilter] = useState('all')
  const [bodyFilter, setBodyFilter] = useState('all')
  const [conditionFilter, setConditionFilter] = useState('all')
  const [originFilter, setOriginFilter] = useState('all')

  // Dynamic Modals
  const [activeCarDetail, setActiveCarDetail] = useState<CarSalesItem | null>(null)
  const [isAddCarOpen, setIsAddCarOpen] = useState(false)
  const [wizardStep, setWizardStep] = useState(1)

  // Financing state
  const [calcDownPaymentPercent, setCalcDownPaymentPercent] = useState<number>(30)
  const [calcMonths, setCalcMonths] = useState<number>(60)
  const [calcAPR, setCalcAPR] = useState<number>(5.5) // Standard CPA bank rate

  // 360 View Simulator State
  const [is360Active, setIs360Active] = useState(false)
  const [simulatedAngle, setSimulatedAngle] = useState(0)

  // Add Car Wizard Form State
  const [formState, setFormState] = useState({
    stock_number: '',
    vin: '',
    registration_number: '',
    brand: '',
    model: '',
    year: 2026,
    variant: '',
    version: '',
    condition: 'new' as any,
    mileage: 0,
    previous_owners: 0,
    origin_country: '',
    import_type: 'local' as any,
    purchase_price: 0,
    selling_price: 0,
    negotiable: true,
    discount_type: 'none' as any,
    discount_amount: 0,
    discount_percent: 0,
    fuel_type: 'petrol' as any,
    transmission: 'automatic' as any,
    engine_size: 1.6,
    horsepower: 150,
    torque_nm: 250,
    cylinders: 4,
    drivetrain: 'fwd' as any,
    color_exterior: '',
    color_interior: '',
    doors: 5,
    seats: 5,
    body_type: 'suv' as any,
    features: [] as string[],
    wheels_size: 18,
    tires_brand: '',
    tires_condition: 'new' as any,
    spare_tire_included: true,
    jack_and_tools: true,
    cover_image_url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600',
    video_url: '',
    video_360_url: '',
    warranty_months: 12,
    warranty_km: 100000,
    warranty_type: 'dealer' as any,
    warranty_details: '',
    showroom_location: 'Cheraga Showroom, Algiers',
    parking_spot: ''
  })

  // Auto-generate stock number on load
  useEffect(() => {
    setFormState(prev => ({
      ...prev,
      stock_number: `V-2026-${String(cars.length + 1).padStart(3, '0')}`
    }))
  }, [cars])

  // Filter logic
  const filteredCars = cars.filter(c => {
    const matchesSearch = c.brand.toLowerCase().includes(search.toLowerCase()) || 
                          c.model.toLowerCase().includes(search.toLowerCase()) ||
                          c.stock_number.toLowerCase().includes(search.toLowerCase()) ||
                          (c.vin && c.vin.toLowerCase().includes(search.toLowerCase()))
    const matchesBrand = brandFilter === 'all' || c.brand.toLowerCase() === brandFilter.toLowerCase()
    const matchesFuel = fuelFilter === 'all' || c.fuel_type === fuelFilter
    const matchesBody = bodyFilter === 'all' || c.body_type === bodyFilter
    const matchesCondition = conditionFilter === 'all' || c.condition === conditionFilter
    const matchesOrigin = originFilter === 'all' || c.origin_country.toLowerCase() === originFilter.toLowerCase()
    
    let matchesPrice = true
    if (priceFilter === 'under_4m') matchesPrice = c.selling_price < 4000000
    else if (priceFilter === '4m_8m') matchesPrice = c.selling_price >= 4000000 && c.selling_price <= 8000000
    else if (priceFilter === 'above_8m') matchesPrice = c.selling_price > 8000000

    let matchesYear = true
    if (yearFilter === 'new_2025_2026') matchesYear = c.year >= 2025
    else if (yearFilter === 'older') matchesYear = c.year < 2025

    return matchesSearch && matchesBrand && matchesFuel && matchesBody && matchesCondition && matchesOrigin && matchesPrice && matchesYear
  })

  // Financing Calculation
  const calculateFinancing = (price: number) => {
    const downAmount = price * (calcDownPaymentPercent / 100)
    const principal = price - downAmount
    const monthlyRate = (calcAPR / 100) / 12
    const installment = (principal * monthlyRate * Math.pow(1 + monthlyRate, calcMonths)) / (Math.pow(1 + monthlyRate, calcMonths) - 1)
    return {
      downAmount: Math.round(downAmount),
      principal: Math.round(principal),
      installment: Math.round(installment)
    }
  }

  // Handle Wizard Add Form
  const handleFeatureToggle = (feature: string) => {
    setFormState(prev => {
      const alreadyHas = prev.features.includes(feature)
      return {
        ...prev,
        features: alreadyHas ? prev.features.filter(f => f !== feature) : [...prev.features, feature]
      }
    })
  }

  const handleNextStep = () => {
    setWizardStep(prev => Math.min(prev + 1, 5))
  }

  const handlePrevStep = () => {
    setWizardStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmitCar = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Calculate final price & margin percent
    const sPrice = Number(formState.selling_price)
    const pPrice = Number(formState.purchase_price) || 1
    const discAmt = Number(formState.discount_amount)
    const discPct = Number(formState.discount_percent)
    
    let fPrice = sPrice
    if (formState.discount_type === 'fixed') fPrice = sPrice - discAmt
    else if (formState.discount_type === 'percent') fPrice = sPrice - (sPrice * discPct / 100)

    const marginPct = Math.round(((sPrice - pPrice) / pPrice) * 100)

    const newCar: CarSalesItem = {
      ...formState,
      id: `sales-${Date.now()}`,
      final_price: fPrice,
      margin_percent: marginPct,
      images: [formState.cover_image_url],
      registration_card_url: 'uploaded_grise.pdf',
      technical_inspection_url: '',
      insurance_document_url: '',
      customs_clearance_url: '',
      purchase_invoice_url: '',
      status: 'available'
    }

    setCars(prev => [newCar, ...prev])
    setIsAddCarOpen(false)
    setWizardStep(1)

    // Reset FormState with standard values
    setFormState(prev => ({
      ...prev,
      vin: '',
      registration_number: '',
      brand: '',
      model: '',
      year: 2026,
      variant: '',
      version: '',
      condition: 'new',
      mileage: 0,
      previous_owners: 0,
      origin_country: '',
      purchase_price: 0,
      selling_price: 0,
      features: [],
      parking_spot: ''
    }))
  }

  const deleteCar = (id: string) => {
    setCars(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col gap-6">
      
      {/* Search & Actions Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs shrink-0">
        
        {/* Advanced Filter Suite */}
        <div className="flex flex-wrap gap-2.5 items-center w-full lg:w-auto">
          <div className="relative w-full sm:w-[220px] shrink-0">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search Brand, Model, VIN..." 
              className="pl-9 pr-4 py-2 text-xs rounded-xl border-slate-200 focus-visible:ring-red-500/20 w-full"
            />
          </div>

          <select 
            value={brandFilter} 
            onChange={e => setBrandFilter(e.target.value)}
            className="rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-slate-600 bg-slate-50 focus:ring-2 focus:ring-red-500/10 cursor-pointer"
          >
            <option value="all">All Brands</option>
            <option value="hyundai">Hyundai</option>
            <option value="seat">Seat</option>
            <option value="kia">Kia</option>
            <option value="toyota">Toyota</option>
          </select>

          <select 
            value={priceFilter} 
            onChange={e => setPriceFilter(e.target.value)}
            className="rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-slate-600 bg-slate-50 focus:ring-2 focus:ring-red-500/10 cursor-pointer"
          >
            <option value="all">Any Price</option>
            <option value="under_4m">Under 4.0M DZD</option>
            <option value="4m_8m">4.0M - 8.0M DZD</option>
            <option value="above_8m">Above 8.0M DZD</option>
          </select>

          <select 
            value={fuelFilter} 
            onChange={e => setFuelFilter(e.target.value)}
            className="rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-slate-600 bg-slate-50 focus:ring-2 focus:ring-red-500/10 cursor-pointer"
          >
            <option value="all">All Fuel</option>
            <option value="petrol">Petrol (Essence)</option>
            <option value="diesel">Diesel (Gazole)</option>
            <option value="hybrid">Hybrid</option>
            <option value="electric">Electric</option>
          </select>

          <select 
            value={bodyFilter} 
            onChange={e => setBodyFilter(e.target.value)}
            className="rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-slate-600 bg-slate-50 focus:ring-2 focus:ring-red-500/10 cursor-pointer"
          >
            <option value="all">All Bodies</option>
            <option value="suv">SUV</option>
            <option value="hatchback">Hatchback</option>
            <option value="sedan">Sedan</option>
            <option value="pickup">Pickup</option>
          </select>
        </div>

        <Button 
          onClick={() => setIsAddCarOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black gap-1.5 shadow-sm active:scale-98 w-full lg:w-auto shrink-0 py-5"
        >
          <Plus className="h-4 w-4" /> Add Sales Vehicle
        </Button>
      </div>

      {/* Grid of Sales Inventory */}
      <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pr-1 scrollbar-thin">
        {filteredCars.map((car) => {
          const savings = car.selling_price - car.final_price
          return (
            <div 
              key={car.id}
              className="bg-white border border-slate-200/80 hover:border-slate-350 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col group text-left relative"
            >
              {/* Cover Image & Status Badge */}
              <div className="h-48 bg-slate-100 relative overflow-hidden shrink-0">
                <img 
                  src={car.cover_image_url} 
                  alt={car.model}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                
                {/* Condition & Status Dots */}
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <span className="bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-xl flex items-center gap-1.5 border border-slate-100 shadow-xs">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100 animate-pulse" />
                    <span className="text-[9px] font-extrabold text-slate-700 capitalize tracking-wider leading-none mt-0.5">{car.status}</span>
                  </span>
                  <span className="bg-red-600 text-white px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider leading-none mt-0.5">
                    {car.condition}
                  </span>
                </div>

                {/* Savings / discount badge */}
                {savings > 0 && (
                  <div className="absolute bottom-3 left-3 bg-amber-500 text-white px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider">
                    Discount - {savings.toLocaleString()} DZD
                  </div>
                )}
                
                {/* Delete Vehicle */}
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteCar(car.id) }}
                  className="absolute top-3 right-3 h-8 w-8 rounded-xl bg-white/90 hover:bg-red-50 border border-slate-100 shadow-xs flex items-center justify-center text-slate-400 hover:text-red-500 transition cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Specs & Pricing Details */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                    <span>{car.stock_number}</span>
                    <span>{car.origin_country} ({car.import_type})</span>
                  </div>
                  
                  <h4 className="text-sm font-black text-slate-800 tracking-tight leading-snug">
                    {car.brand} {car.model} <span className="text-slate-400 font-semibold">{car.year}</span>
                  </h4>
                  
                  <p className="text-xs text-slate-400 font-semibold leading-none">
                    VIN: <span className="font-mono text-[10px] text-slate-500 font-black">{car.vin || 'N/A'}</span>
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Selling Price</span>
                    <div className="flex flex-col text-right">
                      {savings > 0 && (
                        <span className="text-[10px] line-through text-slate-400 font-bold">
                          {car.selling_price.toLocaleString()} DZD
                        </span>
                      )}
                      <span className="text-sm font-black text-red-600">
                        {car.final_price.toLocaleString()} DZD
                      </span>
                    </div>
                  </div>

                  {/* Quick specs labels */}
                  <div className="flex flex-wrap gap-1.5 text-[9px] font-black text-slate-500 uppercase">
                    <span className="bg-slate-50 border px-2 py-0.5 rounded-lg">{car.fuel_type}</span>
                    <span className="bg-slate-50 border px-2 py-0.5 rounded-lg">{car.transmission}</span>
                    <span className="bg-slate-50 border px-2 py-0.5 rounded-lg">{car.mileage === 0 ? 'Brand New' : `${car.mileage.toLocaleString()} km`}</span>
                    {car.previous_owners > 0 && <span className="bg-slate-50 border px-2 py-0.5 rounded-lg">{car.previous_owners} Owners</span>}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button 
                      onClick={() => setActiveCarDetail(car)}
                      className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-bold h-8 cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" /> Details & Specs
                    </Button>
                    <Button 
                      onClick={() => { setActiveCarDetail(car) }}
                      className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 rounded-xl text-[10px] font-bold h-8"
                    >
                      <TrendingUp className="h-3.5 w-3.5 mr-1" /> Calculator
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {filteredCars.length === 0 && (
          <div className="col-span-full border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center p-12 text-slate-400 text-center bg-white">
            <Car className="h-12 w-12 text-slate-350 stroke-[1.5] mb-2" />
            <span className="text-xs font-bold">No sales vehicles found matching filters</span>
            <span className="text-[10px] mt-0.5">Try clear search or adjust filters to view items.</span>
          </div>
        )}
      </div>

      {/* 5-STEP ADD SALES VEHICLE MODAL WIZARD */}
      {isAddCarOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-scaleIn text-left flex flex-col max-h-[85vh]">
            
            {/* Wizard Header */}
            <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between shrink-0">
              <div className="space-y-0.5">
                <h3 className="text-sm font-black tracking-tight flex items-center gap-1.5">
                  <Plus className="h-4.5 w-4.5 text-red-500" /> Add Showroom Sales Vehicle
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold">Publish a premium automotive asset to your live showroom catalog.</p>
              </div>
              <button 
                onClick={() => { setIsAddCarOpen(false); setWizardStep(1) }}
                className="h-8 w-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Wizard Navigation Progress */}
            <div className="bg-slate-50 border-b border-slate-200/50 px-6 py-3 flex justify-between text-[10px] font-bold uppercase text-slate-400 shrink-0">
              <span className={wizardStep >= 1 ? "text-red-600 font-black" : ""}>1. Basic Specs</span>
              <ChevronRight className="h-3 w-3 mt-0.5" />
              <span className={wizardStep >= 2 ? "text-red-600 font-black" : ""}>2. ID & Spot</span>
              <ChevronRight className="h-3 w-3 mt-0.5" />
              <span className={wizardStep >= 3 ? "text-red-600 font-black" : ""}>3. Finance</span>
              <ChevronRight className="h-3 w-3 mt-0.5" />
              <span className={wizardStep >= 4 ? "text-red-600 font-black" : ""}>4. Premium Checks</span>
              <ChevronRight className="h-3 w-3 mt-0.5" />
              <span className={wizardStep >= 5 ? "text-red-600 font-black" : ""}>5. Media & Warranty</span>
            </div>

            {/* Wizard Form Content */}
            <form onSubmit={handleSubmitCar} className="p-6 overflow-y-auto scrollbar-thin flex-1 space-y-5 text-xs text-slate-700">
              
              {/* STEP 1: BASIC SPECIFICATIONS */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b pb-2">Step 1: Basic Specifications</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-400">Brand Name *</Label>
                      <Input required value={formState.brand} onChange={e => setFormState(prev => ({ ...prev, brand: e.target.value }))} placeholder="e.g. Hyundai" className="rounded-xl border-slate-200 text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-400">Model Name *</Label>
                      <Input required value={formState.model} onChange={e => setFormState(prev => ({ ...prev, model: e.target.value }))} placeholder="e.g. Tucson N-Line" className="rounded-xl border-slate-200 text-xs" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-400">Model Year *</Label>
                      <Input type="number" required value={formState.year} onChange={e => setFormState(prev => ({ ...prev, year: Number(e.target.value) }))} className="rounded-xl border-slate-200 text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-400">Variant Finish</Label>
                      <Input value={formState.variant} onChange={e => setFormState(prev => ({ ...prev, variant: e.target.value }))} placeholder="e.g. Executive Beats" className="rounded-xl border-slate-200 text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-400">Version Origin</Label>
                      <Input value={formState.version} onChange={e => setFormState(prev => ({ ...prev, version: e.target.value }))} placeholder="e.g. France / Europe" className="rounded-xl border-slate-200 text-xs" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-400">Fuel Type</Label>
                      <select value={formState.fuel_type} onChange={e => setFormState(prev => ({ ...prev, fuel_type: e.target.value as any }))} className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-700 bg-white">
                        <option value="petrol">Petrol (Essence)</option>
                        <option value="diesel">Diesel (Gazole)</option>
                        <option value="hybrid">Hybrid</option>
                        <option value="electric">Electric</option>
                        <option value="lpg">LPG (GPL)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-400">Transmission</Label>
                      <select value={formState.transmission} onChange={e => setFormState(prev => ({ ...prev, transmission: e.target.value as any }))} className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-700 bg-white">
                        <option value="automatic">Automatic</option>
                        <option value="manual">Manual</option>
                        <option value="cvt">CVT</option>
                        <option value="dct">Dual-Clutch (DCT)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-400">Body Type</Label>
                      <select value={formState.body_type} onChange={e => setFormState(prev => ({ ...prev, body_type: e.target.value as any }))} className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-700 bg-white">
                        <option value="suv">SUV</option>
                        <option value="hatchback">Hatchback</option>
                        <option value="sedan">Sedan</option>
                        <option value="pickup">Pickup</option>
                        <option value="van">Van</option>
                        <option value="coupe">Coupe</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: IDENTIFICATION & NUMBERS */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b pb-2">Step 2: Identification & Showroom Tracking</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-400">Internal Stock Number *</Label>
                      <Input required value={formState.stock_number} onChange={e => setFormState(prev => ({ ...prev, stock_number: e.target.value }))} className="rounded-xl border-slate-200 text-xs bg-slate-50 font-bold" readOnly />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-400">VIN (Châssis Number)</Label>
                      <Input value={formState.vin} onChange={e => setFormState(prev => ({ ...prev, vin: e.target.value }))} placeholder="e.g. KMHCN81C7PU..." className="rounded-xl border-slate-200 text-xs font-mono uppercase" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-400">Matricule Algérie</Label>
                      <Input value={formState.registration_number} onChange={e => setFormState(prev => ({ ...prev, registration_number: e.target.value }))} placeholder="e.g. 12345-123-16" className="rounded-xl border-slate-200 text-xs font-mono" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-400">Origin Country</Label>
                      <Input value={formState.origin_country} onChange={e => setFormState(prev => ({ ...prev, origin_country: e.target.value }))} placeholder="e.g. Germany" className="rounded-xl border-slate-200 text-xs" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-400">Showroom Branch</Label>
                      <Input value={formState.showroom_location} onChange={e => setFormState(prev => ({ ...prev, showroom_location: e.target.value }))} className="rounded-xl border-slate-200 text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-400">Showroom Parking Spot</Label>
                      <Input value={formState.parking_spot} onChange={e => setFormState(prev => ({ ...prev, parking_spot: e.target.value }))} placeholder="e.g. Spot A-12" className="rounded-xl border-slate-200 text-xs uppercase" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-400">Condition</Label>
                      <select value={formState.condition} onChange={e => setFormState(prev => ({ ...prev, condition: e.target.value as any }))} className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-700 bg-white">
                        <option value="new">New (0km)</option>
                        <option value="certified_pre_owned">Certified CPO</option>
                        <option value="used">Used</option>
                        <option value="demo">Demo car</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-400">Mileage (KM)</Label>
                      <Input type="number" value={formState.mileage} onChange={e => setFormState(prev => ({ ...prev, mileage: Number(e.target.value) }))} className="rounded-xl border-slate-200 text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-400">Previous Owners</Label>
                      <Input type="number" value={formState.previous_owners} onChange={e => setFormState(prev => ({ ...prev, previous_owners: Number(e.target.value) }))} className="rounded-xl border-slate-200 text-xs" />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: FINANCIAL DETAILS */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b pb-2">Step 3: Pricing, Cost & Margin calculator</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-400">Purchase Price (Cost) *</Label>
                      <Input type="number" required value={formState.purchase_price} onChange={e => setFormState(prev => ({ ...prev, purchase_price: Number(e.target.value) }))} className="rounded-xl border-slate-200 text-xs font-bold" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-400">Public Selling Price *</Label>
                      <Input type="number" required value={formState.selling_price} onChange={e => setFormState(prev => ({ ...prev, selling_price: Number(e.target.value) }))} className="rounded-xl border-slate-200 text-xs font-bold text-red-600" />
                    </div>
                  </div>

                  {/* Auto Calculated Stats row */}
                  <div className="p-3.5 bg-slate-50 border rounded-2xl flex justify-between font-bold text-[11px] text-slate-600">
                    <div>
                      <span>Expected Dealer Margin: </span>
                      <span className="text-emerald-600 font-black">
                        {formState.purchase_price ? Math.round(((formState.selling_price - formState.purchase_price) / formState.purchase_price) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-slate-400">Price Negotiable?</Label>
                      <Switch checked={formState.negotiable} onCheckedChange={checked => setFormState(prev => ({ ...prev, negotiable: checked }))} />
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-400">Dealership Discount Type</Label>
                    <select value={formState.discount_type} onChange={e => setFormState(prev => ({ ...prev, discount_type: e.target.value as any }))} className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-700 bg-white">
                      <option value="none">No Discount</option>
                      <option value="fixed">Fixed Cash Discount (DZD)</option>
                      <option value="percent">Percentage Discount (%)</option>
                      <option value="trade_in_bonus">Trade-In Bonus Plan</option>
                    </select>
                  </div>

                  {formState.discount_type === 'fixed' && (
                    <div className="space-y-1.5 animate-fadeIn">
                      <Label className="text-[10px] font-bold uppercase text-slate-400">Fixed Discount Amount (DZD)</Label>
                      <Input type="number" value={formState.discount_amount} onChange={e => setFormState(prev => ({ ...prev, discount_amount: Number(e.target.value) }))} className="rounded-xl border-slate-200 text-xs font-bold text-amber-500" />
                    </div>
                  )}

                  {formState.discount_type === 'percent' && (
                    <div className="space-y-1.5 animate-fadeIn">
                      <Label className="text-[10px] font-bold uppercase text-slate-400">Discount Percent (%)</Label>
                      <Input type="number" value={formState.discount_percent} onChange={e => setFormState(prev => ({ ...prev, discount_percent: Number(e.target.value) }))} className="rounded-xl border-slate-200 text-xs font-bold text-amber-500" />
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: PREMIUM FEATURES CHECKLIST */}
              {wizardStep === 4 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b pb-2">Step 4: Premium Features Checklist</h4>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 border p-4 rounded-2xl">
                    {['ABS', 'ESP', 'Airbags (6)', 'GPS Navigation', 'Bluetooth', 'Sunroof', 'Leather Seats', 'Parking Sensors', 'Rear Camera', 'Cruise Control', 'Lane Assist', 'Blind Spot Sensors', 'Keyless Entry', 'Panoramic Roof', 'LED Headlights', 'Alloy Wheels'].map(feat => (
                      <label key={feat} className="flex items-center space-x-2.5 p-1 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={formState.features.includes(feat)}
                          onChange={() => handleFeatureToggle(feat)}
                          className="rounded border-slate-300 w-4.5 h-4.5 text-red-600 focus:ring-red-500 accent-red-600" 
                        />
                        <span className="font-semibold text-slate-700">{feat}</span>
                      </label>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-400">Wheels Size (Inches)</Label>
                      <Input type="number" value={formState.wheels_size} onChange={e => setFormState(prev => ({ ...prev, wheels_size: Number(e.target.value) }))} className="rounded-xl border-slate-200 text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-400">Tires Brand</Label>
                      <Input value={formState.tires_brand} onChange={e => setFormState(prev => ({ ...prev, tires_brand: e.target.value }))} placeholder="Michelin, Continental..." className="rounded-xl border-slate-200 text-xs" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 items-center text-[10px] font-bold text-slate-600">
                    <div className="flex items-center gap-2">
                      <Switch checked={formState.spare_tire_included} onCheckedChange={checked => setFormState(prev => ({ ...prev, spare_tire_included: checked }))} />
                      <Label className="text-[10px]">Spare Tire Included</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={formState.jack_and_tools} onCheckedChange={checked => setFormState(prev => ({ ...prev, jack_and_tools: checked }))} />
                      <Label className="text-[10px]">Jack & Tools Included</Label>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: MEDIA, WARRANTY & DOCUMENTS */}
              {wizardStep === 5 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b pb-2">Step 5: Media, Warranty & Digital Documents</h4>
                  
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-400">Cover Image URL *</Label>
                    <Input required value={formState.cover_image_url} onChange={e => setFormState(prev => ({ ...prev, cover_image_url: e.target.value }))} className="rounded-xl border-slate-200 text-xs font-mono" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-400">Interior 360° Panorama Image URL</Label>
                      <Input value={formState.video_360_url} onChange={e => setFormState(prev => ({ ...prev, video_360_url: e.target.value }))} placeholder="Equirectangular panorama link..." className="rounded-xl border-slate-200 text-xs font-mono" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-400">Video Tour Link</Label>
                      <Input value={formState.video_url} onChange={e => setFormState(prev => ({ ...prev, video_url: e.target.value }))} placeholder="Youtube / Drive link..." className="rounded-xl border-slate-200 text-xs font-mono" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-400">Warranty Type</Label>
                      <select value={formState.warranty_type} onChange={e => setFormState(prev => ({ ...prev, warranty_type: e.target.value as any }))} className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-700 bg-white">
                        <option value="dealer">Dealership Warranty</option>
                        <option value="manufacturer">Manufacturer Warranty</option>
                        <option value="extended">Extended Plan</option>
                        <option value="none">No Warranty</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-400">Warranty Duration (Months)</Label>
                      <Input type="number" value={formState.warranty_months} onChange={e => setFormState(prev => ({ ...prev, warranty_months: Number(e.target.value) }))} className="rounded-xl border-slate-200 text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-400">Warranty KM limit</Label>
                      <Input type="number" value={formState.warranty_km} onChange={e => setFormState(prev => ({ ...prev, warranty_km: Number(e.target.value) }))} className="rounded-xl border-slate-200 text-xs" />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Digital Document File Attachments</Label>
                    <div className="grid grid-cols-2 gap-3 text-[11px] font-bold text-slate-600">
                      <div className="flex items-center justify-between bg-white border p-2.5 rounded-xl">
                        <span className="flex items-center gap-1.5"><FileText className="h-4 w-4 text-red-500" /> Carte Grise *</span>
                        <Badge className="bg-emerald-500 text-white text-[9px]">Uploaded</Badge>
                      </div>
                      <div className="flex items-center justify-between bg-white border p-2.5 rounded-xl">
                        <span className="flex items-center gap-1.5"><FileText className="h-4 w-4 text-slate-400" /> Customs Clearance</span>
                        <Badge className="bg-slate-300 text-slate-600 text-[9px] hover:bg-slate-350 cursor-pointer">Attach PDF</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Wizard Action Row */}
              <div className="pt-4 border-t border-slate-150 flex justify-between shrink-0">
                {wizardStep > 1 ? (
                  <Button 
                    type="button"
                    onClick={handlePrevStep}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 border rounded-xl px-4 py-2 text-xs font-bold cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous Step
                  </Button>
                ) : (
                  <div />
                )}

                {wizardStep < 5 ? (
                  <Button 
                    type="button"
                    onClick={handleNextStep}
                    className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-5 py-2 text-xs font-bold cursor-pointer"
                  >
                    Next Step <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button 
                    type="submit"
                    className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-6 py-2 text-xs font-black shadow-md cursor-pointer"
                  >
                    Publish to Lot
                  </Button>
                )}
              </div>

            </form>
          </div>
        </div>
      )}

      {/* SALES VEHICLE DETAIL DRAWER (WITH 360 VIEWER, FINANCE CALC, SPECTABS) */}
      {activeCarDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-end z-50 animate-fadeIn">
          <div className="bg-white w-full max-w-2xl h-screen overflow-y-auto scrollbar-thin shadow-2xl border-l border-slate-200 animate-slideIn flex flex-col text-left">
            
            {/* Drawer Header */}
            <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between shrink-0">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-600 text-white uppercase text-[9px] font-black">{activeCarDetail.condition}</Badge>
                  <span className="text-[10px] text-slate-400 font-bold">{activeCarDetail.stock_number}</span>
                </div>
                <h3 className="text-sm font-black tracking-tight">{activeCarDetail.brand} {activeCarDetail.model} ({activeCarDetail.year})</h3>
              </div>
              <button 
                onClick={() => { setActiveCarDetail(null); setIs360Active(false) }}
                className="h-8 w-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Media Viewer Area (Regular or 360° Interior Simulation) */}
            <div className="h-80 bg-slate-950 relative overflow-hidden shrink-0 group">
              {is360Active ? (
                <div className="w-full h-full relative flex items-center justify-center">
                  {/* Simulated 360 Viewer */}
                  <img 
                    src={activeCarDetail.video_360_url || 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=800'}
                    alt="360 View"
                    className="w-full h-full object-cover opacity-90 transition-all duration-300"
                    style={{ transform: `scale(1.2) translateX(${simulatedAngle}px)` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex flex-col justify-end p-4">
                    <span className="text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <RefreshCw className="h-4 w-4 animate-spin-slow text-red-500" /> Drag to Rotate Simulated Interior (360°)
                    </span>
                    <input 
                      type="range" 
                      min={-400} 
                      max={400} 
                      value={simulatedAngle} 
                      onChange={e => setSimulatedAngle(Number(e.target.value))}
                      className="w-full mt-2 accent-red-600 h-1 cursor-pointer bg-white/20 rounded"
                    />
                  </div>
                </div>
              ) : (
                <div className="w-full h-full relative">
                  <img 
                    src={activeCarDetail.cover_image_url} 
                    alt={activeCarDetail.model} 
                    className="w-full h-full object-cover"
                  />
                  {activeCarDetail.video_360_url && (
                    <Button 
                      onClick={() => setIs360Active(true)}
                      className="absolute bottom-4 right-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-bold h-8"
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1" /> View 360° Interior
                    </Button>
                  )}
                </div>
              )}

              {is360Active && (
                <button 
                  onClick={() => setIs360Active(false)}
                  className="absolute top-4 left-4 bg-black/60 hover:bg-black text-white text-[10px] font-black rounded-lg px-2.5 py-1 flex items-center gap-1 border border-white/25 cursor-pointer"
                >
                  <XCircle className="h-3.5 w-3.5" /> Return to Exterior
                </button>
              )}
            </div>

            {/* Spec Tabs & Financing Details */}
            <div className="p-6 space-y-6 flex-1">
              
              {/* Tab selector */}
              <div className="border-b border-slate-200 pb-3 flex gap-4 text-xs font-bold text-slate-400">
                <span className="text-slate-900 border-b-2 border-slate-900 pb-3 cursor-pointer">Specs & Options</span>
                <span className="hover:text-slate-600 cursor-pointer">Documents</span>
                <span className="hover:text-slate-600 cursor-pointer">Dealer History</span>
                <span className="hover:text-slate-600 cursor-pointer">Similar Vehicles</span>
              </div>

              {/* Specifications Panels */}
              <div className="grid grid-cols-2 gap-6">
                
                {/* Specs List */}
                <div className="space-y-4 text-xs">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Spec sheets</h4>
                  
                  <div className="divide-y divide-slate-100 font-semibold text-slate-700">
                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-400">Brand / Model:</span>
                      <span>{activeCarDetail.brand} {activeCarDetail.model}</span>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-400">Model Year:</span>
                      <span>{activeCarDetail.year}</span>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-400">Trim Level (Variant):</span>
                      <span>{activeCarDetail.variant || 'N/A'}</span>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-400">Version spec:</span>
                      <span>{activeCarDetail.version || 'N/A'}</span>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-400">Engine / Cylinders:</span>
                      <span>{activeCarDetail.engine_size}L / {activeCarDetail.cylinders} Cyl</span>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-400">Transmission / Drive:</span>
                      <span className="uppercase">{activeCarDetail.transmission} / {activeCarDetail.drivetrain}</span>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-400">Horsepower / Torque:</span>
                      <span>{activeCarDetail.horsepower} HP / {activeCarDetail.torque_nm} Nm</span>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-400">Color Exterior / Interior:</span>
                      <span>{activeCarDetail.color_exterior} / {activeCarDetail.color_interior}</span>
                    </div>
                  </div>
                </div>

                {/* Financing Simulator */}
                <div className="bg-slate-50 border rounded-2xl p-5 space-y-4 text-xs flex flex-col justify-between">
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><TrendingUp className="h-4 w-4 text-red-500" /> CPA Auto Credit Simulator</h4>
                    <p className="text-[10px] text-slate-400 leading-normal">Configure down payment rates for local Algerian banking simulations.</p>
                  </div>

                  <div className="space-y-3.5">
                    {/* Down Payment slider */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                        <span className="text-slate-400">Down Payment ({calcDownPaymentPercent}%)</span>
                        <span className="text-red-600">
                          {calculateFinancing(activeCarDetail.final_price).downAmount.toLocaleString()} DZD
                        </span>
                      </div>
                      <input 
                        type="range" 
                        min={20} 
                        max={80} 
                        step={5} 
                        value={calcDownPaymentPercent}
                        onChange={(e) => setCalcDownPaymentPercent(parseInt(e.target.value))}
                        className="w-full accent-red-600 h-1 bg-slate-200 rounded cursor-pointer"
                      />
                    </div>

                    {/* Months selector */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-400">Installment Duration</Label>
                      <select 
                        value={calcMonths}
                        onChange={(e) => setCalcMonths(parseInt(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 p-2 bg-white font-bold text-[11px] text-slate-600"
                      >
                        <option value={12}>12 Months (1 Year)</option>
                        <option value={24}>24 Months (2 Years)</option>
                        <option value={36}>36 Months (3 Years)</option>
                        <option value={48}>48 Months (4 Years)</option>
                        <option value={60}>60 Months (5 Years)</option>
                      </select>
                    </div>

                    {/* Calculation Outputs */}
                    <div className="p-3 bg-gradient-to-br from-red-600/5 to-transparent border border-red-500/10 rounded-xl space-y-2.5 font-bold">
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Total Financed Amount:</span>
                        <span>{calculateFinancing(activeCarDetail.final_price).principal.toLocaleString()} DZD</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Fixed Annual APR:</span>
                        <span className="text-emerald-600">5.5% fixed</span>
                      </div>
                      
                      <div className="pt-2.5 border-t border-slate-200/50 flex justify-between items-baseline">
                        <span className="text-[9px] text-slate-450 uppercase">Installment:</span>
                        <span className="text-sm font-black text-red-600">
                          {calculateFinancing(activeCarDetail.final_price).installment.toLocaleString()} DZD <span className="text-[9px] font-bold text-slate-400">/mo</span>
                        </span>
                      </div>
                    </div>

                  </div>

                  <div className="text-[8px] text-slate-400 font-medium bg-white border p-2.5 rounded-xl leading-normal flex gap-1.5">
                    <Info className="h-4.5 w-4.5 text-slate-300 shrink-0 mt-0.5" />
                    <span>Calculations simulated based on standard CPA & BDL Algerian automotive lease agreements.</span>
                  </div>
                </div>

              </div>

              {/* Checklist & Features */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Premium Features & Accessories</h4>
                <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-600">
                  {activeCarDetail.features.map(f => (
                    <span key={f} className="bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> {f}
                    </span>
                  ))}
                  {activeCarDetail.spare_tire_included && (
                    <span className="bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Spare Tire Included
                    </span>
                  )}
                  {activeCarDetail.jack_and_tools && (
                    <span className="bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Jack & Tools
                    </span>
                  )}
                </div>
              </div>

              {/* Warranty section */}
              <div className="p-4 bg-slate-50 rounded-2xl border flex gap-3 text-xs">
                <Award className="h-8 w-8 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-slate-700">
                  <h5 className="font-black text-slate-800 uppercase tracking-wider text-[10px]">
                    Dealership Certified Warranty Cover
                  </h5>
                  <p className="font-semibold text-slate-600 leading-normal">
                    This vehicle is sold with {activeCarDetail.warranty_months} Months / {activeCarDetail.warranty_km.toLocaleString()} KM dealership {activeCarDetail.warranty_type} warranty.
                  </p>
                  {activeCarDetail.warranty_details && (
                    <p className="text-[10px] text-slate-450 mt-1 italic">"{activeCarDetail.warranty_details}"</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  )
}
