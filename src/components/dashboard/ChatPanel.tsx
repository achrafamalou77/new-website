'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { ExtendedConversation } from '@/app/dashboard/inbox/page'
import { Message, mockProfiles, mockBookings, mockTrips } from '@/lib/mock-data'
import { MessageBubble } from './MessageBubble'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { 
  Smile, Mic, Paperclip, Send, ChevronLeft, CheckCircle2, 
  Flame, Sun, Snowflake, Phone, Clock,
  MoreVertical, UserPlus, FileText, Bot, User, X, Lock, Check,
  MapPin, Plane, Calendar, CreditCard, ChevronRight, Info, StickyNote, ShieldAlert, Sparkles, UserCheck
} from 'lucide-react'
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon'
import { MessengerIcon } from '@/components/icons/MessengerIcon'
import { InstagramIcon } from '@/components/icons/InstagramIcon'
import { cn } from '@/lib/utils'

interface ChatPanelProps {
  conversation: ExtendedConversation | null
  messages: Message[]
  onBack?: () => void
  onUpdateConversation: (id: string, updates: Partial<ExtendedConversation>) => void
  onSendMessage: (content: string, options?: { is_internal_note?: boolean; is_voice_note?: boolean; duration?: string; transcript?: string }) => void
  recentConversations: ExtendedConversation[]
  onSelectRecent: (id: string) => void
  businessTypeSlug?: string
}

export function ChatPanel({
  conversation,
  messages,
  onBack,
  onUpdateConversation,
  onSendMessage,
  recentConversations,
  onSelectRecent,
  businessTypeSlug = 'travel'
}: ChatPanelProps) {
  const isShowroom = businessTypeSlug === 'car_showroom'
  const isEcommerce = ['ecommerce', 'online_store', 'store'].includes(businessTypeSlug)
  
  const [inputValue, setInputValue] = useState('')
  const [showOptionsMenu, setShowOptionsMenu] = useState(false)
  const [showAssignMenu, setShowAssignMenu] = useState(false)
  
  // Dynamic Send Mode: 'reply' | 'note'
  const [sendMode, setSendMode] = useState<'reply' | 'note'>('reply')
  
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [bookingForm, setBookingForm] = useState({
    tripId: 'trip-1',
    clientName: conversation?.customer_name || (isShowroom ? 'Client' : 'Achraf Benali'),
    dealType: 'import',
    adults: 2,
    children: 0,
    price: 300000
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Update clientName in form when conversation updates
  useEffect(() => {
    if (conversation) {
      setBookingForm(prev => ({
        ...prev,
        clientName: conversation.customer_name || (isShowroom ? 'Client' : 'Guest')
      }))
    }
  }, [conversation, isShowroom])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Clear states when conversation changes
  useEffect(() => {
    setShowOptionsMenu(false)
    setShowAssignMenu(false)
    setShowEmojiPicker(false)
    setShowBookingModal(false)
    setInputValue('')
    setSendMode('reply')
  }, [conversation])

  const [showProfileSidebar, setShowProfileSidebar] = useState(true)
  const [clientNote, setClientNote] = useState('')
  const [noteSavedStatus, setNoteSavedStatus] = useState(false)

  // Load persistent note from localStorage on change
  useEffect(() => {
    if (conversation) {
      const saved = localStorage.getItem(`note-${conversation.id}`)
      setClientNote(saved || (isShowroom
        ? 'Wants details on imported Tucson. Interested in financing options.'
        : isEcommerce
        ? 'Interested in product availability, delivery options, and payment on delivery.'
        : 'Interested in Turkey packages. Prefers 5-star hotels and direct flights.'
      ))
      setNoteSavedStatus(false)
    }
  }, [conversation, isShowroom, isEcommerce])

  const handleNoteChange = (val: string) => {
    setClientNote(val)
    if (conversation) {
      localStorage.setItem(`note-${conversation.id}`, val)
      setNoteSavedStatus(true)
      setTimeout(() => setNoteSavedStatus(false), 1500)
    }
  }

  const aiSuggestions = useMemo(() => {
    if (!conversation) return []
    const name = conversation.customer_name || 'Client'

    if (isEcommerce) {
      return [
        { label: 'Stock check', text: 'Which size, color, and quantity do you want? I can confirm availability and delivery options for you.' },
        { label: 'Delivery details', text: 'We can help with delivery. Please send your city, address, and phone number so we can prepare the order.' },
        { label: 'Payment options', text: 'We can confirm payment options and total price after checking the exact product and delivery location.' }
      ]
    }
    
    if (conversation.id === 'conv-1' || name.toLowerCase().includes('achraf')) {
      return [
        { label: '✈️ Next flights', text: 'Our next flights depart next Monday and Thursday from Algiers. Which departure date works better for your schedule?' },
        { label: '🏔️ Bursa excursion', text: 'Would you be interested in adding a day trip to Bursa to ride the Mount Uludağ cable car? It is highly recommended for summer!' },
        { label: '📸 Request Passport', text: 'Could you please share your passport copy so we can verify name spelling for the flight reservations?' }
      ]
    }
    
    if (conversation.id === 'conv-2' || name.toLowerCase().includes('sarah')) {
      return [
        { label: '🕌 Umrah documents', text: 'For the Umrah visa, we require your passport (valid for at least 6 months), a certificate of vaccination, and two passport photos with a white background.' },
        { label: '⚡ Urgent Saudi e-visa', text: 'We can process the urgent Saudi e-visa within 7 days. Would you like us to submit your request today?' },
        { label: '🏨 5★ Hotel near Haram', text: 'We have excellent 5-star hotel options located just 200m from the Haram. Would you like me to send the hotel names and photos?' }
      ]
    }

    if (conversation.id === 'conv-3' || name.toLowerCase().includes('mourad')) {
      return [
        { label: '🏨 Sousse Hotel Link', text: 'Here is the booking confirmation link for Sousse Palace Hotel. You can review the family suite photos here.' },
        { label: '👦 Kids 50% discount', text: 'For kids under 12, we offer a 50% discount on the package price. Your total family price will adjust accordingly.' },
        { label: '🍛 Half vs All-inclusive', text: 'The Sousse package includes half-board. Would you prefer to upgrade to all-inclusive for an extra 12,000 DZD?' }
      ]
    }

    // Default suggestions
    return [
      { label: '📅 Request dates', text: 'When are you planning to travel, and what is your preferred duration for the trip?' },
      { label: '📄 Summer packages PDF', text: 'Here is our complete catalog of summer group departures. Let me know which destination interests you!' },
      { label: '👥 Ask passenger count', text: 'How many adults and children will be traveling in your group?' }
    ]
  }, [conversation, isEcommerce])

  // Send textual message handler
  const handleSend = () => {
    if (!inputValue.trim()) return
    
    if (sendMode === 'note') {
      onSendMessage(inputValue.trim(), { is_internal_note: true })
      setSendMode('reply') // Reset back to customer reply mode
    } else {
      onSendMessage(inputValue.trim())
    }
    
    setInputValue('')
    setShowEmojiPicker(false)
  }

  // Handle file upload attachments
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    onSendMessage(`📎 Attachment: ${file.name} (${(file.size / 1024).toFixed(1)} KB) successfully uploaded.`)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleConfirmBooking = () => {
    onUpdateConversation(conversation?.id || '', { lead_score: 'COLD' })
    if (isShowroom) {
      onSendMessage(`DEAL LOGGED: ${bookingForm.clientName} is interested in ${bookingForm.tripId}. Type: ${bookingForm.dealType}. Quantity: ${bookingForm.adults}. Deposit requested: ${(bookingForm.price * 0.3).toLocaleString()} DZD. Estimated total: ${(bookingForm.price * bookingForm.adults).toLocaleString()} DZD.`)
    } else {
      onSendMessage(`BOOKING CONFIRMED: 7-Day Istanbul package departs for ${bookingForm.clientName} (${bookingForm.adults} Adults, ${bookingForm.children} Children). Total paid: ${bookingForm.price.toLocaleString()} DZD!`)
    }
    setShowBookingModal(false)
  }

  // Handle enter key press on input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Quick template reply chips
  const quickReplies = isShowroom
    ? [
        { label: 'Welcome message', text: 'Salam! Welcome to our showroom. Which vehicle are you interested in: stock, import on order, or rental?' },
        { label: 'Price info', text: 'Tell me the model, year, engine, and budget you want, and I will confirm availability and price.' },
        { label: 'Import timing', text: 'For import on order, delivery depends on supplier availability, shipping, and customs clearance. I can prepare an estimate for you.' },
        { label: 'Documents', text: 'To open a vehicle file, we need your full name, phone number, ID/passport details, preferred model, color, and deposit confirmation.' }
      ]
    : isEcommerce
    ? [
        { label: 'Welcome message', text: 'Salam! Welcome to our store. Which product, size, color, and quantity are you looking for?' },
        { label: 'Stock check', text: 'Send me the product name or photo plus size/color, and I will confirm availability for you.' },
        { label: 'Delivery info', text: 'We deliver by location. Please share your city and address so we can confirm delivery fee and timing.' },
        { label: 'Order details', text: 'To prepare your order, we need your full name, phone number, city, address, product, size/color, and quantity.' }
      ]
    : [
        { label: 'Welcome message', text: 'Marhaban bikoum! Welcome to our agency, how can we assist you today?' },
        { label: 'Pricing info', text: 'Here are our standard packages: Turkey starts from 120,000 DZD, and Tunisia from 65,000 DZD.' },
        { label: 'Available dates', text: 'Our next scheduled departures are every Saturday and Tuesday. Which date suits you best?' },
        { label: 'Itinerary details', text: 'Our packages cover flight bookings, 4/5 star hotels, guided excursions, and visa processing.' }
      ]

  // Render Platform Icon SVG
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'whatsapp': return <WhatsAppIcon className="h-5 w-5" />
      case 'facebook': return <MessengerIcon className="h-5 w-5" />
      case 'instagram': return <InstagramIcon className="h-5 w-5" />
      default: return <User className="h-5 w-5 text-slate-400" />
    }
  }

  // EMPTY STATE WITH ILLUSTRATION
  if (!conversation) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center p-8 text-slate-500 font-sans text-left select-none animate-in fade-in duration-300 relative">
        <div className="glass-panel rounded-3xl p-8 max-w-lg w-full flex flex-col items-center border-white/35 shadow-xl text-center z-10">
          {/* Elite Vector SVG Support Desk Illustration */}
          <div className="w-64 h-48 mb-6 relative flex items-center justify-center shrink-0">
            <svg className="w-full h-full" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="25" y="30" width="150" height="90" rx="16" fill="white" stroke="#E2E8F0" strokeWidth="2" className="shadow-sm" />
              <rect x="35" y="40" width="130" height="70" rx="8" fill="#F8FAFC" />
              
              {/* Wave Grid Background inside screen */}
              <circle cx="50" cy="55" r="10" fill="#E0F2FE" />
              <path d="M70 52H140" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
              <path d="M70 60H110" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
              
              {/* Simulated Chat Bubbles */}
              <rect x="42" y="80" width="60" height="18" rx="8" fill="#3B82F6" fillOpacity="0.1" />
              <path d="M70 89H92" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.6" />
              
              <rect x="110" y="65" width="48" height="18" rx="8" fill="#10B981" fillOpacity="0.1" />
              <path d="M120 74H148" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.6" />
              
              {/* Visual Analytics Pie */}
              <circle cx="100" cy="120" r="18" fill="white" stroke="#E2E8F0" strokeWidth="2" />
              <circle cx="100" cy="120" r="10" fill="none" stroke="#6366F1" strokeWidth="4" strokeDasharray="40 100" />
              
              {/* Brand Logo Floating circles */}
              <circle cx="20" cy="20" r="12" fill="#25D366" className="animate-bounce" />
              <path d="M16 20C16 17.8 17.8 16 20 16" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              
              <circle cx="180" cy="25" r="10" fill="#0084FF" />
              <circle cx="185" cy="115" r="14" fill="url(#ig-grad)" />
              
              <defs>
                <linearGradient id="ig-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fdf497" />
                  <stop offset="50%" stopColor="#fd5949" />
                  <stop offset="100%" stopColor="#d6249f" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          
          <h2 className="text-sm font-extrabold text-slate-800 tracking-tight">Support Desk Workspace</h2>
          <p className="mt-1.5 text-xs text-slate-400 max-w-xs text-center leading-relaxed">
            Select a customer pipeline thread from the sidebar list to respond, assign, or log private team notes.
          </p>

          {/* Recent Conversations quick access cards */}
          {recentConversations.length > 0 && (
            <div className="mt-8 w-full max-w-md">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3 text-center">
                ⚡ Recent Chats
              </h4>
              <div className="space-y-2">
                {recentConversations.map(rc => (
                  <div 
                    key={rc.id}
                    onClick={() => onSelectRecent(rc.id)}
                    className="flex items-center justify-between p-3.5 glass-card border border-white/20 hover:border-white/40 rounded-2xl cursor-pointer shadow-xs transition active:scale-99"
                  >
                    <div className="flex items-center gap-3 overflow-hidden text-left">
                      <div className="h-8 w-8 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 font-bold text-xs flex items-center justify-center shrink-0">
                        {rc.customer_name?.substring(0, 2).toUpperCase() || 'G'}
                      </div>
                      <div className="overflow-hidden">
                        <h5 className="text-xs font-bold text-slate-700 truncate">{rc.customer_name || rc.customer_phone}</h5>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{rc.lead_summary}</p>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1">
                      {getPlatformIcon(rc.platform || '')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Assigned Agent profile
  const assignee = mockProfiles.find(p => p.id === conversation.assignee_id)

  const isWhatsapp = conversation.platform === 'whatsapp'
  const isInstagram = conversation.platform === 'instagram'
  const isMessenger = conversation.platform === 'facebook'

  return (
    <div className={cn(
      "flex h-full flex-1 flex-col font-sans text-left relative overflow-hidden select-none animate-in fade-in duration-200",
      isInstagram 
        ? "bg-slate-950/30 text-white" 
        : "bg-transparent text-slate-800"
    )}>
      
      {/* Shifting Backglows inside Chat Panel */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className={cn(
          "absolute -top-[10%] -left-[10%] w-[60%] h-[60%] rounded-full blur-[100px] mix-blend-multiply opacity-20 transition-all duration-1000 animate-glow-1",
          isWhatsapp ? "bg-emerald-400" :
          isInstagram ? "bg-purple-600" :
          isMessenger ? "bg-blue-500" :
          "bg-indigo-500"
        )} />
        <div className={cn(
          "absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] rounded-full blur-[100px] mix-blend-multiply opacity-20 transition-all duration-1000 animate-glow-2",
          isWhatsapp ? "bg-teal-400" :
          isInstagram ? "bg-pink-500" :
          isMessenger ? "bg-sky-400" :
          "bg-violet-500"
        )} />
      </div>

      {/* Top Header Panel */}
      <div className={cn(
        "flex h-16 shrink-0 items-center justify-between px-6 z-10 shadow-xs border-b backdrop-blur-lg",
        isInstagram
          ? "bg-slate-900/60 border-white/5"
          : "bg-white/40 border-slate-200/40"
      )}>
        <div className="flex items-center gap-4 overflow-hidden">
          {/* Back button for mobile view */}
          <Button variant="ghost" size="icon" className="lg:hidden shrink-0 -ml-2 rounded-xl" onClick={onBack}>
            <ChevronLeft className="h-5 w-5 text-slate-600" />
          </Button>

          {/* Platform SVG Avatar container */}
          <div className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl relative border transition shadow-sm",
            isInstagram 
              ? "bg-slate-800/60 border-white/10" 
              : isWhatsapp 
              ? "bg-emerald-50 border-emerald-200/40" 
              : "bg-blue-50 border-blue-200/40"
          )}>
            {getPlatformIcon(conversation.platform || '')}
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
          </div>

          <div className="overflow-hidden text-left">
            <div className="flex items-center gap-2">
              <h2 className={cn(
                "text-xs font-black truncate leading-tight",
                isInstagram ? "text-white" : "text-slate-800"
              )}>
                {conversation.customer_name || conversation.customer_phone}
              </h2>
            </div>
            
            <div className={cn(
              "flex items-center gap-1.5 text-[10px] font-bold mt-1",
              isInstagram ? "text-slate-450" : "text-slate-500"
            )}>
              <Phone className="h-3 w-3 text-slate-400 shrink-0" />
              <span className="truncate">{conversation.customer_phone}</span>
            </div>
          </div>

          {/* Lead score badge */}
          <div className="ml-3 hidden sm:block">
            {conversation.lead_score === 'HOT' && (
              <span className={cn(
                "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest animate-pulse shadow-xs border",
                isInstagram 
                  ? "bg-red-500/10 border-red-500/30 text-red-400" 
                  : "bg-red-50 border-red-200 text-red-650"
              )}>
                <Flame className="h-3 w-3 text-red-500 fill-red-105" /> HOT LEAD
              </span>
            )}
            {conversation.lead_score === 'WARM' && (
              <span className={cn(
                "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest shadow-xs border",
                isInstagram 
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400" 
                  : "bg-amber-50 border-amber-200 text-amber-650"
              )}>
                <Sun className="h-3 w-3 text-amber-500" /> WARM LEAD
              </span>
            )}
            {conversation.lead_score === 'COLD' && (
              <span className={cn(
                "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest shadow-xs border",
                isInstagram 
                  ? "bg-slate-800/60 border-white/5 text-slate-400" 
                  : "bg-slate-100 border-slate-200 text-slate-550"
              )}>
                <Snowflake className="h-3 w-3 text-slate-400" /> COLD LEAD
              </span>
            )}
          </div>
        </div>

        {/* AI & Handoff Controls + dropdown menus */}
        <div className="flex items-center gap-3">
          
          {/* Custom pulsing AI Handoff Toggle Indicator */}
          <div className={cn(
            "flex items-center gap-2 border px-3 py-1.5 rounded-xl transition duration-300",
            isInstagram 
              ? "bg-slate-900/40 border-white/5" 
              : "bg-slate-50/80 border-slate-200/80"
          )}>
            <div className="relative flex h-2 w-2 shrink-0">
              {conversation.ai_status && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span className={cn("relative inline-flex rounded-full h-2 w-2", conversation.ai_status ? "bg-emerald-500" : "bg-slate-400")} />
            </div>
            
            <span className={cn(
              "text-[9px] font-black uppercase tracking-widest flex items-center gap-1 select-none",
              isInstagram ? "text-slate-400" : "text-slate-500"
            )}>
              {conversation.ai_status ? 'AI Active' : 'AI Paused'}
            </span>
            <Switch 
              checked={!!conversation.ai_status}
              onCheckedChange={(checked) => onUpdateConversation(conversation.id, { ai_status: checked })}
            />
          </div>

          {/* Quick Dropdown Dispatch Agent Selector */}
          <div className="relative">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                setShowAssignMenu(!showAssignMenu)
                setShowOptionsMenu(false)
              }}
              className={cn(
                "gap-1.5 rounded-xl text-xs font-semibold shadow-xs flex items-center border cursor-pointer",
                isInstagram
                  ? "bg-slate-900/60 border-white/10 hover:bg-slate-800 text-slate-200"
                  : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
              )}
            >
              {assignee ? (
                <>
                  <div className={cn(
                    "h-4 w-4 rounded-full font-bold text-[8px] flex items-center justify-center",
                    isInstagram ? "bg-purple-500/20 text-purple-300" : "bg-blue-105 text-blue-600"
                  )}>
                    {assignee.full_name.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="truncate max-w-[80px]">{assignee.full_name.split(' ')[0]}</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Assign</span>
                </>
              )}
            </Button>

            {/* Float Assigning list */}
            {showAssignMenu && (
              <div className={cn(
                "absolute right-0 mt-2 rounded-2xl p-2 shadow-lg w-44 z-40 text-left flex flex-col gap-1 animate-in fade-in duration-200 border",
                isInstagram
                  ? "glass-panel-dark border-white/10"
                  : "glass-panel border-white/20"
              )}>
                <div className={cn(
                  "px-2.5 py-1 text-[9px] font-black uppercase tracking-wider border-b",
                  isInstagram ? "text-slate-400 border-white/5" : "text-slate-500 border-slate-200/55"
                )}>
                  Assign Agent
                </div>
                <button 
                  onClick={() => {
                    onUpdateConversation(conversation.id, { assignee_id: null })
                    setShowAssignMenu(false)
                  }}
                  className={cn(
                    "flex items-center justify-between px-2.5 py-1.5 text-xs rounded-xl text-left font-bold transition-colors cursor-pointer",
                    isInstagram
                      ? "text-slate-400 hover:bg-white/5"
                      : "text-slate-500 hover:bg-slate-50"
                  )}
                >
                  <span>Unassigned</span>
                  {!conversation.assignee_id && <Check className="h-3.5 w-3.5 text-blue-500" />}
                </button>
                {mockProfiles.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => {
                      onUpdateConversation(conversation.id, { assignee_id: p.id })
                      setShowAssignMenu(false)
                    }}
                    className={cn(
                      "flex items-center justify-between px-2.5 py-1.5 text-xs rounded-xl text-left font-bold transition-colors cursor-pointer",
                      isInstagram
                        ? "text-slate-200 hover:bg-white/5"
                        : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <span className="truncate">👤 {p.full_name}</span>
                    {conversation.assignee_id === p.id && <Check className="h-3.5 w-3.5 text-blue-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mark as Booking button */}
          <Button 
            size="sm" 
            onClick={() => setShowBookingModal(true)}
            className={cn(
              "text-white gap-1.5 rounded-xl text-xs font-semibold shadow-xs transition hidden sm:flex border border-transparent cursor-pointer duration-300",
              isWhatsapp 
                ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20" 
                : isInstagram 
                ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-pink-500/20" 
                : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20"
            )}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Mark Booking</span>
          </Button>

          {/* "..." Options trigger */}
          <div className="relative">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => {
                setShowOptionsMenu(!showOptionsMenu)
                setShowAssignMenu(false)
              }}
              className={cn(
                "h-9 w-9 rounded-xl border shadow-xs transition-colors cursor-pointer",
                isInstagram
                  ? "bg-slate-900/60 border-white/10 hover:bg-slate-800 text-white"
                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
              )}
            >
              <MoreVertical className="h-4.5 w-4.5" />
            </Button>

            {/* Options Dropdown Menu */}
            {showOptionsMenu && (
              <div className={cn(
                "absolute right-0 mt-2 rounded-2xl p-2.5 shadow-xl w-48 z-40 text-left flex flex-col gap-1.5 animate-in fade-in duration-150 border",
                isInstagram ? "glass-panel-dark border-white/10" : "glass-panel border-white/20"
              )}>
                <div className={cn(
                  "px-3 text-[9px] font-black uppercase tracking-widest mb-1",
                  isInstagram ? "text-slate-450" : "text-slate-500"
                )}>
                  Change Score
                </div>
                <div className="grid grid-cols-3 gap-1 px-1.5">
                  <button 
                    onClick={() => {
                      onUpdateConversation(conversation.id, { lead_score: 'HOT' })
                      setShowOptionsMenu(false)
                    }}
                    className="p-1 rounded bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 text-[9px] font-bold text-center cursor-pointer"
                  >
                    HOT
                  </button>
                  <button 
                    onClick={() => {
                      onUpdateConversation(conversation.id, { lead_score: 'WARM' })
                      setShowOptionsMenu(false)
                    }}
                    className="p-1 rounded bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-400 text-[9px] font-bold text-center cursor-pointer"
                  >
                    WARM
                  </button>
                  <button 
                    onClick={() => {
                      onUpdateConversation(conversation.id, { lead_score: 'COLD' })
                      setShowOptionsMenu(false)
                    }}
                    className="p-1 rounded bg-slate-500/10 border border-slate-500/20 hover:bg-slate-500/20 text-slate-400 text-[9px] font-bold text-center cursor-pointer"
                  >
                    COLD
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Collapsible Profile Sidebar Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowProfileSidebar(!showProfileSidebar)}
            className={cn(
              "h-9 w-9 rounded-xl border shadow-xs transition-all cursor-pointer hidden md:flex items-center justify-center shrink-0",
              showProfileSidebar 
                ? isInstagram ? "bg-purple-500/20 border-purple-500/30 text-purple-300" : "bg-indigo-50 border-indigo-200 text-indigo-600"
                : isInstagram ? "bg-slate-900/60 border-white/10 text-slate-400 hover:text-white" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
            )}
            title="Toggle Customer Profile"
          >
            <Info className="h-4.5 w-4.5" />
          </Button>

        </div>
      </div>

      {/* Main Layout containing Left Chat Column and Right Collapsible Sidebar */}
      <div className="flex-1 flex overflow-hidden relative z-10 w-full">
        
        {/* Left Column: Chat feed and bottom input pane */}
        <div className="flex-1 flex flex-col h-full min-w-0 relative">

          {/* Dynamic Messages History Feed area */}
          <div className={cn(
            "flex-1 overflow-y-auto p-6 space-y-4 relative z-10 transition-colors duration-500",
            isWhatsapp 
              ? "whatsapp-pattern glass-scrollbar" 
              : isInstagram 
              ? "bg-slate-950/20 glass-scrollbar-dark" 
              : "bg-slate-50/10 glass-scrollbar"
          )}>
            
            {/* Live chat started divider */}
            <div className="text-center my-4">
              <span className={cn(
                "text-[9px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full border shadow-xs flex items-center gap-1 w-max mx-auto select-none",
                isInstagram
                  ? "bg-slate-900/60 border-white/5 text-slate-400"
                  : "bg-white/60 border-slate-200/40 text-slate-500"
              )}>
                <Clock className="h-3 w-3" /> Live Chat Session Started
              </span>
            </div>

            {/* Messages */}
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center p-8 text-center text-slate-400 text-xs">
                <p>No messages in this chat yet. Type a reply below to begin!</p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const showDivider = index === 0 || 
                  new Date(msg.created_at || 0).getDate() !== new Date(messages[index - 1].created_at || 0).getDate()
                
                const getSmartDateLabel = (dateStr: string) => {
                  const date = new Date(dateStr)
                  const today = new Date()
                  const yesterday = new Date()
                  yesterday.setDate(today.getDate() - 1)

                  if (date.toDateString() === today.toDateString()) {
                    return 'Today'
                  } else if (date.toDateString() === yesterday.toDateString()) {
                    return 'Yesterday'
                  } else {
                    return date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' })
                  }
                }
                
                const dateLabel = getSmartDateLabel(msg.created_at || '')

                return (
                  <div key={msg.id} className="space-y-4">
                    {showDivider && (
                      <div className="text-center my-4 shrink-0">
                        <span className={cn(
                          "text-[9px] font-bold px-3.5 py-1 rounded-full border",
                          isInstagram
                            ? "bg-slate-900/60 border-white/5 text-slate-400"
                            : "bg-white/60 border-slate-200/40 text-slate-500"
                        )}>
                          {dateLabel}
                        </span>
                      </div>
                    )}
                    
                    <MessageBubble 
                      message={msg} 
                      platform={conversation.platform || ''} 
                    />
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* BOTTOM CONTROL PANE */}
          <div className={cn(
            "shrink-0 p-4 space-y-3 z-10 shadow-lg border-t backdrop-blur-lg",
            isInstagram
              ? "bg-slate-900/60 border-white/5"
              : "bg-white/40 border-slate-200/40"
          )}>
            
            {/* Quick replies templates scroll bar */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide select-none">
              {quickReplies.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputValue(chip.text)}
                  className={cn(
                    "px-3 py-1.5 text-[10px] font-bold border rounded-xl whitespace-nowrap transition-all shadow-xs active:scale-97 shrink-0 cursor-pointer",
                    isInstagram
                      ? "bg-slate-800/40 hover:bg-slate-800/80 border-white/10 text-slate-300"
                      : "bg-white/60 hover:bg-white/95 border-slate-200/50 text-slate-600"
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Smart AI Suggestions Bar */}
            {aiSuggestions.length > 0 && (
              <div className="flex items-center gap-2 select-none py-0.5 overflow-hidden">
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-wider shrink-0 flex items-center gap-1",
                  isInstagram ? "text-pink-400" : "text-indigo-650"
                )}>
                  <Bot className="h-3.5 w-3.5 text-indigo-500 shrink-0 animate-pulse" /> AI Suggestions:
                </span>
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide flex-1">
                  {aiSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInputValue(suggestion.text)}
                      className={cn(
                        "px-2.5 py-1 text-[9px] font-bold border rounded-lg whitespace-nowrap transition-all active:scale-97 shrink-0 cursor-pointer flex items-center gap-1",
                        isInstagram
                          ? "bg-purple-950/40 hover:bg-purple-900/50 border-purple-500/20 text-purple-300"
                          : "bg-indigo-50/50 hover:bg-indigo-100/80 border-indigo-200/60 text-indigo-700"
                      )}
                    >
                      <span>✨</span>
                      <span>{suggestion.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Mode Switcher toolbar ("Reply" vs "Private Note") */}
            <div className={cn(
              "flex items-center gap-1.5 p-1 rounded-xl w-max border",
              isInstagram
                ? "bg-slate-950/40 border-white/5"
                : "bg-slate-100/60 border-slate-200/30"
            )}>
              <button
                onClick={() => setSendMode('reply')}
                className={cn(
                  "px-3 py-1 text-[10px] font-black rounded-lg transition uppercase tracking-wider flex items-center gap-1 cursor-pointer",
                  sendMode === 'reply' 
                    ? isInstagram
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/20 shadow-xs"
                      : "bg-white text-indigo-600 shadow-xs" 
                    : isInstagram
                    ? "text-slate-400 hover:text-slate-300"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                <User className="h-3 w-3" /> Reply Client
              </button>
              <button
                onClick={() => setSendMode('note')}
                className={cn(
                  "px-3 py-1 text-[10px] font-black rounded-lg transition uppercase tracking-wider flex items-center gap-1 cursor-pointer",
                  sendMode === 'note' 
                    ? "bg-amber-500/10 text-amber-400 shadow-xs border border-amber-500/20" 
                    : isInstagram
                    ? "text-slate-400 hover:text-slate-300"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                <Lock className="h-3 w-3" /> Private Note
              </button>
            </div>

            {/* Input box editor controls */}
            <div className="relative">
              {/* Emojis picker */}
              {showEmojiPicker && (
                <div className={cn(
                  "absolute bottom-14 left-0 p-2 rounded-2xl shadow-xl flex gap-1.5 z-40 animate-in fade-in slide-in-from-bottom-2 duration-155 border",
                  isInstagram ? "glass-panel-dark border-white/10" : "glass-panel border-white/20"
                )}>
                  {['😊', '👍', '❤️', '👋', '✈️', '📅', '📍', '💰'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => {
                        setInputValue(prev => prev + emoji)
                        setShowEmojiPicker(false)
                      }}
                      className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center text-sm transition cursor-pointer",
                        isInstagram ? "hover:bg-white/10 text-white" : "hover:bg-slate-100 text-slate-750"
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* Hidden File input controller */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*,application/pdf"
              />

              <div className="flex items-center gap-2.5">
                {/* Emojis Smiles button */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={cn(
                    "h-10 w-10 shrink-0 rounded-xl border transition cursor-pointer",
                    showEmojiPicker 
                      ? isInstagram 
                        ? 'bg-purple-500/20 border-purple-500/35 text-purple-300' 
                        : 'bg-indigo-50 border-indigo-200 text-indigo-600' 
                      : isInstagram 
                      ? 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white' 
                      : 'bg-slate-50 border-slate-200/40 text-slate-400 hover:text-slate-600'
                  )}
                >
                  <Smile className="h-5 w-5" />
                </Button>

                {/* Unified Input Bar (Styling adapts dynamically based on Reply vs Note mode) */}
                <input 
                  className={cn(
                    "flex-1 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 transition border placeholder:text-slate-400 font-medium",
                    sendMode === 'note'
                      ? isInstagram
                        ? "bg-amber-500/5 border-amber-500/30 focus:bg-amber-500/10 focus:ring-amber-500/30 text-amber-250 placeholder:text-amber-500/45"
                        : "bg-amber-50/70 border-amber-300 focus:bg-amber-50 focus:ring-amber-500/20 text-amber-900"
                      : isInstagram
                      ? "glass-input-dark"
                      : "glass-input"
                  )}
                  placeholder={
                    sendMode === 'note'
                      ? "🔒 Write a yellow private note for the staff team..."
                      : conversation.platform === 'whatsapp' 
                      ? isEcommerce
                        ? "Reply about products, sizes, delivery, or orders..."
                        : "Type in Arabic/Darja or French (WhatsApp)..."
                      : "Type a reply..."
                  }
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                />

                {/* Attach file paperclip button */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "h-10 w-10 shrink-0 border transition cursor-pointer rounded-xl",
                    isInstagram
                      ? "bg-slate-900/60 border-white/10 text-slate-400 hover:text-white"
                      : "bg-slate-50 border-slate-200/40 text-slate-400 hover:text-slate-600"
                  )}
                >
                  <Paperclip className="h-5 w-5" />
                </Button>

                {/* Send or Voice Note button */}
                {inputValue.trim() ? (
                  <Button 
                    size="icon" 
                    onClick={handleSend}
                    className={cn(
                      "h-10 w-10 shrink-0 rounded-xl text-white shadow-sm transition active:scale-95 border border-transparent cursor-pointer",
                      sendMode === 'note'
                        ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20"
                        : isWhatsapp
                        ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                        : isInstagram
                        ? "bg-gradient-to-tr from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-pink-500/20"
                        : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20"
                    )}
                  >
                    <Send className="h-4.5 w-4.5 ml-0.5" />
                  </Button>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => {
                      // Simulate recording voice note
                      const voiceMsg = conversation.platform === 'whatsapp' 
                        ? 'Voice Note (0:42) - "Salam khouya, choufli les prix ta3 Turkey stp w ch7al b9aw places."'
                        : conversation.platform === 'instagram'
                        ? 'Voice Note (0:15) - "Hi, could you send me the itinerary of Sahara oasis getaway?"'
                        : 'Voice Note (0:30) - "Hello, when is the next departure to Tunisia?"'
                      onSendMessage(voiceMsg, { is_voice_note: true })
                    }}
                    className={cn(
                      "h-10 w-10 shrink-0 border transition active:scale-95 cursor-pointer rounded-xl",
                      isInstagram
                        ? "bg-slate-900/60 border-white/10 text-slate-400 hover:text-white"
                        : "bg-slate-50 border-slate-200/40 text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <Mic className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Collapsible Customer Profile Sidebar */}
        {showProfileSidebar && (
          <div className={cn(
            "w-[320px] shrink-0 border-l flex flex-col h-full animate-in slide-in-from-right duration-200 hidden md:flex",
            isInstagram 
              ? "bg-slate-950/60 border-white/5 text-white" 
              : "bg-white/80 border-slate-200/50 text-slate-800 backdrop-blur-md"
          )}>
            {/* Header */}
            <div className={cn(
              "p-4 border-b flex items-center justify-between shrink-0",
              isInstagram ? "border-white/5" : "border-slate-200/50"
            )}>
              <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-indigo-500" /> {isEcommerce ? 'Customer Store Profile' : 'Customer Travel Profile'}
              </span>
              <button 
                onClick={() => setShowProfileSidebar(false)}
                className="p-1 rounded-lg hover:bg-slate-500/10 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>

            {/* Scrollable Details */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 glass-scrollbar">
              {/* Profile Card */}
              <div className="flex flex-col items-center text-center p-4 rounded-2xl border bg-slate-500/5 border-slate-500/10 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2">
                  {conversation.platform === 'whatsapp' && <WhatsAppIcon className="h-4 w-4" />}
                  {conversation.platform === 'instagram' && <InstagramIcon className="h-4 w-4" />}
                  {conversation.platform === 'facebook' && <MessengerIcon className="h-4 w-4" />}
                </div>

                <div className={cn(
                  "h-16 w-16 rounded-2xl font-black text-xl flex items-center justify-center shadow-md border mb-3 uppercase tracking-wider",
                  isInstagram 
                    ? "bg-gradient-to-tr from-purple-600 to-pink-600 border-pink-500/35 text-white" 
                    : "bg-indigo-50 border-indigo-100 text-indigo-650"
                )}>
                  {conversation.customer_name?.substring(0, 2).toUpperCase() || 'G'}
                </div>

                <h3 className="text-xs font-black tracking-tight">{conversation.customer_name || 'Guest Client'}</h3>
                <span className="text-[10px] text-slate-450 font-bold mt-0.5">{conversation.customer_phone}</span>

                {/* Score */}
                <div className="mt-3">
                  {conversation.lead_score === 'HOT' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse">
                      <Flame className="h-3 w-3 fill-red-500" /> HOT Lead
                    </span>
                  )}
                  {conversation.lead_score === 'WARM' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      <Sun className="h-3 w-3" /> WARM Lead
                    </span>
                  )}
                  {conversation.lead_score === 'COLD' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-500/10 text-slate-400 border border-slate-500/20">
                      <Snowflake className="h-3 w-3" /> COLD Lead
                    </span>
                  )}
                </div>
              </div>

              {/* Travel Context Tagging */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-450 flex items-center gap-1">
                  <Plane className="h-3.5 w-3.5 text-indigo-500" /> {isEcommerce ? 'Shopping Preferences' : 'Trip Preferences'}
                </span>
                {isEcommerce && (
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400">Product interest</span>
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold border border-indigo-500/20 bg-indigo-500/5 text-indigo-650 dark:text-indigo-400">Size/color needed</span>
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold border border-purple-500/20 bg-purple-500/5 text-purple-650 dark:text-purple-400">Delivery request</span>
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold border border-amber-500/20 bg-amber-500/5 text-amber-650 dark:text-amber-400">Order intent</span>
                  </div>
                )}
                <div className={cn("flex flex-wrap gap-1.5", isEcommerce && "hidden")}>
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-bold border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400">✈️ Flights Req.</span>
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-bold border border-indigo-500/20 bg-indigo-500/5 text-indigo-650 dark:text-indigo-400">🏨 5★ Hotel</span>
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-bold border border-purple-500/20 bg-purple-500/5 text-purple-650 dark:text-purple-400">🍛 Half Board</span>
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-bold border border-amber-500/20 bg-amber-500/5 text-amber-650 dark:text-amber-400">🕌 Tours Incl.</span>
                </div>
              </div>

              {/* Booking Context */}
              {(() => {
                const booking = mockBookings.find(b => b.conversation_id === conversation.id)
                const trip = booking ? mockTrips.find(t => t.id === booking.trip_id) : null

                return (
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-455 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-indigo-500" /> Active Booking Details
                    </span>

                    {booking ? (
                      <div className="p-3.5 rounded-xl border border-slate-500/10 bg-slate-500/5 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-[11px] font-bold leading-tight">{trip?.title || 'Istanbul & Bursa Summer Tour'}</h4>
                            <span className="text-[9px] text-slate-400 font-semibold">{trip?.duration_days} Days • {trip?.destination}</span>
                          </div>
                          
                          {/* Booking Status Badge */}
                          {booking.status === 'completed' && (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Paid</span>
                          )}
                          {booking.status === 'pending_payment' && (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse">Pending</span>
                          )}
                          {booking.status === 'cancelled' && (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-red-500/10 text-red-500 border border-red-500/20">Cancelled</span>
                          )}
                        </div>

                        {/* Passenger Details */}
                        <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-slate-500/10 pt-2.5">
                          <div>
                            <span className="text-[9px] text-slate-400 block font-semibold">Guests Count</span>
                            <span className="font-bold">{booking.client_manifest?.adults} Adults {booking.client_manifest?.children > 0 && `, ${booking.client_manifest?.children} Kids`}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block font-semibold">Total Price</span>
                            <span className="font-bold text-indigo-650 dark:text-indigo-400">{booking.total_price.toLocaleString()} DZD</span>
                          </div>
                        </div>

                        {/* Balance Remaining status */}
                        {booking.status === 'pending_payment' && (
                          <div className="bg-amber-500/10 border border-amber-500/25 rounded-lg p-2 text-[9px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                            <span>Deposit Paid. Balance: 150,000 DZD pending.</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl border border-dashed border-slate-500/20 bg-slate-500/2 flex flex-col items-center justify-center text-center text-slate-400 py-6">
                        <span className="text-xs">{isEcommerce ? 'No active order yet' : 'No active trips booked yet'}</span>
                        <Button 
                          size="sm" 
                          onClick={() => setShowBookingModal(true)}
                          className="mt-2 text-[10px] font-bold h-7 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 shrink-0 cursor-pointer"
                        >
                          {isEcommerce ? 'Create Order' : 'Book Package'}
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Persistent Client Notes */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-455 flex items-center gap-1">
                    <StickyNote className="h-3.5 w-3.5 text-indigo-500" /> Private Client Notes
                  </span>
                  {noteSavedStatus && (
                    <span className="text-[9px] font-black text-emerald-500 animate-fade-in flex items-center gap-0.5">
                      <Check className="h-3 w-3 stroke-[3]" /> Saved
                    </span>
                  )}
                </div>
                <textarea
                  className={cn(
                    "w-full h-20 rounded-xl p-3 text-xs outline-none focus:ring-2 border placeholder:text-slate-400 resize-none font-medium leading-relaxed transition-all",
                    isInstagram
                      ? "bg-slate-900/60 border-white/10 text-white focus:ring-pink-500/25"
                      : "bg-white/65 border-slate-200/65 text-slate-800 focus:ring-indigo-500/15"
                  )}
                  placeholder="Type internal client notes (autosaves)..."
                  value={clientNote}
                  onChange={(e) => handleNoteChange(e.target.value)}
                />
              </div>

              {/* Quick Document Requests / Actions */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-450 flex items-center gap-1">
                  ⚡ Quick Actions
                </span>
                {isEcommerce && (
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => {
                        setInputValue("Store order summary:\n- Product: please confirm product name/photo\n- Size/color: please confirm\n- Delivery city/address: please confirm\n- Payment: will be confirmed after availability check.")
                      }}
                      className={cn(
                        "flex items-center justify-between p-2.5 rounded-xl border text-left text-[11px] font-bold transition-all active:scale-99 hover:translate-x-0.5 cursor-pointer",
                        isInstagram
                          ? "bg-slate-900/50 hover:bg-slate-900/90 border-white/10"
                          : "bg-white hover:bg-slate-50 border-slate-200"
                      )}
                    >
                      <span>Send Order Summary</span>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-450" />
                    </button>
                    <button
                      onClick={() => {
                        setInputValue("Please send the product photo or name, size/color, quantity, delivery city, and your phone number so we can confirm the order.")
                      }}
                      className={cn(
                        "flex items-center justify-between p-2.5 rounded-xl border text-left text-[11px] font-bold transition-all active:scale-99 hover:translate-x-0.5 cursor-pointer",
                        isInstagram
                          ? "bg-slate-900/50 hover:bg-slate-900/90 border-white/10"
                          : "bg-white hover:bg-slate-50 border-slate-200"
                      )}
                    >
                      <span>Request Product Details</span>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-450" />
                    </button>
                    <button
                      onClick={() => {
                        setInputValue("Here is your secure order payment link: https://saas-store.dz/pay/order?invoice=inv-99283")
                      }}
                      className={cn(
                        "flex items-center justify-between p-2.5 rounded-xl border text-left text-[11px] font-bold transition-all active:scale-99 hover:translate-x-0.5 cursor-pointer",
                        isInstagram
                          ? "bg-slate-900/50 hover:bg-slate-900/90 border-white/10"
                          : "bg-white hover:bg-slate-50 border-slate-200"
                      )}
                    >
                      <span>Send Order Payment Link</span>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-450" />
                    </button>
                  </div>
                )}
                <div className={cn("flex flex-col gap-1.5", isEcommerce && "hidden")}>
                  {/* Send Itinerary PDF */}
                  <button
                    onClick={() => {
                      const booking = mockBookings.find(b => b.conversation_id === conversation.id)
                      const text = isEcommerce
                        ? "Store order summary:\n- Product: please confirm product name/photo\n- Size/color: please confirm\n- Delivery city/address: please confirm\n- Payment: will be confirmed after availability check."
                        : booking?.trip_id === 'trip-2'
                        ? "Umrah VIP Package Itinerary (15 Days):\n- 5-star hotel near Haram in Makkah (10 nights)\n- 5-star hotel in Madinah (5 nights)\n- VIP transport & visa processing included\nPrice: 320,000 DZD per person."
                        : booking?.trip_id === 'trip-3'
                        ? "Tunisia Sousse Beach Itinerary (5 Days):\n- All-inclusive 4-star resort stay\n- Airport transfers included\n- Full day excursion to Tunis & Carthage ruins\nPrice: 65,000 DZD per person."
                        : "Istanbul & Bursa Summer Tour Itinerary (7 Days):\n- Day 1: Arrival & Bosphorus cruise\n- Day 2: Old City tour (Hagia Sophia, Blue Mosque)\n- Day 3: Cable car ride to Mount Uludag, Bursa\n- Day 4: Princess Islands day tour\n- Day 5-6: Free shopping days\n- Day 7: Flight back\nPrice: 150,000 DZD per person."
                      setInputValue(text)
                    }}
                    className={cn(
                      "flex items-center justify-between p-2.5 rounded-xl border text-left text-[11px] font-bold transition-all active:scale-99 hover:translate-x-0.5 cursor-pointer",
                      isInstagram
                        ? "bg-slate-900/50 hover:bg-slate-900/90 border-white/10"
                        : "bg-white hover:bg-slate-50 border-slate-200"
                    )}
                  >
                    <span>📄 Send PDF Itinerary</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-450" />
                  </button>

                  {/* Request Passport */}
                  <button
                    onClick={() => {
                      setInputValue(isEcommerce
                        ? "Please send the product photo or name, size/color, quantity, delivery city, and your phone number so we can confirm the order."
                        : "To confirm your travel booking and submit visa documents, could you please send us a clear photo of the first page of your passport (valid for at least 6 months)? Shoukran!"
                      )
                    }}
                    className={cn(
                      "flex items-center justify-between p-2.5 rounded-xl border text-left text-[11px] font-bold transition-all active:scale-99 hover:translate-x-0.5 cursor-pointer",
                      isInstagram
                        ? "bg-slate-900/50 hover:bg-slate-900/90 border-white/10"
                        : "bg-white hover:bg-slate-50 border-slate-200"
                    )}
                  >
                    <span>📸 Request Passport Copy</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                  </button>

                  {/* Send Deposit payment link */}
                  <button
                    onClick={() => {
                      setInputValue(isEcommerce
                        ? "Here is your secure order payment link: https://saas-store.dz/pay/order?invoice=inv-99283"
                        : "Here is your deposit secure invoice payment link: https://travelagency.dz/pay/deposit?invoice=inv-99283"
                      )
                    }}
                    className={cn(
                      "flex items-center justify-between p-2.5 rounded-xl border text-left text-[11px] font-bold transition-all active:scale-99 hover:translate-x-0.5 cursor-pointer",
                      isInstagram
                        ? "bg-slate-900/50 hover:bg-slate-900/90 border-white/10"
                        : "bg-white hover:bg-slate-50 border-slate-200"
                    )}
                  >
                    <span>🔗 Send Invoice Payment Link</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-450" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Premium Booking Creation Modal Overlay */}
      {showBookingModal && (
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className={cn(
            "rounded-2xl border p-6 shadow-2xl max-w-sm w-full space-y-4 animate-in zoom-in-95 duration-155",
            isInstagram 
              ? "glass-panel-dark border-white/10" 
              : "glass-panel border-white/35"
          )}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className={cn(
                  "text-sm font-bold uppercase tracking-tight",
                  isInstagram ? "text-white" : "text-slate-800"
                )}>Create Trip Booking</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">Select trip details and confirm guest registration.</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-xl -mt-1 -mr-1"
                onClick={() => setShowBookingModal(false)}
              >
                <X className="h-4 w-4 text-slate-400" />
              </Button>
            </div>

            <div className="space-y-3.5">
              {/* Trip Selection dropdown */}
              <div className="space-y-1.5 text-left">
                <label className={cn(
                  "text-[10px] font-bold uppercase tracking-wider",
                  isInstagram ? "text-slate-400" : "text-slate-500"
                )}>Select Trip Itinerary</label>
                <select 
                  value={bookingForm.tripId}
                  onChange={(e) => setBookingForm({ ...bookingForm, tripId: e.target.value })}
                  className={cn(
                    "w-full rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2",
                    isInstagram
                      ? "bg-slate-900/60 border border-white/10 focus:ring-pink-500/20 text-white"
                      : "bg-white/60 border border-slate-200/50 focus:ring-indigo-500/20 text-slate-800"
                  )}
                >
                  <option value="trip-1" className={isInstagram ? "bg-slate-900 text-white" : "bg-white text-slate-800"}>✈️ Istanbul Explorer (7 Days) - 120,000 DZD</option>
                  <option value="trip-2" className={isInstagram ? "bg-slate-900 text-white" : "bg-white text-slate-800"}>✈️ Tunisian Coast Escape (5 Days) - 65,000 DZD</option>
                  <option value="trip-3" className={isInstagram ? "bg-slate-900 text-white" : "bg-white text-slate-800"}>✈️ Sahara Oasis Getaway (3 Days) - 35,000 DZD</option>
                </select>
              </div>

              {/* Guest name input */}
              <div className="space-y-1.5 text-left">
                <label className={cn(
                  "text-[10px] font-bold uppercase tracking-wider",
                  isInstagram ? "text-slate-400" : "text-slate-500"
                )}>Client Primary Name</label>
                <input 
                  type="text" 
                  value={bookingForm.clientName}
                  onChange={(e) => setBookingForm({ ...bookingForm, clientName: e.target.value })}
                  className={cn(
                    "w-full rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2",
                    isInstagram
                      ? "bg-slate-900/60 border border-white/10 focus:ring-pink-500/20 text-white"
                      : "bg-white/60 border border-slate-200/50 focus:ring-indigo-500/20 text-slate-800"
                  )}
                />
              </div>

              {/* Counts */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5 text-left">
                  <label className={cn(
                    "text-[10px] font-bold uppercase tracking-wider",
                    isInstagram ? "text-slate-400" : "text-slate-500"
                  )}>Adults Count</label>
                  <input 
                    type="number" 
                    value={bookingForm.adults}
                    onChange={(e) => setBookingForm({ ...bookingForm, adults: parseInt(e.target.value) || 1 })}
                    className={cn(
                      "w-full rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2",
                      isInstagram
                        ? "bg-slate-900/60 border-white/10 focus:ring-pink-500/20 text-white"
                        : "bg-white/60 border-slate-200/50 focus:ring-indigo-500/20 text-slate-800"
                    )}
                  />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className={cn(
                    "text-[10px] font-bold uppercase tracking-wider",
                    isInstagram ? "text-slate-400" : "text-slate-500"
                  )}>Children Count</label>
                  <input 
                    type="number" 
                    value={bookingForm.children}
                    onChange={(e) => setBookingForm({ ...bookingForm, children: parseInt(e.target.value) || 0 })}
                    className={cn(
                      "w-full rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2",
                      isInstagram
                        ? "bg-slate-900/60 border-white/10 focus:ring-pink-500/20 text-white"
                        : "bg-white/60 border-slate-200/50 focus:ring-indigo-500/20 text-slate-800"
                    )}
                  />
                </div>
              </div>

              {/* Price estimation tag */}
              <div className={cn(
                "p-3 rounded-xl border flex justify-between items-center",
                isInstagram
                  ? "bg-pink-500/10 border-pink-500/20"
                  : "bg-indigo-50 border-indigo-100"
              )}>
                <div className="flex flex-col text-left">
                  <span className={cn(
                    "text-[9px] font-black uppercase tracking-widest",
                    isInstagram ? "text-pink-400" : "text-indigo-400"
                  )}>Total Price Invoice</span>
                  <span className={cn(
                    "text-xs font-black mt-0.5",
                    isInstagram ? "text-pink-300" : "text-indigo-700"
                  )}>{(bookingForm.price * bookingForm.adults + (bookingForm.price * 0.5 * bookingForm.children)).toLocaleString()} DZD</span>
                </div>
                <span className={cn(
                  "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                  isInstagram ? "text-pink-300 bg-pink-500/20" : "text-indigo-500 bg-indigo-100/40"
                )}>Deposit: 50%</span>
              </div>
            </div>

            {/* Confirms buttons */}
            <div className="flex items-center gap-2 pt-2">
              <Button 
                variant="outline" 
                className={cn(
                  "flex-1 rounded-xl text-xs font-semibold cursor-pointer",
                  isInstagram ? "border-white/10 text-slate-350 hover:bg-white/5" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                )}
                onClick={() => setShowBookingModal(false)}
              >
                Cancel
              </Button>
              <Button 
                className={cn(
                  "flex-1 text-white rounded-xl text-xs font-semibold cursor-pointer border border-transparent",
                  isInstagram
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-pink-500/25"
                    : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20"
                )}
                onClick={handleConfirmBooking}
              >
                Confirm Booking
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
