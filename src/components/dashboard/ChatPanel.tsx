'use client'

import { useState, useRef, useEffect } from 'react'
import { Conversation, Message } from '@/lib/mock-data'
import { AiToggle } from './AiToggle'
import { LeadScoreBadge } from './LeadScoreBadge'
import { MessageBubble } from './MessageBubble'
import { Button } from '@/components/ui/button'
import { Mic, Send, Smile, Phone, CheckCircle2, MessageSquareDashed, ChevronLeft } from 'lucide-react'
import { PlatformIcon } from './PlatformIcon'
import { PlatformBadge } from './PlatformBadge'

interface ChatPanelProps {
  conversation: Conversation | null
  messages: Message[]
  onBack?: () => void
}

export function ChatPanel({ conversation, messages, onBack }: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!conversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-slate-50/50 text-slate-500">
        <MessageSquareDashed className="h-16 w-16 mb-4 text-slate-300" />
        <h2 className="text-xl font-semibold text-slate-700">Unified Inbox</h2>
        <p className="mt-2 text-sm text-center max-w-sm">Select a conversation from the left panel to start messaging with your leads.</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-[#F0F2F5]">
      {/* Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-4 sm:px-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <Button variant="ghost" size="icon" className="lg:hidden shrink-0 -ml-2" onClick={onBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 border">
            <PlatformIcon platform={conversation.platform || ''} className="h-5 w-5" />
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-slate-900 truncate">{conversation.customer_name || conversation.customer_phone}</h2>
              <PlatformBadge platform={conversation.platform || ''} />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Phone className="h-3 w-3 shrink-0" />
              <span className="truncate">{conversation.customer_phone}</span>
            </div>
          </div>
          <div className="ml-2 hidden sm:block">
            <LeadScoreBadge score={conversation.lead_score} />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <AiToggle conversationId={conversation.id} initialStatus={!!conversation.ai_status} />
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span className="hidden sm:inline">Book</span>
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="flex flex-col space-y-2">
          <div className="text-center my-4">
            <span className="text-[11px] font-medium bg-slate-200/70 text-slate-600 px-3 py-1 rounded-full">
              Conversation Started
            </span>
          </div>
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center p-8 text-center text-slate-500">
              <p className="text-sm">No messages yet. Send the first message below!</p>
            </div>
          ) : (
            messages.map(msg => <MessageBubble key={msg.id} message={msg} platform={conversation.platform || ''} />)
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="shrink-0 bg-white p-4">
        <div className="flex items-end gap-2 rounded-2xl bg-[#F0F2F5] p-2 border border-slate-200">
          <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 text-slate-500 hover:bg-slate-200 rounded-full">
            <Smile className="h-5 w-5" />
          </Button>
          
          <textarea 
            className="flex-1 max-h-32 min-h-[40px] resize-none bg-transparent py-2 text-sm focus:outline-none placeholder:text-slate-500"
            placeholder="Type in Darja or Arabic..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            rows={1}
          />
          
          {inputValue.trim() ? (
            <Button size="icon" className="h-10 w-10 shrink-0 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              <Send className="h-4 w-4 ml-0.5" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 text-slate-500 hover:bg-slate-200 rounded-full">
              <Mic className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
