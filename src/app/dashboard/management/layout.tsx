'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Car, Calendar, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ManagementLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const tabs = [
    {
      name: 'Car Sales (Vente)',
      href: '/dashboard/management/sales',
      icon: Car,
      color: 'text-red-600',
      activeColor: 'bg-white text-red-600 border-red-500/20'
    },
    {
      name: 'Car Rental (Location)',
      href: '/dashboard/management/rental',
      icon: Calendar,
      color: 'text-blue-600',
      activeColor: 'bg-white text-blue-600 border-blue-500/20'
    },
    {
      name: 'Car Import (Sur Command)',
      href: '/dashboard/management/import',
      icon: Globe,
      color: 'text-indigo-600',
      activeColor: 'bg-white text-indigo-600 border-indigo-500/20'
    }
  ]

  return (
    <div className="p-6 space-y-6 font-geist text-left bg-[#f8fafc] min-h-[calc(100vh-64px)] flex flex-col relative select-none">
      {/* Top Banner and Tabs */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs shrink-0">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-800 flex items-center gap-2">
            🚗 Dealership Operations & Fleet Management
          </h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Supercharge your car sales inventory, interactive rental bookings calendar, and importing shipping pipelines.
          </p>
        </div>

        {/* Dynamic sub-module navigation */}
        <div className="flex bg-slate-100 border p-1 rounded-xl gap-1 shrink-0 w-full xl:w-auto overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = pathname.startsWith(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex items-center justify-center gap-1.5 px-4 py-2.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap flex-1 xl:flex-none border border-transparent",
                  isActive 
                    ? tab.activeColor + " shadow-xs font-black border-slate-200/50" 
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                )}
              >
                <tab.icon className={cn("h-4 w-4 shrink-0", isActive ? tab.color : "text-slate-400")} />
                <span>{tab.name}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex flex-col">
        {children}
      </div>
    </div>
  )
}
