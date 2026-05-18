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
      <div className="flex h-full flex-1 flex-col items-center justify-center bg-[#f4f5f7] p-8 text-slate-500 font-geist text-left select-none animate-in fade-in duration-300">
        
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
                  className="flex items-center justify-between p-3.5 bg-white border border-slate-200/80 hover:border-slate-350 hover:bg-slate-50 rounded-2xl cursor-pointer shadow-xs transition active:scale-99"
                >
                  <div className="flex items-center gap-3 overflow-hidden text-left">
                    <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0">
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
    )
  }

  // Assigned Agent profile
  const assignee = mockProfiles.find(p => p.id === conversation.assignee_id)

  return (
    <div className="flex h-full flex-1 flex-col bg-[#f4f5f7] font-geist text-left relative overflow-hidden select-none animate-in fade-in duration-200">
      
      {/* Top Header Panel */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 z-10 shadow-xs">
        <div className="flex items-center gap-4 overflow-hidden">
          {/* Back button for mobile view */}
          <Button variant="ghost" size="icon" className="lg:hidden shrink-0 -ml-2 rounded-xl" onClick={onBack}>
            <ChevronLeft className="h-5 w-5 text-slate-600" />
          </Button>

          {/* Platform SVG Avatar container */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-200 shadow-xs relative">
            {getPlatformIcon(conversation.platform || '')}
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>

          <div className="overflow-hidden text-left">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-black text-slate-800 truncate leading-tight">
                {conversation.customer_name || conversation.customer_phone}
              </h2>
            </div>
            
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-450 mt-1">
              <Phone className="h-3 w-3 text-slate-400 shrink-0" />
              <span className="truncate">{conversation.customer_phone}</span>
            </div>
          </div>

          {/* Lead score badge */}
          <div className="ml-3 hidden sm:block">
            {conversation.lead_score === 'HOT' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[9px] font-black bg-red-50 text-red-650 border border-red-200 uppercase tracking-widest animate-pulse shadow-xs">
                <Flame className="h-3 w-3 text-red-500 fill-red-100" /> HOT LEAD
              </span>
            )}
            {conversation.lead_score === 'WARM' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[9px] font-black bg-amber-50 text-amber-650 border border-amber-200 uppercase tracking-widest shadow-xs">
                <Sun className="h-3 w-3 text-amber-500" /> WARM LEAD
              </span>
            )}
            {conversation.lead_score === 'COLD' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[9px] font-black bg-slate-100 text-slate-550 border border-slate-200 uppercase tracking-widest shadow-xs">
                <Snowflake className="h-3 w-3 text-slate-400" /> COLD LEAD
              </span>
            )}
          </div>
        </div>

        {/* AI & Handoff Controls + dropdown menus */}
        <div className="flex items-center gap-3">
          
          {/* Custom pulsing AI Handoff Toggle Indicator */}
          <div className="flex items-center gap-2 bg-slate-50/80 border border-slate-200 px-3 py-1.5 rounded-xl transition duration-300">
            <div className="relative flex h-2 w-2 shrink-0">
              {conversation.ai_status && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span className={cn("relative inline-flex rounded-full h-2 w-2", conversation.ai_status ? "bg-emerald-500" : "bg-slate-400")} />
            </div>
            
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1 select-none">
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
              className="bg-white hover:bg-slate-50 text-slate-655 text-slate-600 gap-1.5 rounded-xl text-xs font-semibold shadow-xs flex items-center border border-slate-200"
            >
              {assignee ? (
                <>
                  <div className="h-4 w-4 rounded-full bg-blue-100 text-blue-600 font-bold text-[8px] flex items-center justify-center">
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
              <div className="absolute right-0 mt-2 bg-white border border-slate-200 rounded-2xl p-2 shadow-lg w-44 z-40 text-left flex flex-col gap-1 animate-in fade-in duration-200">
                <div className="px-2.5 py-1 text-[9px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Assign Agent
                </div>
                <button 
                  onClick={() => {
                    onUpdateConversation(conversation.id, { assignee_id: null })
                    setShowAssignMenu(false)
                  }}
                  className="flex items-center justify-between px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-50 rounded-xl text-left font-bold"
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
                    className="flex items-center justify-between px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-xl text-left font-bold"
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
            className="bg-indigo-600 hover:bg-indigo-755 hover:bg-indigo-650 hover:bg-indigo-700 text-white gap-1.5 rounded-xl text-xs font-semibold shadow-xs transition hidden sm:flex"
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
              className="h-9 w-9 rounded-xl border border-slate-200 bg-white shadow-xs"
            >
              <MoreVertical className="h-4.5 w-4.5 text-slate-600" />
            </Button>

            {/* Options Dropdown Menu */}
            {showOptionsMenu && (
              <div className="absolute right-0 mt-2 bg-white border border-slate-200 rounded-2xl p-2.5 shadow-xl w-48 z-40 text-left flex flex-col gap-1.5 animate-in fade-in duration-150">
                <div className="px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Change Score
                </div>
                <div className="grid grid-cols-3 gap-1 px-1.5">
                  <button 
                    onClick={() => {
                      onUpdateConversation(conversation.id, { lead_score: 'HOT' })
                      setShowOptionsMenu(false)
                    }}
                    className="p-1 rounded bg-red-50 hover:bg-red-100 text-red-700 text-[9px] font-bold text-center"
                  >
                    HOT
                  </button>
                  <button 
                    onClick={() => {
                      onUpdateConversation(conversation.id, { lead_score: 'WARM' })
                      setShowOptionsMenu(false)
                    }}
                    className="p-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 text-[9px] font-bold text-center"
                  >
                    WARM
                  </button>
                  <button 
                    onClick={() => {
                      onUpdateConversation(conversation.id, { lead_score: 'COLD' })
                      setShowOptionsMenu(false)
                    }}
                    className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] font-bold text-center"
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
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50/20 space-y-4">
        
        {/* Live chat started divider */}
        <div className="text-center my-4">
          <span className="text-[9px] font-black uppercase tracking-wider bg-slate-200 text-slate-505 text-slate-500 px-3.5 py-1.5 rounded-full border border-slate-200 shadow-xs flex items-center gap-1 w-max mx-auto select-none">
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
                    <span className="text-[9px] font-bold bg-slate-200/60 text-slate-500 px-3.5 py-1 rounded-full">
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
      <div className="shrink-0 bg-white border-t border-slate-200/80 p-4 space-y-3 z-10 shadow-lg">
        
        {/* Quick replies templates scroll bar */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide select-none">
          {quickReplies.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => setInputValue(chip.text)}
              className="px-3 py-1.5 text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200/80 border border-slate-200/60 rounded-xl whitespace-nowrap transition-all shadow-xs active:scale-97 shrink-0"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Mode Switcher toolbar ("Reply" vs "Private Note") */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl w-max border border-slate-200/30">
          <button
            onClick={() => setSendMode('reply')}
            className={cn(
              "px-3 py-1 text-[10px] font-black rounded-lg transition uppercase tracking-wider flex items-center gap-1",
              sendMode === 'reply' 
                ? "bg-white text-blue-650 text-blue-600 shadow-xs" 
                : "text-slate-450 text-slate-500 hover:text-slate-700"
            )}
          >
            <User className="h-3 w-3" /> Reply Client
          </button>
          <button
            onClick={() => setSendMode('note')}
            className={cn(
              "px-3 py-1 text-[10px] font-black rounded-lg transition uppercase tracking-wider flex items-center gap-1",
              sendMode === 'note' 
                ? "bg-amber-100 text-amber-700 shadow-xs border border-amber-200/40" 
                : "text-slate-455 text-slate-500 hover:text-slate-700"
            )}
          >
            <Lock className="h-3 w-3" /> Private Note
          </button>
        </div>

        {/* Input box editor controls */}
        <div className="relative">
          {/* Emojis picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-12 left-0 bg-white border border-slate-200 p-2 rounded-2xl shadow-xl flex gap-1.5 z-40 animate-in fade-in slide-in-from-bottom-2 duration-150">
              {['😊', '👍', '❤️', '👋', '✈️', '📅', '📍', '💰'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => {
                    setInputValue(prev => prev + emoji)
                    setShowEmojiPicker(false)
                  }}
                  className="h-8 w-8 rounded-lg hover:bg-slate-50 flex items-center justify-center text-sm transition"
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
                "h-10 w-10 shrink-0 text-slate-400 hover:text-slate-655 hover:text-slate-600 rounded-xl border border-slate-200/40 transition",
                showEmojiPicker ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-slate-50'
              )}
            >
              <Smile className="h-5 w-5" />
            </Button>

            {/* Unified Input Bar (Styling adapts dynamically based on Reply vs Note mode) */}
            <input 
              className={cn(
                "flex-1 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 transition border placeholder:text-slate-400 font-medium",
                sendMode === 'note'
                  ? "bg-amber-50/70 border-amber-300 focus:bg-amber-50 focus:ring-amber-500/20 text-amber-900"
                  : "bg-slate-100 hover:bg-slate-200/80 focus:bg-white border-transparent focus:ring-indigo-500/20 text-slate-800"
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
              className="h-10 w-10 shrink-0 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/40 transition"
            >
              <Paperclip className="h-5 w-5" />
            </Button>

            {/* Send or Voice Note button */}
            {inputValue.trim() ? (
              <Button 
                size="icon" 
                onClick={handleSend}
                className={cn(
                  "h-10 w-10 shrink-0 rounded-xl text-white shadow-sm transition active:scale-95",
                  sendMode === 'note'
                    ? "bg-amber-500 hover:bg-amber-600"
                    : "bg-indigo-600 hover:bg-indigo-700"
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
                  onSendMessage('Voice Note (0:42) - "Salam khouya, choufli les prix ta3 Turkey stp w ch7al b9aw places."', { 
                    is_voice_note: true 
                  })
                }}
                className="h-10 w-10 shrink-0 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/40 transition active:scale-95"
              >
                <Mic className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

      </div>

      {/* Premium Booking Creation Modal Overlay */}
      {showBookingModal && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xl max-w-sm w-full space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Create Trip Booking</h3>
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
                <label className="text-[10px] font-bold text-slate-505 text-slate-500 uppercase tracking-wider">Select Trip Itinerary</label>
                <select 
                  value={bookingForm.tripId}
                  onChange={(e) => setBookingForm({ ...bookingForm, tripId: e.target.value })}
                  className="w-full bg-slate-100 border-0 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="trip-1">✈️ Istanbul Explorer (7 Days) - 120,000 DZD</option>
                  <option value="trip-2">✈️ Tunisian Coast Escape (5 Days) - 65,000 DZD</option>
                  <option value="trip-3">✈️ Sahara Oasis Getaway (3 Days) - 35,000 DZD</option>
                </select>
              </div>

              {/* Guest name input */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-505 text-slate-500 uppercase tracking-wider">Client Primary Name</label>
                <input 
                  type="text" 
                  value={bookingForm.clientName}
                  onChange={(e) => setBookingForm({ ...bookingForm, clientName: e.target.value })}
                  className="w-full bg-slate-100 border-0 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Counts */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-slate-505 text-slate-500 uppercase tracking-wider">Adults Count</label>
                  <input 
                    type="number" 
                    value={bookingForm.adults}
                    onChange={(e) => setBookingForm({ ...bookingForm, adults: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-100 border-0 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-slate-505 text-slate-500 uppercase tracking-wider">Children Count</label>
                  <input 
                    type="number" 
                    value={bookingForm.children}
                    onChange={(e) => setBookingForm({ ...bookingForm, children: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-100 border-0 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Price estimation tag */}
              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100/50 flex justify-between items-center">
                <div className="flex flex-col text-left">
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Total Price Invoice</span>
                  <span className="text-xs font-black text-indigo-700 mt-0.5">{(bookingForm.price * bookingForm.adults + (bookingForm.price * 0.5 * bookingForm.children)).toLocaleString()} DZD</span>
                </div>
                <span className="text-[9px] font-bold text-indigo-500 bg-indigo-100/40 px-2 py-0.5 rounded-full uppercase tracking-wider">Deposit: 50%</span>
              </div>
            </div>

            {/* Confirms buttons */}
            <div className="flex items-center gap-2 pt-2">
              <Button 
                variant="outline" 
                className="flex-1 rounded-xl text-slate-500 text-xs font-semibold"
                onClick={() => setShowBookingModal(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold"
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
