import { cn } from '@/lib/utils'
import { Message } from '@/lib/mock-data'
import { VoiceNotePlayer } from './VoiceNotePlayer'
import { format } from 'date-fns'

import { Platform } from '@/types/platform'

export function MessageBubble({ message, platform }: { message: Message, platform: string }) {
  const isCustomer = message.sender_type === 'customer'
  const isAi = message.sender_type === 'ai'
  const p = platform as Platform
  
  // Extract duration/transcript for mock purposes from content if it's a voice note
  let transcript = message.content
  let duration = "0:15"
  if (message.is_voice_note && message.content?.includes('Voice Note')) {
    const match = message.content.match(/\((.*?)\)\s*-\s*"(.*?)"/)
    if (match) {
      duration = match[1]
      transcript = match[2]
    }
  }

  const platformBorderColors: Record<Platform, string> = {
    whatsapp: 'border-[#25D366]/30',
    facebook: 'border-[#0084FF]/30',
    instagram: 'border-purple-500/30',
  }

  const voiceNoteColors: Record<Platform, string> = {
    whatsapp: 'bg-[#25D366]',
    facebook: 'bg-[#0084FF]',
    instagram: 'bg-gradient-to-r from-purple-600 to-pink-500',
  }

  return (
    <div className={cn("flex w-full mb-4", isCustomer ? "justify-start" : "justify-end")}>
      <div className={cn(
        "flex max-w-[85%] sm:max-w-[75%] flex-col gap-1 rounded-2xl px-4 py-2 text-sm shadow-sm border",
        isCustomer ? "bg-white text-slate-800 rounded-tl-none" : 
        isAi ? "bg-emerald-50 text-emerald-900 rounded-tr-none border-emerald-100" : 
        "bg-white text-slate-900 rounded-tr-none",
        !isCustomer && !isAi && (platformBorderColors[p] || 'border-blue-100')
      )}>
        {message.is_voice_note ? (
          <VoiceNotePlayer 
            url={message.media_url} 
            duration={duration} 
            transcript={transcript} 
            colorClass={voiceNoteColors[p] || 'bg-blue-600'}
          />
        ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}
        <div className={cn(
          "text-[10px] flex items-center justify-end gap-1 mt-1",
          isCustomer ? "text-slate-400" : isAi ? "text-emerald-500/70" : "text-slate-400"
        )}>
          <span suppressHydrationWarning>{format(new Date(message.created_at || new Date()), 'HH:mm')}</span>
          {!isCustomer && <span className="font-semibold uppercase text-[9px] opacity-75">{message.sender_type}</span>}
        </div>
      </div>
    </div>
  )
}

