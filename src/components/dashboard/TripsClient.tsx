'use client'

import { useState, useMemo } from 'react'
import { Trip } from '@/lib/mock-data'
import { createTrip, updateTrip, deleteTrip } from '@/app/actions/trips'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { 
  Plus, Edit2, Trash2, Search, Loader2, MapPin, CalendarDays, DollarSign,
  Plane, Bus, Hotel, Utensils, BookOpen, HeartHandshake, Image as LucideImage, Eye, 
  Compass, Sparkles, ChevronRight, ChevronLeft, User, FileText, CheckCircle, 
  Calendar, Wifi, AlertCircle, ShieldAlert, Award, Star, Info, Copy, Play, Video,
  SlidersHorizontal, RefreshCw, Film, X, Layers
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { hasPermission } from '@/lib/permissions'
import Image from 'next/image'
import { z } from 'zod'

const tripSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  destination: z.string().min(2, "Destination must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.number().min(1, "Price must be greater than 0"),
  duration_days: z.number().min(1, "Duration must be at least 1 day"),
  image_urls: z.any(),
  is_active: z.boolean()
})

// Premium Premade Algerian Catalog Templates
const PREMADE_TEMPLATES = [
  {
    name: '🇹🇷 Turquie Élite (9 Jours)',
    title: 'Package Turquie Élite: Istanbul & Cappadoce Voyage Complet',
    destination: 'Turkey',
    destination_country: 'Turkey',
    destination_cities: 'Istanbul, Cappadocia',
    price: '120000',
    duration_days: '9',
    num_nights: '8',
    trip_type: 'package',
    transport_type: 'Avion',
    airline: 'Air Algérie',
    departure_airport: 'Algiers (ALG)',
    arrival_airport: 'Istanbul (IST)',
    flight_type: 'Direct',
    baggage_allowance: '23kg',
    flight_class: 'Economy',
    accommodation_type: 'Hôtel 4 étoiles',
    hotel_name: 'Golden Tulip Istanbul',
    room_type: 'Double',
    meal_plan: 'Demi-pension',
    hotel_location: 'Taksim, Istanbul',
    included_items: 'Vol Aller-Retour, Hôtel 4*, Petit Déjeuner et Dîner, Guide, Excursions',
    excluded_items: 'Visa consulaire, Dépenses personnelles, Assurances',
    guide_included: true,
    guide_language: 'Mixed',
    group_size_min: '10',
    group_size_max: '30',
    required_documents: ['Passport copy', 'ID card copy', 'Photos (fond blanc)'],
    visa_required: true,
    visa_type: 'Consulaire',
    visa_processing_time: '7 days',
    visa_required_docs: 'Passeport, Photo, Extrait de rôle',
    image_urls: 'https://images.unsplash.com/photo-1527838832700-5059252407fa?auto=format&fit=crop&w=800&q=80',
    gallery_images: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80',
    is_active: true,
    itinerary: [
      { day: 1, title: 'Arrivée à Istanbul', description: 'Accueil à l\'aéroport et transfert vers l\'hôtel.', activities: 'Check-in, Dîner libre' },
      { day: 2, title: 'Visite guidée d\'Istanbul', description: 'Visite de la Mosquée Bleue, Sainte-Sophie et le Grand Bazar.', activities: 'Visite historique' },
      { day: 3, title: 'Croisière sur le Bosphore', description: 'Découverte d\'Istanbul depuis l\'eau suivie d\'un après-midi shopping.', activities: 'Bateau, Shopping' },
      { day: 4, title: 'Transfert vers la Cappadoce', description: 'Vol intérieur ou bus confort vers la région magique.', activities: 'Transfert' },
      { day: 5, title: 'Vol en Montgolfière & Cheminées de Fée', description: 'Décollage matinal en montgolfière au-dessus des cheminées de fées.', activities: 'Montgolfière, Randonnée' },
      { day: 6, title: 'Villes Souterraines & Göreme', description: 'Découverte des cités souterraines historiques et du musée de Göreme.', activities: 'Visite guidée' },
      { day: 7, title: 'Retour vers Istanbul', description: 'Voyage de retour et fin de journée libre pour les souvenirs.', activities: 'Retour' },
      { day: 8, title: 'Journée Shopping Élite', description: 'Visite des plus grands malls d\'Istanbul (Cevahir, Mall of Istanbul).', activities: 'Shopping' },
      { day: 9, title: 'Départ', description: 'Transfert vers l\'aéroport et vol de retour vers Alger.', activities: 'Vol retour' }
    ]
  },
  {
    name: '🇹🇳 Tunisie Relax (3 Jours)',
    title: 'Seaside Tunisie Relax: Hammamet Évasion Plage',
    destination: 'Tunisia',
    destination_country: 'Tunisia',
    destination_cities: 'Hammamet, Sousse',
    price: '35000',
    duration_days: '3',
    num_nights: '2',
    trip_type: 'circuit_routier',
    transport_type: 'Bus (Car)',
    bus_company: 'Sahara Voyage',
    departure_city: 'Algiers',
    route_stops: 'Setif, Constantine, Annaba, Tunis',
    seat_type: 'Standard',
    departure_time: '06:00',
    accommodation_type: 'Hôtel 3 étoiles',
    hotel_name: 'Hotel Samira Club',
    room_type: 'Double',
    meal_plan: 'Demi-pension',
    hotel_location: 'Yasmine Hammamet',
    included_items: 'Bus Confort Aller-Retour, Hôtel 3*, Demi-pension, Accès Plage Privée',
    excluded_items: 'Repas de midi, Activités nautiques payantes',
    guide_included: true,
    guide_language: 'Mixed',
    group_size_min: '15',
    group_size_max: '50',
    required_documents: ['Passport copy', 'ID card copy'],
    visa_required: false,
    image_urls: 'https://images.unsplash.com/photo-1582610116397-edb318620f90?auto=format&fit=crop&w=800&q=80',
    gallery_images: '',
    is_active: true,
    itinerary: [
      { day: 1, title: 'Départ d\'Alger & Voyage de Nuit', description: 'Départ tôt le matin en bus grand confort vers la frontière tunisienne.', activities: 'Voyage en bus' },
      { day: 2, title: 'Arrivée à Hammamet & Détente', description: 'Installation à l\'hôtel, plage et détente au bord de la piscine.', activities: 'Plage, Animation' },
      { day: 3, title: 'Sousse Shopping & Voyage Retour', description: 'Matinée shopping à Sousse puis départ de retour vers l\'Algérie.', activities: 'Shopping, Retour' }
    ]
  },
  {
    name: '🕋 Omra Prestige (15 Jours)',
    title: 'Omra Prestige Confort: 10J Mecque / 5J Médine Voyage Sacré',
    destination: 'Saudi Arabia',
    destination_country: 'Saudi Arabia',
    destination_cities: 'Mecca, Medina',
    price: '280000',
    duration_days: '15',
    num_nights: '14',
    trip_type: 'omra',
    transport_type: 'Avion',
    airline: 'Saudia',
    departure_airport: 'Algiers (ALG)',
    arrival_airport: 'Jeddah (JED)',
    flight_type: 'Direct',
    baggage_allowance: '46kg (2 bagages)',
    flight_class: 'Economy',
    accommodation_type: 'Hôtel 5 étoiles',
    hotel_name: 'Swissôtel Makkah / Pullman Zamzam',
    room_type: 'Quadruple',
    meal_plan: 'Demi-pension',
    hotel_location: 'Près du Haram Makkah',
    included_items: 'Vol Direct, Visa Omra, Hôtels 5* proches Haram, Transferts VIP, Tenue d\'Ihram',
    excluded_items: 'Dépenses personnelles, Sacrifices (Hady)',
    guide_included: true,
    guide_language: 'Arabic',
    group_size_min: '20',
    group_size_max: '40',
    required_documents: ['Passport copy', 'Photos (fond blanc)', 'Family record book'],
    visa_required: true,
    visa_type: 'e-Visa',
    visa_processing_time: '3 days',
    visa_required_docs: 'Copie Passeport, Photo',
    image_urls: 'https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?auto=format&fit=crop&w=800&q=80',
    gallery_images: '',
    is_active: true,
    ihram_included: true,
    mecca_days: 10,
    medina_days: 5,
    group_prayer_schedule: 'Prières collectives quotidiennes au Haram, Visite de Mount Uhud, Mosque Quba à Médine et Ziyarat à la Mecque.',
    itinerary: [
      { day: 1, title: 'Départ d\'Alger & Arrivée en Arabie Saoudite', description: 'Vol vers Jeddah, transfert en bus VIP vers l\'hôtel à la Mecque, installation et accomplissement de la Omra.', activities: 'Vol direct, Omra' },
      { day: 2, title: 'Repos & Prières au Haram', description: 'Journée consacrée aux prières et dévotions au Masjid al-Haram.', activities: 'Prières libres' },
      { day: 3, title: 'Ziyarat de la Mecque', description: 'Visite guidée des lieux saints (Mina, Arafat, Jabal al-Nour).', activities: 'Visite guidée' },
      { day: 4, title: 'Dévotions au Haram', description: 'Prière du vendredi et activités religieuses.', activities: 'Prière collective' },
      { day: 5, title: 'Cours d\'orientation spirituelle', description: 'Conférence du guide sur la vie du Prophète.', activities: 'Conférence' },
      { day: 6, title: 'Journée spirituelle libre', description: 'Dévotion personnelle et prières au Haram.', activities: 'Prières' },
      { day: 7, title: 'Visite de musées de la Mecque', description: 'Visite facultative du musée de l\'architecture des deux Saintes Mosquées.', activities: 'Musée' },
      { day: 8, title: 'Tawaf facultatif', description: 'Tawaf al-Wadaa ou Omra facultative.', activities: 'Tawaf' },
      { day: 9, title: 'Préparation transfert', description: 'Dernière journée pleine à la Mecque.', activities: 'Prières' },
      { day: 10, title: 'Transfert vers Médine', description: 'Voyage en bus confort vers la ville illuminée de Médine, check-in et salutations au Prophète.', activities: 'Transfert Médine' },
      { day: 11, title: 'Prière au Rawdah Shareef', description: 'Prière programmée dans la noble Rawdah de la Mosquée du Prophète.', activities: 'Rawdah' },
      { day: 12, title: 'Ziyarat de Médine', description: 'Visite de la Mosquée de Quba, le mont Uhud et la Mosquée des deux Qiblas.', activities: 'Visite guidée' },
      { day: 13, title: 'Journée libre à Médine', description: 'Prières libres et méditations.', activities: 'Prières' },
      { day: 14, title: 'Achat de souvenirs & Dattes', description: 'Visite des célèbres marchés de dattes de Médine.', activities: 'Shopping dattes' },
      { day: 15, title: 'Départ vers Alger', description: 'Transfert vers l\'aéroport de Médine et vol direct de retour.', activities: 'Vol retour' }
    ]
  }
]

// Safely parse room type or meal plan options (handling serialized JSON arrays or raw fallback strings)
const parseOptions = (fieldVal: any, fallbackName: string) => {
  if (!fieldVal) return [{ name: fallbackName, price: 0 }]
  if (typeof fieldVal === 'string' && fieldVal.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(fieldVal)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    } catch (e) {
      console.error('Error parsing field option:', e)
    }
  }
  return [{ name: fieldVal, price: 0 }]
}

export function TripsClient({ initialTrips, userRole }: { initialTrips: any[], userRole: string }) {
  const [trips, setTrips] = useState<any[]>(initialTrips)
  const canManageTrips = hasPermission(userRole, 'catalog:manage')
  const initialMaxPrice = Math.max(500000, ...initialTrips.map((trip: any) => Number(trip.price || 0)))
  
  // Advanced Filter States
  const [search, setSearch] = useState('')
  const [destinationFilter, setDestinationFilter] = useState('all')
  const [maxPrice, setMaxPrice] = useState<number>(initialMaxPrice)
  const [minDuration, setMinDuration] = useState<number>(1)
  const [maxDuration, setMaxDuration] = useState<number>(20)
  const [selectedTransports, setSelectedTransports] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft'>('all')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [editingTrip, setEditingTrip] = useState<any | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Wizard Step State
  const [activeStep, setActiveStep] = useState(1)

  // Tutorial Video Modal State
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)
  
  // Show template import dropdown panel
  const [showTemplatesDropdown, setShowTemplatesDropdown] = useState(false)

  // Form State with comprehensive Algerian fields
  const [formData, setFormData] = useState({
    title: '',
    destination: '',
    description: '',
    price: '',
    duration_days: '',
    image_urls: '',
    is_active: true,

    trip_type: 'package',
    destination_country: 'Tunisia',
    destination_cities: '',
    trip_language: 'Mixed',
    season_period: 'Summer',
    trip_code: '',

    transport_type: 'Avion',
    airline: 'Air Algérie',
    departure_airport: 'Algiers (ALG)',
    arrival_airport: '',
    flight_type: 'Direct',
    baggage_allowance: '23kg',
    flight_class: 'Economy',
    flight_number: '',
    round_trip: true,

    bus_company: '',
    departure_city: 'Algiers',
    route_stops: '',
    seat_type: 'Standard',
    departure_time: '08:00',

    vehicle_type: 'Van (7 seats)',
    driver_included: true,
    fuel_included: true,

    accommodation_type: 'Hôtel 4 étoiles',
    hotel_name: '',
    room_type: 'Double',
    meal_plan: 'Demi-pension',
    room_types: [] as Array<{ name: string; price: number }>,
    meal_plans: [] as Array<{ name: string; price: number }>,
    num_nights: '',
    hotel_location: '',

    itinerary: [] as Array<{ day: number; title: string; description: string; activities: string }>,
    included_items: 'Transport, Hébergement, Guide',
    excluded_items: 'Frais de visa, Dépenses personnelles',
    guide_included: true,
    guide_language: 'Arabic',
    group_size_min: '10',
    group_size_max: '30',

    child_policy_age_limit: '12',
    child_policy_discount: '30',
    child_policy_infant: 'Free',
    single_supplement: '25000',
    group_discount_4: '0',
    group_discount_8: '5',
    group_discount_15: '10',
    early_bird_discount_percent: '5',
    early_bird_deadline: '',
    last_minute_price: '',

    visa_required: false,
    visa_type: 'e-Visa',
    visa_processing_time: '5 days',
    visa_required_docs: 'Passport copy, Photos',
    passport_validity_months: '6',
    vaccinations_required: false,
    vaccinations_list: '',
    travel_insurance_included: true,
    required_documents: [] as string[],
    booking_deadline_days: '7',

    gallery_images: '',
    video_url: '',
    brochure_url: '',
    map_image_url: '',

    is_featured: false,
    available_dates: '',
    max_bookings: '30',
    bookings_open: true,
    show_on_website: true,
    show_on_chatbot: true,

    ihram_included: true,
    group_prayer_schedule: '',
    mecca_days: '10',
    medina_days: '5'
  })

  // List of unique destinations for dropdown filter
  const allDestinations = useMemo(() => {
    const destSet = new Set<string>()
    trips.forEach(t => {
      if (t.destination) destSet.add(t.destination)
      if (t.destination_country) destSet.add(t.destination_country)
    })
    return ['all', ...Array.from(destSet)]
  }, [trips])

  // Transport selections toggles
  const handleToggleTransport = (type: string) => {
    setSelectedTransports(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const normalizeTransportType = (transportType?: string | null) => {
    const value = (transportType || 'Avion').toLowerCase()
    if (value.includes('sans')) return 'Sans Transport'
    if (value.includes('priv')) return 'Voiture Privée'
    if (value.includes('bus') || value.includes('car')) return 'Bus (Car)'
    if (value.includes('vol') || value.includes('flight') || value.includes('avion') || value.includes('air')) return 'Avion'
    return transportType || 'Avion'
  }

  // Clones/Duplicates a Trip instantly
  const handleDuplicateTrip = (trip: any) => {
    const codeRand = Math.random().toString(36).substring(2, 6).toUpperCase()
    const duplicate = {
      ...trip,
      title: `${trip.title} (Copie)`,
      trip_code: `${trip.trip_code || 'TR'}-DUP-${codeRand}`,
      is_active: false
    }
    openEditModal(duplicate)
    setEditingTrip(null) // Unlink editing ID so it creates as a new entry instead
  }

  // Pre-load pre-made template values
  const handleImportTemplate = (template: any) => {
    setEditingTrip(null)
    setActiveStep(1)
    
    setFormData({
      title: template.title,
      destination: template.destination,
      description: template.description || 'Pre-configured premium travel package template for travelers.',
      price: template.price,
      duration_days: template.duration_days,
      image_urls: template.image_urls,
      is_active: template.is_active,

      trip_type: template.trip_type || 'package',
      destination_country: template.destination_country || '',
      destination_cities: template.destination_cities || '',
      trip_language: template.trip_language || 'Mixed',
      season_period: template.season_period || 'Summer',
      trip_code: template.trip_code || `TR-${template.destination_country.toUpperCase()}-TMP`,

      transport_type: template.transport_type || 'Avion',
      airline: template.airline || 'Air Algérie',
      departure_airport: template.departure_airport || 'Algiers (ALG)',
      arrival_airport: template.arrival_airport || '',
      flight_type: template.flight_type || 'Direct',
      baggage_allowance: template.baggage_allowance || '23kg',
      flight_class: template.flight_class || 'Economy',
      flight_number: template.flight_number || '',
      round_trip: template.round_trip !== false,

      bus_company: template.bus_company || '',
      departure_city: template.departure_city || 'Algiers',
      route_stops: template.route_stops || '',
      seat_type: template.seat_type || 'Standard',
      departure_time: template.departure_time || '08:00',

      vehicle_type: template.vehicle_type || 'Van (7 seats)',
      driver_included: template.driver_included !== false,
      fuel_included: template.fuel_included !== false,

      accommodation_type: template.accommodation_type || 'Hôtel 4 étoiles',
      hotel_name: template.hotel_name || '',
      room_type: template.room_type || 'Double',
      meal_plan: template.meal_plan || 'Demi-pension',
      room_types: parseOptions(template.room_type, 'Double'),
      meal_plans: parseOptions(template.meal_plan, 'Demi-pension'),
      num_nights: template.num_nights || '',
      hotel_location: template.hotel_location || '',

      itinerary: template.itinerary || [],
      included_items: template.included_items || 'Transport, Hébergement',
      excluded_items: template.excluded_items || 'Dépenses personnelles',
      guide_included: template.guide_included !== false,
      guide_language: template.guide_language || 'Arabic',
      group_size_min: template.group_size_min || '10',
      group_size_max: template.group_size_max || '30',

      child_policy_age_limit: '12',
      child_policy_discount: '30',
      child_policy_infant: 'Free',
      single_supplement: '25000',
      group_discount_4: '0',
      group_discount_8: '5',
      group_discount_15: '10',
      early_bird_discount_percent: '5',
      early_bird_deadline: '',
      last_minute_price: '',

      visa_required: template.visa_required || false,
      visa_type: template.visa_type || 'e-Visa',
      visa_processing_time: template.visa_processing_time || '5 days',
      visa_required_docs: template.visa_required_docs || '',
      passport_validity_months: '6',
      vaccinations_required: false,
      vaccinations_list: '',
      travel_insurance_included: true,
      required_documents: template.required_documents || ['Passport copy'],
      booking_deadline_days: '7',

      gallery_images: template.gallery_images || '',
      video_url: template.video_url || '',
      brochure_url: '',
      map_image_url: '',

      is_featured: false,
      available_dates: '',
      max_bookings: '30',
      bookings_open: true,
      show_on_website: true,
      show_on_chatbot: true,

      ihram_included: template.ihram_included !== false,
      group_prayer_schedule: template.group_prayer_schedule || '',
      mecca_days: template.mecca_days?.toString() || '10',
      medina_days: template.medina_days?.toString() || '5'
    })
    
    setShowTemplatesDropdown(false)
    setIsModalOpen(true)
  }

  // Filter application
  const filteredTrips = useMemo(() => {
    return trips.filter(t => {
      // Search text
      const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
                            t.destination.toLowerCase().includes(search.toLowerCase())
      
      // Destination
      const matchesDest = destinationFilter === 'all' || 
                          t.destination === destinationFilter ||
                          t.destination_country === destinationFilter

      // Price limit
      const matchesPrice = Number(t.price) <= maxPrice

      // Duration limits
      const matchesDuration = Number(t.duration_days) >= minDuration && Number(t.duration_days) <= maxDuration

      // Multi-select transport types
      const matchesTransport = selectedTransports.length === 0 || selectedTransports.includes(normalizeTransportType(t.transport_type))

      // Status
      const matchesStatus = statusFilter === 'all' || 
                            (statusFilter === 'active' && t.is_active) || 
                            (statusFilter === 'draft' && !t.is_active)

      return matchesSearch && matchesDest && matchesPrice && matchesDuration && matchesTransport && matchesStatus
    })
  }, [trips, search, destinationFilter, maxPrice, minDuration, maxDuration, selectedTransports, statusFilter])

  const openAddModal = () => {
    setEditingTrip(null)
    setActiveStep(1)
    setFormData({
      title: '', destination: '', description: '', price: '', duration_days: '', image_urls: '', is_active: true,
      trip_type: 'package', destination_country: 'Tunisia', destination_cities: '', trip_language: 'Mixed', season_period: 'Summer', trip_code: '',
      transport_type: 'Avion', airline: 'Air Algérie', departure_airport: 'Algiers (ALG)', arrival_airport: '', flight_type: 'Direct',
      baggage_allowance: '23kg', flight_class: 'Economy', flight_number: '', round_trip: true,
      bus_company: '', departure_city: 'Algiers', route_stops: '', seat_type: 'Standard', departure_time: '08:00',
      vehicle_type: 'Van (7 seats)', driver_included: true, fuel_included: true,
      accommodation_type: 'Hôtel 4 étoiles', hotel_name: '', room_type: 'Double', meal_plan: 'Demi-pension',
      room_types: [
        { name: 'Chambre Double', price: 0 },
        { name: 'Chambre Simple', price: 25000 },
        { name: 'Chambre Triple', price: -10000 }
      ],
      meal_plans: [
        { name: 'Demi-pension', price: 0 },
        { name: 'Petit-déjeuner', price: -5000 },
        { name: 'Pension complète', price: 15000 },
        { name: 'All Inclusive', price: 30000 }
      ],
      num_nights: '', hotel_location: '',
      itinerary: [], included_items: 'Transport, Hébergement, Guide', excluded_items: 'Frais de visa, Dépenses personnelles',
      guide_included: true, guide_language: 'Arabic', group_size_min: '10', group_size_max: '30',
      child_policy_age_limit: '12', child_policy_discount: '30', child_policy_infant: 'Free', single_supplement: '25000',
      group_discount_4: '0', group_discount_8: '5', group_discount_15: '10', early_bird_discount_percent: '5', early_bird_deadline: '', last_minute_price: '',
      visa_required: false, visa_type: 'e-Visa', visa_processing_time: '5 days', visa_required_docs: 'Passport copy, Photos',
      passport_validity_months: '6', vaccinations_required: false, vaccinations_list: '', travel_insurance_included: true,
      required_documents: ['Passport copy', 'ID card copy'], booking_deadline_days: '7',
      gallery_images: '', video_url: '', brochure_url: '', map_image_url: '',
      is_featured: false, available_dates: '', max_bookings: '30', bookings_open: true, show_on_website: true, show_on_chatbot: true,
      ihram_included: true, group_prayer_schedule: '', mecca_days: '10', medina_days: '5'
    })
    setError('')
    setIsModalOpen(true)
  }

  const openEditModal = (trip: Trip | any) => {
    setEditingTrip(trip)
    setActiveStep(1)
    
    // Parse JSON values safely
    const itinerary = Array.isArray(trip.itinerary) ? trip.itinerary : []
    const required_documents = Array.isArray(trip.required_documents) ? trip.required_documents : ['Passport copy']
    const destCities = Array.isArray(trip.destination_cities) ? trip.destination_cities.join(', ') : (trip.destination_cities || '')
    const tDetails = trip.transport_details || {}
    const cPolicy = trip.child_policy || {}
    const earlyBird = trip.early_bird_discount || {}
    const visaD = trip.visa_details || {}
    const gallImages = Array.isArray(trip.gallery_images) ? trip.gallery_images.join(', ') : ''
    const availDates = Array.isArray(trip.available_dates) ? trip.available_dates.join(', ') : ''

    setFormData({
      title: trip.title,
      destination: trip.destination,
      description: trip.description || '',
      price: trip.price.toString(),
      duration_days: trip.duration_days.toString(),
      image_urls: Array.isArray(trip.image_urls) ? trip.image_urls.join(', ') : (trip.image_urls || ''),
      is_active: trip.is_active || false,

      trip_type: trip.trip_type || 'package',
      destination_country: trip.destination_country || trip.destination || '',
      destination_cities: destCities,
      trip_language: trip.trip_language || 'Mixed',
      season_period: trip.season_period || 'Summer',
      trip_code: trip.trip_code || '',

      transport_type: trip.transport_type || 'Avion',
      airline: tDetails.airline || 'Air Algérie',
      departure_airport: tDetails.departure_airport || 'Algiers (ALG)',
      arrival_airport: tDetails.arrival_airport || '',
      flight_type: tDetails.flight_type || 'Direct',
      baggage_allowance: tDetails.baggage_allowance || '23kg',
      flight_class: tDetails.flight_class || 'Economy',
      flight_number: tDetails.flight_number || '',
      round_trip: tDetails.round_trip !== false,

      bus_company: tDetails.bus_company || '',
      departure_city: tDetails.departure_city || 'Algiers',
      route_stops: Array.isArray(tDetails.route_stops) ? tDetails.route_stops.join(', ') : (tDetails.route_stops || ''),
      seat_type: tDetails.seat_type || 'Standard',
      departure_time: tDetails.departure_time || '08:00',

      vehicle_type: tDetails.vehicle_type || 'Van (7 seats)',
      driver_included: tDetails.driver_included !== false,
      fuel_included: tDetails.fuel_included !== false,

      accommodation_type: trip.accommodation_type || 'Hôtel 4 étoiles',
      hotel_name: trip.hotel_name || '',
      room_type: trip.room_type || 'Double',
      meal_plan: trip.meal_plan || 'Demi-pension',
      room_types: parseOptions(trip.room_type, 'Double'),
      meal_plans: parseOptions(trip.meal_plan, 'Demi-pension'),
      num_nights: trip.num_nights ? trip.num_nights.toString() : '',
      hotel_location: trip.hotel_location || '',

      itinerary: itinerary,
      included_items: Array.isArray(trip.included_items) ? trip.included_items.join(', ') : (trip.included_items || 'Transport, Hébergement'),
      excluded_items: Array.isArray(trip.excluded_items) ? trip.excluded_items.join(', ') : (trip.excluded_items || 'Visa'),
      guide_included: trip.guide_included !== false,
      guide_language: trip.guide_language || 'Arabic',
      group_size_min: trip.group_size_min ? trip.group_size_min.toString() : '10',
      group_size_max: trip.group_size_max ? trip.group_size_max.toString() : '30',

      child_policy_age_limit: cPolicy.age_limit ? cPolicy.age_limit.toString() : '12',
      child_policy_discount: cPolicy.discount_percent ? cPolicy.discount_percent.toString() : '30',
      child_policy_infant: cPolicy.infant_policy || 'Free',
      single_supplement: trip.single_supplement ? trip.single_supplement.toString() : '0',
      group_discount_4: trip.group_discounts?.[0]?.discount || '0',
      group_discount_8: trip.group_discounts?.[1]?.discount || '5',
      group_discount_15: trip.group_discounts?.[2]?.discount || '10',
      early_bird_discount_percent: earlyBird.percent ? earlyBird.percent.toString() : '0',
      early_bird_deadline: earlyBird.deadline || '',
      last_minute_price: trip.last_minute_price ? trip.last_minute_price.toString() : '',

      visa_required: trip.visa_required || false,
      visa_type: visaD.type || 'e-Visa',
      visa_processing_time: visaD.processing_time || '5 days',
      visa_required_docs: Array.isArray(visaD.required_documents) ? visaD.required_documents.join(', ') : '',
      passport_validity_months: trip.passport_validity_months ? trip.passport_validity_months.toString() : '6',
      vaccinations_required: trip.vaccinations_required || false,
      vaccinations_list: Array.isArray(trip.vaccinations_list) ? trip.vaccinations_list.join(', ') : '',
      travel_insurance_included: trip.travel_insurance_included !== false,
      required_documents: required_documents,
      booking_deadline_days: trip.booking_deadline_days ? trip.booking_deadline_days.toString() : '7',

      gallery_images: gallImages,
      video_url: trip.video_url || '',
      brochure_url: trip.brochure_url || '',
      map_image_url: trip.map_image_url || '',

      is_featured: trip.is_featured || false,
      available_dates: availDates,
      max_bookings: trip.max_bookings ? trip.max_bookings.toString() : '30',
      bookings_open: trip.bookings_open !== false,
      show_on_website: trip.show_on_website !== false,
      show_on_chatbot: trip.show_on_chatbot !== false,

      ihram_included: trip.ihram_included || false,
      group_prayer_schedule: trip.group_prayer_schedule || '',
      mecca_days: trip.mecca_days || '10',
      medina_days: trip.medina_days || '5'
    })
    setError('')
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce voyage ?')) return
    
    setIsDeleting(id)
    const result = await deleteTrip(id)
    if (result.success) {
      setTrips(trips.filter(t => t.id !== id))
    } else {
      alert(result.error)
    }
    setIsDeleting(null)
  }

  // Pre-generate empty itinerary days
  const handleAutoGenerateItinerary = () => {
    const daysCount = Number(formData.duration_days) || 1
    const newItinerary = Array.from({ length: daysCount }, (_, i) => {
      const existing = formData.itinerary[i]
      return existing || { day: i + 1, title: `Day ${i + 1}`, description: '', activities: '' }
    })
    setFormData({ ...formData, itinerary: newItinerary })
  }

  // Handle Tag Checkbox options
  const handleDocCheckbox = (doc: string, checked: boolean) => {
    let list = [...formData.required_documents]
    if (checked) {
      if (!list.includes(doc)) list.push(doc)
    } else {
      list = list.filter(d => d !== doc)
    }
    setFormData({ ...formData, required_documents: list })
  }

  // Handle direct submit / save draft
  const handleSaveDraftOrSubmit = async (e?: React.FormEvent, forceDraft = false) => {
    if (e) e.preventDefault()
    setError('')

    if (!formData.title || !formData.destination || !formData.price || !formData.duration_days) {
      setError("Please complete title, destination, base price, and duration.")
      return
    }

    try {
      setLoading(true)

      const formattedData = {
        title: formData.title,
        destination: formData.destination,
        description: formData.description,
        price: Number(formData.price),
        duration_days: Number(formData.duration_days),
        image_urls: formData.image_urls,
        is_active: forceDraft ? false : formData.is_active,

        trip_type: formData.trip_type,
        destination_country: formData.destination_country,
        destination_cities: formData.destination_cities.split(',').map(c => c.trim()).filter(Boolean),
        trip_language: formData.trip_language,
        season_period: formData.season_period,
        trip_code: formData.trip_code || `TR-${formData.destination_country.substring(0,3).toUpperCase()}-001`,

        transport_type: formData.transport_type,
        transport_details: {
          airline: formData.airline,
          departure_airport: formData.departure_airport,
          arrival_airport: formData.arrival_airport,
          flight_type: formData.flight_type,
          baggage_allowance: formData.baggage_allowance,
          flight_class: formData.flight_class,
          flight_number: formData.flight_number,
          round_trip: formData.round_trip,
          bus_company: formData.bus_company,
          departure_city: formData.departure_city,
          route_stops: formData.route_stops.split(',').map(s => s.trim()).filter(Boolean),
          seat_type: formData.seat_type,
          departure_time: formData.departure_time,
          vehicle_type: formData.vehicle_type,
          driver_included: formData.driver_included,
          fuel_included: formData.fuel_included
        },

        accommodation_type: formData.accommodation_type,
        hotel_name: formData.hotel_name,
        room_type: JSON.stringify(formData.room_types),
        meal_plan: JSON.stringify(formData.meal_plans),
        num_nights: Number(formData.num_nights) || (Number(formData.duration_days) > 1 ? Number(formData.duration_days) - 1 : 0),
        hotel_location: formData.hotel_location,

        itinerary: formData.itinerary,
        included_items: formData.included_items.split(',').map(i => i.trim()).filter(Boolean),
        excluded_items: formData.excluded_items.split(',').map(i => i.trim()).filter(Boolean),
        guide_included: formData.guide_included,
        guide_language: formData.guide_language,
        group_size_min: Number(formData.group_size_min) || 1,
        group_size_max: Number(formData.group_size_max) || 30,

        child_policy: {
          age_limit: Number(formData.child_policy_age_limit) || 12,
          discount_percent: Number(formData.child_policy_discount) || 30,
          infant_policy: formData.child_policy_infant
        },
        single_supplement: Number(formData.single_supplement) || 0,
        group_discounts: [
          { size: '4+', discount: Number(formData.group_discount_4) || 0 },
          { size: '8+', discount: Number(formData.group_discount_8) || 5 },
          { size: '15+', discount: Number(formData.group_discount_15) || 10 }
        ],
        early_bird_discount: {
          percent: Number(formData.early_bird_discount_percent) || 0,
          deadline: formData.early_bird_deadline
        },
        last_minute_price: formData.last_minute_price ? Number(formData.last_minute_price) : null,

        visa_required: formData.visa_required,
        visa_details: {
          type: formData.visa_type,
          processing_time: formData.visa_processing_time,
          required_documents: formData.visa_required_docs.split(',').map(d => d.trim()).filter(Boolean)
        },
        passport_validity_months: Number(formData.passport_validity_months) || 6,
        vaccinations_required: formData.vaccinations_required,
        required_documents: formData.required_documents,
        booking_deadline_days: Number(formData.booking_deadline_days) || 7,

        gallery_images: formData.gallery_images.split(',').map(i => i.trim()).filter(Boolean),
        video_url: formData.video_url,
        brochure_url: formData.brochure_url,
        map_image_url: formData.map_image_url,

        is_featured: formData.is_featured,
        available_dates: formData.available_dates.split(',').map(d => d.trim()).filter(Boolean),
        max_bookings: Number(formData.max_bookings) || 30,
        bookings_open: formData.bookings_open,
        show_on_website: formData.show_on_website,
        show_on_chatbot: formData.show_on_chatbot,

        ihram_included: formData.ihram_included,
        group_prayer_schedule: formData.group_prayer_schedule,
        mecca_days: Number(formData.mecca_days) || 10,
        medina_days: Number(formData.medina_days) || 5
      }

      let result
      if (editingTrip) {
        result = await updateTrip(editingTrip.id, formattedData)
      } else {
        result = await createTrip(formattedData)
      }

      if (result.success) {
        setIsModalOpen(false)
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
          alert('Saved successfully (Demo mode)')
          
          const savedMock = {
            ...editingTrip,
            ...formattedData,
            id: editingTrip ? editingTrip.id : 'trip-' + Math.random().toString(36).substring(7)
          } as any
          if (editingTrip) {
            setTrips(trips.map(t => t.id === editingTrip.id ? savedMock : t))
          } else {
            setTrips([savedMock, ...trips])
          }
        } else {
          window.location.reload()
        }
      } else {
        setError(result.error || 'Failed to save trip')
      }
    } catch (err) {
      console.error(err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (activeStep === 1) {
      if (!formData.title || !formData.destination || !formData.duration_days) {
        setError("Veuillez remplir le titre, la destination et la durée d'abord.")
        return
      }
      setError('')
      if (formData.itinerary.length === 0) {
        handleAutoGenerateItinerary()
      }
    }
    setActiveStep(prev => Math.min(prev + 1, 8))
  }

  const prevStep = () => {
    setActiveStep(prev => Math.max(prev - 1, 1))
  }

  const stepsMeta = [
    { num: 1, name: 'Infos de Base', icon: Compass },
    { num: 2, name: 'Transport', icon: Plane },
    { num: 3, name: 'Hébergement', icon: Hotel },
    { num: 4, name: 'Itinéraire', icon: BookOpen },
    { num: 5, name: 'Tarifs & Options', icon: DollarSign },
    { num: 6, name: 'Documents', icon: FileText },
    { num: 7, name: 'Médias', icon: Image },
    { num: 8, name: 'Visibilité', icon: Sparkles }
  ]

  // Render Stars Helper
  const renderStars = (accommodationType: string) => {
    if (!accommodationType) return null
    let count = 0
    if (accommodationType.includes('5')) count = 5
    else if (accommodationType.includes('4')) count = 4
    else if (accommodationType.includes('3')) count = 3
    else if (accommodationType.includes('2')) count = 2
    
    if (count === 0) return null
    return (
      <div className="flex items-center gap-0.5 mt-1 text-amber-500 shadow-xs bg-amber-50 px-2 py-0.5 rounded-full w-max text-[9px] font-bold">
        <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
        <span>{count} Étoiles</span>
      </div>
    )
  }

  // Render Meal Plan Chip Helper
  const renderMealPlan = (mealPlan: string) => {
    if (!mealPlan) return null
    let display = mealPlan
    if (mealPlan.startsWith('[')) {
      try {
        const parsed = JSON.parse(mealPlan)
        if (Array.isArray(parsed) && parsed.length > 0) {
          display = parsed.map(m => m.name).join(', ')
        }
      } catch (e) {
        console.error(e)
      }
    }
    const isAllInc = display.toLowerCase().includes('all')
    return (
      <span className={cn(
        "px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border tracking-wider",
        isAllInc 
          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
          : "bg-indigo-50 text-indigo-700 border-indigo-150"
      )}>
        🍽️ {display}
      </span>
    )
  }

  return (
    <div className="p-6 space-y-6 font-sans text-left bg-[#f4f5f7] h-[calc(100vh-64px)] overflow-y-auto page-enter select-none">
      
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-[#e8eaed] rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">Gestion des Voyages (Catalogues)</h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">Publiez, organisez et concevez des packages de voyage premium pour le marché algérien.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto relative">
          
          {/* Pre-made Templates Dropdown */}
          <div className="relative">
            <Button 
              variant="outline"
              onClick={() => setShowTemplatesDropdown(!showTemplatesDropdown)}
              className="bg-white hover:bg-slate-50 text-slate-655 text-slate-700 text-xs font-semibold gap-1.5 rounded-xl border border-slate-200 h-10 shadow-xs"
            >
              <Layers className="h-4 w-4 text-indigo-500" />
              <span>Import Template</span>
            </Button>

            {showTemplatesDropdown && (
              <div className="absolute right-0 mt-2 bg-white border border-slate-200 rounded-2xl p-2 shadow-xl w-60 z-50 text-left flex flex-col gap-1.5 animate-in fade-in duration-200">
                <div className="px-3 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  Select Pre-made Catalog
                </div>
                {PREMADE_TEMPLATES.map((tmpl, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleImportTemplate(tmpl)}
                    className="flex flex-col p-2.5 hover:bg-slate-50 rounded-xl transition text-left w-full"
                  >
                    <span className="text-xs font-bold text-slate-700 leading-tight">{tmpl.name}</span>
                    <span className="text-[10px] text-indigo-500 mt-1 font-semibold">{Number(tmpl.price).toLocaleString()} DZD • {tmpl.duration_days} Jours</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {canManageTrips && (
            <Button onClick={openAddModal} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition text-xs font-semibold px-4 h-10 flex-1 md:flex-none">
              <Plus className="mr-2 h-4 w-4" /> Créer un Voyage Package
            </Button>
          )}
        </div>
      </div>

      {/* SEARCH AND ADVANCED PARAMS FILTERS BOX */}
      <div className="bg-white border border-[#e8eaed] rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <SlidersHorizontal className="h-4.5 w-4.5 text-indigo-500" />
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Console de Recherche & Filtres</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Search query */}
          <div className="space-y-1 text-left">
            <Label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Rechercher</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Istanbul, Alger..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200/80 rounded-xl text-xs h-10"
              />
            </div>
          </div>

          {/* Destination dropdown */}
          <div className="space-y-1 text-left">
            <Label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Destination</Label>
            <select
              value={destinationFilter}
              onChange={(e) => setDestinationFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-xs h-10 font-medium"
            >
              <option value="all">🌍 Toutes les destinations</option>
              {allDestinations.filter(d => d !== 'all').map(dest => (
                <option key={dest} value={dest}>{dest}</option>
              ))}
            </select>
          </div>

          {/* Duration range */}
          <div className="space-y-1 text-left">
            <Label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Durée Jours ({minDuration} - {maxDuration} j)</Label>
            <div className="flex items-center gap-2">
              <input 
                type="number"
                min="1" 
                max="30"
                value={minDuration} 
                onChange={(e) => setMinDuration(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-1/2 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1 text-xs h-10 text-center font-bold"
              />
              <span className="text-slate-400 text-xs">à</span>
              <input 
                type="number"
                min="1" 
                max="30"
                value={maxDuration} 
                onChange={(e) => setMaxDuration(Math.max(1, parseInt(e.target.value) || 20))}
                className="w-1/2 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1 text-xs h-10 text-center font-bold"
              />
            </div>
          </div>

          {/* Status filter toggle */}
          <div className="space-y-1 text-left">
            <Label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Statut Publication</Label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-xs h-10 font-medium"
            >
              <option value="all">🗂️ Tous les Statuts</option>
              <option value="active">🟢 Actif uniquement</option>
              <option value="draft">🟡 Brouillon uniquement</option>
            </select>
          </div>
        </div>

        {/* Transport Type multi-select and Price Slider row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100/60">
          
          {/* Transport Multi-select chips */}
          <div className="space-y-2 text-left">
            <Label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Moyens de Transport</Label>
            <div className="flex flex-wrap gap-2">
              {['Avion', 'Bus (Car)', 'Voiture Privée', 'Sans Transport'].map((type) => {
                const isSelected = selectedTransports.includes(type)
                return (
                  <button
                    key={type}
                    onClick={() => handleToggleTransport(type)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border",
                      isSelected
                        ? "bg-indigo-650 bg-indigo-600 text-white border-transparent shadow-xs"
                        : "bg-slate-50 text-slate-550 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    {type === 'Avion' ? '✈️ ' : type === 'Bus (Car)' ? '🚌 ' : '🚗 '}
                    {type}
                  </button>
                )
              })}
              {selectedTransports.length > 0 && (
                <button
                  onClick={() => setSelectedTransports([])}
                  className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 hover:text-red-500 uppercase tracking-wider"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Price sliding selector */}
          <div className="space-y-1 text-left">
            <div className="flex justify-between items-center">
              <Label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Budget Max</Label>
              <span className="text-xs font-black text-indigo-600">{maxPrice.toLocaleString()} DZD</span>
            </div>
            <input 
              type="range" 
              min="20000" 
              max="450000" 
              step="5000"
              value={maxPrice} 
              onChange={(e) => setMaxPrice(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

        </div>
      </div>

      {/* Grid of Trips */}
      {filteredTrips.length === 0 ? (
        
        /* EMPTY STATE WITH PLAYABLE VIDEO TUTORIAL BLOCK */
        <div className="text-center py-16 bg-white border border-[#e8eaed] rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] max-w-xl mx-auto space-y-6">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Compass className="h-8 w-8 animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Aucun voyage dans votre catalogue</h3>
            <p className="text-xs text-slate-450 mt-1 max-w-xs mx-auto leading-relaxed">
              Nous n'avons trouvé aucun package correspondant aux filtres. Modifiez vos critères ou apprenez à configurer des offres.
            </p>
          </div>

          {/* Interactive Tutorial Video Thumbnail Card */}
          <div 
            onClick={() => setIsVideoModalOpen(true)}
            className="w-full max-w-md mx-auto aspect-video rounded-2xl overflow-hidden relative cursor-pointer group shadow-lg border border-slate-100 hover:scale-[1.02] duration-300 transition"
          >
            <Image 
              src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80" 
              alt="Video Tutorial" 
              fill
              sizes="(max-width: 768px) 100vw, 600px"
              className="object-cover group-hover:blur-xs duration-300 transition"
            />
            {/* Dark Mask */}
            <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-slate-900/50 duration-300 transition flex items-center justify-center" />
            
            {/* Glowing Play Circle */}
            <div className="absolute h-14 w-14 bg-white/95 text-indigo-650 rounded-full shadow-2xl flex items-center justify-center group-hover:scale-110 duration-300 transition relative">
              <Play className="h-6 w-6 text-indigo-600 fill-indigo-600 ml-1 shrink-0" />
              <span className="absolute inset-0 rounded-full bg-white animate-ping opacity-25" />
            </div>

            <div className="absolute bottom-4 left-4 right-4 text-left">
              <span className="bg-red-500 text-white font-bold text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-md">Tuto 2 min</span>
              <h5 className="text-white text-xs font-bold mt-1 shadow-sm drop-shadow-md">Créer et dupliquer vos templates de voyages en 2 minutes</h5>
            </div>
          </div>

          <div className="flex justify-center gap-3 pt-3">
            <Button onClick={() => {
              setSearch('')
              setDestinationFilter('all')
              setMaxPrice(350000)
              setMinDuration(1)
              setMaxDuration(20)
              setSelectedTransports([])
              setStatusFilter('all')
            }} variant="outline" className="rounded-xl border-slate-200 text-xs font-semibold text-slate-655 text-slate-600">
              Réinitialiser Filtres
            </Button>
            {canManageTrips && (
              <Button onClick={openAddModal} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold">
                Créer votre premier voyage
              </Button>
            )}
          </div>
        </div>

      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map((trip: any) => {
            const firstImg = Array.isArray(trip.image_urls) ? trip.image_urls[0] : (trip.image_urls || 'https://images.unsplash.com/photo-1527838832700-5059252407fa?auto=format&fit=crop&w=800&q=80')
            const isFeatured = !!trip.is_featured

            return (
              <div 
                key={trip.id} 
                className="bg-white rounded-2xl overflow-hidden border border-[#e8eaed] shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] hover:-translate-y-1.5 duration-300 transition-all cursor-pointer flex flex-col group relative"
              >
                {/* Trip Image Aspect-[4/3] with Zoom Effect */}
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 shrink-0">
                  <Image 
                    src={firstImg} 
                    alt={trip.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Transport Icon Bubble Overlay */}
                  <div className="absolute bottom-3 right-3 h-10 w-10 bg-white text-indigo-600 rounded-xl shadow-md border border-slate-100 flex items-center justify-center shrink-0 z-10 hover:scale-110 duration-200 transition">
                    {trip.transport_type === 'Avion' ? <Plane className="h-5 w-5 text-blue-500" /> : <Bus className="h-5 w-5 text-orange-500" />}
                  </div>

                  {/* Absolute badging grid */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                    <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider rounded-full bg-slate-900/80 backdrop-blur-sm text-white shadow-sm flex items-center gap-1 w-max">
                      {trip.transport_type === 'Avion' ? <Plane className="h-3 w-3" /> : <Bus className="h-3 w-3" />}
                      {trip.transport_type || 'Avion'}
                    </span>
                    
                    {/* Glowing Urgency Badge to create FOMO */}
                    <span className="px-2.5 py-1 text-[9px] font-black tracking-widest rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md flex items-center gap-1 w-max animate-pulse">
                      🔥 PLUS QUE 5 PLACES !
                    </span>
                  </div>

                  <div className="absolute top-4 right-4 z-10">
                    <span className={`px-2.5 py-1 text-[10px] font-bold tracking-wider rounded-full shadow-sm border ${
                      trip.is_active 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                        : 'bg-slate-100 text-slate-655 text-slate-600 border-slate-200'
                    }`}>
                      {trip.is_active ? 'ACTIF' : 'BROUILLON'}
                    </span>
                  </div>
                </div>

                {/* Card Content Area */}
                <CardContent className="p-6 flex-1 flex flex-col justify-between text-left">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] text-indigo-600 font-extrabold uppercase tracking-wider">
                      <span>{trip.trip_type === 'omra' ? '🕋 OMRA & HAJJ' : '✈️ ORGANISÉ'}</span>
                      {trip.accommodation_type && renderStars(trip.accommodation_type)}
                    </div>
                    <h3 className="font-bold text-sm text-slate-800 line-clamp-1 leading-tight group-hover:text-indigo-600 transition duration-200">
                      {trip.title}
                    </h3>
                    <p className="text-xs text-slate-450 line-clamp-2 leading-relaxed">
                      {trip.description}
                    </p>
                  </div>

                  {/* Badging Row: Meal Plan & Cities */}
                  <div className="flex flex-wrap gap-1.5 mt-3 select-none">
                    {trip.meal_plan && renderMealPlan(trip.meal_plan)}
                    {isFeatured && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
                        ✨ Vedette
                      </span>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-500">
                      <span className="flex items-center gap-1 font-semibold"><MapPin className="h-3.5 w-3.5 text-slate-400" /> Destination</span>
                      <span className="font-bold text-slate-700">{trip.destination}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500">
                      <span className="flex items-center gap-1 font-semibold"><CalendarDays className="h-3.5 w-3.5 text-slate-400" /> Durée</span>
                      <span className="font-bold text-slate-700">{trip.duration_days} Jours {trip.duration_days > 1 ? `/ ${trip.duration_days - 1} Nuits` : ''}</span>
                    </div>
                    
                    {/* Price and Action Button row */}
                    <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">À partir de</span>
                        <span className="font-black text-base text-indigo-600 tracking-tight">{Number(trip.price).toLocaleString()} DZD</span>
                      </div>
                      
                      {canManageTrips && (
                        <div className="flex gap-1.5">
                          {/* Duplicate/Clone trigger */}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Cloner le package"
                            className="h-9 w-9 rounded-xl border border-slate-200 hover:bg-indigo-50" 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDuplicateTrip(trip)
                            }}
                          >
                            <Copy className="h-3.5 w-3.5 text-indigo-500" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 rounded-xl border border-slate-200 hover:bg-slate-50" 
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditModal(trip)
                            }}
                          >
                            <Edit2 className="h-3.5 w-3.5 text-slate-550 text-slate-500" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 text-red-500 rounded-xl border border-slate-200 hover:text-red-655 hover:text-red-600 hover:bg-red-50" 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(trip.id)
                            }} 
                            disabled={isDeleting === trip.id}
                          >
                            {isDeleting === trip.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </div>
            )
          })}
        </div>
      )}

      {/* SIMULATED TUTORIAL PLAYER OVERLAY MODAL */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl space-y-3 p-4 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center text-white pb-2 border-b border-slate-900">
              <div className="flex items-center gap-2">
                <Video className="h-5 w-5 text-indigo-500 animate-pulse" />
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-300">Tutoriel: Catalogue de Voyages</h4>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsVideoModalOpen(false)}
                className="h-8 w-8 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900"
              >
                <X className="h-4.5 w-4.5" />
              </Button>
            </div>

            {/* Simulated Video Player Screen */}
            <div className="aspect-video bg-black rounded-2xl relative overflow-hidden flex items-center justify-center border border-slate-900">
              <Image 
                src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80" 
                alt="Video Cover" 
                fill
                sizes="(max-width: 768px) 100vw, 800px"
                className="object-cover opacity-60 blur-xs"
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/10 flex flex-col justify-between p-6">
                <span className="bg-indigo-600 text-white font-bold text-[9px] uppercase tracking-widest px-3 py-1 rounded-full w-max">
                  DEMO PLAYING...
                </span>
                
                {/* Control bar visual */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white font-bold">0:42 / 2:00</span>
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="w-[35%] h-full bg-indigo-500" />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-350 italic">"Pour créer une offre, vous pouvez soit importer un template pré-configuré pour la Turquie, l'Umrah ou la Tunisie en 1 clic, ou utiliser le bouton Dupliquer pour copier un package existant et modifier uniquement les dates de départ."</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8-STEP WIZARD CREATION DIALOG MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[850px] w-full h-[90vh] max-h-[780px] flex flex-col rounded-3xl overflow-hidden font-sans border-0 shadow-2xl p-0 bg-white">
          
          {/* Header Progress Indicators */}
          <div className="bg-slate-900 p-6 text-white text-left relative shrink-0">
            <DialogHeader className="text-left mb-6">
              <DialogTitle className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                {editingTrip ? 'Modifier le Package Voyage' : 'Nouveau Package Voyage Algérien'}
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs mt-1">
                Concevez des packages complexes (Umrah, Turquie, Tunisie, etc.) avec itinéraires détaillés et tarifs.
              </DialogDescription>
            </DialogHeader>

            {/* Stepper Status Indicators */}
            <div className="grid grid-cols-8 gap-1.5 relative z-10">
              {stepsMeta.map((s) => {
                const IconComponent = s.icon
                const isActive = activeStep === s.num
                const isCompleted = activeStep > s.num
                return (
                  <button 
                    key={s.num} 
                    type="button"
                    onClick={() => setActiveStep(s.num)}
                    className="flex flex-col items-center group transition"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      isActive ? 'bg-indigo-500 text-white scale-110 shadow-lg shadow-indigo-500/30' :
                      isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}>
                      {isCompleted ? <CheckCircle className="h-4.5 w-4.5" /> : s.num}
                    </div>
                    <span className={`text-[9px] mt-1.5 font-medium line-clamp-1 group-hover:text-white transition-colors ${
                      isActive ? 'text-indigo-400 font-bold' : 'text-slate-500'
                    }`}>
                      {s.name}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Background Accent Progress line */}
            <div className="absolute left-[8%] right-[8%] top-[102px] h-[2px] bg-slate-800 -z-0">
              <div 
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${((activeStep - 1) / 7) * 100}%` }}
              />
            </div>
          </div>

          {/* Wizard Form Area */}
          <div className="flex-1 overflow-y-auto p-8 text-left bg-white min-h-0">
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 text-xs rounded-2xl border border-red-100 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: Basic Information */}
            {activeStep === 1 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
                    <Compass className="h-5 w-5 text-indigo-500" /> Étape 1: Informations Fondamentales
                  </h3>
                  <p className="text-slate-400 text-xs">Définissez le titre, la destination et le type de package.</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-600">Titre du Voyage (Trip Title) *</Label>
                  <Input 
                    className="rounded-xl bg-slate-50 border-slate-200 text-sm focus:bg-white transition h-11" 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                    placeholder="Summer Getaway in Turkey - 9 Days" 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Type de Voyage (Trip Type)</Label>
                    <select 
                      className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-sm h-11" 
                      value={formData.trip_type} 
                      onChange={e => setFormData({...formData, trip_type: e.target.value})}
                    >
                      <option value="package">Package Organisé Complet (All-Inclusive)</option>
                      <option value="free_voyage">Voyage Libre (Flight + Hotel)</option>
                      <option value="excursion">Excursion/Journée (Day Trip)</option>
                      <option value="omra">Omra/Hajj (Sacré)</option>
                      <option value="circuit_routier">Circuit Routier (Bus Tour)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Pays de Destination</Label>
                    <select 
                      className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-sm h-11" 
                      value={formData.destination_country} 
                      onChange={e => setFormData({...formData, destination_country: e.target.value, destination: e.target.value})}
                    >
                      <option value="Tunisia">Tunisie (Tunisia)</option>
                      <option value="Turkey">Turquie (Turkey)</option>
                      <option value="Egypt">Égypte (Egypt)</option>
                      <option value="Saudi Arabia">Arabie Saoudite (Umrah/Hajj)</option>
                      <option value="UAE">Émirats Arabes Unis (UAE)</option>
                      <option value="France">France</option>
                      <option value="Spain">Espagne (Spain)</option>
                      <option value="Algeria">Algérie (Local)</option>
                      <option value="Other">Autre (Other)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Villes visitées (Séparez par virgules)</Label>
                    <Input 
                      className="rounded-xl bg-slate-50 border-slate-200 text-sm h-11" 
                      value={formData.destination_cities} 
                      onChange={e => setFormData({...formData, destination_cities: e.target.value})} 
                      placeholder="Istanbul, Cappadocia, Pamukkale" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-600">Durée (Jours)</Label>
                      <Input 
                        type="number"
                        className="rounded-xl bg-slate-50 border-slate-200 text-sm h-11" 
                        value={formData.duration_days} 
                        onChange={e => {
                          const val = e.target.value
                          const nights = Number(val) > 1 ? (Number(val) - 1).toString() : '0'
                          setFormData({...formData, duration_days: val, num_nights: nights})
                        }} 
                        placeholder="9" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-600">Nuits (Auto-Calculé)</Label>
                      <Input 
                        type="number"
                        className="rounded-xl bg-slate-50 border-slate-200 text-sm h-11" 
                        value={formData.num_nights} 
                        onChange={e => setFormData({...formData, num_nights: e.target.value})} 
                        placeholder="8" 
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Langue du Voyage</Label>
                    <select 
                      className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-sm h-11" 
                      value={formData.trip_language} 
                      onChange={e => setFormData({...formData, trip_language: e.target.value})}
                    >
                      <option value="Arabic">Arabe (Arabic)</option>
                      <option value="French">Français (French)</option>
                      <option value="Darja">Darja (Algérien)</option>
                      <option value="Mixed">Mélangé (Mixed)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Saison / Période</Label>
                    <select 
                      className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-sm h-11" 
                      value={formData.season_period} 
                      onChange={e => setFormData({...formData, season_period: e.target.value})}
                    >
                      <option value="Summer">Été (Summer)</option>
                      <option value="Winter">Hiver (Winter)</option>
                      <option value="Ramadan">Ramadan</option>
                      <option value="Year-round">Toute l'année (Year-round)</option>
                      <option value="Specific dates">Dates spécifiques</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Code de Voyage (Trip Code)</Label>
                    <Input 
                      className="rounded-xl bg-slate-50 border-slate-200 text-sm h-11" 
                      value={formData.trip_code} 
                      onChange={e => setFormData({...formData, trip_code: e.target.value})} 
                      placeholder="TR-TUR-001" 
                    />
                  </div>
                </div>

                {/* Omra Special Section on Step 1 */}
                {formData.trip_type === 'omra' && (
                  <div className="p-5 bg-amber-500/10 border border-amber-500/25 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-amber-600" />
                      <h4 className="font-bold text-slate-800 text-sm">Spécificités Religieuses (Omra/Hajj)</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-600">Jours à la Mecque (Mecca Days)</Label>
                        <Input type="number" className="bg-white text-xs h-10 rounded-xl" value={formData.mecca_days} onChange={e => setFormData({...formData, mecca_days: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-600">Jours à Médine (Medina Days)</Label>
                        <Input type="number" className="bg-white text-xs h-10 rounded-xl" value={formData.medina_days} onChange={e => setFormData({...formData, medina_days: e.target.value})} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-xs font-semibold text-slate-700">Tenue d'Ihram incluse (Ihram cloth included)</Label>
                        <p className="text-[10px] text-slate-400">Fournir le tissu sacré pour hommes/femmes.</p>
                      </div>
                      <Switch checked={formData.ihram_included} onCheckedChange={c => setFormData({...formData, ihram_included: c})} />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-600">Programme de Prières de Groupe / Visites Sacrées</Label>
                      <Textarea 
                        className="bg-white min-h-[60px]" 
                        value={formData.group_prayer_schedule} 
                        onChange={e => setFormData({...formData, group_prayer_schedule: e.target.value})} 
                        placeholder="Visites de Quba Mosque, Mount Uhud, prières programmées..." 
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Transport Configuration */}
            {activeStep === 2 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
                    <Plane className="h-5 w-5 text-indigo-500" /> Étape 2: Configuration du Transport
                  </h3>
                  <p className="text-slate-400 text-xs">Configurez les moyens de transport inclus pour ce voyage.</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-600">Moyen de transport principal</Label>
                  <select 
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-sm h-11" 
                    value={formData.transport_type} 
                    onChange={e => setFormData({...formData, transport_type: e.target.value})}
                  >
                    <option value="Avion">Avion (Plane / Air Travel)</option>
                    <option value="Bus (Car)">Bus (Car / Road Travel)</option>
                    <option value="Voiture Privée">Voiture Privée (Chauffeur / Van)</option>
                    <option value="Ferry/Bateau">Ferry / Bateau</option>
                    <option value="Train">Train</option>
                    <option value="Sans Transport">Sans Transport (Local Package)</option>
                  </select>
                </div>

                {formData.transport_type === 'Avion' && (
                  <div className="p-6 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-4">
                    <h4 className="font-bold text-xs text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                      <Plane className="h-4 w-4" /> Détails du Vol Aérien (Flight Specs)
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-600">Compagnie Aérienne (Airline)</Label>
                        <select 
                          className="w-full rounded-xl bg-white border border-slate-200 p-2.5 text-sm h-10" 
                          value={formData.airline} 
                          onChange={e => setFormData({...formData, airline: e.target.value})}
                        >
                          <option value="Air Algérie">Air Algérie</option>
                          <option value="Turkish Airlines">Turkish Airlines</option>
                          <option value="EgyptAir">EgyptAir</option>
                          <option value="Saudia">Saudia</option>
                          <option value="Emirates">Emirates</option>
                          <option value="Qatar Airways">Qatar Airways</option>
                          <option value="Tunisair">Tunisair</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-600">Type de vol</Label>
                        <select 
                          className="w-full rounded-xl bg-white border border-slate-200 p-2.5 text-sm h-10" 
                          value={formData.flight_type} 
                          onChange={e => setFormData({...formData, flight_type: e.target.value})}
                        >
                          <option value="Direct">Vol Direct</option>
                          <option value="1 Escale">1 Escale</option>
                          <option value="2+ Escales">2+ Escales</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-600">Aéroport de départ</Label>
                        <Input className="bg-white text-xs h-10 rounded-xl" value={formData.departure_airport} onChange={e => setFormData({...formData, departure_airport: e.target.value})} placeholder="Alger (ALG) / Oran (ORN)" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-600">Aéroport d'arrivée</Label>
                        <Input className="bg-white text-xs h-10 rounded-xl" value={formData.arrival_airport} onChange={e => setFormData({...formData, arrival_airport: e.target.value})} placeholder="Istanbul (IST)" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-600">Bagages Inclus</Label>
                        <Input className="bg-white text-xs h-10 rounded-xl" value={formData.baggage_allowance} onChange={e => setFormData({...formData, baggage_allowance: e.target.value})} placeholder="23kg / 30kg" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-600">Classe du Vol</Label>
                        <select 
                          className="w-full rounded-xl bg-white border border-slate-200 p-2.5 text-sm h-10" 
                          value={formData.flight_class} 
                          onChange={e => setFormData({...formData, flight_class: e.target.value})}
                        >
                          <option value="Economy">Économique (Economy)</option>
                          <option value="Premium">Premium Economy</option>
                          <option value="Business">Affaires (Business)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-600">N° de Vol (Facultatif)</Label>
                        <Input className="bg-white text-xs h-10 rounded-xl" value={formData.flight_number} onChange={e => setFormData({...formData, flight_number: e.target.value})} placeholder="AH-3018" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <Label className="text-xs font-semibold text-slate-700">Vol Aller-Retour inclus</Label>
                        <p className="text-[10px] text-slate-400">Le billet couvre l'aller et le retour.</p>
                      </div>
                      <Switch checked={formData.round_trip} onCheckedChange={c => setFormData({...formData, round_trip: c})} />
                    </div>
                  </div>
                )}

                {formData.transport_type === 'Bus (Car)' && (
                  <div className="p-6 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-4">
                    <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1">
                      <Bus className="h-4 w-4" /> Spécificités Transport Routier (Bus / Tunisie)
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-600">Entreprise de Transport</Label>
                        <Input className="bg-white text-xs h-10 rounded-xl" value={formData.bus_company} onChange={e => setFormData({...formData, bus_company: e.target.value})} placeholder="El-Khayr / Sahara Voyage" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-600">Ville de Départ</Label>
                        <Input className="bg-white text-xs h-10 rounded-xl" value={formData.departure_city} onChange={e => setFormData({...formData, departure_city: e.target.value})} placeholder="Alger, Constantine, Annaba" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-600">Arrêts du parcours (séparés par virgules)</Label>
                      <Input className="bg-white text-xs h-10 rounded-xl" value={formData.route_stops} onChange={e => setFormData({...formData, route_stops: e.target.value})} placeholder="Setif, El Eulma, Tunis" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-600">Type de siège</Label>
                        <select 
                          className="w-full rounded-xl bg-white border border-slate-200 p-2.5 text-sm h-10" 
                          value={formData.seat_type} 
                          onChange={e => setFormData({...formData, seat_type: e.target.value})}
                        >
                          <option value="Standard">Standard Confortable</option>
                          <option value="VIP">VIP (Plus d'espace)</option>
                          <option value="Sleeper">Couchette (Sleeper)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-600">Heure de départ</Label>
                        <Input type="time" className="bg-white text-xs h-10 rounded-xl" value={formData.departure_time} onChange={e => setFormData({...formData, departure_time: e.target.value})} />
                      </div>
                    </div>
                  </div>
                )}

                {formData.transport_type === 'Voiture Privée' && (
                  <div className="p-6 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-4">
                    <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                      Véhicule Privé / Minivan
                    </h4>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-600">Type de Véhicule</Label>
                      <select 
                        className="w-full rounded-xl bg-white border border-slate-200 p-2.5 text-sm h-10" 
                        value={formData.vehicle_type} 
                        onChange={e => setFormData({...formData, vehicle_type: e.target.value})}
                      >
                        <option value="Van (7 seats)">Van 7 places (Hyundai H1 / Vito)</option>
                        <option value="Bus (30 seats)">Mini-Bus 30 places (Coaster)</option>
                        <option value="4x4">4x4 tout-terrain (Sahara)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                        <Label className="text-xs font-semibold text-slate-700">Chauffeur inclus</Label>
                        <Switch checked={formData.driver_included} onCheckedChange={c => setFormData({...formData, driver_included: c})} />
                      </div>
                      <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                        <Label className="text-xs font-semibold text-slate-700">Carburant inclus</Label>
                        <Switch checked={formData.fuel_included} onCheckedChange={c => setFormData({...formData, fuel_included: c})} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: Accommodation & Meals */}
            {activeStep === 3 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-800 text-base flex items-center gap-1.5 font-sans tracking-tight">
                    <Hotel className="h-5 w-5 text-indigo-500" /> Étape 3: Hébergement & Restauration
                  </h3>
                  <p className="text-slate-400 text-xs">Configurez les hôtels, les types de chambres et les meal plans avec suppléments.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Hotel Info */}
                  <div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-150 text-left">
                    <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Hébergement & Hôtel</h4>
                    
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-600">Catégorie d'hébergement</Label>
                      <select 
                        className="w-full rounded-xl bg-white border border-slate-200 p-2.5 text-sm h-11 font-medium" 
                        value={formData.accommodation_type} 
                        onChange={e => setFormData({...formData, accommodation_type: e.target.value})}
                      >
                        <option value="Sans hébergement">Sans hébergement (no hotel)</option>
                        <option value="Hôtel 2 étoiles">Hôtel 2 étoiles (⭐⭐)</option>
                        <option value="Hôtel 3 étoiles">Hôtel 3 étoiles (⭐⭐⭐)</option>
                        <option value="Hôtel 4 étoiles">Hôtel 4 étoiles (⭐⭐⭐⭐)</option>
                        <option value="Hôtel 5 étoiles">Hôtel 5 étoiles (⭐⭐⭐⭐⭐)</option>
                        <option value="Appartement / Résidence">Appartement / Résidence</option>
                        <option value="Camping / Bivouac">Camping / Bivouac</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-600">Nom de l'Hôtel</Label>
                      <Input 
                        className="rounded-xl bg-white border-slate-200 text-sm h-11" 
                        value={formData.hotel_name} 
                        onChange={e => setFormData({...formData, hotel_name: e.target.value})} 
                        placeholder="ex: Hotel Golden Tulip / Makkah Hotel" 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-600">Localisation de l'hôtel</Label>
                      <Input 
                        className="rounded-xl bg-white border-slate-200 text-sm h-11" 
                        value={formData.hotel_location} 
                        onChange={e => setFormData({...formData, hotel_location: e.target.value})} 
                        placeholder="ex: Yasmine Hammamet / Taksim Square" 
                      />
                    </div>
                  </div>

                  {/* Right Column: Dynamic Room Types Builder & Meal Plan Builder */}
                  <div className="space-y-6 text-left">
                    {/* Room Types Builder */}
                    <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-150 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1">
                          <Hotel className="h-4 w-4 text-indigo-500" /> Options de Chambres
                        </h4>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            const newRooms = [...formData.room_types, { name: '', price: 0 }]
                            setFormData({ ...formData, room_types: newRooms })
                          }}
                          className="h-8 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center gap-1"
                        >
                          <Plus className="h-3.5 w-3.5" /> Ajouter
                        </Button>
                      </div>

                      <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                        {formData.room_types.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic">Aucune chambre ajoutée. Le client ne pourra pas choisir.</p>
                        ) : (
                          formData.room_types.map((room, rIdx) => (
                            <div key={rIdx} className="flex gap-2 items-center">
                              <Input 
                                placeholder="Double, Single, Suite..." 
                                className="bg-white text-xs h-9 rounded-lg flex-1 font-medium"
                                value={room.name}
                                onChange={e => {
                                  const list = [...formData.room_types]
                                  list[rIdx].name = e.target.value
                                  setFormData({ ...formData, room_types: list })
                                }}
                              />
                              <Input 
                                type="number" 
                                placeholder="Offset (DZD)" 
                                className="bg-white text-xs h-9 rounded-lg w-28 text-center font-bold"
                                value={room.price}
                                onChange={e => {
                                  const list = [...formData.room_types]
                                  list[rIdx].price = Number(e.target.value) || 0
                                  setFormData({ ...formData, room_types: list })
                                }}
                              />
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  const list = formData.room_types.filter((_, idx) => idx !== rIdx)
                                  setFormData({ ...formData, room_types: list })
                                }}
                                className="h-9 w-9 text-red-500 hover:text-red-655 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Meal Plan Builder */}
                    <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-150 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1">
                          <Utensils className="h-4 w-4 text-emerald-500" /> Restauration (Meal Plans)
                        </h4>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            const newMeals = [...formData.meal_plans, { name: '', price: 0 }]
                            setFormData({ ...formData, meal_plans: newMeals })
                          }}
                          className="h-8 text-xs font-bold text-emerald-700 hover:bg-emerald-50 rounded-lg flex items-center gap-1"
                        >
                          <Plus className="h-3.5 w-3.5" /> Ajouter
                        </Button>
                      </div>

                      <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                        {formData.meal_plans.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic">Aucune option de repas ajoutée.</p>
                        ) : (
                          formData.meal_plans.map((meal, mIdx) => (
                            <div key={mIdx} className="flex gap-2 items-center">
                              <Input 
                                placeholder="Demi-pension, All-incl..." 
                                className="bg-white text-xs h-9 rounded-lg flex-1 font-medium"
                                value={meal.name}
                                onChange={e => {
                                  const list = [...formData.meal_plans]
                                  list[mIdx].name = e.target.value
                                  setFormData({ ...formData, meal_plans: list })
                                }}
                              />
                              <Input 
                                type="number" 
                                placeholder="Offset (DZD)" 
                                className="bg-white text-xs h-9 rounded-lg w-28 text-center font-bold"
                                value={meal.price}
                                onChange={e => {
                                  const list = [...formData.meal_plans]
                                  list[mIdx].price = Number(e.target.value) || 0
                                  setFormData({ ...formData, meal_plans: list })
                                }}
                              />
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  const list = formData.meal_plans.filter((_, idx) => idx !== mIdx)
                                  setFormData({ ...formData, meal_plans: list })
                                }}
                                className="h-9 w-9 text-red-500 hover:text-red-655 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Itinerary & Activities */}
            {activeStep === 4 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
                      <BookOpen className="h-5 w-5 text-indigo-500" /> Étape 4: Programme & Activités
                    </h3>
                    <p className="text-slate-400 text-xs">Écrivez le déroulement jour par jour. Cela vend le voyage !</p>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleAutoGenerateItinerary}
                    className="text-xs border-slate-200 rounded-xl"
                  >
                    Régénérer {formData.duration_days || 1} Jours
                  </Button>
                </div>

                {/* Day-by-Day Itinerary Repeater */}
                <div className="space-y-4 max-h-[260px] overflow-y-auto pr-2 bg-slate-50 p-4 rounded-2xl border border-slate-150">
                  {formData.itinerary.length === 0 ? (
                    <p className="text-slate-400 text-xs text-center py-6">Aucun jour configuré. Cliquez sur 'Régénérer' pour créer automatiquement les jours.</p>
                  ) : (
                    formData.itinerary.map((day, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-indigo-600 uppercase">Jour {day.day}</span>
                        </div>
                        <div className="space-y-2">
                          <Input 
                            className="text-xs font-semibold h-8 rounded-lg animate-in" 
                            value={day.title} 
                            placeholder="Titre du jour" 
                            onChange={e => {
                              const list = [...formData.itinerary]
                              list[idx].title = e.target.value
                              setFormData({ ...formData, itinerary: list })
                            }}
                          />
                          <Textarea 
                            className="text-xs min-h-[50px] rounded-lg" 
                            value={day.description} 
                            placeholder="Description du programme..." 
                            onChange={e => {
                              const list = [...formData.itinerary]
                              list[idx].description = e.target.value
                              setFormData({ ...formData, itinerary: list })
                            }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Éléments Inclus (séparés par virgules)</Label>
                    <Input className="rounded-xl text-sm" value={formData.included_items} onChange={e => setFormData({...formData, included_items: e.target.value})} placeholder="Transport, Hôtels, Visites guidées" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Éléments Exclus (séparés par virgules)</Label>
                    <Input className="rounded-xl text-sm" value={formData.excluded_items} onChange={e => setFormData({...formData, excluded_items: e.target.value})} placeholder="Visa, Repas facultatifs, Pourboires" />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: Pricing & Options */}
            {activeStep === 5 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
                    <DollarSign className="h-5 w-5 text-indigo-500" /> Étape 5: Configuration des Tarifs
                  </h3>
                  <p className="text-slate-400 text-xs">Configurez les prix de base et les réductions familles.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Prix de base par personne (DZD) *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        type="number" 
                        className="pl-9 rounded-xl bg-slate-50 border-slate-200 text-sm h-11" 
                        value={formData.price} 
                        onChange={e => setFormData({...formData, price: e.target.value})} 
                        placeholder="150000" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Supplément Single (Chambre Individuelle)</Label>
                    <Input 
                      type="number" 
                      className="rounded-xl bg-slate-50 border-slate-200 text-sm h-11" 
                      value={formData.single_supplement} 
                      onChange={e => setFormData({...formData, single_supplement: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="p-6 bg-emerald-500/5 border border-emerald-500/25 rounded-2xl space-y-4">
                  <h4 className="font-bold text-xs text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                    <User className="h-4 w-4" /> Politique des Enfants (Child Discounts)
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-600">Âge Limite Enfant (ans)</Label>
                      <Input type="number" className="bg-white text-xs h-10 rounded-xl" value={formData.child_policy_age_limit} onChange={e => setFormData({...formData, child_policy_age_limit: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-600">Réduction Enfant (%)</Label>
                      <Input type="number" className="bg-white text-xs h-10 rounded-xl" value={formData.child_policy_discount} onChange={e => setFormData({...formData, child_policy_discount: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-600">Tarif Bébé (Infant Policy)</Label>
                      <select 
                        className="w-full rounded-xl bg-white border border-slate-200 p-2.5 text-xs h-10" 
                        value={formData.child_policy_infant} 
                        onChange={e => setFormData({...formData, child_policy_infant: e.target.value})}
                      >
                        <option value="Free">Gratuit (Free)</option>
                        <option value="Fixed 15000 DZD">Fixe (15,000 DZD)</option>
                        <option value="Fixed 25000 DZD">Fixe (25,000 DZD)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: Documents & Requirements */}
            {activeStep === 6 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
                    <FileText className="h-5 w-5 text-indigo-500" /> Étape 6: Documents requis & Visa
                  </h3>
                  <p className="text-slate-400 text-xs">Spécifiez les obligations administratives pour le voyageur.</p>
                </div>

                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <Label className="text-xs font-semibold text-slate-700">Visa obligatoire pour ce pays</Label>
                    <p className="text-[10px] text-slate-400">Cochez si les Algériens doivent obtenir un visa.</p>
                  </div>
                  <Switch checked={formData.visa_required} onCheckedChange={c => setFormData({...formData, visa_required: c})} />
                </div>

                {formData.visa_required && (
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-600">Type de Visa</Label>
                        <select 
                          className="w-full rounded-xl bg-white p-2.5 text-xs h-10 border" 
                          value={formData.visa_type} 
                          onChange={e => setFormData({...formData, visa_type: e.target.value})}
                        >
                          <option value="e-Visa">e-Visa (En ligne)</option>
                          <option value="Consulaire">Visa Consulaire (Dossier physique)</option>
                          <option value="On arrival">Visa à l'arrivée</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-600">Délai d'obtention estimé</Label>
                        <Input className="bg-white text-xs h-10 rounded-xl" value={formData.visa_processing_time} onChange={e => setFormData({...formData, visa_processing_time: e.target.value})} placeholder="ex: 5 à 7 jours ouvrés" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <Label className="text-xs font-semibold text-slate-700">Documents à fournir (Required Documents)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      'Passport copy',
                      'ID card copy',
                      'Photos (fond blanc)',
                      'Bank statement',
                      'Employment letter',
                      'Family record book'
                    ].map((doc) => (
                      <label key={doc} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 cursor-pointer text-xs">
                        <input 
                          type="checkbox" 
                          checked={formData.required_documents.includes(doc)} 
                          onChange={e => handleDocCheckbox(doc, e.target.checked)}
                          className="rounded text-indigo-600"
                        />
                        <span>{doc}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 7: Images & Media */}
            {activeStep === 7 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
                    <LucideImage className="h-5 w-5 text-indigo-500" /> Étape 7: Images & Brochure
                  </h3>
                  <p className="text-slate-400 text-xs">Les visuels sont essentiels pour attirer les clients.</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-600">URL de l'image de couverture *</Label>
                  <Input 
                    className="rounded-xl bg-slate-50 border-slate-200 text-sm h-11" 
                    value={formData.image_urls} 
                    onChange={e => setFormData({...formData, image_urls: e.target.value})} 
                    placeholder="https://images.unsplash.com/photo-example.jpg" 
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-600">Galerie Photos (URLs séparées par des virgules)</Label>
                  <Textarea 
                    className="rounded-xl bg-slate-50 border-slate-200 text-xs min-h-[80px]" 
                    value={formData.gallery_images} 
                    onChange={e => setFormData({...formData, gallery_images: e.target.value})} 
                    placeholder="https://images.unsplash.com/photo-1.jpg, https://images.unsplash.com/photo-2.jpg" 
                  />
                </div>
              </div>
            )}

            {/* STEP 8: Publishing & Visibility */}
            {activeStep === 8 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
                    <Sparkles className="h-5 w-5 text-indigo-500" /> Étape 8: Publication & Paramètres
                  </h3>
                  <p className="text-slate-400 text-xs">Finalisez la publication et déterminez la visibilité.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Dates de Départ (séparées par virgules)</Label>
                    <Input className="text-xs h-10 rounded-xl" value={formData.available_dates} onChange={e => setFormData({...formData, available_dates: e.target.value})} placeholder="2026-07-15, 2026-07-22" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Capacité Maximum (Max Bookings)</Label>
                    <Input className="text-xs h-10 rounded-xl" type="number" value={formData.max_bookings} onChange={e => setFormData({...formData, max_bookings: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                  <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <Label className="text-xs font-semibold text-slate-700">Mettre en Vedette (Featured)</Label>
                      <p className="text-[10px] text-slate-400">Affiche le voyage avec badge spécial.</p>
                    </div>
                    <Switch checked={formData.is_featured} onCheckedChange={c => setFormData({...formData, is_featured: c})} />
                  </div>

                  <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <Label className="text-xs font-semibold text-slate-700">Voyage Actif (Live / Draft)</Label>
                      <p className="text-[10px] text-slate-400">Permet aux voyageurs de le voir.</p>
                    </div>
                    <Switch checked={formData.is_active} onCheckedChange={c => setFormData({...formData, is_active: c})} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stepper Footer Controls */}
          <div className="shrink-0 bg-slate-50 border-t border-slate-150 p-6 flex justify-between gap-3 flex-wrap">
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold" 
                onClick={() => setIsModalOpen(false)}
              >
                Fermer
              </Button>
              <Button 
                type="button" 
                variant="secondary"
                className="rounded-xl text-xs hover:bg-slate-100 font-semibold"
                onClick={(e) => handleSaveDraftOrSubmit(e, true)}
                disabled={loading}
              >
                Enregistrer en Brouillon
              </Button>
            </div>

            <div className="flex gap-2">
              {activeStep > 1 && (
                <Button 
                  type="button" 
                  variant="outline" 
                  className="rounded-xl border-slate-200 text-slate-655 text-slate-600 text-xs font-semibold" 
                  onClick={prevStep}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> Précédent
                </Button>
              )}
              
              {activeStep < 8 ? (
                <Button 
                  type="button" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold" 
                  onClick={nextStep}
                >
                  Suivant <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  type="button" 
                  disabled={loading} 
                  onClick={handleSaveDraftOrSubmit}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm text-xs font-semibold px-4 transition animate-pulse"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingTrip ? 'Enregistrer les Modifications' : 'Publier le Package Officiel'}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
