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
  Webhook, Share2, Copy, CheckCheck, Phone, ExternalLink, AlertCircle, Info, Camera, Users,
  Package, Clock, CreditCard, Shield, Truck, Wrench, FileCheck, FileText, Globe, Container, Plus, Minus
} from 'lucide-react'
import { getDefaultChatbotConfig } from '@/lib/settings-defaults'
import { ChatbotConfig } from '@/types/settings'
import { Badge } from '@/components/ui/badge'
import { MetaIntegrationTab } from '@/components/dashboard/MetaIntegrationTab'

interface FAQItem {
  id: string
  question: string
  answer: string
  category: 'General' | 'Paiements' | 'Documents' | 'Prestations'
  categoryColor: string
}

export function ChatbotSettingsClient({ activeTrips, agencyId, activeCars = [], metaIntegration = null }: { activeTrips: any[], agencyId: string, activeCars?: any[], metaIntegration?: any }) {
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

  const updateTravelTopics = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      travel_topics: { ...(prev as any).travel_topics, [key]: value }
    } as any))
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
          replyText = "Je ne peux pas confirmer de modèle, prix ou disponibilité tant qu'aucun véhicule réel n'est autorisé dans le catalogue AI. Activez au moins un véhicule depuis l'inventaire pour que je réponde avec des informations exactes."
        }
      }
      else if (isCar && (query.includes('taux') || query.includes('finance') || query.includes('credit') || query.includes('banque') || query.includes('mensuel') || query.includes('apport'))) {
        replyText = "Nous proposons des plans de financement flexibles avec nos banques partenaires algériennes (**CPA, BADR, AGB**). Sur la base d'un taux d'intérêt moyen de **7.5%**, vous pouvez acquérir un véhicule avec un apport minimal de **30%** et le reste étalé de 12 à 60 mois. Voulez-vous qu'un conseiller financier simule un crédit ?"
      }
      else if (isCar && (query.includes('test') || query.includes('drive') || query.includes('conduire') || query.includes('reserver') || query.includes('rdv') || query.includes('essai'))) {
        const allowedCarsList = activeCars.filter(c => formData.knowledge.allowed_trips.includes(c.id))
        if (allowedCarsList.length > 0) {
          replyText = `Avec plaisir ! Je peux préparer une demande d'essai pour : ${allowedCarsList.map(c => `**${c.title}**`).join(', ')}. Merci de partager votre numéro de téléphone, votre date souhaitée et une copie de votre permis de conduire.`
        } else {
          replyText = "Je peux aider à organiser un essai, mais aucun véhicule réel n'est actuellement autorisé dans le catalogue AI. Activez d'abord les véhicules disponibles dans l'inventaire."
        }
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
              {!isShowroom && (
                <TabsTrigger value="travel_topics" className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm flex items-center gap-1.5">
                  <Globe className="h-3 w-3" />Topics & Rules
                </TabsTrigger>
              )}
              <TabsTrigger value="faqs" className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-indigo-650 data-[state=active]:shadow-sm">FAQs & Triggers</TabsTrigger>
              <TabsTrigger value="appearance" className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-indigo-650 data-[state=active]:shadow-sm">Appearance</TabsTrigger>
              <TabsTrigger value="advanced" className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-indigo-650 data-[state=active]:shadow-sm">Advanced Inference</TabsTrigger>
              {isShowroom && (
                <TabsTrigger value="import" className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm flex items-center gap-1.5">
                  <Package className="h-3 w-3" />Import AI
                </TabsTrigger>
              )}
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

            {/* ═══════════════════ TAB: TRAVEL AI TOPICS & RULES ═══════════════════ */}
            {!isShowroom && (
            <TabsContent value="travel_topics" className="space-y-5 outline-none">

              {/* Hero banner */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-md">
                    <Globe className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-sm font-bold text-slate-800">AI Topics & Response Rules</h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">Contrôlez exactement ce que votre IA peut expliquer aux clients — rubrique par rubrique</p>
                  </div>
                </div>
                <span className="text-[10px] font-black px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-200 text-emerald-700">✈️ Travel Module</span>
              </div>

              {/* ── SECTION 1: TRIPS ── */}
              <Card className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-500" />Voyages & Circuits Organisés
                      </CardTitle>
                      <CardDescription className="text-[11px] text-slate-500">L'IA peut-elle parler de vos voyages et circuits organisés ?</CardDescription>
                    </div>
                    <Switch
                      checked={(formData as any).travel_topics?.enable_trips !== false}
                      onCheckedChange={v => updateTravelTopics('enable_trips', v)}
                    />
                  </div>
                </CardHeader>
                {(formData as any).travel_topics?.enable_trips !== false && (
                  <CardContent className="p-5 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Message d'accroche voyages</Label>
                        <Textarea
                          placeholder="ex: Nous proposons des voyages organisés vers la Turquie, Dubaï, Madrid... Prix tout compris au départ d'Alger."
                          className="rounded-xl bg-slate-50 border-slate-200 text-xs min-h-[80px]"
                          value={(formData as any).travel_topics?.trips_intro || ''}
                          onChange={e => updateTravelTopics('trips_intro', e.target.value)}
                        />
                      </div>
                      <div className="space-y-3">
                        {[
                          { key: 'trips_include_price', label: '💰 Mentionner les prix', desc: 'L\'IA peut citer les tarifs des voyages' },
                          { key: 'trips_include_duration', label: '🗓 Mentionner la durée', desc: 'Nombre de jours/nuits inclus' },
                          { key: 'trips_include_inclusions', label: '✅ Détailler les inclusions', desc: 'Vol, hôtel, transferts, repas...' },
                          { key: 'trips_include_booking_process', label: '📋 Expliquer la procédure de réservation', desc: 'Comment réserver, acompte requis...' },
                        ].map(({ key, label, desc }) => (
                          <div key={key} className="flex items-center justify-between p-2.5 border border-slate-100 rounded-xl">
                            <div>
                              <p className="text-xs font-semibold text-slate-700">{label}</p>
                              <p className="text-[10px] text-slate-400">{desc}</p>
                            </div>
                            <Switch
                              checked={(formData as any).travel_topics?.[key] !== false}
                              onCheckedChange={v => updateTravelTopics(key, v)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* ── SECTION 2: VISA ── */}
              <Card className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <FileCheck className="h-4 w-4 text-violet-500" />Services Visa
                      </CardTitle>
                      <CardDescription className="text-[11px] text-slate-500">Informations sur les visas que l'IA peut communiquer aux clients</CardDescription>
                    </div>
                    <Switch
                      checked={(formData as any).travel_topics?.enable_visa !== false}
                      onCheckedChange={v => updateTravelTopics('enable_visa', v)}
                    />
                  </div>
                </CardHeader>
                {(formData as any).travel_topics?.enable_visa !== false && (
                  <CardContent className="p-5 space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">Description des services visa proposés</Label>
                      <Textarea
                        placeholder="ex: Nous proposons des services de constitution de dossier visa pour la France, l'Espagne, la Turquie, Dubaï (EAU), l'Italie..."
                        className="rounded-xl bg-slate-50 border-slate-200 text-xs min-h-[80px]"
                        value={(formData as any).travel_topics?.visa_description || ''}
                        onChange={e => updateTravelTopics('visa_description', e.target.value)}
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {[
                        { key: 'visa_explain_docs', label: '📄 Expliquer les documents requis', desc: 'Passeport, photos, relevés bancaires...' },
                        { key: 'visa_explain_fees', label: '💶 Mentionner les frais de visa', desc: 'Frais consulaires et honoraires agence' },
                        { key: 'visa_explain_delays', label: '⏱ Mentionner les délais de traitement', desc: 'Nombre de jours ouvrables estimés' },
                        { key: 'visa_explain_refusal', label: '❌ Parler des cas de refus', desc: 'Conditions pouvant mener à un refus' },
                      ].map(({ key, label, desc }) => (
                        <div key={key} className="flex items-center justify-between p-2.5 border border-slate-100 rounded-xl">
                          <div>
                            <p className="text-xs font-semibold text-slate-700">{label}</p>
                            <p className="text-[10px] text-slate-400">{desc}</p>
                          </div>
                          <Switch
                            checked={(formData as any).travel_topics?.[key] !== false}
                            onCheckedChange={v => updateTravelTopics(key, v)}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* ── SECTION 3: PAYMENT METHODS ── */}
              <Card className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100 p-5">
                  <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-emerald-500" />Moyens de Paiement
                  </CardTitle>
                  <CardDescription className="text-[11px] text-slate-500">Activez chaque mode de paiement — l'IA les expliquera aux clients qui demandent comment payer.</CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-3">
                  {/* Cash */}
                  <div className="flex items-center justify-between p-3 border border-slate-150 rounded-xl">
                    <div>
                      <Label className="text-xs font-bold text-slate-700">💵 Espèces en agence</Label>
                      <p className="text-[10px] text-slate-400 mt-0.5">Paiement direct au bureau en dinars algériens</p>
                    </div>
                    <Switch
                      checked={(formData as any).travel_topics?.pay_cash !== false}
                      onCheckedChange={v => updateTravelTopics('pay_cash', v)}
                    />
                  </div>
                  {/* CCP */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border border-slate-150 rounded-xl">
                      <div>
                        <Label className="text-xs font-bold text-slate-700">🏦 Virement CCP (Algérie Poste)</Label>
                        <p className="text-[10px] text-slate-400 mt-0.5">Virement postal vers votre compte CCP</p>
                      </div>
                      <Switch
                        checked={(formData as any).travel_topics?.pay_ccp !== false}
                        onCheckedChange={v => updateTravelTopics('pay_ccp', v)}
                      />
                    </div>
                    {(formData as any).travel_topics?.pay_ccp !== false && (
                      <Input
                        placeholder="ex: Titulaire: Amalou Achraf / N° CCP: 0021876532 / Clé: 89"
                        className="rounded-xl bg-slate-50 border-slate-200 text-xs ml-3"
                        value={(formData as any).travel_topics?.pay_ccp_details || ''}
                        onChange={e => updateTravelTopics('pay_ccp_details', e.target.value)}
                      />
                    )}
                  </div>
                  {/* Bank transfer */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border border-slate-150 rounded-xl">
                      <div>
                        <Label className="text-xs font-bold text-slate-700">🏛 Virement bancaire (BNA, CPA, BEA...)</Label>
                        <p className="text-[10px] text-slate-400 mt-0.5">Virement via banque commerciale algérienne</p>
                      </div>
                      <Switch
                        checked={(formData as any).travel_topics?.pay_bank_transfer === true}
                        onCheckedChange={v => updateTravelTopics('pay_bank_transfer', v)}
                      />
                    </div>
                    {(formData as any).travel_topics?.pay_bank_transfer === true && (
                      <Input
                        placeholder="ex: RIB: 0021876532 / Banque: CPA Agence Ben Aknoun / Titulaire: Sarl VoyagePro"
                        className="rounded-xl bg-slate-50 border-slate-200 text-xs ml-3"
                        value={(formData as any).travel_topics?.pay_bank_details || ''}
                        onChange={e => updateTravelTopics('pay_bank_details', e.target.value)}
                      />
                    )}
                  </div>
                  {/* Installments */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border border-slate-150 rounded-xl">
                      <div>
                        <Label className="text-xs font-bold text-slate-700">📆 Paiement en plusieurs fois (facilité)</Label>
                        <p className="text-[10px] text-slate-400 mt-0.5">Acompte + solde avant départ</p>
                      </div>
                      <Switch
                        checked={(formData as any).travel_topics?.pay_installments === true}
                        onCheckedChange={v => updateTravelTopics('pay_installments', v)}
                      />
                    </div>
                    {(formData as any).travel_topics?.pay_installments === true && (
                      <Textarea
                        placeholder="ex: Acompte de 50% à la réservation, solde 10 jours avant le départ. Aucun intérêt."
                        className="rounded-xl bg-slate-50 border-slate-200 text-xs ml-3 min-h-[60px]"
                        value={(formData as any).travel_topics?.pay_installments_details || ''}
                        onChange={e => updateTravelTopics('pay_installments_details', e.target.value)}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* ── SECTION 4: 750 EUR RULE ── */}
              <Card className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <span className="text-base">💶</span>Dotation Devise — Règle des 750 EUR
                      </CardTitle>
                      <CardDescription className="text-[11px] text-slate-500">Informer les clients sur la dotation en devises auprès des banques algériennes</CardDescription>
                    </div>
                    <Switch
                      checked={(formData as any).travel_topics?.enable_forex_750 !== false}
                      onCheckedChange={v => updateTravelTopics('enable_forex_750', v)}
                    />
                  </div>
                </CardHeader>
                {(formData as any).travel_topics?.enable_forex_750 !== false && (
                  <CardContent className="p-5 space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <p className="text-xs font-bold text-amber-800 mb-1">📌 Règle officielle Banque d'Algérie</p>
                      <p className="text-[11px] text-amber-700 leading-relaxed">Chaque voyageur algérien peut retirer jusqu'à <strong>750 EUR</strong> (ou équivalent) par an auprès de sa banque, sur présentation du passeport et du billet d'avion (ou visa). Certaines banques demandent aussi la réservation d'hôtel.</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">Message personnalisé sur la dotation devise</Label>
                      <Textarea
                        placeholder="ex: Vous pouvez retirer jusqu'à 750 EUR/an à votre banque (BNA, CPA, BEA, BADR...) sur présentation de votre passeport + billet d'avion. Certaines banques exigent aussi la réservation d'hôtel confirmée."
                        className="rounded-xl bg-slate-50 border-slate-200 text-xs min-h-[100px]"
                        value={(formData as any).travel_topics?.forex_750_message || ''}
                        onChange={e => updateTravelTopics('forex_750_message', e.target.value)}
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {[
                        { key: 'forex_explain_banks', label: '🏦 Citer les banques acceptantes', desc: 'BNA, CPA, BEA, BADR, Société Générale Algérie...' },
                        { key: 'forex_explain_docs_needed', label: '📄 Documents requis pour le retrait', desc: 'Passeport + billet + visa + réservation hôtel' },
                        { key: 'forex_explain_limit', label: '📊 Préciser le plafond annuel', desc: '750 EUR maximum par an et par personne' },
                        { key: 'forex_suggest_agency_help', label: '🤝 Proposer aide de l\'agence', desc: 'L\'agence peut fournir les documents requis par la banque' },
                      ].map(({ key, label, desc }) => (
                        <div key={key} className="flex items-center justify-between p-2.5 border border-slate-100 rounded-xl">
                          <div>
                            <p className="text-xs font-semibold text-slate-700">{label}</p>
                            <p className="text-[10px] text-slate-400">{desc}</p>
                          </div>
                          <Switch
                            checked={(formData as any).travel_topics?.[key] !== false}
                            onCheckedChange={v => updateTravelTopics(key, v)}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* ── SECTION 5: REQUIRED DOCUMENTS ── */}
              <Card className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-500" />Documents Requis pour Voyager
                      </CardTitle>
                      <CardDescription className="text-[11px] text-slate-500">Quels papiers l'IA doit-elle mentionner selon la destination ?</CardDescription>
                    </div>
                    <Switch
                      checked={(formData as any).travel_topics?.enable_documents !== false}
                      onCheckedChange={v => updateTravelTopics('enable_documents', v)}
                    />
                  </div>
                </CardHeader>
                {(formData as any).travel_topics?.enable_documents !== false && (
                  <CardContent className="p-5 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-3">
                      {[
                        { key: 'doc_passport', label: '🛂 Passeport valide (6 mois min)', desc: 'Valable au moins 6 mois après la date de retour' },
                        { key: 'doc_photos', label: '📷 Photos d\'identité fond blanc', desc: '2 à 4 photos selon les destinations' },
                        { key: 'doc_bank_statement', label: '🏦 Relevé bancaire CCP/compte', desc: 'Attestation de fonds suffisants' },
                        { key: 'doc_civil_status', label: '📋 Acte de naissance ou livret', desc: 'État civil pour certaines destinations' },
                        { key: 'doc_work_proof', label: '💼 Attestation de travail', desc: 'Attestation employeur ou registre de commerce' },
                        { key: 'doc_hotel_booking', label: '🏨 Réservation hôtel confirmée', desc: 'Confirmation de réservation requise pour le visa' },
                        { key: 'doc_flight_ticket', label: '✈️ Billet d\'avion aller-retour', desc: 'Ou réservation provisoire de vol' },
                        { key: 'doc_travel_insurance', label: '🛡 Assurance voyage', desc: 'Obligatoire pour visa Schengen (30 000€ min)' },
                      ].map(({ key, label, desc }) => (
                        <div key={key} className="flex items-center justify-between p-2.5 border border-slate-100 rounded-xl">
                          <div>
                            <p className="text-xs font-semibold text-slate-700">{label}</p>
                            <p className="text-[10px] text-slate-400">{desc}</p>
                          </div>
                          <Switch
                            checked={(formData as any).travel_topics?.[key] !== false}
                            onCheckedChange={v => updateTravelTopics(key, v)}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">Documents supplémentaires (texte libre)</Label>
                      <Textarea
                        placeholder="ex: Pour la Turquie, un passeport seul suffit (sans visa). Pour Schengen: fiche de renseignements + justificatif de logement chez l'habitant si applicable..."
                        className="rounded-xl bg-slate-50 border-slate-200 text-xs min-h-[80px]"
                        value={(formData as any).travel_topics?.docs_extra_notes || ''}
                        onChange={e => updateTravelTopics('docs_extra_notes', e.target.value)}
                      />
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* ── SECTION 6: TRAVEL INSURANCE ── */}
              <Card className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-emerald-500" />Assurance Voyage
                      </CardTitle>
                      <CardDescription className="text-[11px] text-slate-500">L'IA peut-elle parler de votre couverture assurance voyage ?</CardDescription>
                    </div>
                    <Switch
                      checked={(formData as any).travel_topics?.enable_insurance !== false}
                      onCheckedChange={v => updateTravelTopics('enable_insurance', v)}
                    />
                  </div>
                </CardHeader>
                {(formData as any).travel_topics?.enable_insurance !== false && (
                  <CardContent className="p-5 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-3">
                      {[
                        { key: 'insurance_included', label: '✅ Assurance incluse dans les forfaits', desc: 'L\'assurance est offerte par défaut' },
                        { key: 'insurance_explain_coverage', label: '📋 Détailler la couverture', desc: 'Annulation, rapatriement, bagages, médical...' },
                        { key: 'insurance_mention_schengen', label: '🇪🇺 Préciser montant Schengen (30 000€)', desc: 'Obligatoire pour visa Schengen' },
                        { key: 'insurance_optional_upgrade', label: '⬆️ Mentionner upgrade optionnel', desc: 'Le client peut choisir une couverture supérieure' },
                      ].map(({ key, label, desc }) => (
                        <div key={key} className="flex items-center justify-between p-2.5 border border-slate-100 rounded-xl">
                          <div>
                            <p className="text-xs font-semibold text-slate-700">{label}</p>
                            <p className="text-[10px] text-slate-400">{desc}</p>
                          </div>
                          <Switch
                            checked={(formData as any).travel_topics?.[key] !== false}
                            onCheckedChange={v => updateTravelTopics(key, v)}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">Message IA sur l'assurance (texte libre)</Label>
                      <Textarea
                        placeholder="ex: Une assurance voyage complète est incluse dans tous nos forfaits. Elle couvre les frais médicaux jusqu'à 30 000€, l'annulation, et le rapatriement d'urgence."
                        className="rounded-xl bg-slate-50 border-slate-200 text-xs min-h-[80px]"
                        value={(formData as any).travel_topics?.insurance_message || ''}
                        onChange={e => updateTravelTopics('insurance_message', e.target.value)}
                      />
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* ── SECTION 7: CONTACT & HOURS ── */}
              <Card className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100 p-5">
                  <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-blue-500" />Coordonnées & Horaires Agence
                  </CardTitle>
                  <CardDescription className="text-[11px] text-slate-500">Informations que l'IA fournit quand un client demande à vous contacter.</CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">Téléphone / WhatsApp</Label>
                      <Input
                        placeholder="ex: +213 550 123 456"
                        className="rounded-xl bg-slate-50 border-slate-200 text-xs"
                        value={(formData as any).travel_topics?.contact_phone || ''}
                        onChange={e => updateTravelTopics('contact_phone', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">Email</Label>
                      <Input
                        placeholder="ex: contact@agence.dz"
                        className="rounded-xl bg-slate-50 border-slate-200 text-xs"
                        value={(formData as any).travel_topics?.contact_email || ''}
                        onChange={e => updateTravelTopics('contact_email', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">Adresse physique</Label>
                      <Input
                        placeholder="ex: 15 Rue Larbi Ben M'hidi, Alger Centre"
                        className="rounded-xl bg-slate-50 border-slate-200 text-xs"
                        value={(formData as any).travel_topics?.contact_address || ''}
                        onChange={e => updateTravelTopics('contact_address', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">Horaires d'ouverture</Label>
                      <Input
                        placeholder="ex: Sam–Jeu: 9h–18h / Vendredi: Fermé"
                        className="rounded-xl bg-slate-50 border-slate-200 text-xs"
                        value={(formData as any).travel_topics?.contact_hours || ''}
                        onChange={e => updateTravelTopics('contact_hours', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ── SECTION 8: CUSTOM AI INSTRUCTIONS ── */}
              <Card className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100 p-5">
                  <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-500" />Instructions IA Personnalisées
                  </CardTitle>
                  <CardDescription className="text-[11px] text-slate-500">Règles supplémentaires injectées directement dans le prompt de l'IA lors de chaque conversation.</CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-3">
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-[11px] text-amber-700">
                    <strong>⚠️ Avancé:</strong> Ces instructions seront ajoutées au prompt système. Soyez précis et concis.
                  </div>
                  <Textarea
                    placeholder={`ex:\n- Ne jamais promettre un visa sans évaluer le dossier\n- Toujours préciser que les prix sont "TTC au départ d'Alger"\n- Demander la destination, les dates, et le nombre de voyageurs avant de donner un prix\n- Rappeler que l'acompte est non remboursable en cas d'annulation`}
                    className="rounded-xl bg-slate-50 border-slate-200 text-xs min-h-[130px] font-mono"
                    value={(formData as any).travel_topics?.custom_instructions || ''}
                    onChange={e => updateTravelTopics('custom_instructions', e.target.value)}
                  />
                  <Button
                    onClick={() => saveSettings(formData as any)}
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold py-2.5 shadow-sm transition flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Enregistrer les Topics & Règles IA
                  </Button>
                </CardContent>
              </Card>

            </TabsContent>
            )}

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

            {/* TAB: IMPORT BUSINESS AI */}
            {isShowroom && (
            <TabsContent value="import" className="space-y-5 outline-none">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-md">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-sm font-bold text-slate-800">Import Business AI Settings</h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">Contrôle total du comportement de l'IA pour votre activité d'importation</p>
                  </div>
                </div>
                <span className="text-[10px] font-black px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-200 text-orange-700">🚢 Import Module</span>
              </div>

              {/* SECTION 1: Timeline & Logistics */}
              <Card className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100 p-5">
                  <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-500" />Délai d'Importation &amp; Logistique
                  </CardTitle>
                  <CardDescription className="text-[11px] text-slate-500">L'IA utilisera ces informations quand un client demande les délais d'importation.</CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">Délai global (affiché aux clients)</Label>
                      <Input
                        placeholder="ex: 3.5 mois en moyenne"
                        className="rounded-xl bg-slate-50 border-slate-200 text-xs"
                        value={(formData as any).import_settings?.import_timeline || ''}
                        onChange={e => setFormData(prev => ({ ...prev, import_settings: { ...(prev as any).import_settings, import_timeline: e.target.value } } as any))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">Détail du délai par étape</Label>
                      <Input
                        placeholder="ex: Fabrication: 6 sem, Transport: 5-6 sem, Douane: 2-3 sem"
                        className="rounded-xl bg-slate-50 border-slate-200 text-xs"
                        value={(formData as any).import_settings?.import_timeline_breakdown || ''}
                        onChange={e => setFormData(prev => ({ ...prev, import_settings: { ...(prev as any).import_settings, import_timeline_breakdown: e.target.value } } as any))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* SECTION 2: Contact Info */}
              <Card className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100 p-5">
                  <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-blue-500" />Informations de Contact
                  </CardTitle>
                  <CardDescription className="text-[11px] text-slate-500">Ces informations seront fournies par l'IA quand un client demande comment vous joindre.</CardDescription>
                </CardHeader>
                <CardContent className="p-5 grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">Téléphone principal</Label>
                    <Input placeholder="ex: +213 550 123 456" className="rounded-xl bg-slate-50 border-slate-200 text-xs"
                      value={(formData as any).import_settings?.contact_phone_1 || ''}
                      onChange={e => setFormData(prev => ({ ...prev, import_settings: { ...(prev as any).import_settings, contact_phone_1: e.target.value } } as any))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">Téléphone secondaire</Label>
                    <Input placeholder="ex: +213 770 987 654" className="rounded-xl bg-slate-50 border-slate-200 text-xs"
                      value={(formData as any).import_settings?.contact_phone_2 || ''}
                      onChange={e => setFormData(prev => ({ ...prev, import_settings: { ...(prev as any).import_settings, contact_phone_2: e.target.value } } as any))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">WhatsApp Business</Label>
                    <Input placeholder="ex: +213 550 123 456" className="rounded-xl bg-slate-50 border-slate-200 text-xs"
                      value={(formData as any).import_settings?.contact_whatsapp || ''}
                      onChange={e => setFormData(prev => ({ ...prev, import_settings: { ...(prev as any).import_settings, contact_whatsapp: e.target.value } } as any))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">Email</Label>
                    <Input placeholder="ex: contact@showroom.dz" className="rounded-xl bg-slate-50 border-slate-200 text-xs"
                      value={(formData as any).import_settings?.contact_email || ''}
                      onChange={e => setFormData(prev => ({ ...prev, import_settings: { ...(prev as any).import_settings, contact_email: e.target.value } } as any))} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-semibold text-slate-600">Adresse physique</Label>
                    <Input placeholder="ex: 12 Rue des Frères Bouadou, Bir Mourad Raïs, Alger" className="rounded-xl bg-slate-50 border-slate-200 text-xs"
                      value={(formData as any).import_settings?.contact_address || ''}
                      onChange={e => setFormData(prev => ({ ...prev, import_settings: { ...(prev as any).import_settings, contact_address: e.target.value } } as any))} />
                  </div>
                </CardContent>
              </Card>

              {/* SECTION 3: Payment Methods */}
              <Card className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100 p-5">
                  <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-emerald-500" />Moyens de Paiement
                  </CardTitle>
                  <CardDescription className="text-[11px] text-slate-500">Activez les moyens de paiement acceptés — l'IA les mentionnera automatiquement.</CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  {/* Cash */}
                  <div className="flex items-center justify-between p-3 border border-slate-150 rounded-xl">
                    <div>
                      <Label className="text-xs font-bold text-slate-700">💵 Paiement en Espèces (Cash)</Label>
                      <p className="text-[10px] text-slate-400 mt-0.5">Paiement direct en agence en dinars algériens</p>
                    </div>
                    <Switch
                      checked={(formData as any).import_settings?.payment_cash !== false}
                      onCheckedChange={v => setFormData(prev => ({ ...prev, import_settings: { ...(prev as any).import_settings, payment_cash: v } } as any))}
                    />
                  </div>
                  {/* CCP */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border border-slate-150 rounded-xl">
                      <div>
                        <Label className="text-xs font-bold text-slate-700">🏦 Paiement par CCP (Virement Postal)</Label>
                        <p className="text-[10px] text-slate-400 mt-0.5">Virement via Algérie Poste</p>
                      </div>
                      <Switch
                        checked={(formData as any).import_settings?.payment_ccp !== false}
                        onCheckedChange={v => setFormData(prev => ({ ...prev, import_settings: { ...(prev as any).import_settings, payment_ccp: v } } as any))}
                      />
                    </div>
                    {(formData as any).import_settings?.payment_ccp !== false && (
                      <Input
                        placeholder="ex: Titulaire: Sarl 2S Auto / CCP: 00218765321 / Clé: 89"
                        className="rounded-xl bg-slate-50 border-slate-200 text-xs ml-3"
                        value={(formData as any).import_settings?.payment_ccp_details || ''}
                        onChange={e => setFormData(prev => ({ ...prev, import_settings: { ...(prev as any).import_settings, payment_ccp_details: e.target.value } } as any))}
                      />
                    )}
                  </div>
                  {/* Virement Bancaire */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border border-slate-150 rounded-xl">
                      <div>
                        <Label className="text-xs font-bold text-slate-700">🏛 Virement Bancaire (BNA, CPA, BADR...)</Label>
                        <p className="text-[10px] text-slate-400 mt-0.5">Virement via banque commerciale algérienne</p>
                      </div>
                      <Switch
                        checked={(formData as any).import_settings?.payment_virement === true}
                        onCheckedChange={v => setFormData(prev => ({ ...prev, import_settings: { ...(prev as any).import_settings, payment_virement: v } } as any))}
                      />
                    </div>
                    {(formData as any).import_settings?.payment_virement === true && (
                      <Input
                        placeholder="ex: RIB: 0021876532 / Banque: CPA, Agence Bab Ezzouar"
                        className="rounded-xl bg-slate-50 border-slate-200 text-xs ml-3"
                        value={(formData as any).import_settings?.payment_virement_details || ''}
                        onChange={e => setFormData(prev => ({ ...prev, import_settings: { ...(prev as any).import_settings, payment_virement_details: e.target.value } } as any))}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* SECTION 4: Value Propositions */}
              <Card className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100 p-5">
                  <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-violet-500" />Avantages &amp; Propositions de Valeur
                  </CardTitle>
                  <CardDescription className="text-[11px] text-slate-500">L'IA mettra en avant ces avantages lors des conversations commerciales.</CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-3">
                  {[
                    { key: 'vp_free_insurance', emoji: '🛡', label: 'Assurance gratuite incluse', desc: "L'assurance du véhicule est offerte lors de l'achat" },
                    { key: 'vp_warranty', emoji: '✅', label: 'Garantie constructeur', desc: 'Garantie officielle du fabricant incluse' },
                    { key: 'vp_certificate_conformity', emoji: '📋', label: 'Certificat de conformité inclus', desc: 'Document officiel de conformité fourni' },
                    { key: 'vp_free_delivery', emoji: '🚚', label: 'Livraison gratuite à domicile', desc: 'Le véhicule livré à votre adresse' },
                    { key: 'vp_test_drive', emoji: '🔑', label: 'Essai routier disponible', desc: 'Test drive sur rendez-vous au showroom' },
                    { key: 'vp_custom_order', emoji: '🎯', label: 'Commande sur mesure possible', desc: 'Le client peut choisir couleur, options, specs' },
                  ].map(({ key, emoji, label, desc }) => (
                    <div key={key} className="flex items-center justify-between p-3 border border-slate-150 rounded-xl hover:border-violet-200 transition">
                      <div>
                        <Label className="text-xs font-bold text-slate-700">{emoji} {label}</Label>
                        <p className="text-[10px] text-slate-400 mt-0.5">{desc}</p>
                      </div>
                      <Switch
                        checked={(formData as any).import_settings?.[key] !== false}
                        onCheckedChange={v => setFormData(prev => ({ ...prev, import_settings: { ...(prev as any).import_settings, [key]: v } } as any))}
                      />
                    </div>
                  ))}
                  {/* Financing */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border border-slate-150 rounded-xl hover:border-violet-200 transition">
                      <div>
                        <Label className="text-xs font-bold text-slate-700">🏦 Financement Bancaire disponible</Label>
                        <p className="text-[10px] text-slate-400 mt-0.5">Crédit auto via banques partenaires</p>
                      </div>
                      <Switch
                        checked={(formData as any).import_settings?.vp_financing !== false}
                        onCheckedChange={v => setFormData(prev => ({ ...prev, import_settings: { ...(prev as any).import_settings, vp_financing: v } } as any))}
                      />
                    </div>
                    {(formData as any).import_settings?.vp_financing !== false && (
                      <Input
                        placeholder="ex: CPA, BADR, AGB – à partir de 7.5% sur 60 mois, apport 30%"
                        className="rounded-xl bg-slate-50 border-slate-200 text-xs ml-3"
                        value={(formData as any).import_settings?.vp_financing_details || ''}
                        onChange={e => setFormData(prev => ({ ...prev, import_settings: { ...(prev as any).import_settings, vp_financing_details: e.target.value } } as any))}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* SECTION 5: Dédouanement / Customs */}
              <Card className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100 p-5">
                  <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-amber-500" />Dédouanement &amp; Douanes
                  </CardTitle>
                  <CardDescription className="text-[11px] text-slate-500">Comment l'IA explique le processus de dédouanement aux clients.</CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between p-3 border border-slate-150 rounded-xl">
                    <div>
                      <Label className="text-xs font-bold text-slate-700">🗂 Service transitaire inclus</Label>
                      <p className="text-[10px] text-slate-400 mt-0.5">Nos transitaires gèrent toutes les formalités douanières</p>
                    </div>
                    <Switch
                      checked={(formData as any).import_settings?.transitaire_included !== false}
                      onCheckedChange={v => setFormData(prev => ({ ...prev, import_settings: { ...(prev as any).import_settings, transitaire_included: v } } as any))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">Message de l'IA sur le dédouanement</Label>
                    <Textarea
                      placeholder="ex: Nos transitaires agréés s'occupent de tout le processus. Vous n'avez rien à faire..."
                      className="rounded-xl bg-slate-50 border-slate-200 text-xs min-h-[80px]"
                      value={(formData as any).import_settings?.dedouanement_description || ''}
                      onChange={e => setFormData(prev => ({ ...prev, import_settings: { ...(prev as any).import_settings, dedouanement_description: e.target.value } } as any))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">Contexte des frais douaniers (DTP, TIC, TVA, transitaire)</Label>
                    <Textarea
                      placeholder="ex: Les frais incluent DTP (2%), TIC (variable), TVA 19%, et ~80,000 DZD de frais transitaire..."
                      className="rounded-xl bg-slate-50 border-slate-200 text-xs min-h-[80px]"
                      value={(formData as any).import_settings?.customs_fee_context || ''}
                      onChange={e => setFormData(prev => ({ ...prev, import_settings: { ...(prev as any).import_settings, customs_fee_context: e.target.value } } as any))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* SECTION 6: Container Tracking */}
              <Card className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100 p-5">
                  <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-cyan-500" />Suivi des Conteneurs (Tracking)
                  </CardTitle>
                  <CardDescription className="text-[11px] text-slate-500">L'IA peut consulter votre base de données de suivi de conteneurs en temps réel.</CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between p-3 bg-cyan-50 border border-cyan-200 rounded-xl">
                    <div>
                      <Label className="text-xs font-bold text-slate-700">🚢 Activer le suivi de conteneurs (Container Tracking)</Label>
                      <p className="text-[10px] text-slate-500 mt-0.5">Quand un client demande "où est ma voiture ?" l'IA consultera votre base de données</p>
                    </div>
                    <Switch
                      checked={(formData as any).import_settings?.enable_container_tracking !== false}
                      onCheckedChange={v => setFormData(prev => ({ ...prev, import_settings: { ...(prev as any).import_settings, enable_container_tracking: v } } as any))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">Message d'introduction (quand un client demande le suivi)</Label>
                    <Textarea
                      placeholder="ex: Je peux vérifier le statut de votre véhicule en temps réel. Donnez-moi votre numéro de téléphone ou de conteneur..."
                      className="rounded-xl bg-slate-50 border-slate-200 text-xs min-h-[70px]"
                      value={(formData as any).import_settings?.tracking_intro_message || ''}
                      onChange={e => setFormData(prev => ({ ...prev, import_settings: { ...(prev as any).import_settings, tracking_intro_message: e.target.value } } as any))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* SECTION 7: Custom AI Instructions */}
              <Card className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100 p-5">
                  <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-slate-500" />Instructions IA Personnalisées (Avancé)
                  </CardTitle>
                  <CardDescription className="text-[11px] text-slate-500">Ajoutez des instructions supplémentaires qui seront injectées directement dans le prompt de l'IA.</CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-3">
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-[11px] text-amber-700">
                    <strong>⚠️ Avancé:</strong> Ces instructions seront ajoutées telles quelles au prompt système. Utilisez des instructions claires et concises.
                  </div>
                  <Textarea
                    placeholder="ex: Quand un client demande un devis, demande-lui toujours la marque, le modèle, l'année, et le pays d'origine souhaité. Ne jamais donner un prix final sans consulter..."
                    className="rounded-xl bg-slate-50 border-slate-200 text-xs min-h-[120px] font-mono"
                    value={(formData as any).import_settings?.custom_ai_instructions || ''}
                    onChange={e => setFormData(prev => ({ ...prev, import_settings: { ...(prev as any).import_settings, custom_ai_instructions: e.target.value } } as any))}
                  />
                  <Button
                    onClick={() => saveSettings(formData as any)}
                    disabled={loading}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold py-2.5 shadow-sm transition flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Enregistrer les paramètres Import AI
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            )}

            {/* TAB: META INTEGRATION — One-Click OAuth */}
            <TabsContent value="meta" className="outline-none">
              <MetaIntegrationTab agencyId={agencyId} initialData={metaIntegration} />
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
