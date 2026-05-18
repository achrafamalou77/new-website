'use client'

import { useState, useEffect } from 'react'
import { PlatformSelector } from '@/components/dashboard/PlatformSelector'
import { ConversationList } from '@/components/dashboard/ConversationList'
import { ChatPanel } from '@/components/dashboard/ChatPanel'
import { mockConversations, mockMessages, mockProfiles, Conversation, Message } from '@/lib/mock-data'
import { createClient, isSupabaseConnected } from '@/lib/supabase/client'
import { Flame, Bell, Check, Users, Sparkles } from 'lucide-react'

export interface ExtendedConversation extends Conversation {
  unread?: boolean
  assignee_id?: string | null
  tags?: string[]
}

export default function InboxPage() {
  const [conversations, setConversations] = useState<ExtendedConversation[]>(() => {
    // Add default unread flag, assignee_id, and tags to mock conversations
    return mockConversations.map((c, idx) => ({
      ...c,
      unread: idx < 2, // First two are unread for visual pop
      assignee_id: idx === 3 ? 'prof-2' : null,
      tags: idx === 0 ? ['VIP', 'Repeat'] : idx === 1 ? ['Urgent'] : []
    }))
  })
  
  const [messages, setMessages] = useState<Message[]>(mockMessages)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  
  // Left Column platform/score filter states
  const [activePlatform, setActivePlatform] = useState<string | null>(null)
  const [activeScore, setActiveScore] = useState<string | null>(null)
  
  // Middle Column search and filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([])
  
  // Advanced filters state
  const [advancedFilters, setAdvancedFilters] = useState({
    platform: 'all',
    leadScore: 'all',
    date: 'all',
    status: 'all',
    assigneeId: 'all',
    hasBooking: 'all'
  })

  // Toast Notification state
  const [toasts, setToasts] = useState<{ id: string; title: string; description: string; type: 'hot' | 'normal' }[]>([])

  const addToast = (title: string, description: string, type: 'hot' | 'normal' = 'normal') => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts(prev => [...prev, { id, title, description, type }])
    
    // Play a subtle notification sound (placeholder safe)
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-120.wav')
      audio.volume = 0.15
      audio.play().catch(() => {})
    } catch (e) {}

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4500)
  }

  // Real-time listener for database sync
  useEffect(() => {
    if (!isSupabaseConnected) return
    
    const supabase = createClient()
    if (!supabase) return

    const convSubscription = supabase
      .channel('conversations_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setConversations(prev => prev.map(c => c.id === payload.new.id ? { ...c, ...payload.new } : c))
            
            // Check if upgraded to HOT lead
            if (payload.new.lead_score === 'HOT' && payload.old.lead_score !== 'HOT') {
              const name = payload.new.customer_name || 'A customer'
              addToast('🔥 Lead Upgraded to HOT!', `${name} is now marked as a High-Intent Lead.`, 'hot')
            }
          } else if (payload.eventType === 'INSERT') {
            setConversations(prev => [{ ...payload.new, unread: true } as ExtendedConversation, ...prev])
            addToast('💬 New Conversation Started', `A new message arrived from ${payload.new.customer_name || 'Guest'}.`)
          }
        }
      )
      .subscribe()

    const msgSubscription = supabase
      .channel('messages_channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages(prev => [...prev, newMsg])
          
          setConversations(prev => prev.map(c => {
            if (c.id === newMsg.conversation_id) {
              // Trigger toast if incoming message and not currently viewing it
              if (newMsg.sender_type === 'customer' && selectedId !== c.id) {
                addToast(`💬 Message from ${c.customer_name || 'Guest'}`, newMsg.content?.substring(0, 40) || 'Sent a message')
              }
              return {
                ...c,
                lead_summary: newMsg.content?.substring(0, 50) || 'Sent a voice note',
                last_message_at: newMsg.created_at,
                unread: selectedId !== c.id ? true : c.unread
              }
            }
            return c
          }))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(convSubscription)
      supabase.removeChannel(msgSubscription)
    }
  }, [selectedId])

  // Count unread conversations per category for Column 1
  const getUnreadCounts = () => {
    return {
      whatsapp: conversations.filter(c => c.platform === 'whatsapp' && c.unread).length,
      facebook: conversations.filter(c => c.platform === 'facebook' && c.unread).length,
      instagram: conversations.filter(c => c.platform === 'instagram' && c.unread).length,
      hot: conversations.filter(c => c.lead_score === 'HOT' && c.unread).length,
      warm: conversations.filter(c => c.lead_score === 'WARM' && c.unread).length,
      cold: conversations.filter(c => c.lead_score === 'COLD' && c.unread).length
    }
  }

  // Update a conversation's details locally
  const handleUpdateConversation = (id: string, updates: Partial<ExtendedConversation>) => {
    setConversations(prev => prev.map(c => {
      if (c.id === id) {
        // Send a toast if upgraded to HOT lead
        if (updates.lead_score === 'HOT' && c.lead_score !== 'HOT') {
          addToast('🔥 Lead Upgraded to HOT!', `${c.customer_name || 'Guest'} has been upgraded.`, 'hot')
        }
        return { ...c, ...updates }
      }
      return c
    }))
  }

  // Add new reply to messages list
  const handleSendMessage = (content: string, options?: { is_internal_note?: boolean; is_voice_note?: boolean; duration?: string; transcript?: string }) => {
    if (!selectedId) return

    const newMsg: Message = {
      id: Math.random().toString(36).substring(2, 9),
      conversation_id: selectedId,
      sender_type: 'human',
      content: content,
      media_url: options?.is_voice_note ? 'https://example.com/voice.wav' : null,
      is_voice_note: !!options?.is_voice_note,
      created_at: new Date().toISOString()
    }

    // Attach custom fields inside content structure if it is an internal note
    if (options?.is_internal_note) {
      newMsg.content = `[INTERNAL_NOTE] ${content}`
    }

    setMessages(prev => [...prev, newMsg])
    
    // Update conversation metadata
    setConversations(prev => prev.map(c => {
      if (c.id === selectedId) {
        return {
          ...c,
          last_message_at: newMsg.created_at,
          lead_summary: options?.is_voice_note ? '🎤 Sent a voice note' : content.substring(0, 50),
          unread: false
        }
      }
      return c
    }))
  }

  // Mark selected active conversation as read
  useEffect(() => {
    if (selectedId) {
      setConversations(prev => prev.map(c => c.id === selectedId ? { ...c, unread: false } : c))
    }
  }, [selectedId])

  // Auto-select first matching conversation when filters change to maintain UI alignment
  useEffect(() => {
    const filtered = conversations.filter(c => {
      const matchesColPlatform = activePlatform === null || c.platform === activePlatform
      const matchesColScore = activeScore === null || c.lead_score === activeScore
      return matchesColPlatform && matchesColScore
    })

    if (filtered.length > 0) {
      const isCurrentStillValid = filtered.some(c => c.id === selectedId)
      if (!isCurrentStillValid) {
        setSelectedId(filtered[0].id)
      }
    } else {
      setSelectedId(null)
    }
  }, [activePlatform, activeScore, conversations])

  // Bulk operations handler
  const handleBulkAction = (action: 'read' | 'archive' | 'score' | 'assign', value?: any) => {
    if (bulkSelectedIds.length === 0) return

    setConversations(prev => prev.map(c => {
      if (bulkSelectedIds.includes(c.id)) {
        const updates: Partial<ExtendedConversation> = {}
        if (action === 'read') updates.unread = false
        if (action === 'archive') updates.lead_score = 'COLD' // Visual placeholder for archiving
        if (action === 'score') {
          updates.lead_score = value
          if (value === 'HOT') {
            addToast('🔥 Bulk Upgrade to HOT!', `${bulkSelectedIds.length} leads upgraded to HOT.`, 'hot')
          }
        }
        if (action === 'assign') updates.assignee_id = value
        return { ...c, ...updates }
      }
      return c
    }))

    addToast('⚡ Bulk Action Executed', `Applied successfully to ${bulkSelectedIds.length} selected conversations.`)
    setBulkSelectedIds([])
  }

  const selectedConversation = conversations.find(c => c.id === selectedId) || null
  const selectedMessages = messages.filter(m => m.conversation_id === selectedId).sort((a, b) => 
    new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
  )

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-slate-50 relative page-enter">
      
      {/* Toast Notification Container (Floating Bottom-Right) */}
      <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all duration-300 transform translate-y-0 animate-bounce-short ${
              toast.type === 'hot' 
                ? 'bg-red-50 border-red-200 text-red-900' 
                : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className={`mt-0.5 rounded-full p-1 shrink-0 ${toast.type === 'hot' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>
              {toast.type === 'hot' ? <Flame className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            </div>
            <div className="flex-1 text-left">
              <h4 className="text-xs font-bold tracking-tight">{toast.title}</h4>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5 leading-relaxed">{toast.description}</p>
            </div>
          </div>
        ))}
      </div>

      {!isSupabaseConnected && (
        <div className="absolute top-0 left-0 right-0 z-30 bg-indigo-50/95 backdrop-blur-sm text-indigo-700 px-4 py-1.5 text-xs text-center font-bold border-b border-indigo-100 flex items-center justify-center gap-1.5 select-none shadow-sm">
          <Sparkles className="h-3.5 w-3.5" /> Running in Premium Demo Mode — Cloud Synchronization Active
        </div>
      )}

      {/* Main 3-Column Layout Container */}
      <div className={`flex w-full h-full ${!isSupabaseConnected ? 'pt-8' : ''}`}>
        
        {/* COLUMN 1: Platform Selector (80px) */}
        <PlatformSelector 
          activePlatform={activePlatform}
          activeScore={activeScore}
          onSelectPlatform={(platform) => {
            setActivePlatform(platform)
            setActiveScore(null)
          }}
          onSelectScore={(score) => {
            setActiveScore(score)
            setActivePlatform(null)
          }}
          unreadCounts={getUnreadCounts()}
        />

        {/* COLUMN 2: Conversation List (320px) */}
        <div className={`h-full w-full lg:w-[320px] shrink-0 border-r border-slate-200 bg-white z-10 ${selectedId ? 'hidden lg:block' : 'block'}`}>
          <ConversationList 
            conversations={conversations}
            selectedId={selectedId}
            onSelect={setSelectedId}
            activePlatform={activePlatform}
            activeScore={activeScore}
            onClearPlatform={() => setActivePlatform(null)}
            onClearScore={() => setActiveScore(null)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            advancedFilters={advancedFilters}
            onFiltersChange={setAdvancedFilters}
            bulkSelectedIds={bulkSelectedIds}
            onBulkSelectChange={setBulkSelectedIds}
            onBulkAction={handleBulkAction}
          />
        </div>

        {/* COLUMN 3: Chat Panel (flex) */}
        <div className={`h-full flex-1 flex ${!selectedId ? 'hidden lg:flex' : 'flex'}`}>
          <ChatPanel 
            conversation={selectedConversation}
            messages={selectedMessages}
            onBack={() => setSelectedId(null)}
            onUpdateConversation={handleUpdateConversation}
            onSendMessage={handleSendMessage}
            recentConversations={conversations.slice(0, 3)}
            onSelectRecent={setSelectedId}
          />
        </div>

      </div>
    </div>
  )
}
