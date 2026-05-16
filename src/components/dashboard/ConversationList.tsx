'use client'

import { useState } from 'react'
import { Conversation } from '@/lib/mock-data'
import { ConversationCard } from './ConversationCard'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { NoConversationsState, NoFilterResultsState, NoSearchResultsState } from './EmptyStates'
import { PlatformFilter } from './PlatformFilter'

interface ConversationListProps {
  conversations: Conversation[]
  selectedId: string | null
  onSelect: (id: string) => void
}

type FilterType = 'ALL' | 'HOT' | 'WARM' | 'COLD'

export function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL')
  const [platformFilter, setPlatformFilter] = useState<string>('all')

  // Calculate counts
  const platformCounts = {
    all: conversations.length,
    whatsapp: conversations.filter(c => c.platform === 'whatsapp').length,
    facebook: conversations.filter(c => c.platform === 'facebook').length,
    instagram: conversations.filter(c => c.platform === 'instagram').length,
  }

  // Filter and sort
  const filtered = conversations.filter(c => {
    const matchesSearch = (c.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           c.customer_phone?.includes(searchQuery))
    const matchesScore = activeFilter === 'ALL' || c.lead_score === activeFilter
    const matchesPlatform = platformFilter === 'all' || c.platform === platformFilter
    return matchesSearch && matchesScore && matchesPlatform
  }).sort((a, b) => {
    // Sort by HOT first, then newest
    if (a.lead_score === 'HOT' && b.lead_score !== 'HOT') return -1
    if (b.lead_score === 'HOT' && a.lead_score !== 'HOT') return 1
    
    return new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime()
  })

  return (
    <div className="flex h-full flex-col border-r bg-white">
      <div className="p-4 border-b">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input 
            placeholder="Search conversations..." 
            className="pl-9 bg-slate-50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <PlatformFilter 
          activeFilter={platformFilter} 
          onFilterChange={setPlatformFilter} 
          counts={platformCounts}
        />

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button 
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${activeFilter === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            All Leads
          </button>
          <button 
            onClick={() => setActiveFilter('HOT')}
            className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors flex items-center gap-1 ${activeFilter === 'HOT' ? 'bg-red-500 text-white' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
          >
            <div className="h-2 w-2 rounded-full bg-current" /> HOT
          </button>
          <button 
            onClick={() => setActiveFilter('WARM')}
            className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors flex items-center gap-1 ${activeFilter === 'WARM' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}
          >
            <div className="h-2 w-2 rounded-full bg-current" /> WARM
          </button>
          <button 
            onClick={() => setActiveFilter('COLD')}
            className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors flex items-center gap-1 ${activeFilter === 'COLD' ? 'bg-slate-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            <div className="h-2 w-2 rounded-full bg-current" /> COLD
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <NoConversationsState />
        ) : filtered.length === 0 && searchQuery ? (
          <NoSearchResultsState query={searchQuery} />
        ) : filtered.length === 0 ? (
          <NoFilterResultsState filter={activeFilter} platform={platformFilter !== 'all' ? platformFilter : undefined} />
        ) : (
          filtered.map(conv => (
            <ConversationCard 
              key={conv.id} 
              conversation={conv} 
              isSelected={selectedId === conv.id}
              onClick={() => onSelect(conv.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
