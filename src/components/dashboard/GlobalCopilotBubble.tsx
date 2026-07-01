'use client'

import React, { useState, useRef, useEffect, useTransition } from 'react'
import { useLanguage } from '@/lib/contexts/LanguageContext'
import {
  Sparkles, Upload, FileText, Bot, Send, Check, X,
  Loader2, RefreshCw, UserPlus, Car, Compass, HelpCircle,
  CheckCircle2, Layers, Minimize2, MessageSquare
} from 'lucide-react'
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
import { getConversations } from '@/app/actions/conversations'

interface ChatMessage {
  id: string
  sender: 'user' | 'ai'
  text: string
  actions?: any[]
  isApplied?: boolean
}

export function GlobalCopilotBubble() {
  const { t, language } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'import' | 'chat'>('chat')
  
  // Importer States
  const [isDragOver, setIsDragOver] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>(null)
  const [parsedData, setParsedData] = useState<ParsedBatchData | null>(null)
  const [appliedImporter, setAppliedImporter] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Chat States
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputVal, setInputVal] = useState('')
  const [isPending, startTransition] = useTransition()
  const chatEndRef = useRef<HTMLDivElement>(null)

  // System Context States
  const [agencyName, setAgencyName] = useState('My Showroom')
  const [agencyId, setAgencyId] = useState('')
  const [businessType, setBusinessType] = useState<'travel' | 'car_showroom'>('car_showroom')
  const [isDbWorking, setIsDbWorking] = useState(false)
  const [toasts, setToasts] = useState<{ id: string; title: string; type: 'success' | 'error' }[]>([])

  const addToast = (title: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString()
    setToasts(prev => [...prev, { id, title, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }

  // Load context and initialize welcome message
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
                  setBusinessType(agency.business_type_slug === 'travel_agency' ? 'travel' : 'car_showroom')
                }
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

  // Initialize welcome message when context details load or language changes
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: language === 'fr' 
          ? `Bonjour ! Je suis votre **Copilote IA d'Agence**.

Toutes mes actions sont **strictement isolées** pour votre entreprise. Comment puis-je vous aider ?
- M'envoyer un fichier de données dans l'onglet **Migration**.
- Demander: *"Ajouter une Golf 8"* ou *"Ajouter Amine Belkadi à l'équipe"*`
          : `Hello! I am your **AI Agency Copilot**.

All actions are **strictly isolated** under your company boundaries. How can I help?
- Drop a migration file in the **Migration** tab.
- Request: *"Add a Golf 8"* or *"Add Amine Belkadi to team"*`
      }
    ])
  }, [language, agencyName])

  // Auto-scroll chat
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  // File Importer Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      processFile(files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      processFile(files[0])
    }
  }

  const processFile = async (file: File) => {
    setUploadedFile({ name: file.name, size: (file.size / 1024).toFixed(1) + ' KB' })
    setIsParsing(true)
    setParsedData(null)
    setAppliedImporter(false)

    try {
      const text = await file.text()
      const data = await parseUploadedDocument(file.name, text)
      setParsedData(data)
      addToast(language === 'fr' ? 'Fichier analysé par l\'IA !' : 'File analyzed by AI!', 'success')
    } catch (err: any) {
      addToast('Error reading file', 'error')
    } finally {
      setIsParsing(false)
    }
  }

  const handleApplyBatchData = async () => {
    if (!parsedData || !agencyId) return
    setIsDbWorking(true)
    try {
      if (parsedData.agencyDetails) {
        await updateAgencyConfigAction(agencyId, parsedData.agencyDetails)
      }
      if (parsedData.cars && parsedData.cars.length > 0) {
        for (const car of parsedData.cars) {
          await addInventoryCarAction(agencyId, car)
        }
      }
      if (parsedData.trips && parsedData.trips.length > 0) {
        for (const trip of parsedData.trips) {
          await addTravelPackageAction(agencyId, trip)
        }
      }
      if (parsedData.employees && parsedData.employees.length > 0) {
        for (const emp of parsedData.employees) {
          await addTeamMemberAction(agencyId, emp)
        }
      }
      setAppliedImporter(true)
      addToast(language === 'fr' ? 'Données appliquées !' : 'Data successfully applied!', 'success')
    } catch (err) {
      addToast('Error saving data', 'error')
    } finally {
      setIsDbWorking(false)
    }
  }

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

    const history = messages.map(m => ({ sender: m.sender, text: m.text }))

    startTransition(async () => {
      try {
        const reply = await askAssistant(userText, history)
        const aiMsg: ChatMessage = {
          id: Math.random().toString(),
          sender: 'ai',
          text: reply.response,
          actions: reply.actions
        }
        setMessages(prev => [...prev, aiMsg])
      } catch (err) {
        setMessages(prev => [
          ...prev,
          {
            id: Math.random().toString(),
            sender: 'ai',
            text: language === 'fr' ? 'Erreur de connexion. Réessayez.' : 'Connection error. Please try again.'
          }
        ])
      }
    })
  }

  // Inline apply trigger
  const handleApplyChatAction = async (msgId: string, actions: any[]) => {
    if (!agencyId) return
    setIsDbWorking(true)
    try {
      for (const action of actions) {
        if (action.type === 'UPDATE_AGENCY') {
          await updateAgencyConfigAction(agencyId, action.payload)
        } else if (action.type === 'ADD_CAR') {
          await addInventoryCarAction(agencyId, action.payload)
        } else if (action.type === 'ADD_TRIP') {
          await addTravelPackageAction(agencyId, action.payload)
        } else if (action.type === 'ADD_TEAM_MEMBER') {
          await addTeamMemberAction(agencyId, action.payload)
        } else if (action.type === 'ADD_CLIENT') {
          await addClientAction(agencyId, action.payload)
        }
      }
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isApplied: true } : m))
      addToast(language === 'fr' ? 'Action exécutée !' : 'Action successfully applied!', 'success')
    } catch (err) {
      addToast('Error saving data', 'error')
    } finally {
      setIsDbWorking(false)
    }
  }

  const runDemoUpload = (type: 'vehicles' | 'trips' | 'team') => {
    let name = 'inventaire_autos.csv'
    let text = 'Brand,Model,Year,Price\nVolkswagen,Golf 8 R-Line,2023,5200000\nSeat,Ibiza FR,2022,3600000'
    if (type === 'trips') {
      name = 'catalogues_voyages.txt'
      text = 'Voyage Antalya & Istanbul - 10 Jours - Tarif: 195000 DZD\nSéjour Djerba Détente - 7 Jours - Tarif: 88000 DZD'
    } else if (type === 'team') {
      name = 'employes_staff.json'
      text = 'Amine Belkadi: amine.belkadi@showrooms.dz'
    }
    const file = new File([text], name, { type: 'text/plain' })
    processFile(file)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end select-none">
      
      {/* Toast popup alerts */}
      <div className="flex flex-col gap-2 max-w-[280px] w-full mb-3 text-left">
        {toasts.map(t => (
          <div
            key={t.id}
            className={cn(
              "p-3 rounded-xl border backdrop-blur-md shadow-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-2",
              t.type === 'success' ? 'bg-emerald-50 border-emerald-250 text-emerald-850' : 'bg-red-50 border-red-250 text-red-850'
            )}
          >
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span>{t.title}</span>
          </div>
        ))}
      </div>

      {/* Floating Widget Chatbox Panel */}
      {isOpen && (
        <div className="w-[360px] lg:w-[400px] h-[520px] bg-white/70 backdrop-blur-xl border border-slate-200/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden mb-4 transition-all duration-300 animate-slide-in-up text-left">
          
          {/* Header */}
          <div className="px-4.5 py-4 border-b flex items-center justify-between shrink-0 bg-slate-50/20">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-md">
                <Sparkles className="h-4.5 w-4.5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold tracking-tight text-slate-800 font-heading">
                  AI Onboarding Copilot
                </h4>
                <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {agencyName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setActiveTab(activeTab === 'chat' ? 'import' : 'chat')}
                className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg border border-slate-200 bg-white/60 hover:bg-slate-50 hover:text-slate-800 text-slate-500 cursor-pointer shadow-xs transition duration-200"
              >
                {activeTab === 'chat' ? (language === 'fr' ? 'Migration' : 'Migration') : 'Chat'}
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* TAB 1: MIGRATION DATA PARSER */}
          {activeTab === 'import' && (
            <div className="flex-1 flex flex-col justify-between overflow-y-auto p-4 space-y-4">
              <div className="space-y-3.5">
                <h5 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1">
                  <Upload className="h-3.5 w-3.5" /> Data Setup Importer
                </h5>
                <p className="text-[11px] text-slate-500 leading-normal">
                  {language === 'fr' 
                    ? 'Glissez un document de données (inventaire ou staff) ici. Notre IA configure instantanément votre base de données avec isolation multi-locataires.'
                    : 'Drop records spreadsheets or team rosters. The AI automatically populates your workspace under tight company isolation.'}
                </p>

                {/* Drag Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border border-dashed rounded-2xl p-6 text-center flex flex-col items-center justify-center cursor-pointer transition-all duration-300 min-h-[140px]",
                    isDragOver ? "border-indigo-500 bg-indigo-50/10" : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50/40"
                  )}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".csv,.txt,.json,.xls,.xlsx"
                    className="hidden"
                  />
                  {isParsing ? (
                    <Loader2 className="h-5 w-5 text-indigo-500 animate-spin mb-2" />
                  ) : (
                    <Upload className="h-5 w-5 text-slate-400 mb-2" />
                  )}
                  <span className="text-[10px] font-bold text-slate-600">
                    {isParsing ? 'Extraction IA...' : 'Déposer le fichier de migration'}
                  </span>
                </div>

                {/* Fast presets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    onClick={() => runDemoUpload('vehicles')}
                    className="px-2 py-1 bg-white border rounded text-[9px] font-black text-slate-550 hover:bg-slate-50 uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                  >
                    🚗 Stock Autos
                  </button>
                  <button
                    onClick={() => runDemoUpload('trips')}
                    className="px-2 py-1 bg-white border rounded text-[9px] font-black text-slate-550 hover:bg-slate-50 uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                  >
                    🌴 Packs Voyages
                  </button>
                  <button
                    onClick={() => runDemoUpload('team')}
                    className="px-2 py-1 bg-white border rounded text-[9px] font-black text-slate-550 hover:bg-slate-50 uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                  >
                    👥 Team JSON
                  </button>
                </div>

                {/* Extracted Details checklist */}
                {parsedData && (
                  <div className="bg-white/80 border p-3 rounded-xl space-y-2 text-[11px] shadow-xs">
                    <h6 className="font-extrabold text-slate-700 uppercase tracking-wider">
                      {language === 'fr' ? 'Éléments Trouvés par l\'IA :' : 'Discovered Items:'}
                    </h6>
                    {parsedData.agencyDetails && <p className="text-slate-500">🏢 Agence: {parsedData.agencyDetails.name}</p>}
                    {parsedData.cars && <p className="text-slate-500">🚗 {parsedData.cars.length} Véhicules trouvés</p>}
                    {parsedData.trips && <p className="text-slate-500">🌴 {parsedData.trips.length} Circuits trouvés</p>}
                    {parsedData.employees && <p className="text-slate-500">👤 {parsedData.employees.length} Profils détectés</p>}
                  </div>
                )}
              </div>

              {parsedData && (
                <div className="flex items-center justify-between pt-2 border-t mt-2">
                  <button
                    onClick={() => { setParsedData(null); setUploadedFile(null); setAppliedImporter(false) }}
                    className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    Effacer
                  </button>
                  {appliedImporter ? (
                    <span className="text-[10px] font-black uppercase text-emerald-500">Appliqué ✓</span>
                  ) : (
                    <button
                      onClick={handleApplyBatchData}
                      disabled={isDbWorking}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer disabled:opacity-60"
                    >
                      {isDbWorking && <Loader2 className="h-3 w-3 animate-spin" />}
                      Appliquer
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CHAT COMMAND CENTER */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* Message log */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/10">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-2.5 max-w-[88%] animate-fadeIn",
                      msg.sender === 'user' ? 'ml-auto flex-row-reverse text-right' : 'mr-auto text-left'
                    )}
                  >
                    <div className={cn(
                      "h-7 w-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 shadow-xs border",
                      msg.sender === 'user' ? 'bg-indigo-600 border-indigo-700 text-white' : 'bg-white border-slate-200/50 text-indigo-600'
                    )}>
                      {msg.sender === 'user' ? 'AA' : <Bot className="h-3.5 w-3.5" />}
                    </div>

                    <div className="space-y-2">
                      <div className={cn(
                        "p-3 rounded-2xl text-[11px] leading-relaxed border shadow-xs whitespace-pre-wrap",
                        msg.sender === 'user' ? 'bg-indigo-600 border-indigo-700 text-white rounded-tr-none' : 'bg-white border-slate-200/60 text-slate-700 rounded-tl-none'
                      )}>
                        {msg.text}
                      </div>

                      {/* DB trigger suggestion card widget */}
                      {msg.actions && msg.actions.length > 0 && (
                        <div className="bg-white border rounded-2xl p-2.5 shadow-sm space-y-2 max-w-[280px]">
                          <span className="text-[8px] font-black uppercase tracking-wider text-indigo-500 block">
                            ⚡ AI Database Trigger
                          </span>
                          <div className="text-[10px] space-y-1">
                            {msg.actions.map((act, actIdx) => (
                              <div key={actIdx} className="bg-slate-50 p-2 rounded-lg border font-semibold text-slate-650">
                                {act.type === 'UPDATE_AGENCY' && <span>🏢 Configuration: {act.payload.name}</span>}
                                {act.type === 'ADD_CAR' && <span>🚗 Car: {act.payload.brand} {act.payload.model}</span>}
                                {act.type === 'ADD_TRIP' && <span>🌴 Trip: {act.payload.title}</span>}
                                {act.type === 'ADD_TEAM_MEMBER' && <span>👤 Team: {act.payload.full_name}</span>}
                                {act.type === 'ADD_CLIENT' && <span>👤 Client: {act.payload.full_name}</span>}
                              </div>
                            ))}
                          </div>

                          {msg.isApplied ? (
                            <span className="block text-center text-[9px] font-black uppercase tracking-wider text-emerald-500 bg-emerald-50 py-1 rounded-lg">
                              Appliqué ✓
                            </span>
                          ) : (
                            <button
                              onClick={() => handleApplyChatAction(msg.id, msg.actions!)}
                              disabled={isDbWorking}
                              className="w-full py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer disabled:opacity-60"
                            >
                              {isDbWorking && <Loader2 className="h-3 w-3 animate-spin" />}
                              Appliquer setup
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {isPending && (
                  <div className="flex gap-2.5 max-w-[80%] animate-fadeIn">
                    <div className="h-7 w-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shadow-xs shrink-0">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    </div>
                    <div className="bg-white border p-3 rounded-2xl rounded-tl-none shadow-xs text-[11px] italic text-slate-400 flex items-center">
                      Réflexion...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <form 
                onSubmit={handleSendMessage}
                className="p-3 border-t flex items-center gap-2 shrink-0 bg-white"
              >
                <input
                  type="text"
                  placeholder={
                    businessType === 'car_showroom'
                      ? (language === 'fr' ? 'Ex: Ajouter Golf 8, chhal dkhalna...' : 'Ex: Add Golf 8, show revenue...')
                      : (language === 'fr' ? 'Ex: Ajouter voyage Istanbul, clients...' : 'Ex: Add Istanbul trip, show clients...')
                  }
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-semibold text-slate-700 outline-none focus:border-indigo-400 focus:bg-white w-full transition"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  disabled={isPending}
                />
                <button
                  type="submit"
                  disabled={!inputVal.trim() || isPending}
                  className="h-8.5 w-8.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center shadow-md shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>

              {/* Shortcuts — vertical-aware */}
              <div className="px-3 pb-3 flex flex-wrap gap-1 bg-white text-[9px] font-black uppercase text-slate-400 select-none shrink-0">
                {businessType === 'car_showroom' ? (
                  <>
                    <button
                      onClick={() => setInputVal(language === 'fr' ? 'Ajouter une Golf 8 au showroom à 5.2 millions' : 'Add a Golf 8 to showroom at 5.2 million')}
                      className="bg-slate-50 hover:bg-slate-100 border rounded px-1.5 py-0.5 cursor-pointer text-slate-500"
                    >
                      🚗 Ajouter voiture
                    </button>
                    <button
                      onClick={() => setInputVal(language === 'fr' ? 'Quelles voitures sont disponibles à la location ?' : 'What cars are available for rent?')}
                      className="bg-slate-50 hover:bg-slate-100 border rounded px-1.5 py-0.5 cursor-pointer text-slate-500"
                    >
                      🔑 Flotte kra
                    </button>
                    <button
                      onClick={() => setInputVal(language === 'fr' ? 'Combien avons-nous gagné aujourd\'hui ?' : 'How much revenue today?')}
                      className="bg-slate-50 hover:bg-slate-100 border rounded px-1.5 py-0.5 cursor-pointer text-slate-500"
                    >
                      💰 Revenus
                    </button>
                    <button
                      onClick={() => setInputVal(language === 'fr' ? 'Ajouter Amine Belkadi en collaborateur' : 'Add Amine to team')}
                      className="bg-slate-50 hover:bg-slate-100 border rounded px-1.5 py-0.5 cursor-pointer text-slate-500"
                    >
                      👤 Équipe
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setInputVal('Zidli voyage Istanbul b 145000')}
                      className="bg-slate-50 hover:bg-slate-100 border rounded px-1.5 py-0.5 cursor-pointer text-slate-500"
                    >
                      🌍 Ajouter voyage
                    </button>
                    <button
                      onClick={() => setInputVal(language === 'fr' ? 'Quels forfaits sont actifs ?' : 'What packages are active?')}
                      className="bg-slate-50 hover:bg-slate-100 border rounded px-1.5 py-0.5 cursor-pointer text-slate-500"
                    >
                      📋 Voir forfaits
                    </button>
                    <button
                      onClick={() => setInputVal(language === 'fr' ? 'Quel est notre chiffre d\'affaires ?' : 'What is our revenue?')}
                      className="bg-slate-50 hover:bg-slate-100 border rounded px-1.5 py-0.5 cursor-pointer text-slate-500"
                    >
                      💰 Revenus
                    </button>
                    <button
                      onClick={() => setInputVal('Zid Amine Belkadi bel équipe')}
                      className="bg-slate-50 hover:bg-slate-100 border rounded px-1.5 py-0.5 cursor-pointer text-slate-500"
                    >
                      👤 Recruter
                    </button>
                  </>
                )}
              </div>

            </div>
          )}

        </div>
      )}

      {/* Floating Action Button (FAB) Bubble */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-14 w-14 rounded-full flex items-center justify-center text-white shadow-2xl active:scale-95 transition-all duration-300 cursor-pointer border relative select-none hover:scale-105",
          isOpen
            ? "bg-slate-800 border-slate-700 rotate-90"
            : "bg-gradient-to-tr from-indigo-600 via-indigo-500 to-indigo-400 border-indigo-400 shadow-indigo-500/20"
        )}
        title="AI Copilot Assistant"
      >
        <span className="absolute inset-0 rounded-full border border-indigo-400/50 animate-ping opacity-60 pointer-events-none" />
        {isOpen ? (
          <Minimize2 className="h-5.5 w-5.5" />
        ) : (
          <Sparkles className="h-6 w-6" />
        )}
      </button>

    </div>
  )
}
