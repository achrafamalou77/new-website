'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ExtendedConversation } from '@/app/dashboard/inbox/page'
import { Message, mockProfiles } from '@/lib/mock-data'
import { MessageBubble } from './MessageBubble'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { 
  Smile, Mic, Paperclip, Send, ChevronLeft, CheckCircle2, 
  Flame, Sun, Snowflake, Phone, Clock,
  MoreVertical, UserPlus, FileText, Bot, User, X, Lock, Check
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
}

export function ChatPanel({
  conversation,
  messages,
  onBack,
  onUpdateConversation,
  onSendMessage,
  recentConversations,
  onSelectRecent
}: ChatPanelProps) {
  
  const [inputValue, setInputValue] = useState('')
  const [showOptionsMenu, setShowOptionsMenu] = useState(false)
  const [showAssignMenu, setShowAssignMenu] = useState(false)
  
  // Dynamic Send Mode: 'reply' | 'note'
  const [sendMode, setSendMode] = useState<'reply' | 'note'>('reply')
  
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [bookingForm, setBookingForm] = useState({
    tripId: 'trip-1',
    clientName: conversation?.customer_name || 'Achraf Benali',
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
        clientName: conversation.customer_name || 'Guest'
      }))
    }
  }, [conversation])

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

  // Confirm paid booking reservation handler
  const handleConfirmBooking = () => {
    onUpdateConversation(conversation?.id || '', { lead_score: 'COLD' }) // Booked leads mark as finished/cold
    onSendMessage(`🎉 BOOKING CONFIRMED: 7-Day Istanbul package departs for ${bookingForm.clientName} (${bookingForm.adults} Adults, ${bookingForm.children} Children). Total paid: ${bookingForm.price.toLocaleString()} DZD!`)
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
  const quickReplies = [
    { label: '👋 Welcome message', text: 'Marhaban bikoum! Welcome to our agency, how can we assist you today?' },
    { label: '💰 Pricing info', text: 'Here are our standard packages: Turkey starts from 120,000 DZD, and Tunisia from 65,000 DZD.' },
    { label: '📅 Available dates', text: 'Our next scheduled departures are every Saturday and Tuesday. Which date suits you best?' },
    { label: '✈️ Itinerary details', text: 'Our packages cover flight bookings, 4/5 star hotels, guided excursions, and visa processing.' }
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

          {/* Mark as Booking Indigo button */}
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

        </div>
      </div>

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
            <p>No messages in this chat yet. Type a template below to begin!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const showDivider = index === 0 || 
              new Date(msg.created_at || 0).getDate() !== new Date(messages[index - 1].created_at || 0).getDate()
            
            const msgDate = new Date(msg.created_at || 0)
            const dateLabel = msgDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' })

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
                  ? "Type in Arabic/Darja or French (WhatsApp)..." 
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

      {/* Premium Booking Creation Modal Overlay */}
      {showBookingModal && (
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className={cn(
            "rounded-2xl border p-6 shadow-2xl max-w-sm w-full space-y-4 animate-in zoom-in-95 duration-150",
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
                <p className="text-[10px] text-slate-405 text-slate-400 font-semibold mt-1">Select trip details and confirm guest registration.</p>
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
                        ? "bg-slate-900/60 border border-white/10 focus:ring-pink-500/20 text-white"
                        : "bg-white/60 border border-slate-200/50 focus:ring-indigo-500/20 text-slate-800"
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
                        ? "bg-slate-900/60 border border-white/10 focus:ring-pink-500/20 text-white"
                        : "bg-white/60 border border-slate-200/50 focus:ring-indigo-500/20 text-slate-800"
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
