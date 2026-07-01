'use client'
// src/components/website/showroom/ShowroomSubPage.tsx
// Shared premium sub-page shell used by /stock, /location, /contact, /commande
// Same dark Toyota-level design as ShowroomPublicSite.tsx

import { useState, useEffect, useRef } from 'react'
import type { ShowroomBuilderConfig } from '@/lib/car-showroom-builder-template'
import {
  Phone, MessageSquare, Mail, MapPin, Car, Key,
  Star, ChevronRight, X, Send, Check, Menu, ArrowRight,
  Ship, ArrowLeft, Search, SlidersHorizontal, Calculator,
  GitBranch, Zap
} from 'lucide-react'

// ─── TYPES ─────────────────────────────────────────────────────────────────────
type PageType = 'stock' | 'location' | 'contact' | 'commande'

interface ShowroomSubPageProps {
  config: ShowroomBuilderConfig
  agency: any
  pageType: PageType
  cars: any[]
}

// ─── HELPERS ───────────────────────────────────────────────────────────────────
function fmt(n: number) { return n.toLocaleString('fr-DZ') + ' DA' }

const fobCurrencies = [
  { label: 'EUR', code: 'EUR', rate: 147 },
  { label: 'USD', code: 'USD', rate: 135 },
  { label: 'AED', code: 'AED', rate: 36.8 },
]

function calcDedouanement(fobDZD: number, year: number, licence: string) {
  const age = new Date().getFullYear() - year
  const dd = age <= 1 ? 0.05 : age <= 2 ? 0.10 : 0.20
  const tva = 0.19; const taic = 0.02; const timbre = 15000
  const total = fobDZD * (1 + dd + tva + taic) + timbre
  const discount = licence === 'moudjahid' ? total * 0.40 : 0
  return {
    dd: Math.round(fobDZD * dd),
    tva: Math.round(fobDZD * tva),
    taic: Math.round(fobDZD * taic),
    timbre,
    total: Math.round(total),
    discount: Math.round(discount),
    net: Math.round(total - discount),
    fob: fobDZD
  }
}

// ─── CAR DETAIL MODAL ─────────────────────────────────────────────────────────
function CarModal({ car, global, onClose }: {
  car: any
  global: ShowroomBuilderConfig['global']
  onClose: () => void
}) {
  const name = `${car.brand || ''} ${car.model || ''}`.trim()
  const images: string[] = car.images?.length
    ? car.images
    : [car.cover_image_url].filter(Boolean)
  const [activeImg, setActiveImg] = useState(0)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handler)
    }
  }, [onClose])

  const fallback = 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=900&q=80'

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl max-h-[92vh] rounded-3xl overflow-y-auto"
        style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 40px 120px rgba(0,0,0,0.8)' }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-20 p-2.5 rounded-full bg-black/70 border border-white/15 text-white hover:bg-white/10 transition backdrop-blur-sm"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid md:grid-cols-2 gap-0">
          {/* Images */}
          <div className="relative bg-black">
            <div className="relative h-72 md:h-96">
              <img
                src={images[activeImg] || fallback}
                alt={name}
                className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).src = fallback }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 p-4 overflow-x-auto bg-black">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`flex-shrink-0 h-14 w-20 rounded-xl overflow-hidden border-2 transition-all ${i === activeImg ? 'opacity-100' : 'opacity-50'}`}
                    style={{ borderColor: i === activeImg ? global.primaryColor : 'rgba(255,255,255,0.1)' }}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="p-7 space-y-5 text-white overflow-y-auto">
            <div>
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-3 text-white"
                style={{ background: global.primaryColor }}
              >
                {car.car_type === 'sur_command' ? 'Sur Commande' : car.car_type === 'rental' ? 'Location' : 'En Stock'}
              </span>
              <h2 className="text-3xl font-black tracking-tight" style={{ fontFamily: global.fontFamily }}>
                {name}
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                {car.year} · {car.condition === 'new' ? 'Neuf' : 'Occasion'}
              </p>
            </div>

            {/* Specs grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { l: 'Carburant', v: car.fuel_type },
                { l: 'Transmission', v: car.transmission },
                { l: 'Kilométrage', v: car.mileage === 0 ? '0 km (Neuf)' : car.mileage ? `${Number(car.mileage).toLocaleString()} km` : null },
                { l: 'Couleur', v: car.color },
                { l: 'Origine', v: car.import_type === 'local' ? 'Local' : car.import_type ? 'Importé' : null },
              ].filter(s => s.v).map((spec, i) => (
                <div key={i} className="rounded-2xl p-3.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">{spec.l}</div>
                  <div className="text-sm font-black text-white mt-1 capitalize">{spec.v}</div>
                </div>
              ))}
            </div>

            {/* Price */}
            {(car.selling_price || car.daily_rate) && (
              <div
                className="rounded-2xl p-5"
                style={{ background: `${global.primaryColor}15`, border: `1px solid ${global.primaryColor}30` }}
              >
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">
                  {car.daily_rate && !car.selling_price ? 'Tarif journalier' : 'Prix de vente'}
                </div>
                <div className="text-4xl font-black mt-2" style={{ color: global.primaryColor }}>
                  {(car.selling_price || car.daily_rate)?.toLocaleString('fr-DZ')} DA
                  {car.daily_rate && !car.selling_price && <span className="text-lg font-bold text-slate-400">/jour</span>}
                </div>
              </div>
            )}

            {car.description && (
              <p className="text-sm text-slate-400 leading-relaxed border-t border-white/6 pt-4">{car.description}</p>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <a
                href={`tel:${global.phone}`}
                className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white border border-white/15 hover:bg-white/8 transition-all"
              >
                <Phone className="h-4 w-4" /> Appeler
              </a>
              {global.whatsapp && (
                <a
                  href={`https://wa.me/${global.whatsapp.replace(/\D/g, '')}?text=Bonjour%2C%20je%20suis%20intéressé%20par%20la%20${encodeURIComponent(name)}%20(${car.year}).`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm text-white transition-all hover:brightness-110"
                  style={{ background: '#25D366' }}
                >
                  <MessageSquare className="h-4 w-4" /> WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── CAR CARD ─────────────────────────────────────────────────────────────────
function CarCard({ car, global, onClick }: {
  car: any
  global: ShowroomBuilderConfig['global']
  onClick: () => void
}) {
  const image = car.cover_image_url || (car.images?.[0]) || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80'
  const name = `${car.brand || ''} ${car.model || ''}`.trim()
  const price = car.selling_price || car.daily_rate
  const isRental = !!car.daily_rate && !car.selling_price

  return (
    <div
      className="group relative rounded-3xl overflow-hidden border cursor-pointer transition-all duration-400 hover:-translate-y-2 hover:shadow-2xl"
      style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}
      onClick={onClick}
    >
      <div className="relative h-56 overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <div className="absolute top-4 left-4">
          <span
            className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white"
            style={{ background: car.car_type === 'sur_command' ? '#f59e0b' : global.primaryColor }}
          >
            {car.car_type === 'sur_command' ? 'Sur Commande' : isRental ? 'Location' : 'En Stock'}
          </span>
        </div>

        <div className="absolute top-4 right-4">
          <span className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-sm border border-white/20">
            {car.year}
          </span>
        </div>

        {price ? (
          <div className="absolute bottom-4 left-4">
            <div className="text-xl font-black text-white">
              {price.toLocaleString('fr-DZ')} DA{isRental && <span className="text-sm font-bold opacity-70">/jour</span>}
            </div>
          </div>
        ) : (
          <div className="absolute bottom-4 left-4">
            <div className="text-sm font-bold text-white/70">Prix sur demande</div>
          </div>
        )}
      </div>

      <div className="p-5 space-y-4">
        <div>
          <h3 className="font-black text-[15px] text-white leading-tight">{name || 'Véhicule'}</h3>
          <div className="flex flex-wrap gap-3 mt-2">
            {car.fuel_type && <span className="text-[11px] font-semibold text-slate-400">⛽ {car.fuel_type}</span>}
            {car.transmission && <span className="text-[11px] font-semibold text-slate-400">⚙️ {car.transmission}</span>}
            {car.mileage !== undefined && (
              <span className="text-[11px] font-semibold text-slate-400">
                📍 {car.mileage === 0 ? 'Neuf' : `${Number(car.mileage).toLocaleString()} km`}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <button
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-[12px] font-black text-white transition-all hover:brightness-110"
            style={{ background: global.primaryColor }}
          >
            Voir les détails <ChevronRight className="h-3.5 w-3.5" />
          </button>
          {global.whatsapp && (
            <a
              href={`https://wa.me/${global.whatsapp.replace(/\D/g, '')}?text=Bonjour%2C%20je%20suis%20intéressé%20par%20la%20${encodeURIComponent(name)}%20(${car.year}).`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="p-2.5 rounded-2xl text-white flex-shrink-0 transition hover:brightness-110"
              style={{ background: '#25D366' }}
            >
              <MessageSquare className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── CAR GRID with FILTERS ────────────────────────────────────────────────────
function CarGrid({ cars, global, isRental }: {
  cars: any[]
  global: ShowroomBuilderConfig['global']
  isRental: boolean
}) {
  const [search, setSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState('all')
  const [selectedCar, setSelectedCar] = useState<any>(null)

  const brands = ['all', ...Array.from(new Set(cars.map(c => c.brand).filter(Boolean)))]

  const filtered = cars.filter(car => {
    const name = `${car.brand} ${car.model} ${car.year}`.toLowerCase()
    const matchSearch = !search || name.includes(search.toLowerCase())
    const matchBrand = brandFilter === 'all' || car.brand === brandFilter
    return matchSearch && matchBrand
  })

  return (
    <div className="space-y-8">
      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div
          className="flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl border"
          style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}
        >
          <Search className="h-4 w-4 text-slate-500 flex-shrink-0" />
          <input
            type="text"
            placeholder="Rechercher marque, modèle..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-slate-500 hover:text-white transition">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SlidersHorizontal className="h-4 w-4 text-slate-500" />
          {brands.map(brand => (
            <button
              key={brand}
              onClick={() => setBrandFilter(brand)}
              className="px-4 py-2 rounded-xl text-[11px] font-bold transition-all"
              style={brandFilter === brand
                ? { background: global.primaryColor, color: '#fff', boxShadow: `0 4px 16px ${global.primaryColor}40` }
                : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }
              }
            >
              {brand === 'all' ? 'Toutes' : brand}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-slate-500 font-medium">
        <span style={{ color: global.primaryColor }} className="font-black">{filtered.length}</span> véhicule{filtered.length > 1 ? 's' : ''} trouvé{filtered.length > 1 ? 's' : ''}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-24 space-y-4">
          <div className="text-6xl opacity-20">{isRental ? '🔑' : '🚗'}</div>
          <p className="text-slate-500 text-base font-semibold">Aucun véhicule trouvé</p>
          <p className="text-slate-600 text-sm">Modifiez vos critères ou contactez-nous directement.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-7">
          {filtered.map(car => (
            <CarCard key={car.id} car={car} global={global} onClick={() => setSelectedCar(car)} />
          ))}
        </div>
      )}

      {selectedCar && <CarModal car={selectedCar} global={global} onClose={() => setSelectedCar(null)} />}
    </div>
  )
}

// ─── CONTACT FORM ─────────────────────────────────────────────────────────────
function ContactContent({ global }: { global: ShowroomBuilderConfig['global'] }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', subject: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    await new Promise(r => setTimeout(r, 800))
    const msg = `Bonjour%20${encodeURIComponent(global.companyName)}%20!%0A%0A*Nom:*%20${encodeURIComponent(form.name)}%0A*Tél:*%20${encodeURIComponent(form.phone)}%0A*Email:*%20${encodeURIComponent(form.email)}%0A*Sujet:*%20${encodeURIComponent(form.subject)}%0A%0A*Message:*%0A${encodeURIComponent(form.message)}`
    if (global.whatsapp) {
      window.open(`https://wa.me/${global.whatsapp.replace(/\D/g, '')}?text=${msg}`, '_blank')
    }
    setSent(true)
    setSending(false)
  }

  return (
    <div className="grid lg:grid-cols-5 gap-12">
      {/* Info */}
      <div className="lg:col-span-2 space-y-6">
        <div className="space-y-5">
          {[
            { icon: Phone, label: 'Téléphone', value: global.phone, href: `tel:${global.phone}` },
            { icon: MessageSquare, label: 'WhatsApp', value: global.whatsapp, href: `https://wa.me/${global.whatsapp?.replace(/\D/g, '')}`, color: '#25D366' },
            { icon: Mail, label: 'Email', value: global.email, href: `mailto:${global.email}` },
            { icon: MapPin, label: 'Adresse', value: global.address, href: undefined },
          ].filter(item => item.value).map((item, i) => {
            const Ico = item.icon
            const content = (
              <div className="flex items-start gap-4 group">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                  style={{ background: `${item.color || global.primaryColor}20`, color: item.color || global.primaryColor }}
                >
                  <Ico className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wide mb-1">{item.label}</div>
                  <div className="text-base font-semibold text-white leading-relaxed">{item.value}</div>
                </div>
              </div>
            )
            return item.href ? (
              <a key={i} href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
                {content}
              </a>
            ) : (
              <div key={i}>{content}</div>
            )
          })}
        </div>

        {/* Socials */}
        {(global.socialFacebook || global.socialInstagram) && (
          <div className="flex gap-3 pt-4 border-t border-white/8">
            {global.socialFacebook && (
              <a href={global.socialFacebook} target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl flex items-center justify-center opacity-60 hover:opacity-100 transition-all hover:scale-110"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'white' }}>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
              </a>
            )}
            {global.socialInstagram && (
              <a href={global.socialInstagram} target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl flex items-center justify-center opacity-60 hover:opacity-100 transition-all hover:scale-110"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'white' }}>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
              </a>
            )}
          </div>
        )}
      </div>

      {/* Form */}
      <div
        className="lg:col-span-3 rounded-3xl p-8 space-y-5"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {sent ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: `${global.primaryColor}20`, color: global.primaryColor }}>
              <Check className="h-8 w-8" />
            </div>
            <div className="text-xl font-black text-white">Message envoyé !</div>
            <div className="text-sm text-slate-500">Nous vous répondrons très prochainement.</div>
            <button onClick={() => setSent(false)} className="text-sm underline text-slate-500 hover:text-white transition mt-4">
              Envoyer un autre message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Nom complet *</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-2xl px-4 py-3 text-sm focus:outline-none placeholder-white/20"
                  placeholder="Votre nom" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Téléphone *</label>
                <input required type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-2xl px-4 py-3 text-sm focus:outline-none placeholder-white/20"
                  placeholder="+213 5XX XX XX XX" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 text-white rounded-2xl px-4 py-3 text-sm focus:outline-none placeholder-white/20"
                placeholder="votre@email.com" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Sujet</label>
              <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 text-white rounded-2xl px-4 py-3 text-sm focus:outline-none placeholder-white/20"
                placeholder="Ex: Demande de prix Hyundai Tucson 2026" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Message *</label>
              <textarea required rows={4} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 text-white rounded-2xl px-4 py-3 text-sm focus:outline-none placeholder-white/20 resize-none"
                placeholder="Décrivez votre projet..." />
            </div>
            <button
              type="submit" disabled={sending}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-white text-sm transition-all hover:scale-[1.02] disabled:opacity-60"
              style={{ background: `linear-gradient(135deg, ${global.primaryColor}, ${global.secondaryColor})`, boxShadow: `0 8px 32px ${global.primaryColor}30` }}
            >
              {sending ? (
                <><div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Envoi...</>
              ) : (
                <><Send className="h-4 w-4" />Envoyer le message</>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// ─── IMPORT CALCULATOR ────────────────────────────────────────────────────────
function CommandeContent({ global }: { global: ShowroomBuilderConfig['global'] }) {
  const [fobAmount, setFobAmount] = useState(5000)
  const [currency, setCurrency] = useState(fobCurrencies[0])
  const [carYear, setCarYear] = useState(2024)
  const [licence, setLicence] = useState('normal')

  const fobDZD = Math.round(fobAmount * currency.rate)
  const result = calcDedouanement(fobDZD, carYear, licence)

  const steps = [
    { n: '01', t: 'Choix du modèle', d: 'Configurez le véhicule de vos rêves en nous donnant la marque, le modèle et les options souhaitées.' },
    { n: '02', t: 'Validation & Acompte', d: "Signature du contrat d'importation et versement de l'acompte pour lancer la commande." },
    { n: '03', t: 'Achat & Transit', d: "Achat du véhicule en Europe et transport maritime sécurisé vers le port d'Alger." },
    { n: '04', t: 'Dédouanement & Livraison', d: 'Prise en charge des formalités douanières et remise des clés clé-en-main.' },
  ]

  return (
    <div className="space-y-16">
      {/* Calculator */}
      <div
        className="max-w-4xl mx-auto rounded-3xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
      >
        <div className="grid md:grid-cols-2">
          {/* Inputs */}
          <div className="p-8 space-y-6 border-r border-white/6">
            <div className="text-xs font-black uppercase tracking-widest text-slate-500">Paramètres</div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Devise</label>
              <div className="grid grid-cols-3 gap-2">
                {fobCurrencies.map(c => (
                  <button key={c.code} onClick={() => setCurrency(c)}
                    className="py-2 rounded-xl text-xs font-black transition-all"
                    style={currency.code === c.code
                      ? { background: global.primaryColor, color: '#fff' }
                      : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }
                    }
                  >{c.code}</button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Prix FOB ({currency.code})</label>
              <input type="number" value={fobAmount}
                onChange={e => setFobAmount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-white/6 border border-white/10 text-white font-black text-xl rounded-2xl px-4 py-3.5 focus:outline-none"
              />
              <div className="text-[11px] text-slate-600">≈ {fobDZD.toLocaleString('fr-DZ')} DA</div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Année</label>
              <select value={carYear} onChange={e => setCarYear(parseInt(e.target.value))}
                className="w-full bg-white/6 border border-white/10 text-white font-bold rounded-2xl px-4 py-3 text-sm focus:outline-none"
              >
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Statut</label>
              <div className="grid grid-cols-2 gap-2">
                {[{ v: 'normal', l: 'Normal' }, { v: 'moudjahid', l: 'Moudjahid −40%' }].map(o => (
                  <button key={o.v} onClick={() => setLicence(o.v)}
                    className="py-2.5 rounded-xl text-xs font-black transition-all"
                    style={licence === o.v
                      ? { background: global.primaryColor, color: '#fff' }
                      : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }
                    }
                  >{o.l}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="p-8 space-y-4">
            <div className="text-xs font-black uppercase tracking-widest text-slate-500">Estimation</div>
            {[
              { l: 'Prix FOB converti', v: fmt(result.fob) },
              { l: 'Droits de douane', v: fmt(result.dd) },
              { l: 'TVA 19%', v: fmt(result.tva) },
              { l: 'TAIC 2%', v: fmt(result.taic) },
              { l: 'Timbre douanier', v: fmt(result.timbre) },
            ].map((row, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-white/6">
                <span className="text-sm text-slate-500">{row.l}</span>
                <span className="text-sm font-black text-white">{row.v}</span>
              </div>
            ))}
            {result.discount > 0 && (
              <div className="flex justify-between py-2 border-b border-green-500/20">
                <span className="text-sm text-green-400">Réduction Moudjahid</span>
                <span className="text-sm font-black text-green-400">−{fmt(result.discount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center p-4 rounded-2xl mt-2"
              style={{ background: `${global.primaryColor}20`, border: `1px solid ${global.primaryColor}30` }}>
              <span className="text-sm font-bold text-slate-300">Total estimé</span>
              <span className="text-2xl font-black" style={{ color: global.primaryColor }}>{fmt(result.net)}</span>
            </div>
            <p className="text-[10px] text-slate-600 leading-relaxed">* Estimation indicative, les montants réels peuvent varier.</p>
            {global.whatsapp && (
              <a href={`https://wa.me/${global.whatsapp.replace(/\D/g, '')}?text=Bonjour%2C%20j'aimerais%20un%20devis%20d'importation%20précis%20(estimation%20: ${encodeURIComponent(fmt(result.net))}).`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-sm font-black text-white transition hover:brightness-110 mt-2"
                style={{ background: '#25D366' }}
              >
                <MessageSquare className="h-4 w-4" />Obtenir un devis précis
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="max-w-5xl mx-auto space-y-8">
        <h2 className="text-2xl font-black text-center text-white">Notre Processus d'Importation</h2>
        <div className="hidden md:grid grid-cols-4 gap-6 relative">
          <div className="absolute top-8 left-8 right-8 h-px opacity-15"
            style={{ background: `linear-gradient(90deg, ${global.primaryColor}, ${global.secondaryColor})` }} />
          {steps.map((s, i) => (
            <div key={i} className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white font-black text-xl z-10 relative"
                style={{ background: `linear-gradient(135deg, ${global.primaryColor}, ${global.secondaryColor})`, boxShadow: `0 8px 24px ${global.primaryColor}40` }}>
                {s.n}
              </div>
              <div className="text-sm font-black text-white">{s.t}</div>
              <div className="text-[12px] text-slate-500 leading-relaxed">{s.d}</div>
            </div>
          ))}
        </div>
        <div className="md:hidden space-y-4">
          {steps.map((s, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${global.primaryColor}, ${global.secondaryColor})` }}>
                  {s.n}
                </div>
                {i < steps.length - 1 && <div className="w-px flex-1 mt-2" style={{ background: `${global.primaryColor}30`, minHeight: '32px' }} />}
              </div>
              <div className="pb-6 pt-1 space-y-1">
                <div className="text-sm font-black text-white">{s.t}</div>
                <div className="text-[12px] text-slate-500 leading-relaxed">{s.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── SHARED NAVBAR (standalone, no import from ShowroomPublicSite) ─────────────
function SubPageNavbar({ config, basePath }: { config: ShowroomBuilderConfig; basePath: string }) {
  const { global } = config
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinks = [
    { label: 'Accueil', href: basePath || '/' },
    { label: 'En Stock', href: `${basePath || '/'}#sales` },
    { label: 'Location', href: `${basePath || '/'}#rental` },
    { label: 'Importation', href: `${basePath}/commande` },
    { label: 'Contact', href: `${basePath}/contact` },
  ]

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className="sticky top-0 z-50 transition-all duration-500"
      style={{
        background: scrolled ? `${global.bgColor}ee` : global.bgColor,
        backdropFilter: scrolled ? 'blur(24px) saturate(180%)' : 'none',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        boxShadow: scrolled ? '0 4px 40px rgba(0,0,0,0.4)' : 'none'
      }}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between h-[72px]">
        {/* Logo */}
        <a href={basePath || '/'} className="flex items-center gap-3 flex-shrink-0">
          {global.logoUrl ? (
            <img src={global.logoUrl} alt={global.companyName} className="h-10 w-auto object-contain" />
          ) : (
            <div className="h-10 px-3 rounded-xl flex items-center justify-center text-white font-black text-sm"
              style={{ background: `linear-gradient(135deg, ${global.primaryColor}, ${global.secondaryColor})` }}>
              {global.companyName.substring(0, 2).toUpperCase()}
            </div>
          )}
          <span className="font-black text-[15px] tracking-tight hidden sm:block text-white" style={{ fontFamily: global.fontFamily }}>
            {global.companyName}
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-7">
          {navLinks.map((link, i) => (
            <a key={i} href={link.href}
              className="text-[13px] font-semibold text-white/60 hover:text-white transition-all duration-200 relative group">
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 rounded-full transition-all duration-300 group-hover:w-full"
                style={{ background: global.primaryColor }} />
            </a>
          ))}
          <a href={`${basePath}/track`}
            className="text-[13px] font-extrabold flex items-center gap-1.5"
            style={{ color: global.primaryColor }}>
            <Ship className="h-3.5 w-3.5" /> Suivi
          </a>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2.5">
          {global.phone && (
            <a href={`tel:${global.phone}`}
              className="hidden sm:flex items-center gap-2 text-[12px] font-bold px-4 py-2.5 rounded-xl border text-white/70 border-white/15 hover:bg-white/8 transition">
              <Phone className="h-3.5 w-3.5" />{global.phone}
            </a>
          )}
          {global.whatsapp && (
            <a href={`https://wa.me/${global.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-[12px] font-black px-4 py-2.5 rounded-xl text-white transition hover:brightness-110"
              style={{ background: '#25D366' }}>
              <MessageSquare className="h-3.5 w-3.5" /><span className="hidden sm:inline">WhatsApp</span>
            </a>
          )}
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2.5 rounded-xl hover:bg-white/10 transition text-white">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="lg:hidden border-t border-white/6 py-2" style={{ background: global.bgColor }}>
          {navLinks.map((link, i) => (
            <a key={i} href={link.href} onClick={() => setMenuOpen(false)}
              className="flex items-center justify-between px-6 py-3.5 text-sm font-bold text-white/70 hover:text-white hover:bg-white/5 transition border-b border-white/4">
              {link.label} <ArrowRight className="h-4 w-4 opacity-30" />
            </a>
          ))}
          <a href={`${basePath}/track`} onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 px-6 py-3.5 text-sm font-extrabold border-b border-white/4"
            style={{ color: global.primaryColor }}>
            <Ship className="h-4 w-4" /> Suivi Expédition
          </a>
        </div>
      )}
    </nav>
  )
}

// ─── SHARED FOOTER (mini) ─────────────────────────────────────────────────────
function SubPageFooter({ global, basePath }: { global: ShowroomBuilderConfig['global']; basePath: string }) {
  return (
    <footer style={{ background: '#080808', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          {global.logoUrl
            ? <img src={global.logoUrl} alt={global.companyName} className="h-8 w-auto object-contain" />
            : <div className="h-8 px-2.5 rounded-lg text-white font-black text-xs flex items-center"
              style={{ background: `linear-gradient(135deg, ${global.primaryColor}, ${global.secondaryColor})` }}>
              {global.companyName.substring(0, 2).toUpperCase()}
            </div>
          }
          <span className="font-black text-sm text-white/80">{global.companyName}</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-600">
          {global.phone && <a href={`tel:${global.phone}`} className="hover:text-white transition flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{global.phone}</a>}
          {global.whatsapp && (
            <a href={`https://wa.me/${global.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 font-bold transition hover:brightness-110 px-3 py-1.5 rounded-lg text-white"
              style={{ background: '#25D366' }}>
              <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
            </a>
          )}
        </div>
        <p className="text-[11px] text-slate-700">© {new Date().getFullYear()} {global.companyName}</p>
      </div>
    </footer>
  )
}

// ─── PAGE HERO BANNER ─────────────────────────────────────────────────────────
const PAGE_META: Record<PageType, { icon: React.FC<any>; label: string; title: string; subtitle: string; badge: string }> = {
  stock: {
    icon: Car,
    label: 'Catalogue',
    title: 'Véhicules en Vente',
    subtitle: 'Découvrez notre sélection de véhicules neufs et d\'occasion disponibles immédiatement ou sur commande.',
    badge: 'STOCK DISPONIBLE'
  },
  location: {
    icon: Key,
    label: 'Location',
    title: 'Location de Véhicules',
    subtitle: 'Véhicules haut de gamme disponibles à la location courte et longue durée avec service premium.',
    badge: 'RÉSERVATION RAPIDE'
  },
  contact: {
    icon: MessageSquare,
    label: 'Contact',
    title: 'Contactez-Nous',
    subtitle: 'Notre équipe est disponible pour répondre à toutes vos questions et vous accompagner dans votre projet.',
    badge: 'NOUS SOMMES LÀ'
  },
  commande: {
    icon: Calculator,
    label: 'Importation',
    title: 'Importation sur Commande',
    subtitle: 'Simulez les frais de dédouanement et commandez le véhicule de vos rêves en Europe, livré clé en main.',
    badge: 'SIMULATEUR INCLUS'
  }
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export default function ShowroomSubPage({ config, agency, pageType, cars }: ShowroomSubPageProps) {
  const { global } = config
  const [basePath, setBasePath] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname
      const sub = agency.subdomain
      if (sub && !path.startsWith(`/${sub}/`) && path !== `/${sub}`) {
        setBasePath('')
      } else {
        setBasePath(sub ? `/${sub}` : '')
      }
    }
  }, [agency.subdomain])

  const meta = PAGE_META[pageType]
  const PageIcon = meta.icon
  const isRental = pageType === 'location'

  return (
    <div
      className="min-h-screen w-full antialiased flex flex-col"
      style={{ fontFamily: global.fontFamily, background: global.bgColor, color: global.textColor }}
    >
      {/* Fonts */}
      <link
        href={`https://fonts.googleapis.com/css2?family=${global.fontFamily}:wght@400;500;600;700;800;900&display=swap`}
        rel="stylesheet"
      />

      {/* Navbar */}
      <SubPageNavbar config={config} basePath={basePath} />

      {/* Hero Banner */}
      <div
        className="relative py-20 overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${global.bgColor} 0%, #0a0a0a 100%)` }}
      >
        {/* Decorative gradient */}
        <div className="absolute inset-0 opacity-30"
          style={{ background: `radial-gradient(ellipse 80% 60% at 50% 100%, ${global.primaryColor}25, transparent)` }} />
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${global.primaryColor}60, transparent)` }} />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          {/* Back link */}
          <a href={basePath || '/'} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-white transition mb-8 group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Retour à l'accueil
          </a>

          <div className="max-w-2xl space-y-5">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border"
              style={{ color: global.primaryColor, borderColor: `${global.primaryColor}40`, background: `${global.primaryColor}10` }}
            >
              <PageIcon className="h-3.5 w-3.5" />
              {meta.badge}
            </div>
            <h1
              className="text-5xl sm:text-6xl font-black tracking-tight leading-[1.05] text-white"
              style={{ fontFamily: global.fontFamily }}
            >
              {meta.title}
            </h1>
            <p className="text-base text-slate-400 leading-relaxed max-w-xl">
              {meta.subtitle}
            </p>
            {(pageType === 'stock' || pageType === 'location') && cars.length > 0 && (
              <div className="flex items-center gap-2 pt-2">
                <span className="text-3xl font-black" style={{ color: global.primaryColor }}>{cars.length}</span>
                <span className="text-sm text-slate-500 font-semibold">
                  véhicule{cars.length > 1 ? 's' : ''} {pageType === 'location' ? 'disponible' : 'en catalogue'}{cars.length > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-16">
        {(pageType === 'stock' || pageType === 'location') && (
          <CarGrid cars={cars} global={global} isRental={isRental} />
        )}
        {pageType === 'contact' && <ContactContent global={global} />}
        {pageType === 'commande' && <CommandeContent global={global} />}
      </main>

      {/* Footer */}
      <SubPageFooter global={global} basePath={basePath} />

      {/* WhatsApp float */}
      {global.whatsapp && (
        <a
          href={`https://wa.me/${global.whatsapp.replace(/\D/g, '')}`}
          target="_blank" rel="noopener noreferrer"
          className="fixed bottom-8 right-8 z-50 flex items-center gap-2 px-5 py-3.5 rounded-full text-white text-sm font-black shadow-2xl transition-all hover:scale-105"
          style={{ background: '#25D366', boxShadow: '0 8px 32px rgba(37,211,102,0.4)' }}
        >
          <MessageSquare className="h-5 w-5" />
        </a>
      )}
    </div>
  )
}
