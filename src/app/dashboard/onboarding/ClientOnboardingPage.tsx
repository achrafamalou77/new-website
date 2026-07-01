'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  parseOnboardingFiles,
  parseOnboardingText,
  importFromConnectedMeta,
  commitOnboardingImport,
  scrapeOnboardingCatalog,
  ImportedDataSummary
} from '@/app/actions/import'
import { useLanguage } from '@/lib/contexts/LanguageContext'
import { cn } from '@/lib/utils'
import {
  UploadCloud,
  FileSpreadsheet,
  FileImage,
  FileText,
  Bot,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Plus,
  Sparkles,
  ArrowRight,
  Home,
  Menu,
  Check,
  ChevronRight,
  RefreshCw,
  Link2,
  ClipboardPaste,
  ShieldCheck
} from 'lucide-react'

interface LocalFile {
  name: string
  size: number
  type: string
  content: string // Text content or Base64 URI
  status: 'pending' | 'success' | 'failed'
}

type OnboardingStep = 'upload' | 'scanning' | 'review' | 'success'

export default function ClientOnboardingPage() {
  const { language, dir } = useLanguage()
  
  // App contexts
  const [agencyId, setAgencyId] = useState<string | null>(null)
  const [businessType, setBusinessType] = useState<'travel' | 'car_showroom' | 'ecommerce'>('travel')
  const [step, setStep] = useState<OnboardingStep>('upload')
  
  // Import states
  const [localFiles, setLocalFiles] = useState<LocalFile[]>([])
  const [isDragActive, setIsDragActive] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [ingestMethod, setIngestMethod] = useState<'meta' | 'url' | 'file' | 'paste'>('meta')
  const [scrapeUrl, setScrapeUrl] = useState('')
  const [pastedText, setPastedText] = useState('')
  const [parsedData, setParsedData] = useState<ImportedDataSummary>({
    clients: [],
    trips: [],
    bookings: [],
    cars: [],
    leads: [],
    products: [],
    orders: []
  })
  
  const [activeTab, setActiveTab] = useState<string>('clients')
  const [importStats, setImportStats] = useState<Record<string, number>>({})
  const [isPending, setIsPending] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Translations dictionary
  const t = {
    fr: {
      title: 'Assistant de Migration Onboarding IA',
      subtitle: 'Importez instantanément vos anciennes bases de données, tableurs, listes clients et captures d’écran. L’IA s’occupe du reste.',
      uploadTitle: 'Déposez vos fichiers ici',
      uploadSubtitle: 'Supporte les fichiers CSV, Excel (.xlsx), Textes ou Captures d’écran (.png, .jpg)',
      selectBtn: 'Sélectionner des fichiers',
      tabFiles: 'Uploader des Fichiers',
      tabUrl: 'Scraper Website / Facebook',
      urlPlaceholder: 'Saisissez l’URL de votre page Facebook ou catalogue concurrent...',
      scrapeBtn: 'Scraper & Analyser avec l’IA',
      startBtn: 'Démarrer l’analyse IA',
      analyzing: 'Analyse IA en cours...',
      reviewTitle: 'Vérification et validation des données',
      reviewSubtitle: 'L’IA a extrait les entités suivantes. Double-cliquez sur n’importe quelle case pour modifier les données avant l’import.',
      tabClients: 'Clients',
      tabTrips: 'Voyages / Forfaits',
      tabBookings: 'Réservations',
      tabCars: 'Véhicules',
      tabLeads: 'Prospects (Leads)',
      addRow: 'Ajouter une ligne',
      deleteRow: 'Supprimer',
      importBtn: 'Confirmer l’importation finale',
      importing: 'Importation des données...',
      successTitle: 'Migration Onboarding Réussie !',
      successSubtitle: 'Félicitations ! Vos anciennes données ont été migrées à 100% avec succès dans votre nouvel espace SaaS.',
      exitBtn: 'Accéder au Tableau de Bord',
      importedClients: 'Clients importés',
      importedTrips: 'Voyages importés',
      importedBookings: 'Réservations importées',
      importedCars: 'Véhicules importés',
      importedLeads: 'Prospects importés',
      processingLogs: 'Console de scan IA en direct :',
      noFiles: 'Aucun fichier sélectionné.',
      emptyGrid: 'Aucune donnée détectée pour cette section.'
    },
    ar: {
      title: 'مساعد ترحيل البيانات والتهيئة بالذكاء الاصطناعي',
      subtitle: 'قم برفع ملفاتك القديمة، الجداول، قوائم الزبائن ولقطات الشاشة فوراً. سيتكفل الذكاء الاصطناعي بكل الباقي.',
      uploadTitle: 'اسحب وأفلت الملفات هنا',
      uploadSubtitle: 'يدعم ملفات CSV، Excel، النصوص أو لقطات الشاشة (PNG, JPG)',
      selectBtn: 'اختيار الملفات',
      tabFiles: 'رفع الملفات القديمة',
      tabUrl: 'سحب البيانات من صفحة فيسبوك أو موقع',
      urlPlaceholder: 'أدخل رابط صفحة فيسبوك أو موقع منافس هنا...',
      scrapeBtn: 'سحب وتحليل البيانات بالذكاء الاصطناعي',
      startBtn: 'بدء تحليل الذكاء الاصطناعي',
      analyzing: 'جاري التحليل بالذكاء الاصطناعي...',
      reviewTitle: 'مراجعة وتأكيد البيانات المستخرجة',
      reviewSubtitle: 'استخرج الذكاء الاصطناعي البيانات التالية. انقر نقرًا مزدوجًا على أي خلية لتعديلها قبل الاستيراد النهائي.',
      tabClients: 'الزبائن',
      tabTrips: 'الرحلات / العروض',
      tabBookings: 'الحجوزات',
      tabCars: 'السيارات',
      tabLeads: 'المهتمين والزبائن المحتملين',
      addRow: 'إضافة سطر جديد',
      deleteRow: 'حذف',
      importBtn: 'تأكيد الاستيراد النهائي للبيانات',
      importing: 'جاري استيراد البيانات...',
      successTitle: 'تم ترحيل البيانات بنجاح تام!',
      successSubtitle: 'تهانينا! تم ترحيل كل بياناتك القديمة بنسبة 100% بنجاح إلى منصتك الجديدة.',
      exitBtn: 'الانتقال إلى لوحة التحكم الرئيسية',
      importedClients: 'الزبائن المستوردين',
      importedTrips: 'الرحلات المستوردة',
      importedBookings: 'الحجوزات المستوردة',
      importedCars: 'السيارات المستوردة',
      importedLeads: 'الزبائن المحتملين المستوردين',
      processingLogs: 'شاشة فحص الذكاء الاصطناعي المباشر:',
      noFiles: 'لم يتم اختيار أي ملفات.',
      emptyGrid: 'لا توجد بيانات مستخرجة في هذا القسم.'
    }
  }[language === 'ar' ? 'ar' : 'fr']

  // Load business vertical details from Supabase profile
  useEffect(() => {
    async function loadAgency() {
      const supabase = createClient()
      if (!supabase) return
      
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('agency_id').eq('id', user.id).single()
        if (profile?.agency_id) {
          setAgencyId(profile.agency_id)
          const { data: agency } = await supabase.from('agencies').select('business_type_slug').eq('id', profile.agency_id).single()
          if (agency) {
            const slug = agency.business_type_slug === 'car_showroom'
              ? 'car_showroom'
              : agency.business_type_slug === 'ecommerce'
                ? 'ecommerce'
                : 'travel'
            setBusinessType(slug)
            setActiveTab('clients')
          }
        }
      }
    }
    loadAgency()
  }, [])

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true)
    } else if (e.type === "dragleave") {
      setIsDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFiles(e.dataTransfer.files)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFiles(e.target.files)
    }
  }

  // Local file processing
  const processFiles = async (fileList: FileList) => {
    const loadedFiles: LocalFile[] = []
    const unsupported: string[] = []
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      if (file.size > 10 * 1024 * 1024) {
        unsupported.push(`${file.name}: file is larger than 10 MB`)
        continue
      }
      const isBinaryDocument = /\.(xlsx|xls|pdf)$/i.test(file.name)
      if (/\.(doc|docx)$/i.test(file.name)) {
        unsupported.push(`${file.name}: export as PDF, CSV/TXT, or upload page screenshots`)
        continue
      }
      
      const filePromise = new Promise<LocalFile>((resolve) => {
        const reader = new FileReader()
        
        if (file.type.startsWith('image/') || isBinaryDocument) {
          // Images and binary documents: send as DataURL so the server can extract text safely.
          reader.readAsDataURL(file)
          reader.onload = () => {
            resolve({
              name: file.name,
              size: file.size,
              type: file.type,
              content: reader.result as string,
              status: 'pending'
            })
          }
        } else {
          // Texts, JSON, or CSVs: Read as standard UTF-8 string.
          reader.readAsText(file)
          reader.onload = () => {
            resolve({
              name: file.name,
              size: file.size,
              type: file.type,
              content: reader.result as string,
              status: 'pending'
            })
          }
        }
      })
      
      const res = await filePromise
      loadedFiles.push(res)
    }
    
    setLocalFiles(prev => [...prev, ...loadedFiles])
    if (unsupported.length) {
      setErrorMsg(`Some files need conversion before analysis: ${unsupported.join(' | ')}`)
    }
  }

  const removeFile = (idx: number) => {
    setLocalFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const selectBestReviewTab = (data: ImportedDataSummary) => {
    if ((data.clients || []).length > 0) return setActiveTab('clients')
    if (businessType === 'travel') {
      if ((data.trips || []).length > 0) return setActiveTab('trips')
      if ((data.bookings || []).length > 0) return setActiveTab('bookings')
    }
    if (businessType === 'car_showroom') {
      if ((data.cars || []).length > 0) return setActiveTab('cars')
      if ((data.leads || []).length > 0) return setActiveTab('leads')
    }
    if (businessType === 'ecommerce') {
      if ((data.products || []).length > 0) return setActiveTab('products')
      if ((data.orders || []).length > 0) return setActiveTab('orders')
    }
    setActiveTab('clients')
  }

  const applyParsedResult = (data: ImportedDataSummary) => {
    const nextData: ImportedDataSummary = {
      businessProfile: data.businessProfile,
      sourceEvidence: data.sourceEvidence || [],
      warnings: data.warnings || [],
      clients: data.clients || [],
      trips: data.trips || [],
      bookings: data.bookings || [],
      cars: data.cars || [],
      leads: data.leads || [],
      products: data.products || [],
      orders: data.orders || [],
      analysis: data.analysis
    }
    setParsedData(nextData)
    selectBestReviewTab(nextData)
  }

  const importSummary = (data: ImportedDataSummary) => {
    const counts = [
      `${data.clients?.length || 0} clients`,
      businessType === 'travel'
        ? `${data.trips?.length || 0} voyages`
        : businessType === 'car_showroom'
          ? `${data.cars?.length || 0} vehicules`
          : `${data.products?.length || 0} produits`,
      businessType === 'travel'
        ? `${data.bookings?.length || 0} reservations`
        : businessType === 'car_showroom'
          ? `${data.leads?.length || 0} leads`
          : `${data.orders?.length || 0} commandes`
    ]
    return counts.join(' | ')
  }

  const runImportPipeline = async (
    label: string,
    action: () => Promise<{ success: boolean; data?: ImportedDataSummary; error?: string }>
  ) => {
    setStep('scanning')
    setIsPending(true)
    setErrorMsg(null)
    setLogs([])

    const pushLog = (log: string) => setLogs(prev => [...prev, log])
    pushLog(`Collecte des preuves: ${label}`)
    pushLog('Lecture du contexte agence et verification du business type...')

    try {
      const res = await action()
      if (!res.success || !res.data) throw new Error(res.error || 'Import returned no structured data.')

      pushLog(`Extraction terminee: ${importSummary(res.data)}`)
      if ((res.data.warnings || []).length) {
        pushLog(`Warnings: ${(res.data.warnings || []).slice(0, 2).join(' | ')}`)
      }
      applyParsedResult(res.data)
      setStep('review')
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Import failed')
      setStep('upload')
    } finally {
      setIsPending(false)
    }
  }

  const startMetaImport = async () => {
    await runImportPipeline('Connected Meta page', () => importFromConnectedMeta(businessType))
  }

  // Step 2: Trigger AI Ingestion
  const startAIAnalysis = async () => {
    if (localFiles.length === 0) return
    setStep('scanning')
    setIsPending(true)
    setErrorMsg(null)
    
    // Add real-time scanning log feedbacks
    const pushLog = (log: string) => setLogs(prev => [...prev, log])
    
    setTimeout(() => pushLog(language === 'ar' ? '🔍 جاري الاتصال بخادم الاستيراد الفائق السرعة...' : '🔍 Connexion au pipeline d’importation Aventra AI...'), 500)
    setTimeout(() => pushLog(language === 'ar' ? `📂 جاري فحص وتحليل ${localFiles.length} ملفات...` : `📂 Traitement de ${localFiles.length} fichiers importés...`), 1200)
    
    try {
      // Call AI parsing action
      const res = await parseOnboardingFiles(
        localFiles.map(f => ({ name: f.name, type: f.type, content: f.content })),
        businessType
      )

      if (!res.success || !res.data) {
        throw new Error(res.error || 'AI Scanning returned empty payloads.')
      }

      setTimeout(() => pushLog(language === 'ar' ? '🤖 الذكاء الاصطناعي: تمت قراءة الهياكل بنجاح وتحديد جداول البيانات!' : '🤖 AI Engine: Column structures mapped and values normalized!'), 2200)
      setTimeout(() => {
        // Load parsed data into state
        const nextData = {
          clients: res.data?.clients || [],
          trips: res.data?.trips || [],
          bookings: res.data?.bookings || [],
          cars: res.data?.cars || [],
          leads: res.data?.leads || [],
          products: res.data?.products || [],
          orders: res.data?.orders || []
        }
        setParsedData(nextData)
        selectBestReviewTab(nextData)
        
        pushLog(language === 'ar' ? '✨ تم تصفية البيانات وترتيبها للمراجعة.' : '✨ Process completed. Entering Review Sheet mode.')
        setIsPending(false)
        setStep('review')
      }, 3500)

    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Error parsing files')
      setIsPending(false)
      setStep('upload')
    }
  }

  // Step 2.5: Trigger AI URL Scraping
  const startURLScrape = async () => {
    if (!scrapeUrl.trim()) return
    setStep('scanning')
    setIsPending(true)
    setErrorMsg(null)
    
    const pushLog = (log: string) => setLogs(prev => [...prev, log])
    
    setTimeout(() => pushLog(language === 'ar' ? '🌐 جاري الاتصال بالوكيل الزاحف بالذكاء الاصطناعي...' : '🌐 Connexion au Proxy Crawler Aventra AI...'), 500)
    setTimeout(() => pushLog(language === 'ar' ? `🔎 جاري محاولة سحب وفحص المحتوى من: ${scrapeUrl}...` : `🔎 Tentative d'extraction de : ${scrapeUrl}...`), 1400)
    
    try {
      const res = await scrapeOnboardingCatalog(scrapeUrl, businessType)

      if (!res.success || !res.data) {
        throw new Error(res.error || 'Scraper failed to return structured catalogs.')
      }

      setTimeout(() => pushLog(language === 'ar' ? '🤖 زاحف الذكاء الاصطناعي: تم فحص وتحديد عناصر الكتالوج بنجاح!' : '🤖 Aventra Crawler: Crawled details resolved and mapped!'), 2500)
      setTimeout(() => {
        const nextData = {
          clients: res.data?.clients || [],
          trips: res.data?.trips || [],
          bookings: res.data?.bookings || [],
          cars: res.data?.cars || [],
          leads: res.data?.leads || [],
          products: res.data?.products || [],
          orders: res.data?.orders || []
        }
        setParsedData(nextData)
        selectBestReviewTab(nextData)
        
        pushLog(language === 'ar' ? '✨ تم ملء ورقة المراجعة بالبيانات المسحوبة!' : '✨ Catalog populated successfully into Review Sheets!')
        setIsPending(false)
        setStep('review')
      }, 3800)

    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Scraping failed')
      setIsPending(false)
      setStep('upload')
    }
  }

  const startSmartFileImport = async () => {
    if (localFiles.length === 0) return
    await runImportPipeline(`${localFiles.length} uploaded files`, () =>
      parseOnboardingFiles(
        localFiles.map(f => ({ name: f.name, type: f.type, content: f.content })),
        businessType
      )
    )
  }

  const startSmartUrlImport = async () => {
    if (!scrapeUrl.trim()) return
    await runImportPipeline(scrapeUrl, () =>
      scrapeOnboardingCatalog(scrapeUrl, businessType, { includeConnectedMeta: true })
    )
  }

  const startSmartPasteImport = async () => {
    if (!pastedText.trim()) return
    await runImportPipeline('pasted text', () => parseOnboardingText(pastedText, businessType))
  }

  // Dynamic grid editing handlers
  const handleCellChange = (
    section: 'clients' | 'trips' | 'bookings' | 'cars' | 'leads' | 'products' | 'orders',
    rowIdx: number,
    field: string,
    val: string | number
  ) => {
    setParsedData(prev => {
      const sectionData = [...(prev[section] || [])]
      sectionData[rowIdx] = {
        ...sectionData[rowIdx],
        [field]: val
      }
      return {
        ...prev,
        [section]: sectionData
      }
    })
  }

  const addRow = (section: 'clients' | 'trips' | 'bookings' | 'cars' | 'leads' | 'products' | 'orders') => {
    setParsedData(prev => {
      const sectionData = [...(prev[section] || [])]
      const blankRow: Record<string, any> = {}
      if (section === 'clients') {
        blankRow.full_name = 'New Client Name'
        blankRow.phone = ''
        blankRow.email = ''
        blankRow.classification = 'retail'
      } else if (section === 'trips') {
        blankRow.title = 'New Travel Package'
        blankRow.destination = ''
        blankRow.price = 0
        blankRow.duration_days = 5
      } else if (section === 'cars') {
        blankRow.brand = 'New Brand'
        blankRow.model = 'Model'
        blankRow.year = 2024
        blankRow.price = 0
        blankRow.car_type = 'sell'
      } else if (section === 'bookings') {
        blankRow.client_name = ''
        blankRow.trip_title = ''
        blankRow.total_price = 0
      } else if (section === 'leads') {
        blankRow.name = 'New Lead'
        blankRow.phone = ''
        blankRow.car_interest = ''
      } else if (section === 'products') {
        blankRow.sku = `IMPORT-${Date.now()}`
        blankRow.name = 'New Product'
        blankRow.category = 'general'
        blankRow.price = 0
        blankRow.stock_quantity = 0
      } else if (section === 'orders') {
        blankRow.order_number = `IMPORT-${Date.now()}`
        blankRow.customer_name = ''
        blankRow.customer_phone = ''
        blankRow.total = 0
        blankRow.fulfillment_status = 'new'
      }
      sectionData.push(blankRow)
      return {
        ...prev,
        [section]: sectionData
      }
    })
  }

  const deleteRow = (section: 'clients' | 'trips' | 'bookings' | 'cars' | 'leads' | 'products' | 'orders', rowIdx: number) => {
    setParsedData(prev => {
      const sectionData = prev[section]?.filter((_, i) => i !== rowIdx) || []
      return {
        ...prev,
        [section]: sectionData
      }
    })
  }

  // Step 3: Trigger final database commit
  const finalizeImport = async () => {
    setIsPending(true)
    setErrorMsg(null)
    
    try {
      const res = await commitOnboardingImport(parsedData, businessType)
      
      if (!res.success || !res.stats) {
        throw new Error(res.error || 'Failed to save entries to the database.')
      }

      setImportStats(res.stats)
      setStep('success')
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Error occurred while committing data.')
    } finally {
      setIsPending(false)
    }
  }

  const renderRowIntel = (row: any) => (
    <div className="min-w-[130px] space-y-1">
      <div className={cn(
        "inline-flex items-center rounded-full px-2 py-1 text-[9px] font-black",
        Number(row.confidence || 0) >= 80
          ? "bg-emerald-950/40 text-emerald-300 border border-emerald-500/20"
          : Number(row.confidence || 0) >= 55
            ? "bg-amber-950/40 text-amber-300 border border-amber-500/20"
            : "bg-red-950/40 text-red-300 border border-red-500/20"
      )}>
        {Number(row.confidence || 0)}% confidence
      </div>
      <div className="text-[9px] text-slate-500 line-clamp-2">{row.source_note || row.source || 'smart import'}</div>
      {(row.missing_fields || []).length > 0 && (
        <div className="text-[9px] text-amber-300 line-clamp-2">Missing: {(row.missing_fields || []).join(', ')}</div>
      )}
    </div>
  )

  return (
    <div 
      className={cn(
        "onboarding-import-shell flex-1 flex flex-col min-h-screen bg-slate-50 text-slate-950 font-sans p-6 overflow-y-auto select-none",
        dir === 'rtl' ? "text-right" : "text-left"
      )} 
      dir={dir}
    >
      
      {/* Immersive Dark Glass Banner Header */}
      <div className="onboarding-page-header max-w-5xl mx-auto w-full mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-6 mt-2">
        <div className="space-y-2">
          <div className={cn("flex items-center gap-3.5", dir === 'rtl' && "flex-row-reverse")}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-950/20">
              <Bot className="h-5 w-5" />
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-950 tracking-tight">{t.title}</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium max-w-2xl leading-relaxed">{t.subtitle}</p>
        </div>
        
        {/* Navigation Step Ticker */}
        <div className={cn("flex items-center gap-2.5", dir === 'rtl' && "flex-row-reverse")}>
          {(['upload', 'review', 'success'] as const).map((s, idx) => (
            <React.Fragment key={s}>
              {idx > 0 && <ChevronRight className="h-4 w-4 text-slate-600" />}
              <span className={cn(
                "px-3 py-1.5 rounded-lg text-[10.5px] font-black uppercase tracking-wider transition-all",
                step === s 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/20" 
                  : "bg-[#171717]/40 border border-[#2f2f2f]/40 text-slate-500"
              )}>
                {s === 'upload' ? '1. Upload' : s === 'review' ? '2. Review' : '3. Complete'}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col justify-start">
        
        {errorMsg && (
          <div className={cn("bg-red-950/30 border border-red-500/20 text-red-300 p-4 rounded-xl text-xs font-bold mb-6 flex items-start gap-3.5 animate-[fadeIn_0.2s_ease-out]", dir === 'rtl' && "flex-row-reverse text-right")}>
            <AlertTriangle className="h-4.5 w-4.5 text-red-400 shrink-0 mt-0.5" />
            <p className="flex-1 leading-normal">{errorMsg}</p>
          </div>
        )}

        {/* STEP 1: UPLOAD FILES OR CRAWL URL */}
        {step === 'upload' && (
          <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
            {/* Method Selector Tabs */}
            <div className={cn("flex items-center gap-2 border-b border-[#2f2f2f]/30 pb-2", dir === 'rtl' && "flex-row-reverse")}>
              <button
                onClick={() => setIngestMethod('meta')}
                className={cn(
                  "px-4.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2.5 cursor-pointer select-none",
                  ingestMethod === 'meta'
                    ? "bg-[#2f2f2f] text-slate-100 border border-[#2f2f2f]"
                    : "text-slate-500 hover:text-slate-350"
                )}
              >
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>Connected Meta</span>
              </button>
              <button
                onClick={() => setIngestMethod('file')}
                className={cn(
                  "px-4.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2.5 cursor-pointer select-none",
                  ingestMethod === 'file'
                    ? "bg-[#2f2f2f] text-slate-100 border border-[#2f2f2f]"
                    : "text-slate-500 hover:text-slate-350"
                )}
              >
                <UploadCloud className="h-4 w-4 shrink-0 text-indigo-400" />
                <span>{t.tabFiles}</span>
              </button>
              <button
                onClick={() => setIngestMethod('url')}
                className={cn(
                  "px-4.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2.5 cursor-pointer select-none",
                  ingestMethod === 'url'
                    ? "bg-[#2f2f2f] text-slate-100 border border-[#2f2f2f]"
                    : "text-slate-500 hover:text-slate-350"
                )}
              >
                <Link2 className="h-4 w-4 shrink-0 text-violet-400" />
                <span>{t.tabUrl}</span>
              </button>
              <button
                onClick={() => setIngestMethod('paste')}
                className={cn(
                  "px-4.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2.5 cursor-pointer select-none",
                  ingestMethod === 'paste'
                    ? "bg-[#2f2f2f] text-slate-100 border border-[#2f2f2f]"
                    : "text-slate-500 hover:text-slate-350"
                )}
              >
                <ClipboardPaste className="h-4 w-4 shrink-0 text-sky-400" />
                <span>Paste Text</span>
              </button>
            </div>

            {ingestMethod === 'meta' && (
              <div className="bg-[#171717]/35 border border-[#2f2f2f]/60 rounded-2xl p-10 space-y-6 backdrop-blur-xs text-center flex flex-col items-center justify-center animate-[fadeIn_0.2s_ease-out]">
                <div className="h-14 w-14 rounded-full bg-emerald-950/45 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-md">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-slate-200">Import intelligent depuis la page Meta connectee</h3>
                  <p className="text-[10px] text-slate-500 font-bold max-w-md leading-relaxed">
                    Utilise le token Facebook stocke cote serveur pour lire le profil, les posts recents, les images et les textes visibles. Si Meta refuse une permission, utilisez URL, upload ou paste.
                  </p>
                </div>
                <button
                  onClick={startMetaImport}
                  disabled={isPending}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition active:scale-97 flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20 disabled:bg-[#2f2f2f] disabled:cursor-not-allowed cursor-pointer"
                >
                  <Sparkles className="h-4.5 w-4.5 shrink-0" />
                  <span>Scanner la page Meta connectee</span>
                </button>
              </div>
            )}

            {/* A. FILE UPLOADER VIEW */}
            {ingestMethod === 'file' && (
              <>
                {/* Drag & Drop Glass Panel */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={cn(
                    "border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 flex flex-col items-center justify-center gap-4 cursor-pointer select-none bg-[#171717]/30 backdrop-blur-xs",
                    isDragActive 
                      ? "border-indigo-500 bg-indigo-950/15 shadow-[0_0_20px_rgba(99,102,241,0.1)]" 
                      : "border-[#2f2f2f]/60 hover:border-slate-500/50 hover:bg-[#171717]/50"
                  )}
                >
                  <input
                    type="file"
                    multiple
                    accept=".csv,.txt,.json,.xlsx,.xls,.pdf,image/png,image/jpeg,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload-input"
                  />
                  <label htmlFor="file-upload-input" className="flex flex-col items-center justify-center gap-4 cursor-pointer w-full h-full">
                    <div className="h-14 w-14 rounded-full bg-[#2f2f2f]/60 border border-[#2f2f2f] flex items-center justify-center text-slate-350 shadow-md">
                      <UploadCloud className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-black text-slate-200">{t.uploadTitle}</h3>
                      <p className="text-[10px] text-slate-500 font-bold max-w-sm">{t.uploadSubtitle}</p>
                    </div>
                    <span className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-black transition active:scale-95">
                      {t.selectBtn}
                    </span>
                  </label>
                </div>

                {/* Added Files List */}
                {localFiles.length > 0 && (
                  <div className="bg-[#171717]/65 border border-[#2f2f2f]/40 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className={cn("flex items-center justify-between gap-4 border-b border-[#2f2f2f]/25 pb-3", dir === 'rtl' && "flex-row-reverse")}>
                      <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                        {language === 'ar' ? 'الملفات المحددة :' : 'Fichiers sélectionnés :'} ({localFiles.length})
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {localFiles.map((file, idx) => (
                        <div 
                          key={idx} 
                          className={cn(
                            "bg-[#212121]/30 border border-[#2f2f2f]/55 hover:border-slate-500/25 p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs",
                            dir === 'rtl' && "flex-row-reverse"
                          )}
                        >
                          <div className={cn("flex items-center gap-3.5", dir === 'rtl' && "flex-row-reverse text-right")}>
                            {file.type.startsWith('image/') ? (
                              <FileImage className="h-5 w-5 text-violet-400 shrink-0" />
                            ) : file.name.endsWith('.csv') ? (
                              <FileSpreadsheet className="h-5 w-5 text-emerald-400 shrink-0" />
                            ) : (
                              <FileText className="h-5 w-5 text-indigo-400 shrink-0" />
                            )}
                            <div className="space-y-0.5 max-w-[180px] md:max-w-[240px]">
                              <p className="font-sans font-bold text-slate-200 truncate leading-normal">{file.name}</p>
                              <p className="text-[9.5px] text-slate-500 font-extrabold">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => removeFile(idx)}
                            className="p-2 rounded-lg hover:bg-red-950/20 text-slate-500 hover:text-red-400 transition cursor-pointer"
                            title="Remove file"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Primary Scan triggers */}
                    <div className={cn("flex justify-end pt-3 border-t border-[#2f2f2f]/10", dir === 'rtl' && "justify-start")}>
                      <button
                        onClick={startSmartFileImport}
                        className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition active:scale-97 flex items-center gap-2 shadow-lg shadow-indigo-950/20 cursor-pointer"
                      >
                        <Sparkles className="h-4.5 w-4.5" />
                        <span>{t.startBtn}</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* B. AI URL CRAWLER VIEW */}
            {ingestMethod === 'url' && (
              <div className="bg-[#171717]/35 border border-[#2f2f2f]/60 rounded-2xl p-10 space-y-6 backdrop-blur-xs text-center flex flex-col items-center justify-center animate-[fadeIn_0.2s_ease-out]">
                <div className="h-14 w-14 rounded-full bg-[#2f2f2f]/60 border border-[#2f2f2f] flex items-center justify-center text-violet-400 shadow-md">
                  <Bot className="h-6 w-6 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-slate-200">
                    {language === 'ar' ? 'سحب البيانات التلقائي من رابط صفحة فيسبوك أو موقع منافس' : 'Scraper instantanément un catalogue depuis une URL'}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold max-w-md leading-relaxed">
                    {language === 'ar'
                      ? 'أدخل رابط صفحة فيسبوك أو كتالوج منافسك. ستقوم خوارزمية الذكاء الاصطناعي بسحب الرحلات والسيارات والزبائن وتثبيتها فوراً.'
                      : 'Collez le lien de votre page Facebook professionnelle ou d\'un catalogue concurrent. L\'IA va crawler la page et structurer les données en un clic.'}
                  </p>
                </div>
                
                <div className={cn("w-full max-w-xl flex flex-col md:flex-row gap-3 mt-2", dir === 'rtl' && "flex-row-reverse")}>
                  <input
                    type="url"
                    value={scrapeUrl}
                    onChange={e => setScrapeUrl(e.target.value)}
                    placeholder={t.urlPlaceholder}
                    className="flex-1 bg-[#212121] border border-[#2f2f2f] rounded-xl px-4 py-2.5 outline-none text-xs text-slate-200 focus:border-indigo-500 font-sans select-text"
                  />
                  <button
                    onClick={startSmartUrlImport}
                    disabled={!scrapeUrl.trim() || isPending}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition active:scale-97 flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/20 disabled:bg-[#2f2f2f] disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Sparkles className="h-4.5 w-4.5 shrink-0" />
                    <span>{t.scrapeBtn}</span>
                  </button>
                </div>
              </div>
            )}

            {ingestMethod === 'paste' && (
              <div className="bg-[#171717]/35 border border-[#2f2f2f]/60 rounded-2xl p-8 space-y-5 backdrop-blur-xs animate-[fadeIn_0.2s_ease-out]">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-slate-200">Coller des donnees, posts ou conversations</h3>
                  <p className="text-[10px] text-slate-500 font-bold max-w-2xl leading-relaxed">
                    Collez un catalogue, des posts Facebook, une liste clients, des demandes WhatsApp ou un ancien fichier converti en texte. L'IA le transforme en donnees propres avant import.
                  </p>
                </div>
                <textarea
                  value={pastedText}
                  onChange={e => setPastedText(e.target.value)}
                  rows={10}
                  placeholder="Ex: Istanbul 8 jours, hotel inclus, prix 115000 DA... client Amine +213..."
                  className="w-full bg-[#212121] border border-[#2f2f2f] rounded-xl px-4 py-3 outline-none text-xs text-slate-200 focus:border-indigo-500 font-sans select-text resize-y"
                />
                <div className={cn("flex justify-end", dir === 'rtl' && "justify-start")}>
                  <button
                    onClick={startSmartPasteImport}
                    disabled={!pastedText.trim() || isPending}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition active:scale-97 flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/20 disabled:bg-[#2f2f2f] disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Sparkles className="h-4.5 w-4.5 shrink-0" />
                    <span>Analyser le texte colle</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: HIGH-TECH AI SCANNING PROGRESS */}
        {step === 'scanning' && (
          <div className="bg-[#171717]/85 border border-[#2f2f2f]/60 rounded-2xl p-10 flex flex-col items-center justify-center text-center shadow-2xl min-h-[400px] animate-[fadeIn_0.3s_ease-out]">
            
            {/* Pulsing circular scanning line radar */}
            <div className="relative h-24 w-24 mb-8 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-indigo-500/20 animate-ping opacity-75" />
              <div className="absolute inset-2 rounded-full border border-indigo-500/10 animate-ping opacity-50" />
              <div className="h-16 w-16 rounded-full bg-[#212121] border border-[#2f2f2f]/65 flex items-center justify-center text-indigo-400 shadow-md">
                <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
              </div>
            </div>

            <h3 className="text-base font-black text-slate-200 tracking-wide mb-2 animate-pulse">{t.analyzing}</h3>
            <p className="text-xs text-slate-500 font-bold max-w-sm mb-8 leading-relaxed">
              {language === 'ar' 
                ? 'يقوم الذكاء الاصطناعي حالياً بقراءة الأعمدة ولقطات الشاشة وتطبيع البيانات...' 
                : 'Nos agents IA analysent vos en-têtes et captures d’écran pour structurer vos données.'}
            </p>

            {/* Dynamic simulated log console */}
            <div className="max-w-md w-full bg-black/40 border border-[#2f2f2f]/35 rounded-xl p-4 text-[10px] font-mono text-left text-slate-400 h-32 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-track-transparent">
              {logs.map((log, idx) => (
                <div key={idx} className="animate-[slideInUp_0.2s_ease-out]">{log}</div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: DATA REVIEW GRID SHEET */}
        {step === 'review' && (
          <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
            <div className="bg-[#171717]/70 border border-[#2f2f2f]/45 p-6 rounded-2xl shadow-sm space-y-2">
              <h3 className="text-sm font-black text-slate-200 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                <span>{t.reviewTitle}</span>
              </h3>
              <p className="text-[10px] text-slate-500 font-bold leading-relaxed">{t.reviewSubtitle}</p>
            </div>

            {parsedData.analysis && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  ['Ready', parsedData.analysis.readyRows, 'text-emerald-300'],
                  ['Needs review', parsedData.analysis.reviewRows, 'text-amber-300'],
                  ['Blocked', parsedData.analysis.blockedRows, 'text-red-300'],
                  ['Completeness', `${parsedData.analysis.completeness}%`, 'text-indigo-300'],
                ].map(([label, value, color]) => (
                  <div key={String(label)} className="rounded-2xl border border-[#2f2f2f]/45 bg-[#171717]/65 p-4">
                    <div className="text-[9px] font-black uppercase tracking-wider text-slate-500">{label}</div>
                    <div className={cn("mt-1 text-2xl font-black", color as string)}>{value}</div>
                  </div>
                ))}
                <div className="col-span-2 md:col-span-4 rounded-2xl border border-[#2f2f2f]/45 bg-[#171717]/65 p-4">
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-[10px] font-bold text-slate-400">
                    <span>{parsedData.analysis.sourceCount} sources inspected</span>
                    <span>{parsedData.analysis.chunksAnalyzed} analysis passes</span>
                    <span>{parsedData.analysis.duplicateRowsRemoved} duplicates removed</span>
                    <span>{parsedData.analysis.averageConfidence}% average confidence</span>
                  </div>
                  {parsedData.analysis.recommendations.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {parsedData.analysis.recommendations.map((recommendation, idx) => (
                        <div key={idx} className="text-[10px] text-slate-300">• {recommendation}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {(parsedData.businessProfile || (parsedData.sourceEvidence || []).length > 0 || (parsedData.warnings || []).length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div className="bg-[#171717]/65 border border-[#2f2f2f]/45 rounded-2xl p-4 space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Business profile</div>
                  <div className="text-sm font-black text-slate-200">{parsedData.businessProfile?.name || 'Profile non detecte'}</div>
                  <div className="text-[11px] text-slate-400 leading-relaxed">
                    {[parsedData.businessProfile?.phone, parsedData.businessProfile?.email, parsedData.businessProfile?.website, parsedData.businessProfile?.city]
                      .filter(Boolean)
                      .join(' | ') || 'Aucune coordonnee claire detectee.'}
                  </div>
                  {parsedData.businessProfile?.description && (
                    <div className="text-[10px] text-slate-500 line-clamp-3">{parsedData.businessProfile.description}</div>
                  )}
                </div>

                <div className="bg-[#171717]/65 border border-[#2f2f2f]/45 rounded-2xl p-4 space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Evidence sources</div>
                  <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                    {(parsedData.sourceEvidence || []).slice(0, 8).map((source, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-3 rounded-lg bg-[#212121]/35 border border-[#2f2f2f]/30 px-2.5 py-2">
                        <span className="text-[10px] font-bold text-slate-300 truncate">{source.title}</span>
                        <span className="text-[9px] font-black uppercase text-slate-500">{source.source}</span>
                      </div>
                    ))}
                    {(parsedData.sourceEvidence || []).length === 0 && (
                      <div className="text-[11px] text-slate-500">No source evidence returned.</div>
                    )}
                  </div>
                </div>

                <div className="bg-[#171717]/65 border border-[#2f2f2f]/45 rounded-2xl p-4 space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Warnings</div>
                  <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                    {(parsedData.warnings || []).slice(0, 8).map((warning, idx) => (
                      <div key={idx} className="text-[10px] text-amber-300 bg-amber-950/20 border border-amber-500/15 rounded-lg px-2.5 py-2 leading-relaxed">
                        {warning}
                      </div>
                    ))}
                    {(parsedData.warnings || []).length === 0 && (
                      <div className="text-[11px] text-emerald-400">No major warnings.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Review Vertical Specific Navigation Tabs */}
            <div className={cn("flex flex-wrap items-center gap-2 border-b border-[#2f2f2f]/30 pb-1.5", dir === 'rtl' && "flex-row-reverse")}>
              <button
                onClick={() => setActiveTab('clients')}
                className={cn(
                  "px-4.5 py-2.5 rounded-xl text-xs font-black transition cursor-pointer select-none",
                  activeTab === 'clients' 
                    ? "bg-[#2f2f2f] text-slate-100 border border-[#2f2f2f]" 
                    : "text-slate-500 hover:text-slate-350"
                )}
              >
                {t.tabClients} ({parsedData.clients?.length || 0})
              </button>

              {businessType === 'travel' && (
                <>
                  <button
                    onClick={() => setActiveTab('trips')}
                    className={cn(
                      "px-4.5 py-2.5 rounded-xl text-xs font-black transition cursor-pointer select-none",
                      activeTab === 'trips' 
                        ? "bg-[#2f2f2f] text-slate-100 border border-[#2f2f2f]" 
                        : "text-slate-500 hover:text-slate-350"
                    )}
                  >
                    {t.tabTrips} ({parsedData.trips?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('bookings')}
                    className={cn(
                      "px-4.5 py-2.5 rounded-xl text-xs font-black transition cursor-pointer select-none",
                      activeTab === 'bookings' 
                        ? "bg-[#2f2f2f] text-slate-100 border border-[#2f2f2f]" 
                        : "text-slate-500 hover:text-slate-350"
                    )}
                  >
                    {t.tabBookings} ({parsedData.bookings?.length || 0})
                  </button>
                </>
              )}

              {businessType === 'car_showroom' && (
                <>
                  <button
                    onClick={() => setActiveTab('cars')}
                    className={cn(
                      "px-4.5 py-2.5 rounded-xl text-xs font-black transition cursor-pointer select-none",
                      activeTab === 'cars' 
                        ? "bg-[#2f2f2f] text-slate-100 border border-[#2f2f2f]" 
                        : "text-slate-500 hover:text-slate-350"
                    )}
                  >
                    {t.tabCars} ({parsedData.cars?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('leads')}
                    className={cn(
                      "px-4.5 py-2.5 rounded-xl text-xs font-black transition cursor-pointer select-none",
                      activeTab === 'leads' 
                        ? "bg-[#2f2f2f] text-slate-100 border border-[#2f2f2f]" 
                        : "text-slate-500 hover:text-slate-350"
                    )}
                  >
                    {t.tabLeads} ({parsedData.leads?.length || 0})
                  </button>
                </>
              )}

              {businessType === 'ecommerce' && (
                <>
                  <button
                    onClick={() => setActiveTab('products')}
                    className={cn(
                      "px-4.5 py-2.5 rounded-xl text-xs font-black transition cursor-pointer select-none",
                      activeTab === 'products'
                        ? "bg-[#2f2f2f] text-slate-100 border border-[#2f2f2f]"
                        : "text-slate-500 hover:text-slate-350"
                    )}
                  >
                    Products ({parsedData.products?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className={cn(
                      "px-4.5 py-2.5 rounded-xl text-xs font-black transition cursor-pointer select-none",
                      activeTab === 'orders'
                        ? "bg-[#2f2f2f] text-slate-100 border border-[#2f2f2f]"
                        : "text-slate-500 hover:text-slate-350"
                    )}
                  >
                    Orders ({parsedData.orders?.length || 0})
                  </button>
                </>
              )}
            </div>

            {/* Premium Editable Sheets and Tables Grid */}
            <div className="bg-[#171717]/65 border border-[#2f2f2f]/45 rounded-2xl p-4 shadow-sm overflow-x-auto">
              
              {/* A. CLIENTS TAB */}
              {activeTab === 'clients' && (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#2f2f2f]/45 text-slate-400">
                      <th className="p-3 font-black uppercase text-[10px] tracking-wider">{language === 'ar' ? 'الاسم الكامل' : 'Nom Complet'}</th>
                      <th className="p-3 font-black uppercase text-[10px] tracking-wider">{language === 'ar' ? 'رقم الهاتف' : 'Téléphone'}</th>
                      <th className="p-3 font-black uppercase text-[10px] tracking-wider">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</th>
                      <th className="p-3 font-black uppercase text-[10px] tracking-wider">{language === 'ar' ? 'التصنيف' : 'Classification'}</th>
                      <th className="p-3 w-16" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2f2f2f]/20">
                    {(parsedData.clients || []).map((row, idx) => (
                      <tr key={idx} className="hover:bg-[#212121]/30 transition group">
                        <td className="p-2">
                          <input 
                            type="text" 
                            value={row.full_name || ''} 
                            onChange={e => handleCellChange('clients', idx, 'full_name', e.target.value)}
                            className="bg-transparent border-none outline-none text-slate-200 w-full focus:bg-[#2f2f2f]/35 rounded px-2 py-1 font-medium font-sans select-text"
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="text" 
                            value={row.phone || ''} 
                            onChange={e => handleCellChange('clients', idx, 'phone', e.target.value)}
                            className="bg-transparent border-none outline-none text-slate-200 w-full focus:bg-[#2f2f2f]/35 rounded px-2 py-1 font-sans select-text"
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="email" 
                            value={row.email || ''} 
                            onChange={e => handleCellChange('clients', idx, 'email', e.target.value)}
                            className="bg-transparent border-none outline-none text-slate-200 w-full focus:bg-[#2f2f2f]/35 rounded px-2 py-1 font-sans select-text"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={row.classification || 'retail'}
                            onChange={e => handleCellChange('clients', idx, 'classification', e.target.value)}
                            className="bg-[#212121] border border-[#2f2f2f] rounded-lg px-2 py-1 outline-none text-xs text-slate-300 focus:border-slate-500 transition cursor-pointer"
                          >
                            <option value="retail">Retail</option>
                            <option value="vip">VIP</option>
                          </select>
                        </td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => deleteRow('clients', idx)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 transition duration-200 opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="Delete row"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(parsedData.clients || []).length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500 font-bold">{t.emptyGrid}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {/* B. TRIPS TAB */}
              {activeTab === 'trips' && (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#2f2f2f]/45 text-slate-400">
                      <th className="p-3 font-black uppercase text-[10px] tracking-wider">{language === 'ar' ? 'العنوان' : 'Titre du Voyage'}</th>
                      <th className="p-3 font-black uppercase text-[10px] tracking-wider">{language === 'ar' ? 'الوجهة' : 'Destination'}</th>
                      <th className="p-3 font-black uppercase text-[10px] tracking-wider">{language === 'ar' ? 'السعر' : 'Prix (DA)'}</th>
                      <th className="p-3 font-black uppercase text-[10px] tracking-wider">{language === 'ar' ? 'المدة باليوم' : 'Durée (Jours)'}</th>
                      <th className="p-3 w-16" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2f2f2f]/20">
                    {(parsedData.trips || []).map((row, idx) => (
                      <tr key={idx} className="hover:bg-[#212121]/30 transition group">
                        <td className="p-2">
                          <input 
                            type="text" 
                            value={row.title || ''} 
                            onChange={e => handleCellChange('trips', idx, 'title', e.target.value)}
                            className="bg-transparent border-none outline-none text-slate-200 w-full focus:bg-[#2f2f2f]/35 rounded px-2 py-1 font-medium font-sans select-text"
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="text" 
                            value={row.destination || ''} 
                            onChange={e => handleCellChange('trips', idx, 'destination', e.target.value)}
                            className="bg-transparent border-none outline-none text-slate-200 w-full focus:bg-[#2f2f2f]/35 rounded px-2 py-1 font-sans select-text"
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="number" 
                            value={row.price || 0} 
                            onChange={e => handleCellChange('trips', idx, 'price', Number(e.target.value))}
                            className="bg-transparent border-none outline-none text-slate-200 w-full focus:bg-[#2f2f2f]/35 rounded px-2 py-1 font-sans select-text"
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="number" 
                            value={row.duration_days || 1} 
                            onChange={e => handleCellChange('trips', idx, 'duration_days', Number(e.target.value))}
                            className="bg-transparent border-none outline-none text-slate-200 w-full focus:bg-[#2f2f2f]/35 rounded px-2 py-1 font-sans select-text"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => deleteRow('trips', idx)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 transition duration-200 opacity-0 group-hover:opacity-100 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(parsedData.trips || []).length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500 font-bold">{t.emptyGrid}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {/* C. BOOKINGS TAB */}
              {activeTab === 'bookings' && (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#2f2f2f]/45 text-slate-400">
                      <th className="p-3 font-black uppercase text-[10px] tracking-wider">{language === 'ar' ? 'اسم الزبون' : 'Nom Client'}</th>
                      <th className="p-3 font-black uppercase text-[10px] tracking-wider">{language === 'ar' ? 'عنوان الرحلة' : 'Titre Voyage'}</th>
                      <th className="p-3 font-black uppercase text-[10px] tracking-wider">{language === 'ar' ? 'السعر الإجمالي' : 'Prix Total (DA)'}</th>
                      <th className="p-3 font-black uppercase text-[10px] tracking-wider">{language === 'ar' ? 'الحالة' : 'Statut'}</th>
                      <th className="p-3 w-16" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2f2f2f]/20">
                    {(parsedData.bookings || []).map((row, idx) => (
                      <tr key={idx} className="hover:bg-[#212121]/30 transition group">
                        <td className="p-2">
                          <input 
                            type="text" 
                            value={row.client_name || ''} 
                            onChange={e => handleCellChange('bookings', idx, 'client_name', e.target.value)}
                            className="bg-transparent border-none outline-none text-slate-200 w-full focus:bg-[#2f2f2f]/35 rounded px-2 py-1 font-medium font-sans select-text"
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="text" 
                            value={row.trip_title || ''} 
                            onChange={e => handleCellChange('bookings', idx, 'trip_title', e.target.value)}
                            className="bg-transparent border-none outline-none text-slate-200 w-full focus:bg-[#2f2f2f]/35 rounded px-2 py-1 font-sans select-text"
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="number" 
                            value={row.total_price || 0} 
                            onChange={e => handleCellChange('bookings', idx, 'total_price', Number(e.target.value))}
                            className="bg-transparent border-none outline-none text-slate-200 w-full focus:bg-[#2f2f2f]/35 rounded px-2 py-1 font-sans select-text"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={row.status || 'confirmed'}
                            onChange={e => handleCellChange('bookings', idx, 'status', e.target.value)}
                            className="bg-[#212121] border border-[#2f2f2f] rounded-lg px-2 py-1 outline-none text-xs text-slate-300 focus:border-slate-500 transition cursor-pointer"
                          >
                            <option value="confirmed">Confirmed</option>
                            <option value="pending">Pending</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => deleteRow('bookings', idx)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 transition duration-200 opacity-0 group-hover:opacity-100 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(parsedData.bookings || []).length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500 font-bold">{t.emptyGrid}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {/* D. CARS TAB */}
              {activeTab === 'cars' && (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#2f2f2f]/45 text-slate-400">
                      <th className="p-3 font-black uppercase text-[10px] tracking-wider">{language === 'ar' ? 'العلامة' : 'Marque'}</th>
                      <th className="p-3 font-black uppercase text-[10px] tracking-wider">{language === 'ar' ? 'النموذج' : 'Modèle'}</th>
                      <th className="p-3 font-black uppercase text-[10px] tracking-wider">{language === 'ar' ? 'السنة' : 'Année'}</th>
                      <th className="p-3 font-black uppercase text-[10px] tracking-wider">{language === 'ar' ? 'السعر' : 'Prix (DA)'}</th>
                      <th className="p-3 font-black uppercase text-[10px] tracking-wider">{language === 'ar' ? 'الفئة' : 'Type'}</th>
                      <th className="p-3 w-16" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2f2f2f]/20">
                    {(parsedData.cars || []).map((row, idx) => (
                      <tr key={idx} className="hover:bg-[#212121]/30 transition group">
                        <td className="p-2">
                          <input 
                            type="text" 
                            value={row.brand || ''} 
                            onChange={e => handleCellChange('cars', idx, 'brand', e.target.value)}
                            className="bg-transparent border-none outline-none text-slate-200 w-full focus:bg-[#2f2f2f]/35 rounded px-2 py-1 font-medium font-sans select-text"
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="text" 
                            value={row.model || ''} 
                            onChange={e => handleCellChange('cars', idx, 'model', e.target.value)}
                            className="bg-transparent border-none outline-none text-slate-200 w-full focus:bg-[#2f2f2f]/35 rounded px-2 py-1 font-sans select-text"
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="number" 
                            value={row.year || 2024} 
                            onChange={e => handleCellChange('cars', idx, 'year', Number(e.target.value))}
                            className="bg-transparent border-none outline-none text-slate-200 w-full focus:bg-[#2f2f2f]/35 rounded px-2 py-1 font-sans select-text"
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="number" 
                            value={row.price || 0} 
                            onChange={e => handleCellChange('cars', idx, 'price', Number(e.target.value))}
                            className="bg-transparent border-none outline-none text-slate-200 w-full focus:bg-[#2f2f2f]/35 rounded px-2 py-1 font-sans select-text"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={row.car_type || 'sell'}
                            onChange={e => handleCellChange('cars', idx, 'car_type', e.target.value)}
                            className="bg-[#212121] border border-[#2f2f2f] rounded-lg px-2 py-1 outline-none text-xs text-slate-300 focus:border-slate-500 transition cursor-pointer"
                          >
                            <option value="sell">Sales (Vente)</option>
                            <option value="rental">Rental (Location)</option>
                          </select>
                        </td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => deleteRow('cars', idx)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 transition duration-200 opacity-0 group-hover:opacity-100 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(parsedData.cars || []).length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500 font-bold">{t.emptyGrid}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {/* E. LEADS TAB */}
              {activeTab === 'leads' && (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#2f2f2f]/45 text-slate-400">
                      <th className="p-3 font-black uppercase text-[10px] tracking-wider">{language === 'ar' ? 'اسم الزبون' : 'Nom Client'}</th>
                      <th className="p-3 font-black uppercase text-[10px] tracking-wider">{language === 'ar' ? 'رقم الهاتف' : 'Téléphone'}</th>
                      <th className="p-3 font-black uppercase text-[10px] tracking-wider">{language === 'ar' ? 'السيارة المطلوبة' : 'Véhicule Intérêt'}</th>
                      <th className="p-3 font-black uppercase text-[10px] tracking-wider">{language === 'ar' ? 'الميزانية' : 'Budget (DA)'}</th>
                      <th className="p-3 w-16" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2f2f2f]/20">
                    {(parsedData.leads || []).map((row, idx) => (
                      <tr key={idx} className="hover:bg-[#212121]/30 transition group">
                        <td className="p-2">
                          <input 
                            type="text" 
                            value={row.name || ''} 
                            onChange={e => handleCellChange('leads', idx, 'name', e.target.value)}
                            className="bg-transparent border-none outline-none text-slate-200 w-full focus:bg-[#2f2f2f]/35 rounded px-2 py-1 font-medium font-sans select-text"
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="text" 
                            value={row.phone || ''} 
                            onChange={e => handleCellChange('leads', idx, 'phone', e.target.value)}
                            className="bg-transparent border-none outline-none text-slate-200 w-full focus:bg-[#2f2f2f]/35 rounded px-2 py-1 font-sans select-text"
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="text" 
                            value={row.car_interest || ''} 
                            onChange={e => handleCellChange('leads', idx, 'car_interest', e.target.value)}
                            className="bg-transparent border-none outline-none text-slate-200 w-full focus:bg-[#2f2f2f]/35 rounded px-2 py-1 font-sans select-text"
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="number" 
                            value={row.budget || 0} 
                            onChange={e => handleCellChange('leads', idx, 'budget', Number(e.target.value))}
                            className="bg-transparent border-none outline-none text-slate-200 w-full focus:bg-[#2f2f2f]/35 rounded px-2 py-1 font-sans select-text"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => deleteRow('leads', idx)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 transition duration-200 opacity-0 group-hover:opacity-100 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(parsedData.leads || []).length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500 font-bold">{t.emptyGrid}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {activeTab === 'products' && (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#2f2f2f]/45 text-slate-400">
                      {['SKU', 'Product', 'Category', 'Price (DA)', 'Stock'].map(label => (
                        <th key={label} className="p-3 font-black uppercase text-[10px] tracking-wider">{label}</th>
                      ))}
                      <th className="p-3 w-16" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2f2f2f]/20">
                    {(parsedData.products || []).map((row, idx) => (
                      <tr key={idx} className="hover:bg-[#212121]/30 transition group">
                        {[
                          ['sku', 'text'],
                          ['name', 'text'],
                          ['category', 'text'],
                          ['price', 'number'],
                          ['stock_quantity', 'number'],
                        ].map(([field, type]) => (
                          <td className="p-2" key={field}>
                            <input
                              type={type}
                              value={row[field] ?? ''}
                              onChange={e => handleCellChange('products', idx, field, type === 'number' ? Number(e.target.value) : e.target.value)}
                              className="bg-transparent border-none outline-none text-slate-200 w-full focus:bg-[#2f2f2f]/35 rounded px-2 py-1 font-sans select-text"
                            />
                          </td>
                        ))}
                        <td className="p-2 text-center">
                          <button onClick={() => deleteRow('products', idx)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 cursor-pointer">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(parsedData.products || []).length === 0 && (
                      <tr><td colSpan={6} className="p-8 text-center text-slate-500 font-bold">{t.emptyGrid}</td></tr>
                    )}
                  </tbody>
                </table>
              )}

              {activeTab === 'orders' && (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#2f2f2f]/45 text-slate-400">
                      {['Order', 'Customer', 'Phone', 'Total (DA)', 'Status'].map(label => (
                        <th key={label} className="p-3 font-black uppercase text-[10px] tracking-wider">{label}</th>
                      ))}
                      <th className="p-3 w-16" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2f2f2f]/20">
                    {(parsedData.orders || []).map((row, idx) => (
                      <tr key={idx} className="hover:bg-[#212121]/30 transition group">
                        {[
                          ['order_number', 'text'],
                          ['customer_name', 'text'],
                          ['customer_phone', 'text'],
                          ['total', 'number'],
                        ].map(([field, type]) => (
                          <td className="p-2" key={field}>
                            <input
                              type={type}
                              value={row[field] ?? ''}
                              onChange={e => handleCellChange('orders', idx, field, type === 'number' ? Number(e.target.value) : e.target.value)}
                              className="bg-transparent border-none outline-none text-slate-200 w-full focus:bg-[#2f2f2f]/35 rounded px-2 py-1 font-sans select-text"
                            />
                          </td>
                        ))}
                        <td className="p-2">
                          <select
                            value={row.fulfillment_status || 'new'}
                            onChange={e => handleCellChange('orders', idx, 'fulfillment_status', e.target.value)}
                            className="bg-[#212121] border border-[#2f2f2f] rounded-lg px-2 py-1 text-xs text-slate-300"
                          >
                            {['new', 'confirmed', 'packed', 'shipped', 'delivered', 'returned', 'cancelled'].map(status => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2 text-center">
                          <button onClick={() => deleteRow('orders', idx)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 cursor-pointer">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(parsedData.orders || []).length === 0 && (
                      <tr><td colSpan={6} className="p-8 text-center text-slate-500 font-bold">{t.emptyGrid}</td></tr>
                    )}
                  </tbody>
                </table>
              )}

            </div>

            {((parsedData as any)[activeTab] || []).length > 0 && (
              <div className="bg-[#171717]/55 border border-[#2f2f2f]/35 rounded-2xl p-4">
                <div className="mb-3 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  AI confidence and evidence for current tab
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                  {(((parsedData as any)[activeTab] || []) as any[]).map((row, idx) => (
                    <div key={idx} className="rounded-xl border border-[#2f2f2f]/35 bg-[#212121]/25 px-3 py-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-[11px] font-black text-slate-200">
                            {row.full_name || row.title || row.name || row.order_number || `${row.brand || ''} ${row.model || ''}`.trim() || `Row ${idx + 1}`}
                          </div>
                          <div className="mt-1 text-[9px] text-slate-500 line-clamp-2">{row.source_note || row.source || 'smart import'}</div>
                        </div>
                        {renderRowIntel(row)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Floating Action Bar */}
            <div className={cn("flex justify-between items-center gap-4 bg-[#171717]/60 border border-[#2f2f2f]/30 p-4.5 rounded-2xl shadow-sm", dir === 'rtl' && "flex-row-reverse")}>
              <button
                onClick={() => addRow(activeTab as any)}
                className="px-4.5 py-2.5 rounded-xl border border-[#2f2f2f] hover:bg-[#2f2f2f]/45 text-slate-200 text-xs font-black transition active:scale-97 flex items-center gap-2.5 cursor-pointer"
              >
                <Plus className="h-4 w-4 text-slate-400" />
                <span>{t.addRow}</span>
              </button>

              <button
                onClick={finalizeImport}
                disabled={isPending}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition active:scale-97 flex items-center gap-2.5 shadow-lg shadow-indigo-950/20 disabled:bg-[#2f2f2f] disabled:cursor-not-allowed cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4.5 w-4.5 animate-spin text-white" />
                    <span>{t.importing}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-450" />
                    <span>{t.importBtn}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: CELEBRATION SUCCESS SCREEN */}
        {step === 'success' && (
          <div className="bg-[#171717]/90 border border-[#2f2f2f]/60 rounded-2xl p-10 text-center shadow-2xl flex flex-col items-center justify-center max-w-xl mx-auto w-full animate-[fadeIn_0.3s_ease-out] relative overflow-hidden">
            
            {/* Pulsing overlay celebration effect */}
            <div className="h-16 w-16 rounded-full bg-emerald-950/50 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mb-6 shadow-md shadow-emerald-950/20">
              <Check className="h-7 w-7 text-emerald-400" />
            </div>

            <h2 className="text-lg font-black text-slate-100 mb-2 tracking-wide">{t.successTitle}</h2>
            <p className="text-xs text-slate-400 font-medium leading-relaxed mb-8 max-w-sm">{t.successSubtitle}</p>

            {/* List total imported summary statistics */}
            <div className="w-full bg-[#212121]/30 border border-[#2f2f2f]/30 rounded-xl p-4 text-xs font-sans text-slate-400 space-y-2.5 mb-8">
              {importStats.clients ? (
                <div className={cn("flex justify-between items-center", dir === 'rtl' && "flex-row-reverse")}>
                  <span>{t.importedClients}</span>
                  <span className="text-slate-200 font-black">{importStats.clients}</span>
                </div>
              ) : null}
              {importStats.trips ? (
                <div className={cn("flex justify-between items-center", dir === 'rtl' && "flex-row-reverse")}>
                  <span>{t.importedTrips}</span>
                  <span className="text-slate-200 font-black">{importStats.trips}</span>
                </div>
              ) : null}
              {importStats.bookings ? (
                <div className={cn("flex justify-between items-center", dir === 'rtl' && "flex-row-reverse")}>
                  <span>{t.importedBookings}</span>
                  <span className="text-slate-200 font-black">{importStats.bookings}</span>
                </div>
              ) : null}
              {importStats.cars ? (
                <div className={cn("flex justify-between items-center", dir === 'rtl' && "flex-row-reverse")}>
                  <span>{t.importedCars}</span>
                  <span className="text-slate-200 font-black">{importStats.cars}</span>
                </div>
              ) : null}
              {importStats.leads ? (
                <div className={cn("flex justify-between items-center", dir === 'rtl' && "flex-row-reverse")}>
                  <span>{t.importedLeads}</span>
                  <span className="text-slate-200 font-black">{importStats.leads}</span>
                </div>
              ) : null}
            </div>

            <Link
              href="/dashboard"
              className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-black transition active:scale-97 flex items-center gap-2.5 shadow-md shadow-black/10 cursor-pointer"
            >
              <Home className="h-4.5 w-4.5 text-slate-900 shrink-0" />
              <span>{t.exitBtn}</span>
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}
