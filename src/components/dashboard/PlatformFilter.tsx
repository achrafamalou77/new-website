'use client'

import { Platform } from '@/types/platform'
import { PlatformIcon } from './PlatformIcon'
import clsx from 'clsx'

interface Props {
  activeFilter: string
  onFilterChange: (filter: string) => void
  counts: Record<string, number>
}

export function PlatformFilter({ activeFilter, onFilterChange, counts }: Props) {
  const filters = [
    { id: 'all', label: 'All' },
    { id: 'whatsapp', label: 'WhatsApp', icon: 'whatsapp' },
    { id: 'facebook', label: 'Messenger', icon: 'facebook' },
    { id: 'instagram', label: 'Instagram', icon: 'instagram' },
  ]

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mb-4">
      {filters.map((f) => (
        <button
          key={f.id}
          onClick={() => onFilterChange(f.id)}
          className={clsx(
            "flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-all border shadow-sm",
            activeFilter === f.id 
              ? "bg-slate-900 text-white border-slate-900 scale-105" 
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          )}
        >
          {f.icon && <PlatformIcon platform={f.icon} className="h-3.5 w-3.5" />}
          <span>{f.label}</span>
          <span className={clsx(
            "ml-1 px-1.5 py-0.5 rounded-full text-[10px]",
            activeFilter === f.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
          )}>
            {counts[f.id] || 0}
          </span>
        </button>
      ))}
    </div>
  )
}
