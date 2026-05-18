'use client'

import React from 'react'
import { ExtendedConversation } from '@/app/dashboard/inbox/page'
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon'
import { MessengerIcon } from '@/components/icons/MessengerIcon'
import { InstagramIcon } from '@/components/icons/InstagramIcon'
import { Flame, Sun, Snowflake, Bot, User, CheckSquare, Square } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { mockProfiles } from '@/lib/mock-data'

interface ConversationCardProps {
  conversation: ExtendedConversation
  isSelected: boolean
  onClick: () => void
  isBulkSelected: boolean
  onToggleSelect: () => void
}

export function ConversationCard({
  conversation,
  isSelected,
  onClick,
  isBulkSelected,
  onToggleSelect
}: ConversationCardProps) {
  
  // Calculate relative time ago
  const timeAgo = formatDistanceToNow(new Date(conversation.last_message_at || new Date()), { addSuffix: false })
  const shortTimeAgo = timeAgo
    .replace('about ', '')
    .replace('minutes', 'm')
    .replace('minute', 'm')
    .replace('hours', 'h')
    .replace('hour', 'h')
    .replace('days', 'd')
    .replace('day', 'd')
    .replace('ago', '')
    .trim()

  // Find assignee profile
  const assignee = mockProfiles.find(p => p.id === conversation.assignee_id)

  // Get initials for avatar fallback
  const name = conversation.customer_name || 'Guest'
  const initials = name.substring(0, 2).toUpperCase()

  // Select platform colors for avatar ring
  const getPlatformColors = () => {
    switch (conversation.platform) {
      case 'whatsapp':
        return { ring: 'ring-[#25D366]', bg: 'bg-[#25D366]/10 text-[#25D366]', svg: WhatsAppIcon }
      case 'facebook':
        return { ring: 'ring-[#0084FF]', bg: 'bg-[#0084FF]/10 text-[#0084FF]', svg: MessengerIcon }
      case 'instagram':
        return { ring: 'ring-[#d6249f]', bg: 'bg-gradient-to-tr from-[#fdf497]/20 via-[#fd5949]/20 to-[#d6249f]/20 text-[#d6249f]', svg: InstagramIcon }
      default:
        return { ring: 'ring-slate-300', bg: 'bg-slate-100 text-slate-600', svg: User }
    }
  }

  const colors = getPlatformColors()
  const PlatformSVG = colors.svg

  return (
    <div 
      onClick={(e) => {
        // Prevent trigger if clicking on checkbox area
        if ((e.target as HTMLElement).closest('.checkbox-area')) return
        onClick()
      }}
      className={cn(
        "group relative flex items-start gap-3.5 p-4 cursor-pointer transition-all duration-300 rounded-2xl mb-2.5 mx-1 border text-left overflow-hidden select-none",
        isSelected 
          ? "bg-blue-50/40 border-blue-200/80 shadow-xs border-l-[3px] border-l-blue-600 rounded-l-none" 
          : "bg-white border-slate-200/60 hover:bg-slate-50/50 hover:border-slate-300/80 shadow-xs hover:shadow-sm"
      )}
    >
      
      {/* Checkbox for Bulk Actions (visible on card hover, or if selected) */}
      <div 
        onClick={(e) => {
          e.stopPropagation()
          onToggleSelect()
        }}
        className={cn(
          "checkbox-area absolute left-2 top-2 p-1.5 rounded-lg transition-all duration-200 z-20 hover:scale-110",
          isBulkSelected 
            ? "block text-blue-600" 
            : "hidden group-hover:block bg-white border border-slate-200 text-slate-400 hover:text-slate-600 shadow-sm"
        )}
      >
        {isBulkSelected ? <CheckSquare className="h-4.5 w-4.5" /> : <Square className="h-4.5 w-4.5" />}
      </div>

      {/* Customer Avatar & Indicators */}
      <div className="relative shrink-0 mt-0.5">
        <div className={cn(
          "h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs ring-2 ring-offset-1 ring-offset-white transition-all duration-300 group-hover:scale-105",
          colors.ring,
          colors.bg
        )}>
          {initials}
        </div>
        
        {/* Real-time Online Dot (mock indicator) */}
        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-400/20" />

        {/* Unread Alert Dot indicator */}
        {conversation.unread && (
          <span className="absolute -top-1 -right-1 block h-3 w-3 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-500/20 animate-pulse" />
        )}
      </div>

      {/* Content Text Fields */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center gap-2 mb-1">
          <h4 className={cn(
            "text-xs truncate tracking-tight text-slate-800",
            conversation.unread ? "font-extrabold text-slate-900" : "font-semibold"
          )}>
            {name}
          </h4>
          <span suppressHydrationWarning className="text-[10px] font-bold text-slate-450 whitespace-nowrap shrink-0">{shortTimeAgo}</span>
        </div>

        {/* Message preview details */}
        <div className="flex items-center gap-1.5 mb-2.5">
          <PlatformSVG className="h-3.5 w-3.5 shrink-0" />
          <p className={cn(
            "text-[11px] truncate leading-tight",
            conversation.unread ? "font-bold text-slate-700 font-semibold" : "text-slate-400"
          )}>
            {conversation.lead_summary?.startsWith('Voice') || conversation.lead_summary?.includes('🎤') ? (
              <span className="text-indigo-600 font-bold">🎤 Voice note received</span>
            ) : (
              conversation.lead_summary || "No messages yet"
            )}
          </p>
        </div>

        {/* Interactive pills action row */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-slate-100">
          
          {/* Animated score badges */}
          {conversation.lead_score === 'HOT' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black bg-red-50 text-red-600 border border-red-200 uppercase tracking-widest animate-pulse shadow-xs">
              <Flame className="h-3 w-3 text-red-500 fill-red-100 animate-bounce" /> HOT
            </span>
          )}
          {conversation.lead_score === 'WARM' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black bg-amber-50 text-amber-600 border border-amber-200 uppercase tracking-widest shadow-xs">
              <Sun className="h-3 w-3 text-amber-550 animate-[spin_10s_linear_infinite]" /> WARM
            </span>
          )}
          {conversation.lead_score === 'COLD' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black bg-slate-50 text-slate-500 border border-slate-200 uppercase tracking-widest shadow-xs">
              <Snowflake className="h-3 w-3 text-slate-400 animate-bounce" /> COLD
            </span>
          )}

          {/* AI active status pill & Assignee indicators */}
          <div className="flex items-center gap-1.5">
            {assignee && (
              <div 
                title={`Assigned to ${assignee.full_name}`}
                className="h-4.5 px-1.5 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-600 text-[8px] font-extrabold flex items-center gap-0.5 uppercase tracking-wider"
              >
                <User className="h-2 w-2" /> {assignee.full_name.split(' ')[0]}
              </div>
            )}
            
            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-150">
              {conversation.ai_status ? (
                <><Bot className="h-2.5 w-2.5 text-emerald-500 animate-pulse" /> <span className="text-emerald-600 text-[8px] uppercase tracking-wider font-extrabold">AI</span></>
              ) : (
                <><User className="h-2.5 w-2.5 text-blue-500" /> <span className="text-slate-500 text-[8px] uppercase tracking-wider font-extrabold">Agent</span></>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}
