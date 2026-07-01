'use client'

import { useState, useEffect } from 'react'
import { useLanguage, Language } from '@/lib/contexts/LanguageContext'
import { cn } from '@/lib/utils'

const LANGUAGES: { code: Language; flag: string; label: string }[] = [
  { code: 'fr', flag: '🇫🇷', label: 'FR' },
  { code: 'ar', flag: '🇩🇿', label: 'AR' },
  { code: 'en', flag: '🇬🇧', label: 'EN' },
]

interface LanguageSwitcherProps {
  /** When true, shows the flag emoji alongside the language code */
  showFlag?: boolean
  /** Extra CSS classes on the wrapper */
  className?: string
}

export function LanguageSwitcher({ showFlag = true, className }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div
      className={cn(
        'flex items-center gap-0.5 bg-slate-100 p-1 rounded-xl',
        className
      )}
      role="group"
      aria-label="Select language"
    >
      {LANGUAGES.map(({ code, flag, label }) => {
        const isActive = mounted ? (language === code) : (code === 'fr')
        return (
          <button
            key={code}
            onClick={() => setLanguage(code)}
            aria-pressed={isActive}
            title={`Switch to ${label}`}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition-all duration-150 cursor-pointer select-none',
              isActive
                ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-indigo-100'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            )}
          >
            {showFlag && <span className="text-[13px] leading-none">{flag}</span>}
            <span>{label}</span>
          </button>
        )
      })}
    </div>
  )
}
