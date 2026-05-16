'use client'

import { PlatformIcon } from './PlatformIcon'
import { Platform } from '@/types/platform'
import clsx from 'clsx'

interface Props {
  platform: Platform | string
  className?: string
}

export function PlatformBadge({ platform, className }: Props) {
  const p = platform as Platform
  
  const styles: Record<Platform, string> = {
    whatsapp: 'bg-[#25D366]/10 text-[#25D366] border-[#25D366]/20',
    facebook: 'bg-[#0084FF]/10 text-[#0084FF] border-[#0084FF]/20',
    instagram: 'bg-gradient-to-r from-purple-600 to-pink-500 text-white border-none',
  }

  const labels: Record<Platform, string> = {
    whatsapp: 'via WhatsApp',
    facebook: 'via Messenger',
    instagram: 'via Instagram',
  }

  return (
    <div className={clsx(
      "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm",
      styles[p] || 'bg-slate-100 text-slate-500',
      className
    )}>
      <PlatformIcon platform={p} className={clsx("h-3 w-3", p === 'instagram' && "text-white")} />
      <span>{labels[p] || 'Platform'}</span>
    </div>
  )
}
