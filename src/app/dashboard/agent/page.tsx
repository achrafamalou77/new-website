'use client'

import React, { useState, useRef, useEffect, useTransition } from 'react'
import { useLanguage } from '@/lib/contexts/LanguageContext'
import {
  Sparkles, Bot, Send, Check, RefreshCw,
  Compass, TrendingUp, CheckCircle2,
  ShieldAlert, Cpu, ToggleLeft, ToggleRight, Mic,
  Volume2, Database, AlertCircle, Calendar, User, Terminal,
  Plus, ArrowUp, Home, Menu, X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { askAgent, AgentAction } from '@/app/actions/agent'
import { getConversations } from '@/app/actions/conversations'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface ChatMessage {
  id: string
  sender: 'user' | 'ai'
  text: string
  actions?: AgentAction[]
  executedActions?: string[]
  isApplied?: boolean
}

const uiTranslations: Record<string, Record<string, string>> = {
  ar: {
    welcome: `مرحباً بك! أنا **Aventra AI**، مساعدك الذكي للأعمال المدعوم بـ ChatGPT. 🚀\n\nلقد تم ربطي بشكل آمن لمساعدتك في إدارة وتحليل أعمال وكالتك وإجراء التعديلات والعمليات بسرعة فائقة (الرحلات، الحجوزات، الزبائن، والمالية).\n\nيمكنك تفعيل وضع **الطيار الآلي (Auto-Pilot)** للسماح لي بتنفيذ التعديلات مباشرة في قاعدة البيانات، أو إبقائي في وضع **مساعد الطيار (Co-Pilot)** لمراجعة واعتماد كل عملية يدوياً.\n\nكيف يمكنني مساعدتك اليوم؟ أمثلة يمكنك تجربتها:\n- *"زيدلي رحلة لتركيا بـ 18 مليون"* (بالدارجة الجزائرية)\n- *"بدل سعر رحلة إسطنبول لـ 145,000 دج"*\n- *"سجل كريم بن علي كزبون جديد مع رقم الهاتف +213..."*`,
    newChat: 'محادثة جديدة',
    autopilotMode: 'أوضاع التشغيل',
    autopilotTitle: 'الطيار الآلي',
    autopilotDesc: 'كتابة مباشرة بالخادم',
    statsTitle: 'إحصائيات المزامنة',
    tripsLabel: 'عروض الرحلات',
    carsLabel: 'السيارات المتوفرة',
    bookingsLabel: 'إجمالي الحجوزات',
    leadsLabel: 'المهتمين بالسيارات',
    clientsLabel: 'الزبائن المسجلين',
    capitalLabel: 'رأس المال الإجمالي',
    recentActions: 'العمليات الأخيرة',
    privacyDisclaimer: 'جلسة مشفرة وآمنة بالكامل. لا يمكن لأي جهات أخرى الوصول لبيانات وكالتك.',
    activeStatus: 'نشط',
    greetingQuestion: 'كيف يمكنني مساعدتك اليوم؟',
    placeholder: 'اكتب أمرك هنا للوكالة (مثال: زيدلي رحلة لأنطاليا بـ 18 مليون...)',
    warningSandbox: 'بيئة عمل معزولة: جلسة الاتصال مؤمنة ومشفرة بالكامل. لا يمكن لأي أطراف خارجية أو وكالات أخرى قراءة أو تعديل بياناتك.',
    footerText: 'Aventra AI ChatGPT-4o Assistant. البيانات مؤمنة ومشفرة بالكامل.',
    backToDashboard: 'العودة للوحة التحكم',
    actionProposed: 'التعديلات المقترحة (مساعد الطيار)',
    executedActionsTitle: 'العمليات المنفذة بالخادم',
    applyActionBtn: 'اعتماد وتطبيق',
    appliedActionBtn: 'تم الاعتماد',
    toastNewChat: 'تم بدء جلسة محادثة جديدة',
    toastAutopilotOn: 'تم تفعيل وضع الطيار الآلي! سيتم تنفيذ التعديلات مباشرة.',
    toastAutopilotOff: 'تمت العودة إلى وضع مساعد الطيار للموافقة اليدوية.',
    toastActionExecuting: 'جاري تنفيذ العملية...',
    toastActionSuccess: 'تم تطبيق التعديل بنجاح!',
    toastVoiceListening: 'جاري الاستماع إلى أمرك الصوتي للوكالة...',
    toastVoiceSuccess: 'تمت كتابة وتفريغ الأمر الصوتي بنجاح!',
    shortcutTripTitle: '🌴 إضافة رحلة جديدة (أنطاليا)',
    shortcutTripDesc: 'أنشئ باقة رحلة سياحية متكاملة بالدارجة الجزائرية',
    shortcutPriceTitle: '💰 تعديل سعر باقة إسطنبول',
    shortcutPriceDesc: 'تعديل فوري ومباشر لأسعار الرحلات في قاعدة البيانات',
    shortcutClientTitle: '👤 تسجيل زبون/عميل جديد',
    shortcutClientDesc: 'إدراج ملف تعريفي لعميل جديد مع بيانات الاتصال',
    shortcutReportTitle: '📊 استعراض وتحليل البيانات',
    shortcutReportDesc: 'أطلب ملخصات الحجوزات أو تقارير مالية سريعة',
  },
  fr: {
    welcome: `Bienvenue ! Je suis **Aventra AI**, votre copilote d'affaires intelligent propulsé par ChatGPT. 🚀\n\nJe suis connecté de manière sécurisée pour vous aider à gérer et analyser l'activité de votre agence et effectuer des modifications rapides (voyages, réservations, clients et comptabilité).\n\nVous pouvez activer le mode **Auto-Pilote** pour me permettre d'effectuer les modifications directement en base de données, ou me laisser en mode **Co-Pilote** pour réviser et approuver manuellement chaque opération.\n\nComment puis-je vous aider aujourd'hui ? Exemples :\n- *"Ajoute un voyage en Turquie à 18 millions"* (en Darja algérien)\n- *"Change le prix du voyage à Istanbul pour 145 000 DA"*\n- *"Enregistre Karim Ben Ali comme nouveau client avec le numéro +213..."*`,
    newChat: 'Nouvelle discussion',
    autopilotMode: 'Modes de fonctionnement',
    autopilotTitle: 'Auto-Pilote',
    autopilotDesc: 'Écriture directe en base',
    statsTitle: 'Statistiques de synchronisation',
    tripsLabel: 'Offres de voyages',
    carsLabel: 'Véhicules disponibles',
    bookingsLabel: 'Total réservations',
    leadsLabel: 'Prospects intéressés',
    clientsLabel: 'Clients enregistrés',
    capitalLabel: 'Capital Total',
    recentActions: 'Opérations récentes',
    privacyDisclaimer: 'Session entièrement chiffrée et sécurisée. Aucune entité tierce n\'a accès à vos données.',
    activeStatus: 'Actif',
    greetingQuestion: 'Comment puis-je vous aider aujourd\'hui ?',
    placeholder: 'Écrivez votre commande ici (ex: Ajoutez un voyage à Istanbul à 120 000 DA...)',
    warningSandbox: 'Environnement sécurisé : session cryptée et isolée. Vos données sont inaccessibles aux autres agences.',
    footerText: 'Aventra AI Assistant ChatGPT-4o. Données entièrement chiffrées et sécurisées.',
    backToDashboard: 'Retour au tableau de bord',
    actionProposed: 'Modifications proposées (Co-Pilote)',
    executedActionsTitle: 'Opérations exécutées sur le serveur',
    applyActionBtn: 'Approuver & Appliquer',
    appliedActionBtn: 'Approuvé',
    toastNewChat: 'Nouvelle session de discussion démarrée',
    toastAutopilotOn: 'Mode Auto-Pilote activé ! Les modifications seront appliquées directement.',
    toastAutopilotOff: 'Retour au mode Co-Pilote pour approbation manuelle.',
    toastActionExecuting: 'Exécution de l\'action en cours...',
    toastActionSuccess: 'Modifications appliquées avec succès !',
    toastVoiceListening: 'Écoute de votre commande vocale en cours...',
    toastVoiceSuccess: 'Commande vocale transcrite avec succès !',
    shortcutTripTitle: '🌴 Nouveau voyage (Antalya)',
    shortcutTripDesc: 'Créer un pack de voyage en Darja algérien ou en français',
    shortcutPriceTitle: '💰 Modifier prix Istanbul',
    shortcutPriceDesc: 'Modification immédiate des prix en base de données',
    shortcutClientTitle: '👤 Enregistrer nouveau client',
    shortcutClientDesc: 'Insérer un nouveau profil client avec ses coordonnées',
    shortcutReportTitle: '📊 Analyser les données',
    shortcutReportDesc: 'Demander des résumés de réservations ou des rapports financiers rapides',
  },
  en: {
    welcome: `Welcome! I am **Aventra AI**, your intelligent business copilot powered by ChatGPT. 🚀\n\nI am securely connected to help you manage and analyze your agency's business operations and make fast edits (trips, bookings, clients, and finance).\n\nActive the **Auto-Pilot** mode to let me write changes directly to the database, or keep me in **Co-Pilot** mode to manually review and approve every operation.\n\nHow can I help you today? Try:\n- *"Add a trip to Turkey for 18 million"* (in Algerian Darja)\n- *"Change Istanbul trip price to 145,000 DZD"*\n- *"Register Karim Ben Ali as a new client with phone +213..."*`,
    newChat: 'New Chat',
    autopilotMode: 'Operational Modes',
    autopilotTitle: 'Auto-Pilot',
    autopilotDesc: 'Direct server-side writing',
    statsTitle: 'Sync Statistics',
    tripsLabel: 'Trip Packages',
    carsLabel: 'Available Vehicles',
    bookingsLabel: 'Total Bookings',
    leadsLabel: 'Interested Leads',
    clientsLabel: 'Registered Clients',
    capitalLabel: 'Total Capital',
    recentActions: 'Recent Operations',
    privacyDisclaimer: 'Fully encrypted and secure session. No third parties can access your data.',
    activeStatus: 'Active',
    greetingQuestion: 'How can I help you today?',
    placeholder: 'Write your command here (e.g., Add a trip to Antalya for 18 million...)',
    warningSandbox: 'Isolated Sandbox: fully secure and encrypted session. Other agencies cannot read or modify your data.',
    footerText: 'Aventra AI ChatGPT-4o Assistant. Data is fully encrypted and secure.',
    backToDashboard: 'Return to Dashboard',
    actionProposed: 'Suggested Changes (Co-Pilot)',
    executedActionsTitle: 'Executed Server Actions',
    applyActionBtn: 'Approve & Apply',
    appliedActionBtn: 'Approved',
    toastNewChat: 'Started a new chat session',
    toastAutopilotOn: 'Auto-Pilot mode activated! Changes will be committed directly.',
    toastAutopilotOff: 'Returned to Co-Pilot mode for manual approval.',
    toastActionExecuting: 'Executing action...',
    toastActionSuccess: 'Changes successfully applied!',
    toastVoiceListening: 'Listening to your voice command...',
    toastVoiceSuccess: 'Voice command transcribed successfully!',
    shortcutTripTitle: '🌴 New Trip Package (Antalya)',
    shortcutTripDesc: 'Create a complete trip package in Algerian Darja or French',
    shortcutPriceTitle: '💰 Edit Istanbul Package Price',
    shortcutPriceDesc: 'Immediate price modification in the database',
    shortcutClientTitle: '👤 Register New Client',
    shortcutClientDesc: 'Insert a new client profile with contact info',
    shortcutReportTitle: '📊 Extract & Analyze Data',
    shortcutReportDesc: 'Request booking summaries or quick financial reports',
  }
}

export default function AgentPage() {
  const { language, dir } = useLanguage()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  
  useEffect(() => {
    // If the welcome message is the only message and its text is different from current language welcome text
    setMessages(prev => {
      const welcomeText = uiTranslations[language]?.welcome || uiTranslations['fr'].welcome
      if (prev.length === 0) {
        return [
          {
            id: 'welcome',
            sender: 'ai',
            text: welcomeText
          }
        ]
      }
      return prev.map(m => m.id === 'welcome' ? { ...m, text: welcomeText } : m)
    })
  }, [language])

  const [inputVal, setInputVal] = useState('')
  const [isPending, startTransition] = useTransition()
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  // System states
  const [agencyName, setAgencyName] = useState('GoldenBird Voyages')
  const [agencyId, setAgencyId] = useState('')
  const [businessType, setBusinessType] = useState<'travel' | 'car_showroom'>('travel')
  const [autopilot, setAutopilot] = useState(false)
  const [actionTimeline, setActionTimeline] = useState<string[]>([])
  const [toasts, setToasts] = useState<{ id: string; title: string; type: 'success' | 'error' | 'info' }[]>([])
  const [isRecording, setIsRecording] = useState(false)

  // Stats for the marquee ticker tape
  const [tickerStats, setTickerStats] = useState({
    trips: 0,
    bookings: 0,
    clients: 0,
    accounts: 0,
    balance: '0'
  })

  const addToast = (title: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString()
    setToasts(prev => [...prev, { id, title, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }

  const handleNewChat = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: uiTranslations[language]?.welcome || uiTranslations['fr'].welcome
      }
    ])
    setActionTimeline([])
    addToast(uiTranslations[language]?.toastNewChat || uiTranslations['fr'].toastNewChat, 'info')
  }

  // Load context and stats
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await getConversations()
        if (res.success) {
          const supabase = (await import('@/lib/supabase/client')).createClient()
          if (supabase) {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
              const { data: profile } = await supabase.from('profiles').select('agency_id').eq('id', user.id).single()
              if (profile?.agency_id) {
                setAgencyId(profile.agency_id)
                const { data: agency } = await supabase.from('agencies').select('name, business_type_slug').eq('id', profile.agency_id).single()
                if (agency) {
                  setAgencyName(agency.name)
                  setBusinessType(agency.business_type_slug === 'car_showroom' ? 'car_showroom' : 'travel')
                }

                // Load initial numbers for the top ticker stats bar
                const isShowroom = agency?.business_type_slug === 'car_showroom'
                const [primaryRes, secondaryRes, cRes, aRes] = await Promise.all([
                  isShowroom
                    ? supabase.from('car_sales_inventory').select('*', { count: 'exact', head: true }).eq('agency_id', profile.agency_id)
                    : supabase.from('trips').select('*', { count: 'exact', head: true }).eq('agency_id', profile.agency_id),
                  isShowroom
                    ? supabase.from('leads').select('*', { count: 'exact', head: true }).eq('agency_id', profile.agency_id)
                    : supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('agency_id', profile.agency_id),
                  supabase.from('clients').select('*', { count: 'exact', head: true }).eq('agency_id', profile.agency_id),
                  supabase.from('financial_accounts').select('current_balance').eq('agency_id', profile.agency_id)
                ])

                const balanceSum = (aRes.data ?? []).reduce((acc, curr) => acc + Number(curr.current_balance || 0), 0)

                setTickerStats({
                  trips: primaryRes.count || 0,
                  bookings: secondaryRes.count || 0,
                  clients: cRes.count || 0,
                  accounts: aRes.data?.length || 0,
                  balance: balanceSum.toLocaleString()
                })
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to resolve config:', err)
      }
    }
    loadConfig()
  }, [])

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Chat Submission Handler
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputVal.trim() || isPending) return

    const userText = inputVal
    setInputVal('')

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text: userText
    }
    setMessages(prev => [...prev, userMsg])

    // Convert history format
    const history = messages.map(m => ({ sender: m.sender, text: m.text }))

    startTransition(async () => {
      try {
        const reply = await askAgent(userText, history, autopilot, language)

        const aiMsg: ChatMessage = {
          id: Math.random().toString(),
          sender: 'ai',
          text: reply.response,
          actions: reply.actions,
          executedActions: reply.executedActions
        }

        setMessages(prev => [...prev, aiMsg])

        // Add autopilot executions to timeline
        if (reply.executedActions && reply.executedActions.length > 0) {
          setActionTimeline(prev => [...reply.executedActions!, ...prev])
          addToast(
            language === 'fr' ? 'Auto-Pilote : Actions base de données exécutées !' : language === 'ar' ? 'الطيار الآلي: تم تنفيذ التغييرات بالخادم بنجاح!' : 'Auto-Pilot: Database changes committed!',
            'success'
          )
        }
      } catch (err) {
        setMessages(prev => [
          ...prev,
          {
            id: Math.random().toString(),
            sender: 'ai',
            text: language === 'fr'
              ? 'Désolé, je rencontre des difficultés de connexion. Veuillez réessayer.'
              : language === 'ar'
              ? 'عذراً، واجهت مشكلة في الاتصال بالذكاء الاصطناعي. يرجى المحاولة مجدداً.'
              : 'Sorry, I am experiencing connection issues. Please try again.'
          }
        ])
      }
    })
  }

  // Manual Trigger Execution for Staged Copilot Actions
  const handleApplyAction = async (msgId: string, action: AgentAction) => {
    addToast(
      language === 'fr' ? "Exécution de l'action..." : language === 'ar' ? "جاري تنفيذ العملية..." : "Executing action...",
      'info'
    )

    try {
      let success = false
      let err = ''
      const getActionError = (result: { success: boolean; error?: string }) => result.success ? '' : (result.error || '')

      const {
        executeAgencyUpdate, executeCreateTrip, executeUpdateTrip,
        executeDeleteTrip, executeAddClient, executeUpdateBooking
      } = await import('@/app/actions/agent')

      if (action.type === 'UPDATE_AGENCY') {
        const res = await executeAgencyUpdate(agencyId, action.payload)
        success = res.success
        err = getActionError(res)
      } else if (action.type === 'ADD_TRIP') {
        const res = await executeCreateTrip(agencyId, action.payload)
        success = res.success
        err = getActionError(res)
      } else if (action.type === 'UPDATE_TRIP') {
        const res = await executeUpdateTrip(agencyId, action.payload.tripId, action.payload)
        success = res.success
        err = getActionError(res)
      } else if (action.type === 'DELETE_TRIP') {
        const res = await executeDeleteTrip(agencyId, action.payload.tripId)
        success = res.success
        err = getActionError(res)
      } else if (action.type === 'ADD_CLIENT') {
        const res = await executeAddClient(agencyId, action.payload)
        success = res.success
        err = getActionError(res)
      } else if (action.type === 'UPDATE_BOOKING_STATUS') {
        const res = await executeUpdateBooking(agencyId, action.payload.bookingId, action.payload.status)
        success = res.success
        err = getActionError(res)
      }

      if (success) {
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isApplied: true } : m))
        setActionTimeline(prev => [`[Manual] ${action.description}`, ...prev])
        addToast(
          language === 'fr' ? 'Modification appliquée avec succès !' : language === 'ar' ? 'تم تطبيق التعديل بنجاح!' : 'Changes successfully applied!',
          'success'
        )
      } else {
        addToast(
          language === 'fr' ? `Erreur : ${err}` : language === 'ar' ? `حدث خطأ: ${err}` : `Error: ${err}`,
          'error'
        )
      }
    } catch (e) {
      addToast('Error performing action', 'error')
    }
  }

  // Preloaded simulation scripts
  const handleShortcutClick = (text: string) => {
    setInputVal(text)
  }

  // Voice recording simulation handler
  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false)
    } else {
      setIsRecording(true)
      addToast(
        language === 'fr' ? 'Écoute de votre commande vocale...' : language === 'ar' ? 'جاري الاستماع إلى أمرك الصوتي للوكالة...' : 'Listening to your voice command...',
        'info'
      )
      
      // Auto transcribe a sample command after 3.5 seconds
      setTimeout(() => {
        setIsRecording(false)
        setInputVal(
          language === 'ar' 
            ? "زيدلي رحلة لأنطاليا بـ 18 مليون" 
            : "Ajoute un voyage à Antalya à 18 millions"
        )
        addToast(
          language === 'fr' ? 'Commande vocale transcrite avec succès !' : language === 'ar' ? 'تمت كتابة وتفريغ الأمر الصوتي بنجاح!' : 'Voice command transcribed successfully!',
          'success'
        )
      }, 3500)
    }
  }

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex overflow-hidden bg-[#212121] select-none text-slate-100 font-sans",
      dir === 'rtl' ? "text-right" : "text-left"
    )} dir={dir}>
      
      {/* Global CSS Layout Interception: Hides the outer dashboard sidebar and header to give 100% full-screen immersive space */}
      <style jsx global>{`
        /* Hide layout sidebar */
        aside,
        div.select-none.bg-white.shadow-xs,
        .flex.h-screen > div:first-child {
          display: none !important;
        }

        /* Hide layout header */
        header,
        .flex.flex-1.flex-col > header {
          display: none !important;
        }

        /* Fix parent layout wrapping classes if any */
        .flex.h-screen,
        .flex.flex-1.flex-col {
          height: 100vh !important;
          width: 100vw !important;
          padding: 0 !important;
          margin: 0 !important;
        }
      `}</style>

      {/* Toast Notification Stack */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-sm">
        {toasts.map(t => (
          <div
            key={t.id}
            className={cn(
              "px-4.5 py-3 rounded-2xl backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.5)] border text-xs font-bold flex items-center gap-3 transition-all duration-300 animate-[slideInRight_0.3s_ease-out]",
              t.type === 'success' ? "bg-emerald-950/80 border-emerald-500/30 text-emerald-300" :
              t.type === 'error' ? "bg-red-950/80 border-red-500/30 text-red-300" :
              "bg-indigo-950/80 border-indigo-500/30 text-indigo-300"
            )}
          >
            {t.type === 'success' ? <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0" /> :
             t.type === 'error' ? <AlertCircle className="h-4.5 w-4.5 text-red-400 shrink-0" /> :
             <Sparkles className="h-4.5 w-4.5 text-indigo-400 shrink-0" />}
            <span>{t.title}</span>
          </div>
        ))}
      </div>

      {/* 1. Left ChatGPT Sidebar (Controls, Stats, Platform Redirection) */}
      <div className="w-[260px] bg-[#171717] h-full flex flex-col justify-between p-3.5 border-r border-[#2f2f2f]/35 select-none text-slate-200 shrink-0 font-sans hidden md:flex">
        
        {/* Top Area: New Chat button */}
        <div className="space-y-5">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-[#2f2f2f] hover:bg-[#2f2f2f]/40 text-xs font-bold transition active:scale-98 cursor-pointer mt-1"
          >
            <Plus className="h-4 w-4 text-slate-400" />
            <span className="text-slate-100 font-sans">{uiTranslations[language]?.newChat || uiTranslations['fr'].newChat}</span>
          </button>

          {/* Controls & Mode Switchers */}
          <div className="space-y-4">
            <div className={cn("px-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest", dir === 'rtl' ? "text-right" : "text-left")}>
              {uiTranslations[language]?.autopilotMode || uiTranslations['fr'].autopilotMode}
            </div>
            
            <div 
              onClick={() => {
                setAutopilot(!autopilot)
                addToast(
                  !autopilot 
                    ? (uiTranslations[language]?.toastAutopilotOn || uiTranslations['fr'].toastAutopilotOn)
                    : (uiTranslations[language]?.toastAutopilotOff || uiTranslations['fr'].toastAutopilotOff),
                  !autopilot ? 'success' : 'info'
                )
              }}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl border transition cursor-pointer select-none bg-[#212121]/30 border-[#2f2f2f]/60 hover:bg-[#2f2f2f]/20 text-slate-400"
            >
              {dir === 'rtl' ? (
                <>
                  <div className="focus:outline-none shrink-0">
                    {autopilot ? (
                      <ToggleRight className="h-8 w-8 text-emerald-450 drop-shadow-[0_0_4px_rgba(52,211,153,0.3)]" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-slate-500" />
                    )}
                  </div>
                  <div className="text-right">
                    <span className={cn("block text-[10.5px] font-black uppercase tracking-wider transition-colors", autopilot ? "text-emerald-400" : "text-indigo-400")}>
                      {uiTranslations[language]?.autopilotTitle || uiTranslations['fr'].autopilotTitle}
                    </span>
                    <span className="text-[9px] text-slate-500 font-bold block mt-0.5">
                      {uiTranslations[language]?.autopilotDesc || uiTranslations['fr'].autopilotDesc}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-left">
                    <span className={cn("block text-[10.5px] font-black uppercase tracking-wider transition-colors", autopilot ? "text-emerald-400" : "text-indigo-400")}>
                      {uiTranslations[language]?.autopilotTitle || uiTranslations['fr'].autopilotTitle}
                    </span>
                    <span className="text-[9px] text-slate-500 font-bold block mt-0.5">
                      {uiTranslations[language]?.autopilotDesc || uiTranslations['fr'].autopilotDesc}
                    </span>
                  </div>
                  <div className="focus:outline-none shrink-0">
                    {autopilot ? (
                      <ToggleRight className="h-8 w-8 text-emerald-450 drop-shadow-[0_0_4px_rgba(52,211,153,0.3)]" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-slate-500" />
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Stats Panel */}
          <div className="space-y-3 pt-2">
            <div className={cn("px-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest", dir === 'rtl' ? "text-right" : "text-left")}>
              {uiTranslations[language]?.statsTitle || uiTranslations['fr'].statsTitle}
            </div>
            <div className="space-y-2 bg-[#212121]/20 border border-[#2f2f2f]/30 rounded-xl p-3 text-xs text-slate-400">
              <div className="flex items-center justify-between gap-3">
                {dir === 'rtl' ? (
                  <>
                    <span className="text-slate-200 font-black">{tickerStats.trips}</span>
                    <span className="text-slate-400 font-medium">{businessType === 'car_showroom' ? (uiTranslations[language]?.carsLabel || uiTranslations['fr'].carsLabel) : (uiTranslations[language]?.tripsLabel || uiTranslations['fr'].tripsLabel)}</span>
                  </>
                ) : (
                  <>
                    <span className="text-slate-400 font-medium">{businessType === 'car_showroom' ? (uiTranslations[language]?.carsLabel || uiTranslations['fr'].carsLabel) : (uiTranslations[language]?.tripsLabel || uiTranslations['fr'].tripsLabel)}</span>
                    <span className="text-slate-200 font-black">{tickerStats.trips}</span>
                  </>
                )}
              </div>
              <div className="flex items-center justify-between gap-3">
                {dir === 'rtl' ? (
                  <>
                    <span className="text-slate-200 font-black">{tickerStats.bookings}</span>
                    <span className="text-slate-400 font-medium">{businessType === 'car_showroom' ? (uiTranslations[language]?.leadsLabel || uiTranslations['fr'].leadsLabel) : (uiTranslations[language]?.bookingsLabel || uiTranslations['fr'].bookingsLabel)}</span>
                  </>
                ) : (
                  <>
                    <span className="text-slate-400 font-medium">{businessType === 'car_showroom' ? (uiTranslations[language]?.leadsLabel || uiTranslations['fr'].leadsLabel) : (uiTranslations[language]?.bookingsLabel || uiTranslations['fr'].bookingsLabel)}</span>
                    <span className="text-slate-200 font-black">{tickerStats.bookings}</span>
                  </>
                )}
              </div>
              <div className="flex items-center justify-between gap-3">
                {dir === 'rtl' ? (
                  <>
                    <span className="text-slate-200 font-black">{tickerStats.clients}</span>
                    <span className="text-slate-400 font-medium">{uiTranslations[language]?.clientsLabel || uiTranslations['fr'].clientsLabel}</span>
                  </>
                ) : (
                  <>
                    <span className="text-slate-400 font-medium">{uiTranslations[language]?.clientsLabel || uiTranslations['fr'].clientsLabel}</span>
                    <span className="text-slate-200 font-black">{tickerStats.clients}</span>
                  </>
                )}
              </div>
              <div className="h-[1px] bg-[#2f2f2f]/20 my-1.5" />
              <div className={cn("flex flex-col space-y-1 pt-0.5", dir === 'rtl' ? "text-right" : "text-left")}>
                <span className="text-[9px] font-black text-slate-500 uppercase">{uiTranslations[language]?.capitalLabel || uiTranslations['fr'].capitalLabel}</span>
                <span className="text-emerald-400 font-black text-sm">{tickerStats.balance} {language === 'ar' ? 'دج' : 'DA'}</span>
              </div>
            </div>
          </div>

          {/* Compact Mini timeline inside sidebar */}
          {actionTimeline.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className={cn("px-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest", dir === 'rtl' ? "text-right" : "text-left")}>
                {uiTranslations[language]?.recentActions || uiTranslations['fr'].recentActions}
              </div>
              <div className="space-y-2 max-h-36 overflow-y-auto scrollbar-none">
                {actionTimeline.slice(0, 4).map((item, idx) => (
                  <div key={idx} className={cn("bg-[#212121]/30 border border-[#2f2f2f]/25 p-2 rounded-lg text-[10px] text-slate-400 leading-relaxed truncate", dir === 'rtl' ? "text-right" : "text-left")}>
                    <span className="text-slate-500 font-bold block text-[8px] mb-0.5">{new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                    {item.replace('[Success] ', '').replace('[Failed] ', '').replace('[Manual] ', '')}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Bottom Platform Exit and Privacy Disclaimers */}
        <div className="space-y-3 pt-2.5 border-t border-[#2f2f2f]/30">
          <Link
            href="/dashboard"
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-[#2f2f2f] hover:bg-[#2f2f2f]/50 text-xs font-bold text-slate-300 hover:text-slate-100 transition active:scale-98 cursor-pointer font-sans"
          >
            <Home className="h-4 w-4 text-slate-400 shrink-0" />
            <span>{uiTranslations[language]?.backToDashboard || uiTranslations['fr'].backToDashboard}</span>
          </Link>

          <div className={cn("flex items-start gap-2.5 text-[9px] font-bold text-slate-500 leading-normal", dir === 'rtl' ? "text-right" : "text-left")}>
            <p className="flex-1 font-sans">
              {uiTranslations[language]?.privacyDisclaimer || uiTranslations['fr'].privacyDisclaimer}
            </p>
            <ShieldAlert className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
          </div>
        </div>
      </div>

      {/* 2. Main Chat Viewport Area (Deep Gray Center Layout) */}
      <div className="flex-1 flex flex-col h-full bg-[#212121] overflow-hidden relative">
        
        {/* Mobile Header Menu Bar */}
        <div className={cn(
          "h-14 border-b border-[#2f2f2f]/25 flex items-center justify-between px-4 shrink-0 md:hidden bg-[#171717] w-full",
          dir === 'rtl' ? "flex-row-reverse" : "flex-row"
        )}>
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 text-slate-400 hover:text-slate-200 transition focus:outline-none cursor-pointer"
            title="Open Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-xs font-black text-slate-200 font-sans">Aventra AI</span>
          <Link
            href="/dashboard"
            className="p-2 text-slate-400 hover:text-slate-200 transition"
            title="Return to Dashboard"
          >
            <Home className="h-5 w-5" />
          </Link>
        </div>

        {/* Dynamic Chat Messages Stream */}
        {messages.length === 1 && messages[0].id === 'welcome' && !inputVal ? (
          /* Zero-State Greeting Landing Screen - Centered perfectly in view */
          <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
            <div className="max-w-2xl w-full flex flex-col items-center justify-center font-sans">
              <div className="h-16 w-16 rounded-full bg-[#171717] border border-[#2f2f2f] flex items-center justify-center text-slate-200 shadow-md mb-6 animate-pulse">
                <Bot className="h-8 w-8 text-slate-350" />
              </div>
              <h2 className="text-xl font-black text-slate-100 mb-6 text-center">
                {uiTranslations[language]?.greetingQuestion || uiTranslations['fr'].greetingQuestion}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full mt-2">
                <button 
                  onClick={() => handleShortcutClick(language === 'ar' ? "زيدلي رحلة لأنطاليا بـ 18 مليون" : "Ajoute un voyage à Antalya à 18 millions")}
                  className={cn(
                    "bg-[#171717]/40 hover:bg-[#2f2f2f]/30 border border-[#2f2f2f]/30 hover:border-[#2f2f2f]/60 text-slate-300 p-4 rounded-2xl transition-all duration-300 flex flex-col gap-1 cursor-pointer font-sans active:scale-98 shadow-sm",
                    dir === 'rtl' ? "text-right items-end" : "text-left items-start"
                  )}
                >
                  <span className="text-xs font-black text-slate-200">{uiTranslations[language]?.shortcutTripTitle || uiTranslations['fr'].shortcutTripTitle}</span>
                  <span className="text-[10px] text-slate-500 font-bold mt-0.5 leading-normal">{uiTranslations[language]?.shortcutTripDesc || uiTranslations['fr'].shortcutTripDesc}</span>
                </button>
                <button 
                  onClick={() => handleShortcutClick(language === 'ar' ? "بدل سعر رحلة إسطنبول لـ 145000 دج" : "Change le prix du voyage à Istanbul pour 145 000 DA")}
                  className={cn(
                    "bg-[#171717]/40 hover:bg-[#2f2f2f]/30 border border-[#2f2f2f]/30 hover:border-[#2f2f2f]/60 text-slate-300 p-4 rounded-2xl transition-all duration-300 flex flex-col gap-1 cursor-pointer font-sans active:scale-98 shadow-sm",
                    dir === 'rtl' ? "text-right items-end" : "text-left items-start"
                  )}
                >
                  <span className="text-xs font-black text-slate-200">{uiTranslations[language]?.shortcutPriceTitle || uiTranslations['fr'].shortcutPriceTitle}</span>
                  <span className="text-[10px] text-slate-500 font-bold mt-0.5 leading-normal">{uiTranslations[language]?.shortcutPriceDesc || uiTranslations['fr'].shortcutPriceDesc}</span>
                </button>
                <button 
                  onClick={() => handleShortcutClick(language === 'ar' ? "سجل كريم بن علي كزبون جديد مع رقم الهاتف +213 555 22 33 44" : "Enregistre Karim Ben Ali comme nouveau client avec le numéro +213 555 22 33 44")}
                  className={cn(
                    "bg-[#171717]/40 hover:bg-[#2f2f2f]/30 border border-[#2f2f2f]/30 hover:border-[#2f2f2f]/60 text-slate-300 p-4 rounded-2xl transition-all duration-300 flex flex-col gap-1 cursor-pointer font-sans active:scale-98 shadow-sm",
                    dir === 'rtl' ? "text-right items-end" : "text-left items-start"
                  )}
                >
                  <span className="text-xs font-black text-slate-200">{uiTranslations[language]?.shortcutClientTitle || uiTranslations['fr'].shortcutClientTitle}</span>
                  <span className="text-[10px] text-slate-500 font-bold mt-0.5 leading-normal">{uiTranslations[language]?.shortcutClientDesc || uiTranslations['fr'].shortcutClientDesc}</span>
                </button>
                <button 
                  onClick={() => handleShortcutClick(businessType === 'car_showroom' ? (language === 'ar' ? "أعطيني تقرير الزبائن المهتمين" : "Donne-moi le rapport des leads intéressés") : (language === 'ar' ? "ما هي حالة الحجوزات الأخيرة في الوكالة؟" : "Quel est le statut des dernières réservations ?"))}
                  className={cn(
                    "bg-[#171717]/40 hover:bg-[#2f2f2f]/30 border border-[#2f2f2f]/30 hover:border-[#2f2f2f]/60 text-slate-300 p-4 rounded-2xl transition-all duration-300 flex flex-col gap-1 cursor-pointer font-sans active:scale-98 shadow-sm",
                    dir === 'rtl' ? "text-right items-end" : "text-left items-start"
                  )}
                >
                  <span className="text-xs font-black text-slate-200">{uiTranslations[language]?.shortcutReportTitle || uiTranslations['fr'].shortcutReportTitle}</span>
                  <span className="text-[10px] text-slate-500 font-bold mt-0.5 leading-normal">{uiTranslations[language]?.shortcutReportDesc || uiTranslations['fr'].shortcutReportDesc}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Scrolling Messages Flow */
          <div className="flex-1 overflow-y-auto scrollbar-none">
            <div className="max-w-2xl mx-auto w-full px-6 py-8 space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
                  {msg.sender === 'user' ? (
                    /* User bubble: Right aligned, dark gray card pill */
                    <div className={cn("flex flex-col w-full", dir === 'rtl' ? "items-start" : "items-end")}>
                      <div className={cn("bg-[#2f2f2f] text-slate-100 rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed max-w-[70%] font-medium shadow-sm font-sans select-text", dir === 'rtl' ? "text-right" : "text-left")}>
                        {msg.text}
                      </div>
                    </div>
                  ) : (
                    /* AI message: Left aligned airy text, bot avatar, markdown body */
                    <div className={cn("flex items-start gap-4 w-full", dir === 'rtl' ? "text-right" : "text-left")}>
                      <div className="h-8.5 w-8.5 rounded-full bg-[#171717] border border-[#2f2f2f] flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                        <Bot className="h-4.5 w-4.5 text-slate-300" />
                      </div>
                      <div className="flex-1 space-y-3.5 select-text min-w-0 px-1.5">
                        <div className={cn("text-[13.5px] leading-relaxed text-slate-200 font-sans font-medium whitespace-pre-wrap", dir === 'rtl' ? "text-right" : "text-left")}>
                          {msg.text}
                        </div>
                        
                        {/* Auto-pilot execution logs inside chat stream */}
                        {msg.executedActions && msg.executedActions.length > 0 && (
                          <div className={cn("bg-[#12231c]/55 border border-emerald-500/15 rounded-2xl p-4 shadow-sm space-y-2 mt-3 max-w-lg w-full", dir === 'rtl' ? "mr-auto text-right" : "ml-auto text-left")}>
                            <div className={cn("flex items-center gap-1.5 border-b border-emerald-500/10 pb-1.5 mb-1.5", dir === 'rtl' ? "justify-end" : "justify-start")}>
                              {dir === 'rtl' ? (
                                <>
                                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">{uiTranslations[language]?.executedActionsTitle || uiTranslations['fr'].executedActionsTitle}</span>
                                  <Terminal className="h-4 w-4 text-emerald-400 shrink-0" />
                                </>
                              ) : (
                                <>
                                  <Terminal className="h-4 w-4 text-emerald-400 shrink-0" />
                                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">{uiTranslations[language]?.executedActionsTitle || uiTranslations['fr'].executedActionsTitle}</span>
                                </>
                              )}
                            </div>
                            <div className="text-[11px] font-semibold font-mono text-slate-350 space-y-1">
                              {msg.executedActions.map((act, actIdx) => (
                                <div key={actIdx} className={cn("flex items-center gap-2", dir === 'rtl' ? "justify-end" : "justify-start")}>
                                  {dir === 'rtl' ? (
                                    <>
                                      <span>{act}</span>
                                      <span className="text-emerald-400">✓</span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-emerald-400">✓</span>
                                      <span>{act}</span>
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Co-pilot suggested actions (manual approval required) */}
                        {msg.actions && msg.actions.length > 0 && (
                          <div className={cn("mt-3.5 space-y-2 max-w-lg w-full", dir === 'rtl' ? "mr-auto text-right" : "ml-auto text-left")}>
                            <div className={cn("flex items-center gap-1.5 border-b border-[#2f2f2f]/35 pb-1.5 mb-1.5", dir === 'rtl' ? "justify-end" : "justify-start")}>
                              {dir === 'rtl' ? (
                                <>
                                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">{uiTranslations[language]?.actionProposed || uiTranslations['fr'].actionProposed}</span>
                                  <Sparkles className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">{uiTranslations[language]?.actionProposed || uiTranslations['fr'].actionProposed}</span>
                                </>
                              )}
                            </div>
                            <div className="space-y-2">
                              {msg.actions.map((act, actIdx) => (
                                <div key={actIdx} className="bg-[#171717]/60 border border-[#2f2f2f]/40 p-3.5 rounded-xl flex items-center justify-between text-xs font-medium gap-3">
                                  {dir === 'rtl' ? (
                                    <>
                                      <button
                                        onClick={() => handleApplyAction(msg.id, act)}
                                        disabled={msg.isApplied}
                                        className={cn(
                                          "px-3.5 py-1.5 rounded-lg font-bold text-[10.5px] transition active:scale-97 cursor-pointer flex items-center gap-1.5 shrink-0",
                                          msg.isApplied 
                                            ? "bg-emerald-950/40 border border-emerald-500/25 text-emerald-400" 
                                            : "bg-indigo-600 hover:bg-indigo-500 text-white"
                                        )}
                                      >
                                        {msg.isApplied ? (
                                          <>
                                            <Check className="h-3.5 w-3.5" />
                                            <span>{uiTranslations[language]?.appliedActionBtn || uiTranslations['fr'].appliedActionBtn}</span>
                                          </>
                                        ) : (
                                          <span>{uiTranslations[language]?.applyActionBtn || uiTranslations['fr'].applyActionBtn}</span>
                                        )}
                                      </button>
                                      <span className="text-slate-300 font-sans text-right">{act.description}</span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-slate-300 font-sans text-left">{act.description}</span>
                                      <button
                                        onClick={() => handleApplyAction(msg.id, act)}
                                        disabled={msg.isApplied}
                                        className={cn(
                                          "px-3.5 py-1.5 rounded-lg font-bold text-[10.5px] transition active:scale-97 cursor-pointer flex items-center gap-1.5 shrink-0",
                                          msg.isApplied 
                                            ? "bg-emerald-950/40 border border-emerald-500/25 text-emerald-400" 
                                            : "bg-indigo-600 hover:bg-indigo-500 text-white"
                                        )}
                                      >
                                        {msg.isApplied ? (
                                          <>
                                            <Check className="h-3.5 w-3.5" />
                                            <span>{uiTranslations[language]?.appliedActionBtn || uiTranslations['fr'].appliedActionBtn}</span>
                                          </>
                                        ) : (
                                          <span>{uiTranslations[language]?.applyActionBtn || uiTranslations['fr'].applyActionBtn}</span>
                                        )}
                                      </button>
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="border-t border-[#2f2f2f]/10 p-4 shrink-0 bg-[#212121]">
          <form onSubmit={handleSendMessage} className="max-w-2xl mx-auto relative flex items-center bg-[#2f2f2f] rounded-2xl px-4 py-2 border border-[#2f2f2f]/60 focus-within:border-slate-500/35 transition">
            {dir === 'rtl' ? (
              <>
                <button
                  type="submit"
                  disabled={isPending || !inputVal.trim()}
                  className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 shrink-0 font-bold transition active:scale-95 disabled:bg-[#2f2f2f] disabled:text-slate-550 disabled:border-[#2f2f2f] disabled:cursor-not-allowed cursor-pointer"
                >
                  {isPending ? (
                    <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                  ) : (
                    <ArrowUp className="h-4.5 w-4.5" />
                  )}
                </button>
                <input
                  type="text"
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  placeholder={uiTranslations[language]?.placeholder || uiTranslations['fr'].placeholder}
                  className="flex-1 bg-transparent border-none text-right outline-none text-xs text-slate-100 font-sans font-medium placeholder-slate-500 py-2.5 px-3 select-text w-full direction-rtl"
                  disabled={isPending}
                />
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={cn(
                    "p-2 rounded-xl text-slate-450 hover:text-slate-200 transition shrink-0 ml-1.5 cursor-pointer relative",
                    isRecording && "text-red-400 bg-red-950/20"
                  )}
                >
                  <Mic className={cn("h-4.5 w-4.5", isRecording && "animate-pulse")} />
                  {isRecording && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={cn(
                    "p-2 rounded-xl text-slate-450 hover:text-slate-200 transition shrink-0 mr-1.5 cursor-pointer relative",
                    isRecording && "text-red-400 bg-red-950/20"
                  )}
                >
                  <Mic className={cn("h-4.5 w-4.5", isRecording && "animate-pulse")} />
                  {isRecording && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  )}
                </button>
                <input
                  type="text"
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  placeholder={uiTranslations[language]?.placeholder || uiTranslations['fr'].placeholder}
                  className="flex-1 bg-transparent border-none text-left outline-none text-xs text-slate-100 font-sans font-medium placeholder-slate-500 py-2.5 px-3 select-text w-full direction-ltr"
                  disabled={isPending}
                />
                <button
                  type="submit"
                  disabled={isPending || !inputVal.trim()}
                  className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 shrink-0 font-bold transition active:scale-95 disabled:bg-[#2f2f2f] disabled:text-slate-550 disabled:border-[#2f2f2f] disabled:cursor-not-allowed cursor-pointer"
                >
                  {isPending ? (
                    <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                  ) : (
                    <ArrowUp className="h-4.5 w-4.5" />
                  )}
                </button>
              </>
            )}
          </form>
          <div className="text-center text-[10px] text-slate-500 font-semibold mt-2.5 font-sans">
            {uiTranslations[language]?.footerText || uiTranslations['fr'].footerText}
          </div>
        </div>

      </div>

      {/* Mobile Slide-Over Sidebar Drawer */}
      {isMobileSidebarOpen && (
        <div className={cn(
          "fixed inset-0 z-50 flex md:hidden bg-black/60 backdrop-blur-xs animate-[fadeIn_0.2s_ease-out]",
          dir === 'rtl' ? "flex-row" : "flex-row-reverse"
        )}>
          {/* Click outside to close drawer */}
          <div 
            className="flex-1" 
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          
          {/* Drawer Sidebar Container */}
          <div className={cn(
            "w-[260px] bg-[#171717] h-full flex flex-col justify-between p-3.5 border-r border-[#2f2f2f]/35 select-none text-slate-200 font-sans shadow-2xl relative shrink-0",
            dir === 'rtl' ? "animate-[slideInLeft_0.3s_ease-out]" : "animate-[slideInRight_0.3s_ease-out]"
          )}>
            {/* Close Button */}
            <button 
              onClick={() => setIsMobileSidebarOpen(false)}
              className={cn(
                "absolute top-4.5 p-1.5 rounded-lg hover:bg-[#2f2f2f]/50 text-slate-400 hover:text-slate-200 transition cursor-pointer",
                dir === 'rtl' ? "right-4.5" : "left-4.5"
              )}
            >
              <X className="h-4.5 w-4.5" />
            </button>

            {/* Top Area: New Chat button */}
            <div className="space-y-5 mt-10">
              <button
                onClick={() => {
                  handleNewChat()
                  setIsMobileSidebarOpen(false)
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-[#2f2f2f] hover:bg-[#2f2f2f]/40 text-xs font-bold transition active:scale-98 cursor-pointer mt-1"
              >
                <Plus className="h-4 w-4 text-slate-400" />
                <span className="text-slate-100 font-sans">{uiTranslations[language]?.newChat || uiTranslations['fr'].newChat}</span>
              </button>

              {/* Controls & Mode Switchers */}
              <div className="space-y-4">
                <div className={cn("px-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest", dir === 'rtl' ? "text-right" : "text-left")}>
                  {uiTranslations[language]?.autopilotMode || uiTranslations['fr'].autopilotMode}
                </div>
                
                <div 
                  onClick={() => {
                    setAutopilot(!autopilot)
                    addToast(
                      !autopilot 
                        ? (uiTranslations[language]?.toastAutopilotOn || uiTranslations['fr'].toastAutopilotOn)
                        : (uiTranslations[language]?.toastAutopilotOff || uiTranslations['fr'].toastAutopilotOff),
                      !autopilot ? 'success' : 'info'
                    )
                  }}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl border transition cursor-pointer select-none bg-[#212121]/30 border-[#2f2f2f]/60 hover:bg-[#2f2f2f]/20 text-slate-400"
                >
                  {dir === 'rtl' ? (
                    <>
                      <div className="focus:outline-none shrink-0">
                        {autopilot ? (
                          <ToggleRight className="h-8 w-8 text-emerald-450 drop-shadow-[0_0_4px_rgba(52,211,153,0.3)]" />
                        ) : (
                          <ToggleLeft className="h-8 w-8 text-slate-500" />
                        )}
                      </div>
                      <div className="text-right">
                        <span className={cn("block text-[10.5px] font-black uppercase tracking-wider transition-colors", autopilot ? "text-emerald-400" : "text-indigo-400")}>
                          {uiTranslations[language]?.autopilotTitle || uiTranslations['fr'].autopilotTitle}
                        </span>
                        <span className="text-[9px] text-slate-500 font-bold block mt-0.5">
                          {uiTranslations[language]?.autopilotDesc || uiTranslations['fr'].autopilotDesc}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-left">
                        <span className={cn("block text-[10.5px] font-black uppercase tracking-wider transition-colors", autopilot ? "text-emerald-400" : "text-indigo-400")}>
                          {uiTranslations[language]?.autopilotTitle || uiTranslations['fr'].autopilotTitle}
                        </span>
                        <span className="text-[9px] text-slate-500 font-bold block mt-0.5">
                          {uiTranslations[language]?.autopilotDesc || uiTranslations['fr'].autopilotDesc}
                        </span>
                      </div>
                      <div className="focus:outline-none shrink-0">
                        {autopilot ? (
                          <ToggleRight className="h-8 w-8 text-emerald-450 drop-shadow-[0_0_4px_rgba(52,211,153,0.3)]" />
                        ) : (
                          <ToggleLeft className="h-8 w-8 text-slate-500" />
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Stats Panel */}
              <div className="space-y-3 pt-2">
                <div className={cn("px-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest", dir === 'rtl' ? "text-right" : "text-left")}>
                  {uiTranslations[language]?.statsTitle || uiTranslations['fr'].statsTitle}
                </div>
                <div className="space-y-2 bg-[#212121]/20 border border-[#2f2f2f]/30 rounded-xl p-3 text-xs text-slate-400">
                  <div className="flex items-center justify-between gap-3">
                    {dir === 'rtl' ? (
                      <>
                        <span className="text-slate-200 font-black">{tickerStats.trips}</span>
                        <span className="text-slate-400 font-medium">{businessType === 'car_showroom' ? (uiTranslations[language]?.carsLabel || uiTranslations['fr'].carsLabel) : (uiTranslations[language]?.tripsLabel || uiTranslations['fr'].tripsLabel)}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-slate-400 font-medium">{businessType === 'car_showroom' ? (uiTranslations[language]?.carsLabel || uiTranslations['fr'].carsLabel) : (uiTranslations[language]?.tripsLabel || uiTranslations['fr'].tripsLabel)}</span>
                        <span className="text-slate-200 font-black">{tickerStats.trips}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    {dir === 'rtl' ? (
                      <>
                        <span className="text-slate-200 font-black">{tickerStats.bookings}</span>
                        <span className="text-slate-400 font-medium">{businessType === 'car_showroom' ? (uiTranslations[language]?.leadsLabel || uiTranslations['fr'].leadsLabel) : (uiTranslations[language]?.bookingsLabel || uiTranslations['fr'].bookingsLabel)}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-slate-400 font-medium">{businessType === 'car_showroom' ? (uiTranslations[language]?.leadsLabel || uiTranslations['fr'].leadsLabel) : (uiTranslations[language]?.bookingsLabel || uiTranslations['fr'].bookingsLabel)}</span>
                        <span className="text-slate-200 font-black">{tickerStats.bookings}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    {dir === 'rtl' ? (
                      <>
                        <span className="text-slate-200 font-black">{tickerStats.clients}</span>
                        <span className="text-slate-400 font-medium">{uiTranslations[language]?.clientsLabel || uiTranslations['fr'].clientsLabel}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-slate-400 font-medium">{uiTranslations[language]?.clientsLabel || uiTranslations['fr'].clientsLabel}</span>
                        <span className="text-slate-200 font-black">{tickerStats.clients}</span>
                      </>
                    )}
                  </div>
                  <div className="h-[1px] bg-[#2f2f2f]/20 my-1.5" />
                  <div className={cn("flex flex-col space-y-1 pt-0.5", dir === 'rtl' ? "text-right" : "text-left")}>
                    <span className="text-[9px] font-black text-slate-500 uppercase">{uiTranslations[language]?.capitalLabel || uiTranslations['fr'].capitalLabel}</span>
                    <span className="text-emerald-400 font-black text-sm">{tickerStats.balance} {language === 'ar' ? 'دج' : 'DA'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Platform Exit and Privacy Disclaimers */}
            <div className="space-y-3 pt-2.5 border-t border-[#2f2f2f]/30">
              <Link
                href="/dashboard"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-[#2f2f2f] hover:bg-[#2f2f2f]/50 text-xs font-bold text-slate-300 hover:text-slate-100 transition active:scale-98 cursor-pointer font-sans"
              >
                <Home className="h-4 w-4 text-slate-400 shrink-0" />
                <span>{uiTranslations[language]?.backToDashboard || uiTranslations['fr'].backToDashboard}</span>
              </Link>

              <div className={cn("flex items-start gap-2.5 text-[9px] font-bold text-slate-500 leading-normal", dir === 'rtl' ? "text-right" : "text-left")}>
                <p className="flex-1 font-sans">
                  {uiTranslations[language]?.privacyDisclaimer || uiTranslations['fr'].privacyDisclaimer}
                </p>
                <ShieldAlert className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Animations and Keyframes */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(-100%); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes voice-bar {
          0%, 100% { height: 6px; }
          50% { height: 24px; }
        }
      `}</style>
    </div>
  )
}
