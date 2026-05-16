import { Conversation } from '@/lib/mock-data'
import { PlatformIcon } from './PlatformIcon'
import { LeadScoreBadge } from './LeadScoreBadge'
import { Bot, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

const platformLabels: Record<string, string> = {
  whatsapp: 'WhatsApp',
  facebook: 'Messenger',
  instagram: 'Instagram',
}
function platformLabel(p: string | null) {
  return platformLabels[p || ''] || 'Platform'
}

interface ConversationCardProps {
  conversation: Conversation
  isSelected: boolean
  onClick: () => void
}

export function ConversationCard({ conversation, isSelected, onClick }: ConversationCardProps) {
  const timeAgo = formatDistanceToNow(new Date(conversation.last_message_at || new Date()), { addSuffix: true })
  const shortTimeAgo = timeAgo.replace('about ', '')

  const borderColors: Record<string, string> = {
    whatsapp: 'border-l-[#25D366]',
    facebook: 'border-l-[#0084FF]',
    instagram: 'border-l-purple-600',
  }

  return (
    <div 
      onClick={onClick}
      className={cn(
        "cursor-pointer border-b p-4 hover:bg-slate-50 transition-colors border-l-4",
        borderColors[conversation.platform || ''] || 'border-l-transparent',
        isSelected && "bg-blue-50/50 hover:bg-blue-50/80"
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <PlatformIcon platform={conversation.platform || ''} className="h-4 w-4 shrink-0" />
          <h4 className={cn("text-slate-900 truncate", isSelected ? "font-bold" : "font-semibold")}>
            {conversation.customer_name || conversation.customer_phone}
            <span className="text-[10px] text-slate-400 font-normal ml-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              — {platformLabel(conversation.platform)}
            </span>
          </h4>
        </div>
        <span className="text-xs text-slate-500 whitespace-nowrap shrink-0" suppressHydrationWarning>{shortTimeAgo}</span>
      </div>
      
      <p className="text-sm text-slate-600 line-clamp-1 mb-2">
        {conversation.lead_summary || "No recent messages"}
      </p>
      
      <div className="flex items-center justify-between mt-1">
        <LeadScoreBadge score={conversation.lead_score} />
        
        <div className="flex items-center gap-1 text-xs font-medium text-slate-500">
          {conversation.ai_status ? (
            <><Bot className="h-3 w-3 text-emerald-500" /> <span className="text-emerald-600">AI</span></>
          ) : (
            <><User className="h-3 w-3 text-blue-500" /> <span>Human</span></>
          )}
        </div>
      </div>
    </div>
  )
}
