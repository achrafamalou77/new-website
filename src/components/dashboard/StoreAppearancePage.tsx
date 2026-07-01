'use client'

import { useState, useTransition } from 'react'
import { Check, Footprints, Loader2 } from 'lucide-react'
import { updateEcommerceStoreTheme } from '@/app/actions/ecommerce'

const THEME_ID = 'sole-district'

interface Props {
  currentTheme: string
}

export default function StoreAppearancePage({ currentTheme }: Props) {
  const [saved, setSaved] = useState(currentTheme === THEME_ID ? THEME_ID : '')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const isSaved = saved === THEME_ID

  function handleSave() {
    setError('')
    setSuccess(false)
    startTransition(async () => {
      const result = await updateEcommerceStoreTheme(THEME_ID)
      if (!result.success) {
        setError(result.error || 'Erreur inconnue')
        return
      }
      setSaved(THEME_ID)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    })
  }

  return (
    <main className="min-h-screen bg-[#f1f0ec]">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#d8d3ca] bg-white px-6 py-5 lg:px-8">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-600">Apparence de la boutique</p>
          <h1 className="mt-1 text-2xl font-black tracking-normal text-slate-950">Sole District</h1>
          <p className="mt-1 text-sm text-slate-500">Un seul theme complet, unique et specialise pour une boutique de chaussures.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={pending || isSaved}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-5 text-xs font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {isSaved ? 'Theme actif' : 'Appliquer le theme'}
        </button>
      </header>

      {error && <div className="mx-6 mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 lg:mx-8">{error}</div>}
      {success && <div className="mx-6 mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 lg:mx-8">Theme applique avec succes.</div>}

      <section className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:p-8">
        <div className="overflow-hidden rounded-2xl border-2 border-orange-500 bg-white shadow-[0_18px_55px_rgba(17,17,17,0.14)]">
          <div className="flex items-center justify-between border-b border-[#d8d3ca] px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff4d00] text-white">
                <Footprints className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-black text-slate-950">Sole District</p>
                <p className="text-xs font-semibold text-slate-500">Shoes & Sneakers</p>
              </div>
            </div>
            <span className="rounded-md bg-slate-950 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">One perfect theme</span>
          </div>

          <div className="grid gap-6 bg-[#f1f0ec] p-5 md:grid-cols-[0.9fr_1.1fr]">
            <div className="flex min-h-[320px] flex-col justify-between rounded-2xl bg-[#151515] p-7 text-white">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-400">Drop 06</p>
                <h2 className="mt-5 max-w-sm text-5xl font-black leading-none tracking-normal">Built for the next step.</h2>
                <p className="mt-5 max-w-sm text-sm leading-6 text-white/70">Designed for footwear stores with bold product drops, live availability and fast checkout.</p>
              </div>
              <span className="mt-8 inline-flex w-fit rounded-xl bg-[#ff4d00] px-5 py-3 text-xs font-black text-white">Shop the drop</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[['Runner', '#ffffff'], ['Court', '#ffefe7'], ['Street', '#111111']].map(([name, color], index) => (
                <div key={name} className="rounded-2xl border border-[#d8d3ca] bg-white p-3">
                  <div className="flex aspect-[4/5] items-center justify-center rounded-xl border border-[#e8e3da]" style={{ backgroundColor: color }}>
                    <Footprints className={`h-9 w-9 ${index === 2 ? 'text-white' : 'text-orange-600'}`} />
                  </div>
                  <p className="mt-3 truncate text-xs font-black text-slate-950">{name}</p>
                  <p className="text-[11px] font-black text-orange-600">12 900 DZD</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="rounded-2xl border border-[#d8d3ca] bg-white p-5">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">What stays</p>
          <ul className="mt-4 space-y-3 text-sm font-semibold leading-6 text-slate-600">
            <li>Bold shoe-store homepage</li>
            <li>Drop-focused product grid</li>
            <li>Orange, black and warm neutral palette</li>
            <li>Mobile-ready catalog and cart</li>
          </ul>
        </aside>
      </section>
    </main>
  )
}
