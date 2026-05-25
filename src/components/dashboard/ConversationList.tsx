'use client'

import React, { useState, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ExtendedConversation } from '@/app/dashboard/inbox/page'
import { ConversationCard } from './ConversationCard'
import { Input } from '@/components/ui/input'
import { 
  Search, SlidersHorizontal, X, CheckSquare, Square, 
  Trash2, Eye, Flame, Sun, Snowflake, UserPlus, Filter 
} from 'lucide-react'
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon'
import { MessengerIcon } from '@/components/icons/MessengerIcon'
import { InstagramIcon } from '@/components/icons/InstagramIcon'
import { mockProfiles } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

interface ConversationListProps {
  conversations: ExtendedConversation[]
  selectedId: string | null
  onSelect: (id: string) => void
  activePlatform: string | null
  activeScore: string | null
  onClearPlatform: () => void
  onClearScore: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
  advancedFilters: {
    platform: string
    leadScore: string
    date: string
    status: string
    assigneeId: string
    hasBooking: string
  }
  onFiltersChange: React.Dispatch<React.SetStateAction<{
    platform: string
    leadScore: string
    date: string
    status: string
    assigneeId: string
    hasBooking: string
  }>>
  bulkSelectedIds: string[]
  onBulkSelectChange: (ids: string[]) => void
  onBulkAction: (action: 'read' | 'archive' | 'score' | 'assign', value?: any) => void
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  activePlatform,
  activeScore,
  onClearPlatform,
  onClearScore,
  searchQuery,
  onSearchChange,
  advancedFilters,
  onFiltersChange,
  bulkSelectedIds,
  onBulkSelectChange,
  onBulkAction
}: ConversationListProps) {
  
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showScoreSubmenu, setShowScoreSubmenu] = useState(false)
  const [showAgentSubmenu, setShowAgentSubmenu] = useState(false)

  // Filter conversations
  const filtered = conversations.filter(c => {
    // Basic search: Name, Phone, Summary
    const matchesSearch = searchQuery.trim() === '' || 
      (c.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
       c.customer_phone?.includes(searchQuery) ||
       c.lead_summary?.toLowerCase().includes(searchQuery.toLowerCase()))

    // Platform filters from Column 1
    const matchesColPlatform = activePlatform === null || c.platform === activePlatform

    // Score filters from Column 1
    const matchesColScore = activeScore === null || c.lead_score === activeScore

    // Advanced filters
    const matchesAdvPlatform = advancedFilters.platform === 'all' || c.platform === advancedFilters.platform
    const matchesAdvScore = advancedFilters.leadScore === 'all' || c.lead_score === advancedFilters.leadScore
    
    // Status (AI / Human / Unread)
    let matchesAdvStatus = true
    if (advancedFilters.status === 'ai') matchesAdvStatus = !!c.ai_status
    if (advancedFilters.status === 'human') matchesAdvStatus = !c.ai_status
    if (advancedFilters.status === 'unread') matchesAdvStatus = !!c.unread

    // Assignee
    let matchesAdvAssignee = true
    if (advancedFilters.assigneeId === 'unassigned') matchesAdvAssignee = !c.assignee_id
    else if (advancedFilters.assigneeId !== 'all') matchesAdvAssignee = c.assignee_id === advancedFilters.assigneeId

    // Booking state placeholder matching
    let matchesAdvBooking = true
    if (advancedFilters.hasBooking === 'yes') matchesAdvBooking = c.id === 'conv-1' || c.id === 'conv-2' // Matches mock bookings
    else if (advancedFilters.hasBooking === 'no') matchesAdvBooking = c.id !== 'conv-1' && c.id !== 'conv-2'

    // Date filters (mock)
    let matchesAdvDate = true
    if (advancedFilters.date === 'today') {
      const minutesAgo = (Date.now() - new Date(c.last_message_at || 0).getTime()) / 60000
      matchesAdvDate = minutesAgo < 1440
    }

    return matchesSearch && matchesColPlatform && matchesColScore && 
           matchesAdvPlatform && matchesAdvScore && matchesAdvStatus && 
           matchesAdvAssignee && matchesAdvBooking && matchesAdvDate
  }).sort((a, b) => {
    // Sort by HOT first, then newest
    if (a.lead_score === 'HOT' && b.lead_score !== 'HOT') return -1
    if (b.lead_score === 'HOT' && a.lead_score !== 'HOT') return 1
    return new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime()
  })

  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 92,
    overscan: 5,
  })

  // Bulk selectors
  const isAllSelected = filtered.length > 0 && filtered.every(c => bulkSelectedIds.includes(c.id))
  
  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      onBulkSelectChange([])
    } else {
      onBulkSelectChange(filtered.map(c => c.id))
    }
  }

  const handleToggleCardSelect = (id: string) => {
    if (bulkSelectedIds.includes(id)) {
      onBulkSelectChange(bulkSelectedIds.filter(x => x !== id))
    } else {
      onBulkSelectChange([...bulkSelectedIds, id])
    }
  }

  const handleResetFilters = () => {
    onFiltersChange({
      platform: 'all',
      leadScore: 'all',
      date: 'all',
      status: 'all',
      assigneeId: 'all',
      hasBooking: 'all'
    })
    onClearPlatform()
    onClearScore()
    onSearchChange('')
    setShowAdvancedFilters(false)
  }

  const isDarkTheme = activePlatform === 'instagram'

  return (
    <div className={cn(
      "flex h-full w-full flex-col bg-transparent text-left select-none relative transition-colors duration-500",
      isDarkTheme ? "text-white" : "text-slate-800"
    )}>
      
      {/* Inbox Header Panel */}
      <div className={cn(
        "p-4 border-b space-y-3.5 shrink-0 transition-colors duration-500",
        isDarkTheme ? "border-white/5" : "border-slate-200/40"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className={cn(
              "text-base font-extrabold tracking-tight",
              isDarkTheme ? "text-slate-100 font-heading" : "text-slate-800 font-heading"
            )}>Inbox</h2>
            <span className={cn(
              "text-[10px] font-black px-2 py-0.5 rounded-full border transition-all duration-300",
              isDarkTheme 
                ? "bg-pink-500/10 border-pink-500/20 text-pink-400" 
                : "bg-blue-500/10 border-blue-500/20 text-blue-600"
            )}>
              {conversations.length}
            </span>
          </div>
          <button 
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={cn(
              "p-2 rounded-xl border transition-all duration-300 backdrop-blur-md cursor-pointer",
              showAdvancedFilters 
                ? isDarkTheme
                  ? 'bg-pink-500/20 border-pink-500/30 text-pink-400'
                  : 'bg-blue-500/20 border-blue-500/30 text-blue-600'
                : isDarkTheme
                  ? 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
                  : 'bg-white/40 border-slate-200/60 text-slate-500 hover:text-slate-750 hover:bg-white/80'
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        {/* Search Console */}
        <div className="relative">
          <Search className={cn(
            "absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-300",
            isDarkTheme ? "text-slate-500" : "text-slate-400"
          )} />
          <Input 
            placeholder="Search guests..." 
            className={cn(
              "pl-9 pr-8 rounded-xl text-xs transition-all w-full",
              isDarkTheme 
                ? "glass-input-dark placeholder-slate-500 text-white focus:placeholder-slate-400" 
                : "glass-input placeholder-slate-400 text-slate-800 focus:placeholder-slate-500"
            )}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button 
              onClick={() => onSearchChange('')}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-200 cursor-pointer",
                isDarkTheme ? "text-slate-400 hover:text-slate-200" : "text-slate-400 hover:text-slate-650"
              )}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Selected Indicators bar */}
        {(activePlatform || activeScore) && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {activePlatform && (
              <span className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-wider transition-all duration-300 shadow-sm",
                activePlatform === 'whatsapp' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-450 dark:text-emerald-400" :
                activePlatform === 'instagram' ? "bg-pink-500/10 border-pink-500/20 text-pink-400" :
                "bg-blue-500/10 border-blue-500/20 text-blue-500"
              )}>
                {activePlatform === 'whatsapp' && <WhatsAppIcon className="h-3 w-3" />}
                {activePlatform === 'facebook' && <MessengerIcon className="h-3 w-3" />}
                {activePlatform === 'instagram' && <InstagramIcon className="h-3 w-3" />}
                {activePlatform}
                <button onClick={onClearPlatform} className="hover:opacity-80 ml-0.5 cursor-pointer"><X className="h-3 w-3" /></button>
              </span>
            )}
            {activeScore && (
              <span className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all duration-300 shadow-sm",
                activeScore === 'HOT' ? 'bg-red-500/15 border-red-500/25 text-red-500' :
                activeScore === 'WARM' ? 'bg-amber-500/15 border-amber-500/25 text-amber-500' :
                isDarkTheme ? 'bg-white/5 border-white/10 text-slate-350' : 'bg-slate-100 border-slate-200 text-slate-600'
              )}>
                {activeScore === 'HOT' && <Flame className="h-3.5 w-3.5 text-red-500 animate-pulse" />}
                {activeScore === 'WARM' && <Sun className="h-3.5 w-3.5 text-amber-500" />}
                {activeScore === 'COLD' && <Snowflake className="h-3.5 w-3.5 text-blue-400" />}
                {activeScore}
                <button onClick={onClearScore} className="hover:opacity-80 ml-0.5 cursor-pointer"><X className="h-3 w-3" /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Advanced Filter Popover Pane */}
      {showAdvancedFilters && (
        <div className={cn(
          "border-b p-4 space-y-3 shrink-0 z-20 shadow-inner backdrop-blur-xl transition-all duration-300",
          isDarkTheme 
            ? "bg-slate-950/80 border-white/5 text-slate-200" 
            : "bg-white/60 border-slate-200/40 text-slate-700"
        )}>
          <div className="flex items-center justify-between">
            <h3 className={cn(
              "text-xs font-bold uppercase tracking-wider flex items-center gap-1",
              isDarkTheme ? "text-slate-400" : "text-slate-500"
            )}>
              <Filter className="h-3 w-3" /> Advanced Filters
            </h3>
            <button 
              onClick={handleResetFilters} 
              className={cn(
                "text-[10px] font-extrabold transition cursor-pointer",
                isDarkTheme ? "text-pink-400 hover:text-pink-300" : "text-blue-600 hover:text-blue-800"
              )}
            >
              Clear All
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Platform Select */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-450 uppercase">Platform</label>
              <select 
                value={advancedFilters.platform}
                onChange={(e) => onFiltersChange(prev => ({ ...prev, platform: e.target.value }))}
                className={cn(
                  "w-full rounded-lg p-1.5 outline-none font-medium text-xs transition border backdrop-blur-md cursor-pointer",
                  isDarkTheme 
                    ? "bg-slate-900/60 border-white/10 text-white focus:border-pink-500/50" 
                    : "bg-white/60 border-slate-200/80 text-slate-700 focus:border-blue-500/50"
                )}
              >
                <option value="all" className={isDarkTheme ? "bg-slate-900 text-white" : "bg-white text-slate-800"}>All</option>
                <option value="whatsapp" className={isDarkTheme ? "bg-slate-900 text-white" : "bg-white text-slate-800"}>WhatsApp</option>
                <option value="facebook" className={isDarkTheme ? "bg-slate-900 text-white" : "bg-white text-slate-800"}>Messenger</option>
                <option value="instagram" className={isDarkTheme ? "bg-slate-900 text-white" : "bg-white text-slate-800"}>Instagram</option>
              </select>
            </div>

            {/* Lead Score Select */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-455 uppercase">Lead Score</label>
              <select 
                value={advancedFilters.leadScore}
                onChange={(e) => onFiltersChange(prev => ({ ...prev, leadScore: e.target.value }))}
                className={cn(
                  "w-full rounded-lg p-1.5 outline-none font-medium text-xs transition border backdrop-blur-md cursor-pointer",
                  isDarkTheme 
                    ? "bg-slate-900/60 border-white/10 text-white focus:border-pink-500/50" 
                    : "bg-white/60 border-slate-200/80 text-slate-700 focus:border-blue-500/50"
                )}
              >
                <option value="all" className={isDarkTheme ? "bg-slate-900 text-white" : "bg-white text-slate-800"}>All</option>
                <option value="HOT" className={isDarkTheme ? "bg-slate-900 text-white text-red-400" : "bg-white text-red-650"}>🔥 HOT</option>
                <option value="WARM" className={isDarkTheme ? "bg-slate-900 text-white text-amber-400" : "bg-white text-amber-650"}>☀ WARM</option>
                <option value="COLD" className={isDarkTheme ? "bg-slate-900 text-white text-slate-400" : "bg-white text-slate-500"}>❄ COLD</option>
              </select>
            </div>

            {/* Date Select */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-450 uppercase">Activity Date</label>
              <select 
                value={advancedFilters.date}
                onChange={(e) => onFiltersChange(prev => ({ ...prev, date: e.target.value }))}
                className={cn(
                  "w-full rounded-lg p-1.5 outline-none font-medium text-xs transition border backdrop-blur-md cursor-pointer",
                  isDarkTheme 
                    ? "bg-slate-900/60 border-white/10 text-white focus:border-pink-500/50" 
                    : "bg-white/60 border-slate-200/80 text-slate-700 focus:border-blue-500/50"
                )}
              >
                <option value="all" className={isDarkTheme ? "bg-slate-900 text-white" : "bg-white text-slate-800"}>All Time</option>
                <option value="today" className={isDarkTheme ? "bg-slate-900 text-white" : "bg-white text-slate-800"}>Today</option>
              </select>
            </div>

            {/* AI Status */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-450 uppercase">Handoff Mode</label>
              <select 
                value={advancedFilters.status}
                onChange={(e) => onFiltersChange(prev => ({ ...prev, status: e.target.value }))}
                className={cn(
                  "w-full rounded-lg p-1.5 outline-none font-medium text-xs transition border backdrop-blur-md cursor-pointer",
                  isDarkTheme 
                    ? "bg-slate-900/60 border-white/10 text-white focus:border-pink-500/50" 
                    : "bg-white/60 border-slate-200/80 text-slate-700 focus:border-blue-500/50"
                )}
              >
                <option value="all" className={isDarkTheme ? "bg-slate-900 text-white" : "bg-white text-slate-800"}>All</option>
                <option value="ai" className={isDarkTheme ? "bg-slate-900 text-white" : "bg-white text-slate-800"}>AI Active</option>
                <option value="human" className={isDarkTheme ? "bg-slate-900 text-white" : "bg-white text-slate-800"}>Human Agent</option>
                <option value="unread" className={isDarkTheme ? "bg-slate-900 text-white" : "bg-white text-slate-800"}>Unread Only</option>
              </select>
            </div>

            {/* Assignee */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-450 uppercase">Assignee</label>
              <select 
                value={advancedFilters.assigneeId}
                onChange={(e) => onFiltersChange(prev => ({ ...prev, assigneeId: e.target.value }))}
                className={cn(
                  "w-full rounded-lg p-1.5 outline-none font-medium text-xs transition border backdrop-blur-md cursor-pointer",
                  isDarkTheme 
                    ? "bg-slate-900/60 border-white/10 text-white focus:border-pink-500/50" 
                    : "bg-white/60 border-slate-200/80 text-slate-700 focus:border-blue-500/50"
                )}
              >
                <option value="all" className={isDarkTheme ? "bg-slate-900 text-white" : "bg-white text-slate-800"}>All Agents</option>
                <option value="unassigned" className={isDarkTheme ? "bg-slate-900 text-white" : "bg-white text-slate-800"}>Unassigned</option>
                {mockProfiles.map(p => (
                  <option key={p.id} value={p.id} className={isDarkTheme ? "bg-slate-900 text-white" : "bg-white text-slate-800"}>{p.full_name}</option>
                ))}
              </select>
            </div>

            {/* Booking State */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-450 uppercase">Booking Made</label>
              <select 
                value={advancedFilters.hasBooking}
                onChange={(e) => onFiltersChange(prev => ({ ...prev, hasBooking: e.target.value }))}
                className={cn(
                  "w-full rounded-lg p-1.5 outline-none font-medium text-xs transition border backdrop-blur-md cursor-pointer",
                  isDarkTheme 
                    ? "bg-slate-900/60 border-white/10 text-white focus:border-pink-500/50" 
                    : "bg-white/60 border-slate-200/80 text-slate-700 focus:border-blue-500/50"
                )}
              >
                <option value="all" className={isDarkTheme ? "bg-slate-900 text-white" : "bg-white text-slate-800"}>All</option>
                <option value="yes" className={isDarkTheme ? "bg-slate-900 text-white" : "bg-white text-slate-800"}>Yes</option>
                <option value="no" className={isDarkTheme ? "bg-slate-900 text-white" : "bg-white text-slate-800"}>No</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Header Row Selector */}
      {filtered.length > 0 && (
        <div className={cn(
          "px-4 py-2.5 border-b flex items-center justify-between shrink-0 text-[11px] font-medium tracking-tight transition-colors duration-500",
          isDarkTheme 
            ? "border-white/5 bg-slate-900/10 text-slate-400" 
            : "border-slate-100 bg-slate-50/20 text-slate-500"
        )}>
          <button 
            onClick={handleToggleSelectAll}
            className={cn(
              "flex items-center gap-1.5 transition-colors duration-200 cursor-pointer",
              isDarkTheme ? "hover:text-slate-200" : "hover:text-slate-800"
            )}
          >
            {isAllSelected ? (
              <CheckSquare className={cn("h-4 w-4", isDarkTheme ? "text-pink-400" : "text-blue-500")} />
            ) : (
              <Square className="h-4 w-4 opacity-70" />
            )}
            <span className="font-semibold">Select All ({filtered.length})</span>
          </button>
          
          {bulkSelectedIds.length > 0 && (
            <span className={cn(
              "font-extrabold text-[10px] px-2 py-0.5 rounded-full border transition-all duration-300",
              isDarkTheme 
                ? "bg-pink-500/10 border-pink-500/20 text-pink-400" 
                : "bg-blue-50 border-blue-100 text-blue-600"
            )}>
              {bulkSelectedIds.length} selected
            </span>
          )}
        </div>
      )}

      {/* Conversations List Scrollable Area */}
      <div 
        ref={parentRef}
        className={cn(
          "flex-1 overflow-y-auto p-2 relative bg-transparent",
          isDarkTheme ? "glass-scrollbar-dark" : "glass-scrollbar"
        )}
      >
        {conversations.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center h-full">
            <Search className={cn("h-10 w-10 mb-3 opacity-60", isDarkTheme ? "text-slate-650" : "text-slate-400")} />
            <h3 className={cn("text-xs font-bold uppercase tracking-wide", isDarkTheme ? "text-slate-350" : "text-slate-700")}>No conversations yet</h3>
            <p className={cn("text-[11px] mt-1 max-w-[200px] leading-relaxed", isDarkTheme ? "text-slate-500" : "text-slate-400")}>
              When clients message you on WhatsApp or Instagram they will show here.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center h-full">
            <Filter className={cn("h-10 w-10 mb-3 opacity-60", isDarkTheme ? "text-slate-650" : "text-slate-400")} />
            <h3 className={cn("text-xs font-bold uppercase tracking-wide", isDarkTheme ? "text-slate-355" : "text-slate-700")}>No results found</h3>
            <p className={cn("text-[11px] mt-1 max-w-[200px] leading-relaxed", isDarkTheme ? "text-slate-500" : "text-slate-400")}>
              We couldn't find matches for the selected criteria.
            </p>
            <button 
              onClick={handleResetFilters}
              className={cn(
                "mt-4 px-3.5 py-1.5 border text-[10px] font-black rounded-lg uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-sm",
                isDarkTheme 
                  ? "bg-pink-500/20 border-pink-500/30 text-pink-400 hover:bg-pink-500/30"
                  : "bg-blue-50 border-blue-100 text-blue-600 hover:bg-blue-100"
              )}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const conv = filtered[virtualRow.index]
              return (
                <div
                  key={conv.id}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="pb-1"
                >
                  <ConversationCard 
                    conversation={conv} 
                    isSelected={selectedId === conv.id}
                    onClick={() => onSelect(conv.id)}
                    isBulkSelected={bulkSelectedIds.includes(conv.id)}
                    onToggleSelect={() => handleToggleCardSelect(conv.id)}
                    isDarkTheme={isDarkTheme}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Floating Bulk Action Toolbar */}
      {bulkSelectedIds.length > 0 && (
        <div className={cn(
          "absolute bottom-4 left-4 right-4 border rounded-2xl p-3 shadow-2xl flex items-center justify-between z-30 animate-in fade-in slide-in-from-bottom-3 duration-300 backdrop-blur-xl",
          isDarkTheme 
            ? "bg-slate-900/90 border-white/10 text-white shadow-black/50" 
            : "bg-white/90 border-slate-200/80 text-slate-850 shadow-slate-250/50"
        )}>
          <div className={cn(
            "text-[10px] font-black uppercase tracking-wider ml-1",
            isDarkTheme ? "text-slate-400" : "text-slate-500"
          )}>
            {bulkSelectedIds.length} Selected
          </div>
          
          <div className="flex items-center gap-2 relative">
            {/* Mark read */}
            <button 
              title="Mark as Read"
              onClick={() => onBulkAction('read')}
              className={cn(
                "p-2 rounded-xl transition border cursor-pointer",
                isDarkTheme 
                  ? "bg-white/5 border-white/10 hover:bg-white/10 text-slate-200" 
                  : "bg-slate-100 border-slate-200 hover:bg-slate-200/75 text-slate-600"
              )}
            >
              <Eye className="h-3.5 w-3.5" />
            </button>

            {/* Change Lead Score trigger */}
            <div className="relative">
              <button 
                title="Change Lead Score"
                onClick={() => {
                  setShowScoreSubmenu(!showScoreSubmenu)
                  setShowAgentSubmenu(false)
                }}
                className={cn(
                  "p-2 rounded-xl transition border cursor-pointer",
                  showScoreSubmenu 
                    ? isDarkTheme ? "bg-pink-600 text-white border-pink-500" : "bg-blue-600 text-white border-blue-500"
                    : isDarkTheme ? "bg-white/5 border-white/10 text-slate-200 hover:bg-white/10" : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200/75"
                )}
              >
                <Flame className="h-3.5 w-3.5" />
              </button>
              {showScoreSubmenu && (
                <div className={cn(
                  "absolute bottom-12 right-0 border p-1.5 rounded-xl shadow-lg flex flex-col gap-1 z-40 text-left min-w-[100px] backdrop-blur-xl",
                  isDarkTheme 
                    ? "bg-slate-900 border-white/10 text-white" 
                    : "bg-white border-slate-200 text-slate-800"
                )}>
                  <button 
                    onClick={() => {
                      onBulkAction('score', 'HOT')
                      setShowScoreSubmenu(false)
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-white/5 dark:hover:bg-white/5 rounded-lg text-[10px] font-bold text-red-500 cursor-pointer"
                  >
                    🔥 HOT
                  </button>
                  <button 
                    onClick={() => {
                      onBulkAction('score', 'WARM')
                      setShowScoreSubmenu(false)
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-white/5 dark:hover:bg-white/5 rounded-lg text-[10px] font-bold text-amber-500 cursor-pointer"
                  >
                    ☀ WARM
                  </button>
                  <button 
                    onClick={() => {
                      onBulkAction('score', 'COLD')
                      setShowScoreSubmenu(false)
                    }}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-white/5 dark:hover:bg-white/5 rounded-lg text-[10px] font-bold cursor-pointer",
                      isDarkTheme ? "text-slate-400" : "text-slate-500"
                    )}
                  >
                    ❄ COLD
                  </button>
                </div>
              )}
            </div>

            {/* Assign Agent trigger */}
            <div className="relative">
              <button 
                title="Assign to Agent"
                onClick={() => {
                  setShowAgentSubmenu(!showAgentSubmenu)
                  setShowScoreSubmenu(false)
                }}
                className={cn(
                  "p-2 rounded-xl transition border cursor-pointer",
                  showAgentSubmenu 
                    ? isDarkTheme ? "bg-pink-600 text-white border-pink-500" : "bg-blue-600 text-white border-blue-500"
                    : isDarkTheme ? "bg-white/5 border-white/10 text-slate-200 hover:bg-white/10" : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200/75"
                )}
              >
                <UserPlus className="h-3.5 w-3.5" />
              </button>
              {showAgentSubmenu && (
                <div className={cn(
                  "absolute bottom-12 right-0 border p-1.5 rounded-xl shadow-lg flex flex-col gap-1 z-40 text-left min-w-[140px] backdrop-blur-xl",
                  isDarkTheme 
                    ? "bg-slate-900 border-white/10 text-white" 
                    : "bg-white border-slate-200 text-slate-800"
                )}>
                  <button 
                    onClick={() => {
                      onBulkAction('assign', null)
                      setShowAgentSubmenu(false)
                    }}
                    className={cn(
                      "px-2.5 py-1.5 hover:bg-white/5 dark:hover:bg-white/5 rounded-lg text-[10px] font-bold cursor-pointer",
                      isDarkTheme ? "text-slate-450" : "text-slate-600"
                    )}
                  >
                    Unassigned
                  </button>
                  {mockProfiles.map(p => (
                    <button 
                      key={p.id}
                      onClick={() => {
                        onBulkAction('assign', p.id)
                        setShowAgentSubmenu(false)
                      }}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-white/5 dark:hover:bg-white/5 rounded-lg text-[10px] font-bold cursor-pointer",
                        isDarkTheme ? "text-slate-300" : "text-slate-700"
                      )}
                    >
                      👤 {p.full_name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Archive / Cold */}
            <button 
              title="Archive Leads"
              onClick={() => onBulkAction('archive')}
              className={cn(
                "p-2 rounded-xl transition border cursor-pointer",
                isDarkTheme 
                  ? "bg-red-500/10 border-red-500/20 hover:bg-red-500/20 text-red-400" 
                  : "bg-red-50 border-red-100 hover:bg-red-100 text-red-650"
              )}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>

            {/* Clear selection */}
            <button 
              onClick={() => onBulkSelectChange([])}
              className={cn(
                "p-2 rounded-xl transition border cursor-pointer",
                isDarkTheme 
                  ? "bg-white/5 border-white/10 hover:bg-white/10 text-slate-400 hover:text-slate-200" 
                  : "bg-slate-100 border-slate-200 hover:bg-slate-200/75 text-slate-500 hover:text-slate-800"
              )}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
