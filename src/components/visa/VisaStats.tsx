'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { FileText, Hourglass, Landmark, CheckCircle, TrendingUp, AlertTriangle } from 'lucide-react'

interface VisaStatsProps {
  stats: {
    activeApplications: number;
    pendingDocuments: number;
    underReview: number;
    approvedThisMonth: number;
    revenue: number;
    ccpRevenue: number;
    cashRevenue: number;
  }
}

export function VisaStats({ stats }: VisaStatsProps) {
  const cards = [
    {
      title: 'Active Applications',
      value: stats.activeApplications,
      icon: FileText,
      color: 'from-amber-500/10 to-amber-600/10 border-amber-200 text-amber-600',
      description: 'In progress or being compiled'
    },
    {
      title: 'Pending Documents',
      value: stats.pendingDocuments,
      icon: AlertTriangle,
      color: 'from-red-500/10 to-red-600/10 border-red-200 text-red-600',
      description: 'Urgent attention required',
      pulse: true
    },
    {
      title: 'Under Review',
      value: stats.underReview,
      icon: Hourglass,
      color: 'from-blue-500/10 to-blue-600/10 border-blue-200 text-blue-600',
      description: 'Submitted to embassies'
    },
    {
      title: 'Approved This Month',
      value: stats.approvedThisMonth,
      icon: CheckCircle,
      color: 'from-emerald-500/10 to-emerald-600/10 border-emerald-200 text-emerald-600',
      description: 'Visa processes succeeded'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card 
            key={card.title} 
            className={`p-5 flex flex-col justify-between border bg-white rounded-2xl shadow-xs transition-all duration-300 hover:shadow-md hover:scale-[1.01]`}
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider">
                  {card.title}
                </span>
                <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                  {card.value}
                </h3>
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-tr ${card.color} ${card.pulse ? 'animate-pulse' : ''}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-4 font-medium flex items-center gap-1">
              {card.pulse && <span className="h-2 w-2 rounded-full bg-red-500 animate-ping inline-block" />}
              {card.description}
            </p>
          </Card>
        )
      })}

      {/* Revenue Card - Premium layout */}
      <Card 
        className="p-5 flex flex-col justify-between border bg-slate-900 border-slate-800 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.01] text-white lg:col-span-1 md:col-span-2"
      >
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Revenue from Visas
            </span>
            <h3 className="text-2xl font-black text-amber-400 tracking-tight">
              {stats.revenue.toLocaleString()} <span className="text-xs font-semibold">DZD</span>
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-tr from-amber-500/20 to-amber-600/20 border border-amber-500/30 text-amber-400">
            <Landmark className="h-5 w-5" />
          </div>
        </div>
        
        {/* CCP vs Cash split */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-400 font-semibold">
          <div className="flex flex-col">
            <span>CCP Transfer</span>
            <span className="text-white font-bold text-[11px] mt-0.5">{stats.ccpRevenue.toLocaleString()} DZD</span>
          </div>
          <div className="flex flex-col border-l border-slate-800 pl-2">
            <span>Cash / Desk</span>
            <span className="text-white font-bold text-[11px] mt-0.5">{stats.cashRevenue.toLocaleString()} DZD</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
