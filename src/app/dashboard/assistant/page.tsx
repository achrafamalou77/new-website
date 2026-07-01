'use client'

import React, { useEffect, useRef, useState, useTransition } from 'react'
import { Bot, Check, CheckCircle2, Compass, FileText, Loader2, Send, ShieldCheck, Sparkles, Upload, Users, Wallet, Car, Plane } from 'lucide-react'
import { useLanguage } from '@/lib/contexts/LanguageContext'
import { cn } from '@/lib/utils'
import {
  askAssistant,
  parseUploadedDocument,
  updateAgencyConfigAction,
  addInventoryCarAction,
  addTravelPackageAction,
  addTeamMemberAction,
  addClientAction,
  ParsedBatchData
} from '@/app/actions/assistant'

type BusinessType = 'travel' | 'car_showroom'

interface ChatMessage {
  id: string
  sender: 'user' | 'ai'
  text: string
  actions?: any[]
  isApplied?: boolean
}

interface ChatSession {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messages: ChatMessage[]
}

function welcomeText(language: string, businessType: BusinessType, agencyName: string) {
  if (businessType === 'travel') {
    return language === 'fr'
      ? `Bonjour. Je suis votre **Copilote IA Voyage** pour **${agencyName}**.

Je suis isole sur cette agence uniquement. Je peux aider avec les forfaits voyage, Omra/Hajj, destinations, reservations, clients, paiements, factures, equipe et parametres.`
      : `Hello. I am your **Travel AI Copilot** for **${agencyName}**.

I am isolated to this agency only. I can help with travel packages, Omra/Hajj, destinations, bookings, clients, payments, invoices, team, and settings.`
  }

  return language === 'fr'
    ? `Bonjour. Je suis votre **Copilote IA Showroom** pour **${agencyName}**.

Je suis isole sur ce showroom uniquement. Je peux aider avec le stock vehicules, import, ventes, location, essais, financement, leads, clients, equipe et parametres.`
    : `Hello. I am your **Showroom AI Copilot** for **${agencyName}**.

I am isolated to this showroom only. I can help with vehicle stock, import, sales, rental, test drives, financing, leads, clients, team, and settings.`
}

function capabilityList(language: string, businessType: BusinessType) {
  if (businessType === 'travel') {
    return [
      language === 'fr' ? 'Forfaits voyage, Omra/Hajj et destinations' : 'Travel packages, Omra/Hajj, and destinations',
      language === 'fr' ? 'Reservations, clients, paiements et factures' : 'Bookings, clients, payments, and invoices',
      language === 'fr' ? 'Import de catalogues voyages et donnees clients' : 'Import travel catalogs and client data',
      language === 'fr' ? 'Conseils commerciaux et suivi des leads' : 'Sales advice and lead follow-up',
    ]
  }

  return [
    language === 'fr' ? 'Stock showroom, prix et disponibilite' : 'Showroom stock, pricing, and availability',
    language === 'fr' ? 'Import, location, essais et financement' : 'Import, rental, test drives, and financing',
    language === 'fr' ? 'Leads, clients, ventes et relances' : 'Leads, clients, sales, and follow-ups',
    language === 'fr' ? 'Import de catalogues autos et donnees clients' : 'Import vehicle catalogs and client data',
  ]
}

function makeId() {
  return `chat_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

export default function AssistantPage() {
  const { language } = useLanguage()
  const [activeTab, setActiveTab] = useState<'chat' | 'import'>('chat')
  const [agencyName, setAgencyName] = useState('GoldenBird Voyages')
  const [agencyId, setAgencyId] = useState('')
  const [businessType, setBusinessType] = useState<BusinessType>('travel')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState('')
  const [inputVal, setInputVal] = useState('')
  const [isPending, startTransition] = useTransition()
  const [isDbWorking, setIsDbWorking] = useState(false)
  const [toasts, setToasts] = useState<{ id: string; title: string; type: 'success' | 'error' | 'info' }[]>([])

  const [isDragOver, setIsDragOver] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>(null)
  const [parsedData, setParsedData] = useState<ParsedBatchData | null>(null)
  const [appliedImporter, setAppliedImporter] = useState(false)
  const [importerError, setImporterError] = useState<string | null>(null)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isTravel = businessType === 'travel'
  const chatStorageKey = agencyId ? `assistant-chat-sessions-${agencyId}` : ''
  const accent = 'text-neutral-950'
  const accentBg = 'bg-neutral-950 hover:bg-black'
  const activeSession = chatSessions.find(session => session.id === activeSessionId)

  const addToast = (title: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString()
    setToasts(prev => [...prev, { id, title, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }

  const buildSessionTitle = (items: ChatMessage[]) => {
    const firstQuestion = items.find(item => item.sender === 'user')?.text?.trim()
    if (!firstQuestion) return language === 'fr' ? 'Nouvelle discussion' : 'New chat'
    return firstQuestion.length > 42 ? `${firstQuestion.slice(0, 42)}...` : firstQuestion
  }

  const createSession = (type: BusinessType, name: string): ChatSession => {
    const now = new Date().toISOString()
    const welcome: ChatMessage = {
      id: 'welcome',
      sender: 'ai',
      text: welcomeText(language, type, name),
    }

    return {
      id: makeId(),
      title: language === 'fr' ? 'Nouvelle discussion' : 'New chat',
      createdAt: now,
      updatedAt: now,
      messages: [welcome],
    }
  }

  const startNewChat = () => {
    const session = createSession(businessType, agencyName)
    const nextSessions = [session, ...chatSessions]
    setChatSessions(nextSessions)
    setActiveSessionId(session.id)
    setMessages(session.messages)
    if (chatStorageKey) localStorage.setItem(chatStorageKey, JSON.stringify(nextSessions))
  }

  const openChatSession = (session: ChatSession) => {
    setActiveSessionId(session.id)
    setMessages(session.messages)
  }

  const clearAllChats = () => {
    const session = createSession(businessType, agencyName)
    setChatSessions([session])
    setActiveSessionId(session.id)
    setMessages(session.messages)
    if (chatStorageKey) localStorage.setItem(chatStorageKey, JSON.stringify([session]))
  }

  useEffect(() => {
    async function loadConfig() {
      try {
        const supabase = (await import('@/lib/supabase/client')).createClient()
        if (!supabase) return
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase.from('profiles').select('agency_id').eq('id', user.id).single()
        if (!profile?.agency_id) return

        setAgencyId(profile.agency_id)
        const { data: agency } = await supabase
          .from('agencies')
          .select('name, business_type_slug')
          .eq('id', profile.agency_id)
          .single()

        const nextType: BusinessType = agency?.business_type_slug === 'car_showroom' ? 'car_showroom' : 'travel'
        setAgencyName(agency?.name || 'Votre entreprise')
        setBusinessType(nextType)
        const storageKey = `assistant-chat-sessions-${profile.agency_id}`
        const saved = localStorage.getItem(storageKey)
        if (saved) {
          try {
            const parsed = JSON.parse(saved) as ChatSession[]
            if (Array.isArray(parsed) && parsed.length > 0) {
              setChatSessions(parsed)
              setActiveSessionId(parsed[0].id)
              setMessages(parsed[0].messages || [])
              return
            }
          } catch {
            localStorage.removeItem(storageKey)
          }
        }

        setMessages(prev => {
          const saved = localStorage.getItem(storageKey)
          if (saved) {
            try {
              const parsed = JSON.parse(saved) as ChatSession[]
              if (Array.isArray(parsed) && parsed.length > 0) return parsed[0].messages
            } catch {
              localStorage.removeItem(storageKey)
            }
          }
          if (prev.length > 0 && prev[0].id !== 'welcome') return prev
          const session = createSession(nextType, agency?.name || 'Votre entreprise')
          setChatSessions([session])
          setActiveSessionId(session.id)
          localStorage.setItem(storageKey, JSON.stringify([session]))
          return session.messages
        })
      } catch (err) {
        console.error('Failed to resolve assistant context:', err)
      }
    }
    loadConfig()
  }, [language])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isPending])

  useEffect(() => {
    if (!chatStorageKey || !activeSessionId || messages.length === 0) return

    setChatSessions(prev => {
      const now = new Date().toISOString()
      const nextSessions = prev.map(session =>
        session.id === activeSessionId
          ? {
              ...session,
              title: buildSessionTitle(messages),
              updatedAt: now,
              messages: messages.slice(-60),
            }
          : session
      )
      localStorage.setItem(chatStorageKey, JSON.stringify(nextSessions))
      return nextSessions
    })
  }, [activeSessionId, chatStorageKey, messages])

  const processFile = async (file: File) => {
    setUploadedFile({ name: file.name, size: `${(file.size / 1024).toFixed(1)} KB` })
    setIsParsing(true)
    setParsedData(null)
    setAppliedImporter(false)
    setImporterError(null)

    try {
      const text = await file.text()
      const data = await parseUploadedDocument(file.name, text)
      setParsedData(data)
      addToast(language === 'fr' ? 'Fichier analyse avec succes.' : 'File parsed successfully.')
    } catch (err: any) {
      setImporterError(err.message || 'Error parsing file')
      addToast(language === 'fr' ? 'Erreur de lecture du fichier.' : 'Error reading file.', 'error')
    } finally {
      setIsParsing(false)
    }
  }

  const handleApplyBatchData = async () => {
    if (!parsedData || !agencyId) return
    setIsDbWorking(true)
    try {
      let count = 0
      if (parsedData.agencyDetails && (await updateAgencyConfigAction(agencyId, parsedData.agencyDetails)).success) count++
      if (!isTravel && parsedData.cars) {
        for (const car of parsedData.cars) if ((await addInventoryCarAction(agencyId, car)).success) count++
      }
      if (isTravel && parsedData.trips) {
        for (const trip of parsedData.trips) if ((await addTravelPackageAction(agencyId, trip)).success) count++
      }
      if (parsedData.employees) {
        for (const employee of parsedData.employees) if ((await addTeamMemberAction(agencyId, employee)).success) count++
      }
      setAppliedImporter(true)
      addToast(language === 'fr' ? `${count} element(s) enregistres.` : `${count} item(s) saved.`)
    } catch {
      addToast(language === 'fr' ? 'Erreur pendant l enregistrement.' : 'Error saving data.', 'error')
    } finally {
      setIsDbWorking(false)
    }
  }

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputVal.trim() || isPending) return

    const userText = inputVal.trim()
    setInputVal('')
    setMessages(prev => [...prev, { id: Math.random().toString(), sender: 'user', text: userText }])

    const history = messages.map(m => ({ sender: m.sender, text: m.text }))
    startTransition(async () => {
      try {
        const reply = await askAssistant(userText, history)
        const filteredActions = (reply.actions || []).filter(action => {
          if (isTravel) return action.type !== 'ADD_CAR'
          return action.type !== 'ADD_TRIP'
        })
        setMessages(prev => [...prev, {
          id: Math.random().toString(),
          sender: 'ai',
          text: reply.response,
          actions: filteredActions.length > 0 ? filteredActions : undefined,
        }])
      } catch {
        setMessages(prev => [...prev, {
          id: Math.random().toString(),
          sender: 'ai',
          text: language === 'fr' ? 'Desole, je rencontre une erreur de connexion.' : 'Sorry, I hit a connection error.',
        }])
      }
    })
  }

  const handleApplyChatAction = async (msgId: string, actions: any[]) => {
    if (!agencyId) return
    setIsDbWorking(true)
    try {
      for (const action of actions) {
        if (isTravel && action.type === 'ADD_CAR') continue
        if (!isTravel && action.type === 'ADD_TRIP') continue

        if (action.type === 'UPDATE_AGENCY') await updateAgencyConfigAction(agencyId, action.payload)
        if (action.type === 'ADD_CAR') await addInventoryCarAction(agencyId, action.payload)
        if (action.type === 'ADD_TRIP') await addTravelPackageAction(agencyId, action.payload)
        if (action.type === 'ADD_TEAM_MEMBER') await addTeamMemberAction(agencyId, action.payload)
        if (action.type === 'ADD_CLIENT') await addClientAction(agencyId, action.payload)
      }
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isApplied: true } : m))
      addToast(language === 'fr' ? 'Action appliquee.' : 'Action applied.')
    } catch {
      addToast(language === 'fr' ? 'Erreur pendant l action.' : 'Error executing action.', 'error')
    } finally {
      setIsDbWorking(false)
    }
  }

  const runDemoUpload = () => {
    const text = isTravel
      ? 'Voyage Istanbul - 7 Jours - Tarif: 145000 DZD - Hotel 4 etoiles\nOmra Ramadan - 14 Jours - Tarif: 320000 DZD - Vol + hotel inclus'
      : 'Brand,Model,Year,Price,Fuel,Transmission\nVolkswagen,Golf 8 R-Line,2023,5200000,Diesel,Automatic\nSeat,Ibiza FR,2022,3600000,Petrol,Manual'
    const name = isTravel ? 'catalogue_voyages.txt' : 'inventaire_autos.csv'
    processFile(new File([text], name, { type: 'text/plain' }))
  }

  const shortcutPrompts = isTravel
    ? [
        'تقدر تهدر معايا بالدارجة؟',
        'علمني كيفاش نستعمل dashboard',
        'شحال بعنا اليوم؟',
        'زيد voyage Istanbul 7 jours',
      ]
    : [
        'تقدر تهدر معايا بالدارجة؟',
        'علمني كيفاش نستعمل dashboard',
        'واش كاين سيارات متوفرين؟',
        'زيد Golf 8 للستوك',
      ]

  return (
    <div className="h-[calc(100vh-96px)] overflow-hidden p-4 text-left lg:p-6">
      <div className="absolute top-6 right-6 z-50 flex w-full max-w-sm flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className={cn(
            'pointer-events-auto flex items-center gap-3 rounded-lg border px-4 py-3 text-xs font-bold shadow-lg',
            toast.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : toast.type === 'info' ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          )}>
            <CheckCircle2 className="h-4 w-4" />
            {toast.title}
          </div>
        ))}
      </div>

      <div className="mx-auto flex h-full min-h-0 max-w-7xl flex-col gap-4">
        <header className="premium-panel rounded-lg px-5 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className={cn('flex h-12 w-12 items-center justify-center rounded-lg text-white shadow-sm', accentBg)}>
                {isTravel ? <Plane className="h-6 w-6" /> : <Car className="h-6 w-6" />}
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-neutral-950">
                  {isTravel ? (language === 'fr' ? 'Assistant IA Voyage' : 'Travel AI Assistant') : (language === 'fr' ? 'Assistant IA Showroom' : 'Showroom AI Assistant')}
                </h1>
                <p className="mt-1 flex items-center gap-2 text-xs font-bold uppercase text-neutral-500">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {agencyName} | {isTravel ? 'Travel agency isolated context' : 'Car showroom isolated context'}
                </p>
              </div>
            </div>

            <div className="flex rounded-lg border border-black/[0.08] bg-neutral-100/70 p-1">
              <button onClick={() => setActiveTab('chat')} className={cn('flex items-center gap-2 rounded-md px-4 py-2 text-xs font-bold transition', activeTab === 'chat' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500 hover:text-neutral-950')}>
                <Bot className="h-4 w-4" />
                {language === 'fr' ? 'Chat & Actions' : 'Chat & Actions'}
              </button>
              <button onClick={() => setActiveTab('import')} className={cn('flex items-center gap-2 rounded-md px-4 py-2 text-xs font-bold transition', activeTab === 'import' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500 hover:text-neutral-950')}>
                <Upload className="h-4 w-4" />
                {language === 'fr' ? 'Import IA' : 'AI Import'}
              </button>
            </div>
          </div>
        </header>

        <main className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-[1fr_320px]">
          <section className="premium-panel flex min-h-0 flex-col overflow-hidden rounded-lg">
            {activeTab === 'chat' ? (
              <>
                <div className="premium-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white p-5">
                  <div className="space-y-4">
                    {messages.map(message => (
                      <div key={message.id} className={cn('flex gap-3', message.sender === 'user' ? 'justify-end' : 'justify-start')}>
                        {message.sender === 'ai' && <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700"><Bot className="h-4 w-4" /></div>}
                        <div className={cn('max-w-[780px] rounded-lg border px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap', message.sender === 'user' ? cn('border-transparent text-white shadow-sm', accentBg) : 'border-black/[0.08] bg-neutral-50 text-neutral-800')}>
                          {message.text}
                          {message.actions && message.actions.length > 0 && (
                            <div className="mt-3 rounded-lg border border-black/[0.08] bg-white p-3">
                              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-neutral-500">
                                <Sparkles className="h-3.5 w-3.5" />
                                {language === 'fr' ? 'Action proposee' : 'Proposed action'}
                              </div>
                              <div className="space-y-2">
                                {message.actions.map((action, idx) => (
                                  <div key={idx} className="rounded-md bg-neutral-50 px-3 py-2 text-xs font-semibold text-neutral-700">
                                    {action.type.replaceAll('_', ' ')} | {action.payload?.title || action.payload?.full_name || action.payload?.brand || action.payload?.name || 'Details'}
                                  </div>
                                ))}
                              </div>
                              <button disabled={isDbWorking || message.isApplied} onClick={() => handleApplyChatAction(message.id, message.actions!)} className={cn('mt-3 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-black uppercase text-white disabled:opacity-60', message.isApplied ? 'bg-emerald-600' : accentBg)}>
                                {isDbWorking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                {message.isApplied ? (language === 'fr' ? 'Applique' : 'Applied') : (language === 'fr' ? 'Appliquer' : 'Apply')}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {isPending && (
                      <div className="flex items-center gap-3 text-sm font-semibold text-neutral-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {language === 'fr' ? 'Le copilote analyse...' : 'Copilot is thinking...'}
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                </div>

                <form onSubmit={handleSendMessage} className="border-t border-black/[0.06] bg-neutral-50/80 p-4">
                  <div className="flex items-center gap-3">
                    <input value={inputVal} onChange={(e) => setInputVal(e.target.value)} disabled={isPending} placeholder={isTravel ? (language === 'fr' ? 'Demandez un voyage, une reservation, un client...' : 'Ask about trips, bookings, clients...') : (language === 'fr' ? 'Demandez un vehicule, lead, vente, location...' : 'Ask about vehicles, leads, sales, rental...')} className="h-11 flex-1 rounded-lg border border-black/[0.08] bg-white px-4 text-sm font-semibold text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-black/25" />
                    <button type="submit" disabled={!inputVal.trim() || isPending} className={cn('flex h-11 w-11 items-center justify-center rounded-lg text-white shadow-sm disabled:opacity-50', accentBg)}>
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {shortcutPrompts.map(prompt => (
                      <button key={prompt} type="button" onClick={() => setInputVal(prompt)} className="rounded-md border border-black/[0.08] bg-white px-3 py-1.5 text-xs font-bold text-neutral-600 transition hover:border-black/20 hover:text-neutral-950">
                        {prompt}
                      </button>
                    ))}
                  </div>
                </form>
              </>
            ) : (
              <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_360px]">
                <div className="p-5">
                  <div onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }} onDragLeave={() => setIsDragOver(false)} onDrop={(e) => { e.preventDefault(); setIsDragOver(false); if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]) }} onClick={() => fileInputRef.current?.click()} className={cn('flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition', isDragOver ? 'border-neutral-900 bg-neutral-50' : 'border-black/[0.12] bg-neutral-50 hover:bg-white')}>
                    <input ref={fileInputRef} type="file" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} accept=".csv,.txt,.json,.xls,.xlsx,.png,.jpg,.jpeg" className="hidden" />
                    {isParsing ? <Loader2 className={cn('mb-4 h-8 w-8 animate-spin', accent)} /> : <Upload className={cn('mb-4 h-8 w-8', accent)} />}
                    <h3 className="text-base font-extrabold text-neutral-950">{language === 'fr' ? 'Importer des donnees' : 'Import business data'}</h3>
                    <p className="mt-2 max-w-md text-sm font-medium text-neutral-500">
                      {isTravel ? (language === 'fr' ? 'Catalogues voyages, tarifs, clients, equipe.' : 'Travel catalogs, prices, clients, team.') : (language === 'fr' ? 'Inventaire autos, prix, clients, equipe.' : 'Vehicle inventory, prices, clients, team.')}
                    </p>
                    <button type="button" onClick={(e) => { e.stopPropagation(); runDemoUpload() }} className="mt-5 rounded-lg border border-black/[0.08] bg-white px-4 py-2 text-xs font-black uppercase text-neutral-700 transition hover:border-black/20 hover:text-neutral-950">
                      {language === 'fr' ? 'Tester avec exemple' : 'Test with sample'}
                    </button>
                  </div>
                  {importerError && <p className="mt-3 text-sm font-semibold text-red-600">{importerError}</p>}
                </div>

                <aside className="border-t border-black/[0.06] bg-neutral-50 p-5 lg:border-l lg:border-t-0">
                  <h3 className="flex items-center gap-2 text-sm font-extrabold text-neutral-950"><FileText className="h-4 w-4" /> {language === 'fr' ? 'Resultat analyse' : 'Parsed result'}</h3>
                  {!parsedData ? (
                    <p className="mt-4 text-sm font-medium text-neutral-500">{language === 'fr' ? 'Aucun fichier analyse.' : 'No file parsed yet.'}</p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      <div className="rounded-lg border border-black/[0.08] bg-white p-3 text-xs font-bold text-neutral-600">{uploadedFile?.name} | {uploadedFile?.size}</div>
                      {parsedData.agencyDetails && <ResultLine label={language === 'fr' ? 'Profil entreprise' : 'Company profile'} />}
                      {!isTravel && parsedData.cars && <ResultLine label={`${parsedData.cars.length} ${language === 'fr' ? 'vehicules detectes' : 'vehicles detected'}`} />}
                      {isTravel && parsedData.trips && <ResultLine label={`${parsedData.trips.length} ${language === 'fr' ? 'voyages detectes' : 'trips detected'}`} />}
                      {parsedData.employees && <ResultLine label={`${parsedData.employees.length} ${language === 'fr' ? 'membres equipe detectes' : 'team members detected'}`} />}
                      <button onClick={handleApplyBatchData} disabled={isDbWorking || appliedImporter} className={cn('mt-3 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-black uppercase text-white disabled:opacity-60', appliedImporter ? 'bg-emerald-600' : accentBg)}>
                        {isDbWorking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        {appliedImporter ? (language === 'fr' ? 'Applique' : 'Applied') : (language === 'fr' ? 'Appliquer' : 'Apply')}
                      </button>
                    </div>
                  )}
                </aside>
              </div>
            )}
          </section>

          <aside className="premium-panel flex min-h-0 flex-col overflow-hidden rounded-lg p-5">
            <div className="flex items-center gap-2 text-sm font-extrabold text-neutral-950">
              <ShieldCheck className={cn('h-4 w-4', accent)} />
              {language === 'fr' ? 'Capacites IA' : 'AI Capabilities'}
            </div>
            <div className="mt-4 shrink-0 space-y-3">
              {capabilityList(language, businessType).map((item) => (
                <div key={item} className="flex gap-3 rounded-lg border border-black/[0.08] bg-neutral-50 p-3 text-xs font-bold text-neutral-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-5 grid shrink-0 grid-cols-2 gap-3">
              <Metric icon={<Compass className="h-4 w-4" />} label={isTravel ? 'Packages' : 'Stock'} />
              <Metric icon={<Users className="h-4 w-4" />} label="Clients" />
              <Metric icon={<Wallet className="h-4 w-4" />} label={isTravel ? 'Bookings' : 'Sales'} />
              <Metric icon={<Bot className="h-4 w-4" />} label="Actions" />
            </div>

            <div className="mt-5 flex min-h-0 flex-1 flex-col border-t border-black/[0.08] pt-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-extrabold text-neutral-950">
                    {language === 'fr' ? 'Discussions' : 'Chats'}
                  </h3>
                  <p className="mt-0.5 text-[10px] font-bold uppercase text-neutral-400">
                    {language === 'fr' ? 'Historique complet' : 'Full chat history'}
                  </p>
                </div>
                <button onClick={startNewChat} className={cn('rounded-md px-2 py-1 text-[10px] font-black uppercase text-white', accentBg)}>
                  New
                </button>
              </div>
              <div className="premium-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1">
                {chatSessions.length === 0 ? (
                  <p className="text-xs font-semibold text-slate-500">
                    {language === 'fr' ? 'Aucune discussion encore.' : 'No chats yet.'}
                  </p>
                ) : chatSessions.map(session => {
                  const lastMessage = [...session.messages].reverse().find(item => item.sender === 'user' || item.sender === 'ai')
                  const turns = session.messages.filter(item => item.sender === 'user').length
                  return (
                  <button
                    key={session.id}
                    onClick={() => openChatSession(session)}
                    className={cn(
                      'block w-full rounded-lg border px-3 py-2 text-left transition',
                      activeSessionId === session.id
                        ? 'border-neutral-950 bg-white shadow-sm'
                        : 'border-black/[0.08] bg-neutral-50 hover:border-black/20 hover:bg-white'
                    )}
                  >
                    <div className="line-clamp-1 text-xs font-extrabold text-neutral-900">
                      {session.title}
                    </div>
                    <div className="mt-1 line-clamp-2 text-[11px] font-semibold text-neutral-500">
                      {lastMessage?.text || (language === 'fr' ? 'Nouvelle discussion' : 'New chat')}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px] font-black uppercase text-neutral-400">
                      <span>{turns} msg</span>
                      <span>{new Date(session.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </button>
                )})}
              </div>
              <button onClick={clearAllChats} className="mt-3 w-full rounded-md border border-black/[0.08] px-2 py-2 text-[10px] font-black uppercase text-neutral-500 transition hover:border-black/20 hover:text-neutral-950">
                {language === 'fr' ? 'Effacer toutes les discussions' : 'Clear all chats'}
              </button>
            </div>
          </aside>
        </main>
      </div>
    </div>
  )
}

function ResultLine({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-black/[0.08] bg-white p-3 text-xs font-bold text-neutral-700">
      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
      {label}
    </div>
  )
}

function Metric({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="rounded-lg border border-black/[0.08] bg-neutral-50 p-3">
      <div className="mb-2 text-neutral-500">{icon}</div>
      <div className="text-xs font-black uppercase text-neutral-700">{label}</div>
    </div>
  )
}
