'use client'

import { useState, useEffect } from 'react'
import { ConversationList } from '@/components/dashboard/ConversationList'
import { ChatPanel } from '@/components/dashboard/ChatPanel'
import { mockConversations, mockMessages, Conversation, Message } from '@/lib/mock-data'
import { createClient, isSupabaseConnected } from '@/lib/supabase/client'

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations)
  const [messages, setMessages] = useState<Message[]>(mockMessages)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConnected) return
    
    const supabase = createClient()
    if (!supabase) return

    // Subscribe to conversations table
    const convSubscription = supabase
      .channel('conversations_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        (payload) => {
          console.log('Realtime Conversation update:', payload)
          if (payload.eventType === 'UPDATE') {
            setConversations(prev => prev.map(c => c.id === payload.new.id ? { ...c, ...payload.new } : c))
          } else if (payload.eventType === 'INSERT') {
            setConversations(prev => [payload.new as Conversation, ...prev])
          }
        }
      )
      .subscribe()

    // Subscribe to messages table
    const msgSubscription = supabase
      .channel('messages_channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          console.log('Realtime Message received:', payload)
          const newMsg = payload.new as Message
          
          setMessages(prev => [...prev, newMsg])
          
          // Play subtle sound (placeholder)
          // new Audio('/ding.mp3').play().catch(console.error)
          
          setConversations(prev => prev.map(c => {
            if (c.id === newMsg.conversation_id) {
              return {
                ...c,
                lead_summary: newMsg.content?.substring(0, 50) || 'Sent a voice note',
                last_message_at: newMsg.created_at,
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
  }, [])

  const selectedConversation = conversations.find(c => c.id === selectedId) || null
  const selectedMessages = messages.filter(m => m.conversation_id === selectedId).sort((a, b) => 
    new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
  )

  return (
    <div className="flex h-full w-full flex-col">
      {!isSupabaseConnected && (
        <div className="bg-amber-100 text-amber-800 px-4 py-2 text-sm text-center font-medium">
          Running in demo mode — connect Supabase in settings
        </div>
      )}
      <div className="flex h-full w-full flex-1 overflow-hidden">
        <div className={`w-full lg:w-[35%] h-full shrink-0 lg:border-r ${selectedId ? 'hidden lg:block' : 'block'}`}>
          <ConversationList 
            conversations={conversations} 
            selectedId={selectedId} 
            onSelect={setSelectedId} 
          />
        </div>
        <div className={`w-full lg:w-[65%] h-full flex-1 ${!selectedId ? 'hidden lg:flex' : 'flex'}`}>
          <ChatPanel 
            conversation={selectedConversation} 
            messages={selectedMessages} 
            onBack={() => setSelectedId(null)}
          />
        </div>
      </div>
    </div>
  )
}
