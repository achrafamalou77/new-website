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

  return (
    <div className="flex h-full w-full flex-col bg-white text-left select-none relative">
      
      {/* Inbox Header Panel */}
      <div className="p-4 border-b border-slate-200/85 space-y-3.5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-slate-800 tracking-tight">Inbox</h2>
            <span className="text-[10px] font-black px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-full">
              {conversations.length}
            </span>
          </div>
          <button 
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`p-2 rounded-xl border transition-all ${
              showAdvancedFilters 
                ? 'bg-blue-50 border-blue-200 text-blue-600' 
                : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        {/* Search Console */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input 
            placeholder="Search guests..." 
            className="pl-9 pr-4 bg-slate-100/70 border-0 hover:bg-slate-100 focus:bg-white rounded-xl text-xs transition"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button 
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Selected Indicators bar */}
        {(activePlatform || activeScore) && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {activePlatform && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-50 border border-blue-100 text-blue-700 uppercase tracking-wider">
                {activePlatform === 'whatsapp' && <WhatsAppIcon className="h-3 w-3" />}
                {activePlatform === 'facebook' && <MessengerIcon className="h-3 w-3" />}
                {activePlatform === 'instagram' && <InstagramIcon className="h-3 w-3" />}
                {activePlatform}
                <button onClick={onClearPlatform} className="hover:text-blue-900 ml-0.5"><X className="h-3 w-3" /></button>
              </span>
            )}
            {activeScore && (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                activeScore === 'HOT' ? 'bg-red-50 border-red-200 text-red-700' :
                activeScore === 'WARM' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                'bg-slate-100 border-slate-200 text-slate-600'
              }`}>
                {activeScore === 'HOT' && <Flame className="h-3.5 w-3.5 text-red-500 animate-pulse" />}
                {activeScore === 'WARM' && <Sun className="h-3.5 w-3.5 text-amber-500" />}
                {activeScore === 'COLD' && <Snowflake className="h-3.5 w-3.5 text-slate-400" />}
                {activeScore}
                <button onClick={onClearScore} className="hover:text-slate-900 ml-0.5"><X className="h-3 w-3" /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Advanced Filter Popover Pane */}
      {showAdvancedFilters && (
        <div className="bg-slate-50 border-b border-slate-200 p-4 space-y-3 shrink-0 text-slate-750 z-20 shadow-inner">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Filter className="h-3 w-3 text-slate-400" /> Advanced Filters
            </h3>
            <button onClick={handleResetFilters} className="text-[10px] font-extrabold text-blue-600 hover:text-blue-800">
              Clear All
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Platform Select */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Platform</label>
              <select 
                value={advancedFilters.platform}
                onChange={(e) => onFiltersChange(prev => ({ ...prev, platform: e.target.value }))}
                className="w-full bg-white border border-slate-200 rounded-lg p-1.5 outline-none font-medium focus:border-blue-500 text-slate-700"
              >
                <option value="all">All</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="facebook">Messenger</option>
                <option value="instagram">Instagram</option>
              </select>
            </div>

            {/* Lead Score Select */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Lead Score</label>
              <select 
                value={advancedFilters.leadScore}
                onChange={(e) => onFiltersChange(prev => ({ ...prev, leadScore: e.target.value }))}
                className="w-full bg-white border border-slate-200 rounded-lg p-1.5 outline-none font-medium focus:border-blue-500 text-slate-700"
              >
                <option value="all">All</option>
                <option value="HOT">🔥 HOT</option>
                <option value="WARM">☀ WARM</option>
                <option value="COLD">❄ COLD</option>
              </select>
            </div>

            {/* Date Select */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Activity Date</label>
              <select 
                value={advancedFilters.date}
                onChange={(e) => onFiltersChange(prev => ({ ...prev, date: e.target.value }))}
                className="w-full bg-white border border-slate-200 rounded-lg p-1.5 outline-none font-medium focus:border-blue-500 text-slate-700"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
              </select>
            </div>

            {/* AI Status */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Handoff Mode</label>
              <select 
                value={advancedFilters.status}
                onChange={(e) => onFiltersChange(prev => ({ ...prev, status: e.target.value }))}
                className="w-full bg-white border border-slate-200 rounded-lg p-1.5 outline-none font-medium focus:border-blue-500 text-slate-700"
              >
                <option value="all">All</option>
                <option value="ai">AI Active</option>
                <option value="human">Human Agent</option>
                <option value="unread">Unread Only</option>
              </select>
            </div>

            {/* Assignee */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Assignee</label>
              <select 
                value={advancedFilters.assigneeId}
                onChange={(e) => onFiltersChange(prev => ({ ...prev, assigneeId: e.target.value }))}
                className="w-full bg-white border border-slate-200 rounded-lg p-1.5 outline-none font-medium focus:border-blue-500 text-slate-700"
              >
                <option value="all">All Agents</option>
                <option value="unassigned">Unassigned</option>
                {mockProfiles.map(p => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </select>
            </div>

            {/* Booking State */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Booking Made</label>
              <select 
                value={advancedFilters.hasBooking}
                onChange={(e) => onFiltersChange(prev => ({ ...prev, hasBooking: e.target.value }))}
                className="w-full bg-white border border-slate-200 rounded-lg p-1.5 outline-none font-medium focus:border-blue-500 text-slate-700"
              >
                <option value="all">All</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Header Row Selector */}
      {filtered.length > 0 && (
        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50 text-slate-500 text-xs">
          <button 
            onClick={handleToggleSelectAll}
            className="flex items-center gap-1.5 hover:text-slate-800 transition"
          >
            {isAllSelected ? (
              <CheckSquare className="h-4 w-4 text-blue-500" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            <span className="font-semibold">Select All ({filtered.length})</span>
          </button>
          
          {bulkSelectedIds.length > 0 && (
            <span className="font-extrabold text-[10px] text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
              {bulkSelectedIds.length} selected
            </span>
          )}
        </div>
      )}

      {/* Conversations List Scrollable Area */}
      <div 
        ref={parentRef}
        className="flex-1 overflow-y-auto p-2 bg-slate-50/10 relative"
      >
        {conversations.length === 0 ? (
          <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center h-full">
            <Search className="h-10 w-10 text-slate-350 mb-3" />
            <h3 className="text-xs font-bold text-slate-700 uppercase">No conversations yet</h3>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] leading-relaxed">
              When clients message you on WhatsApp or Instagram they will show here.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center h-full">
            <Filter className="h-10 w-10 text-slate-350 mb-3" />
            <h3 className="text-xs font-bold text-slate-700 uppercase">No results found</h3>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] leading-relaxed">
              We couldn't find matches for the selected criteria.
            </p>
            <button 
              onClick={handleResetFilters}
              className="mt-4 px-3.5 py-1.5 bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-black rounded-lg uppercase tracking-wider hover:bg-blue-100 transition"
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
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Floating Bulk Action Toolbar */}
      {bulkSelectedIds.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 bg-slate-900 border border-slate-800 text-white rounded-2xl p-3 shadow-xl flex items-center justify-between z-30 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
            {bulkSelectedIds.length} Selected
          </div>
          
          <div className="flex items-center gap-2 relative">
            {/* Mark read */}
            <button 
              title="Mark as Read"
              onClick={() => onBulkAction('read')}
              className="p-2 bg-slate-800 hover:bg-slate-750 rounded-xl transition text-slate-200"
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
                className={`p-2 rounded-xl transition text-slate-200 ${showScoreSubmenu ? 'bg-blue-600' : 'bg-slate-800 hover:bg-slate-750'}`}
              >
                <Flame className="h-3.5 w-3.5" />
              </button>
              {showScoreSubmenu && (
                <div className="absolute bottom-12 right-0 bg-slate-850 bg-slate-800 border border-slate-700 p-1.5 rounded-xl shadow-lg flex flex-col gap-1 z-40 text-left min-w-[100px]">
                  <button 
                    onClick={() => {
                      onBulkAction('score', 'HOT')
                      setShowScoreSubmenu(false)
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-slate-700 rounded-lg text-[10px] font-bold text-red-400"
                  >
                    🔥 HOT
                  </button>
                  <button 
                    onClick={() => {
                      onBulkAction('score', 'WARM')
                      setShowScoreSubmenu(false)
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-slate-700 rounded-lg text-[10px] font-bold text-amber-400"
                  >
                    ☀ WARM
                  </button>
                  <button 
                    onClick={() => {
                      onBulkAction('score', 'COLD')
                      setShowScoreSubmenu(false)
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-slate-700 rounded-lg text-[10px] font-bold text-slate-350 text-slate-300"
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
                className={`p-2 rounded-xl transition text-slate-200 ${showAgentSubmenu ? 'bg-blue-600' : 'bg-slate-800 hover:bg-slate-750'}`}
              >
                <UserPlus className="h-3.5 w-3.5" />
              </button>
              {showAgentSubmenu && (
                <div className="absolute bottom-12 right-0 bg-slate-850 bg-slate-800 border border-slate-700 p-1.5 rounded-xl shadow-lg flex flex-col gap-1 z-40 text-left min-w-[140px]">
                  <button 
                    onClick={() => {
                      onBulkAction('assign', null)
                      setShowAgentSubmenu(false)
                    }}
                    className="px-2.5 py-1.5 hover:bg-slate-700 rounded-lg text-[10px] font-bold text-slate-300"
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
                      className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-slate-700 rounded-lg text-[10px] font-bold text-slate-300"
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
              className="p-2 bg-red-950 hover:bg-red-900 rounded-xl transition text-red-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>

            {/* Clear selection */}
            <button 
              onClick={() => onBulkSelectChange([])}
              className="p-2 bg-slate-800 hover:bg-slate-755 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
