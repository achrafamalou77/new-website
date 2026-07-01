'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Calendar, MapPin, Users, Check, MessageCircle, ChevronLeft, ChevronRight,
  Plane, Bus, Hotel, Star, Compass, Ship, Clock, AlertTriangle, ShieldCheck,
  FileText, CreditCard, Sparkles, CheckCircle2, XCircle, Info, Heart, Utensils,
  Loader2, QrCode, UploadCloud, Smartphone 
} from 'lucide-react'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

const parseOptions = (fieldVal: any, fallbackName: string) => {
  if (!fieldVal) return [{ name: fallbackName, price: 0 }]
  if (typeof fieldVal === 'string' && fieldVal.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(fieldVal)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    } catch (e) {
      console.error('Error parsing options:', e)
    }
  }
  return [{ name: fieldVal, price: 0 }]
}

export function TripDetailModal({ isOpen, onClose, trip, agency }: { 
  isOpen: boolean, 
  onClose: () => void, 
  trip: any, 
  agency: any 
}) {
  const roomOptions = parseOptions(trip.room_type, 'Double')
  const mealOptions = parseOptions(trip.meal_plan, 'Demi-pension')

  const [selectedRoom, setSelectedRoom] = useState(roomOptions[0]?.name || '')
  const [selectedMeal, setSelectedMeal] = useState(mealOptions[0]?.name || '')

  const [activeImage, setActiveImage] = useState(0)
  const [activeTab, setActiveTab] = useState<'overview' | 'itinerary' | 'inclusions' | 'pricing' | 'documents' | 'reviews'>('overview')
  const [expandedDay, setExpandedDay] = useState<number | null>(1)

  // 1. Online Deposit Form States
  const [isOnlineBookingOpen, setIsOnlineBookingOpen] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [numTravelers, setNumTravelers] = useState(1)
  const [selectedDate, setSelectedDate] = useState('')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptName, setReceiptName] = useState('')
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false)
  const [bookingSuccessCode, setBookingSuccessCode] = useState<string | null>(null)

  if (!isOpen) return null

  // Images Gallery Resolver
  const images = trip.image_urls && trip.image_urls.length > 0 
    ? trip.image_urls 
    : ['https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1200']

  // Append gallery_images if they exist
  const allImages = [...images, ...(Array.isArray(trip.gallery_images) ? trip.gallery_images : [])].filter(Boolean)

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US') + ' DZD'
  }

  // Pre-generate / fallback itinerary if not defined
  const getItinerary = (): any[] => {
    if (Array.isArray(trip.itinerary) && trip.itinerary.length > 0) {
      return trip.itinerary
    }
    const daysCount = trip.duration_days || 7
    return Array.from({ length: daysCount }, (_, i) => ({
      day: i + 1,
      title: `Jour ${i + 1}: Exploration & Activités`,
      description: `Découvrez les plus beaux sites de la région avec notre guide local. Temps libre pour le shopping et les loisirs.`,
      activities: 'Visites libres, Déjeuner traditionnel'
    }))
  }

  const itinerary = getItinerary()

  // Pre-generate / fallback Inclusions
  const getInclusions = (): string[] => {
    if (Array.isArray(trip.included_items) && trip.included_items.length > 0) {
      return trip.included_items
    }
    return ['Transport principal (Aller-Retour)', 'Hébergement en chambre double/triple', 'Guide accompagnateur professionnel', 'Petits déjeuners quotidiens', 'Assistance 24/7']
  }

  // Pre-generate / fallback Exclusions
  const getExclusions = (): string[] => {
    if (Array.isArray(trip.excluded_items) && trip.excluded_items.length > 0) {
      return trip.excluded_items
    }
    return ['Assurance voyage internationale', 'Frais de visa (si requis)', 'Repas non mentionnés', 'Dépenses personnelles et pourboires']
  }

  const inclusions = getInclusions()
  const exclusions = getExclusions()

  const cPolicy = trip.child_policy || { age_limit: 12, discount_percent: 30, infant_policy: 'Free' }
  const gDiscounts = Array.isArray(trip.group_discounts) ? trip.group_discounts : [
    { size: '4+ personnes', discount: 0 },
    { size: '8+ personnes', discount: 5 },
    { size: '15+ personnes', discount: 10 }
  ]
  const earlyBird = trip.early_bird_discount || { percent: 5, deadline: 'Avant 30 jours' }
  const visaD = trip.visa_details || { type: 'e-Visa', processing_time: '5-7 jours', required_documents: ['Copie passeport', 'Photo'] }
  
  const getReqDocs = (): string[] => {
    if (Array.isArray(trip.required_documents) && trip.required_documents.length > 0) {
      return trip.required_documents
    }
    return ['Copie couleur du passeport', 'Copie de la carte d\'identité nationale']
  }
  const reqDocs = getReqDocs()

  const handleWhatsApp = () => {
    const phone = agency.website_settings?.phone || agency.phone || ''
    if (!phone) return
    const cleanPhone = phone.replace(/\D/g, '')
    const message = encodeURIComponent(`Salam ${agency.company_name}! Je suis très intéressé(e) par le voyage "${trip.title}" pour ${trip.destination_country || trip.destination}. Merci de m'envoyer les détails de réservation.`)
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank')
  }

  const handleCall = () => {
    const phone = agency.website_settings?.phone || agency.phone || ''
    if (!phone) return
    window.open(`tel:${phone}`, '_self')
  }

  // Calculate pricing summary for deposit based on room & meal offset
  const selectedRoomOption = roomOptions.find(r => r.name === selectedRoom) || roomOptions[0]
  const selectedMealOption = mealOptions.find(m => m.name === selectedMeal) || mealOptions[0]

  const roomOffset = selectedRoomOption ? Number(selectedRoomOption.price) : 0
  const mealOffset = selectedMealOption ? Number(selectedMealOption.price) : 0

  const singlePersonPrice = Number(trip.price) + roomOffset + mealOffset
  const totalTripPrice = singlePersonPrice * numTravelers
  const depositAmount = Math.round(totalTripPrice * 0.20) // 20% deposit

  const handleUploadReceipt = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0])
      setReceiptName(e.target.files[0].name)
    }
  }

  const handleDepositFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsBookingSubmitting(true)

    // Simulate Server Action registration call
    setTimeout(() => {
      setIsBookingSubmitting(false)
      const mockCode = `BK-${Date.now().toString().slice(-4).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`
      setBookingSuccessCode(mockCode)
    }, 1800)
  }

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 md:p-6 lg:p-8 overflow-hidden">
          
          {/* Dark Overlay backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          />
          
          {/* Premium Modal Dialog container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            className="relative w-full max-w-5xl h-full sm:h-[92vh] bg-white rounded-none sm:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col z-10 text-left font-sans"
          >
            {/* Close Floating Button */}
            <button 
              onClick={onClose}
              className="absolute top-5 right-5 z-30 p-2.5 rounded-full bg-slate-950/40 backdrop-blur-md text-white hover:bg-slate-900/60 hover:scale-105 transition-all shadow-md"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Core scrollable body wrapper */}
            <div className="overflow-y-auto flex-1 pb-24 sm:pb-0">
              
              {/* Gallery Frame Hero */}
              <div className="relative h-[38vh] sm:h-[48vh] bg-slate-900 overflow-hidden">
                <Image 
                  src={allImages[activeImage]} 
                  alt={trip.title} 
                  fill
                  sizes="100vw"
                  quality={75}
                  priority
                  className="object-cover transition-all duration-700 brightness-[0.85]"
                />
                
                {/* Image Navigation buttons */}
                {allImages.length > 1 && (
                  <>
                    <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex items-center justify-between pointer-events-none z-10">
                      <button 
                        onClick={() => setActiveImage((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))}
                        className="pointer-events-auto p-2.5 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md transition shadow-md"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setActiveImage((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))}
                        className="pointer-events-auto p-2.5 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md transition shadow-md"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                    
                    {/* Slider indicator circles */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                      {allImages.map((_, i) => (
                        <button 
                          key={i}
                          onClick={() => setActiveImage(i)}
                          className={`w-1.5 h-1.5 rounded-full transition-all ${activeImage === i ? 'w-4.5 bg-indigo-500 shadow-sm' : 'bg-white/50'}`}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* Title & Badges Overlay */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-6 sm:p-10 flex flex-col justify-end text-white text-left pointer-events-none">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="px-3 py-1 rounded-full bg-indigo-600 text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                      {trip.trip_type === 'omra' ? 'Omra / Hajj' : 'Voyage Organisé'}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold tracking-wider">
                      {trip.duration_days} Jours {trip.num_nights ? `/ ${trip.num_nights} Nuits` : ''}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-3xl font-black leading-tight max-w-3xl drop-shadow-md">
                    {trip.title}
                  </h1>
                </div>
              </div>

              {/* Content Details Layout */}
              <div className="p-6 sm:p-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
                  
                  {/* Left Side: 2/3 Area containing Quick details & tabs */}
                  <div className="lg:col-span-2 space-y-8">
                    
                    {/* Quick features specs grid bar */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-slate-50 border border-slate-200/60 rounded-3xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                          {trip.transport_type === 'Avion' ? <Plane className="w-5 h-5" /> : <Bus className="w-5 h-5" />}
                        </div>
                        <div className="text-left">
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Transport</p>
                          <p className="text-xs font-black text-slate-800">{trip.transport_details?.airline || trip.transport_type || 'Avion'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                          <Hotel className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Hôtel</p>
                          <p className="text-xs font-black text-slate-800 line-clamp-1">{trip.accommodation_type || '4★ étoiles'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                          <Utensils className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Pension</p>
                          <p className="text-xs font-black text-slate-800 line-clamp-1">
                            {trip.meal_plan && trip.meal_plan.startsWith('[') 
                              ? parseOptions(trip.meal_plan, '').map((m: any) => m.name).join(', ') 
                              : (trip.meal_plan || 'Demi-pension')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                          <Users className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Groupe</p>
                          <p className="text-xs font-black text-slate-800">{trip.group_size_min || 10} - {trip.group_size_max || 30} Pax</p>
                        </div>
                      </div>
                    </div>

                    {/* 6 Tabs Stepper selectors */}
                    <div className="flex border-b border-slate-200/80 overflow-x-auto pb-px scrollbar-none gap-6 text-xs font-bold uppercase tracking-wider">
                      {[
                        { id: 'overview', name: 'Aperçu' },
                        { id: 'itinerary', name: 'Itinéraire' },
                        { id: 'inclusions', name: 'Inclus / Exclus' },
                        { id: 'pricing', name: 'Tarification' },
                        { id: 'documents', name: 'Documents' },
                        { id: 'reviews', name: 'Avis' }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`pb-4 shrink-0 transition-colors relative ${
                            activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {tab.name}
                          {activeTab === tab.id && (
                            <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 inset-x-0 h-0.5 bg-indigo-600" />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* TAB 1: OVERVIEW */}
                    {activeTab === 'overview' && (
                      <div className="space-y-6 animate-fadeIn">
                        <div className="space-y-3">
                          <h3 className="text-lg font-black text-slate-800">À propos de cette aventure</h3>
                          <p className="text-slate-600 leading-relaxed text-sm">
                            {trip.description || "Partez l'esprit tranquille avec un package d'exception. Tous nos circuits sont pensés pour vous offrir le maximum de confort avec une prise en charge complète depuis le départ de l'Algérie."}
                          </p>
                        </div>

                        {/* Beautiful Visual Summary of the Voyage */}
                        <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                          <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <Info className="w-4 h-4 text-indigo-600" /> Fiche Technique & Organisation
                          </h4>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div className="bg-white p-3.5 border border-slate-200/50 rounded-xl flex items-start gap-3">
                              <span className="text-lg">🗺️</span>
                              <div>
                                <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Type de Voyage</p>
                                <p className="font-black text-slate-800 mt-0.5">
                                  {trip.trip_type === 'circuit_routier' ? 'Circuit Routier (Bus Tour)' :
                                   trip.trip_type === 'omra' ? 'Omra & Hajj (Sacré)' :
                                   trip.trip_type === 'free_voyage' ? 'Séjour Libre (Flight + Hotel)' :
                                   trip.trip_type === 'excursion' ? 'Excursion / Journée (Day Trip)' : 
                                   'Package Organisé Complet'}
                                </p>
                              </div>
                            </div>

                            <div className="bg-white p-3.5 border border-slate-200/50 rounded-xl flex items-start gap-3">
                              <span className="text-lg">📈</span>
                              <div>
                                <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Difficulté & Rythme</p>
                                <p className="font-black text-slate-800 mt-0.5">
                                  {trip.trip_type === 'free_voyage' ? 'Facile & Relaxant (Pace calme)' :
                                   trip.trip_type === 'excursion' ? 'Intense (1 jour chargé)' :
                                   trip.duration_days <= 5 ? 'Facile (Court séjour accessible)' :
                                   trip.duration_days <= 10 ? 'Modéré (Découvertes & Temps libre)' : 
                                   'Actif / Complet (Circuit soutenu)'}
                                </p>
                              </div>
                            </div>

                            <div className="bg-white p-3.5 border border-slate-200/50 rounded-xl flex items-start gap-3">
                              <span className="text-lg">🧑‍✈️</span>
                              <div>
                                <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Accompagnement</p>
                                <p className="font-black text-slate-800 mt-0.5">
                                  {trip.guide_included ? `Organisé avec guide accompagnateur (${trip.guide_language || 'français/arabe'})` : 'Formule libre en totale autonomie'}
                                </p>
                              </div>
                            </div>

                            <div className="bg-white p-3.5 border border-slate-200/50 rounded-xl flex items-start gap-3">
                              <span className="text-lg">✈️</span>
                              <div>
                                <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Planification</p>
                                <p className="font-black text-slate-800 mt-0.5">
                                  {trip.trip_type === 'free_voyage' ? 'Vols et hôtels réservés, journées libres' : 
                                   'Voyage clé en main, itinéraire 100% planifié et organisé'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Tunisia Route Special or Flight path overview visual */}
                        {trip.transport_type === 'Bus (Car)' && trip.transport_details?.departure_city && (
                          <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-3">
                            <h4 className="font-bold text-xs text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                              <Clock className="w-4 h-4" /> Détails Routiers du Voyage en Bus (Tunisie)
                            </h4>
                            <p className="text-xs text-slate-600">Départ de <strong>{trip.transport_details.departure_city}</strong> par bus touristique VIP de l'entreprise <strong>{trip.transport_details.bus_company || 'Partenaire Agrée'}</strong>.</p>
                            {trip.transport_details.route_stops?.length > 0 && (
                              <div className="flex flex-wrap items-center gap-2 pt-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Parcours:</span>
                                {trip.transport_details.route_stops.map((stop: string, sIdx: number) => (
                                  <span key={sIdx} className="bg-white border border-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-md font-semibold">
                                    {stop}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Omra Special highlights */}
                        {trip.trip_type === 'omra' && (
                          <div className="p-5 bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-4">
                            <h4 className="font-bold text-xs text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-amber-600" /> Programme Sacré Inclus
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div className="bg-white p-3 rounded-xl border border-slate-100 text-left">
                                <p className="text-slate-400 font-semibold">La Mecque (Mecca)</p>
                                <p className="font-black text-slate-800 mt-1">{trip.mecca_days || 10} Jours de Prière</p>
                              </div>
                              <div className="bg-white p-3 rounded-xl border border-slate-100 text-left">
                                <p className="text-slate-400 font-semibold">Médine (Medina)</p>
                                <p className="font-black text-slate-800 mt-1">{trip.medina_days || 5} Jours sacrés</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 2: ITINERARY */}
                    {activeTab === 'itinerary' && (
                      <div className="space-y-6 animate-fadeIn">
                        <h3 className="text-lg font-black text-slate-800">Le Programme du Voyage</h3>
                        <div className="relative pl-6 border-l-2 border-indigo-100 space-y-8 text-left ml-3">
                          {itinerary.map((day: any) => {
                            const isExpanded = expandedDay === day.day
                            return (
                              <div key={day.day} className="relative group">
                                <button 
                                  onClick={() => setExpandedDay(isExpanded ? null : day.day)}
                                  className={`absolute -left-[35px] top-0 w-[18px] h-[18px] rounded-full border-4 border-white transition shadow-sm shrink-0 flex items-center justify-center ${
                                    isExpanded ? 'bg-indigo-600 scale-110 shadow-md shadow-indigo-600/20' : 'bg-slate-300'
                                  }`}
                                />

                                <div className="space-y-2">
                                  <button 
                                    onClick={() => setExpandedDay(isExpanded ? null : day.day)}
                                    className="text-left font-bold text-sm text-slate-800 hover:text-indigo-600 transition flex items-center gap-2"
                                  >
                                    <span className="text-[10px] text-indigo-600 uppercase font-black tracking-wider font-mono">Jour {day.day}</span>
                                    <span>—</span>
                                    <span>{day.title}</span>
                                  </button>
                                  
                                  <AnimatePresence>
                                    {isExpanded && (
                                      <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                      >
                                        <p className="text-xs text-slate-500 leading-relaxed pl-1 pt-1">
                                          {day.description}
                                        </p>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* TAB 3: INCLUSIONS */}
                    {activeTab === 'inclusions' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeIn text-left">
                        <div className="space-y-4 p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl">
                          <h4 className="font-bold text-sm text-emerald-700 uppercase tracking-wider flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Ce qui est inclus
                          </h4>
                          <ul className="space-y-3">
                            {inclusions.map((item, i) => (
                              <li key={i} className="flex items-start gap-2.5 text-xs text-slate-600">
                                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-4 p-6 bg-red-500/5 border border-red-500/20 rounded-3xl">
                          <h4 className="font-bold text-sm text-red-700 uppercase tracking-wider flex items-center gap-2">
                            <XCircle className="w-5 h-5 text-red-500" /> Ce qui n'est pas inclus
                          </h4>
                          <ul className="space-y-3">
                            {exclusions.map((item, i) => (
                              <li key={i} className="flex items-start gap-2.5 text-xs text-slate-600">
                                <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* TAB 4: PRICING */}
                    {activeTab === 'pricing' && (
                      <div className="space-y-6 animate-fadeIn text-left">
                        <h3 className="text-lg font-black text-slate-800 font-sans tracking-tight">Tarification & Options</h3>
                        <div className="overflow-hidden border border-slate-200/60 rounded-2xl bg-white shadow-xs">
                          <table className="w-full text-left text-xs font-sans">
                            <thead className="bg-slate-50 border-b border-slate-200">
                              <tr>
                                <th className="p-3.5 font-bold text-slate-600 uppercase">Option / Catégorie</th>
                                <th className="p-3.5 font-bold text-slate-600 uppercase">Tarif (DZD)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                              <tr>
                                <td className="p-3.5 font-semibold text-slate-800">Prix de base (par personne)</td>
                                <td className="p-3.5 font-black text-indigo-600">{formatPrice(trip.price)}</td>
                              </tr>
                              
                              {/* Render Room Options dynamically */}
                              {roomOptions.length > 0 && (
                                <>
                                  <tr className="bg-slate-50/50">
                                    <td colSpan={2} className="p-2.5 pl-3.5 font-black text-[10px] text-indigo-600 uppercase tracking-wider">options de chambre</td>
                                  </tr>
                                  {roomOptions.map((room: any, rIdx: number) => (
                                    <tr key={`room-${rIdx}`}>
                                      <td className="p-3.5 pl-6">{room.name}</td>
                                      <td className={`p-3.5 font-bold ${room.price > 0 ? 'text-emerald-600' : room.price < 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                                        {room.price > 0 ? `+${formatPrice(room.price)}` : room.price < 0 ? `-${formatPrice(Math.abs(room.price))}` : 'Inclus (0 DZD)'}
                                      </td>
                                    </tr>
                                  ))}
                                </>
                              )}

                              {/* Render Meal Options dynamically */}
                              {mealOptions.length > 0 && (
                                <>
                                  <tr className="bg-slate-50/50">
                                    <td colSpan={2} className="p-2.5 pl-3.5 font-black text-[10px] text-emerald-600 uppercase tracking-wider">plans de restauration (meal plans)</td>
                                  </tr>
                                  {mealOptions.map((meal: any, mIdx: number) => (
                                    <tr key={`meal-${mIdx}`}>
                                      <td className="p-3.5 pl-6">{meal.name}</td>
                                      <td className={`p-3.5 font-bold ${meal.price > 0 ? 'text-emerald-600' : meal.price < 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                                        {meal.price > 0 ? `+${formatPrice(meal.price)}` : meal.price < 0 ? `-${formatPrice(Math.abs(meal.price))}` : 'Inclus (0 DZD)'}
                                      </td>
                                    </tr>
                                  ))}
                                </>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* TAB 5: DOCUMENTS */}
                    {activeTab === 'documents' && (
                      <div className="space-y-6 animate-fadeIn text-left">
                        <h3 className="text-lg font-black text-slate-800">Documents Administratifs</h3>
                        <div className="p-5 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-4">
                          <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <FileText className="w-4.5 h-4.5 text-slate-400" /> Dossier à Fournir
                          </h4>
                          <ul className="space-y-2.5 text-xs text-slate-600">
                            {reqDocs.map((doc, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                                <span>{doc}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* TAB 6: REVIEWS */}
                    {activeTab === 'reviews' && (
                      <div className="space-y-6 animate-fadeIn text-left">
                        <h3 className="text-lg font-black text-slate-800">Témoignages</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            { name: 'Kamel, Alger', rating: 5, comment: 'Organisation parfaite pour la Turquie. L\'équipe était super à l\'écoute!' },
                            { name: 'Amel, Constantine', rating: 5, comment: 'Voyage très bien encadré. Je recommande fortement!' }
                          ].map((rev, rIdx) => (
                            <div key={rIdx} className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl text-left space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-slate-800">{rev.name}</span>
                                <div className="flex text-amber-400 shrink-0">
                                  {Array.from({ length: rev.rating }, (_, i) => (
                                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                                  ))}
                                </div>
                              </div>
                              <p className="text-slate-500 text-xs italic leading-relaxed">"{rev.comment}"</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Side Sticky Actions CTA Panel */}
                  <div className="lg:col-span-1">
                    <div className="sticky top-6 bg-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-200/80 space-y-6">
                      <div className="text-left">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">À partir de</p>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{formatPrice(trip.price)}</h2>
                      </div>

                      <div className="space-y-3 pt-2">
                        {/* Book Online button trigger */}
                        <button 
                          onClick={() => setIsOnlineBookingOpen(true)}
                          className="w-full py-3.5 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-md hover:bg-slate-800 transition flex items-center justify-center gap-2 hover:scale-[1.01]"
                        >
                          <CreditCard className="w-4.5 h-4.5" />
                          Book Online (Payer l'acompte)
                        </button>

                        <button 
                          onClick={handleWhatsApp}
                          className="w-full py-3.5 rounded-xl bg-[#25D366] text-white font-bold text-xs shadow-md hover:bg-[#1ebd53] transition flex items-center justify-center gap-2 hover:scale-[1.01]"
                        >
                          <MessageCircle className="w-5 h-5 fill-white" />
                          Réserver via WhatsApp
                        </button>

                        <button 
                          onClick={handleCall}
                          className="w-full py-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition flex items-center justify-center gap-2 hover:scale-[1.01]"
                        >
                          Appeler notre Agence
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* Mobile sticky actions footer */}
            <div className="sm:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 p-4 flex items-center justify-between gap-4 z-40 shadow-lg">
              <div className="text-left">
                <p className="text-[9px] text-slate-400 font-bold uppercase">Tarif</p>
                <p className="text-base font-black text-indigo-650 text-indigo-600">{formatPrice(trip.price)}</p>
              </div>
              <div className="flex gap-2 flex-1 justify-end">
                <button 
                  onClick={() => setIsOnlineBookingOpen(true)}
                  className="px-4 py-3 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  Book Online
                </button>
                <button 
                  onClick={handleWhatsApp}
                  className="px-4 py-3 bg-[#25D366] text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  WhatsApp
                </button>
              </div>
            </div>

          </motion.div>
        </div>
      </AnimatePresence>

      {/* Online Deposit Booking Modal Form Sheet */}
      <AnimatePresence>
        {isOnlineBookingOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 overflow-y-auto bg-slate-950/80 backdrop-blur-md">
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-[2.5rem] w-full max-w-lg p-6 sm:p-8 border border-slate-200 shadow-2xl relative text-right overflow-y-auto max-h-[90vh]"
            >
              <button 
                onClick={() => {
                  setIsOnlineBookingOpen(false)
                  setBookingSuccessCode(null)
                }}
                className="absolute top-5 left-5 p-2 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>

              {/* SUCCESS VIEW SCREEN */}
              {bookingSuccessCode ? (
                <div className="text-center py-10 space-y-6">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 border border-emerald-150 rounded-full flex items-center justify-center mx-auto shadow-md animate-bounce">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-xl font-black text-slate-800">Acompte Envoyé avec Succès !</h2>
                    <p className="text-xs text-slate-500">Votre reçu de paiement CCP a été enregistré sous la référence de réservation :</p>
                    <span className="inline-block bg-indigo-50 border border-indigo-150 text-indigo-650 text-xs font-black px-4 py-2 rounded-xl mt-1 tracking-wider font-mono">
                      {bookingSuccessCode}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Nos agents financiers valideront votre transaction sous <strong>2 heures maximum</strong>. Vous recevrez un reçu officiel et un SMS de confirmation.
                  </p>

                  <Button 
                    onClick={() => {
                      setIsOnlineBookingOpen(false)
                      setBookingSuccessCode(null)
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs px-8 py-2.5 mt-4"
                  >
                    Fermer l'espace
                  </Button>
                </div>
              ) : (
                /* DEPOSIT SUBMIT FORM */
                <form onSubmit={handleDepositFormSubmit} className="space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-slate-800">Réservation & Paiement d'Acompte</h2>
                    <p className="text-xs text-slate-400 mt-1">Sécurisez votre place immédiatement en téléchargeant votre reçu de versement (20%).</p>
                  </div>

                  {/* Form inputs */}
                  <div className="space-y-3 text-right">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-slate-500">Nom Complet (Voyageur Principal)</Label>
                      <Input 
                        required
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder="E.g., Amalou Achraf"
                        className="rounded-xl border-slate-200 text-xs bg-slate-50"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-500">Numéro de Téléphone</Label>
                        <Input 
                          required
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          placeholder="E.g., 0550123456"
                          className="rounded-xl border-slate-200 text-xs bg-slate-50"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-500">Adresse Email</Label>
                        <Input 
                          type="email"
                          required
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="E.g., achraf@gmail.com"
                          className="rounded-xl border-slate-200 text-xs bg-slate-50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-500">Nombre de Voyageurs</Label>
                        <Input 
                          type="number"
                          min={1}
                          max={10}
                          required
                          value={numTravelers}
                          onChange={e => setNumTravelers(Number(e.target.value))}
                          className="rounded-xl border-slate-200 text-xs bg-slate-50"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-500">Date de départ souhaitée</Label>
                        <select 
                          required
                          value={selectedDate}
                          onChange={e => setSelectedDate(e.target.value)}
                          className="flex h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-650 focus:outline-none"
                        >
                          <option value="">Sélectionner une date</option>
                          <option value="15 Juillet 2026">15 Juillet 2026</option>
                          <option value="01 Août 2026">01 Août 2026</option>
                          <option value="20 Août 2026">20 Août 2026</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Room Type Selection */}
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-500">Option de Chambre</Label>
                        <select 
                          required
                          value={selectedRoom}
                          onChange={e => setSelectedRoom(e.target.value)}
                          className="flex h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-650 focus:outline-none font-medium"
                        >
                          {roomOptions.map((room: any, idx: number) => {
                            const offsetPrice = Number(room.price)
                            const offsetStr = offsetPrice > 0 ? ` (+${offsetPrice.toLocaleString()} DZD)` : offsetPrice < 0 ? ` (${offsetPrice.toLocaleString()} DZD)` : ''
                            return (
                              <option key={idx} value={room.name}>
                                {room.name}{offsetStr}
                              </option>
                            )
                          })}
                        </select>
                      </div>

                      {/* Meal Plan Selection */}
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-500">Type de Pension (Meal Plan)</Label>
                        <select 
                          required
                          value={selectedMeal}
                          onChange={e => setSelectedMeal(e.target.value)}
                          className="flex h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-650 focus:outline-none font-medium"
                        >
                          {mealOptions.map((meal: any, idx: number) => {
                            const offsetPrice = Number(meal.price)
                            const offsetStr = offsetPrice > 0 ? ` (+${offsetPrice.toLocaleString()} DZD)` : offsetPrice < 0 ? ` (${offsetPrice.toLocaleString()} DZD)` : ''
                            return (
                              <option key={idx} value={meal.name}>
                                {meal.name}{offsetStr}
                              </option>
                            )
                          })}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Pricing Deposit math */}
                  <div className="p-4 bg-slate-50 border border-slate-250/60 rounded-2xl flex justify-between items-center text-xs">
                    <div className="text-right">
                      <span className="text-[9px] text-slate-450 block font-bold uppercase">Total Tarif</span>
                      <span className="text-sm font-bold text-slate-800">{formatPrice(totalTripPrice)}</span>
                    </div>
                    
                    <div className="text-left">
                      <span className="text-[9px] text-emerald-600 block font-black uppercase">Acompte à régler (20%)</span>
                      <span className="text-base font-black text-indigo-650 text-indigo-600">{formatPrice(depositAmount)}</span>
                    </div>
                  </div>

                  {/* Scanned CCP & BaridiMob details */}
                  <div className="border border-slate-200/80 rounded-2xl p-4 bg-indigo-50/20 text-right space-y-3">
                    <h4 className="text-[10px] font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                      <QrCode className="h-4 w-4" /> Scan to Pay BaridiMob & CCP
                    </h4>
                    
                    <div className="flex gap-4 items-center">
                      {/* Premium CSS-based simulated QR Scanner code */}
                      <div className="h-16 w-16 bg-white border border-slate-200 rounded-xl p-1 shrink-0 flex flex-wrap justify-between items-center relative select-none">
                        <div className="w-6 h-6 border-2 border-slate-900 border-r-0 border-b-0 absolute top-1 left-1" />
                        <div className="w-6 h-6 border-2 border-slate-900 border-l-0 border-b-0 absolute top-1 right-1" />
                        <div className="w-6 h-6 border-2 border-slate-900 border-r-0 border-t-0 absolute bottom-1 left-1" />
                        <div className="w-6 h-6 border-2 border-slate-900 border-l-0 border-t-0 absolute bottom-1 right-1" />
                        <div className="w-8 h-8 bg-slate-900 rounded mx-auto flex items-center justify-center text-[8px] font-bold text-white uppercase">CCP</div>
                      </div>
                      
                      <div className="text-xs text-slate-650 space-y-0.5">
                        <p><strong>Titulaire:</strong> Amalou Achraf (Algérie)</p>
                        <p><strong>Compte CCP:</strong> 0021876532 <strong>Clé:</strong> 89</p>
                        <p className="text-[10px] text-slate-400"><strong>RIP / BaridiMob:</strong> 00799999002187653289</p>
                      </div>
                    </div>
                  </div>

                  {/* Receipt photo screenshot upload */}
                  <div className="space-y-1.5 text-right">
                    <Label className="text-[10px] font-bold text-slate-500">Uploader votre reçu de versement (Fichier reçu / Capture)</Label>
                    <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-4 bg-slate-50 hover:bg-slate-100 transition text-center cursor-pointer flex flex-col items-center justify-center">
                      <input 
                        type="file" 
                        accept="image/*,application/pdf"
                        required
                        onChange={handleUploadReceipt}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <UploadCloud className="h-8 w-8 text-slate-400 mb-1.5" />
                      <span className="text-xs font-semibold text-slate-600 block">
                        {receiptName || "Glissez ou cliquez pour uploader le reçu"}
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">Format JPG, PNG, PDF max 5Mo</span>
                    </div>
                  </div>

                  {/* Form Submission button triggers */}
                  <Button 
                    type="submit"
                    disabled={isBookingSubmitting}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs py-3.5 flex items-center justify-center gap-2"
                  >
                    {isBookingSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Transmission en cours...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Confirmer mon dépôt & réserver</span>
                      </>
                    )}
                  </Button>
                </form>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
