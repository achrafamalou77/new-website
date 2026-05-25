'use client'
// src/components/website/ShowroomPublicSite.tsx
// The LIVE car showroom website renderer — directly connected to builder config + real DB data

import { useState, useEffect, useRef } from 'react'
import type { ShowroomBuilderConfig, ShowroomSection } from '@/lib/car-showroom-builder-template'
import {
  Phone, MessageSquare, Share2, AtSign, Mail, MapPin, Clock,
  Car, Star, Award, ChevronRight, X, Send, Check, AlertCircle,
  Menu, ArrowRight, ExternalLink, Calculator, Shield, Truck, Key,
  ShoppingCart, Ship, FileText, Briefcase, Navigation, Grid, BarChart,
  AlignJustify, GitBranch
} from 'lucide-react'

// ─── ICON MAP ─────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, any> = {
  Car, Star, Award, Clock, Shield, Truck, Key, ShoppingCart, Ship, FileText,
  Briefcase, Navigation, Grid, BarChart, AlignJustify, GitBranch, Calculator,
  Phone, MessageSquare, Mail, MapPin, Check, ChevronRight, ArrowRight
}
const DynIcon = ({ name, className }: { name: string; className?: string }) => {
  const Icon = ICON_MAP[name] || Car
  return <Icon className={className} />
}

// ─── IMPORT CALCULATOR STATE ──────────────────────────────────────────────────
const fobCurrencies = [
  { label: 'EUR — Euro', code: 'EUR', rate: 147 },
  { label: 'USD — Dollar US', code: 'USD', rate: 135 },
  { label: 'AED — Dirham Émirati', code: 'AED', rate: 36.8 }
]

function calculateDedouanement(fobDZD: number, year: number, licenceType: string) {
  const age = new Date().getFullYear() - year
  const dd = age <= 1 ? 0.05 : age <= 2 ? 0.10 : 0.20 // Droits de douane
  const tva = 0.19
  const taic = 0.02
  const timbre = 15000
  const total = fobDZD * (1 + dd + tva + taic) + timbre
  const discount = licenceType === 'moudjahid' ? total * 0.40 : 0
  return {
    fob: fobDZD,
    dd: Math.round(fobDZD * dd),
    tva: Math.round(fobDZD * tva),
    taic: Math.round(fobDZD * taic),
    timbre,
    total: Math.round(total),
    discount: Math.round(discount),
    net: Math.round(total - discount)
  }
}

function fmt(n: number) {
  return n.toLocaleString('fr-DZ') + ' DA'
}

// ─── WHATSAPP FLOAT BUTTON ────────────────────────────────────────────────────
function WhatsAppFloat({ phone }: { phone: string }) {
  return (
    <a
      href={`https://wa.me/${phone.replace(/\D/g, '')}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white px-4 py-3 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 group"
      title="Contacter par WhatsApp"
    >
      <MessageSquare className="h-5 w-5" />
      <span className="text-sm font-bold hidden group-hover:block max-w-0 group-hover:max-w-[120px] overflow-hidden transition-all duration-300">
        WhatsApp
      </span>
    </a>
  )
}

// ─── SECTION: NAVBAR ──────────────────────────────────────────────────────────
function NavbarSection({ section, global }: { section: ShowroomSection; global: ShowroomBuilderConfig['global'] }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const links: Array<{ label: string; href: string }> = section.content.links || []

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={`${section.content.sticky ? 'sticky top-0 z-50' : 'relative z-40'} transition-all duration-300 ${
        scrolled ? 'shadow-2xl' : ''
      }`}
      style={{
        background: scrolled
          ? `${section.styles.bgColor}f2`
          : section.styles.bgColor,
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : 'none'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-[68px]">
        {/* Logo / Name */}
        <div className="flex items-center gap-3">
          {global.logoUrl ? (
            <img src={global.logoUrl} alt={global.companyName} className="h-9 w-auto object-contain" />
          ) : (
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md"
              style={{ background: global.primaryColor }}
            >
              {global.companyName.charAt(0)}
            </div>
          )}
          <span
            className="font-black text-base tracking-tight hidden sm:block"
            style={{ color: section.styles.textColor, fontFamily: global.fontFamily }}
          >
            {global.companyName}
          </span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6">
          {links.map((link, i) => (
            <a
              key={i}
              href={link.href}
              className="text-[13px] font-semibold transition-colors duration-200 hover:opacity-100"
              style={{ color: section.styles.textColor, opacity: 0.75 }}
            >
              {link.label}
            </a>
          ))}
          <a
            href="track"
            className="text-[13px] font-extrabold text-indigo-400 hover:text-indigo-300 transition-colors duration-200 flex items-center gap-1.5"
          >
            <Ship className="h-3.5 w-3.5 animate-pulse" />
            Suivi Expédition
          </a>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center gap-2">
          {section.content.showPhoneButton && global.phone && (
            <a
              href={`tel:${global.phone}`}
              className="hidden sm:flex items-center gap-1.5 text-[12px] font-bold px-3 py-2 rounded-xl border transition"
              style={{
                color: section.styles.textColor,
                borderColor: `${section.styles.textColor}30`,
                background: `${section.styles.textColor}10`
              }}
            >
              <Phone className="h-3.5 w-3.5" />
              {global.phone}
            </a>
          )}
          {section.content.showWhatsappButton && global.whatsapp && (
            <a
              href={`https://wa.me/${global.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[12px] font-bold px-3 py-2 rounded-xl text-white transition"
              style={{ background: '#25D366' }}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          )}
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg"
            style={{ color: section.styles.textColor }}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div
          className="md:hidden border-t"
          style={{ background: section.styles.bgColor, borderColor: 'rgba(255,255,255,0.1)' }}
        >
          {links.map((link, i) => (
            <a
              key={i}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block px-6 py-3 text-sm font-semibold border-b transition hover:bg-white/5"
              style={{ color: section.styles.textColor, borderColor: 'rgba(255,255,255,0.06)' }}
            >
              {link.label}
            </a>
          ))}
          <a
            href="track"
            onClick={() => setMenuOpen(false)}
            className="block px-6 py-3 text-sm font-extrabold border-b transition hover:bg-white/5 text-indigo-400 flex items-center gap-2"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <Ship className="h-4 w-4 animate-pulse" />
            Suivi Expédition
          </a>
        </div>
      )}
    </nav>
  )
}

// ─── SECTION: HERO ────────────────────────────────────────────────────────────
function HeroSection({ section, global }: { section: ShowroomSection; global: ShowroomBuilderConfig['global'] }) {
  const bgImage = section.styles.backgroundImage || section.content.backgroundImage
  const overlay = section.styles.backgroundOverlay ?? section.content.overlayOpacity ?? 0.6
  const trustBadges: string[] = section.content.trustBadges || []

  return (
    <section
      id="hero"
      className="relative min-h-[88vh] flex items-center overflow-hidden"
      style={{ backgroundColor: section.styles.bgColor }}
    >
      {/* Background image */}
      {bgImage && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${bgImage})` }}
          />
          <div
            className="absolute inset-0"
            style={{ background: `rgba(0,0,0,${overlay})` }}
          />
        </>
      )}

      {/* Gradient overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 w-full">
        <div className="max-w-3xl space-y-6">
          {section.content.badge && (
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-black tracking-widest uppercase border"
              style={{
                background: `${global.primaryColor}25`,
                color: global.primaryColor,
                borderColor: `${global.primaryColor}60`
              }}
            >
              {section.content.badge}
            </div>
          )}

          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight"
            style={{ color: '#ffffff', fontFamily: global.fontFamily }}
          >
            {section.content.headline || 'Titre principal'}
          </h1>

          {section.content.subheadline && (
            <p className="text-base sm:text-lg font-medium text-slate-200 leading-relaxed max-w-2xl">
              {section.content.subheadline}
            </p>
          )}

          {/* Trust badges */}
          {section.content.showTrustBadges && trustBadges.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {trustBadges.map((badge, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full text-[11px] font-bold text-white bg-white/10 border border-white/20 backdrop-blur"
                >
                  {badge}
                </span>
              ))}
            </div>
          )}

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 pt-2">
            {section.content.primaryCTA && (
              <a
                href={section.content.primaryCTAHref || '#'}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-black text-white transition-all duration-200 hover:scale-[1.02] hover:shadow-xl"
                style={{ background: global.primaryColor }}
              >
                {section.content.primaryCTA}
                <ArrowRight className="h-4 w-4" />
              </a>
            )}
            {section.content.secondaryCTA && (
              <a
                href={section.content.secondaryCTAHref || '#'}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-black text-white border-2 border-white/40 backdrop-blur bg-white/10 transition-all duration-200 hover:bg-white/20"
              >
                {section.content.secondaryCTA}
              </a>
            )}
          </div>

          {/* Stats strip */}
          <div className="flex flex-wrap gap-6 pt-6 border-t border-white/15">
            {[
              { n: '500+', l: 'Véhicules Livrés' },
              { n: '8 ans', l: 'D\'Expérience' },
              { n: '99%', l: 'Satisfaction' }
            ].map((s, i) => (
              <div key={i} className="text-left">
                <div className="text-2xl font-black text-white" style={{ fontFamily: global.fontFamily }}>{s.n}</div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── SECTION: STATS ───────────────────────────────────────────────────────────
function StatsSection({ section, global }: { section: ShowroomSection; global: ShowroomBuilderConfig['global'] }) {
  const items: Array<{ number: string; label: string; icon: string }> = section.content.items || []
  return (
    <section
      id="stats"
      style={{
        background: section.styles.bgColor,
        color: section.styles.textColor,
        paddingTop: `${section.styles.paddingTop * 4}px`,
        paddingBottom: `${section.styles.paddingBottom * 4}px`
      }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {items.map((item, i) => (
            <div key={i} className="text-center space-y-2">
              <div
                className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.15)' }}
              >
                <DynIcon name={item.icon} className="h-6 w-6" />
              </div>
              <div
                className="text-3xl font-black tracking-tight"
                style={{ fontFamily: global.fontFamily }}
              >
                {item.number}
              </div>
              <div className="text-[11px] font-bold uppercase tracking-widest opacity-80">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── SECTION: SALES INVENTORY ─────────────────────────────────────────────────
function SalesInventorySection({
  section, global, salesCars
}: { section: ShowroomSection; global: ShowroomBuilderConfig['global']; salesCars: any[] }) {
  const [filter, setFilter] = useState('all')
  const [selectedCar, setSelectedCar] = useState<any>(null)

  const filterTypes: string[] = section.content.filterTypes || ['all', 'sell', 'sur_command']
  const filterLabels: Record<string, string> = section.content.filterLabels || {
    all: 'Tous', sell: 'En Stock', sur_command: 'Sur Commande'
  }
  const limit = section.content.limit || 9

  const filtered = salesCars
    .filter(c => filter === 'all' || c.car_type === filter || c.status === filter)
    .slice(0, limit)

  const formatPrice = (p: number) => p ? p.toLocaleString('fr-DZ') + ' DA' : 'Sur devis'

  return (
    <section
      id="sales"
      style={{
        background: section.styles.bgColor,
        color: section.styles.textColor,
        paddingTop: `${section.styles.paddingTop * 4}px`,
        paddingBottom: `${section.styles.paddingBottom * 4}px`
      }}
    >
      <div className="max-w-7xl mx-auto px-6 space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <h2
            className="text-3xl font-black tracking-tight"
            style={{ fontFamily: global.fontFamily, color: section.styles.textColor }}
          >
            {section.content.title || 'Véhicules en Vente'}
          </h2>
          <p className="text-sm opacity-70 max-w-xl mx-auto">{section.content.subtitle}</p>
        </div>

        {/* Filters */}
        {section.content.showFilters && (
          <div className="flex flex-wrap justify-center gap-2">
            {filterTypes.map(ft => (
              <button
                key={ft}
                onClick={() => setFilter(ft)}
                className="px-5 py-2 rounded-full text-xs font-bold transition-all duration-200"
                style={
                  filter === ft
                    ? { background: global.primaryColor, color: '#ffffff' }
                    : { background: 'rgba(255,255,255,0.07)', color: section.styles.textColor, border: '1px solid rgba(255,255,255,0.12)' }
                }
              >
                {filterLabels[ft] || ft}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 opacity-50">
            <Car className="h-12 w-12 mx-auto mb-3" />
            <p className="text-sm font-semibold">Aucun véhicule disponible pour le moment.</p>
          </div>
        ) : (
          <div
            className="grid gap-6"
            style={{
              gridTemplateColumns: `repeat(${Math.min(section.content.cardsPerRow || 3, 3)}, minmax(0, 1fr))`
            }}
          >
            {filtered.map(car => (
              <CarCard
                key={car.id}
                car={car}
                global={global}
                showPrice={section.content.showPrice}
                showWhatsapp={section.content.showWhatsapp}
                onClick={() => setSelectedCar(car)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Car Detail Modal */}
      {selectedCar && (
        <CarDetailModal car={selectedCar} global={global} onClose={() => setSelectedCar(null)} />
      )}
    </section>
  )
}

// ─── CAR CARD ─────────────────────────────────────────────────────────────────
function CarCard({ car, global, showPrice, showWhatsapp, onClick }: {
  car: any; global: ShowroomBuilderConfig['global']; showPrice?: boolean; showWhatsapp?: boolean; onClick: () => void
}) {
  const image = car.cover_image_url || (car.images && car.images[0]) || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600'
  const name = `${car.brand || ''} ${car.model || ''}`.trim()
  const price = car.selling_price || car.daily_rate

  return (
    <div
      className="group rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-2xl"
      style={{
        background: 'rgba(255,255,255,0.04)',
        borderColor: 'rgba(255,255,255,0.08)'
      }}
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {/* Badge */}
        <div className="absolute top-3 left-3">
          <span
            className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
            style={{
              background: car.car_type === 'sur_command' ? '#f59e0b' : global.primaryColor,
              color: '#fff'
            }}
          >
            {car.car_type === 'sur_command' ? 'Sur Commande' : car.car_type === 'rental' ? 'Location' : 'En Stock'}
          </span>
        </div>
        {/* Year badge */}
        <div className="absolute top-3 right-3">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/50 text-white backdrop-blur">
            {car.year}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-black text-sm text-white leading-tight">{name || 'Véhicule'}</h3>
          <div className="flex gap-3 mt-1.5 text-[11px] text-slate-400 font-semibold">
            {car.fuel_type && <span>⛽ {car.fuel_type}</span>}
            {car.transmission && <span>⚙️ {car.transmission}</span>}
            {car.mileage !== undefined && <span>📍 {car.mileage === 0 ? 'Neuf' : `${car.mileage.toLocaleString()} km`}</span>}
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          {showPrice && price ? (
            <div>
              <div
                className="text-base font-black"
                style={{ color: global.primaryColor }}
              >
                {price.toLocaleString('fr-DZ')} DA
              </div>
              {car.daily_rate && <div className="text-[10px] text-slate-500">/ jour</div>}
            </div>
          ) : (
            <div className="text-xs text-slate-500 font-semibold">Prix sur demande</div>
          )}

          <div className="flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onClick() }}
              className="p-2 rounded-xl text-xs font-bold text-white transition"
              style={{ background: global.primaryColor }}
              title="Voir détails"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            {showWhatsapp && global.whatsapp && (
              <a
                href={`https://wa.me/${global.whatsapp.replace(/\D/g, '')}?text=Bonjour%2C%20je%20suis%20intéressé%20par%20la%20${encodeURIComponent(name)}%20(${car.year})%20sur%20votre%20site.`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="p-2 rounded-xl text-xs font-bold text-white transition"
                style={{ background: '#25D366' }}
                title="Contacter sur WhatsApp"
              >
                <MessageSquare className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── CAR DETAIL MODAL ─────────────────────────────────────────────────────────
function CarDetailModal({ car, global, onClose }: { car: any; global: ShowroomBuilderConfig['global']; onClose: () => void }) {
  const name = `${car.brand || ''} ${car.model || ''}`.trim()
  const images: string[] = car.images?.length ? car.images : [car.cover_image_url].filter(Boolean)
  const [activeImg, setActiveImg] = useState(0)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden overflow-y-auto"
        style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.1)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid md:grid-cols-2 gap-0">
          {/* Images */}
          <div className="relative h-72 md:h-full min-h-72">
            <img
              src={images[activeImg] || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800'}
              alt={name}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800' }}
            />
            {images.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className="h-2 rounded-full transition-all"
                    style={{ width: i === activeImg ? '20px' : '8px', background: i === activeImg ? global.primaryColor : 'rgba(255,255,255,0.5)' }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="p-6 space-y-5 text-white">
            <div>
              <div
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-2"
                style={{ background: global.primaryColor }}
              >
                {car.car_type === 'sur_command' ? 'Sur Commande' : car.car_type === 'rental' ? 'Location' : 'En Stock'}
              </div>
              <h2 className="text-2xl font-black tracking-tight" style={{ fontFamily: global.fontFamily }}>
                {name}
              </h2>
              <p className="text-slate-400 text-sm mt-1">{car.year} · {car.condition === 'new' ? 'Neuf' : 'Occasion'}</p>
            </div>

            {/* Specs grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { l: 'Carburant', v: car.fuel_type },
                { l: 'Transmission', v: car.transmission },
                { l: 'Kilométrage', v: car.mileage === 0 ? '0 km (Neuf)' : `${car.mileage?.toLocaleString()} km` },
                { l: 'Couleur', v: car.color },
                { l: 'Origine', v: car.import_type === 'local' ? 'Local' : 'Importé' },
                { l: 'Puissance', v: car.engine_power ? `${car.engine_power} CV` : null }
              ].filter(s => s.v).map((spec, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-3">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">{spec.l}</div>
                  <div className="text-sm font-bold text-white mt-0.5 capitalize">{spec.v}</div>
                </div>
              ))}
            </div>

            {/* Price */}
            {(car.selling_price || car.daily_rate) && (
              <div
                className="rounded-2xl p-4"
                style={{ background: `${global.primaryColor}20`, border: `1px solid ${global.primaryColor}40` }}
              >
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide">
                  {car.daily_rate ? 'Tarif / jour' : 'Prix de vente'}
                </div>
                <div
                  className="text-3xl font-black mt-1"
                  style={{ color: global.primaryColor }}
                >
                  {(car.selling_price || car.daily_rate)?.toLocaleString('fr-DZ')} DA
                </div>
              </div>
            )}

            {/* Description */}
            {car.description && (
              <p className="text-sm text-slate-400 leading-relaxed">{car.description}</p>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <a
                href={`tel:${global.phone}`}
                className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white border border-white/20 hover:bg-white/10 transition"
              >
                <Phone className="h-4 w-4" />
                Appeler
              </a>
              <a
                href={`https://wa.me/${global.whatsapp.replace(/\D/g, '')}?text=Bonjour%2C%20je%20suis%20intéressé%20par%20la%20${encodeURIComponent(name)}%20(${car.year}).%20Pouvez-vous%20me%20donner%20plus%20d'informations%20?`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition hover:scale-[1.02]"
                style={{ background: '#25D366' }}
              >
                <MessageSquare className="h-4 w-4" />
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── SECTION: RENTAL FLEET ────────────────────────────────────────────────────
function RentalFleetSection({
  section, global, rentalCars
}: { section: ShowroomSection; global: ShowroomBuilderConfig['global']; rentalCars: any[] }) {
  const [selectedCar, setSelectedCar] = useState<any>(null)
  const features: string[] = section.content.features || []
  const limit = section.content.limit || 6
  const cars = rentalCars.filter(c => c.status !== 'maintenance').slice(0, limit)

  return (
    <section
      id="rental"
      style={{
        background: section.styles.bgColor,
        color: section.styles.textColor,
        paddingTop: `${section.styles.paddingTop * 4}px`,
        paddingBottom: `${section.styles.paddingBottom * 4}px`
      }}
    >
      <div className="max-w-7xl mx-auto px-6 space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-black tracking-tight" style={{ fontFamily: global.fontFamily }}>
            {section.content.title}
          </h2>
          <p className="text-sm opacity-70 max-w-xl mx-auto">{section.content.subtitle}</p>
        </div>

        {/* Features strip */}
        {features.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3">
            {features.map((f, i) => (
              <span
                key={i}
                className="px-4 py-2 rounded-full text-xs font-bold"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {f}
              </span>
            ))}
          </div>
        )}

        {/* Grid */}
        {cars.length === 0 ? (
          <div className="text-center py-16 opacity-50">
            <Key className="h-12 w-12 mx-auto mb-3" />
            <p className="text-sm font-semibold">Aucun véhicule disponible à la location pour le moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars.map(car => (
              <CarCard
                key={car.id}
                car={car}
                global={global}
                showPrice={section.content.showDailyRate}
                showWhatsapp={section.content.showWhatsapp}
                onClick={() => setSelectedCar(car)}
              />
            ))}
          </div>
        )}
      </div>
      {selectedCar && <CarDetailModal car={selectedCar} global={global} onClose={() => setSelectedCar(null)} />}
    </section>
  )
}

// ─── SECTION: IMPORT CALCULATOR ───────────────────────────────────────────────
function ImportCalculatorSection({ section, global }: { section: ShowroomSection; global: ShowroomBuilderConfig['global'] }) {
  const [fobAmount, setFobAmount] = useState(5000)
  const [currency, setCurrency] = useState(fobCurrencies[0])
  const [vehicleYear, setVehicleYear] = useState(new Date().getFullYear() - 1)
  const [licenceType, setLicenceType] = useState<'standard' | 'moudjahid'>('standard')
  const [showResult, setShowResult] = useState(false)

  const fobDZD = Math.round(fobAmount * currency.rate)
  const result = calculateDedouanement(fobDZD, vehicleYear, licenceType)

  return (
    <section
      id="import"
      style={{
        background: section.styles.bgColor,
        color: section.styles.textColor,
        paddingTop: `${section.styles.paddingTop * 4}px`,
        paddingBottom: `${section.styles.paddingBottom * 4}px`
      }}
    >
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-black" style={{ fontFamily: global.fontFamily }}>
            {section.content.title}
          </h2>
          <p className="text-sm opacity-70 max-w-2xl mx-auto">{section.content.subtitle}</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {/* Calculator Card */}
          <div
            className="rounded-3xl p-8 space-y-6"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Calculator className="h-5 w-5" style={{ color: global.primaryColor }} />
              Calculateur de Dédouanement
            </h3>

            {/* Currency & Amount */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Devise</label>
                <select
                  value={currency.code}
                  onChange={e => setCurrency(fobCurrencies.find(c => c.code === e.target.value)!)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm font-bold border text-white focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.15)' }}
                >
                  {fobCurrencies.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Prix FOB ({currency.code})</label>
                <input
                  type="number"
                  value={fobAmount}
                  onChange={e => setFobAmount(Number(e.target.value))}
                  className="w-full rounded-xl px-3 py-2.5 text-sm font-bold border text-white focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.15)' }}
                  min={0}
                />
              </div>
            </div>

            {/* FOB in DZD */}
            <div className="text-sm text-slate-400 font-semibold">
              ≈ <span className="text-white font-black">{fobDZD.toLocaleString('fr-DZ')} DA</span>
            </div>

            {/* Year */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Année du Véhicule</label>
              <input
                type="number"
                value={vehicleYear}
                onChange={e => setVehicleYear(Number(e.target.value))}
                min={2018}
                max={new Date().getFullYear()}
                className="w-full rounded-xl px-3 py-2.5 text-sm font-bold border text-white focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.15)' }}
              />
            </div>

            {/* Licence type */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Type de Licence</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { v: 'standard', l: 'Standard' },
                  { v: 'moudjahid', l: 'Moudjahid (-40%)' }
                ].map(opt => (
                  <button
                    key={opt.v}
                    onClick={() => setLicenceType(opt.v as any)}
                    className="py-2.5 rounded-xl text-xs font-bold transition"
                    style={
                      licenceType === opt.v
                        ? { background: global.primaryColor, color: '#fff' }
                        : { background: 'rgba(255,255,255,0.07)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }
                    }
                  >
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowResult(true)}
              className="w-full py-3.5 rounded-xl font-black text-sm text-white transition hover:scale-[1.02]"
              style={{ background: global.primaryColor }}
            >
              Calculer le Dédouanement →
            </button>

            {/* Result */}
            {showResult && (
              <div className="rounded-2xl p-5 space-y-3" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${global.primaryColor}40` }}>
                <div className="text-sm font-black text-white mb-4">Résultat Estimatif</div>
                {[
                  { l: 'Prix FOB', v: fmt(result.fob), neutral: true },
                  { l: 'Droits de Douane', v: fmt(result.dd) },
                  { l: 'TVA (19%)', v: fmt(result.tva) },
                  { l: 'TAIC (2%)', v: fmt(result.taic) },
                  { l: 'Timbre Fiscal', v: fmt(result.timbre) },
                  ...(result.discount > 0 ? [{ l: 'Avantage Moudjahid (-40%)', v: `-${fmt(result.discount)}`, good: true }] : [])
                ].map((row, i) => (
                  <div key={i} className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">{row.l}</span>
                    <span className={row.good ? 'text-emerald-400' : row.neutral ? 'text-white' : 'text-slate-200'}>
                      {row.v}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between text-base font-black border-t border-white/10 pt-3 mt-2">
                  <span className="text-white">TOTAL ESTIMÉ</span>
                  <span style={{ color: global.primaryColor }}>{fmt(result.net)}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  * Estimation à titre indicatif. Les valeurs exactes sont déterminées par les services douaniers.
                </p>
              </div>
            )}
          </div>

          {/* Timeline */}
          {section.content.showTimeline && (
            <div className="space-y-6">
              <h3 className="text-lg font-black text-white">Notre Processus d'Importation</h3>
              <div className="space-y-4">
                {(section.content.timelineSteps || []).map((step: any, i: number) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center text-white font-black text-xs flex-shrink-0"
                        style={{ background: global.primaryColor }}
                      >
                        {step.step}
                      </div>
                      {i < (section.content.timelineSteps?.length || 0) - 1 && (
                        <div className="w-0.5 flex-1 mt-2" style={{ background: `${global.primaryColor}30` }} />
                      )}
                    </div>
                    <div className="pb-6">
                      <h4 className="text-sm font-black text-white">{step.title}</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <a
                href={`https://wa.me/${global.whatsapp.replace(/\D/g, '')}?text=Bonjour%2C%20j'aimerais%20importer%20un%20v%C3%A9hicule.%20Pouvez-vous%20m'aider%20?`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition hover:scale-[1.02]"
                style={{ background: '#25D366' }}
              >
                <MessageSquare className="h-4 w-4" />
                Demander un Devis d'Importation
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// ─── SECTION: SERVICES ────────────────────────────────────────────────────────
function ServicesSection({ section, global }: { section: ShowroomSection; global: ShowroomBuilderConfig['global'] }) {
  const items: Array<{ icon: string; title: string; desc: string }> = section.content.items || []
  return (
    <section
      id="services"
      style={{
        background: section.styles.bgColor,
        paddingTop: `${section.styles.paddingTop * 4}px`,
        paddingBottom: `${section.styles.paddingBottom * 4}px`
      }}
    >
      <div className="max-w-7xl mx-auto px-6 space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-black text-white tracking-tight" style={{ fontFamily: global.fontFamily }}>
            {section.content.title}
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">{section.content.subtitle}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item, i) => (
            <div
              key={i}
              className="group p-6 rounded-2xl space-y-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-default"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)'
              }}
            >
              <div
                className="h-12 w-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110"
                style={{ background: `${global.primaryColor}20`, color: global.primaryColor }}
              >
                <DynIcon name={item.icon} className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-black text-sm text-white">{item.title}</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── SECTION: TESTIMONIALS ────────────────────────────────────────────────────
function TestimonialsSection({ section, global }: { section: ShowroomSection; global: ShowroomBuilderConfig['global'] }) {
  const items: Array<{ name: string; city: string; rating: number; text: string; avatar: string }> = section.content.items || []
  return (
    <section
      id="testimonials"
      style={{
        background: section.styles.bgColor,
        paddingTop: `${section.styles.paddingTop * 4}px`,
        paddingBottom: `${section.styles.paddingBottom * 4}px`
      }}
    >
      <div className="max-w-7xl mx-auto px-6 space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-black text-white" style={{ fontFamily: global.fontFamily }}>
            {section.content.title}
          </h2>
          <p className="text-sm text-slate-400">{section.content.subtitle}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl space-y-4"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)'
              }}
            >
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, si) => (
                  <Star
                    key={si}
                    className="h-4 w-4"
                    fill={si < item.rating ? global.primaryColor : 'none'}
                    style={{ color: global.primaryColor }}
                  />
                ))}
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">"{item.text}"</p>
              <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                <div
                  className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-black"
                  style={{ background: global.primaryColor }}
                >
                  {item.avatar}
                </div>
                <div>
                  <div className="text-sm font-black text-white">{item.name}</div>
                  <div className="text-[10px] text-slate-500">{item.city}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── SECTION: BRAND GRID ──────────────────────────────────────────────────────
function BrandGridSection({ section, global }: { section: ShowroomSection; global: ShowroomBuilderConfig['global'] }) {
  const brands: string[] = section.content.brands || []
  const brandEmojis: Record<string, string> = {
    Toyota: '🚗', Hyundai: '🚙', Kia: '🚘', Volkswagen: '🏎️',
    Renault: '🚕', Dacia: '🚐', BMW: '🏁', Mercedes: '⭐', Seat: '🚖', Skoda: '🚌'
  }

  return (
    <section
      id="brands"
      style={{
        background: section.styles.bgColor,
        paddingTop: `${section.styles.paddingTop * 4}px`,
        paddingBottom: `${section.styles.paddingBottom * 4}px`
      }}
    >
      <div className="max-w-7xl mx-auto px-6 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-white" style={{ fontFamily: global.fontFamily }}>
            {section.content.title}
          </h2>
          <p className="text-sm text-slate-400">{section.content.subtitle}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          {brands.map((brand, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white transition hover:scale-105"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <span>{brandEmojis[brand] || '🚗'}</span>
              <span>{brand}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── SECTION: CONTACT ─────────────────────────────────────────────────────────
function ContactSection({ section, global }: { section: ShowroomSection; global: ShowroomBuilderConfig['global'] }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    await new Promise(r => setTimeout(r, 1200))
    setSending(false)
    setSent(true)
  }

  return (
    <section
      id="contact"
      style={{
        background: section.styles.bgColor,
        paddingTop: `${section.styles.paddingTop * 4}px`,
        paddingBottom: `${section.styles.paddingBottom * 4}px`
      }}
    >
      <div className="max-w-7xl mx-auto px-6 space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-black text-white" style={{ fontFamily: global.fontFamily }}>
            {section.content.title}
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">{section.content.subtitle}</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Form */}
          {section.content.showForm && (
            <div
              className="rounded-3xl p-8 space-y-5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {sent ? (
                <div className="text-center py-8 space-y-4">
                  <div
                    className="h-16 w-16 rounded-full flex items-center justify-center mx-auto"
                    style={{ background: `${global.primaryColor}20` }}
                  >
                    <Check className="h-8 w-8" style={{ color: global.primaryColor }} />
                  </div>
                  <h3 className="text-lg font-black text-white">Message Envoyé !</h3>
                  <p className="text-sm text-slate-400">Nous vous répondrons dans les meilleurs délais.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {section.content.formFields?.includes('name') && (
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Nom complet *</label>
                        <input
                          required
                          value={form.name}
                          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                          className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white border focus:outline-none"
                          style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.15)' }}
                          placeholder="Votre nom"
                        />
                      </div>
                    )}
                    {section.content.formFields?.includes('phone') && (
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Téléphone *</label>
                        <input
                          required
                          value={form.phone}
                          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                          className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white border focus:outline-none"
                          style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.15)' }}
                          placeholder="+213 6XX XX XX XX"
                        />
                      </div>
                    )}
                  </div>
                  {section.content.formFields?.includes('email') && (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Email</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white border focus:outline-none"
                        style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.15)' }}
                        placeholder="votre@email.com"
                      />
                    </div>
                  )}
                  {section.content.formFields?.includes('message') && (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Message *</label>
                      <textarea
                        required
                        rows={4}
                        value={form.message}
                        onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                        className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white border focus:outline-none resize-none"
                        style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.15)' }}
                        placeholder="Votre message..."
                      />
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full py-3.5 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 transition hover:scale-[1.02] disabled:opacity-60"
                    style={{ background: global.primaryColor }}
                  >
                    {sending ? (
                      <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        {section.content.cta || 'Envoyer'}
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Contact Info */}
          <div className="space-y-6">
            {[
              { icon: Phone, label: 'Téléphone', value: global.phone, href: `tel:${global.phone}` },
              { icon: MessageSquare, label: 'WhatsApp', value: global.whatsapp, href: `https://wa.me/${global.whatsapp.replace(/\D/g, '')}` },
              { icon: Mail, label: 'Email', value: global.email, href: `mailto:${global.email}` },
              { icon: MapPin, label: 'Adresse', value: global.address, href: null }
            ].filter(i => i.value).map((info, i) => (
              <div key={i} className="flex items-start gap-4">
                <div
                  className="h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${global.primaryColor}20`, color: global.primaryColor }}
                >
                  <info.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{info.label}</div>
                  {info.href ? (
                    <a
                      href={info.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-white hover:opacity-80 transition mt-0.5 block"
                    >
                      {info.value}
                    </a>
                  ) : (
                    <div className="text-sm font-bold text-white mt-0.5">{info.value}</div>
                  )}
                </div>
              </div>
            ))}

            {/* Quick WhatsApp CTA */}
            {global.whatsapp && (
              <a
                href={`https://wa.me/${global.whatsapp.replace(/\D/g, '')}?text=Bonjour%2C%20j'ai%20une%20question%20concernant%20vos%20véhicules.`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-white transition hover:scale-[1.02]"
                style={{ background: '#25D366' }}
              >
                <MessageSquare className="h-5 w-5" />
                <div>
                  <div className="text-sm font-black">Contactez-nous sur WhatsApp</div>
                  <div className="text-xs opacity-80">Réponse en moins de 30 minutes</div>
                </div>
                <ArrowRight className="h-4 w-4 ml-auto" />
              </a>
            )}

            {/* Embed Map */}
            {section.content.showMap && section.content.mapEmbedUrl && (
              <div className="rounded-2xl overflow-hidden" style={{ height: '200px' }}>
                <iframe
                  src={section.content.mapEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── SECTION: FOOTER ──────────────────────────────────────────────────────────
function FooterSection({ section, global }: { section: ShowroomSection; global: ShowroomBuilderConfig['global'] }) {
  const columns: Array<{ title: string; items: Array<{ label: string; href: string }> }> = section.content.columns || []

  return (
    <footer
      id="footer"
      style={{
        background: section.styles.bgColor,
        color: section.styles.textColor,
        paddingTop: `${section.styles.paddingTop * 4}px`,
        paddingBottom: `${section.styles.paddingBottom * 4}px`
      }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              {global.logoUrl ? (
                <img src={global.logoUrl} alt={global.companyName} className="h-8 w-auto" />
              ) : (
                <div
                  className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-black text-sm"
                  style={{ background: global.primaryColor }}
                >
                  {global.companyName.charAt(0)}
                </div>
              )}
              <span className="font-black text-sm text-white">{global.companyName}</span>
            </div>
            <p className="text-xs leading-relaxed opacity-60">
              Spécialiste de l'importation et vente de véhicules premium en Algérie.
            </p>
            {/* Socials */}
            {section.content.showSocials && (
              <div className="flex gap-3">
                {global.socialFacebook && (
                  <a href={global.socialFacebook} target="_blank" rel="noopener noreferrer"
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-white transition hover:scale-110"
                    style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <Share2 className="h-4 w-4" />
                  </a>
                )}
                {global.socialInstagram && (
                  <a href={global.socialInstagram} target="_blank" rel="noopener noreferrer"
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-white transition hover:scale-110"
                    style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <AtSign className="h-4 w-4" />
                  </a>
                )}
                {global.whatsapp && (
                  <a href={`https://wa.me/${global.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-white transition hover:scale-110"
                    style={{ background: '#25D366' }}>
                    <MessageSquare className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Link Columns */}
          {columns.map((col, ci) => (
            <div key={ci} className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-widest text-white">{col.title}</h4>
              <ul className="space-y-2">
                {col.items.map((item, ii) => (
                  <li key={ii}>
                    <a
                      href={item.href}
                      className="text-xs font-semibold opacity-60 hover:opacity-100 transition"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <p className="text-xs opacity-50">{section.content.copyrightText}</p>
          <div className="text-xs opacity-40">Propulsé par la plateforme SaaS Auto</div>
        </div>
      </div>
    </footer>
  )
}

// ─── MAIN RENDERER ────────────────────────────────────────────────────────────
interface ShowroomPublicSiteProps {
  config: ShowroomBuilderConfig
  salesCars?: any[]
  rentalCars?: any[]
  isPreview?: boolean  // When true, disables sticky nav and float button
}

export default function ShowroomPublicSite({
  config,
  salesCars = [],
  rentalCars = [],
  isPreview = false
}: ShowroomPublicSiteProps) {
  const { global, sections } = config

  // Default placeholder cars if no real data in preview
  const defaultSalesCars = salesCars.length > 0 ? salesCars : [
    { id: 's1', brand: 'Toyota', model: 'RAV4 Hybrid', year: 2024, condition: 'new', mileage: 0, fuel_type: 'Hybride', transmission: 'Automatique', selling_price: 8900000, car_type: 'sell', cover_image_url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600' },
    { id: 's2', brand: 'Hyundai', model: 'Tucson 2.0 Htrac', year: 2025, condition: 'new', mileage: 0, fuel_type: 'Diesel', transmission: 'Automatique', selling_price: 7200000, car_type: 'sell', cover_image_url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600' },
    { id: 's3', brand: 'Kia', model: 'Sportage GT-Line', year: 2025, condition: 'new', mileage: 0, fuel_type: 'Essence', transmission: 'Automatique', selling_price: 6900000, car_type: 'sur_command', cover_image_url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=600' }
  ]

  const defaultRentalCars = rentalCars.length > 0 ? rentalCars : [
    { id: 'r1', brand: 'Dacia', model: 'Sandero Stepway', year: 2025, fuel_type: 'Essence', transmission: 'Manuelle', daily_rate: 6500, security_deposit: 80000, status: 'available', images: ['https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600'] },
    { id: 'r2', brand: 'Hyundai', model: 'Tucson Htrac', year: 2026, fuel_type: 'Hybride', transmission: 'Automatique', daily_rate: 18000, security_deposit: 150000, status: 'available', images: ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600'] }
  ]

  return (
    <div
      className="w-full antialiased"
      style={{ fontFamily: global.fontFamily, background: global.bgColor, color: global.textColor }}
    >
      {/* Google Fonts */}
      <link
        href={`https://fonts.googleapis.com/css2?family=${global.fontFamily}:wght@400;500;600;700;800;900&display=swap`}
        rel="stylesheet"
      />

      {/* Render sections in order */}
      {sections.filter(s => s.visible).map(section => {
        switch (section.type) {
          case 'Navbar':
            return <NavbarSection key={section.id} section={section} global={global} />
          case 'Hero':
            return <HeroSection key={section.id} section={section} global={global} />
          case 'Stats':
            return <StatsSection key={section.id} section={section} global={global} />
          case 'SalesInventory':
            return <SalesInventorySection key={section.id} section={section} global={global} salesCars={defaultSalesCars} />
          case 'RentalFleet':
            return <RentalFleetSection key={section.id} section={section} global={global} rentalCars={defaultRentalCars} />
          case 'ImportCalculator':
            return <ImportCalculatorSection key={section.id} section={section} global={global} />
          case 'Services':
            return <ServicesSection key={section.id} section={section} global={global} />
          case 'Testimonials':
            return <TestimonialsSection key={section.id} section={section} global={global} />
          case 'BrandGrid':
            return <BrandGridSection key={section.id} section={section} global={global} />
          case 'Contact':
            return <ContactSection key={section.id} section={section} global={global} />
          case 'Footer':
            return <FooterSection key={section.id} section={section} global={global} />
          default:
            return null
        }
      })}

      {/* WhatsApp Floating Button (only on live site) */}
      {!isPreview && global.whatsapp && <WhatsAppFloat phone={global.whatsapp} />}
    </div>
  )
}
