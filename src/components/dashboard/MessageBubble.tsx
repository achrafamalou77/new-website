'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Message } from '@/lib/mock-data'
import { format } from 'date-fns'
import { Bot, User, Lock, Play, Pause, Volume2 } from 'lucide-react'

interface MessageBubbleProps {
  message: Message
  platform: string
}

export function MessageBubble({ message, platform }: MessageBubbleProps) {
  const isInternalNote = message.content?.startsWith('[INTERNAL_NOTE]')
  const cleanContent = isInternalNote 
    ? message.content?.replace('[INTERNAL_NOTE]', '').trim() 
    : message.content

  const isCustomer = message.sender_type === 'customer'
  const isAi = message.sender_type === 'ai'
  
  // Extract voice note contents safely
  let transcript = cleanContent || ''
  let duration = '0:42'
  if (message.is_voice_note && cleanContent?.includes('Voice Note')) {
    const match = cleanContent.match(/\((.*?)\)\s*-\s*"(.*?)"/)
    if (match) {
      duration = match[1]
      transcript = match[2]
    }
  }

  // Voice note play state triggers (mocked visual waveform)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackProgress, setPlaybackProgress] = useState(0)

  // Simulate progress playback animation when active
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying) {
      interval = setInterval(() => {
        setPlaybackProgress(prev => {
          if (prev >= 100) {
            setIsPlaying(false)
            return 0
          }
          return prev + 5
        })
      }, 250)
    }
    return () => clearInterval(interval)
  }, [isPlaying])

  // Color mappings
  const voiceNoteColors: Record<string, string> = {
    whatsapp: 'bg-[#25D366] hover:bg-[#25D366]/90 shadow-[#25D366]/20',
    facebook: 'bg-[#0084FF] hover:bg-[#0084FF]/90 shadow-[#0084FF]/20',
    instagram: 'bg-gradient-to-tr from-[#fdf497] via-[#fd5949] to-[#d6249f]'
  }

  const playButtonColor = voiceNoteColors[platform] || 'bg-indigo-650'

  if (isInternalNote) {
    return (
      <div className="flex w-full mb-4 justify-center animate-in fade-in slide-in-from-top-1 duration-300">
        <div className="flex flex-col gap-2 px-4.5 py-3.5 text-xs bg-amber-50/90 border border-amber-250 border-amber-200 text-amber-955 rounded-2xl w-[90%] sm:w-[80%] shadow-xs text-left relative overflow-hidden select-none hover:bg-amber-50 transition duration-300">
          <div className="absolute right-0 top-0 h-10 w-10 text-amber-200/40 pointer-events-none flex items-center justify-center">
            <Lock className="h-6 w-6 stroke-[1.5]" />
          </div>
          
          <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-amber-600">
            <Lock className="h-3.5 w-3.5 animate-pulse" /> Private Team Note (Staff Only)
          </div>
          <p className="font-semibold text-amber-900 leading-relaxed text-xs">{cleanContent}</p>
          <div className="text-[9px] flex items-center justify-end gap-1.5 text-amber-500 font-extrabold mt-1 border-t border-amber-150 pt-1.5">
            <span>👤 Agent Note</span>
            <span>•</span>
            <span suppressHydrationWarning>{format(new Date(message.created_at || new Date()), 'HH:mm')}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex w-full mb-4", isCustomer ? "justify-start" : "justify-end")}>
      
      <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[70%] text-left">
        
        {/* Customer initials avatar (on left-aligned customer messages) */}
        {isCustomer && (
          <div className="h-6.5 w-6.5 rounded-full bg-slate-200 text-slate-600 font-extrabold text-[9px] flex items-center justify-center shrink-0 mb-1 ring-1 ring-slate-300/40">
            {message.sender_type?.substring(0, 1).toUpperCase() || 'C'}
          </div>
        )}

        <div className={cn(
          "flex flex-col gap-1.5 px-4 py-3 text-xs shadow-xs border transition duration-300",
          isCustomer 
            ? "bg-slate-100 text-slate-800 rounded-2xl rounded-tl-sm border-transparent hover:bg-slate-150" 
            : isAi 
            ? "bg-white text-slate-800 rounded-2xl rounded-tr-sm border-slate-200 shadow-xs hover:border-slate-300" 
            : "bg-indigo-600 text-white rounded-2xl rounded-tr-sm border-transparent hover:bg-indigo-650"
        )}>
          
          {/* AI Bot label header */}
          {isAi && (
            <div className="flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-0.5 select-none">
              <Bot className="h-3 w-3 animate-pulse" /> AI Assistant
            </div>
          )}

          {/* User Agent label header */}
          {message.sender_type === 'human' && (
            <div className="flex items-center gap-1 text-[9px] font-black text-indigo-200 uppercase tracking-widest mb-0.5 select-none">
              <User className="h-3 w-3" /> Live Agent
            </div>
          )}

          {message.is_voice_note ? (
            <div className="space-y-3 py-1.5 min-w-[220px] sm:min-w-[260px]">
              <div className="flex items-center gap-3 select-none">
                {/* Play button */}
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={cn(
                    "h-9 w-9 rounded-full flex items-center justify-center text-white shadow-md transition active:scale-90 duration-200 shrink-0",
                    playButtonColor
                  )}
                >
                  {isPlaying ? <Pause className="h-4.5 w-4.5" /> : <Play className="h-4.5 w-4.5 ml-0.5" />}
                </button>
                
                {/* Premium Interactive Visualizer Waveform */}
                <div className="flex-1 flex items-center gap-0.5 h-7 relative group cursor-pointer">
                  {[...Array(18)].map((_, i) => {
                    const h = [8, 14, 18, 10, 22, 16, 12, 24, 14, 20, 18, 10, 16, 12, 18, 8, 14, 6][i]
                    // Calculate if this bar was already played based on progress
                    const isPlayedBar = ((i / 18) * 100) <= playbackProgress

                    return (
                      <span 
                        key={i} 
                        style={{ height: `${h}px` }} 
                        className={cn(
                          "w-1 rounded-full transition-all duration-300", 
                          isCustomer
                            ? isPlayedBar 
                              ? "bg-indigo-500 scale-y-110" 
                              : "bg-slate-350"
                            : isAi
                            ? isPlayedBar
                              ? "bg-emerald-500 scale-y-110"
                              : "bg-slate-300"
                            : isPlayedBar
                            ? "bg-white scale-y-110"
                            : "bg-indigo-300/60"
                        )} 
                      />
                    )
                  })}
                </div>
                
                <span className={cn("text-[10px] font-bold tracking-tight select-none", isCustomer ? "text-slate-400" : "text-indigo-200")}>
                  {isPlaying ? `${Math.floor((playbackProgress/100) * 42)}s` : duration}
                </span>
              </div>
              
              {transcript && (
                <div className={cn(
                  "p-2.5 rounded-xl text-[10px] italic border text-left flex items-start gap-1.5",
                  isCustomer 
                    ? "bg-slate-50 border-slate-200/50 text-slate-500" 
                    : isAi
                    ? "bg-slate-50 border-slate-150 text-slate-500"
                    : "bg-indigo-700/30 border-transparent text-indigo-100"
                )}>
                  <Volume2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-slate-400" />
                  <span className="leading-relaxed">"{transcript}"</span>
                </div>
              )}
            </div>
          ) : (
            <p className="whitespace-pre-wrap leading-relaxed font-semibold">{cleanContent}</p>
          )}

          {/* Footer Metadata */}
          <div className={cn(
            "text-[9px] flex items-center justify-end gap-1.5 mt-0.5 font-extrabold select-none",
            isCustomer ? "text-slate-400" : isAi ? "text-slate-450" : "text-indigo-200"
          )}>
            <span suppressHydrationWarning>{format(new Date(message.created_at || new Date()), 'HH:mm')}</span>
            
            {/* Seen checkmarks */}
            {!isCustomer && (
              <span className="text-[10px] font-black text-blue-400">✓✓</span>
            )}
          </div>

        </div>

      </div>

    </div>
  )
}
