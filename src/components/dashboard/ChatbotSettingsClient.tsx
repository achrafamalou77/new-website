'use client'

import { useEffect, useState, useRef } from 'react'
import { updateChatbotConfig } from '@/app/actions/agency'
import { getContainerTrackingInfo } from '@/app/actions/containers'
import { useSettingsStore } from '@/lib/stores/settings-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Loader2, Check, Bot, MessageCircle, User, Play, Volume2, Search, Bold, Link2, 
  Smile, HelpCircle, GripVertical, Trash2, Send, Flame, Sparkles, MapPin, DollarSign,
  Webhook, Share2, Copy, CheckCheck, Phone, ExternalLink, AlertCircle, Info, Camera, Users
} from 'lucide-react'
import { getDefaultChatbotConfig } from '@/lib/settings-defaults'
import { ChatbotConfig } from '@/types/settings'
import { Badge } from '@/components/ui/badge'

interface FAQItem {
  id: string
  question: string
  answer: string
  category: 'General' | 'Paiements' | 'Documents' | 'Prestations'
  categoryColor: string
}

export function ChatbotSettingsClient({ activeTrips, agencyId, activeCars = [] }: { activeTrips: any[], agencyId: string, activeCars?: any[] }) {
  const { agencyInfo, chatbotConfig, setChatbotConfig, businessTypeSlug } = useSettingsStore()

  const defaultChatbot = getDefaultChatbotConfig(agencyInfo?.company_name || '')
  const [formData, setFormData] = useState<ChatbotConfig>(() => {
    const config = chatbotConfig || defaultChatbot
    return {
      personality: { ...defaultChatbot.personality, ...config?.personality },
      behavior: { ...defaultChatbot.behavior, ...config?.behavior },
      knowledge: { ...defaultChatbot.knowledge, ...config?.knowledge },
      appearance: { ...defaultChatbot.appearance, ...config?.appearance },
      advanced: { ...defaultChatbot.advanced, ...config?.advanced }
    }
  })

  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Meta Integration state
  const [metaConfig, setMetaConfig] = useState({
    enabled: false,
    whatsapp_enabled: true,
    instagram_enabled: true,
    facebook_enabled: false,
    webhook_url: '',
    verify_token: ''
  })
  const [webhookCopied, setWebhookCopied] = useState(false)
  const [tokenCopied, setTokenCopied] = useState(false)

  // Load meta config from chatbot_config on mount
  useEffect(() => {
    const meta = (chatbotConfig as any)?.meta_integration
    if (meta) {
      setMetaConfig(prev => ({ ...prev, ...meta }))
    } else {
      // Generate a default verify token from agencyId
      setMetaConfig(prev => ({
        ...prev,
        verify_token: `verify_${agencyId.replace(/-/g, '').slice(0, 16)}`
      }))
    }
  }, [chatbotConfig, agencyId])

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(metaConfig.webhook_url)
    setWebhookCopied(true)
    setTimeout(() => setWebhookCopied(false), 2000)
  }

  const handleCopyToken = () => {
    navigator.clipboard.writeText(metaConfig.verify_token)
    setTokenCopied(true)
    setTimeout(() => setTokenCopied(false), 2000)
  }

  const saveMetaConfig = async () => {
    // Merge meta_integration into chatbot_config and save
    const merged = { ...formData, meta_integration: metaConfig } as any
    setLoading(true)
    const result = await updateChatbotConfig(merged)
    if (result.success) {
      setSaved(true)
      setChatbotConfig(merged)
      setTimeout(() => setSaved(false), 2000)
    } else {
      setError(result.error || 'Failed to save Meta config')
    }
    setLoading(false)
  }

  // 1. Live Chat Simulator States
  const [messages, setMessages] = useState<Array<{ sender: 'bot' | 'user', text: string, isTripSuggestion?: boolean }>>([])
  const [simulatorInput, setSimulatorInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const chatBottomRef = useRef<HTMLDivElement>(null)

  // 2. Personality Audio States
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)

  // 3. Searchable Trip State
  const [tripSearch, setTripSearch] = useState('')

  const isShowroom = businessTypeSlug === 'car_showroom'

  // 4. FAQ Builder States
  const [faqs, setFaqs] = useState<FAQItem[]>([])
  
  useEffect(() => {
    if (isShowroom) {
      setFaqs([
        { 
          id: 'faq-1', 
          question: "Quels documents pour acheter un véhicule ?", 
          answer: "Pour constituer votre dossier d'achat, veuillez fournir : une copie de votre pièce d'identité nationale (CNI ou passeport), un justificatif de domicile (fiche de résidence), et vos 3 derniers bulletins de salaire ou registre de commerce.", 
          category: "Documents", 
          categoryColor: "bg-blue-50 text-blue-700 border-blue-150" 
        },
        { 
          id: 'faq-2', 
          question: "Quels sont vos partenaires de crédit et d'apport ?", 
          answer: "Nous collaborons avec plusieurs banques algériennes de premier plan comme la **CPA**, la **BADR** et l'**AGB**. Le taux de financement moyen est à partir de **7.5%**, avec un apport personnel initial requis à partir de **30%** de la valeur du véhicule.", 
          category: "Paiements", 
          categoryColor: "bg-amber-50 text-amber-700 border-amber-150" 
        },
        { 
          id: 'faq-3', 
          question: "Proposez-vous la reprise d'anciens véhicules (Reprise/Dépôt-Vente) ?", 
          answer: "Absolument ! Nous proposons des services complets de **reprise d'occasion** (échange) ou de **dépôt-vente** au sein de notre showroom. Nos techniciens effectueront une évaluation technique complète de votre véhicule pour vous proposer une estimation juste et rapide.", 
          category: "Prestations", 
          categoryColor: "bg-emerald-50 text-emerald-700 border-emerald-150" 
        },
        { 
          id: 'faq-4', 
          question: "Comment réserver un essai routier (Test Drive) ?", 
          answer: "Pour réserver un essai sur l'un de nos modèles en stock (ex: Seat Ibiza, Dacia Sandero), il vous suffit de nous communiquer votre choix de véhicule, la date souhaitée (essais disponibles en semaine et le samedi), ainsi qu'une copie de votre permis de conduire en cours de validité.", 
          category: "General", 
          categoryColor: "bg-purple-50 text-purple-700 border-purple-150" 
        }
      ])
    } else {
      setFaqs([
        { 
          id: 'faq-1', 
          question: "Quels documents pour voyager en Turquie ?", 
          answer: "Pour la Turquie, prévoyez un passeport valide au moins 6 mois, 2 photos fond blanc, et un relevé CCP/Bancaire de l'agence.", 
          category: "Documents", 
          categoryColor: "bg-blue-50 text-blue-700 border-blue-150" 
        },
        { 
          id: 'faq-2', 
          question: "Comment s'effectue le paiement (CCP) ?", 
          answer: "Vous pouvez régler par espèces en agence, ou par CCP national (Titulaire: **Amalou Achraf**, Numéro: **0021876532**, Clé: **89**).", 
          category: "Paiements", 
          categoryColor: "bg-amber-50 text-amber-700 border-amber-150" 
        },
        { 
          id: 'faq-3', 
          question: "L'assurance voyage est-elle incluse ?", 
          answer: "Oui, notre assurance voyage complète à l'étranger est incluse par défaut dans tous nos forfaits d'évasion.", 
          category: "Prestations", 
          categoryColor: "bg-emerald-50 text-emerald-700 border-emerald-150" 
        }
      ])
    }
  }, [isShowroom])
  
  const [newQuestion, setNewQuestion] = useState('')
  const [newAnswer, setNewAnswer] = useState('')
  const [newCategory, setNewCategory] = useState<'General' | 'Paiements' | 'Documents' | 'Prestations'>('General')

  // Debounced auto-save (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      saveSettings(formData)
    }, 500)
    return () => clearTimeout(timer)
  }, [formData])

  // Scroll to bottom helper
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Initialize bot greeting
  useEffect(() => {
    const defaultText = businessTypeSlug === 'car_showroom' 
      ? "Bonjour ! Bienvenue chez notre showroom. Comment puis-je vous aider dans votre projet d'achat de véhicule aujourd'hui ?"
      : "Hi! How can I help you plan your next trip?";
    setMessages([
      { sender: 'bot', text: formData.personality.bot_greeting || defaultText }
    ])
  }, [formData.personality.bot_greeting, businessTypeSlug])

  const saveSettings = async (config: ChatbotConfig) => {
    setLoading(true)
    setError('')
    
    const result = await updateChatbotConfig(config)
    
    if (result.success) {
      setSaved(true)
      setChatbotConfig(config)
      setTimeout(() => setSaved(false), 2000)
    } else {
      setError(result.error || 'Failed to save chatbot settings')
    }
    setLoading(false)
  }

  const updatePersonality = (key: keyof typeof formData.personality, value: any) => {
    setFormData(prev => ({
      ...prev,
      personality: { ...prev.personality, [key]: value }
    }))
  }

  const updateBehavior = (key: keyof typeof formData.behavior, value: any) => {
    setFormData(prev => ({
      ...prev,
      behavior: { ...prev.behavior, [key]: value }
    }))
  }

  const updateKnowledge = (key: keyof typeof formData.knowledge, value: any) => {
    setFormData(prev => ({
      ...prev,
      knowledge: { ...prev.knowledge, [key]: value }
    }))
  }

  const updateAppearance = (key: keyof typeof formData.appearance, value: any) => {
    setFormData(prev => ({
      ...prev,
      appearance: { ...prev.appearance, [key]: value }
    }))
  }

  const updateAdvanced = (key: keyof typeof formData.advanced, value: any) => {
    setFormData(prev => ({
      ...prev,
      advanced: { ...prev.advanced, [key]: value }
    }))
  }

  const handleTripToggle = (tripId: string, checked: boolean) => {
    setFormData(prev => {
      let allowed = [...prev.knowledge.allowed_trips]
      if (checked && !allowed.includes(tripId)) allowed.push(tripId)
      else if (!checked) allowed = allowed.filter(id => id !== tripId)
      return {
        ...prev,
        knowledge: { ...prev.knowledge, allowed_trips: allowed }
      }
    })
  }

  // Speak aloud Greeting using Web Speech API
  const handlePlaySample = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const text = formData.personality.bot_greeting || "Hi! How can I help you plan your next trip?"
      const utterance = new SpeechSynthesisUtterance(text)
      
      const style = formData.personality.language_style
      if (style === 'French') utterance.lang = 'fr-FR'
      else if (style === 'Algerian Darja' || style === 'Modern Standard Arabic') utterance.lang = 'ar-DZ'
      else utterance.lang = 'en-US'

      utterance.onstart = () => setIsPlayingAudio(true)
      utterance.onend = () => setIsPlayingAudio(false)
      utterance.onerror = () => setIsPlayingAudio(false)
      window.speechSynthesis.speak(utterance)
    } else {
      setIsPlayingAudio(true)
      setTimeout(() => setIsPlayingAudio(false), 3000)
    }
  }

  // Simulated AI Engine
  const triggerAIResponse = async (userQuery: string) => {
    setIsTyping(true)
    const isCar = businessTypeSlug === 'car_showroom'
    const query = userQuery.toLowerCase()
    
    // We can do standard timeout for simulation feeling, but await the database response!
    const trackingKeywords = [
      'suivi', 'container', 'conteneur', 'bateau', 'vessel', 'tracking', 'car', 'voiture', 
      'msc', 'cma', 'evergreen', 'maersk', 'shipping', 'dossier', 'arrivée', 'port', 'alger', 'dédouanement'
    ]
    
    const isTrackingQuery = trackingKeywords.some(keyword => query.includes(keyword)) || 
                            /[A-Z]{4}\d{7}/i.test(query) || // Match container numbers like MSCU1234567
                            /0[567]\d{8}/.test(query); // Match Algerian phone numbers

    let replyText = ""
    
    if (isCar && isTrackingQuery) {
      try {
        const result = await getContainerTrackingInfo(userQuery, agencyId)
        
        if (result.success) {
          const getStatusProgressText = (status: string) => {
            switch(status) {
              case 'At Origin Port': return "Le conteneur est au port d'origine, en attente de chargement sur le navire. ⚓"
              case 'On Vessel': return "En mer à bord du navire. Le voyage se déroule normalement. 🚢"
              case 'Arrived Port of Algiers': return "Le navire est arrivé au Port d'Alger. Le déchargement est en cours. 🇩🇿"
              case 'In Customs': return "Le dossier est actuellement en cours de dédouanement à Alger (Formalités douanières et transitaire). 📋"
              case 'Dispatched': return "Dédouanement terminé ! Le véhicule a quitté le port et est en cours d'acheminement. 🚚"
              case 'Delivered': return "Livré ! Le véhicule est disponible au showroom pour la remise des clés. 🔑"
              default: return "Traitement en cours."
            }
          }
          
          if (result.type === 'container') {
            const container = (result.data as any)[0]
            replyText = `🚢 **Suivi Logistique & Expédition**\n\nNous avons trouvé le conteneur **${container.container_number}** (Ligne: **${container.shipping_line}**) :\n\n` +
                        `• **Statut actuel :** \`${container.status}\`\n` +
                        `• **Navire :** ${container.vessel_name || 'Non spécifié'} (Voyage: ${container.voyage_number || 'N/A'})\n` +
                        `• **Itinéraire :** ${container.departure_port} ➔ ${container.arrival_port}\n` +
                        `• **Départ :** ${container.departure_date ? new Date(container.departure_date).toLocaleDateString('fr-FR') : 'N/A'}\n` +
                        `• **Arrivée Estimée :** ${container.estimated_arrival_date ? new Date(container.estimated_arrival_date).toLocaleDateString('fr-FR') : 'N/A'}\n\n` +
                        `⚡ *Étape actuelle :* ${getStatusProgressText(container.status)}`
          } else if (result.type === 'client_phone' || result.type === 'tracking_number') {
            const orders = result.data as any[]
            replyText = `🚗 **Dossier(s) d'Importation Trouvé(s)**\n\nNous avons trouvé ${orders.length} dossier(s) d'importation correspondant(s) :\n\n` +
                        orders.map((order, idx) => {
                          const containerText = order.container 
                            ? `Conteneur **${order.container.container_number}** (${order.container.shipping_line} - Navire: ${order.container.vessel_name || 'N/A'})` 
                            : 'En attente de chargement sur conteneur';
                          return `${idx + 1}. **${order.vehicle_brand} ${order.vehicle_model} (${order.vehicle_year})**\n` +
                                 `   • **Client :** ${order.client?.full_name || 'N/A'}\n` +
                                 `   • **Statut actuel :** \`${order.tracking_status || 'At Origin Port'}\`\n` +
                                 `   • **Expédition :** ${containerText}\n` +
                                 `   • *Progression :* ${getStatusProgressText(order.tracking_status || 'At Origin Port')}`;
                        }).join('\n\n')
          }
        } else {
          replyText = `🔍 **Suivi Logistique**\n\nJe n'ai trouvé aucun conteneur ou dossier d'importation actif pour votre recherche ("${userQuery}").\n\n` +
                      `Pour effectuer un suivi précis, veuillez renseigner :\n` +
                      `1. Votre **numéro de conteneur** (ex: MSCU8829402)\n` +
                      `2. Ou votre **numéro de téléphone** enregistré (ex: 0770123456)\n` +
                      `3. Ou votre **numéro de suivi unique** (ex: MSCTRK99201)`
        }
      } catch (err: any) {
        console.error('Error fetching container tracking info:', err)
        replyText = "Désolé, je rencontre une petite difficulté technique pour interroger notre base de données de suivi en temps réel. Veuillez réessayer dans quelques instants."
      }
    } else {
      // 1. Check matching FAQs
      const matchedFaq = faqs.find(f => query.includes(f.question.toLowerCase()) || f.question.toLowerCase().split(' ').some(word => word.length > 4 && query.includes(word)))
      if (matchedFaq) {
        replyText = matchedFaq.answer
      }
      // 2. Check automotive showroom requests
      else if (isCar && (query.includes('car') || query.includes('voiture') || query.includes('modèle') || query.includes('stock') || query.includes('dispo') || query.includes('seat') || query.includes('ibiza') || query.includes('picanto') || query.includes('tucson') || query.includes('dacia') || query.includes('sandero') || query.includes('tarif') || query.includes('prix') || query.includes('offre'))) {
        const allowedCarsList = activeCars.filter(c => formData.knowledge.allowed_trips.includes(c.id))
        if (allowedCarsList.length > 0) {
          replyText = `Absolument ! Notre catalogue comprend plusieurs véhicules disponibles : \n\n` +
            allowedCarsList.map(c => `• **${c.title}** : à partir de **${c.price?.toLocaleString()} DZD** (${c.destination === 'Location' ? 'Location par jour' : 'Vente directe'})`).join('\n') +
            `\n\nSouhaitez-vous planifier un essai (Test Drive) ou simuler un financement ?`
        } else {
          replyText = "Absolument ! Notre catalogue comprend la **Seat Ibiza 2026** à partir de **3 200 000 DZD** (mensualités à partir de 38 000 DZD) et la **Dacia Sandero Stepway** à **2 900 000 DZD**. Souhaitez-vous planifier un test drive ?"
        }
      }
      else if (isCar && (query.includes('taux') || query.includes('finance') || query.includes('credit') || query.includes('banque') || query.includes('mensuel') || query.includes('apport'))) {
        replyText = "Nous proposons des plans de financement flexibles avec nos banques partenaires algériennes (**CPA, BADR, AGB**). Sur la base d'un taux d'intérêt moyen de **7.5%**, vous pouvez acquérir un véhicule avec un apport minimal de **30%** et le reste étalé de 12 à 60 mois. Voulez-vous qu'un conseiller financier simule un crédit ?"
      }
      else if (isCar && (query.includes('test') || query.includes('drive') || query.includes('conduire') || query.includes('reserver') || query.includes('rdv') || query.includes('essai'))) {
        replyText = "Avec plaisir ! Je peux pré-réserver un essai sur la Seat Ibiza ou la Kia Picanto ce samedi dans notre showroom. Pourriez-vous me transmettre votre numéro de téléphone et une copie de votre permis de conduire ?"
      }
      // 3. Check trips requests
      else if (isCar && (query.includes('sell my car') || query.includes('vendre ma voiture') || query.includes('depot') || query.includes('dépôt') || query.includes('consignment') || query.includes('reprise'))) {
        replyText = "C'est un excellent choix ! Nous proposons un service de **reprise d'occasion** ainsi que de **dépôt-vente** au sein de notre showroom. Pour commencer, pourriez-vous me préciser la Marque, le Modèle, l'Année, le Kilométrage, ainsi que le prix souhaité ? Un technicien planifiera une inspection physique."
      }
      else if (query.includes('trip') || query.includes('voyage') || query.includes('tarif') || query.includes('prix') || query.includes('offre')) {
        const allowedTripsList = activeTrips.filter(t => formData.knowledge.allowed_trips.includes(t.id))
        if (allowedTripsList.length > 0) {
          replyText = `Nous vous proposons de magnifiques escapades ! Par exemple : **${allowedTripsList[0].title}** pour seulement **${allowedTripsList[0].price?.toLocaleString()} DZD**. Souhaitez-vous bloquer une place ?`
        } else {
          replyText = "Toutes nos destinations sont actuellement en cours de mise à jour. Laissez-moi vos coordonnées pour recevoir notre catalogue !"
        }
      }
      // 4. B2B / Fleet / Wholesale detection
      else if (query.includes('fleet') || query.includes('flotte') || query.includes('b2b') || query.includes('entreprise') || query.includes('grossiste') || query.includes('volume') || query.includes('wholesale') || query.includes('bulk')) {
        replyText = isCar 
          ? "Bienvenue ! Nous disposons d'une offre dédiée aux professionnels et entreprises (B2B). Pour un achat de flotte ou des volumes importants, nos tarifs préférentiels s'appliquent automatiquement. Puis-je avoir le nom de votre société et le nombre de véhicules souhaités ?"
          : "Nous avons des offres corporate pour les entreprises et groupes. Contactez notre responsable commercial B2B pour un devis personnalisé."
      }
      // 5. Defaults based on bot tone
      else {
        if (formData.personality.response_tone.includes('Casual')) {
          replyText = isCar 
            ? "C'est noté ! 😊 N'hésite pas si tu as d'autres questions sur nos voitures ou financements."
            : "C'est noté ! 😊 N'hésite pas si tu as d'autres questions sur nos circuits ou hébergements."
        } else if (formData.personality.response_tone.includes('Salesy')) {
          replyText = isCar 
            ? "Excellente idée ! 🚀 Nos voitures partent extrêmement vite cette saison. Voulez-vous bloquer ce modèle dès aujourd'hui ?"
            : "Excellente idée ! 🚀 Nos places partent extrêmement vite cette saison. Voulez-vous que je valide votre devis tout de suite ?"
        } else {
          replyText = isCar 
            ? "Je prends note de votre demande. Un conseiller commercial de notre showroom va prendre le relais pour affiner votre devis de véhicule."
            : "Je prends note de votre demande. Un agent commercial de notre équipe va prendre le relais pour affiner votre devis."
        }
      }
    }

    setTimeout(() => {
      setIsTyping(false)
      setMessages(prev => [...prev, { sender: 'bot', text: replyText }])
    }, 1000)
  }

  const handleSendSimulatorMsg = (textToSend?: string) => {
    const text = textToSend || simulatorInput
    if (!text.trim()) return

    setMessages(prev => [...prev, { sender: 'user', text }])
    setSimulatorInput('')
    triggerAIResponse(text)
  }

  // FAQ Editor utilities
  const handleAddFaq = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newQuestion || !newAnswer) return

    const categoryColors = {
      General: "bg-purple-50 text-purple-700 border-purple-150",
      Paiements: "bg-amber-50 text-amber-700 border-amber-150",
      Documents: "bg-blue-50 text-blue-700 border-blue-150",
      Prestations: "bg-emerald-50 text-emerald-700 border-emerald-150"
    }

    const newFaq: FAQItem = {
      id: `faq-${Date.now()}`,
      question: newQuestion,
      answer: newAnswer,
      category: newCategory,
      categoryColor: categoryColors[newCategory]
    }

    setFaqs([...faqs, newFaq])
    setNewQuestion('')
    setNewAnswer('')
  }

  const handleDeleteFaq = (id: string) => {
    setFaqs(faqs.filter(f => f.id !== id))
  }

  // Markdown helper toolbar
  const insertMarkdown = (tag: string) => {
    if (tag === 'bold') setNewAnswer(prev => prev + ' **Texte Gras**')
    else if (tag === 'link') setNewAnswer(prev => prev + ' [Titre du Lien](https://...)')
    else if (tag === 'emoji1') setNewAnswer(prev => prev + ' ✈️')
    else if (tag === 'emoji2') setNewAnswer(prev => prev + ' 🏝️')
    else if (tag === 'emoji3') setNewAnswer(prev => prev + ' 🕋')
  }

  // FAQs Drag and drop
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString())
  }

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'))
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) return

    const updated = [...faqs]
    const [moved] = updated.splice(sourceIndex, 1)
    updated.splice(targetIndex, 0, moved)
    setFaqs(updated)
  }

  // Search filter for allowed trip selectors
  const filteredActiveTrips = activeTrips.filter(t => 
    t.title.toLowerCase().includes(tripSearch.toLowerCase()) ||
    t.destination.toLowerCase().includes(tripSearch.toLowerCase())
  )

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-geist text-left bg-[#f4f5f7] h-[calc(100vh-64px)] overflow-y-auto page-enter">
      
      {/* Title Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-800">AI Chatbot Control Settings</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Configure virtual agent greeting prompts, speech synthesis previews, active trip recommendations, rich FAQs, and conversation starters.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />}
          {saved && <span className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full"><Check className="h-3.5 w-3.5 mr-1" /> Saved</span>}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl">
          <strong>Error saving configuration:</strong> {error}
        </div>
      )}

      {/* Main Settings Body Grid */}
      <div className="flex flex-col xl:flex-row gap-6">
        
        {/* Tab contents configuration card column */}
        <div className="flex-1 min-w-0">
          <Tabs defaultValue="personality" className="space-y-6">
            <TabsList className="bg-slate-150 p-1 rounded-xl w-fit flex flex-wrap gap-1">
              <TabsTrigger value="personality" className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-indigo-650 data-[state=active]:shadow-sm">Personality</TabsTrigger>
              <TabsTrigger value="behavior" className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-indigo-650 data-[state=active]:shadow-sm">Behavior</TabsTrigger>
              <TabsTrigger value="knowledge" className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-indigo-650 data-[state=active]:shadow-sm">Knowledge base</TabsTrigger>
              <TabsTrigger value="faqs" className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-indigo-650 data-[state=active]:shadow-sm">FAQs & Triggers</TabsTrigger>
              <TabsTrigger value="appearance" className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-indigo-650 data-[state=active]:shadow-sm">Appearance</TabsTrigger>
              <TabsTrigger value="advanced" className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-indigo-650 data-[state=active]:shadow-sm">Advanced Inference</TabsTrigger>
              <TabsTrigger value="meta" className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm flex items-center gap-1.5">
                <Share2 className="h-3 w-3" />Meta Integration
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: PERSONALITY (With play preview & wave equalizer) */}
            <TabsContent value="personality" className="space-y-6 outline-none">
              <Card className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100 p-6">
                  <CardTitle className="text-base font-semibold tracking-tight text-slate-800 flex items-center justify-between">
                    <span>Bot Identity & Voice Greeting</span>
                    
                    {/* Speech sample triggers */}
                    <div className="flex items-center gap-2">
                      {isPlayingAudio && (
                        <div className="flex gap-0.5 items-end justify-center h-4 w-12 py-1 select-none shrink-0">
                          <span className="w-0.5 h-3 bg-indigo-500 rounded-full animate-[bounce_0.8s_infinite]" />
                          <span className="w-0.5 h-4 bg-indigo-500 rounded-full animate-[bounce_0.6s_infinite_0.1s]" />
                          <span className="w-0.5 h-2 bg-indigo-500 rounded-full animate-[bounce_0.9s_infinite_0.2s]" />
                          <span className="w-0.5 h-4 bg-indigo-500 rounded-full animate-[bounce_0.7s_infinite_0.3s]" />
                        </div>
                      )}
                      
                      <Button 
                        type="button"
                        onClick={handlePlaySample}
                        className="h-8 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-150 rounded-xl text-[10px] font-bold px-2.5 flex items-center gap-1 shrink-0"
                      >
                        <Volume2 className="h-3.5 w-3.5" /> Play greeting sample
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 font-medium">Configure credentials and robot voice greeting synthesis.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600" htmlFor="bot_name">Bot Name</Label>
                    <Input 
                      id="bot_name"
                      className="rounded-xl bg-slate-100 border-0 text-xs focus:bg-white transition"
                      placeholder="e.g., Ephedia Assistant"
                      value={formData.personality.bot_name}
                      onChange={e => updatePersonality('bot_name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600" htmlFor="greeting">Default Bot Greeting</Label>
                    <Textarea 
                      id="greeting"
                      className="rounded-xl bg-slate-100 border-0 text-xs focus:bg-white transition min-h-[80px]"
                      placeholder="Hi! How can I help you plan your next trip?"
                      value={formData.personality.bot_greeting}
                      onChange={e => updatePersonality('bot_greeting', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100 p-6">
                  <CardTitle className="text-base font-semibold tracking-tight text-slate-800">Tone & Language Style</CardTitle>
                  <CardDescription className="text-xs text-slate-500 font-medium">Adjust response tones and dialects.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 grid gap-6 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">Response Tone</Label>
                    <Select value={formData.personality.response_tone} onValueChange={v => updatePersonality('response_tone', v)}>
                      <SelectTrigger className="rounded-xl bg-slate-100 border-0 text-xs text-slate-700 focus:ring-1 focus:ring-blue-500/20"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200">
                        <SelectItem value="Friendly & Casual">Friendly & Casual</SelectItem>
                        <SelectItem value="Professional & Formal">Professional & Formal</SelectItem>
                        <SelectItem value="Enthusiastic & Salesy">Enthusiastic & Salesy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">Language Mode</Label>
                    <Select value={formData.personality.language_style} onValueChange={v => updatePersonality('language_style', v)}>
                      <SelectTrigger className="rounded-xl bg-slate-100 border-0 text-xs text-slate-700 focus:ring-1 focus:ring-blue-500/20"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200">
                        <SelectItem value="Algerian Darja">Algerian Darja</SelectItem>
                        <SelectItem value="Modern Standard Arabic">Modern Standard Arabic</SelectItem>
                        <SelectItem value="French">French</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3 sm:col-span-2">
                    <div className="flex justify-between">
                      <Label className="text-xs font-semibold text-slate-600">Formality Level ({formData.personality.formality_level}%)</Label>
                    </div>
                    <Slider 
                      min={0} 
                      max={100} 
                      step={10} 
                      value={[formData.personality.formality_level]} 
                      onValueChange={(v) => updatePersonality('formality_level', Array.isArray(v) ? v[0] : (v as any))}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: BEHAVIOR */}
            <TabsContent value="behavior" className="space-y-6 outline-none">
              <Card className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100 p-6">
                  <CardTitle className="text-base font-semibold tracking-tight text-slate-800">Lead Capture & Handoff</CardTitle>
                  <CardDescription className="text-xs text-slate-500 font-medium">Configure chatbot handoff procedures to human staff.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <div className="text-left">
                      <Label className="text-xs font-semibold text-slate-700">Auto-Qualify Leads</Label>
                      <p className="text-[10px] text-slate-400 mt-0.5">Collect name, phone, and target travel destination before handoff.</p>
                    </div>
                    <Switch checked={formData.behavior.auto_qualify_leads} onCheckedChange={c => updateBehavior('auto_qualify_leads', c)} />
                  </div>

                  <div className="space-y-1.5 pt-4">
                    <Label className="text-xs font-semibold text-slate-600">Auto-Handoff Trigger</Label>
                    <Select value={formData.behavior.auto_handoff_trigger} onValueChange={v => updateBehavior('auto_handoff_trigger', v)}>
                      <SelectTrigger className="rounded-xl bg-slate-100 border-0 text-xs text-slate-700 focus:ring-1 focus:ring-blue-500/20"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200">
                        <SelectItem value="Never">Never (Always AI)</SelectItem>
                        <SelectItem value="On complex question">On complex question</SelectItem>
                        <SelectItem value="On customer request">On customer request</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: KNOWLEDGE BASE (With Searchable trip selector + price preview) */}
            <TabsContent value="knowledge" className="space-y-6 outline-none">
              {isShowroom ? (
                <Card className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                  <CardHeader className="border-b border-slate-100 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base font-semibold tracking-tight text-slate-800 flex items-center gap-2">
                        <Bot className="h-5 w-5 text-indigo-500" /> Vehicle Catalog AI Sync
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 font-medium">Configure which stock vehicles the AI Chatbot is allowed to recommend and details of sync.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-slate-500 font-bold">Auto-Sync Catalog</span>
                      <Switch 
                        checked={formData.knowledge?.sync_vehicles_catalog !== false} 
                        onCheckedChange={c => updateKnowledge('sync_vehicles_catalog', c)} 
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-3 text-left">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold text-slate-700">Sync Status: Active</h4>
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full font-bold">Connected</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        When catalog sync is enabled, the AI chatbot is automatically fed with real-time specs, prices, and availability of all cars in your **Management &gt; Inventory** database. Toggle which vehicles below are recommended.
                      </p>
                      <div className="flex gap-4 text-xs font-bold text-indigo-650 bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100/50">
                        <div>🚗 Total Stock Cars: {activeCars.length}</div>
                        <div>🔄 Last Synced: Just now</div>
                      </div>
                    </div>

                    <div className="relative mt-4">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <Input 
                        placeholder="Search vehicle stock catalog..."
                        value={tripSearch}
                        onChange={e => setTripSearch(e.target.value)}
                        className="pl-8 bg-slate-50 border-slate-200 h-8 rounded-lg text-xs"
                      />
                    </div>

                    {activeCars.filter(c => c.title.toLowerCase().includes(tripSearch.toLowerCase())).length === 0 ? (
                      <p className="text-xs text-slate-400 font-medium text-center py-4">Aucun véhicule disponible en stock pour le moment.</p>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-4">
                        {activeCars.filter(c => c.title.toLowerCase().includes(tripSearch.toLowerCase())).map(car => {
                          const isAllowed = formData.knowledge.allowed_trips.includes(car.id)
                          return (
                            <div 
                              key={car.id} 
                              className={`flex items-center justify-between p-3 border rounded-xl transition duration-150 ${
                                isAllowed ? 'border-indigo-150 bg-indigo-50/10' : 'border-slate-150 bg-slate-50/30'
                              }`}
                            >
                              <div className="flex items-center gap-3 text-left">
                                <div className="h-10 w-14 rounded-lg overflow-hidden bg-indigo-50/50 border border-indigo-100/50 shrink-0 relative flex items-center justify-center">
                                  <span className="text-lg">🚗</span>
                                </div>
                                <div>
                                  <span className="text-xs font-bold block text-slate-800 line-clamp-1">{car.title}</span>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${car.destination === 'Vente' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                                      {car.destination}
                                    </span>
                                    <span className="text-[10px] text-indigo-600 font-black">{car.price?.toLocaleString()} DZD{car.destination === 'Location' ? '/Jour' : ''}</span>
                                  </div>
                                </div>
                              </div>
                              <Switch 
                                checked={isAllowed} 
                                onCheckedChange={c => handleTripToggle(car.id, c)} 
                              />
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                  <CardHeader className="border-b border-slate-100 p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-base font-semibold tracking-tight text-slate-800">Trip Recommendations</CardTitle>
                        <CardDescription className="text-xs text-slate-500 font-medium">Select which travel packages AI can suggest to visitors.</CardDescription>
                      </div>
                      
                      {/* Search box filter */}
                      <div className="relative w-full sm:w-60">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <Input 
                          placeholder="Search active travel packages..."
                          value={tripSearch}
                          onChange={e => setTripSearch(e.target.value)}
                          className="pl-8 bg-slate-50 border-slate-200 h-8 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {filteredActiveTrips.length === 0 ? (
                      <p className="text-xs text-slate-500 font-medium">No trips matched your search filter.</p>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-4">
                        {filteredActiveTrips.map(trip => {
                          const isAllowed = formData.knowledge.allowed_trips.includes(trip.id)
                          return (
                            <div 
                              key={trip.id} 
                              className={`flex items-center justify-between p-3 border rounded-xl transition duration-150 ${
                                isAllowed ? 'border-indigo-150 bg-indigo-50/10' : 'border-slate-150 bg-slate-50/30'
                              }`}
                            >
                              <div className="flex items-center gap-3 text-left">
                                {/* Thumbnail preview */}
                                <div className="h-10 w-14 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 relative flex items-center justify-center">
                                  <MapPin className="h-4 w-4 text-slate-350" />
                                </div>
                                <div>
                                  <span className="text-xs font-bold block text-slate-800 line-clamp-1">{trip.title}</span>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase">{trip.destination}</span>
                                    <span className="text-[10px] text-blue-650 text-blue-600 font-black">{trip.price?.toLocaleString()} DA</span>
                                  </div>
                                </div>
                              </div>
                              <Switch 
                                checked={isAllowed} 
                                onCheckedChange={c => handleTripToggle(trip.id, c)} 
                              />
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* TAB 4: FAQs & TRIGGERS (Drag-drop reordering & rich toolbar editors) */}
            <TabsContent value="faqs" className="space-y-6 outline-none">
              <Card className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100 p-6">
                  <CardTitle className="text-base font-semibold tracking-tight text-slate-800">Custom FAQ Triggers</CardTitle>
                  <CardDescription className="text-xs text-slate-500 font-medium">Reordonnez les questions par glisser-déposer. Cliquez sur "Tester" pour injecter la question dans le simulateur.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  
                  {/* FAQs List with HTML5 Drag Drop reordering */}
                  <div className="space-y-3">
                    {faqs.map((faq, idx) => {
                      return (
                        <div 
                          key={faq.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, idx)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => handleDrop(e, idx)}
                          className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-white hover:shadow-xs transition duration-150 select-none group"
                        >
                          <div className="flex items-center gap-3 text-left min-w-0">
                            {/* Drag handle */}
                            <GripVertical className="h-4 w-4 text-slate-350 cursor-grab shrink-0 hover:text-slate-500" />
                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge className={`rounded px-1.5 py-0 text-[8px] font-bold border-0 ${faq.categoryColor}`}>
                                  {faq.category}
                                </Badge>
                                <span className="text-xs font-bold text-slate-800 truncate">{faq.question}</span>
                              </div>
                              <p className="text-[10px] text-slate-500 font-semibold line-clamp-1">{faq.answer}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ml-4 opacity-75 group-hover:opacity-100 transition">
                            <Button
                              type="button"
                              onClick={() => {
                                setMessages(prev => [...prev, { sender: 'user', text: faq.question }])
                                triggerAIResponse(faq.question)
                              }}
                              className="h-7 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-150 rounded-md text-[9px] font-black px-2 flex items-center gap-1"
                            >
                              Tester
                            </Button>
                            
                            <Button 
                              type="button" 
                              onClick={() => handleDeleteFaq(faq.id)}
                              variant="ghost" 
                              size="sm"
                              className="h-7 text-red-500 hover:bg-red-50 rounded-md px-1.5"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Add New FAQ Form */}
                  <form onSubmit={handleAddFaq} className="pt-6 border-t border-slate-100 space-y-4 text-left">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Ajouter une question FAQ</h3>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Question Trigger</Label>
                        <Input 
                          required
                          value={newQuestion}
                          onChange={e => setNewQuestion(e.target.value)}
                          placeholder="E.g., Quels sont vos horaires ?" 
                          className="rounded-xl border-slate-200 text-xs bg-slate-50/50"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">FAQ Category</Label>
                        <select 
                          value={newCategory}
                          onChange={e => setNewCategory(e.target.value as any)}
                          className="flex h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1 text-xs text-slate-700 focus:outline-none"
                        >
                          <option value="General">Purple - General</option>
                          <option value="Paiements">Amber - Paiements</option>
                          <option value="Documents">Blue - Documents</option>
                          <option value="Prestations">Emerald - Prestations</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <Label className="text-xs font-semibold text-slate-600">FAQ Response Answer</Label>
                        
                        {/* Rich markdown editing toolbar */}
                        <div className="flex items-center gap-1 text-[10px] select-none">
                          <button type="button" onClick={() => insertMarkdown('bold')} className="hover:bg-slate-100 border rounded p-1 font-bold"><Bold className="h-3 w-3" /></button>
                          <button type="button" onClick={() => insertMarkdown('link')} className="hover:bg-slate-100 border rounded p-1"><Link2 className="h-3 w-3" /></button>
                          <button type="button" onClick={() => insertMarkdown('emoji1')} className="hover:bg-slate-100 border rounded px-1.5">✈️</button>
                          <button type="button" onClick={() => insertMarkdown('emoji2')} className="hover:bg-slate-100 border rounded px-1.5">🏝️</button>
                          <button type="button" onClick={() => insertMarkdown('emoji3')} className="hover:bg-slate-100 border rounded px-1.5">🕋</button>
                        </div>
                      </div>
                      <textarea
                        required
                        value={newAnswer}
                        onChange={e => setNewAnswer(e.target.value)}
                        placeholder="Rédigez la réponse ici. Utilisez des emojis ou liens markdown."
                        className="flex min-h-[80px] w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold px-4 py-1.5">
                      Save custom FAQ
                    </Button>
                  </form>

                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 5: APPEARANCE */}
            <TabsContent value="appearance" className="space-y-6 outline-none">
              <Card className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100 p-6">
                  <CardTitle className="text-base font-semibold tracking-tight text-slate-800">Widget Design</CardTitle>
                  <CardDescription className="text-xs text-slate-500 font-medium">Visual customization of website floating chatbot triggers.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4 grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">Widget Color</Label>
                    <div className="flex gap-2">
                      <Input type="color" className="w-12 h-10 p-1 rounded-xl bg-transparent border border-slate-200" value={formData.appearance.widget_color} onChange={e => updateAppearance('widget_color', e.target.value)} />
                      <Input className="rounded-xl bg-slate-100 border-0 text-xs focus:bg-white transition flex-1" value={formData.appearance.widget_color} onChange={e => updateAppearance('widget_color', e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">Widget Header Text</Label>
                    <Input className="rounded-xl bg-slate-100 border-0 text-xs focus:bg-white transition" value={formData.appearance.widget_header_text} onChange={e => updateAppearance('widget_header_text', e.target.value)} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 6: ADVANCED */}
            <TabsContent value="advanced" className="space-y-6 outline-none">
              <Card className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100 p-6">
                  <CardTitle className="text-base font-semibold tracking-tight text-slate-800">AI Inference Parameters</CardTitle>
                  <CardDescription className="text-xs text-slate-500 font-medium">Fine tune temperatures and model sizing.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">Select AI Model</Label>
                    <Select value={formData.advanced.ai_model} onValueChange={v => updateAdvanced('ai_model', v)}>
                      <SelectTrigger className="rounded-xl bg-slate-100 border-0 text-xs text-slate-700 focus:ring-1 focus:ring-blue-500/20"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200">
                        <SelectItem value="Gemini 3.1 Pro">Gemini 3.1 Pro (Recommended)</SelectItem>
                        <SelectItem value="Gemini 3 Flash">Gemini 3 Flash (Fast & Cheap)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold text-slate-600">Creativity Temperature ({formData.advanced.creativity_level}%)</Label>
                    <Slider 
                      min={0} 
                      max={100} 
                      step={5} 
                      value={[formData.advanced.creativity_level]} 
                      onValueChange={(v) => updateAdvanced('creativity_level', Array.isArray(v) ? v[0] : (v as any))} 
                    />
                  </div>
                </CardContent>
              </Card>
             </TabsContent>

            {/* TAB: META INTEGRATION */}
            <TabsContent value="meta" className="space-y-6 outline-none">
              {/* Status Banner */}
              <div className={`flex items-center gap-3 p-4 rounded-2xl border text-sm font-medium ${
                metaConfig.enabled 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                  : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  metaConfig.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                }`} />
                {metaConfig.enabled 
                  ? '✅ Meta integration is active. Your chatbot is live on the connected platforms.' 
                  : '⚠️ Meta integration is disabled. Enable it below and paste the webhook URL into your Meta App.'}
              </div>

              {/* Enable Toggle + Webhook URL */}
              <Card className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100 p-6">
                  <CardTitle className="text-base font-semibold tracking-tight text-slate-800 flex items-center justify-between">
                    <span className="flex items-center gap-2"><Webhook className="h-4 w-4 text-blue-500" /> n8n Webhook & Meta Setup</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">Enable Integration</span>
                      <Switch 
                        checked={metaConfig.enabled}
                        onCheckedChange={v => setMetaConfig(prev => ({ ...prev, enabled: v }))}
                      />
                    </div>
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 font-medium">Connect your AI chatbot to WhatsApp, Instagram, and Facebook via Meta Webhooks + n8n.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">Your n8n Webhook URL</Label>
                    <p className="text-[11px] text-slate-400">Get this from n8n: open the workflow → click the Webhook node → copy the Production URL.</p>
                    <div className="flex gap-2">
                      <Input
                        className="rounded-xl bg-slate-100 border-0 text-xs focus:bg-white transition font-mono flex-1"
                        placeholder="https://your-n8n-instance.com/webhook/meta-webhook"
                        value={metaConfig.webhook_url}
                        onChange={e => setMetaConfig(prev => ({ ...prev, webhook_url: e.target.value }))}
                      />
                      {metaConfig.webhook_url && (
                        <Button 
                          type="button"
                          onClick={handleCopyWebhook}
                          className="h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border-0 text-xs font-semibold flex items-center gap-1.5"
                        >
                          {webhookCopied ? <CheckCheck className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                          {webhookCopied ? 'Copied!' : 'Copy'}
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">Webhook Verify Token</Label>
                    <p className="text-[11px] text-slate-400">Paste this exact value in the Meta App → Webhooks → Verify Token field.</p>
                    <div className="flex gap-2">
                      <Input
                        className="rounded-xl bg-slate-100 border-0 text-xs focus:bg-white transition font-mono flex-1"
                        value={metaConfig.verify_token}
                        onChange={e => setMetaConfig(prev => ({ ...prev, verify_token: e.target.value }))}
                      />
                      <Button 
                        type="button"
                        onClick={handleCopyToken}
                        className="h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border-0 text-xs font-semibold flex items-center gap-1.5"
                      >
                        {tokenCopied ? <CheckCheck className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        {tokenCopied ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Platform Toggles */}
              <Card className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100 p-6">
                  <CardTitle className="text-base font-semibold tracking-tight text-slate-800">Active Platforms</CardTitle>
                  <CardDescription className="text-xs text-slate-500 font-medium">Choose which Meta platforms the chatbot responds on.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center">
                        <Phone className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-700">WhatsApp Business</p>
                        <p className="text-[11px] text-slate-400">Responds to WhatsApp messages (text, voice, images)</p>
                      </div>
                    </div>
                    <Switch 
                      checked={metaConfig.whatsapp_enabled}
                      onCheckedChange={v => setMetaConfig(prev => ({ ...prev, whatsapp_enabled: v }))}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-pink-50 border border-pink-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                        <Camera className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-700">Instagram DMs</p>
                        <p className="text-[11px] text-slate-400">Responds to Instagram Direct Messages</p>
                      </div>
                    </div>
                    <Switch 
                      checked={metaConfig.instagram_enabled}
                      onCheckedChange={v => setMetaConfig(prev => ({ ...prev, instagram_enabled: v }))}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
                        <Users className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-700">Facebook Messenger</p>
                        <p className="text-[11px] text-slate-400">Responds to Facebook Messenger conversations</p>
                      </div>
                    </div>
                    <Switch 
                      checked={metaConfig.facebook_enabled}
                      onCheckedChange={v => setMetaConfig(prev => ({ ...prev, facebook_enabled: v }))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Step-by-step Setup Guide */}
              <Card className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100 p-6">
                  <CardTitle className="text-base font-semibold tracking-tight text-slate-800 flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-500" /> Setup Guide (For Testing)
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 font-medium">Follow these steps to connect your Meta test app.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <ol className="space-y-4 text-xs text-slate-600">
                    <li className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                      <div>
                        <p className="font-semibold">Import the n8n workflow</p>
                        <p className="text-slate-400 mt-0.5">Open n8n → Import from file → select <code className="bg-slate-100 px-1 rounded">n8n-chatbot-workflow.json</code> from your project root.</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                      <div>
                        <p className="font-semibold">Set the 7 Environment Variables in n8n</p>
                        <div className="mt-1.5 bg-slate-900 rounded-lg p-3 font-mono text-[10px] text-slate-300 space-y-0.5">
                          <p><span className="text-blue-400">OPENAI_API_KEY</span>=sk-...</p>
                          <p><span className="text-blue-400">SUPABASE_URL</span>=https://xxx.supabase.co</p>
                          <p><span className="text-blue-400">SUPABASE_SERVICE_KEY</span>=eyJ...</p>
                          <p><span className="text-blue-400">META_ACCESS_TOKEN</span>=EAAx... (Page Token)</p>
                          <p><span className="text-blue-400">META_PHONE_NUMBER_ID</span>=1234... (WhatsApp)</p>
                          <p><span className="text-blue-400">AGENCY_ID</span>={agencyId}</p>
                          <p><span className="text-blue-400">META_WEBHOOK_VERIFY_TOKEN</span>={metaConfig.verify_token}</p>
                        </div>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                      <div>
                        <p className="font-semibold">Activate the workflow & copy the webhook URL</p>
                        <p className="text-slate-400 mt-0.5">In n8n, toggle the workflow ON. Click the Webhook node → copy the <strong>Production URL</strong> → paste it above.</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">4</span>
                      <div>
                        <p className="font-semibold">Configure the Meta App Webhook</p>
                        <p className="text-slate-400 mt-0.5">Go to <a href="https://developers.facebook.com" target="_blank" rel="noopener" className="text-blue-500 underline">developers.facebook.com</a> → Your Test App → WhatsApp → Configuration → paste the Webhook URL and Verify Token above. Subscribe to <code className="bg-slate-100 px-1 rounded">messages</code>.</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">5</span>
                      <div>
                        <p className="font-semibold">Run the Supabase migration</p>
                        <p className="text-slate-400 mt-0.5">In Supabase → SQL Editor → paste the contents of <code className="bg-slate-100 px-1 rounded">supabase/migrations/20260525_conversation_messages.sql</code> and click Run.</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-[11px]">✓</span>
                      <div>
                        <p className="font-semibold text-emerald-700">Send a WhatsApp test message to your test number!</p>
                        <p className="text-slate-400 mt-0.5">The bot should reply in Algerian Darja within seconds. Check Supabase → conversation_messages table for the saved conversation.</p>
                      </div>
                    </li>
                  </ol>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  onClick={saveMetaConfig}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold px-6 py-2 shadow-sm transition active:scale-95 flex items-center gap-1.5"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Save Meta Integration Config
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* CHATBOT LIVE TEST / SIMULATION PANEL (Fully Interactive) */}
        <div className="w-full xl:w-[375px] shrink-0">
          <div className="sticky top-6 border border-slate-200 rounded-3xl overflow-hidden shadow-md bg-slate-900 p-3 h-[700px] flex flex-col">
            <div className="text-center text-xs text-slate-400 font-mono py-1 mb-2">AI Test Panel</div>
            
            <div className="flex-1 bg-slate-50 rounded-2xl overflow-hidden relative flex flex-col justify-between">
              
              {/* Header */}
              <div className="p-3 text-white flex items-center gap-3 sticky top-0" style={{ backgroundColor: formData.appearance.widget_color }}>
                <Bot className="h-8 w-8 p-1.5 bg-white/25 rounded-full" />
                <div className="text-left">
                  <div className="text-xs font-bold">{formData.personality.bot_name}</div>
                  <div className="text-[9px] text-white/80">Online</div>
                </div>
              </div>

              {/* Scrollable Conversation messages panel */}
              <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[500px]">
                {messages.map((msg, idx) => {
                  const isBot = msg.sender === 'bot'
                  return (
                    <div key={idx} className={`flex gap-2 items-start text-left ${!isBot ? 'justify-end' : ''}`}>
                      {isBot && <Bot className="h-6 w-6 p-1 bg-slate-200 rounded-full shrink-0 text-slate-600 mt-1" />}
                      <div 
                        className={`rounded-2xl p-2.5 max-w-[80%] shadow-sm text-xs ${
                          isBot 
                            ? 'bg-white border border-slate-100 text-slate-800' 
                            : 'text-white'
                        }`}
                        style={{ backgroundColor: isBot ? undefined : formData.appearance.widget_color }}
                      >
                        {msg.text}
                      </div>
                      {!isBot && <User className="h-6 w-6 p-1 bg-slate-200 rounded-full shrink-0 text-slate-600 mt-1" />}
                    </div>
                  )
                })}

                {/* Animated bouncing dots Typing indicator */}
                {isTyping && (
                  <div className="flex gap-2 items-start text-left">
                    <Bot className="h-6 w-6 p-1 bg-slate-200 rounded-full shrink-0 text-slate-600 mt-1" />
                    <div className="bg-white border border-slate-100 rounded-2xl p-2.5 max-w-[80%] shadow-sm text-xs text-slate-400 flex items-center gap-1 select-none">
                      <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}

                <div ref={chatBottomRef} />
              </div>

              {/* Conversation starters area */}
              <div className="px-2 pb-1 pt-2 bg-slate-100/50 border-t border-slate-100">
                <span className="text-[8px] font-black text-slate-400 block mb-1 uppercase tracking-wider text-left pl-1">Suggestion questions (Starters)</span>
                <div className="flex gap-1 overflow-x-auto pb-1 select-none scrollbar-hide">
                  {(isShowroom
                    ? [
                        "🚗 Modèles dispo ?",
                        "🏦 Financement/Banques ?",
                        "🔄 Service Reprise ?"
                      ]
                    : [
                        "✈️ Offres voyages ?",
                        "💵 Quel CCP (Paiement) ?",
                        "🩺 Assurance incluse ?"
                      ]
                  ).map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendSimulatorMsg(preset)}
                      className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-[10px] font-semibold rounded-full text-slate-600 whitespace-nowrap transition"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Simulator controls inputs */}
              <form 
                onSubmit={e => {
                  e.preventDefault()
                  handleSendSimulatorMsg()
                }} 
                className="p-2 border-t bg-white flex gap-2"
              >
                <Input 
                  placeholder="Ask the AI simulator..." 
                  value={simulatorInput}
                  onChange={e => setSimulatorInput(e.target.value)}
                  className="text-xs bg-slate-50 flex-1 rounded-xl h-8 border-0" 
                />
                <Button 
                  type="submit"
                  size="sm" 
                  className="h-8 w-8 rounded-xl p-0 flex items-center justify-center shrink-0" 
                  style={{ backgroundColor: formData.appearance.widget_color }}
                >
                  <Send className="h-3.5 w-3.5 text-white" />
                </Button>
              </form>

            </div>
          </div>
        </div>

      </div>

      {/* Auto / Manual Save Trigger Control bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div className="text-xs text-slate-400 font-semibold">
          {loading ? "Saving weights config..." : "Les paramètres de l'IA s'enregistrent automatiquement après chaque modification."}
        </div>
        <Button 
          onClick={() => saveSettings(formData)} 
          disabled={loading}
          className="bg-indigo-605 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold px-6 py-2 shadow-sm transition active:scale-95 flex items-center gap-1.5"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          <span>Enregistrer les paramètres</span>
        </Button>
      </div>

    </div>
  )
}
