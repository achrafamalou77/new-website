'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Phone, MessageSquare, Mail, ChevronLeft, ChevronRight,
  Fuel, Settings, Gauge, Calendar, MapPin, Shield, Zap, Star,
  Check, X, Send, Calculator, Award,
  ChevronDown, ChevronUp, Share2, Camera, Heart
} from 'lucide-react'
import { submitContactForm } from '@/app/actions/public-cars'

interface VehicleDetailClientProps {
  vehicle: any
  similarVehicles: any[]
  agency: any
  config: any
}

function fmtPrice(n?: number | null) {
  if (!n || n === 0) return null
  return n.toLocaleString('fr-DZ') + ' DA'
}
function fmtMileage(n: number) {
  return n === 0 ? '0 km (Neuf)' : n.toLocaleString('fr-FR') + ' km'
}

const FUEL_LABELS: Record<string, string> = {
  petrol: 'Essence', diesel: 'Diesel', hybrid: 'Hybride', electric: 'Electrique', lpg: 'GPL'
}
const TRANS_LABELS: Record<string, string> = {
  manual: 'Manuelle', automatic: 'Automatique', cvt: 'CVT', dct: 'DCT'
}
const CONDITION_LABELS: Record<string, string> = {
  new: 'Neuf', used: 'Occasion', certified_pre_owned: 'Certifie CPO', demo: 'Demo'
}
const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  sell: { label: 'En Stock', color: '#10b981' },
  sur_command: { label: 'Sur Commande', color: '#f59e0b' },
  rental: { label: 'Location', color: '#3b82f6' }
}
const CURRENCIES = [
  { code: 'EUR', rate: 147 }, { code: 'USD', rate: 135 }, { code: 'AED', rate: 36.8 }
]

function calcCustoms(fobDZD: number, year: number) {
  const age = new Date().getFullYear() - year
  const dd = age <= 1 ? 0.05 : age <= 3 ? 0.10 : 0.20
  const tva = 0.19; const taic = 0.02; const timbre = 15000
  const total = fobDZD * (1 + dd + tva + taic) + timbre
  return {
    dd: Math.round(fobDZD * dd), tva: Math.round(fobDZD * tva),
    taic: Math.round(fobDZD * taic), timbre, total: Math.round(total)
  }
}

function SpecRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
      <span className="text-sm text-slate-400 font-medium">{label}</span>
      <span className={`text-sm font-bold ${accent ? 'text-yellow-400' : 'text-white'}`}>{value}</span>
    </div>
  )
}

function Lightbox({ images, current, onClose, onChange }: {
  images: string[]; current: number; onClose: () => void; onChange: (i: number) => void
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onChange(Math.max(0, current - 1))
      if (e.key === 'ArrowRight') onChange(Math.min(images.length - 1, current + 1))
    }
    window.addEventListener('keydown', h)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = '' }
  }, [current, images.length, onClose, onChange])

  return (
    <div className="fixed inset-0 z-[500] bg-black/95 flex items-center justify-center" onClick={onClose}>
      <button onClick={onClose} className="absolute top-5 right-5 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition z-10"><X className="h-6 w-6" /></button>
      <button onClick={e => { e.stopPropagation(); onChange(Math.max(0, current - 1)) }} className="absolute left-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition z-10" disabled={current === 0}><ChevronLeft className="h-6 w-6" /></button>
      <img src={images[current]} alt="" className="max-w-[90vw] max-h-[85vh] object-contain" onClick={e => e.stopPropagation()} />
      <button onClick={e => { e.stopPropagation(); onChange(Math.min(images.length - 1, current + 1)) }} className="absolute right-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition z-10" disabled={current === images.length - 1}><ChevronRight className="h-6 w-6" /></button>
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
        {images.map((_, i) => (
          <button key={i} onClick={e => { e.stopPropagation(); onChange(i) }} className={`h-1.5 rounded-full transition-all ${i === current ? 'w-8 bg-white' : 'w-2 bg-white/40'}`} />
        ))}
      </div>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/50 text-white text-xs">{current + 1} / {images.length}</div>
    </div>
  )
}

export default function VehicleDetailClient({ vehicle, similarVehicles, agency, config }: VehicleDetailClientProps) {
  const primaryColor = config?.global?.primaryColor || '#3b82f6'
  const whatsapp = config?.global?.whatsapp || agency?.phone || ''
  const phone = config?.global?.phone || agency?.phone || ''
  const companyName = config?.global?.companyName || agency?.company_name || ''
  const subdomain = agency?.subdomain || ''

  const rawImages: string[] = []
  if (vehicle.cover_image_url) rawImages.push(vehicle.cover_image_url)
  if (Array.isArray(vehicle.images)) {
    vehicle.images.forEach((img: string) => { if (img && !rawImages.includes(img)) rawImages.push(img) })
  }
  const images = rawImages.length > 0 ? rawImages : ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80']

  const [activeImg, setActiveImg] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactMessage, setContactMessage] = useState('')
  const [contactSending, setContactSending] = useState(false)
  const [contactSent, setContactSent] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  const [calcFob, setCalcFob] = useState<number>(vehicle.selling_price || 0)
  const [calcCurrency, setCalcCurrency] = useState('EUR')
  const [showFeatures, setShowFeatures] = useState(true)
  const [liked, setLiked] = useState(false)

  const features: string[] = Array.isArray(vehicle.features) ? vehicle.features : []
  const typeConfig = TYPE_LABELS[vehicle.car_type || 'sell'] || TYPE_LABELS.sell
  const vehicleName = `${vehicle.brand || ''} ${vehicle.model || ''}`.trim()
  const vehicleTitle = `${vehicleName} ${vehicle.year || ''} ${vehicle.version || ''}`.trim()
  const curr = CURRENCIES.find(c => c.code === calcCurrency) || CURRENCIES[0]
  const fobDZD = calcFob * curr.rate
  const customs = calcCustoms(fobDZD, vehicle.year || new Date().getFullYear())
  const whatsappMsg = encodeURIComponent(`Bonjour ${companyName}, je suis interesse par le ${vehicleTitle}. Pouvez-vous me donner plus d informations?`)

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactName || !contactPhone) return
    setContactSending(true)
    try {
      await submitContactForm(
        { name: contactName, phone: contactPhone, email: contactEmail, message: contactMessage || `Interesse par: ${vehicleTitle}` },
        agency.id
      )
    } catch { /* silent */ } finally {
      setContactSending(false)
      setContactSent(true)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#080808', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <nav className="sticky top-0 z-50 border-b" style={{ background: 'rgba(8,8,8,0.95)', borderColor: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={`/${subdomain}/vehicles`} className="flex items-center gap-2 text-slate-400 hover:text-white transition text-sm font-medium">
            <ArrowLeft className="h-4 w-4" />Retour au Stock
          </Link>
          <div className="flex items-center gap-3">
            <button onClick={() => setLiked(!liked)} className={`p-2 rounded-xl border transition-all ${liked ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'border-white/10 text-slate-400 hover:text-white'}`}>
              <Heart className="h-4 w-4" fill={liked ? 'currentColor' : 'none'} />
            </button>
            <button onClick={() => navigator.clipboard?.writeText(window.location.href)} className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white transition">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr_420px] gap-10">
          <div className="space-y-6">
            <div className="relative rounded-3xl overflow-hidden bg-black aspect-[16/10] cursor-zoom-in group" onClick={() => setLightboxOpen(true)}>
              <img src={images[activeImg]} alt={vehicleTitle} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80' }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <div className="absolute top-5 left-5">
                <span className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider text-white" style={{ background: typeConfig.color }}>{typeConfig.label}</span>
              </div>
              <div className="absolute bottom-5 right-5 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
                <Camera className="h-3.5 w-3.5" />{images.length} photo{images.length > 1 ? 's' : ''}
              </div>
              {images.length > 1 && (
                <>
                  <button className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition hover:bg-black/70" onClick={e => { e.stopPropagation(); setActiveImg(i => Math.max(0, i - 1)) }}><ChevronLeft className="h-5 w-5" /></button>
                  <button className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition hover:bg-black/70" onClick={e => { e.stopPropagation(); setActiveImg(i => Math.min(images.length - 1, i + 1)) }}><ChevronRight className="h-5 w-5" /></button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)} className={`flex-shrink-0 h-20 w-28 rounded-2xl overflow-hidden border-2 transition-all ${i === activeImg ? 'opacity-100 scale-105' : 'opacity-50 hover:opacity-75'}`} style={{ borderColor: i === activeImg ? primaryColor : 'rgba(255,255,255,0.1)' }}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="rounded-3xl border p-7" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <h3 className="text-lg font-black mb-5 flex items-center gap-2"><Gauge className="h-5 w-5" style={{ color: primaryColor }} />Fiche Technique</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {([
                  { icon: Fuel, label: 'Carburant', value: FUEL_LABELS[vehicle.fuel_type] || vehicle.fuel_type },
                  { icon: Settings, label: 'Boite', value: TRANS_LABELS[vehicle.transmission] || vehicle.transmission },
                  { icon: Gauge, label: 'Kilometrage', value: vehicle.mileage !== undefined ? fmtMileage(Number(vehicle.mileage)) : null },
                  { icon: Calendar, label: 'Annee', value: vehicle.year?.toString() },
                ] as Array<{icon: React.ComponentType<{className?:string}>, label: string, value: string | null | undefined}>).filter(s => s.value).map((spec, i) => (
                  <div key={i} className="rounded-2xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <spec.icon className="h-5 w-5 mx-auto mb-2 opacity-60" />
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">{spec.label}</div>
                    <div className="text-sm font-black text-white mt-0.5">{spec.value}</div>
                  </div>
                ))}
              </div>
              {vehicle.engine_size && <SpecRow label="Cylindree" value={`${vehicle.engine_size}L`} />}
              {vehicle.horsepower && <SpecRow label="Puissance" value={`${vehicle.horsepower} CV`} accent />}
              {vehicle.body_type && <SpecRow label="Carrosserie" value={vehicle.body_type} />}
              {vehicle.doors && <SpecRow label="Portes" value={`${vehicle.doors} portes`} />}
              {vehicle.seats && <SpecRow label="Places" value={`${vehicle.seats} places`} />}
              {vehicle.color_exterior && <SpecRow label="Couleur ext." value={vehicle.color_exterior} />}
              {vehicle.color_interior && <SpecRow label="Couleur int." value={vehicle.color_interior} />}
              {vehicle.origin_country && <SpecRow label="Pays d origine" value={vehicle.origin_country} />}
              {vehicle.vin && <SpecRow label="VIN" value={vehicle.vin} />}
              {vehicle.stock_number && <SpecRow label="N Stock" value={vehicle.stock_number} />}
            </div>

            {features.length > 0 && (
              <div className="rounded-3xl border p-7" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
                <button className="w-full flex items-center justify-between" onClick={() => setShowFeatures(!showFeatures)}>
                  <h3 className="text-lg font-black flex items-center gap-2"><Star className="h-5 w-5" style={{ color: primaryColor }} />Equipements<span className="text-sm font-bold text-slate-500 ml-1">({features.length})</span></h3>
                  {showFeatures ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                </button>
                {showFeatures && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {features.map((feat, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background: `${primaryColor}15`, border: `1px solid ${primaryColor}25`, color: primaryColor }}>
                        <Check className="h-3 w-3" />{feat}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {(vehicle.warranty_months > 0 || vehicle.warranty_km > 0) && (
              <div className="rounded-3xl border p-6 flex items-start gap-4" style={{ background: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.15)' }}>
                <Shield className="h-8 w-8 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-emerald-400">Garantie incluse</h4>
                  <p className="text-sm text-emerald-300/70 mt-1">
                    {vehicle.warranty_months > 0 && `${vehicle.warranty_months} mois`}
                    {vehicle.warranty_months > 0 && vehicle.warranty_km > 0 && ' / '}
                    {vehicle.warranty_km > 0 && `${(vehicle.warranty_km as number).toLocaleString('fr-FR')} km`}
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-3xl border overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <button className="w-full flex items-center justify-between p-6 text-left" onClick={() => setShowCalculator(!showCalculator)}>
                <div className="flex items-center gap-3">
                  <Calculator className="h-6 w-6" style={{ color: primaryColor }} />
                  <div>
                    <div className="font-black">Calculateur de Dedouanement</div>
                    <div className="text-xs text-slate-500 mt-0.5">Estimez les frais douaniers algeriens</div>
                  </div>
                </div>
                {showCalculator ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
              </button>
              {showCalculator && (
                <div className="px-6 pb-6 space-y-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div className="flex gap-3 mt-4">
                    <div className="flex-1">
                      <label className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-2 block">Valeur FOB</label>
                      <input type="number" value={calcFob} onChange={e => setCalcFob(Number(e.target.value))} className="w-full px-4 py-3 rounded-2xl text-sm font-bold text-white border outline-none" style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-2 block">Devise</label>
                      <select value={calcCurrency} onChange={e => setCalcCurrency(e.target.value)} className="h-[46px] px-4 py-3 rounded-2xl text-sm font-bold text-white border outline-none" style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }}>
                        {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="rounded-2xl p-4 space-y-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex justify-between text-sm"><span className="text-slate-400">Valeur FOB (DZD)</span><span className="font-bold">{fobDZD.toLocaleString('fr-DZ')} DA</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-400">Droits de Douane</span><span className="font-bold">{customs.dd.toLocaleString('fr-DZ')} DA</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-400">TVA (19%)</span><span className="font-bold">{customs.tva.toLocaleString('fr-DZ')} DA</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-400">TAIC (2%)</span><span className="font-bold">{customs.taic.toLocaleString('fr-DZ')} DA</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-400">Timbre</span><span className="font-bold">{customs.timbre.toLocaleString('fr-DZ')} DA</span></div>
                    <div className="border-t pt-2 flex justify-between font-black" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                      <span>Total estime</span><span style={{ color: primaryColor }}>{customs.total.toLocaleString('fr-DZ')} DA</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-600">* Estimation indicative uniquement.</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border p-7 space-y-4" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide text-white" style={{ background: typeConfig.color }}>{typeConfig.label}</span>
                {vehicle.condition && <span className="px-3 py-1 rounded-full text-xs font-bold border text-slate-300" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>{CONDITION_LABELS[vehicle.condition] || vehicle.condition}</span>}
                {vehicle.year && <span className="px-3 py-1 rounded-full text-xs font-bold border text-slate-300" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>{vehicle.year}</span>}
              </div>
              <div>
                <h1 className="text-3xl font-black leading-tight">{vehicleName}</h1>
                {(vehicle.version || vehicle.variant) && <p className="text-slate-400 font-medium mt-1">{vehicle.version || vehicle.variant}</p>}
              </div>
              {vehicle.car_type === 'rental' ? (
                <div className="rounded-2xl p-5" style={{ background: `${primaryColor}12`, border: `1px solid ${primaryColor}25` }}>
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wide">Tarif de location</div>
                  <div className="text-4xl font-black mt-2" style={{ color: primaryColor }}>{fmtPrice(vehicle.daily_rate)}<span className="text-lg font-bold text-slate-400 ml-1">/jour</span></div>
                </div>
              ) : (
                <div className="rounded-2xl p-5" style={{ background: `${primaryColor}12`, border: `1px solid ${primaryColor}25` }}>
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wide">{vehicle.car_type === 'sur_command' ? 'Prix estimatif' : 'Prix de vente'}</div>
                  {(vehicle.selling_price || vehicle.final_price || vehicle.price) ? (
                    <div className="text-4xl font-black mt-2" style={{ color: primaryColor }}>{fmtPrice(vehicle.final_price || vehicle.selling_price || vehicle.price)}</div>
                  ) : (
                    <div className="text-2xl font-black mt-2 text-slate-400">Prix sur demande</div>
                  )}
                  {vehicle.negotiable && <div className="flex items-center gap-1.5 mt-2 text-emerald-400 text-xs font-bold"><Check className="h-3.5 w-3.5" />Prix negociable</div>}
                </div>
              )}
              {vehicle.showroom_location && <div className="flex items-center gap-2 text-sm text-slate-400"><MapPin className="h-4 w-4 text-slate-500 flex-shrink-0" />{vehicle.showroom_location}</div>}
            </div>

            <div className="space-y-3">
              {whatsapp && (
                <a href={`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2.5 w-full py-4 rounded-2xl font-black text-white transition-all hover:brightness-110 hover:scale-[1.01] shadow-lg" style={{ background: '#25D366', boxShadow: '0 8px 32px rgba(37,211,102,0.25)' }}>
                  <MessageSquare className="h-5 w-5" />Demander sur WhatsApp
                </a>
              )}
              {phone && (
                <a href={`tel:${phone}`} className="flex items-center justify-center gap-2.5 w-full py-4 rounded-2xl font-black text-white border transition-all hover:bg-white/8" style={{ border: '1px solid rgba(255,255,255,0.15)' }}>
                  <Phone className="h-5 w-5" />Appeler le showroom
                </a>
              )}
              <button onClick={() => setShowContactForm(!showContactForm)} className="flex items-center justify-center gap-2.5 w-full py-4 rounded-2xl font-bold transition-all hover:brightness-110" style={{ background: `${primaryColor}20`, border: `1px solid ${primaryColor}30`, color: primaryColor }}>
                <Mail className="h-5 w-5" />{showContactForm ? 'Fermer le formulaire' : 'Laisser un message'}
              </button>
            </div>

            {showContactForm && (
              <div className="rounded-3xl border p-6" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
                {contactSent ? (
                  <div className="text-center py-6">
                    <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: `${primaryColor}20` }}><Check className="h-7 w-7" style={{ color: primaryColor }} /></div>
                    <h4 className="font-black text-xl text-white mb-2">Message envoye!</h4>
                    <p className="text-slate-400 text-sm">Notre equipe vous contactera dans les plus brefs delais.</p>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-3">
                    <h4 className="font-black text-base mb-4">Demande d informations</h4>
                    <input type="text" placeholder="Votre nom complet *" required value={contactName} onChange={e => setContactName(e.target.value)} className="w-full px-4 py-3 rounded-2xl text-sm text-white border outline-none" style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }} />
                    <input type="tel" placeholder="Telephone *" required value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="w-full px-4 py-3 rounded-2xl text-sm text-white border outline-none" style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }} />
                    <input type="email" placeholder="Email (optionnel)" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="w-full px-4 py-3 rounded-2xl text-sm text-white border outline-none" style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }} />
                    <textarea placeholder={`Je suis interesse par le ${vehicleName}...`} rows={3} value={contactMessage} onChange={e => setContactMessage(e.target.value)} className="w-full px-4 py-3 rounded-2xl text-sm text-white border resize-none outline-none" style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }} />
                    <button type="submit" disabled={contactSending} className="w-full py-3.5 rounded-2xl font-black text-white transition-all hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2" style={{ background: primaryColor }}>
                      {contactSending ? <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <Send className="h-4 w-4" />}
                      {contactSending ? 'Envoi...' : 'Envoyer la demande'}
                    </button>
                  </form>
                )}
              </div>
            )}

            <div className="rounded-3xl border p-6" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white text-sm" style={{ background: primaryColor }}>{companyName.charAt(0)}</div>
                <div><div className="font-black text-sm">{companyName}</div><div className="text-xs text-slate-500">Vendeur verifie</div></div>
                <Award className="h-4 w-4 text-yellow-400 ml-auto" />
              </div>
            </div>
          </div>
        </div>

        {similarVehicles.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black">Vehicules similaires</h2>
              <Link href={`/${subdomain}/vehicles`} className="text-sm font-bold hover:underline" style={{ color: primaryColor }}>Voir tout</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarVehicles.slice(0, 3).map((sv: any) => {
                const svImage = sv.cover_image_url || sv.images?.[0] || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80'
                const svPrice = sv.selling_price || sv.price || sv.daily_rate
                const svName = `${sv.brand} ${sv.model}`
                const svType = TYPE_LABELS[sv.car_type || 'sell'] || TYPE_LABELS.sell
                return (
                  <Link key={sv.id} href={`/${subdomain}/vehicles/${sv.id}`} className="group block rounded-3xl overflow-hidden border transition-all hover:-translate-y-1" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
                    <div className="relative h-48 overflow-hidden">
                      <img src={svImage} alt={svName} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80' }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <div className="absolute top-3 left-3"><span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase text-white" style={{ background: svType.color }}>{svType.label}</span></div>
                      {svPrice > 0 && <div className="absolute bottom-3 left-3 text-lg font-black text-white">{svPrice.toLocaleString('fr-DZ')} DA</div>}
                    </div>
                    <div className="p-4"><div className="font-black">{svName}</div><div className="text-sm text-slate-400">{sv.year}</div></div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </div>

      {lightboxOpen && <Lightbox images={images} current={activeImg} onClose={() => setLightboxOpen(false)} onChange={setActiveImg} />}

      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 flex gap-3 z-40" style={{ background: 'rgba(8,8,8,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {phone && <a href={`tel:${phone}`} className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white border" style={{ border: '1px solid rgba(255,255,255,0.15)' }}><Phone className="h-4 w-4" />Appeler</a>}
        {whatsapp && <a href={`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm text-white" style={{ background: '#25D366' }}><MessageSquare className="h-4 w-4" />WhatsApp</a>}
      </div>
      <div className="lg:hidden h-20" />
    </div>
  )
}