'use client'
// src/components/website/ShowroomPublicSite.tsx
// PREMIUM car showroom website renderer — Toyota.com-level design
// Fully controlled from the dashboard builder

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import type { ShowroomBuilderConfig, ShowroomSection } from '@/lib/car-showroom-builder-template'
import {
  Phone, MessageSquare, Mail, MapPin, Clock,
  Car, Star, Award, ChevronRight, X, Send, Check,
  Menu, ArrowRight, Shield, Truck, Key,
  ShoppingCart, Ship, FileText, Briefcase, Navigation, Grid, BarChart,
  AlignJustify, GitBranch, Calculator, ChevronDown,
  ExternalLink, Zap, Users, TrendingUp, Share2
} from 'lucide-react'

// ─── ICON MAP ──────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, any> = {
  Car, Star, Award, Clock, Shield, Truck, Key, ShoppingCart, Ship, FileText,
  Briefcase, Navigation, Grid, BarChart, AlignJustify, GitBranch, Calculator,
  Phone, MessageSquare, Mail, MapPin, Check, ChevronRight, ArrowRight,
  Zap, Users, TrendingUp
}
const DynIcon = ({ name, className }: { name: string; className?: string }) => {
  const Icon = ICON_MAP[name] || Car
  return <Icon className={className} />
}

// ─── IMPORT CALCULATOR ────────────────────────────────────────────────────────
const fobCurrencies = [
  { label: 'EUR — Euro', code: 'EUR', rate: 147 },
  { label: 'USD — Dollar US', code: 'USD', rate: 135 },
  { label: 'AED — Dirham Émirati', code: 'AED', rate: 36.8 }
]
function calculateDedouanement(fobDZD: number, year: number, licenceType: string) {
  const age = new Date().getFullYear() - year
  const dd = age <= 1 ? 0.05 : age <= 2 ? 0.10 : 0.20
  const tva = 0.19; const taic = 0.02; const timbre = 15000
  const total = fobDZD * (1 + dd + tva + taic) + timbre
  const discount = licenceType === 'moudjahid' ? total * 0.40 : 0
  return {
    fob: fobDZD, dd: Math.round(fobDZD * dd),
    tva: Math.round(fobDZD * tva), taic: Math.round(fobDZD * taic),
    timbre, total: Math.round(total), discount: Math.round(discount),
    net: Math.round(total - discount)
  }
}
function fmt(n: number) { return n.toLocaleString('fr-DZ') + ' DA' }

// ─── ANIMATED COUNTER HOOK ────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1800, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime: number | null = null
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(ease * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration, start])
  return count
}

// ─── INTERSECTION OBSERVER HOOK ───────────────────────────────────────────────
function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); obs.disconnect() }
    }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

// ─── WHATSAPP FLOAT ───────────────────────────────────────────────────────────
function WhatsAppFloat({ phone }: { phone: string }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 1500)
    return () => clearTimeout(t)
  }, [])
  return (
    <a
      href={`https://wa.me/${phone.replace(/\D/g, '')}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed bottom-8 right-8 z-50 flex items-center gap-3 bg-[#25D366] text-white px-5 py-3.5 rounded-full shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-green-500/30 hover:shadow-2xl group ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      title="Contacter par WhatsApp"
    >
      <MessageSquare className="h-5 w-5 flex-shrink-0" />
      <span className="text-sm font-bold overflow-hidden max-w-0 group-hover:max-w-[80px] transition-all duration-300 whitespace-nowrap">
        WhatsApp
      </span>
    </a>
  )
}

// ─── SECTION: NAVBAR ──────────────────────────────────────────────────────────
function NavbarSection({ section, global }: { section: ShowroomSection; global: ShowroomBuilderConfig['global'] }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const params = useParams()
  const [basePath, setBasePath] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname
      const sub = params?.subdomain as string
      if (sub && !path.startsWith(`/${sub}/`) && path !== `/${sub}`) {
        setBasePath('')
      } else {
        setBasePath(sub ? `/${sub}` : '')
      }
    }
  }, [params?.subdomain])

  const links: Array<{ label: string; href: string }> = section.content.links || []

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close menu on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Smart href resolver:
  // - anchor links (#section) → smooth scroll on main page (stay on same page)
  // - explicit /page links → navigate to sub-page with matching design
  // - special keywords → sub-page routes
  const getMappedHref = (href: string) => {
    if (!href) return basePath || '/'
    if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) return href

    const h = href.toLowerCase().trim()

    // Home anchor → back to top of current page
    if (h === '/' || h === '#home' || h === '#hero' || h === '') return basePath || '/'

    // Anchor links → stay on main page, smooth scroll
    if (h === '#sales' || h === '#stock') return `${basePath || '/'}#sales`
    if (h === '#rental' || h === '#location') return `${basePath || '/'}#rental`
    if (h === '#import' || h === '#calculator' || h === '#commande') return `${basePath || '/'}#import`
    if (h === '#contact') return `${basePath || '/'}#contact`
    if (h === '#services') return `${basePath || '/'}#services`
    if (h === '#testimonials') return `${basePath || '/'}#testimonials`
    if (h === '#brands') return `${basePath || '/'}#brands`
    if (h === '#stats') return `${basePath || '/'}#stats`

    // Explicit page routes → sub-pages with new design
    if (h.includes('stock') || h.includes('/en-stock') || h.includes('/vente')) return `${basePath}/stock`
    if (h.includes('location') || h.includes('rental') || h.includes('/louer')) return `${basePath}/location`
    if (h.includes('commande') || h.includes('import') || h.includes('/commander')) return `${basePath}/commande`
    if (h.includes('contact') || h.includes('/nous-contacter')) return `${basePath}/contact`
    if (h.includes('track') || h.includes('suivi') || h.includes('/suivre')) return `${basePath}/track`

    // Already absolute path
    return href.startsWith('/') ? `${basePath}${href}` : href
  }

  // Smooth scroll handler for anchor links (works on main page)
  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    const mappedHref = getMappedHref(href)
    if (mappedHref.includes('#') && mappedHref.startsWith(basePath || '/')) {
      const hash = mappedHref.split('#')[1]
      const target = document.getElementById(hash)
      if (target) {
        e.preventDefault()
        setMenuOpen(false)
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        window.history.pushState(null, '', `#${hash}`)
      }
    } else {
      setMenuOpen(false)
    }
  }


  return (
    <>
      <nav
        className={`${section.content.sticky ? 'sticky top-0 z-50' : 'relative z-40'} transition-all duration-500`}
        style={{
          background: scrolled
            ? `${section.styles.bgColor}ee`
            : section.styles.bgColor,
          backdropFilter: scrolled ? 'blur(24px) saturate(180%)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
          boxShadow: scrolled ? '0 4px 40px rgba(0,0,0,0.4)' : 'none'
        }}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between h-[72px]">
          {/* Logo */}
          <a href={basePath || '/'} className="flex items-center gap-3 flex-shrink-0">
            {global.logoUrl ? (
              <img src={global.logoUrl} alt={global.companyName} className="h-10 w-auto object-contain" />
            ) : (
              <div
                className="h-10 px-3 rounded-xl flex items-center justify-center text-white font-black text-sm tracking-wide"
                style={{ background: `linear-gradient(135deg, ${global.primaryColor}, ${global.secondaryColor})` }}
              >
                {global.companyName.substring(0, 2).toUpperCase()}
              </div>
            )}
            <span
              className="font-black text-[15px] tracking-tight hidden sm:block"
              style={{ color: section.styles.textColor, fontFamily: global.fontFamily }}
            >
              {global.companyName}
            </span>
          </a>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-8">
            {links.map((link, i) => (
              <a
                key={i}
                href={getMappedHref(link.href)}
                onClick={(e) => handleAnchorClick(e, link.href)}
                className="text-[13px] font-semibold transition-all duration-200 hover:opacity-100 relative group cursor-pointer"
                style={{ color: section.styles.textColor, opacity: 0.75 }}
              >
                {link.label}
                <span
                  className="absolute -bottom-1 left-0 w-0 h-0.5 rounded-full transition-all duration-300 group-hover:w-full"
                  style={{ background: global.primaryColor }}
                />
              </a>
            ))}
            <a
              href={`${basePath}/track`}
              className="text-[13px] font-extrabold flex items-center gap-1.5 transition-all duration-200"
              style={{ color: global.primaryColor }}
            >
              <Ship className="h-3.5 w-3.5" />
              Suivi Expédition
            </a>
          </div>

          {/* Right CTAs */}
          <div className="flex items-center gap-2.5">
            {section.content.showPhoneButton && global.phone && (
              <a
                href={`tel:${global.phone}`}
                className="hidden sm:flex items-center gap-2 text-[12px] font-bold px-4 py-2.5 rounded-xl border transition-all duration-200 hover:scale-[1.02]"
                style={{
                  color: section.styles.textColor,
                  borderColor: `${section.styles.textColor}25`,
                  background: `${section.styles.textColor}08`
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
                className="flex items-center gap-2 text-[12px] font-black px-4 py-2.5 rounded-xl text-white transition-all duration-200 hover:scale-[1.02] hover:brightness-110"
                style={{ background: '#25D366' }}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            )}
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2.5 rounded-xl transition-colors hover:bg-white/10"
              style={{ color: section.styles.textColor }}
              aria-label="Menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu — Full-screen overlay */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-all duration-400 ${menuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${menuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMenuOpen(false)}
        />
        {/* Drawer */}
        <div
          className={`absolute top-0 right-0 bottom-0 w-80 flex flex-col transition-transform duration-400 ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}
          style={{ background: section.styles.bgColor, borderLeft: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
            <span className="font-black text-base" style={{ color: section.styles.textColor, fontFamily: global.fontFamily }}>
              {global.companyName}
            </span>
            <button onClick={() => setMenuOpen(false)} className="p-2 rounded-xl hover:bg-white/10 transition" style={{ color: section.styles.textColor }}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto py-4">
            {links.map((link, i) => (
              <a
                key={i}
                href={getMappedHref(link.href)}
                onClick={(e) => handleAnchorClick(e, link.href)}
                className="flex items-center justify-between px-6 py-4 text-sm font-bold border-b transition hover:bg-white/5"
                style={{ color: section.styles.textColor, borderColor: 'rgba(255,255,255,0.06)', opacity: 0.85 }}
              >
                {link.label}
                <ArrowRight className="h-4 w-4 opacity-40" />
              </a>
            ))}
            <a
              href={`${basePath}/track`}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-6 py-4 text-sm font-extrabold border-b transition hover:bg-white/5"
              style={{ color: global.primaryColor, borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <Ship className="h-4 w-4" />
              Suivi Expédition
            </a>
          </nav>

          {global.phone && (
            <div className="px-6 py-5 border-t border-white/8 space-y-3">
              <a
                href={`tel:${global.phone}`}
                className="flex items-center gap-3 w-full py-3 px-4 rounded-xl border text-sm font-bold transition hover:bg-white/5"
                style={{ color: section.styles.textColor, borderColor: 'rgba(255,255,255,0.15)' }}
              >
                <Phone className="h-4 w-4" />
                {global.phone}
              </a>
              {global.whatsapp && (
                <a
                  href={`https://wa.me/${global.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 w-full py-3 px-4 rounded-xl text-sm font-black text-white transition hover:brightness-110"
                  style={{ background: '#25D366' }}
                >
                  <MessageSquare className="h-4 w-4" />
                  Contacter sur WhatsApp
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ─── SECTION: HERO ────────────────────────────────────────────────────────────
function HeroSection({ section, global }: { section: ShowroomSection; global: ShowroomBuilderConfig['global'] }) {
  const bgImage = section.styles.backgroundImage || section.content.backgroundImage
  const overlay = section.styles.backgroundOverlay ?? section.content.overlayOpacity ?? 0.6
  const trustBadges: string[] = section.content.trustBadges || []
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col justify-center overflow-hidden"
      style={{ backgroundColor: section.styles.bgColor }}
    >
      {/* Background */}
      {bgImage && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center scale-105"
            style={{ backgroundImage: `url(${bgImage})`, transition: 'transform 8s ease-out', transform: loaded ? 'scale(1)' : 'scale(1.05)' }}
          />
          <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${overlay})` }} />
        </>
      )}

      {/* Gradient layers for depth */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

      {/* Decorative accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ background: `linear-gradient(90deg, ${global.primaryColor}, ${global.secondaryColor}, transparent)` }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 w-full pt-32 pb-24">
        <div className="max-w-3xl space-y-8">
          {/* Badge */}
          {section.content.badge && (
            <div
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-[11px] font-black tracking-widest uppercase border transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{
                background: `${global.primaryColor}20`,
                color: global.primaryColor,
                borderColor: `${global.primaryColor}50`,
                transitionDelay: '0ms'
              }}
            >
              <Zap className="h-3 w-3" />
              {section.content.badge}
            </div>
          )}

          {/* Headline */}
          <h1
            className={`text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
            style={{ color: '#ffffff', fontFamily: global.fontFamily, transitionDelay: '100ms' }}
          >
            {section.content.headline || 'Votre Showroom Premium'}
          </h1>

          {/* Subheadline */}
          {section.content.subheadline && (
            <p
              className={`text-lg sm:text-xl font-medium leading-relaxed max-w-2xl transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
              style={{ color: 'rgba(255,255,255,0.75)', transitionDelay: '200ms' }}
            >
              {section.content.subheadline}
            </p>
          )}

          {/* Trust Badges */}
          {section.content.showTrustBadges && trustBadges.length > 0 && (
            <div
              className={`flex flex-wrap gap-3 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
              style={{ transitionDelay: '300ms' }}
            >
              {trustBadges.map((badge, i) => (
                <span
                  key={i}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-bold text-white backdrop-blur-sm border"
                  style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }}
                >
                  {badge}
                </span>
              ))}
            </div>
          )}

          {/* CTAs */}
          <div
            className={`flex flex-wrap gap-4 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
            style={{ transitionDelay: '400ms' }}
          >
            {section.content.primaryCTA && (
              <a
                href={section.content.primaryCTAHref || '#'}
                className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-sm font-black text-white transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl active:scale-[0.98]"
                style={{ background: `linear-gradient(135deg, ${global.primaryColor}, ${global.secondaryColor})`, boxShadow: `0 8px 32px ${global.primaryColor}40` }}
              >
                {section.content.primaryCTA}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </a>
            )}
            {section.content.secondaryCTA && (
              <a
                href={section.content.secondaryCTAHref || '#'}
                className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-sm font-black text-white border-2 border-white/30 backdrop-blur-sm bg-white/10 transition-all duration-300 hover:bg-white/20 hover:border-white/50 hover:scale-[1.03]"
              >
                {section.content.secondaryCTA}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50 animate-bounce">
        <ChevronDown className="h-5 w-5 text-white" />
      </div>
    </section>
  )
}

// ─── SECTION: STATS ───────────────────────────────────────────────────────────
function StatItem({ number, label, icon }: { number: string; label: string; icon: string }) {
  const { ref, inView } = useInView()
  // Extract numeric part for animation
  const numericMatch = number.match(/\d+/)
  const numericValue = numericMatch ? parseInt(numericMatch[0]) : 0
  const suffix = number.replace(/\d+/, '')
  const count = useCountUp(numericValue, 1600, inView)

  return (
    <div ref={ref} className="text-center space-y-3 group">
      <div
        className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
        style={{ background: 'rgba(255,255,255,0.2)' }}
      >
        <DynIcon name={icon} className="h-6 w-6 text-white" />
      </div>
      <div className="text-4xl font-black tracking-tight text-white">
        {inView ? `${count}${suffix}` : `0${suffix}`}
      </div>
      <div className="text-[11px] font-bold uppercase tracking-widest text-white/70">
        {label}
      </div>
    </div>
  )
}

function StatsSection({ section, global }: { section: ShowroomSection; global: ShowroomBuilderConfig['global'] }) {
  const items: Array<{ number: string; label: string; icon: string }> = section.content.items || []
  return (
    <section
      id="stats"
      style={{
        background: section.styles.bgColor,
        paddingTop: `${section.styles.paddingTop * 4}px`,
        paddingBottom: `${section.styles.paddingBottom * 4}px`,
      }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {items.map((item, i) => (
            <StatItem key={i} {...item} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── CAR CARD ─────────────────────────────────────────────────────────────────
function CarCard({ car, global, showPrice, showWhatsapp, onClick }: {
  car: any; global: ShowroomBuilderConfig['global']; showPrice?: boolean; showWhatsapp?: boolean; onClick: () => void
}) {
  const image = car.cover_image_url || (car.images && car.images[0]) || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80'
  const name = `${car.brand || ''} ${car.model || ''}`.trim()
  const price = car.selling_price || car.daily_rate
  const isRental = !!car.daily_rate && !car.selling_price

  return (
    <div
      className="group relative rounded-3xl overflow-hidden border cursor-pointer transition-all duration-400 hover:-translate-y-2 hover:shadow-2xl"
      style={{
        background: 'rgba(255,255,255,0.04)',
        borderColor: 'rgba(255,255,255,0.08)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.2)'
      }}
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative h-56 overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Type Badge */}
        <div className="absolute top-4 left-4">
          <span
            className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white"
            style={{ background: car.car_type === 'sur_command' ? '#f59e0b' : global.primaryColor }}
          >
            {car.car_type === 'sur_command' ? 'Sur Commande' : isRental ? 'Location' : 'En Stock'}
          </span>
        </div>

        {/* Year Badge */}
        <div className="absolute top-4 right-4">
          <span className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-sm border border-white/20">
            {car.year}
          </span>
        </div>

        {/* Price overlay */}
        {showPrice && price ? (
          <div className="absolute bottom-4 left-4">
            <div className="text-xl font-black text-white">
              {isRental
                ? `${price.toLocaleString('fr-DZ')} DA/jour`
                : `${price.toLocaleString('fr-DZ')} DA`
              }
            </div>
          </div>
        ) : (
          <div className="absolute bottom-4 left-4">
            <div className="text-sm font-bold text-white/70">Prix sur demande</div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-5 space-y-4">
        <div>
          <h3 className="font-black text-[15px] text-white leading-tight">{name || 'Véhicule'}</h3>
          <div className="flex flex-wrap gap-3 mt-2">
            {car.fuel_type && (
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                ⛽ {car.fuel_type}
              </span>
            )}
            {car.transmission && (
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                ⚙️ {car.transmission}
              </span>
            )}
            {car.mileage !== undefined && (
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                📍 {car.mileage === 0 ? 'Neuf' : `${car.mileage?.toLocaleString()} km`}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={(e) => { e.stopPropagation(); onClick() }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-[12px] font-black text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
            style={{ background: global.primaryColor }}
          >
            Voir les détails
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          {showWhatsapp && global.whatsapp && (
            <a
              href={`https://wa.me/${global.whatsapp.replace(/\D/g, '')}?text=Bonjour%2C%20je%20suis%20intéressé%20par%20la%20${encodeURIComponent(name)}%20(${car.year})%20sur%20votre%20site.`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="p-2.5 rounded-2xl text-white transition-all duration-200 hover:brightness-110 flex-shrink-0"
              style={{ background: '#25D366' }}
              title="Contacter sur WhatsApp"
            >
              <MessageSquare className="h-4 w-4" />
            </a>
          )}
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
  const [sent, setSent] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl max-h-[92vh] rounded-3xl overflow-hidden overflow-y-auto"
        style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 40px 120px rgba(0,0,0,0.8)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
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
                src={images[activeImg] || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=900&q=80'}
                alt={name}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=900&q=80' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 p-4 overflow-x-auto">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`flex-shrink-0 h-16 w-24 rounded-xl overflow-hidden border-2 transition-all ${i === activeImg ? 'border-[var(--p)]' : 'border-white/10 opacity-60'}`}
                    style={{ ['--p' as any]: global.primaryColor }}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="p-7 space-y-6 text-white overflow-y-auto max-h-[92vh]">
            {/* Header */}
            <div>
              <div
                className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-3 text-white"
                style={{ background: global.primaryColor }}
              >
                {car.car_type === 'sur_command' ? 'Sur Commande' : car.car_type === 'rental' ? 'Location' : 'En Stock'}
              </div>
              <h2 className="text-3xl font-black tracking-tight" style={{ fontFamily: global.fontFamily }}>
                {name}
              </h2>
              <p className="text-slate-400 text-sm mt-1 font-medium">
                {car.year} · {car.condition === 'new' ? 'Neuf' : 'Occasion'}
              </p>
            </div>

            {/* Specs */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { l: 'Carburant', v: car.fuel_type },
                { l: 'Transmission', v: car.transmission },
                { l: 'Kilométrage', v: car.mileage === 0 ? '0 km (Neuf)' : `${car.mileage?.toLocaleString()} km` },
                { l: 'Couleur', v: car.color },
                { l: 'Origine', v: car.import_type === 'local' ? 'Local' : 'Importé' },
                { l: 'Puissance', v: car.engine_power ? `${car.engine_power} CV` : null }
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

            {/* Description */}
            {car.description && (
              <p className="text-sm text-slate-400 leading-relaxed border-t border-white/6 pt-4">{car.description}</p>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <a
                href={`tel:${global.phone}`}
                className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white border border-white/15 hover:bg-white/8 transition-all duration-200"
              >
                <Phone className="h-4 w-4" />
                Appeler
              </a>
              {global.whatsapp && (
                <a
                  href={`https://wa.me/${global.whatsapp.replace(/\D/g, '')}?text=Bonjour%2C%20je%20suis%20intéressé%20par%20la%20${encodeURIComponent(name)}%20(${car.year}).%20Pouvez-vous%20me%20donner%20plus%20d'informations%20?`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm text-white transition-all duration-200 hover:brightness-110"
                  style={{ background: '#25D366' }}
                >
                  <MessageSquare className="h-4 w-4" />
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── SECTION: SALES INVENTORY ─────────────────────────────────────────────────
function SalesInventorySection({
  section, global, salesCars
}: { section: ShowroomSection; global: ShowroomBuilderConfig['global']; salesCars: any[] }) {
  const [filter, setFilter] = useState('all')
  const [selectedCar, setSelectedCar] = useState<any>(null)
  const { ref, inView } = useInView(0.1)

  const filterTypes: string[] = section.content.filterTypes || ['all', 'sell', 'sur_command']
  const filterLabels: Record<string, string> = section.content.filterLabels || {
    all: 'Tous', sell: 'En Stock', sur_command: 'Sur Commande'
  }
  const limit = section.content.limit || 9

  const filtered = salesCars
    .filter(c => filter === 'all' || c.car_type === filter || c.status === filter)
    .slice(0, limit)

  return (
    <section
      id="sales"
      ref={ref}
      style={{
        background: section.styles.bgColor,
        color: section.styles.textColor,
        paddingTop: `${section.styles.paddingTop * 4}px`,
        paddingBottom: `${section.styles.paddingBottom * 4}px`
      }}
    >
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        {/* Section Header */}
        <div className={`text-center space-y-4 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border"
            style={{ color: global.primaryColor, borderColor: `${global.primaryColor}40`, background: `${global.primaryColor}10` }}
          >
            <Car className="h-3 w-3" />
            Catalogue
          </div>
          <h2
            className="text-4xl font-black tracking-tight"
            style={{ fontFamily: global.fontFamily, color: section.styles.textColor }}
          >
            {section.content.title || 'Véhicules en Vente'}
          </h2>
          {section.content.subtitle && (
            <p className="text-base opacity-60 max-w-2xl mx-auto leading-relaxed">
              {section.content.subtitle}
            </p>
          )}
        </div>

        {/* Filters */}
        {section.content.showFilters && (
          <div className="flex flex-wrap justify-center gap-3">
            {filterTypes.map(ft => (
              <button
                key={ft}
                onClick={() => setFilter(ft)}
                className="px-6 py-2.5 rounded-full text-[12px] font-bold transition-all duration-200 hover:scale-[1.03]"
                style={
                  filter === ft
                    ? { background: global.primaryColor, color: '#ffffff', boxShadow: `0 4px 20px ${global.primaryColor}50` }
                    : { background: 'rgba(255,255,255,0.06)', color: section.styles.textColor, border: '1px solid rgba(255,255,255,0.1)' }
                }
              >
                {filterLabels[ft] || ft}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 opacity-40">
            <Car className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p className="text-base font-semibold">Aucun véhicule disponible pour le moment.</p>
            <p className="text-sm mt-2 opacity-70">Revenez bientôt ou contactez-nous directement.</p>
          </div>
        ) : (
          <div
            className="grid gap-7"
            style={{ gridTemplateColumns: `repeat(${Math.min(section.content.cardsPerRow || 3, 3)}, minmax(0, 1fr))` }}
          >
            {filtered.map((car, idx) => (
              <div
                key={car.id}
                className={`transition-all duration-500 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                style={{ transitionDelay: `${idx * 80}ms` }}
              >
                <CarCard
                  car={car}
                  global={global}
                  showPrice={section.content.showPrice}
                  showWhatsapp={section.content.showWhatsapp}
                  onClick={() => setSelectedCar(car)}
                />
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        {filtered.length > 0 && global.whatsapp && (
          <div className="text-center pt-4">
            <a
              href={`https://wa.me/${global.whatsapp.replace(/\D/g, '')}?text=Bonjour%2C%20je%20souhaite%20voir%20plus%20de%20véhicules%20disponibles.`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-sm font-black text-white transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl"
              style={{ background: `linear-gradient(135deg, ${global.primaryColor}, ${global.secondaryColor})`, boxShadow: `0 8px 32px ${global.primaryColor}30` }}
            >
              <MessageSquare className="h-4 w-4" />
              Demander plus de véhicules
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        )}
      </div>

      {selectedCar && (
        <CarDetailModal car={selectedCar} global={global} onClose={() => setSelectedCar(null)} />
      )}
    </section>
  )
}

// ─── SECTION: RENTAL FLEET ────────────────────────────────────────────────────
function RentalFleetSection({
  section, global, rentalCars
}: { section: ShowroomSection; global: ShowroomBuilderConfig['global']; rentalCars: any[] }) {
  const [selectedCar, setSelectedCar] = useState<any>(null)
  const { ref, inView } = useInView(0.1)
  const features: string[] = section.content.features || []
  const limit = section.content.limit || 6
  const cars = rentalCars.filter(c => c.status !== 'maintenance').slice(0, limit)

  return (
    <section
      id="rental"
      ref={ref}
      style={{
        background: section.styles.bgColor,
        color: section.styles.textColor,
        paddingTop: `${section.styles.paddingTop * 4}px`,
        paddingBottom: `${section.styles.paddingBottom * 4}px`
      }}
    >
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        {/* Header */}
        <div className={`text-center space-y-4 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border"
            style={{ color: global.primaryColor, borderColor: `${global.primaryColor}40`, background: `${global.primaryColor}10` }}
          >
            <Key className="h-3 w-3" />
            Location
          </div>
          <h2 className="text-4xl font-black tracking-tight" style={{ fontFamily: global.fontFamily }}>
            {section.content.title || 'Location de Véhicules'}
          </h2>
          {section.content.subtitle && (
            <p className="text-base opacity-60 max-w-2xl mx-auto leading-relaxed">{section.content.subtitle}</p>
          )}
        </div>

        {/* Features */}
        {features.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3">
            {features.map((f, i) => (
              <span
                key={i}
                className="px-4 py-2 rounded-full text-[12px] font-bold"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {f}
              </span>
            ))}
          </div>
        )}

        {/* Grid */}
        {cars.length === 0 ? (
          <div className="text-center py-20 opacity-40">
            <Key className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p className="text-base font-semibold">Aucun véhicule disponible à la location.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {cars.map((car, idx) => (
              <div
                key={car.id}
                className={`transition-all duration-500 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                style={{ transitionDelay: `${idx * 80}ms` }}
              >
                <CarCard
                  car={{ ...car, daily_rate: car.daily_rate }}
                  global={global}
                  showPrice={section.content.showDailyRate}
                  showWhatsapp={section.content.showWhatsapp}
                  onClick={() => setSelectedCar(car)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedCar && (
        <CarDetailModal car={selectedCar} global={global} onClose={() => setSelectedCar(null)} />
      )}
    </section>
  )
}

// ─── SECTION: IMPORT CALCULATOR ───────────────────────────────────────────────
function ImportCalculatorSection({
  section,
  global,
  salesCars = []
}: {
  section: ShowroomSection
  global: ShowroomBuilderConfig['global']
  salesCars: any[]
}) {
  const [selectedCar, setSelectedCar] = useState<any>(null)
  const { ref, inView } = useInView(0.1)

  const surCommandCars = salesCars.filter(c => c.car_type === 'sur_command')

  return (
    <section
      id="import"
      ref={ref}
      style={{
        background: section.styles.bgColor,
        color: section.styles.textColor,
        paddingTop: `${section.styles.paddingTop * 4}px`,
        paddingBottom: `${section.styles.paddingBottom * 4}px`
      }}
    >
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        {/* Header */}
        <div className={`text-center space-y-4 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border"
            style={{ color: global.primaryColor, borderColor: `${global.primaryColor}40`, background: `${global.primaryColor}10` }}
          >
            <Ship className="h-3 w-3" />
            Sur Commande
          </div>
          <h2 className="text-4xl font-black tracking-tight" style={{ fontFamily: global.fontFamily }}>
            {section.content.title || "Véhicules Sur Commande"}
          </h2>
          {section.content.subtitle && (
            <p className="text-base opacity-60 max-w-2xl mx-auto leading-relaxed">{section.content.subtitle}</p>
          )}
        </div>

        {/* Content Section: Sur Commande Grid or Custom Service Placement */}
        {surCommandCars.length === 0 ? (
          <div
            className="max-w-3xl mx-auto rounded-3xl p-10 text-center space-y-6 transition-all duration-700"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white"
              style={{ background: `linear-gradient(135deg, ${global.primaryColor}20, ${global.secondaryColor}20)`, border: `1px solid ${global.primaryColor}40` }}
            >
              <Ship className="h-8 w-8" style={{ color: global.primaryColor }} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white" style={{ fontFamily: global.fontFamily }}>
                Service d'Importation Sur Mesure
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed max-w-lg mx-auto">
                Vous recherchez un modèle spécifique non répertorié dans notre inventaire ? Nous importons pour vous le véhicule de vos rêves directement d'Europe, clé en main avec toutes les démarches de dédouanement simplifiées.
              </p>
            </div>
            {global.whatsapp && (
              <div className="pt-2">
                <a
                  href={`https://wa.me/${global.whatsapp.replace(/\D/g, '')}?text=Bonjour%2C%20je%20souhaite%20commander%20un%20véhicule%20spécifique%20via%20votre%20service%20d'importation.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-sm font-black text-white transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl"
                  style={{ background: `linear-gradient(135deg, ${global.primaryColor}, ${global.secondaryColor})`, boxShadow: `0 8px 32px ${global.primaryColor}30` }}
                >
                  <MessageSquare className="h-4 w-4" />
                  Lancer une commande personnalisée
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7 max-w-6xl mx-auto">
            {surCommandCars.map((car, idx) => (
              <div
                key={car.id}
                className={`transition-all duration-500 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                style={{ transitionDelay: `${idx * 80}ms` }}
              >
                <CarCard
                  car={car}
                  global={global}
                  showPrice={true}
                  showWhatsapp={true}
                  onClick={() => setSelectedCar(car)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Timeline */}
        {section.content.showTimeline && section.content.timelineSteps && (
          <div className="max-w-5xl mx-auto space-y-8 pt-10">
            <h3 className="text-xl font-black text-center opacity-80">Notre Processus d'Importation</h3>
            <div className="relative grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Connecting line */}
              <div className="hidden md:block absolute top-8 left-8 right-8 h-0.5 opacity-20"
                style={{ background: `linear-gradient(90deg, ${global.primaryColor}, ${global.secondaryColor})` }} />

              {(section.content.timelineSteps || []).map((step: any, i: number) => (
                <div key={i} className="relative text-center space-y-3 group">
                  <div
                    className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white font-black text-lg relative z-10 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: `linear-gradient(135deg, ${global.primaryColor}, ${global.secondaryColor})`, boxShadow: `0 8px 24px ${global.primaryColor}40` }}
                  >
                    {step.step}
                  </div>
                  <div className="text-xs font-black leading-tight">{step.title}</div>
                  <div className="text-[11px] opacity-50 leading-relaxed">{step.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedCar && (
        <CarDetailModal car={selectedCar} global={global} onClose={() => setSelectedCar(null)} />
      )}
    </section>
  )
}

// ─── SECTION: TIMELINE (standalone) ──────────────────────────────────────────
function TimelineSection({ section, global }: { section: ShowroomSection; global: ShowroomBuilderConfig['global'] }) {
  const { ref, inView } = useInView(0.1)
  const steps: Array<{ step: string; title: string; desc: string }> = section.content.steps || section.content.timelineSteps || []

  return (
    <section
      id="timeline"
      ref={ref}
      style={{
        background: section.styles.bgColor,
        color: section.styles.textColor,
        paddingTop: `${section.styles.paddingTop * 4}px`,
        paddingBottom: `${section.styles.paddingBottom * 4}px`
      }}
    >
      <div className="max-w-7xl mx-auto px-6 space-y-14">
        {/* Header */}
        <div className={`text-center space-y-4 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border"
            style={{ color: global.primaryColor, borderColor: `${global.primaryColor}40`, background: `${global.primaryColor}10` }}
          >
            <GitBranch className="h-3 w-3" />
            Processus
          </div>
          <h2 className="text-4xl font-black tracking-tight" style={{ fontFamily: global.fontFamily }}>
            {section.content.title || 'Notre Processus'}
          </h2>
          {section.content.subtitle && (
            <p className="text-base opacity-60 max-w-2xl mx-auto">{section.content.subtitle}</p>
          )}
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Desktop: horizontal */}
          <div className="hidden md:grid gap-6" style={{ gridTemplateColumns: `repeat(${Math.min(steps.length, 5)}, 1fr)` }}>
            {/* Connecting line */}
            <div className="absolute top-8 left-12 right-12 h-px opacity-15"
              style={{ background: `linear-gradient(90deg, ${global.primaryColor}, ${global.secondaryColor}, ${global.primaryColor})` }} />

            {steps.map((step, i) => (
              <div
                key={i}
                className={`relative text-center space-y-4 group transition-all duration-600 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${i * 120}ms` }}
              >
                <div
                  className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white font-black text-xl relative z-10 transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${global.primaryColor}, ${global.secondaryColor})`,
                    boxShadow: `0 8px 24px ${global.primaryColor}40`
                  }}
                >
                  {step.step}
                </div>
                <div className="text-sm font-black leading-tight">{step.title}</div>
                <div className="text-[12px] opacity-50 leading-relaxed">{step.desc}</div>
              </div>
            ))}
          </div>

          {/* Mobile: vertical */}
          <div className="md:hidden space-y-0">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-5 relative">
                {/* Left: number + line */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-base z-10"
                    style={{ background: `linear-gradient(135deg, ${global.primaryColor}, ${global.secondaryColor})` }}
                  >
                    {step.step}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="w-px flex-1 mt-2 mb-2" style={{ background: `${global.primaryColor}30`, minHeight: '40px' }} />
                  )}
                </div>
                {/* Right: content */}
                <div className="pb-8 pt-2 space-y-1">
                  <div className="text-sm font-black">{step.title}</div>
                  <div className="text-[12px] opacity-50 leading-relaxed">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── SECTION: SERVICES ────────────────────────────────────────────────────────
function ServicesSection({ section, global }: { section: ShowroomSection; global: ShowroomBuilderConfig['global'] }) {
  const { ref, inView } = useInView(0.1)
  const items: Array<{ icon: string; title: string; desc: string }> = section.content.items || []

  return (
    <section
      id="services"
      ref={ref}
      style={{
        background: section.styles.bgColor,
        color: section.styles.textColor,
        paddingTop: `${section.styles.paddingTop * 4}px`,
        paddingBottom: `${section.styles.paddingBottom * 4}px`
      }}
    >
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        {/* Header */}
        <div className={`text-center space-y-4 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border"
            style={{ color: global.primaryColor, borderColor: `${global.primaryColor}40`, background: `${global.primaryColor}10` }}
          >
            <Briefcase className="h-3 w-3" />
            Services
          </div>
          <h2 className="text-4xl font-black tracking-tight" style={{ fontFamily: global.fontFamily }}>
            {section.content.title || 'Nos Services'}
          </h2>
          {section.content.subtitle && (
            <p className="text-base opacity-60 max-w-2xl mx-auto">{section.content.subtitle}</p>
          )}
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item, i) => (
            <div
              key={i}
              className={`group rounded-3xl p-7 space-y-5 border transition-all duration-400 hover:-translate-y-1 hover:shadow-2xl cursor-default ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderColor: 'rgba(255,255,255,0.07)',
                transitionDelay: `${i * 100}ms`
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                style={{ background: `${global.primaryColor}20`, color: global.primaryColor }}
              >
                <DynIcon name={item.icon} className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-black leading-tight" style={{ fontFamily: global.fontFamily }}>
                  {item.title}
                </h3>
                <p className="text-[13px] opacity-55 leading-relaxed">{item.desc}</p>
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
  const { ref, inView } = useInView(0.1)
  const items: Array<{ name: string; city: string; rating: number; text: string; avatar: string }> = section.content.items || []

  return (
    <section
      id="testimonials"
      ref={ref}
      style={{
        background: section.styles.bgColor,
        color: section.styles.textColor,
        paddingTop: `${section.styles.paddingTop * 4}px`,
        paddingBottom: `${section.styles.paddingBottom * 4}px`
      }}
    >
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        {/* Header */}
        <div className={`text-center space-y-4 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border"
            style={{ color: global.primaryColor, borderColor: `${global.primaryColor}40`, background: `${global.primaryColor}10` }}
          >
            <Star className="h-3 w-3" />
            Témoignages
          </div>
          <h2 className="text-4xl font-black tracking-tight" style={{ fontFamily: global.fontFamily }}>
            {section.content.title || 'Ce que disent nos clients'}
          </h2>
          {section.content.subtitle && (
            <p className="text-base opacity-60 max-w-2xl mx-auto">{section.content.subtitle}</p>
          )}
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <div
              key={i}
              className={`rounded-3xl p-7 space-y-5 border transition-all duration-500 hover:-translate-y-1 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{
                background: 'rgba(255,255,255,0.04)',
                borderColor: 'rgba(255,255,255,0.08)',
                transitionDelay: `${i * 100}ms`,
                boxShadow: '0 4px 24px rgba(0,0,0,0.15)'
              }}
            >
              {/* Stars */}
              <div className="flex gap-1">
                {Array.from({ length: item.rating || 5 }).map((_, si) => (
                  <Star key={si} className="h-4 w-4 fill-current" style={{ color: global.secondaryColor }} />
                ))}
              </div>

              {/* Quote */}
              <p className="text-[14px] opacity-75 leading-relaxed italic">"{item.text}"</p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-2 border-t border-white/8">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-xs flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${global.primaryColor}, ${global.secondaryColor})` }}
                >
                  {item.avatar || item.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-black">{item.name}</div>
                  <div className="text-[11px] opacity-50 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {item.city}
                  </div>
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
  const { ref, inView } = useInView(0.1)
  const brands: string[] = section.content.brands || []

  return (
    <section
      id="brands"
      ref={ref}
      style={{
        background: section.styles.bgColor,
        color: section.styles.textColor,
        paddingTop: `${section.styles.paddingTop * 4}px`,
        paddingBottom: `${section.styles.paddingBottom * 4}px`
      }}
    >
      <div className="max-w-7xl mx-auto px-6 space-y-10">
        {/* Header */}
        <div className={`text-center space-y-3 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-3xl font-black tracking-tight" style={{ fontFamily: global.fontFamily }}>
            {section.content.title || 'Marques Disponibles'}
          </h2>
          {section.content.subtitle && (
            <p className="text-sm opacity-55 max-w-xl mx-auto">{section.content.subtitle}</p>
          )}
        </div>

        {/* Brands */}
        <div className={`flex flex-wrap justify-center gap-3 transition-all duration-700 ${inView ? 'opacity-100' : 'opacity-0'}`}>
          {brands.map((brand, i) => (
            <div
              key={i}
              className="px-6 py-3 rounded-2xl border text-sm font-black transition-all duration-200 hover:scale-[1.05] hover:border-opacity-50 cursor-default"
              style={{
                background: 'rgba(255,255,255,0.04)',
                borderColor: 'rgba(255,255,255,0.1)',
                transitionDelay: `${i * 30}ms`
              }}
            >
              {brand}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── SECTION: CONTACT ─────────────────────────────────────────────────────────
function ContactSection({ section, global }: { section: ShowroomSection; global: ShowroomBuilderConfig['global'] }) {
  const { ref, inView } = useInView(0.1)
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!global.whatsapp) return
    setSending(true)
    await new Promise(r => setTimeout(r, 800))
    const msg = `Bonjour%20${global.companyName}%20!%0A%0A*Nom:* ${encodeURIComponent(form.name)}%0A*Téléphone:* ${encodeURIComponent(form.phone)}%0A*Email:* ${encodeURIComponent(form.email)}%0A%0A*Message:*%0A${encodeURIComponent(form.message)}`
    window.open(`https://wa.me/${global.whatsapp.replace(/\D/g, '')}?text=${msg}`, '_blank')
    setSent(true)
    setSending(false)
  }

  return (
    <section
      id="contact"
      ref={ref}
      style={{
        background: section.styles.bgColor,
        color: section.styles.textColor,
        paddingTop: `${section.styles.paddingTop * 4}px`,
        paddingBottom: `${section.styles.paddingBottom * 4}px`
      }}
    >
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        {/* Header */}
        <div className={`text-center space-y-4 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border"
            style={{ color: global.primaryColor, borderColor: `${global.primaryColor}40`, background: `${global.primaryColor}10` }}
          >
            <Phone className="h-3 w-3" />
            Contact
          </div>
          <h2 className="text-4xl font-black tracking-tight" style={{ fontFamily: global.fontFamily }}>
            {section.content.title || 'Contactez-Nous'}
          </h2>
          {section.content.subtitle && (
            <p className="text-base opacity-60 max-w-2xl mx-auto">{section.content.subtitle}</p>
          )}
        </div>

        <div className="grid lg:grid-cols-5 gap-10">
          {/* Contact Info */}
          <div className={`lg:col-span-2 space-y-6 transition-all duration-700 ${inView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
            <div className="space-y-4">
              {global.phone && (
                <a
                  href={`tel:${global.phone}`}
                  className="flex items-start gap-4 group"
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                    style={{ background: `${global.primaryColor}20`, color: global.primaryColor }}
                  >
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wide opacity-50 mb-1">Téléphone</div>
                    <div className="text-base font-black group-hover:underline">{global.phone}</div>
                  </div>
                </a>
              )}

              {global.email && (
                <a
                  href={`mailto:${global.email}`}
                  className="flex items-start gap-4 group"
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                    style={{ background: `${global.primaryColor}20`, color: global.primaryColor }}
                  >
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wide opacity-50 mb-1">Email</div>
                    <div className="text-base font-black group-hover:underline">{global.email}</div>
                  </div>
                </a>
              )}

              {global.address && (
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${global.primaryColor}20`, color: global.primaryColor }}
                  >
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wide opacity-50 mb-1">Adresse</div>
                    <div className="text-base font-semibold opacity-80 leading-relaxed">{global.address}</div>
                  </div>
                </div>
              )}

              {global.whatsapp && (
                <a
                  href={`https://wa.me/${global.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-4 group"
                >
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110" style={{ background: '#25D36620', color: '#25D366' }}>
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wide opacity-50 mb-1">WhatsApp</div>
                    <div className="text-base font-black text-[#25D366]">{global.whatsapp}</div>
                  </div>
                </a>
              )}
            </div>

            {/* Social Links */}
            {(global.socialFacebook || global.socialInstagram) && (
              <div className="flex gap-3 pt-4 border-t border-white/8">
                {global.socialFacebook && (
                  <a
                    href={global.socialFacebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' }}
                    title="Facebook"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                )}
                {global.socialInstagram && (
                  <a
                    href={global.socialInstagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' }}
                    title="Instagram"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Form */}
          {section.content.showForm && (
            <div
              className={`lg:col-span-3 rounded-3xl p-8 space-y-5 transition-all duration-700 ${inView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {sent ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: `${global.primaryColor}20`, color: global.primaryColor }}
                  >
                    <Check className="h-8 w-8" />
                  </div>
                  <div className="text-xl font-black">Message envoyé !</div>
                  <div className="text-sm opacity-60">Nous vous contacterons dans les plus brefs délais.</div>
                  <button
                    onClick={() => setSent(false)}
                    className="text-sm font-bold underline opacity-50 hover:opacity-80"
                  >
                    Envoyer un autre message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wide opacity-50">Nom complet *</label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 text-white font-medium rounded-2xl px-4 py-3 focus:outline-none focus:ring-1 placeholder-white/20 text-sm"
                        style={{ focusRingColor: global.primaryColor } as any}
                        placeholder="Votre nom"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wide opacity-50">Téléphone *</label>
                      <input
                        type="tel"
                        required
                        value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 text-white font-medium rounded-2xl px-4 py-3 focus:outline-none focus:ring-1 placeholder-white/20 text-sm"
                        placeholder="+213 5XX XX XX XX"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wide opacity-50">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 text-white font-medium rounded-2xl px-4 py-3 focus:outline-none focus:ring-1 placeholder-white/20 text-sm"
                      placeholder="votre@email.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wide opacity-50">Message *</label>
                    <textarea
                      required
                      rows={4}
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 text-white font-medium rounded-2xl px-4 py-3 focus:outline-none focus:ring-1 placeholder-white/20 text-sm resize-none"
                      placeholder="Décrivez votre projet automobile..."
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-white text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:scale-100"
                    style={{ background: `linear-gradient(135deg, ${global.primaryColor}, ${global.secondaryColor})`, boxShadow: `0 8px 32px ${global.primaryColor}30` }}
                  >
                    {sending ? (
                      <>
                        <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        {section.content.cta || 'Envoyer le Message'}
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Map */}
        {section.content.showMap && section.content.mapEmbedUrl && (
          <div className="rounded-3xl overflow-hidden h-72 border border-white/8">
            <iframe
              src={section.content.mapEmbedUrl}
              className="w-full h-full"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Localisation"
            />
          </div>
        )}
      </div>
    </section>
  )
}

// ─── SECTION: FOOTER ──────────────────────────────────────────────────────────
function FooterSection({ section, global }: { section: ShowroomSection; global: ShowroomBuilderConfig['global'] }) {
  const columns: Array<{ title: string; items: Array<{ label: string; href: string }> }> = section.content.columns || []
  const year = new Date().getFullYear()

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
      {/* Accent top border */}
      <div className="h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${global.primaryColor}60, transparent)` }} />

      <div className="max-w-7xl mx-auto px-6 pt-12 space-y-12">
        {/* Top: Brand + columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              {global.logoUrl ? (
                <img src={global.logoUrl} alt={global.companyName} className="h-10 w-auto object-contain" />
              ) : (
                <div
                  className="h-10 px-3 rounded-xl flex items-center justify-center text-white font-black text-sm"
                  style={{ background: `linear-gradient(135deg, ${global.primaryColor}, ${global.secondaryColor})` }}
                >
                  {global.companyName.substring(0, 2).toUpperCase()}
                </div>
              )}
              <span className="font-black text-base" style={{ fontFamily: global.fontFamily }}>
                {global.companyName}
              </span>
            </div>
            <p className="text-[13px] opacity-50 leading-relaxed max-w-xs">
              {global.address}
            </p>
            {/* Socials */}
            {section.content.showSocials && (
              <div className="flex gap-2 pt-2">
                {global.socialFacebook && (
                  <a href={global.socialFacebook} target="_blank" rel="noopener noreferrer" title="Facebook"
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 hover:opacity-100"
                    style={{ background: 'rgba(255,255,255,0.06)', opacity: 0.6 }}>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                )}
                {global.socialInstagram && (
                  <a href={global.socialInstagram} target="_blank" rel="noopener noreferrer" title="Instagram"
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 hover:opacity-100"
                    style={{ background: 'rgba(255,255,255,0.06)', opacity: 0.6 }}>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  </a>
                )}
                {global.whatsapp && (
                  <a href={`https://wa.me/${global.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 hover:opacity-100"
                    style={{ background: 'rgba(37,211,102,0.15)', color: '#25D366', opacity: 0.8 }}>
                    <MessageSquare className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Link Columns */}
          {columns.map((col, ci) => (
            <div key={ci} className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest" style={{ opacity: 1 }}>{col.title}</h4>
              <ul className="space-y-2.5">
                {col.items.map((item, ii) => (
                  <li key={ii}>
                    <a
                      href={item.href}
                      className="text-[13px] font-semibold opacity-50 hover:opacity-90 transition-opacity duration-200 flex items-center gap-1.5 group"
                    >
                      {item.label}
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1 group-hover:translate-x-0 duration-200" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact quick */}
        <div
          className="rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5" style={{ color: global.primaryColor }} />
            <span className="text-sm font-black">{global.phone}</span>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5" style={{ color: global.primaryColor }} />
            <span className="text-sm font-bold opacity-70">{global.email}</span>
          </div>
          {global.whatsapp && (
            <a
              href={`https://wa.me/${global.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white transition-all hover:brightness-110 flex-shrink-0"
              style={{ background: '#25D366' }}
            >
              <MessageSquare className="h-4 w-4" />
              WhatsApp
            </a>
          )}
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.07)' }}
        >
          <p className="text-[12px] opacity-40">
            {section.content.copyrightText || `© ${year} ${global.companyName}. Tous droits réservés.`}
          </p>
          <div className="text-[11px] opacity-25 flex items-center gap-1.5">
            Propulsé par <span className="font-black opacity-60">AutoPlatform SaaS</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── MAIN RENDERER ─────────────────────────────────────────────────────────────
interface ShowroomPublicSiteProps {
  config: ShowroomBuilderConfig
  salesCars?: any[]
  rentalCars?: any[]
  isPreview?: boolean
}

export default function ShowroomPublicSite({
  config,
  salesCars = [],
  rentalCars = [],
  isPreview = false
}: ShowroomPublicSiteProps) {
  const { global, sections } = config

  // Fallback placeholder cars for preview when no real data
  const defaultSalesCars = salesCars.length > 0 ? salesCars : [
    { id: 's1', brand: 'Toyota', model: 'RAV4 Hybrid', year: 2024, condition: 'new', mileage: 0, fuel_type: 'Hybride', transmission: 'Automatique', selling_price: 8900000, car_type: 'sell', cover_image_url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80' },
    { id: 's2', brand: 'Hyundai', model: 'Tucson 2.0 Htrac', year: 2025, condition: 'new', mileage: 0, fuel_type: 'Diesel', transmission: 'Automatique', selling_price: 7200000, car_type: 'sell', cover_image_url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80' },
    { id: 's3', brand: 'Kia', model: 'Sportage GT-Line', year: 2025, condition: 'new', mileage: 0, fuel_type: 'Essence', transmission: 'Automatique', selling_price: 6900000, car_type: 'sur_command', cover_image_url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&q=80' }
  ]

  const defaultRentalCars = rentalCars.length > 0 ? rentalCars : [
    { id: 'r1', brand: 'Dacia', model: 'Sandero Stepway', year: 2025, fuel_type: 'Essence', transmission: 'Manuelle', daily_rate: 6500, security_deposit: 80000, status: 'available', images: ['https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&q=80'] },
    { id: 'r2', brand: 'Hyundai', model: 'Tucson Htrac', year: 2026, fuel_type: 'Hybride', transmission: 'Automatique', daily_rate: 18000, security_deposit: 150000, status: 'available', images: ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80'] }
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

      {/* SEO Meta (for preview only — actual pages set this server-side) */}
      {isPreview && (
        <>
          <title>{global.seoTitle}</title>
        </>
      )}

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
            return <ImportCalculatorSection key={section.id} section={section} global={global} salesCars={defaultSalesCars} />
          case 'Timeline':
            return <TimelineSection key={section.id} section={section} global={global} />
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

      {/* WhatsApp Floating Button (live site only, not in builder preview) */}
      {!isPreview && global.whatsapp && <WhatsAppFloat phone={global.whatsapp} />}
    </div>
  )
}
