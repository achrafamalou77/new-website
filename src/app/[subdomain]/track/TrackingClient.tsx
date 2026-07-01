'use client'

import { useState, useEffect } from 'react'
import { getContainerTrackingInfo } from '@/app/actions/containers'
import {
  Search, Ship, MapPin, Calendar, User, Phone, ArrowLeft, Car,
  FileText, CheckCircle2, Clock, ShieldAlert, AlertCircle, Info,
  Compass, BadgeAlert, Coins, HelpCircle, ArrowUpRight, Play, Pause, Radio, RefreshCw, Layers, Globe
} from 'lucide-react'
import Link from 'next/link'

interface TrackingClientProps {
  agency: any
}

export default function TrackingClient({ agency }: TrackingClientProps) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedCar, setSelectedCar] = useState<any>(null)

  // --- Inline dynamic language state & translation dictionaries ---
  const [language, setLanguage] = useState<'fr' | 'ar' | 'en'>('fr')
  const [langDropdownOpen, setLangDropdownOpen] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('saas_locale')
    if (saved === 'fr' || saved === 'ar' || saved === 'en') {
      setLanguage(saved)
    }
  }, [])

  const handleSetLanguage = (lang: 'fr' | 'ar' | 'en') => {
    setLanguage(lang)
    localStorage.setItem('saas_locale', lang)
  }

  const translationsLocal: Record<string, Record<'fr' | 'ar' | 'en', string>> = {
    'header.title': {
      fr: 'Portail de Suivi Maritime',
      en: 'Maritime Tracking Portal',
      ar: 'بوابة التتبع البحري'
    },
    'hero.badge': {
      fr: 'Suivi Logistique en Direct',
      en: 'Live Logistics Tracking',
      ar: 'متابعة لوجستية مباشرة'
    },
    'hero.title': {
      fr: 'Suivi de votre Conteneur',
      en: 'Track your Container',
      ar: 'تتبع حاويتك'
    },
    'hero.subtitle': {
      fr: 'Entrez votre numéro de conteneur, numéro de téléphone ou numéro de suivi unique pour obtenir la position satellite en temps réel de votre cargaison.',
      en: 'Enter your container number, client phone number, or unique tracking code to fetch real-time satellite telemetry of your cargo.',
      ar: 'أدخل رقم الحاوية، رقم هاتف العميل، أو كود التتبع الفريد للحصول على إحداثيات القمر الصناعي المباشرة لشحنتك.'
    },
    'search.placeholder': {
      fr: 'Entrez N° Conteneur (ex: MSCU8829402), Téléphone (ex: 0770123456) ou N° Suivi...',
      en: 'Enter Container No (e.g. MSCU8829402), Phone, or Tracking No...',
      ar: 'أدخل رقم الحاوية (مثال: MSCU8829402)، الهاتف، أو رقم التتبع...'
    },
    'search.button': {
      fr: 'Rechercher',
      en: 'Search',
      ar: 'البحث عن الشحنة'
    },
    'demo.title': {
      fr: 'Exemples de démonstration :',
      en: 'Demo showcase examples:',
      ar: 'أمثلة تجريبية للاختبار السريع:'
    },
    'radar.title': {
      fr: 'Suivi Radar du Navire :',
      en: 'Vessel Radar Tracking:',
      ar: 'تتبع رادار السفينة المباشر:'
    },
    'radar.active_ais': {
      fr: 'Activer Live AIS',
      en: 'Activate Live AIS',
      ar: 'تفعيل الرادار المباشر'
    },
    'radar.deactive_ais': {
      fr: 'Désactiver Live AIS',
      en: 'Deactivate Live AIS',
      ar: 'إيقاف التتبع المباشر'
    },
    'telemetry.speed': {
      fr: 'Vitesse Navire',
      en: 'Vessel Speed',
      ar: 'سرعة السفينة'
    },
    'telemetry.status': {
      fr: 'Statut Transpondeur',
      en: 'Transponder Status',
      ar: 'حالة جهاز الإرسال'
    },
    'telemetry.heading': {
      fr: 'Cap / Direction',
      en: 'Heading / Compass',
      ar: 'الاتجاه والبوصلة'
    },
    'telemetry.quality': {
      fr: 'Qualité Signal Sat',
      en: 'Sat Signal Quality',
      ar: 'جودة اتصال القمر الصناعي'
    },
    'telemetry.route': {
      fr: 'Route de Transit',
      en: 'Transit Route',
      ar: 'مسار العبور الملاحي'
    },
    'logs.title': {
      fr: 'Journal de Navigation de la Passerelle',
      en: 'Bridge Vessel Navigation Log',
      ar: 'سجل الملاحة المباشر لغرفة قيادة السفينة'
    },
    'secure.title': {
      fr: '🔐 Accès Sécurisé à la Commande',
      en: '🔐 Secure Cargo Verification Access',
      ar: '🔐 التحقق الأمني من ملكية الشحنة'
    },
    'secure.desc': {
      fr: 'Pour voir la liste détaillée des véhicules et les informations de facturation, veuillez entrer le numéro de téléphone associé à cette commande pour valider votre identité.',
      en: 'To view linked vehicles and secure financial statements, please enter the client phone number associated with this order.',
      ar: 'لعرض تفاصيل السيارات والمستندات المالية المرتبطة، يرجى إدخال رقم الهاتف المسجل في الطلب للتحقق من هويتك.'
    },
    'secure.placeholder': {
      fr: 'Ex: 0770123456 ou +213...',
      en: 'E.g., 0770123456 or +213...',
      ar: 'مثال: 0770123456 أو +213...'
    },
    'secure.verify': {
      fr: 'Vérifier l\'identité',
      en: 'Verify Identity',
      ar: 'التحقق من الهوية'
    }
  }

  const getT = (key: string): string => {
    return translationsLocal[key]?.[language] || key
  }

  // Phone verification for locked container cargos
  const [verificationPhone, setVerificationPhone] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)

  // Use the agency's primary/secondary colors or fall back to high-end premium defaults
  const primaryColor = agency.website_config?.design?.primary_color || '#3b82f6'
  const secondaryColor = agency.website_config?.design?.secondary_color || '#1e3a8a'

  useEffect(() => {
    // Customers should only see shipments they explicitly search for.
  }, [])

  const handleSearch = async (searchQuery: string, overridePhone?: string) => {
    if (!searchQuery.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    setVerifyError(null)

    try {
      const res = await getContainerTrackingInfo(searchQuery, agency.id, overridePhone)
      if (res.success && res.data) {
        setResult({
          type: res.type,
          data: res.data,
          client: (res as any).client,
          lockedCargo: (res as any).lockedCargo
        })
      } else {
        setError(res.error || 'Aucun envoi trouvé pour cette recherche.')
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la recherche.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCargo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!verificationPhone.trim() || !container) return
    setVerifying(true)
    setVerifyError(null)

    try {
      const res = await getContainerTrackingInfo(container.container_number, agency.id, verificationPhone)
      if (res.success && res.data) {
        setResult({
          type: res.type,
          data: res.data,
          client: (res as any).client,
          lockedCargo: (res as any).lockedCargo
        })
        setVerificationPhone('')
      } else {
        setVerifyError(res.error || 'Vérification échouée. Numéro incorrect.')
      }
    } catch (err: any) {
      setVerifyError(err.message || 'Une erreur est survenue.')
    } finally {
      setVerifying(false)
    }
  }

  // Helper to resolve the main container object
  const getContainer = () => {
    if (!result) return null
    if (result.type === 'container') {
      return result.data[0]
    }
    // For other search types, find container from the first order
    const order = result.data.find((o: any) => o.container)
    return order ? order.container : null
  }

  // Helper to resolve all associated vehicles (import_orders)
  const getCars = () => {
    if (!result) return []
    if (result.type === 'container') {
      return result.data[0]?.import_orders || []
    }
    return result.data || []
  }

  const container = getContainer()
  const cars = getCars()

  // ─── Live AIS Satellite Simulation States & Telemetry ─────────────────────
  const [simulationActive, setSimulationActive] = useState(false)
  const [simLat, setSimLat] = useState(39.8452)
  const [simLng, setSimLng] = useState(4.3121)
  const [simSpeed, setSimSpeed] = useState(18.6)
  const [simHeading, setSimHeading] = useState(194)
  const [simProgress, setSimProgress] = useState(50)
  const [simLogs, setSimLogs] = useState<any[]>([])
  const [radarSweep, setRadarSweep] = useState(false)
  const [radarPingTime, setRadarPingTime] = useState('0.00s')

  // Auto-initialize simulation values when container results are fetched
  useEffect(() => {
    const tracking = container?.live_tracking
    if (tracking) {
      setSimLat(tracking.vessel_lat)
      setSimLng(tracking.vessel_lng)
      setSimSpeed(tracking.vessel_speed)
      setSimHeading(tracking.vessel_heading)
      setSimLogs(tracking.ais_history || [])
      
      // Compute route progress (from Marseille 43.3444 to Algiers 36.7725)
      const latDiff = 43.3444 - tracking.vessel_lat
      const totalLat = 43.3444 - 36.7725
      const pct = Math.max(0, Math.min(100, (latDiff / totalLat) * 100))
      setSimProgress(pct)
    }
  }, [result])

  // Active AIS telemetric update interval
  useEffect(() => {
    let intervalId: any = null
    if (simulationActive) {
      intervalId = setInterval(() => {
        setSimProgress(prev => {
          let nextProgress = prev + 1.2
          if (nextProgress > 100) {
            nextProgress = 0
          }
          
          // Interpolate GPS coordinates based on progress fraction
          const frac = nextProgress / 100
          const mLat = 43.3444
          const aLat = 36.7725
          const mLng = 5.3484
          const aLng = 3.0714
          
          const targetLat = mLat - (mLat - aLat) * frac
          const targetLng = mLng - (mLng - aLng) * frac
          
          // Add micro AIS deviations to make it live
          const jitterLat = (Math.random() - 0.5) * 0.004
          const jitterLng = (Math.random() - 0.5) * 0.004
          
          setSimLat(parseFloat((targetLat + jitterLat).toFixed(4)))
          setSimLng(parseFloat((targetLng + jitterLng).toFixed(4)))
          
          // Speed variation
          const currentBaseSpeed = container?.live_tracking?.vessel_speed || 18.6
          const baseVariation = (Math.random() - 0.5) * 0.6
          setSimSpeed(parseFloat((currentBaseSpeed + baseVariation).toFixed(1)))
          
          // Heading micro alignment
          setSimHeading(prevHead => {
            const headVar = Math.round((Math.random() - 0.5) * 4)
            const nextHead = prevHead + headVar
            return nextHead > 360 ? nextHead - 360 : nextHead < 0 ? nextHead + 360 : nextHead
          })

          // Sweep radar triggers
          setRadarSweep(true)
          setTimeout(() => setRadarSweep(false), 800)
          setRadarPingTime(`${(Math.random() * 0.8 + 0.1).toFixed(2)}s`)

          // Inject dynamic journey events as vessel sails
          if (Math.random() > 0.7) {
            const dynamicLogs = [
              { time: new Date().toISOString(), event: 'AIS Ping received - Signal Verified', loc: 'Sat-Tracking Grid' },
              { time: new Date().toISOString(), event: `Vessel speed adjusted to ${parseFloat((currentBaseSpeed + baseVariation).toFixed(1))} knots`, loc: 'Engine Room Telemetry' },
              { time: new Date().toISOString(), event: 'Dynamic GPS Waypoint reached successfully', loc: 'Bridge Navigation' }
            ]
            const picked = dynamicLogs[Math.floor(Math.random() * dynamicLogs.length)]
            setSimLogs(prevLogs => [picked, ...prevLogs])
          }

          return nextProgress
        })
      }, 1800)
    } else {
      if (intervalId) clearInterval(intervalId)
    }
    return () => { if (intervalId) clearInterval(intervalId) }
  }, [simulationActive, container])

  // Calculate status steps for container journey
  const getStatusSteps = (status: string) => {
    const steps = [
      { key: 'origin', label: 'Port de Départ', desc: 'Arrivée au port et chargement', isDone: true, isActive: false },
      { key: 'transit', label: 'En Mer (Transit)', desc: 'En cours d\'acheminement maritime', isDone: false, isActive: false },
      { key: 'customs', label: 'Dédouanement', desc: 'Contrôle douanier et formalités', isDone: false, isActive: false },
      { key: 'destination', label: 'Arrivé / Prêt', desc: 'Prêt pour livraison finale', isDone: false, isActive: false }
    ]

    const s = (status || '').toLowerCase()
    if (s === 'on vessel' || s === 'in transit' || s === 'shipped') {
      steps[0].isActive = false
      steps[0].isDone = true
      steps[1].isActive = true
      steps[1].isDone = false
    } else if (s === 'at customs' || s === 'customs') {
      steps[0].isDone = true
      steps[1].isDone = true
      steps[2].isActive = true
      steps[2].isDone = false
    } else if (s === 'ready' || s === 'arrived' || s === 'ready for pickup' || s === 'delivered') {
      steps[0].isDone = true
      steps[1].isDone = true
      steps[2].isDone = true
      steps[3].isDone = true
      steps[3].isActive = true
    } else {
      // At Origin Port
      steps[0].isActive = true
      steps[0].isDone = false
    }

    return steps
  }

  const steps = container ? getStatusSteps(container.status) : []

  return (
    <div dir={language === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white font-sans overflow-x-hidden relative">
      {/* Background ambient lighting glows */}
      <div className="absolute top-[-10%] left-[-20%] w-[60%] h-[50%] rounded-full bg-indigo-500/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[150px] pointer-events-none" />

      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-900/60 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/${agency.subdomain}`}
              className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition flex items-center justify-center cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <span className="text-xs text-indigo-400 font-bold uppercase tracking-widest block text-left">
                {agency.company_name}
              </span>
              <h1 className="text-sm font-black text-white uppercase tracking-tight text-left">
                {getT('header.title')}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <a
              href={`https://wa.me/${agency.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 bg-emerald-600/10 border border-emerald-500/20 hover:bg-emerald-600/20 text-emerald-400 rounded-xl text-[10px] font-extrabold uppercase transition flex items-center gap-1.5"
            >
              <Phone className="h-3 w-3" />
              <span>{language === 'ar' ? 'الدعم الفني' : language === 'fr' ? 'Support Logistique' : 'Support Logs'}</span>
            </a>

            {/* Public language selector */}
            <div className="relative">
              <button 
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-[10px] font-black text-slate-350 hover:text-white transition cursor-pointer"
              >
                <Globe className="h-3 w-3 text-slate-500" />
                <span className="uppercase">{language}</span>
              </button>

              {langDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setLangDropdownOpen(false)} />
                  <div className={`absolute ${language === 'ar' ? 'left-0' : 'right-0'} mt-2 w-28 bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150`}>
                    {[
                      { key: 'fr' as const, label: 'Français 🇫🇷' },
                      { key: 'ar' as const, label: 'العربية 🇩🇿' },
                      { key: 'en' as const, label: 'English 🇬🇧' },
                    ].map((l) => (
                      <button
                        key={l.key}
                        onClick={() => {
                          handleSetLanguage(l.key)
                          setLangDropdownOpen(false)
                        }}
                        className={`flex w-full items-center px-3.5 py-1.5 text-[10px] font-black transition cursor-pointer ${
                          language === l.key 
                            ? 'bg-indigo-950 text-indigo-400 font-extrabold' 
                            : 'text-slate-400 hover:bg-slate-850 hover:text-white'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* HERO / SEARCH CONTAINER */}
      <section className="relative px-6 pt-12 pb-8 max-w-4xl mx-auto w-full text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-4 animate-pulse">
          <Compass className="h-3 w-3 animate-spin-slow" />
          {getT('hero.badge')}
        </span>
        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
          {getT('hero.title')} <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-teal-400">
            {language === 'ar' ? 'في الوقت الفعلي' : language === 'fr' ? 'En Temps Réel' : 'In Real Time'}
          </span>
        </h2>
        <p className="text-slate-400 text-xs md:text-sm mt-3 max-w-2xl mx-auto leading-relaxed">
          {getT('hero.subtitle')}
        </p>

        {/* Search Bar Form */}
        <div className="mt-8 max-w-2xl mx-auto relative group">
          {/* Glowing back outline */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl opacity-10 group-focus-within:opacity-25 blur-lg transition duration-300" />
          
          <div className="relative bg-slate-900/90 border border-slate-800 focus-within:border-indigo-500/60 rounded-2xl p-2.5 flex items-center gap-2 shadow-2xl transition duration-300">
            <Search className="h-5 w-5 text-slate-500 ml-3 shrink-0" />
            <input
              type="text"
              placeholder="Entrez N° Conteneur (ex: MSCU8829402), Téléphone (ex: 0770123456) ou N° Suivi..."
              className="bg-transparent border-0 text-slate-100 placeholder-slate-550 text-xs md:text-sm font-semibold focus:outline-none focus:ring-0 flex-1 py-2 px-1"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
            />
            <button
              onClick={() => handleSearch(query)}
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-550 hover:to-blue-550 disabled:from-indigo-800 disabled:to-blue-800 text-white rounded-xl text-xs font-black tracking-wide shadow-lg hover:shadow-indigo-550/20 active:scale-[0.98] transition shrink-0"
            >
              {loading ? 'Recherche...' : 'Rechercher'}
            </button>
          </div>
        </div>

        {/* Quick Suggest Pills */}
        <div className="hidden">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Recherche rapide :
          </span>
          <button
            onClick={() => { setQuery('MSCU8829402'); handleSearch('MSCU8829402') }}
            className="px-3 py-1 rounded-full text-[10px] font-bold bg-slate-900 border border-slate-800 text-slate-350 hover:border-indigo-500 hover:text-white transition"
          >
            Conteneur MSCU8829402
          </button>
          <button
            onClick={() => { setQuery('0770123456'); handleSearch('0770123456') }}
            className="px-3 py-1 rounded-full text-[10px] font-bold bg-slate-900 border border-slate-800 text-slate-350 hover:border-indigo-500 hover:text-white transition"
          >
            Téléphone 0770123456
          </button>
          <button
            onClick={() => { setQuery('MSCTRK99201'); handleSearch('MSCTRK99201') }}
            className="px-3 py-1 rounded-full text-[10px] font-bold bg-slate-900 border border-slate-800 text-slate-350 hover:border-indigo-500 hover:text-white transition"
          >
            Suivi Mercedes (MSCTRK99201)
          </button>
        </div>
      </section>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="max-w-2xl mx-auto w-full px-6 mb-8">
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-black text-white">Recherche Infructueuse</h4>
              <p className="text-xs text-slate-400 mt-1 leading-normal">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MAIN TRACKING RESULTS DASHBOARD */}
      {result && (
        <main className="max-w-7xl mx-auto w-full px-6 pb-20 space-y-10">
          
          {/* SECTION 1: CONTAINER METRIC AND STEPPER */}
          {container ? (
            <>
              <div className="grid lg:grid-cols-12 gap-8 items-stretch">
                
                {/* Container Specs Details Card */}
                <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden backdrop-blur-sm">
                  {/* Visual Glass highlights */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-2xl rounded-full" />
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          Conteneur Maritime
                        </span>
                        <h3 className="text-xl font-black text-white font-mono tracking-wider mt-0.5">
                          {container.container_number}
                        </h3>
                      </div>
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 uppercase">
                        🚢 {container.shipping_line}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Navire</span>
                        <div className="text-slate-200 font-bold flex items-center gap-1.5">
                          <Ship className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                          {container.vessel_name || 'N/A'}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">N° Voyage</span>
                        <div className="text-slate-200 font-mono font-bold">
                          {container.voyage_number || 'N/A'}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-850 pt-4 space-y-3">
                      <div className="flex items-start gap-2.5">
                        <MapPin className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Port de Départ</div>
                          <div className="text-xs text-slate-200 font-bold">{container.departure_port || 'Port d\'Origine'}</div>
                          {container.departure_date && (
                            <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                              Parti le : {new Date(container.departure_date).toLocaleDateString('fr-DZ', { dateStyle: 'medium' })}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <MapPin className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-[9px] text-slate-550 font-bold uppercase tracking-wider">Port d'Arrivée</div>
                          <div className="text-xs text-slate-200 font-bold">{container.arrival_port || 'Port d\'Alger, Algérie'}</div>
                          {container.estimated_arrival_date && (
                            <div className="text-[10px] text-indigo-400 font-semibold mt-0.5">
                              ETA estimé : {new Date(container.estimated_arrival_date).toLocaleDateString('fr-DZ', { dateStyle: 'medium' })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {container.notes && (
                    <div className="mt-6 bg-slate-950/60 rounded-2xl p-3 border border-slate-850 text-[11px] text-slate-400 leading-normal flex gap-2">
                      <Info className="h-4 w-4 text-indigo-400 shrink-0" />
                      <span>{container.notes}</span>
                    </div>
                  )}
                </div>

                {/* Steps Logistics Timeline Card */}
                <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 shadow-xl flex flex-col justify-between backdrop-blur-sm">
                  <div>
                    <div className="border-b border-slate-800 pb-4 mb-6">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        État Logistique Actuel
                      </span>
                      <div className="flex items-center justify-between mt-1">
                        <h3 className="text-lg font-black text-white">
                          Suivi d'Acheminement
                        </h3>
                        <span className="px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {container.status}
                        </span>
                      </div>
                    </div>

                    {/* Stepper Timeline UI */}
                    <div className="space-y-6 relative pl-4">
                      {/* Stepper Vertical Track */}
                      <div className="absolute top-2 bottom-2 left-7 w-0.5 bg-slate-800" />

                      {steps.map((step, idx) => (
                        <div key={idx} className="flex gap-6 items-start relative z-10">
                          {/* Step Check/Circle */}
                          <div
                            className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300 ${
                              step.isDone
                                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                                : step.isActive
                                ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20 shadow-[0_0_12px_rgba(99,102,241,0.3)] animate-pulse'
                                : 'bg-slate-900 text-slate-500 border border-slate-800'
                            }`}
                          >
                            {step.isDone ? (
                              <CheckCircle2 className="h-4 w-4 stroke-[3]" />
                            ) : (
                              <span>0{idx + 1}</span>
                            )}
                          </div>

                          <div className="space-y-0.5">
                            <h4
                              className={`text-xs font-black uppercase tracking-wider ${
                                step.isDone || step.isActive ? 'text-white' : 'text-slate-500'
                              }`}
                            >
                              {step.label}
                            </h4>
                            <p className="text-[11px] text-slate-400 leading-normal">
                              {step.desc}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 border-t border-slate-850 pt-4 text-[10px] text-slate-500 font-medium flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Mise à jour depuis les informations enregistrées par l'agence.
                  </div>
                </div>

              </div>

              {container.live_tracking && container.live_tracking.is_live !== false && (
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden backdrop-blur-sm mt-8 text-left">
                  {/* Glowing background ambiance */}
                  <div className="absolute top-0 left-1/3 w-72 h-72 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none" />
                  
                  {/* Header Title Section */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/80 pb-5 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="h-10 w-10 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center">
                          <Radio className={`h-5 w-5 ${simulationActive ? 'animate-pulse' : ''}`} />
                        </div>
                        {simulationActive && (
                          <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                            Satellite AIS Live
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                            Signal Quality: {simulationActive ? 'Excellent (GPS Sweep)' : 'Class A Locked'}
                          </span>
                        </div>
                        <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight mt-1 flex items-center gap-2">
                          Suivi Radar du Navire: <span className="text-indigo-400 font-mono tracking-wider">{container.live_tracking.vessel_name}</span>
                        </h3>
                      </div>
                    </div>
                    
                    {/* Live Simulation Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSimulationActive(!simulationActive)}
                        className={`px-4 py-2 rounded-xl text-xs font-black tracking-wide flex items-center gap-2 transition active:scale-[0.98] ${
                          simulationActive
                            ? 'bg-amber-600/10 border border-amber-500/30 hover:bg-amber-600/20 text-amber-400'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-550/15'
                        }`}
                      >
                        {simulationActive ? (
                          <>
                            <Pause className="h-3.5 w-3.5" /> Pause Live AIS
                          </>
                        ) : (
                          <>
                            <Play className="h-3.5 w-3.5" /> Activer Live AIS
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => {
                          setRadarSweep(true)
                          setTimeout(() => setRadarSweep(false), 800)
                          setRadarPingTime(`${(Math.random() * 0.8 + 0.1).toFixed(2)}s`)
                          // Add manual scan log
                          const scanLog = { time: new Date().toISOString(), event: 'Manual AIS Radar Sweep successfully broadcasted', loc: 'Sat-Scan Antenna' }
                          setSimLogs(prev => [scanLog, ...prev])
                        }}
                        disabled={simulationActive}
                        className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 disabled:opacity-40 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                        title="Forcer un scan radar"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${radarSweep ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Scanner</span>
                      </button>
                    </div>
                  </div>

                  {/* Telemetry Dashboard Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                      { label: 'Coordonnées GPS', value: `${simLat}° N, ${simLng}° E`, desc: `Balise: ${simulationActive ? 'Flux actif' : 'Verrouillé'}`, subColor: 'text-indigo-400' },
                      { label: 'Vitesse Navire', value: `${simSpeed} nœuds`, desc: `État: ${container.live_tracking.vessel_status || 'En route'}`, subColor: 'text-emerald-400' },
                      { label: 'Cap Navigation', value: `${simHeading}° (${simHeading >= 160 && simHeading <= 200 ? 'SSW' : 'SSE'})`, desc: 'Trajectoire Directe', subColor: 'text-blue-400' },
                      { label: 'Latence Satellite', value: radarPingTime, desc: `Classe: ${container.live_tracking.ais_quality || 'Excellent'}`, subColor: 'text-teal-400' },
                    ].map((tel, idx) => (
                      <div key={idx} className="bg-slate-950/50 border border-slate-850/80 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-800 transition">
                        <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">{tel.label}</span>
                        <div className={`text-xs md:text-sm font-mono font-black mt-2 ${tel.subColor}`}>{tel.value}</div>
                        <span className="text-[9px] text-slate-500 font-semibold mt-1 block">{tel.desc}</span>
                      </div>
                    ))}
                  </div>

                  {/* Visual Live Radar Map & Dynamic logs */}
                  <div className="grid lg:grid-cols-12 gap-6 items-stretch">
                    
                    {/* Mediterranean radar transit plot map */}
                    <div className="lg:col-span-8 bg-slate-950 border border-slate-850 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between h-[360px]">
                      
                      {/* Grid pattern overlay */}
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                      
                      {/* Radar circular lines overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                        <div className="h-[250px] w-[250px] rounded-full border border-dashed border-indigo-500" />
                        <div className="h-[150px] w-[150px] rounded-full border border-dashed border-indigo-500 absolute" />
                        <div className="h-[50px] w-[50px] rounded-full border border-dashed border-indigo-500 absolute" />
                      </div>

                      {/* Map Points */}
                      {/* Marseille Port */}
                      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
                        <div className="h-5 w-5 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                          <div className="h-2 w-2 bg-red-500 rounded-full animate-ping" />
                        </div>
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1 bg-slate-950/90 border border-slate-850 px-2 py-0.5 rounded-md">
                          ⚓ Marseille
                        </span>
                      </div>

                      {/* Algiers Port */}
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
                        <div className="h-5 w-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                          <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                        </div>
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1 bg-slate-950/90 border border-slate-850 px-2 py-0.5 rounded-md">
                          🇩🇿 Port d'Alger
                        </span>
                      </div>

                      {/* Dotted Shipping Lane Route */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                        <line 
                          x1="50%" y1="48" 
                          x2="50%" y2="304" 
                          stroke="rgba(99, 102, 241, 0.15)" 
                          strokeWidth="2" 
                          strokeDasharray="4 6" 
                        />
                        {simulationActive && (
                          <line 
                            x1="50%" y1="48" 
                            x2="50%" y2={`${48 + (304 - 48) * (simProgress / 100)}`} 
                            stroke="rgba(16, 185, 129, 0.4)" 
                            strokeWidth="2.5" 
                            strokeDasharray="4 6" 
                          />
                        )}
                      </svg>

                      {/* Floating Vessel Icon moving dynamically along route */}
                      <div 
                        className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center transition-all duration-1000 ease-linear z-20"
                        style={{ top: `${48 + (304 - 48) * (simProgress / 100) - 16}px` }}
                      >
                        {/* Radar sweep radial ring */}
                        <div className={`absolute h-20 w-20 rounded-full border border-indigo-500/30 bg-indigo-500/5 -translate-y-4 scale-50 transition-all ${
                          simulationActive || radarSweep ? 'animate-ping duration-1000' : 'hidden'
                        }`} />

                        <div className="h-8 w-8 rounded-full bg-indigo-600 border border-indigo-400 text-white flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.6)] z-10 relative">
                          <Ship className="h-4.5 w-4.5" />
                        </div>
                        
                        <div className="bg-slate-900/90 border border-slate-800 text-[8px] font-black text-indigo-300 font-mono px-2 py-0.5 rounded-full mt-1.5 tracking-wide uppercase shadow-md whitespace-nowrap">
                          {simProgress.toFixed(1)}% trajet
                        </div>
                      </div>

                      {/* Map Coordinate Labels */}
                      <div className="text-[9px] text-slate-650 font-bold self-start mt-1 font-mono">
                        GRID: MEDITERRANEAN-TRANSIT-4
                      </div>
                      
                      <div className="text-[9px] text-slate-650 font-bold self-end font-mono">
                        RADAR TARGET: LOCK ACTIVE (SAT-GRID)
                      </div>

                    </div>

                    {/* AIS Live Telemetry Logs Terminal */}
                    <div className="lg:col-span-4 bg-slate-950 border border-slate-850 rounded-2xl p-5 flex flex-col justify-between h-[360px]">
                      <div>
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-850 pb-2.5 mb-3 flex items-center gap-1.5">
                          <Radio className="h-3.5 w-3.5 text-indigo-400" />
                          Signaux AIS Reçus
                        </h4>
                        
                        <div className="space-y-3 overflow-y-auto max-h-[240px] pr-1.5 scrollbar-thin scrollbar-thumb-slate-850 scrollbar-track-transparent">
                          {simLogs.map((log: any, idx: number) => (
                            <div key={idx} className="text-[9px] border-b border-slate-900/60 pb-2 last:border-0">
                              <div className="flex justify-between font-bold text-slate-500 font-mono text-[8px]">
                                <span>{log.loc || 'Station Marine'}</span>
                                <span>{new Date(log.time).toLocaleTimeString('fr-DZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                              </div>
                              <p className="text-slate-300 font-semibold mt-0.5 leading-normal flex items-start gap-1">
                                <span className="text-indigo-400 shrink-0">➔</span>
                                <span>{log.event}</span>
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="text-[9px] text-slate-650 font-bold text-center border-t border-slate-900 pt-2 font-mono">
                        FLUX: {simulationActive ? '📡 TRANSMISSION AIS EN DIRECT' : '⏸️ EMULATION EN VEILLE'}
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </>
          ) : (
            // Search query resolved shipments but without a master container
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center max-w-xl mx-auto space-y-4">
              <Compass className="h-10 w-10 text-indigo-400 mx-auto animate-spin-slow" />
              <div>
                <h3 className="text-base font-black text-white">Recherche par Véhicule / Client</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  Nous avons trouvé vos expéditions. Le conteneur parent n'est pas encore finalisé ou l'expédition est en transit libre. Voir ci-dessous la liste de vos véhicules.
                </p>
              </div>
            </div>
          )}

          {/* SECTION 2 & 3: CLIENT INFO & VEHICLES LIST OR SECURITY LOCK */}
          {result.lockedCargo ? (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 max-w-xl mx-auto space-y-6 relative overflow-hidden backdrop-blur-md">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 blur-2xl rounded-full" />
              
              <div className="text-center space-y-2">
                <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto mb-2">
                  <ShieldAlert className="h-6 w-6 stroke-[2]" />
                </div>
                <h3 className="text-lg font-black text-white">Cargaison Sécurisée</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Ce conteneur contient des véhicules en transit. Pour afficher vos détails d'importation sécurisés et vos soldes financiers, veuillez saisir le numéro de téléphone associé à votre commande.
                </p>
              </div>

              <form onSubmit={handleVerifyCargo} className="space-y-4">
                <div className="relative group">
                  <div className="absolute inset-0 bg-indigo-500/5 rounded-xl blur-md group-focus-within:bg-indigo-500/10 transition" />
                  <div className="relative bg-slate-950 border border-slate-850 rounded-xl p-3 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-500 shrink-0 ml-2" />
                    <input
                      type="text"
                      placeholder="Saisissez votre N° de Téléphone (ex: 0770123456)..."
                      className="bg-transparent border-0 text-slate-100 placeholder-slate-600 text-xs md:text-sm font-semibold focus:outline-none focus:ring-0 flex-1 py-1"
                      value={verificationPhone}
                      onChange={(e) => setVerificationPhone(e.target.value)}
                    />
                  </div>
                </div>

                {verifyError && (
                  <p className="text-red-400 text-[11px] font-bold text-center">
                    ⚠️ {verifyError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={verifying}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-550 hover:to-blue-550 text-white rounded-xl text-xs font-black tracking-wider transition disabled:from-slate-800 disabled:to-slate-850"
                >
                  {verifying ? 'Vérification en cours...' : 'Vérifier & Afficher mes véhicules'}
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* SECTION 2: CLIENT INFO & META */}
              {result.client && (
                <div className="bg-slate-900/40 border border-slate-850/80 rounded-2xl p-4 max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Destinataire d'Importation</div>
                      <div className="text-xs text-white font-black">{result.client.full_name}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2.5">
                    <div className="text-right hidden sm:block">
                      <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Numéro de Téléphone</div>
                      <div className="text-xs text-slate-350 font-mono font-bold">{result.client.phone}</div>
                    </div>
                    {result.client.phone !== '••••••••••' && (
                      <a
                        href={`tel:${result.client.phone}`}
                        className="p-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition"
                        title="Appeler le client"
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION 3: ASSOCIATED VEHICLES LIST */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                      Cargaison Maritime
                    </span>
                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                      {result.type === 'tracking_number' ? 'Votre Véhicule en Transit' : `Véhicules dans ce Conteneur (${cars.length})`}
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-900 border border-slate-800 text-slate-400">
                    Lot d'Importation
                  </span>
                </div>

                {/* Cars Grid List */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {cars.map((car: any) => {
                    const specData = typeof car.specs === 'string' ? JSON.parse(car.specs) : car.specs || {}
                    const title = `${car.vehicle_brand} ${car.vehicle_model}`
                    return (
                      <div
                        key={car.id}
                        className="group bg-slate-900/40 hover:bg-slate-900/70 border border-slate-850 hover:border-indigo-500/40 rounded-3xl overflow-hidden p-5 shadow-lg flex flex-col justify-between hover:scale-[1.02] transition-all duration-300"
                      >
                        <div>
                          {/* Badge / Year */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-950 text-indigo-400 border border-slate-800 uppercase">
                              {car.vehicle_year}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                              {car.tracking_status}
                            </span>
                          </div>

                          {/* Brand & Model */}
                          <h4 className="text-sm font-black text-white group-hover:text-indigo-400 transition-colors leading-snug">
                            {title}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                            Couleur: <span className="text-slate-200 capitalize">{car.color}</span>
                          </p>

                          {/* Mini spec table */}
                          <div className="mt-4 bg-slate-950/60 rounded-xl p-3 border border-slate-850/60 space-y-1.5 text-[10px]">
                            {specData.engine && (
                              <div className="flex justify-between text-slate-400">
                                <span>Moteur:</span>
                                <span className="text-white font-bold">{specData.engine}</span>
                              </div>
                            )}
                            {specData.power && (
                              <div className="flex justify-between text-slate-450">
                                <span>Puissance:</span>
                                <span className="text-white font-bold">{specData.power}</span>
                              </div>
                            )}
                            {specData.transmission && (
                              <div className="flex justify-between text-slate-450">
                                <span>Boite:</span>
                                <span className="text-white font-bold">{specData.transmission}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Financial & Status Footer */}
                        <div className="mt-6 pt-4 border-t border-slate-850 space-y-4">
                          {/* Financial info */}
                          <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold">
                            <div>
                              <span className="text-slate-550 block">Acompte versé</span>
                              <span className="text-emerald-400 font-bold font-mono">
                                {result?.type === 'tracking_number' ? '•••••• DA' : `${car.deposit_paid?.toLocaleString('fr-DZ')} DA`}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-slate-550 block">Reste à payer</span>
                              <span className="text-red-400 font-bold font-mono">
                                {result?.type === 'tracking_number' ? '•••••• DA' : `${car.balance_due?.toLocaleString('fr-DZ')} DA`}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <button
                            onClick={() => setSelectedCar(car)}
                            className="w-full py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-750 text-white rounded-xl text-[10px] font-black transition flex items-center justify-center gap-1.5"
                          >
                            <Car className="h-3.5 w-3.5 text-indigo-400" />
                            Fiche Technique & Statut
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {/* DYNAMIC METRIC INSIGHTS */}
          <div className="grid md:grid-cols-3 gap-6 bg-slate-900/30 border border-slate-850 rounded-3xl p-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                <Coins className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider">Financement Garanti</h4>
                <p className="text-[11px] text-slate-450 leading-relaxed mt-1">
                  Les acomptes sont sécurisés sur des comptes bloqués de transit jusqu'à validation de conformité douanière à l'arrivée.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                <BadgeAlert className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider">Conformité Algérie</h4>
                <p className="text-[11px] text-slate-450 leading-relaxed mt-1">
                  Tous les imports répondent strictement aux décrets en vigueur, y compris les licences moudjahidines et le contrôle technique obligatoire au Port d'Alger.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider">Assistance Démarches</h4>
                <p className="text-[11px] text-slate-450 leading-relaxed mt-1">
                  Notre équipe logistique et notre transitaire agréé au port s'occupent de toute la bureaucratie pour vous livrer un véhicule clé en main.
                </p>
              </div>
            </div>
          </div>

        </main>
      )}

      {/* FOOTER */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-10 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center justify-center gap-2">
            <span className="font-extrabold text-sm text-white tracking-tight">
              {agency.company_name}
            </span>
            <span className="h-4 w-px bg-slate-800" />
            <span>Portail de Suivi Logistique Intégré</span>
          </div>
          <p className="max-w-md mx-auto leading-relaxed">
            Propulsé par la plateforme SaaS Logistique & Showroom Automobile d'Algérie Premium Voyage. Tous droits réservés.
          </p>
        </div>
      </footer>

      {/* SINGLE CAR DETAIL POPUP MODAL */}
      {selectedCar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setSelectedCar(null)}
        >
          <div
            className="w-full max-w-lg bg-slate-900 border border-slate-850 rounded-3xl p-6 text-white space-y-6 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Visual glow details */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 blur-2xl rounded-full" />

            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                {selectedCar.vehicle_year}
              </span>
              <h3 className="text-xl font-black text-white mt-2">
                {selectedCar.vehicle_brand} {selectedCar.vehicle_model}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 font-semibold">
                N° de Suivi: <span className="font-mono text-slate-200">{selectedCar.tracking_number}</span>
              </p>
            </div>

            {/* Specifications Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-850 pb-2">
                Spécifications Techniques
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  { label: 'Carburant', val: selectedCar.fuel_type || 'Essence' },
                  { label: 'Transmission', val: (typeof selectedCar.specs === 'string' ? JSON.parse(selectedCar.specs) : selectedCar.specs || {}).transmission || 'Automatique' },
                  { label: 'Couleur Extérieure', val: selectedCar.color, capitalize: true },
                  { label: 'Pays d\'Origine', val: selectedCar.origin_country || 'Allemagne' },
                  { label: 'Puissance Moteur', val: (typeof selectedCar.specs === 'string' ? JSON.parse(selectedCar.specs) : selectedCar.specs || {}).power || 'N/A' },
                  { label: 'Structure Moteur', val: (typeof selectedCar.specs === 'string' ? JSON.parse(selectedCar.specs) : selectedCar.specs || {}).engine || 'N/A' }
                ].filter(spec => spec.val).map((spec, i) => (
                  <div key={i} className="bg-slate-950/65 rounded-2xl p-3 border border-slate-850/60">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">{spec.label}</span>
                    <span className={`text-xs text-white font-bold mt-0.5 block ${spec.capitalize ? 'capitalize' : ''}`}>{spec.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tracking Status Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-850 pb-2">
                Statut d'Importation & Transit
              </h4>
              <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-850 flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">État actuel du véhicule</span>
                  <div className="text-sm font-black text-indigo-400 mt-0.5">{selectedCar.tracking_status}</div>
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  {selectedCar.status}
                </span>
              </div>
            </div>

            {/* Financial Ledger Details */}
            <div className="space-y-3 bg-slate-950/40 border border-slate-850/80 rounded-2xl p-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                Grand Livre Financier (SaaS CRM)
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-450 font-medium">Prix Total du Véhicule</span>
                  <span className="text-white font-mono font-bold">
                    {result?.type === 'tracking_number' ? '•••••• DA' : `${selectedCar.total_cost?.toLocaleString('fr-DZ')} DA`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450 font-medium">Acompte Versé (Crédit)</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    {result?.type === 'tracking_number' ? '•••••• DA' : `-${selectedCar.deposit_paid?.toLocaleString('fr-DZ')} DA`}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-850 pt-2 font-black">
                  <span className="text-white">Solde Restant Dû</span>
                  <span className="text-red-400 font-mono">
                    {result?.type === 'tracking_number' ? '•••••• DA' : `${selectedCar.balance_due?.toLocaleString('fr-DZ')} DA`}
                  </span>
                </div>
              </div>
              {result?.type === 'tracking_number' && (
                <p className="text-[9px] text-slate-500 font-bold text-center mt-1">
                  🔒 Solde sécurisé. Recherchez avec votre N° de téléphone pour déverrouiller.
                </p>
              )}
            </div>

            {/* Actions CTA */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setSelectedCar(null)}
                className="py-3 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-350 hover:text-white font-bold text-xs transition"
              >
                Fermer la fiche
              </button>
              <a
                href={`https://wa.me/${agency.phone.replace(/\D/g, '')}?text=Bonjour%2C%20je%20souhaite%20avoir%20des%2520nouvelles%20de%20mon%20véhicule%20${encodeURIComponent(selectedCar.vehicle_brand)}%20${encodeURIComponent(selectedCar.vehicle_model)}%20(Suivi%3A%20${selectedCar.tracking_number})`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-555 text-white font-black text-xs transition flex items-center justify-center gap-1.5"
              >
                <Phone className="h-4.5 w-4.5" />
                Contacter Transit
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
