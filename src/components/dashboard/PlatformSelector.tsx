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
      activeClass: 'bg-slate-900 text-white shadow-md shadow-slate-300 ring-2 ring-slate-900 ring-offset-2', 
      hoverClass: 'text-slate-400 hover:text-slate-800 hover:bg-slate-50' 
    },
    { 
      id: 'whatsapp', 
      label: 'WhatsApp', 
      icon: WhatsAppIcon, 
      activeClass: 'bg-[#25D366] text-white shadow-md shadow-[#25D366]/30 ring-2 ring-[#25D366] ring-offset-2', 
      hoverClass: 'text-slate-400 hover:text-[#25D366] hover:bg-emerald-50/40',
      unread: unreadCounts.whatsapp 
    },
    { 
      id: 'facebook', 
      label: 'Messenger', 
      icon: MessengerIcon, 
      activeClass: 'bg-[#0084FF] text-white shadow-md shadow-[#0084FF]/30 ring-2 ring-[#0084FF] ring-offset-2', 
      hoverClass: 'text-slate-400 hover:text-[#0084FF] hover:bg-blue-50/40',
      unread: unreadCounts.facebook 
    },
    { 
      id: 'instagram', 
      label: 'Instagram', 
      icon: InstagramIcon, 
      activeClass: 'bg-gradient-to-tr from-[#fdf497] via-[#fd5949] to-[#d6249f] text-white shadow-md shadow-pink-500/20 ring-2 ring-pink-500 ring-offset-2', 
      hoverClass: 'text-slate-400 hover:text-[#d6249f] hover:bg-pink-50/30',
      unread: unreadCounts.instagram 
    }
  ]

  const scores = [
    { 
      id: 'HOT', 
      label: 'HOT Leads', 
      icon: Flame, 
      colorClass: 'text-red-500',
      activeClass: 'bg-red-50 border border-red-200 text-red-650 text-red-600 ring-2 ring-red-500 ring-offset-2', 
      hoverClass: 'text-slate-400 hover:text-red-500 hover:bg-red-50/30',
      unread: unreadCounts.hot 
    },
    { 
      id: 'WARM', 
      label: 'WARM Leads', 
      icon: Sun, 
      colorClass: 'text-amber-500',
      activeClass: 'bg-amber-50 border border-amber-200 text-amber-650 text-amber-600 ring-2 ring-amber-500 ring-offset-2', 
      hoverClass: 'text-slate-400 hover:text-amber-550 hover:text-amber-550 hover:bg-amber-50/30',
      unread: unreadCounts.warm 
    },
    { 
      id: 'COLD', 
      label: 'COLD Leads', 
      icon: Snowflake, 
      colorClass: 'text-blue-400',
      activeClass: 'bg-blue-50 border border-blue-200 text-blue-650 text-blue-600 ring-2 ring-blue-450 ring-2 ring-blue-500 ring-offset-2', 
      hoverClass: 'text-slate-400 hover:text-blue-500 hover:bg-blue-50/30',
      unread: unreadCounts.cold 
    }
  ]

  return (
    <div className="w-[80px] shrink-0 border-r border-slate-200/80 bg-white flex flex-col items-center py-5 space-y-6 h-full select-none">
      
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
                "relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 group outline-none",
                isActive 
                  ? platform.activeClass 
                  : platform.hoverClass
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
      <div className="w-8 h-[1px] bg-slate-200 shrink-0" />

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
                "relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 group outline-none",
                isActive 
                  ? score.activeClass 
                  : score.hoverClass
              )}
            >
              <Icon 
                className={cn(
                  "h-5 w-5 pointer-events-none transition-transform duration-300 group-hover:scale-110",
                  score.id === 'HOT' && !isActive && "text-red-500 animate-pulse",
                  score.id === 'HOT' && isActive && "text-red-650 text-red-600",
                  score.id === 'WARM' && !isActive && "text-amber-500 group-hover:animate-spin-slow",
                  score.id === 'WARM' && isActive && "text-amber-650 text-amber-600 animate-spin-slow",
                  score.id === 'COLD' && !isActive && "text-slate-400 group-hover:animate-bounce-short",
                  score.id === 'COLD' && isActive && "text-blue-600"
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
