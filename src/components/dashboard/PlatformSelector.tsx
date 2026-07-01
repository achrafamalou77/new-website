'use client'

import React from 'react'
import { Layers, Flame, Sun, Snowflake } from 'lucide-react'
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon'
import { MessengerIcon } from '@/components/icons/MessengerIcon'
import { InstagramIcon } from '@/components/icons/InstagramIcon'
import { cn } from '@/lib/utils'

interface PlatformSelectorProps {
  activePlatform: string | null
  activeScore: string | null
  onSelectPlatform: (platform: string | null) => void
  onSelectScore: (score: string | null) => void
  unreadCounts: {
    whatsapp: number
    facebook: number
    instagram: number
    hot: number
    warm: number
    cold: number
  }
}

export function PlatformSelector({
  activePlatform,
  activeScore,
  onSelectPlatform,
  onSelectScore,
  unreadCounts
}: PlatformSelectorProps) {
  
  const platforms = [
    { 
      id: 'all', 
      label: 'All Inbox', 
      icon: Layers, 
      activeClass: 'bg-slate-900 text-white shadow-[0_0_12px_rgba(15,23,42,0.2)]', 
      activeClassDark: 'bg-white text-slate-950 shadow-[0_0_15px_rgba(255,255,255,0.2)]',
      hoverClass: 'text-slate-400 hover:text-slate-700 hover:bg-white/60',
      hoverClassDark: 'text-slate-500 hover:text-white hover:bg-white/10' 
    },
    { 
      id: 'whatsapp', 
      label: 'WhatsApp', 
      icon: WhatsAppIcon, 
      activeClass: 'bg-[#25D366] text-white shadow-[0_0_15px_rgba(37,211,102,0.35)]', 
      activeClassDark: 'bg-[#25D366] text-white shadow-[0_0_20px_rgba(37,211,102,0.35)]', 
      hoverClass: 'text-slate-400 hover:text-[#25D366] hover:bg-[#25D366]/10',
      hoverClassDark: 'text-slate-500 hover:text-[#25D366] hover:bg-[#25D366]/15',
      unread: unreadCounts.whatsapp 
    },
    { 
      id: 'facebook', 
      label: 'Messenger', 
      icon: MessengerIcon, 
      activeClass: 'bg-[#0084FF] text-white shadow-[0_0_15px_rgba(0,132,255,0.35)]', 
      activeClassDark: 'bg-[#0084FF] text-white shadow-[0_0_20px_rgba(0,132,255,0.35)]',
      hoverClass: 'text-slate-400 hover:text-[#0084FF] hover:bg-[#0084FF]/10',
      hoverClassDark: 'text-slate-500 hover:text-[#0084FF] hover:bg-[#0084FF]/15',
      unread: unreadCounts.facebook 
    },
    { 
      id: 'instagram', 
      label: 'Instagram', 
      icon: InstagramIcon, 
      activeClass: 'bg-gradient-to-tr from-[#fdf497] via-[#fd5949] to-[#d6249f] text-white shadow-[0_0_15px_rgba(214,36,159,0.35)]', 
      activeClassDark: 'bg-gradient-to-tr from-[#fdf497] via-[#fd5949] to-[#d6249f] text-white shadow-[0_0_20px_rgba(214,36,159,0.35)]',
      hoverClass: 'text-slate-400 hover:text-pink-500 hover:bg-pink-500/10',
      hoverClassDark: 'text-slate-500 hover:text-pink-400 hover:bg-white/10',
      unread: unreadCounts.instagram 
    }
  ]

  const scores = [
    { 
      id: 'HOT', 
      label: 'HOT Leads', 
      icon: Flame, 
      colorClass: 'text-red-500',
      activeClass: 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] border border-transparent', 
      hoverClass: 'text-slate-400 hover:text-red-500 hover:bg-red-500/10',
      hoverClassDark: 'text-slate-500 hover:text-red-400 hover:bg-red-500/15',
      unread: unreadCounts.hot 
    },
    { 
      id: 'WARM', 
      label: 'WARM Leads', 
      icon: Sun, 
      colorClass: 'text-amber-500',
      activeClass: 'bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)] border border-transparent', 
      hoverClass: 'text-slate-400 hover:text-amber-500 hover:bg-amber-500/10',
      hoverClassDark: 'text-slate-500 hover:text-amber-400 hover:bg-amber-500/15',
      unread: unreadCounts.warm 
    },
    { 
      id: 'COLD', 
      label: 'COLD Leads', 
      icon: Snowflake, 
      colorClass: 'text-blue-400',
      activeClass: 'bg-sky-500 text-white shadow-[0_0_15px_rgba(14,165,233,0.4)] border border-transparent', 
      hoverClass: 'text-slate-400 hover:text-sky-500 hover:bg-sky-500/10',
      hoverClassDark: 'text-slate-500 hover:text-sky-400 hover:bg-sky-500/15',
      unread: unreadCounts.cold 
    }
  ]

  const isDarkTheme = activePlatform === 'instagram'

  return (
    <div className={cn(
      "w-[80px] shrink-0 flex flex-col items-center py-5 space-y-6 h-full select-none transition-all duration-500 z-10",
      isDarkTheme 
        ? "bg-slate-900/40 backdrop-blur-xl border-r border-white/5" 
        : "bg-white/30 backdrop-blur-xl border-r border-white/20"
    )}>
      
      {/* Platforms Segment */}
      <div className="flex flex-col items-center space-y-4 w-full">
        {platforms.map((platform) => {
          const isAll = platform.id === 'all'
          const isActive = isAll 
            ? activePlatform === null && activeScore === null
            : activePlatform === platform.id && activeScore === null
          
          const Icon = platform.icon

          return (
            <button
              key={platform.id}
              onClick={() => {
                onSelectPlatform(isAll ? null : platform.id)
                onSelectScore(null)
              }}
              className={cn(
                "relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 group outline-none cursor-pointer",
                isActive 
                  ? (isDarkTheme ? platform.activeClassDark : platform.activeClass) 
                  : (isDarkTheme ? platform.hoverClassDark : platform.hoverClass)
              )}
            >
              <Icon className="h-5 w-5 pointer-events-none group-hover:scale-110 transition-transform duration-300" />

              {/* Unread badge circle */}
              {!!platform.unread && (
                <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white shadow-sm ring-2 ring-white pointer-events-none animate-pulse">
                  {platform.unread}
                </span>
              )}

              {/* Pure Tailwind Hover Tooltip */}
              <div className="absolute left-16 scale-0 group-hover:scale-100 transition-all duration-200 bg-slate-900 text-white font-extrabold text-[9px] uppercase tracking-wider rounded-lg px-2.5 py-1.5 z-40 whitespace-nowrap pointer-events-none shadow-lg">
                {platform.label}
              </div>
            </button>
          )
        })}
      </div>

      {/* Divider line */}
      <div className={cn(
        "w-8 h-[1px] shrink-0 transition-colors duration-500",
        isDarkTheme ? "bg-white/10" : "bg-slate-200/50"
      )} />

      {/* Lead Scores Segment */}
      <div className="flex flex-col items-center space-y-4 w-full flex-1">
        {scores.map((score) => {
          const isActive = activeScore === score.id
          const Icon = score.icon

          return (
            <button
              key={score.id}
              onClick={() => {
                onSelectScore(score.id)
                onSelectPlatform(null)
              }}
              className={cn(
                "relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 group outline-none cursor-pointer",
                isActive 
                  ? score.activeClass 
                  : (isDarkTheme ? score.hoverClassDark : score.hoverClass)
              )}
            >
              <Icon 
                className={cn(
                  "h-5 w-5 pointer-events-none transition-transform duration-300 group-hover:scale-110",
                  score.id === 'HOT' && !isActive && "text-red-500 animate-pulse",
                  score.id === 'HOT' && isActive && "text-white",
                  score.id === 'WARM' && !isActive && "text-amber-500 group-hover:animate-spin-slow",
                  score.id === 'WARM' && isActive && "text-white animate-spin-slow",
                  score.id === 'COLD' && !isActive && "text-slate-400 group-hover:animate-bounce-short",
                  score.id === 'COLD' && isActive && "text-white"
                )} 
              />

              {/* Unread badge circle */}
              {!!score.unread && (
                <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white shadow-sm ring-2 ring-white pointer-events-none">
                  {score.unread}
                </span>
              )}

              {/* Pure Tailwind Hover Tooltip */}
              <div className="absolute left-16 scale-0 group-hover:scale-100 transition-all duration-200 bg-slate-900 text-white font-extrabold text-[9px] uppercase tracking-wider rounded-lg px-2.5 py-1.5 z-40 whitespace-nowrap pointer-events-none shadow-lg">
                {score.label}
              </div>
            </button>
          )
        })}
      </div>

    </div>
  )
}
