'use client'

import { MessageCircle, MessageSquare, Camera } from 'lucide-react'
import type { Platform } from '@/types/platform'
import clsx from 'clsx'
import type { ReactNode } from 'react'

interface Props {
  platform: Platform | string
  className?: string
}

const colors: Record<Platform, string> = {
  whatsapp: 'text-[#25D366]',
  facebook: 'text-[#0084FF]',
  instagram: 'text-purple-600',
}

export function PlatformIcon({ platform, className }: Props) {
  const p = platform as Platform
  
  const icons: Record<Platform, ReactNode> = {
    whatsapp: <MessageCircle className={clsx('h-full w-full', className)} />,
    facebook: <MessageSquare className={clsx('h-full w-full', className)} />,
    instagram: <Camera className={clsx('h-full w-full', className)} />,
  }

  return <span className={clsx(colors[p])}>{icons[p] ?? null}</span>
}
