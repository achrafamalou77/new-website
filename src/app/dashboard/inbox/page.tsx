'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { PlatformSelector } from '@/components/dashboard/PlatformSelector'
import { ConversationList } from '@/components/dashboard/ConversationList'
import { ChatPanel } from '@/components/dashboard/ChatPanel'
import { Conversation, Message } from '@/lib/mock-data'
import { createClient, isSupabaseConnected } from '@/lib/supabase/client'
import { Flame, Bell, Sparkles, Loader2, Bot, WifiOff, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getConversations,
  getMessages,
  toggleAiStatus,
  sendHumanMessage,
  markConversationRead,
  updateLeadScore,
} from '@/app/actions/conversations'

export interface ExtendedConversation extends Conversation {
  unread?: boolean
  assignee_id?: string | null
  tags?: string[]
  customer_name?: string | null
  customer_phone?: string | null
  lead_summary?: string | null
  ai_status?: boolean | null
  agency_name?: string | null
  business_type_slug?: string | null
}

function mapDbConversation(c: any): ExtendedConversation {
  let platform = c.platform?.toLowerCase().trim() || 'whatsapp';
  if (platform === 'messenger') {
    platform = 'facebook';
  }
  return {
    ...c,
    platform,
    lead_score: c.lead_score?.toUpperCase().trim() || 'WARM',
    unread: c.unread ?? false,
    ai_status: c.ai_status ?? true,
    agency_name: Array.isArray(c.agencies)
      ? c.agencies[0]?.company_name
      : c.agencies?.company_name || null,
    business_type_slug: Array.isArray(c.agencies)
      ? c.agencies[0]?.business_type_slug
      : c.agencies?.business_type_slug || null,
  }
}

function mapDbMessage(m: any): Message {
  return {
    ...m,
    sender_type:
      m.role === 'user' || m.role === 'client' || m.sender_type === 'client' ? 'customer'
      : m.role === 'assistant' || m.role === 'bot' || m.sender_type === 'bot' ? 'ai'
      : m.role === 'human' || m.sender_type === 'agent' ? 'human'
      : m.sender_type || 'customer',
    is_voice_note: m.is_voice_note || m.media_url?.includes('audio') || false,
  } as any
}

export default function InboxPage() {
  const [conversations, setConversations] = useState<ExtendedConversation[]>([])
  // Store ALL messages by conversation ID — eliminates stale closure issues
  const [allMessages, setAllMessages] = useState<Record<string, Message[]>>({})
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPlatformOwner, setIsPlatformOwner] = useState(false)
  const [businessTypeSlug, setBusinessTypeSlug] = useState('travel')
  const [error, setError] = useState<string | null>(null)
  const [loadingMsgId, setLoadingMsgId] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Refs to avoid stale closures in real-time callbacks
  const selectedIdRef = useRef<string | null>(null)
  const conversationsRef = useRef<ExtendedConversation[]>([])

  // Keep refs in sync
  useEffect(() => { selectedIdRef.current = selectedId }, [selectedId])
  useEffect(() => { conversationsRef.current = conversations }, [conversations])

  const [activePlatform, setActivePlatform] = useState<string | null>(null)
  const [activeScore, setActiveScore] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([])
  const [advancedFilters, setAdvancedFilters] = useState({
    platform: 'all', leadScore: 'all', date: 'all',
    status: 'all', assigneeId: 'all', hasBooking: 'all'
  })

  const [toasts, setToasts] = useState<{ id: string; title: string; description: string; type: 'hot' | 'normal' | 'success' }[]>([])

  const addToast = useCallback((title: string, description: string, type: 'hot' | 'normal' | 'success' = 'normal') => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts(prev => [...prev, { id, title, description, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500)
  }, [])

  // ─── Load / Refresh Conversations ──────────────────────────────────────────
  const loadConversations = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true)
    else setIsLoading(true)
    setError(null)
    try {
      const res = await getConversations()
      if (res.success && res.data && res.data.length > 0) {
        const mapped = res.data.map(mapDbConversation)
        setConversations(mapped)
        setBusinessTypeSlug((res as any).businessTypeSlug || mapped[0]?.business_type_slug || 'travel')
        if (!isManualRefresh) {
          setSelectedId(mapped[0].id)
          setIsPlatformOwner((res as any).isPlatformOwner === true)
        }
      } else if (!res.success) {
        setError(res.error || 'Failed to load')
        setBusinessTypeSlug(document.cookie.includes('demo_business_type_slug=car_showroom') ? 'car_showroom' : 'travel')
        if (!isManualRefresh) {
          setConversations([])
          setSelectedId(null)
        }
      } else if (!isManualRefresh) {
        setBusinessTypeSlug((res as any).businessTypeSlug || (document.cookie.includes('demo_business_type_slug=car_showroom') ? 'car_showroom' : 'travel'))
        setConversations([])
        setSelectedId(null)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  // ─── 1. Load Initial Conversations ─────────────────────────────────────────
  useEffect(() => {
    loadConversations(false)
  }, [loadConversations])

  // ─── 2. Load Messages When Conversation is Selected ───────────────────────
  useEffect(() => {
    if (!selectedId) return

    let cancelled = false
    setLoadingMsgId(selectedId)

    async function loadMsgs() {
      try {
        const res = await getMessages(selectedId!)
        if (cancelled) return
        if (res.success && res.data) {
          setAllMessages(prev => ({
            ...prev,
            [selectedId!]: res.data!.map(mapDbMessage)
          }))
        }
      } catch (err) {
        console.error('Failed to load messages:', err)
      } finally {
        if (!cancelled) setLoadingMsgId(null)
      }
    }
    loadMsgs()
    return () => { cancelled = true }
  }, [selectedId])

  // ─── 3. Real-time Subscriptions (STABLE — mounted once, never recreated) ──
  useEffect(() => {
    if (!isSupabaseConnected) return

    const supabase = createClient()
    if (!supabase) return

    // ── Conversations channel ──────────────────────────────────────────────
    const convChannel = supabase
      .channel('rt_conversations_v2')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updated = mapDbConversation(payload.new)
            setConversations(prev => {
              const exists = prev.some(c => c.id === updated.id)
              if (!exists) return [updated, ...prev] // New conv appeared via update
              return prev.map(c => c.id === updated.id ? { ...c, ...updated } : c)
            })
            // 🔥 HOT lead toast
            if (payload.new.lead_score === 'hot' && payload.old?.lead_score !== 'hot') {
              addToast('🔥 Lead Upgraded to HOT!', `${payload.new.customer_name || 'A customer'} is now high-intent!`, 'hot')
            }
          } else if (payload.eventType === 'INSERT') {
            const newConv = mapDbConversation(payload.new)
            setConversations(prev => {
              if (prev.some(c => c.id === newConv.id)) return prev
              addToast('💬 New Conversation', `Message from ${newConv.customer_name || newConv.customer_phone || (businessTypeSlug === 'car_showroom' ? 'Client' : 'Guest')}`)
              return [newConv, ...prev]
            })
          }
        }
      )
      .subscribe()

    // ── Messages channel ───────────────────────────────────────────────────
    const msgChannel = supabase
      .channel('rt_messages_v2')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const raw = payload.new as any
          const newMsg = mapDbMessage(raw)
          const convId = raw.conversation_id

          if (!convId) return

          // Always add to allMessages — use functional updates (no stale closure)
          setAllMessages(prev => {
            const existing = prev[convId] || []
            // Deduplicate by id
            if (existing.some((m: Message) => m.id === newMsg.id)) return prev
            return { ...prev, [convId]: [...existing, newMsg] }
          })

          // Update conversation list: move to top, mark unread if not currently selected
          setConversations(prev => prev.map(c => {
            if (c.id !== convId) return c
            const isSelected = selectedIdRef.current === convId
            // Toast for incoming customer messages in background conversations
            if (newMsg.sender_type === 'customer' && !isSelected) {
              addToast(
                `💬 ${c.customer_name || c.customer_phone || (businessTypeSlug === 'car_showroom' ? 'Client' : 'Guest')}`,
                raw.content?.substring(0, 60) || '🎤 Media message'
              )
            }
            return {
              ...c,
              last_message_at: raw.created_at || new Date().toISOString(),
              lead_summary: raw.content?.substring(0, 80) || '🎤 Media',
              unread: isSelected ? false : true,
            }
          }))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(convChannel)
      supabase.removeChannel(msgChannel)
    }
  }, [addToast, businessTypeSlug]) // No selectedId dependency = no channel recreation.

  // ─── 4. Mark as Read When Conversation Opens ──────────────────────────────
  useEffect(() => {
    if (!selectedId || selectedId.startsWith('conv-')) return
    setConversations(prev => prev.map(c => c.id === selectedId ? { ...c, unread: false } : c))
    markConversationRead(selectedId).catch(console.error)
  }, [selectedId])

  // ─── 5. Handlers ──────────────────────────────────────────────────────────
  const handleSelectConversation = useCallback((id: string) => {
    setSelectedId(id)
  }, [])

  const handleUpdateConversation = useCallback(async (id: string, updates: Partial<ExtendedConversation>) => {
    // Optimistic update
    setConversations(prev => prev.map(c => {
      if (c.id !== id) return c
      if (updates.lead_score === 'HOT' && c.lead_score !== 'HOT') {
        addToast('🔥 Lead Upgraded!', `${c.customer_name || (businessTypeSlug === 'car_showroom' ? 'Client' : 'Guest')} is now HOT.`, 'hot')
      }
      return { ...c, ...updates }
    }))

    // Persist AI status toggle
    if (updates.ai_status !== undefined && !id.startsWith('conv-')) {
      const res = await toggleAiStatus(id, updates.ai_status as boolean)
      if (!res.success) {
        // Rollback
        setConversations(prev => prev.map(c =>
          c.id === id ? { ...c, ai_status: !updates.ai_status } : c
        ))
        addToast('❌ Error', res.error || 'Failed to toggle AI status')
      } else {
        addToast(
          updates.ai_status ? '🤖 AI Bot Enabled' : '⏸️ Human Takeover',
          updates.ai_status
            ? 'AI will now handle incoming messages automatically.'
            : 'You are now in direct control of this chat.',
          'success'
        )
      }
    }

    // Persist lead score
    if (updates.lead_score != null && !id.startsWith('conv-')) {
      await updateLeadScore(id, updates.lead_score.toLowerCase() as 'hot' | 'warm' | 'cold')
    }
  }, [addToast, businessTypeSlug])

  const handleSendMessage = useCallback(async (
    content: string,
    options?: { is_internal_note?: boolean; is_voice_note?: boolean }
  ) => {
    if (!selectedId) return

    const tempId = `temp-${Date.now()}`
    const now = new Date().toISOString()
    const newMsg: any = {
      id: tempId,
      conversation_id: selectedId,
      sender_type: 'human',
      role: 'human',
      content: options?.is_internal_note ? `[INTERNAL_NOTE] ${content}` : content,
      media_url: options?.is_voice_note ? 'audio://placeholder' : null,
      is_voice_note: !!options?.is_voice_note,
      created_at: now,
    }

    // Optimistic add
    setAllMessages(prev => ({
      ...prev,
      [selectedId]: [...(prev[selectedId] || []), newMsg]
    }))
    setConversations(prev => prev.map(c =>
      c.id === selectedId
        ? { ...c, last_message_at: now, lead_summary: content.substring(0, 60), unread: false }
        : c
    ))

    // Persist to Meta + DB
    if (!selectedId.startsWith('conv-') && !options?.is_internal_note) {
      const res = await sendHumanMessage(selectedId, content)
      if (!res.success) {
        addToast('❌ Message Not Delivered', res.error || 'Meta API error', 'normal')
        // Remove optimistic message on failure
        setAllMessages(prev => ({
          ...prev,
          [selectedId]: (prev[selectedId] || []).filter(m => m.id !== tempId)
        }))
      }
    }
  }, [selectedId, addToast])

  const handleBulkAction = useCallback((action: 'read' | 'archive' | 'score' | 'assign', value?: any) => {
    if (bulkSelectedIds.length === 0) return
    setConversations(prev => prev.map(c => {
      if (!bulkSelectedIds.includes(c.id)) return c
      const updates: Partial<ExtendedConversation> = {}
      if (action === 'read') updates.unread = false
      if (action === 'archive') updates.lead_score = 'COLD'
      if (action === 'score') { updates.lead_score = value; if (value === 'HOT') addToast('🔥 Bulk Upgrade!', `${bulkSelectedIds.length} leads → HOT`, 'hot') }
      if (action === 'assign') updates.assignee_id = value
      return { ...c, ...updates }
    }))
    addToast('⚡ Done', `Updated ${bulkSelectedIds.length} conversations.`)
    setBulkSelectedIds([])
  }, [bulkSelectedIds, addToast])

  // ─── Derived State ─────────────────────────────────────────────────────────
  const selectedConversation = useMemo(
    () => conversations.find(c => c.id === selectedId) || null,
    [conversations, selectedId]
  )

  const selectedMessages = useMemo(() => {
    if (!selectedId) return []
    return (allMessages[selectedId] || []).slice().sort(
      (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
    )
  }, [allMessages, selectedId])

  const unreadCounts = useMemo(() => ({
    whatsapp: conversations.filter(c => c.platform === 'whatsapp' && c.unread).length,
    facebook: conversations.filter(c => c.platform === 'facebook' && c.unread).length,
    instagram: conversations.filter(c => c.platform === 'instagram' && c.unread).length,
    hot: conversations.filter(c => c.lead_score === 'HOT' && c.unread).length,
    warm: conversations.filter(c => c.lead_score === 'WARM' && c.unread).length,
    cold: conversations.filter(c => c.lead_score === 'COLD' && c.unread).length,
  }), [conversations])

  const toastColors = {
    hot: 'bg-red-50 border-red-200 text-red-900',
    normal: 'bg-white/90 border-slate-200/80 text-slate-800 backdrop-blur-md',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  }

  return (
    <div className={cn(
      'flex h-[calc(100vh-64px)] w-full overflow-hidden relative page-enter transition-colors duration-700',
      activePlatform === 'instagram' ? 'bg-slate-950 text-white' : 'bg-slate-50/50 text-slate-800'
    )}>

      {/* Ambient background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className={cn(
          'absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full blur-[120px] mix-blend-multiply opacity-25 transition-all duration-1000 animate-glow-1',
          activePlatform === 'whatsapp' ? 'bg-emerald-400'
            : activePlatform === 'instagram' ? 'bg-purple-600'
            : activePlatform === 'facebook' ? 'bg-blue-500'
            : 'bg-indigo-500'
        )} />
        <div className={cn(
          'absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] rounded-full blur-[120px] mix-blend-multiply opacity-25 transition-all duration-1000 animate-glow-2',
          activePlatform === 'whatsapp' ? 'bg-teal-400'
            : activePlatform === 'instagram' ? 'bg-pink-500'
            : activePlatform === 'facebook' ? 'bg-sky-400'
            : 'bg-violet-500'
        )} />
      </div>

      {/* Toast Notifications */}
      <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all duration-300 animate-bounce-short',
              activePlatform === 'instagram'
                ? 'bg-slate-900/90 border-white/10 text-white shadow-black/40 backdrop-blur-md'
                : toastColors[toast.type]
            )}
          >
            <div className={`mt-0.5 rounded-full p-1 shrink-0 ${
              toast.type === 'hot' ? 'bg-red-500 text-white'
                : toast.type === 'success' ? 'bg-emerald-500 text-white'
                : 'bg-blue-500 text-white'
            }`}>
              {toast.type === 'hot' ? <Flame className="h-4 w-4" />
                : toast.type === 'success' ? <Bot className="h-4 w-4" />
                : <Bell className="h-4 w-4" />}
            </div>
            <div className="flex-1 text-left">
              <h4 className="text-xs font-bold tracking-tight">{toast.title}</h4>
              <p className={cn(
                'text-[11px] font-medium mt-0.5 leading-relaxed',
                toast.type === 'hot' ? 'text-red-700'
                  : toast.type === 'success' ? 'text-emerald-700'
                  : activePlatform === 'instagram' ? 'text-slate-400' : 'text-slate-500'
              )}>{toast.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Platform Owner Banner */}
      {isPlatformOwner && (
        <div className="absolute top-0 left-0 right-0 z-30 px-4 py-1.5 text-xs text-center font-bold border-b flex items-center justify-center gap-1.5 bg-indigo-900 border-indigo-700 text-indigo-100">
          <Sparkles className="h-3.5 w-3.5" />
          Platform Owner — Viewing All {conversations.length} Conversations Across All Agencies
        </div>
      )}

      {/* Error / Demo Mode Banner */}
      {error && !isPlatformOwner && (
        <div className="absolute top-0 left-0 right-0 z-30 px-4 py-1.5 text-xs text-center font-bold border-b flex items-center justify-center gap-1.5 bg-amber-50 border-amber-200 text-amber-700">
          <WifiOff className="h-3.5 w-3.5" />
          Demo Mode — Showing sample data ({error})
        </div>
      )}

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/40 z-10 backdrop-blur-md">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
          <p className="text-xs font-bold text-slate-400 mt-3 uppercase tracking-wider">Loading Inbox...</p>
        </div>
      ) : (
        <div className={cn(
          'flex w-full h-full z-10',
          (isPlatformOwner || error) ? 'pt-8' : ''
        )}>

          {/* Col 1: Platform Selector */}
          <PlatformSelector
            activePlatform={activePlatform}
            activeScore={activeScore}
            onSelectPlatform={(platform) => { setActivePlatform(platform); setActiveScore(null) }}
            onSelectScore={(score) => { setActiveScore(score); setActivePlatform(null) }}
            unreadCounts={unreadCounts}
          />

          {/* Col 2: Conversation List */}
          <div className={cn(
            'h-full w-full lg:w-[320px] shrink-0 z-10 transition-all duration-500',
            selectedId ? 'hidden lg:block' : 'block',
            activePlatform === 'instagram'
              ? 'bg-slate-900/30 border-r border-white/5 backdrop-blur-xl'
              : 'bg-white/10 border-r border-white/20 backdrop-blur-md'
          )}>
            <ConversationList
              conversations={conversations}
              selectedId={selectedId}
              onSelect={handleSelectConversation}
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
              onRefresh={() => loadConversations(true)}
              isRefreshing={isRefreshing}
              businessTypeSlug={businessTypeSlug}
            />
          </div>

          {/* Col 3: Chat Panel */}
          <div className={`h-full flex-1 flex ${!selectedId ? 'hidden lg:flex' : 'flex'}`}>
            <ChatPanel
              conversation={selectedConversation}
              messages={selectedMessages}
              onBack={() => setSelectedId(null)}
              onUpdateConversation={handleUpdateConversation}
              onSendMessage={handleSendMessage}
              recentConversations={conversations.slice(0, 3)}
              onSelectRecent={handleSelectConversation}
              businessTypeSlug={businessTypeSlug}
            />
          </div>
        </div>
      )}
    </div>
  )
}
