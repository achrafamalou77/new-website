'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Message } from '@/lib/mock-data'
import { format } from 'date-fns'
import { Bot, User, Lock, Play, Pause, Volume2 } from 'lucide-react'

interface MessageBubbleProps {
  message: any
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

  const getPlayButtonClass = () => {
    switch (platform) {
      case 'whatsapp':
        return 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/25 border border-emerald-400/20'
      case 'instagram':
        return 'bg-gradient-to-tr from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-md shadow-pink-500/25 border border-pink-400/20 animate-pulse'
      case 'facebook':
        return 'bg-blue-500 hover:bg-blue-600 text-white shadow-md shadow-blue-500/25 border border-blue-400/20'
      default:
        return 'bg-indigo-600 hover:bg-indigo-750 text-white shadow-md shadow-indigo-500/20'
    }
  }

  const getWaveformBarColor = (isPlayed: boolean) => {
    if (isPlayed) {
      switch (platform) {
        case 'whatsapp': return 'bg-emerald-500 scale-y-110 shadow-xs'
        case 'instagram': return 'bg-pink-400 scale-y-115 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
        case 'facebook': return 'bg-blue-500 scale-y-110'
        default: return 'bg-indigo-500 scale-y-110'
      }
    } else {
      switch (platform) {
        case 'instagram': return 'bg-white/20'
        case 'whatsapp': return 'bg-[#1f2c34]/20'
        default: return 'bg-slate-300/60'
      }
    }
  }

  const getBubbleClass = () => {
    if (isCustomer) {
      // Inbound Customer message
      switch (platform) {
        case 'whatsapp':
          return 'bg-white border border-[#e5ebed] shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] text-[#111b21] rounded-2xl rounded-tl-none'
        case 'instagram':
          return 'bg-slate-900/60 backdrop-blur-md border border-white/5 shadow-md text-slate-100 rounded-2xl rounded-tl-none'
        case 'facebook':
          return 'bg-[#f0f2f5]/90 backdrop-blur-xs border border-transparent shadow-xs text-slate-800 rounded-2xl rounded-tl-none'
        default:
          return 'bg-slate-100 border border-slate-200/40 text-slate-800 rounded-2xl rounded-tl-none shadow-xs'
      }
    } else {
      // Outbound (Human or AI)
      if (isAi) {
        switch (platform) {
          case 'instagram':
            return 'bg-purple-900/35 border border-purple-500/25 text-purple-100 rounded-2xl rounded-tr-none shadow-sm'
          case 'whatsapp':
            return 'bg-[#e7f7e2] border border-[#d3ecd0] text-[#1f2c34] rounded-2xl rounded-tr-none shadow-[0_1px_0.5px_rgba(0,0,0,0.13)]'
          case 'facebook':
            return 'bg-blue-500/10 border border-blue-500/20 text-blue-900 rounded-2xl rounded-tr-none shadow-xs'
          default:
            return 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tr-none shadow-xs'
        }
      } else {
        // Human Agent reply
        switch (platform) {
          case 'whatsapp':
            return 'bg-[#d9fdd3] border border-[#bcecb5] shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] text-[#1f2c34] rounded-2xl rounded-tr-none'
          case 'instagram':
            return 'bg-gradient-to-tr from-purple-600/35 via-pink-600/35 to-orange-500/35 backdrop-blur-md border border-pink-500/30 text-white rounded-2xl rounded-tr-none shadow-sm'
          case 'facebook':
            return 'bg-gradient-to-tr from-blue-600/25 to-sky-500/25 backdrop-blur-md border border-blue-500/30 text-blue-900 rounded-2xl rounded-tr-none shadow-sm'
          default:
            return 'bg-indigo-600 border border-indigo-700 text-white rounded-2xl rounded-tr-none shadow-xs'
        }
      }
    }
  }

  if (isInternalNote) {
    const isDark = platform === 'instagram'
    return (
      <div className="flex w-full mb-4 justify-center animate-in fade-in slide-in-from-top-1 duration-300">
        <div className={cn(
          "flex flex-col gap-2 px-5 py-4 text-xs rounded-2xl w-[90%] sm:w-[80%] shadow-md text-left relative overflow-hidden select-none transition duration-300 backdrop-blur-md border",
          isDark
            ? "bg-amber-500/5 border-amber-500/20 text-amber-250 hover:bg-amber-500/10 shadow-amber-500/5"
            : "bg-amber-50/60 border-amber-200/60 text-amber-900 hover:bg-amber-50/80 shadow-amber-100/20"
        )}>
          <div className={cn(
            "absolute right-0 top-0 h-12 w-12 pointer-events-none flex items-center justify-center",
            isDark ? "text-amber-500/15" : "text-amber-500/20"
          )}>
            <Lock className="h-7 w-7 stroke-[1.5]" />
          </div>
          
          <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-amber-500">
            <Lock className="h-3.5 w-3.5 animate-pulse" /> Private Team Note (Staff Only)
          </div>
          <p className={cn(
            "font-semibold leading-relaxed text-xs",
            isDark ? "text-amber-100" : "text-amber-950"
          )}>{cleanContent}</p>
          <div className={cn(
            "text-[9px] flex items-center justify-end gap-1.5 font-extrabold mt-1 border-t pt-1.5",
            isDark ? "text-amber-500 border-amber-500/10" : "text-amber-500 border-amber-200/30"
          )}>
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
          <div className={cn(
            "h-6.5 w-6.5 rounded-full font-extrabold text-[9px] flex items-center justify-center shrink-0 mb-1 ring-1",
            platform === 'instagram'
              ? "bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-500 text-white ring-white/10"
              : "bg-slate-200 text-slate-600 ring-slate-300/40"
          )}>
            {message.sender_type?.substring(0, 1).toUpperCase() || 'C'}
          </div>
        )}

        <div className={cn(
          "flex flex-col gap-1.5 px-4 py-3 text-xs transition duration-300 relative",
          getBubbleClass()
        )}>
          
          {/* Custom Platform specific tails */}
          {platform === 'whatsapp' && (
            isCustomer ? (
              <div className="absolute top-0 -left-1.5 w-3 h-3 bg-white border-l border-t border-[#e5ebed] [clip-path:polygon(100%_0,0_0,100%_100%)]" />
            ) : (
              <div className={cn(
                "absolute top-0 -right-1.5 w-3 h-3 [clip-path:polygon(0_0,100%_0,0_100%)]",
                isAi ? "bg-[#e7f7e2] border-r border-t border-[#d3ecd0]" : "bg-[#d9fdd3] border-r border-t border-[#c2f2bb]"
              )} />
            )
          )}
          
          {/* AI Bot label header */}
          {isAi && (
            <div className={cn(
              "flex items-center gap-1 text-[9px] font-black uppercase tracking-widest mb-0.5 select-none",
              platform === 'instagram' ? "text-pink-400" : "text-emerald-600"
            )}>
              <Bot className="h-3 w-3 animate-pulse" /> AI Assistant
            </div>
          )}

          {/* User Agent label header */}
          {message.sender_type === 'human' && (
            <div className={cn(
              "flex items-center gap-1 text-[9px] font-black uppercase tracking-widest mb-0.5 select-none",
              platform === 'instagram' ? "text-purple-300" : "text-indigo-400"
            )}>
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
                    "h-9 w-9 rounded-full flex items-center justify-center text-white transition active:scale-90 duration-200 shrink-0 cursor-pointer",
                    getPlayButtonClass()
                  )}
                >
                  {isPlaying ? <Pause className="h-4.5 w-4.5" /> : <Play className="h-4.5 w-4.5 ml-0.5" />}
                </button>
                
                {/* Premium Interactive Visualizer Waveform */}
                <div className="flex-1 flex items-center gap-0.5 h-7 relative group cursor-pointer">
                  {[...Array(18)].map((_, i) => {
                    const h = [8, 14, 18, 10, 22, 16, 12, 24, 14, 20, 18, 10, 16, 12, 18, 8, 14, 6][i]
                    const isPlayedBar = ((i / 18) * 100) <= playbackProgress

                    return (
                      <span 
                        key={i} 
                        style={{ height: `${h}px` }} 
                        className={cn(
                          "w-1 rounded-full transition-all duration-300", 
                          getWaveformBarColor(isPlayedBar)
                        )} 
                      />
                    )
                  })}
                </div>
                
                <span className={cn(
                  "text-[10px] font-bold tracking-tight select-none", 
                  isCustomer
                    ? platform === 'instagram' ? "text-slate-500" : "text-slate-400"
                    : platform === 'instagram' ? "text-purple-300" : "text-indigo-200"
                )}>
                  {isPlaying ? `${Math.floor((playbackProgress/100) * 42)}s` : duration}
                </span>
              </div>
              
              {transcript && (
                <div className={cn(
                  "p-2.5 rounded-xl text-[10px] italic border text-left flex items-start gap-1.5 backdrop-blur-xs",
                  platform === 'instagram'
                    ? "bg-white/5 border-white/5 text-slate-300"
                    : platform === 'whatsapp'
                    ? "bg-black/5 border-black/5 text-[#1f2c34]/70"
                    : "bg-blue-500/10 border-blue-500/10 text-blue-900/80"
                )}>
                  <Volume2 className={cn(
                    "h-3.5 w-3.5 shrink-0 mt-0.5",
                    platform === 'instagram' ? "text-slate-500" : "text-slate-400"
                  )} />
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
            isCustomer 
              ? platform === 'instagram' ? "text-slate-500" : "text-slate-400" 
              : isAi 
              ? platform === 'instagram' ? "text-purple-400/60" : "text-slate-450" 
              : platform === 'instagram' ? "text-pink-300/60" : "text-indigo-200"
          )}>
            <span suppressHydrationWarning>{format(new Date(message.created_at || new Date()), 'HH:mm')}</span>
            
            {/* Seen checkmarks */}
            {!isCustomer && (
              <span className="flex items-center shrink-0 ml-1">
                <svg className={cn(
                  "h-3.5 w-4",
                  platform === 'whatsapp' ? "text-sky-400" :
                  platform === 'instagram' ? "text-pink-400" :
                  "text-blue-400"
                )} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M2 12l5 5L20 4" className="opacity-60" />
                  <path d="M8 12l5 5L22 4" />
                </svg>
              </span>
            )}
          </div>

        </div>

      </div>

    </div>
  )
}
