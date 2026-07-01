'use client'

import { useState } from 'react'
import { Check, Footprints, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export type ThemeId = 'sole-district'

export interface StoreTheme {
  id: ThemeId
  name: string
  tagline: string
  niche: string
  colors: {
    primary: string
    accent: string
    background: string
    surface: string
    text: string
    border: string
  }
  tags: string[]
}

export const STORE_THEMES: StoreTheme[] = [
  {
    id: 'sole-district',
    name: 'Sole District',
    tagline: 'A bold sneaker-store storefront built for product drops, live stock and fast ordering.',
    niche: 'Shoes & Sneakers',
    colors: {
      primary: '#ff4d00',
      accent: '#151515',
      background: '#f1f0ec',
      surface: '#ffffff',
      text: '#111111',
      border: '#d8d3ca',
    },
    tags: ['sneakers', 'drops', 'streetwear'],
  },
]

interface StoreThemeSelectorProps {
  currentThemeId?: ThemeId | null
  onApply: (theme: StoreTheme) => void | Promise<void>
}

export default function StoreThemeSelector({ currentThemeId, onApply }: StoreThemeSelectorProps) {
  const [applyingTheme, setApplyingTheme] = useState<ThemeId | null>(null)
  const theme = STORE_THEMES[0]
  const isActive = currentThemeId === theme.id || !currentThemeId
  const isApplying = applyingTheme === theme.id

  async function handleApply() {
    setApplyingTheme(theme.id)
    try {
      await onApply(theme)
    } finally {
      setApplyingTheme(null)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-orange-600" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-orange-600">One storefront theme</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-gray-950">Sole District</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
            One polished, unique online-store design focused on shoes, product drops, inventory confidence and checkout.
          </p>
        </div>
        <Badge className="w-fit rounded-md border-none bg-gray-950 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white">
          Active design
        </Badge>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="overflow-hidden rounded-2xl border-2 border-orange-500 bg-[#f1f0ec] shadow-[0_16px_45px_rgba(17,17,17,0.12)]">
          <div className="flex items-center justify-between border-b border-[#d8d3ca] bg-white px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff4d00] text-white">
                <Footprints className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-black text-gray-950">{theme.name}</p>
                <p className="text-xs font-semibold text-gray-500">{theme.niche}</p>
              </div>
            </div>
            {isActive && <Check className="h-5 w-5 text-orange-600" />}
          </div>

          <div className="grid gap-6 p-5 md:grid-cols-[0.9fr_1.1fr]">
            <div className="flex min-h-[260px] flex-col justify-between rounded-2xl bg-[#151515] p-6 text-white">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-400">Drop 06</p>
                <h3 className="mt-4 text-4xl font-black leading-none tracking-normal">Built for the next step.</h3>
                <p className="mt-4 text-sm leading-6 text-white/70">Hero sections, product cards and catalog filters tuned for footwear.</p>
              </div>
              <span className="mt-6 inline-flex w-fit rounded-xl bg-[#ff4d00] px-4 py-2 text-xs font-black text-white">Shop the drop</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[['Runner', '#ffffff'], ['Court', '#ffefe7'], ['Street', '#111111']].map(([name, color], index) => (
                <div key={name} className="rounded-2xl border border-[#d8d3ca] bg-white p-3">
                  <div className="flex aspect-[4/5] items-center justify-center rounded-xl border border-[#e8e3da]" style={{ backgroundColor: color }}>
                    <Footprints className={`h-8 w-8 ${index === 2 ? 'text-white' : 'text-orange-600'}`} />
                  </div>
                  <p className="mt-3 truncate text-xs font-black text-gray-950">{name}</p>
                  <p className="text-[11px] font-black text-orange-600">12 900 DZD</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#e8eaed] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">Palette</p>
          <div className="mt-4 flex gap-2">
            {Object.values(theme.colors).slice(0, 5).map((color) => (
              <span key={color} className="h-8 w-8 rounded-full border border-black/10" style={{ backgroundColor: color }} title={color} />
            ))}
          </div>
          <p className="mt-5 text-sm leading-6 text-gray-600">{theme.tagline}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {theme.tags.map((tag) => (
              <span key={tag} className="rounded-md bg-gray-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-gray-500">{tag}</span>
            ))}
          </div>
          <Button onClick={handleApply} disabled={isApplying} className="mt-6 h-10 w-full rounded-xl bg-gray-950 text-xs font-black text-white hover:bg-gray-800">
            {isApplying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            Use Sole District
          </Button>
        </div>
      </div>
    </div>
  )
}
