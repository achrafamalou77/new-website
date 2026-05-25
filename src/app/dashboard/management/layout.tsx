'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export default function ManagementLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="p-6 font-geist text-left bg-slate-50/50 min-h-[calc(100vh-64px)] h-[calc(100vh-64px)] flex flex-col relative select-none overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[40%] rounded-full bg-red-200/10 blur-[100px] pointer-events-none animate-glow-1" style={{ transform: 'translate3d(0,0,0)' }} />
      <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[45%] rounded-full bg-blue-200/10 blur-[100px] pointer-events-none animate-glow-2" style={{ transform: 'translate3d(0,0,0)' }} />

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex flex-col relative z-10">
        {children}
      </div>
    </div>
  )
}
