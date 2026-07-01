'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowRight, Check, ChevronDown, Headphones, Loader2, LockKeyhole,
  Minus, PackageCheck, Plus, ShieldCheck, ShoppingBag, Star, Truck,
} from 'lucide-react'
import { placePublicEcommerceOrder } from '@/app/actions/ecommerce'
import type { EcommerceProduct, EcommerceProductPage, EcommerceShippingZone, LandingPageTheme } from '@/types/ecommerce'

type Faq = { question: string; answer: string }
type Proof = { quote: string; author: string }
type VariantGroup = { name: string; options: string[] }

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}
function variantsFrom(value: unknown): VariantGroup[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const c = item as { name?: unknown; options?: unknown }
    const options = strings(c.options)
    return typeof c.name === 'string' && options.length ? [{ name: c.name, options }] : []
  })
}
function money(value: number) { return `${Number(value || 0).toLocaleString('fr-DZ')} DZD` }
function themeFrom(value: unknown): Required<LandingPageTheme> {
  const t = (value && typeof value === 'object' ? value : {}) as LandingPageTheme
  return {
    primary: t.primary || '#7c3aed', accent: t.accent || '#111827',
    background: t.background || '#f8fafc', surface: t.surface || '#ffffff',
    text: t.text || '#111827', style: t.style || 'bold', font: t.font || 'outfit',
    heroLayout: t.heroLayout || 'split', radius: t.radius || 'rounded',
    badge: t.badge || '', announcement: t.announcement || 'Livraison disponible avec paiement a la reception',
    trustNote: t.trustNote || 'Votre commande est confirmee avant expedition',
    allowedShippingZoneIds: t.allowedShippingZoneIds || [],
    showRelatedProducts: t.showRelatedProducts ?? true, showStickyCta: t.showStickyCta ?? true,
  }
}

interface LandingProps {
  agency: { id: string; company_name: string; phone: string | null }
  product: EcommerceProduct
  landing: EcommerceProductPage
  shippingZones: EcommerceShippingZone[]
  relatedProducts: EcommerceProduct[]
}

// ─── Route by theme.style ──────────────────────────────────────────────────────
export default function EcommerceLandingPage(props: LandingProps) {
  const theme = themeFrom(props.landing.theme)
  switch (theme.style) {
    case 'editorial': return <LandingEditorial {...props} />
    case 'luxury':    return <LandingLuxury {...props} />
    case 'playful':   return <LandingPlayful {...props} />
    case 'minimal':   return <LandingMinimal {...props} />
    case 'bold':      return <LandingBold {...props} />
    default:          return <LandingClassic {...props} />
  }
}

// ─── Shared OrderForm ─────────────────────────────────────────────────────────
function OrderForm({
  agency, product, landing, shippingZones,
  theme, radius, font,
}: {
  agency: LandingProps['agency']
  product: EcommerceProduct
  landing: EcommerceProductPage
  shippingZones: EcommerceShippingZone[]
  theme: Required<LandingPageTheme>
  radius: string
  font: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [quantity, setQuantity] = useState(1)
  const [shippingId, setShippingId] = useState(shippingZones[0]?.id || '')
  const [error, setError] = useState('')
  const variantGroups = variantsFrom(product.variants)
  const initialVariants = useMemo(
    () => Object.fromEntries(variantGroups.map((g) => [g.name, g.options[0]])),
    [product.id]
  )
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(initialVariants)
  const selectedShipping = shippingZones.find((z) => z.id === shippingId)
  const subtotal = product.price * quantity
  const shippingFee = selectedShipping?.base_fee || 0
  const total = subtotal + shippingFee

  function submit(formData: FormData) {
    setError('')
    const campaign = Object.fromEntries(
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'ttclid']
        .map((k) => [k, searchParams.get(k)])
        .filter((e): e is [string, string] => Boolean(e[1]))
    )
    startTransition(async () => {
      const result = await placePublicEcommerceOrder({
        agencyId: agency.id, productId: product.id, landingPageId: landing.id,
        customerName: formData.get('name'), customerPhone: formData.get('phone'),
        customerCity: formData.get('city'), customerAddress: formData.get('address'),
        shippingZoneId: formData.get('shippingZoneId') || null,
        promotionCode: formData.get('promotionCode'), notes: formData.get('notes'),
        quantity, variant: selectedVariants, campaign,
      })
      if (!result.success) { setError(result.error); return }
      router.push(`/order/${result.order.public_token}`)
    })
  }

  return (
    <form action={submit} style={{ border: '1px solid rgba(0,0,0,0.06)', background: theme.surface, padding: '28px 28px 32px', borderRadius: radius }}>
      <div style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: 18, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: theme.primary, marginBottom: 4 }}>Votre commande</p>
          <h3 style={{ fontWeight: 900, fontSize: 18 }}>{product.name}</h3>
        </div>
        <strong style={{ fontSize: 22, fontWeight: 900, color: theme.primary }}>{money(product.price)}</strong>
      </div>

      {variantGroups.map((g) => (
        <div key={g.name} style={{ marginBottom: 18 }}>
          <p style={{ fontSize: 12, fontWeight: 800, marginBottom: 8 }}>{g.name}: <span style={{ color: theme.primary }}>{selectedVariants[g.name]}</span></p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {g.options.map((opt) => (
              <button key={opt} type="button" onClick={() => setSelectedVariants((v) => ({ ...v, [g.name]: opt }))}
                style={{ padding: '6px 14px', border: `2px solid ${selectedVariants[g.name] === opt ? theme.primary : 'rgba(0,0,0,0.1)'}`, background: selectedVariants[g.name] === opt ? `${theme.primary}12` : 'transparent', color: selectedVariants[g.name] === opt ? theme.primary : theme.text, borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <Field name="name" label="Nom complet" placeholder="Votre nom" required theme={theme} radius={radius} />
        <Field name="phone" label="Téléphone" type="tel" placeholder="0555 12 34 56" required theme={theme} radius={radius} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 800 }}>Quantité</label>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 6, padding: '0 14px', height: 44 }}>
            <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))}><Minus style={{ width: 14, height: 14 }} /></button>
            <span style={{ fontWeight: 900 }}>{quantity}</span>
            <button type="button" onClick={() => setQuantity((q) => Math.min(20, q + 1))}><Plus style={{ width: 14, height: 14 }} /></button>
          </span>
        </div>
        <Field name="city" label="Wilaya" placeholder="Alger, Oran..." required theme={theme} radius={radius} />
      </div>

      {shippingZones.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 12, fontWeight: 800, marginBottom: 8 }}>Mode de livraison</p>
          <div style={{ display: 'grid', gap: 8 }}>
            {shippingZones.map((z) => (
              <label key={z.id} style={{ cursor: 'pointer', border: `1px solid ${shippingId === z.id ? theme.primary : 'rgba(0,0,0,0.1)'}`, background: shippingId === z.id ? `${theme.primary}08` : 'transparent', borderRadius: 6, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <input className="sr-only" type="radio" name="shippingZoneId" value={z.id} checked={shippingId === z.id} onChange={() => setShippingId(z.id)} required />
                <span><strong style={{ display: 'block', fontSize: 13 }}>{z.name}</strong><span style={{ fontSize: 11, opacity: 0.6 }}>{z.carrier}{z.estimated_days ? ` · ${z.estimated_days}` : ''}</span></span>
                <strong style={{ fontSize: 13, color: theme.primary }}>{money(z.base_fee)}</strong>
              </label>
            ))}
          </div>
        </div>
      )}

      <label style={{ display: 'block', marginBottom: 14 }}>
        <span style={{ fontSize: 12, fontWeight: 800, display: 'block', marginBottom: 6 }}>Adresse complète</span>
        <textarea name="address" required minLength={5} placeholder="Rue, quartier, point de repère..." style={{ width: '100%', minHeight: 80, border: '1px solid rgba(0,0,0,0.1)', background: 'transparent', borderRadius: 6, padding: '10px 14px', outline: 'none', fontSize: 13, boxSizing: 'border-box' }} />
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        <Field name="promotionCode" label="Code promo" placeholder="Optionnel" theme={theme} radius={radius} />
        <Field name="notes" label="Note" placeholder="Couleur, horaire..." theme={theme} radius={radius} />
      </div>

      <div style={{ borderTop: '1px dashed rgba(0,0,0,0.08)', paddingTop: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}><span style={{ opacity: 0.6 }}>Sous-total</span><strong>{money(subtotal)}</strong></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}><span style={{ opacity: 0.6 }}>Livraison</span><strong>{money(shippingFee)}</strong></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18 }}><span style={{ fontWeight: 900 }}>Total</span><strong style={{ color: theme.primary }}>{money(total)}</strong></div>
      </div>

      {error && <p style={{ marginBottom: 14, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626', fontWeight: 700 }}>{error}</p>}

      <button disabled={pending || product.stock_quantity < 1 || (shippingZones.length > 0 && !shippingId)}
        style={{ width: '100%', background: theme.primary, color: '#fff', border: 'none', padding: '16px 24px', borderRadius: 8, fontSize: 15, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: pending ? 0.6 : 1 }}>
        {pending ? <Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} /> : <ShoppingBag style={{ width: 18, height: 18 }} />}
        Confirmer · {money(total)}
      </button>
      <p style={{ marginTop: 12, textAlign: 'center', fontSize: 11, opacity: 0.45, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <ShieldCheck style={{ width: 13, height: 13 }} /> Prix et stock vérifiés sur le serveur.
      </p>
    </form>
  )
}

function Field({ name, label, type = 'text', placeholder, required = false, theme, radius }: { name: string; label: string; type?: string; placeholder?: string; required?: boolean; theme: Required<LandingPageTheme>; radius: string }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 800 }}>{label}</span>
      <input name={name} type={type} placeholder={placeholder} required={required}
        style={{ height: 44, border: '1px solid rgba(0,0,0,0.1)', background: 'transparent', borderRadius: 6, padding: '0 14px', outline: 'none', fontSize: 13 }} />
    </label>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// THEME 1: EDITORIAL — Magazine-style, large editorial type
// ═══════════════════════════════════════════════════════════════════════════════
function LandingEditorial({ agency, product, landing, shippingZones, relatedProducts }: LandingProps) {
  const theme = themeFrom(landing.theme)
  const [activeImage, setActiveImage] = useState(0)
  const images = strings(product.images)
  const benefits = strings(landing.benefits)
  const faq = Array.isArray(landing.faq) ? landing.faq as Faq[] : []
  const proof = Array.isArray(landing.social_proof) ? landing.social_proof as Proof[] : []
  const discount = product.compare_at_price && product.compare_at_price > product.price
    ? Math.round((1 - product.price / product.compare_at_price) * 100) : 0
  const PRIMARY = theme.primary || '#0f172a'
  const font = '"Georgia", "Times New Roman", serif'
  const radius = '4px'

  return (
    <main style={{ background: '#fafaf8', color: '#0f172a', fontFamily: font, minHeight: '100vh', overflowX: 'hidden' }}>
      <div style={{ background: PRIMARY, color: '#fff', textAlign: 'center', padding: '8px 16px', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
        {theme.announcement}
      </div>

      {/* Editorial header */}
      <header style={{ borderBottom: '2px solid #0f172a', position: 'sticky', top: 0, zIndex: 40, background: '#fafaf8' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <a href="#" style={{ fontWeight: 900, fontSize: 22, letterSpacing: '-0.03em', textDecoration: 'none', color: '#0f172a', fontFamily: '"Georgia", serif' }}>
            {agency.company_name}
          </a>
          <nav style={{ display: 'flex', gap: 28, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            <a href="#product" style={{ color: '#0f172a', textDecoration: 'none' }}>Produit</a>
            <a href="#order" style={{ color: '#0f172a', textDecoration: 'none' }}>Commander</a>
          </nav>
          <a href="#order" style={{ background: '#0f172a', color: '#fff', padding: '8px 18px', fontSize: 11, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: 2 }}>
            {landing.cta_text}
          </a>
        </div>
      </header>

      {/* Editorial hero — full-width masthead */}
      <section style={{ borderBottom: '1px solid #e2e8f0', padding: '48px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'start' }}>
            {/* Image */}
            <div>
              <div style={{ border: '1px solid #e2e8f0', overflow: 'hidden', background: '#f1f5f9', aspectRatio: '4/5' }}>
                {images[activeImage] ? (
                  <img src={images[activeImage]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, opacity: 0.4 }}>Photo du produit</div>
                )}
              </div>
              {images.length > 1 && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  {images.slice(0, 4).map((img, i) => (
                    <button key={img} onClick={() => setActiveImage(i)}
                      style={{ width: 60, height: 60, overflow: 'hidden', border: `2px solid ${activeImage === i ? '#0f172a' : 'transparent'}`, padding: 2, cursor: 'pointer', background: 'none' }}>
                      <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Copy */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, borderBottom: '1px solid #e2e8f0', paddingBottom: 16 }}>
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: PRIMARY }}>{theme.badge || product.category}</span>
                {product.stock_quantity > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: '#16a34a' }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />En stock</span>}
              </div>
              <h1 style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 900, lineHeight: 1.0, letterSpacing: '-0.02em', marginBottom: 16 }}>{landing.headline}</h1>
              <p style={{ fontSize: 18, lineHeight: 1.6, opacity: 0.65, marginBottom: 24, borderBottom: '1px solid #e2e8f0', paddingBottom: 24 }}>{landing.subheadline}</p>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 28 }}>
                <strong style={{ fontSize: 36, fontWeight: 900, color: PRIMARY }}>{money(product.price)}</strong>
                {product.compare_at_price && product.compare_at_price > product.price && (
                  <span style={{ fontSize: 18, opacity: 0.4, textDecoration: 'line-through' }}>{money(product.compare_at_price)}</span>
                )}
                {discount > 0 && <span style={{ background: PRIMARY, color: '#fff', padding: '3px 8px', fontSize: 12, fontWeight: 900 }}>-{discount}%</span>}
              </div>

              <a href="#order" style={{ display: 'block', textAlign: 'center', background: '#0f172a', color: '#fff', padding: '18px 24px', fontWeight: 900, fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none', marginBottom: 16, borderRadius: 2 }}>
                {landing.cta_text} <ArrowRight style={{ display: 'inline', width: 16, height: 16 }} />
              </a>
              {agency.phone && (
                <a href={`tel:${agency.phone}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: '1px solid #0f172a', padding: '14px 24px', fontWeight: 700, fontSize: 13, textDecoration: 'none', color: '#0f172a', borderRadius: 2 }}>
                  <Headphones style={{ width: 16, height: 16 }} /> Appeler
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Editorial description */}
      <section style={{ padding: '64px 24px', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 64 }}>
          <div>
            <h2 style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', color: PRIMARY, marginBottom: 8 }}>Description</h2>
            <div style={{ width: 40, height: 3, background: PRIMARY }} />
          </div>
          <div>
            <p style={{ fontSize: 17, lineHeight: 1.9, opacity: 0.7 }}>{landing.description}</p>
            {benefits.length > 0 && (
              <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {benefits.map((b, i) => (
                  <div key={b} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ background: PRIMARY, color: '#fff', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 900 }}>{String(i + 1).padStart(2, '0')}</span>
                    <span style={{ fontSize: 14, lineHeight: 1.5, fontWeight: 600 }}>{b}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {proof.length > 0 && (
        <section style={{ padding: '64px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <h2 style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 40 }}>Témoignages</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 32 }}>
              {proof.map((p) => (
                <blockquote key={p.author} style={{ borderLeft: `3px solid ${PRIMARY}`, paddingLeft: 20 }}>
                  <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>
                    {[1,2,3,4,5].map((s) => <Star key={s} style={{ width: 14, height: 14, fill: '#f59e0b', color: '#f59e0b' }} />)}
                  </div>
                  <p style={{ fontSize: 16, fontStyle: 'italic', lineHeight: 1.7, marginBottom: 12 }}>&ldquo;{p.quote}&rdquo;</p>
                  <footer style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: PRIMARY }}>{p.author}</footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Order form */}
      <section id="order" style={{ padding: '64px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: 16, marginBottom: 40 }}>
            <h2 style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase' }}>Passer Commande</h2>
          </div>
          <OrderForm agency={agency} product={product} landing={landing} shippingZones={shippingZones} theme={theme} radius={radius} font={font} />
        </div>
      </section>

      {/* FAQ */}
      {faq.length > 0 && (
        <section id="faq" style={{ padding: '64px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <h2 style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 40 }}>Questions Fréquentes</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {faq.map((q) => (
                <details key={q.question} style={{ borderBottom: '1px solid #e2e8f0', padding: '16px 0' }}>
                  <summary style={{ fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
                    {q.question} <ChevronDown style={{ width: 18, height: 18, flexShrink: 0 }} />
                  </summary>
                  <p style={{ marginTop: 12, fontSize: 14, lineHeight: 1.7, opacity: 0.65 }}>{q.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer style={{ background: '#0f172a', color: '#fff', padding: '32px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontWeight: 900, fontFamily: '"Georgia", serif' }}>{agency.company_name}</span>
        <span style={{ fontSize: 12, opacity: 0.5 }}>© {new Date().getFullYear()}</span>
      </footer>

      {theme.showStickyCta && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(250,250,248,0.95)', backdropFilter: 'blur(12px)', borderTop: '1px solid #e2e8f0', padding: '12px 16px' }}>
          <a href="#order" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0f172a', color: '#fff', padding: '13px 20px', borderRadius: 2, fontWeight: 900, fontSize: 13, textDecoration: 'none' }}>
            <span>{landing.cta_text}</span><span>{money(product.price)}</span>
          </a>
        </div>
      )}
    </main>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// THEME 2: LUXURY — Dark rich premium
// ═══════════════════════════════════════════════════════════════════════════════
function LandingLuxury({ agency, product, landing, shippingZones, relatedProducts }: LandingProps) {
  const theme = themeFrom(landing.theme)
  const [activeImage, setActiveImage] = useState(0)
  const images = strings(product.images)
  const benefits = strings(landing.benefits)
  const faq = Array.isArray(landing.faq) ? landing.faq as Faq[] : []
  const proof = Array.isArray(landing.social_proof) ? landing.social_proof as Proof[] : []
  const GOLD = theme.primary || '#d4af37'
  const discount = product.compare_at_price && product.compare_at_price > product.price
    ? Math.round((1 - product.price / product.compare_at_price) * 100) : 0
  const font = '"Geist", "Inter", sans-serif'
  const radius = '8px'

  return (
    <main style={{ background: '#08080e', color: '#f5f0e8', fontFamily: font, minHeight: '100vh', overflowX: 'hidden' }}>
      <div style={{ background: `linear-gradient(90deg, ${GOLD}88, ${GOLD}, ${GOLD}88)`, color: '#0a0a0a', textAlign: 'center', padding: '8px 16px', fontSize: 11, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
        {theme.announcement}
      </div>

      <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(8,8,14,0.94)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${GOLD}22` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>
          <a href="#" style={{ fontWeight: 900, fontSize: 20, letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none', background: `linear-gradient(135deg, ${GOLD}, #f0d060)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {agency.company_name}
          </a>
          <a href="#order" style={{ background: `linear-gradient(135deg, ${GOLD}, #b8860b)`, color: '#0a0a0a', padding: '10px 22px', borderRadius: 4, fontSize: 11, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none' }}>
            {landing.cta_text}
          </a>
        </div>
      </header>

      <section id="product" style={{ padding: '64px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start' }}>
          <div>
            <div style={{ border: `1px solid ${GOLD}22`, borderRadius: 12, overflow: 'hidden', background: '#111', aspectRatio: '1' }}>
              {images[activeImage] ? (
                <img src={images[activeImage]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f18' }}>
                  <ShoppingBag style={{ width: 48, height: 48, color: `${GOLD}44` }} />
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                {images.slice(0, 4).map((img, i) => (
                  <button key={img} onClick={() => setActiveImage(i)}
                    style={{ width: 64, height: 64, border: `2px solid ${activeImage === i ? GOLD : 'transparent'}`, borderRadius: 6, overflow: 'hidden', cursor: 'pointer', padding: 2, background: 'none' }}>
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: `1px solid ${GOLD}44`, padding: '5px 14px', borderRadius: 2, marginBottom: 24 }}>
              <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', color: GOLD }}>{theme.badge || product.category}</span>
            </div>
            {discount > 0 && <div style={{ marginBottom: 12 }}><span style={{ background: `linear-gradient(135deg, ${GOLD}, #b8860b)`, color: '#0a0a0a', padding: '4px 12px', borderRadius: 2, fontSize: 12, fontWeight: 900 }}>-{discount}%</span></div>}
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.02em', marginBottom: 16 }}>{landing.headline}</h1>
            <p style={{ fontSize: 17, lineHeight: 1.7, color: 'rgba(245,240,232,0.55)', marginBottom: 28 }}>{landing.subheadline}</p>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 32 }}>
              <strong style={{ fontSize: 36, fontWeight: 900, background: `linear-gradient(135deg, ${GOLD}, #f0d060)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{money(product.price)}</strong>
              {product.compare_at_price && product.compare_at_price > product.price && (
                <span style={{ fontSize: 18, color: 'rgba(245,240,232,0.3)', textDecoration: 'line-through' }}>{money(product.compare_at_price)}</span>
              )}
            </div>

            <div style={{ display: 'grid', gap: 10, marginBottom: 28 }}>
              {[{ icon: <Truck style={{ width: 14, height: 14 }} />, t: 'Livraison suivie' }, { icon: <ShieldCheck style={{ width: 14, height: 14 }} />, t: 'Commande sécurisée' }, { icon: <PackageCheck style={{ width: 14, height: 14 }} />, t: 'Paiement à la livraison' }].map((i) => (
                <div key={i.t} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 700, color: 'rgba(245,240,232,0.65)' }}><span style={{ color: GOLD }}>{i.icon}</span>{i.t}</div>
              ))}
            </div>

            <a href="#order" style={{ display: 'block', textAlign: 'center', background: `linear-gradient(135deg, #b8860b, ${GOLD})`, color: '#0a0a0a', padding: '18px 24px', fontWeight: 900, fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: 4, marginBottom: 12 }}>
              {landing.cta_text} <ArrowRight style={{ display: 'inline', width: 16, height: 16 }} />
            </a>
          </div>
        </div>
      </section>

      {benefits.length > 0 && (
        <section style={{ padding: '64px 24px', background: 'rgba(212,175,55,0.04)', borderTop: `1px solid ${GOLD}15` }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <h2 style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', color: GOLD, marginBottom: 40, textAlign: 'center' }}>Pourquoi ce produit</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
              {benefits.map((b, i) => (
                <div key={b} style={{ border: `1px solid ${GOLD}22`, borderRadius: 8, padding: '24px 20px', background: 'rgba(212,175,55,0.03)' }}>
                  <div style={{ width: 36, height: 36, border: `1px solid ${GOLD}44`, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: 12, fontWeight: 900, color: GOLD }}>{String(i + 1).padStart(2, '0')}</div>
                  <p style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.5 }}>{b}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {proof.length > 0 && (
        <section style={{ padding: '64px 24px', borderTop: `1px solid ${GOLD}15` }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <h2 style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', color: GOLD, marginBottom: 40, textAlign: 'center' }}>Témoignages</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {proof.map((p) => (
                <blockquote key={p.author} style={{ border: `1px solid ${GOLD}22`, borderRadius: 8, padding: '24px', background: 'rgba(212,175,55,0.03)' }}>
                  <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>{[1,2,3,4,5].map((s) => <Star key={s} style={{ width: 13, height: 13, fill: GOLD, color: GOLD }} />)}</div>
                  <p style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(245,240,232,0.75)', fontStyle: 'italic', marginBottom: 16 }}>&ldquo;{p.quote}&rdquo;</p>
                  <footer style={{ fontSize: 12, fontWeight: 900, color: GOLD, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{p.author}</footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="order" style={{ padding: '64px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 32, textAlign: 'center' }}>Commander Maintenant</h2>
          <OrderForm agency={agency} product={product} landing={landing} shippingZones={shippingZones} theme={{ ...theme, surface: '#111', text: '#f5f0e8' }} radius={radius} font={font} />
        </div>
      </section>

      {faq.length > 0 && (
        <section id="faq" style={{ padding: '64px 24px', borderTop: `1px solid ${GOLD}15` }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <h2 style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', color: GOLD, marginBottom: 32 }}>FAQ</h2>
            {faq.map((q) => (
              <details key={q.question} style={{ borderBottom: `1px solid ${GOLD}15`, padding: '16px 0' }}>
                <summary style={{ fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', color: 'rgba(245,240,232,0.9)' }}>
                  {q.question} <ChevronDown style={{ width: 18, height: 18, flexShrink: 0, color: GOLD }} />
                </summary>
                <p style={{ marginTop: 12, fontSize: 14, lineHeight: 1.7, color: 'rgba(245,240,232,0.55)' }}>{q.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      <footer style={{ background: '#04040a', borderTop: `1px solid ${GOLD}22`, padding: '32px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontWeight: 900, fontSize: 16, background: `linear-gradient(135deg, ${GOLD}, #f0d060)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{agency.company_name}</span>
        <span style={{ fontSize: 12, color: 'rgba(245,240,232,0.25)' }}>© {new Date().getFullYear()} {agency.company_name}</span>
      </footer>

      {theme.showStickyCta && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(4,4,10,0.97)', backdropFilter: 'blur(20px)', borderTop: `1px solid ${GOLD}22`, padding: '12px 16px' }}>
          <a href="#order" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: `linear-gradient(135deg, #b8860b, ${GOLD})`, color: '#0a0a0a', padding: '13px 20px', borderRadius: 4, fontWeight: 900, fontSize: 13, textDecoration: 'none' }}>
            <span>{landing.cta_text}</span><span>{money(product.price)}</span>
          </a>
        </div>
      )}
    </main>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// THEME 3: PLAYFUL — Bright colorful energetic
// ═══════════════════════════════════════════════════════════════════════════════
function LandingPlayful({ agency, product, landing, shippingZones, relatedProducts }: LandingProps) {
  const theme = themeFrom(landing.theme)
  const [activeImage, setActiveImage] = useState(0)
  const images = strings(product.images)
  const benefits = strings(landing.benefits)
  const faq = Array.isArray(landing.faq) ? landing.faq as Faq[] : []
  const proof = Array.isArray(landing.social_proof) ? landing.social_proof as Proof[] : []
  const PRIMARY = theme.primary || '#f59e0b'
  const font = '"Plus Jakarta Sans", "Inter", sans-serif'
  const discount = product.compare_at_price && product.compare_at_price > product.price
    ? Math.round((1 - product.price / product.compare_at_price) * 100) : 0

  return (
    <main style={{ background: '#fffbeb', color: '#1c1917', fontFamily: font, minHeight: '100vh', overflowX: 'hidden' }}>
      <div style={{ background: PRIMARY, color: '#fff', textAlign: 'center', padding: '10px 16px', fontSize: 12, fontWeight: 800, letterSpacing: '0.05em' }}>
        🎉 {theme.announcement} 🎉
      </div>

      <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(255,251,235,0.95)', backdropFilter: 'blur(16px)', borderBottom: `2px solid ${PRIMARY}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <a href="#" style={{ fontWeight: 900, fontSize: 20, textDecoration: 'none', color: '#1c1917' }}>{agency.company_name} 🛍️</a>
          <a href="#order" style={{ background: PRIMARY, color: '#fff', padding: '10px 24px', borderRadius: 50, fontSize: 13, fontWeight: 800, textDecoration: 'none', boxShadow: `0 4px 16px ${PRIMARY}55` }}>
            {landing.cta_text}
          </a>
        </div>
      </header>

      <section id="product" style={{ padding: '48px 20px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }}>
          <div>
            <div style={{ borderRadius: 32, overflow: 'hidden', border: `3px solid ${PRIMARY}`, background: '#fff', boxShadow: `8px 8px 0 ${PRIMARY}`, aspectRatio: '1' }}>
              {images[activeImage] ? (
                <img src={images[activeImage]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', minHeight: 360, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${PRIMARY}10`, fontSize: 13, color: PRIMARY, fontWeight: 700 }}>Photo du produit ✨</div>
              )}
            </div>
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center' }}>
                {images.slice(0, 4).map((img, i) => (
                  <button key={img} onClick={() => setActiveImage(i)}
                    style={{ width: 60, height: 60, border: `3px solid ${activeImage === i ? PRIMARY : 'transparent'}`, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', padding: 2, background: 'none' }}>
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            {discount > 0 && <span style={{ background: '#ef4444', color: '#fff', padding: '5px 14px', borderRadius: 50, fontSize: 13, fontWeight: 800, display: 'inline-block', marginBottom: 12 }}>🔥 -{discount}% AUJOURD&apos;HUI</span>}
            <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>{[1,2,3,4,5].map((s) => <Star key={s} style={{ width: 18, height: 18, fill: PRIMARY, color: PRIMARY }} />)}</div>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.02em', marginBottom: 12 }}>{landing.headline}</h1>
            <p style={{ fontSize: 18, lineHeight: 1.7, opacity: 0.7, marginBottom: 24 }}>{landing.subheadline}</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 28 }}>
              <strong style={{ fontSize: 40, fontWeight: 900, color: PRIMARY }}>{money(product.price)}</strong>
              {product.compare_at_price && product.compare_at_price > product.price && <span style={{ fontSize: 20, opacity: 0.4, textDecoration: 'line-through' }}>{money(product.compare_at_price)}</span>}
            </div>
            <a href="#order" style={{ display: 'block', textAlign: 'center', background: PRIMARY, color: '#fff', padding: '18px 24px', fontWeight: 900, fontSize: 16, textDecoration: 'none', borderRadius: 50, marginBottom: 12, boxShadow: `0 8px 24px ${PRIMARY}55` }}>
              {landing.cta_text} 🛍️
            </a>
            {agency.phone && <a href={`tel:${agency.phone}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: `2px solid ${PRIMARY}`, padding: '14px 24px', fontWeight: 700, fontSize: 14, textDecoration: 'none', color: PRIMARY, borderRadius: 50 }}>
              <Headphones style={{ width: 16, height: 16 }} /> Nous appeler
            </a>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 20 }}>
              {['🚚 Livraison rapide', '✅ COD garanti', '💬 Support WhatsApp'].map((t) => <div key={t} style={{ background: `${PRIMARY}10`, borderRadius: 12, padding: '10px 8px', textAlign: 'center', fontSize: 11, fontWeight: 700 }}>{t}</div>)}
            </div>
          </div>
        </div>
      </section>

      {benefits.length > 0 && (
        <section style={{ padding: '48px 20px', background: '#fff', borderTop: `3px dashed ${PRIMARY}55` }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: 36, fontWeight: 900, marginBottom: 40 }}>Pourquoi vous allez adorer ça 💛</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
              {benefits.map((b, i) => (
                <div key={b} style={{ background: ['#fef9c3','#fce7f3','#ecfdf5','#eff6ff','#fef3c7'][i % 5], borderRadius: 20, padding: '24px 16px', border: `2px solid ${PRIMARY}22` }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>{'🌟💫✨🎯🎁'[i % 5]}</div>
                  <p style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.5 }}>{b}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {proof.length > 0 && (
        <section style={{ padding: '48px 20px', background: `${PRIMARY}08` }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 40 }}>Ce que disent nos clients ❤️</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {proof.map((p) => (
                <blockquote key={p.author} style={{ background: '#fff', borderRadius: 20, padding: '24px', border: `2px solid ${PRIMARY}22`, boxShadow: `4px 4px 0 ${PRIMARY}33`, textAlign: 'left' }}>
                  <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>{[1,2,3,4,5].map((s) => <Star key={s} style={{ width: 14, height: 14, fill: PRIMARY, color: PRIMARY }} />)}</div>
                  <p style={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, marginBottom: 12 }}>&ldquo;{p.quote}&rdquo;</p>
                  <footer style={{ fontSize: 12, fontWeight: 800, color: PRIMARY }}>— {p.author}</footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="order" style={{ padding: '48px 20px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 900, textAlign: 'center', marginBottom: 32 }}>Commander maintenant ! 🛒</h2>
          <OrderForm agency={agency} product={product} landing={landing} shippingZones={shippingZones} theme={theme} radius="20px" font={font} />
        </div>
      </section>

      {faq.length > 0 && (
        <section id="faq" style={{ padding: '48px 20px', background: '#fff' }}>
          <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 32 }}>Questions ? 🤔</h2>
            <div style={{ textAlign: 'left' }}>
              {faq.map((q) => (
                <details key={q.question} style={{ border: `2px solid ${PRIMARY}22`, borderRadius: 16, padding: '14px 18px', marginBottom: 10, background: `${PRIMARY}05` }}>
                  <summary style={{ fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>{q.question}</summary>
                  <p style={{ marginTop: 10, fontSize: 14, lineHeight: 1.7, opacity: 0.7 }}>{q.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer style={{ background: '#1c1917', color: '#fff', padding: '28px 20px', textAlign: 'center' }}>
        <p style={{ fontWeight: 900, fontSize: 18, marginBottom: 4 }}>{agency.company_name} 🛍️</p>
        <p style={{ fontSize: 12, opacity: 0.4 }}>© {new Date().getFullYear()}</p>
      </footer>

      {theme.showStickyCta && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(255,251,235,0.97)', backdropFilter: 'blur(12px)', borderTop: `2px solid ${PRIMARY}`, padding: '12px 16px' }}>
          <a href="#order" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: PRIMARY, color: '#fff', padding: '14px 20px', borderRadius: 50, fontWeight: 900, fontSize: 14, textDecoration: 'none', boxShadow: `0 8px 24px ${PRIMARY}55` }}>
            <span>{landing.cta_text} 🛍️</span><span>{money(product.price)}</span>
          </a>
        </div>
      )}
    </main>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// THEME 4: MINIMAL — Whitespace-first ultraclean
// ═══════════════════════════════════════════════════════════════════════════════
function LandingMinimal({ agency, product, landing, shippingZones, relatedProducts }: LandingProps) {
  const theme = themeFrom(landing.theme)
  const [activeImage, setActiveImage] = useState(0)
  const images = strings(product.images)
  const benefits = strings(landing.benefits)
  const faq = Array.isArray(landing.faq) ? landing.faq as Faq[] : []
  const proof = Array.isArray(landing.social_proof) ? landing.social_proof as Proof[] : []
  const PRIMARY = theme.primary || '#18181b'
  const font = '"Inter", system-ui, sans-serif'
  const discount = product.compare_at_price && product.compare_at_price > product.price
    ? Math.round((1 - product.price / product.compare_at_price) * 100) : 0

  return (
    <main style={{ background: '#ffffff', color: '#18181b', fontFamily: font, minHeight: '100vh', overflowX: 'hidden' }}>
      <div style={{ background: '#18181b', color: '#fff', textAlign: 'center', padding: '10px 16px', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em' }}>
        {theme.announcement}
      </div>

      <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #f4f4f5' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <a href="#" style={{ fontWeight: 700, fontSize: 16, textDecoration: 'none', color: '#18181b', letterSpacing: '-0.01em' }}>{agency.company_name}</a>
          <a href="#order" style={{ background: '#18181b', color: '#fff', padding: '8px 18px', borderRadius: 6, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>Commander</a>
        </div>
      </header>

      <section id="product" style={{ padding: '56px 24px', borderBottom: '1px solid #f4f4f5' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start' }}>
          <div>
            <div style={{ aspectRatio: '1', overflow: 'hidden', background: '#f8f8f8', borderRadius: 8 }}>
              {images[activeImage] ? (
                <img src={images[activeImage]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', minHeight: 360, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#71717a' }}>Image du produit</div>
              )}
            </div>
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                {images.slice(0, 4).map((img, i) => (
                  <button key={img} onClick={() => setActiveImage(i)}
                    style={{ width: 56, height: 56, border: `1px solid ${activeImage === i ? '#18181b' : '#e4e4e7'}`, borderRadius: 4, overflow: 'hidden', cursor: 'pointer', padding: 2, background: 'none' }}>
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ paddingTop: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#71717a', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>{product.category}{product.brand && ` · ${product.brand}`}</div>
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 16 }}>{landing.headline}</h1>
            <p style={{ fontSize: 16, lineHeight: 1.75, color: '#52525b', marginBottom: 28 }}>{landing.subheadline}</p>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
              <strong style={{ fontSize: 32, fontWeight: 800, color: PRIMARY }}>{money(product.price)}</strong>
              {product.compare_at_price && product.compare_at_price > product.price && <span style={{ fontSize: 16, color: '#a1a1aa', textDecoration: 'line-through' }}>{money(product.compare_at_price)}</span>}
              {discount > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>-{discount}%</span>}
            </div>

            {product.stock_quantity > 0 && <p style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, marginBottom: 28 }}>✓ En stock</p>}

            <a href="#order" style={{ display: 'block', textAlign: 'center', background: '#18181b', color: '#fff', padding: '15px 24px', fontWeight: 700, fontSize: 14, textDecoration: 'none', borderRadius: 6, marginBottom: 10 }}>
              {landing.cta_text}
            </a>
            {agency.phone && <a href={`tel:${agency.phone}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: '1px solid #e4e4e7', padding: '13px 24px', fontWeight: 600, fontSize: 13, textDecoration: 'none', color: '#52525b', borderRadius: 6 }}>
              <Headphones style={{ width: 14, height: 14 }} /> Nous contacter
            </a>}

            <div style={{ display: 'flex', gap: 20, marginTop: 24, paddingTop: 20, borderTop: '1px solid #f4f4f5' }}>
              {[<><Truck style={{ width: 14, height: 14 }} /> Livraison</>, <><ShieldCheck style={{ width: 14, height: 14 }} /> COD</>, <><PackageCheck style={{ width: 14, height: 14 }} /> Confirmé</>].map((item, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#71717a', fontWeight: 600 }}>{item}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {benefits.length > 0 && (
        <section style={{ padding: '56px 24px', borderBottom: '1px solid #f4f4f5' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#71717a', marginBottom: 32 }}>Points forts</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2 }}>
              {benefits.map((b) => (
                <div key={b} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '16px 0', borderBottom: '1px solid #f4f4f5' }}>
                  <Check style={{ width: 16, height: 16, color: '#16a34a', flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 15, lineHeight: 1.6, fontWeight: 500 }}>{b}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {proof.length > 0 && (
        <section style={{ padding: '56px 24px', borderBottom: '1px solid #f4f4f5', background: '#fafafa' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#71717a', marginBottom: 32 }}>Avis clients</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
              {proof.map((p) => (
                <div key={p.author} style={{ padding: '20px', background: '#fff', borderRadius: 8, border: '1px solid #f4f4f5' }}>
                  <div style={{ display: 'flex', gap: 2, marginBottom: 10 }}>{[1,2,3,4,5].map((s) => <Star key={s} style={{ width: 13, height: 13, fill: '#f59e0b', color: '#f59e0b' }} />)}</div>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: '#52525b', marginBottom: 10 }}>&ldquo;{p.quote}&rdquo;</p>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#18181b' }}>{p.author}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="order" style={{ padding: '56px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.01em', marginBottom: 32 }}>Passer commande</h2>
          <OrderForm agency={agency} product={product} landing={landing} shippingZones={shippingZones} theme={theme} radius="6px" font={font} />
        </div>
      </section>

      {faq.length > 0 && (
        <section id="faq" style={{ padding: '56px 24px', borderTop: '1px solid #f4f4f5' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#71717a', marginBottom: 32 }}>Questions fréquentes</h2>
            {faq.map((q) => (
              <details key={q.question} style={{ borderBottom: '1px solid #f4f4f5', padding: '14px 0' }}>
                <summary style={{ fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>{q.question}</summary>
                <p style={{ marginTop: 10, fontSize: 14, lineHeight: 1.75, color: '#52525b' }}>{q.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      <footer style={{ background: '#fafafa', borderTop: '1px solid #f4f4f5', padding: '24px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 700 }}>{agency.company_name}</span>
        <span style={{ fontSize: 12, color: '#a1a1aa' }}>© {new Date().getFullYear()}</span>
      </footer>

      {theme.showStickyCta && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)', borderTop: '1px solid #f4f4f5', padding: '12px 16px' }}>
          <a href="#order" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#18181b', color: '#fff', padding: '13px 20px', borderRadius: 6, fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
            <span>{landing.cta_text}</span><span>{money(product.price)}</span>
          </a>
        </div>
      )}
    </main>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// THEME 5: BOLD IMPACT — High-contrast gradient hero
// ═══════════════════════════════════════════════════════════════════════════════
function LandingBold({ agency, product, landing, shippingZones, relatedProducts }: LandingProps) {
  const theme = themeFrom(landing.theme)
  const [activeImage, setActiveImage] = useState(0)
  const images = strings(product.images)
  const benefits = strings(landing.benefits)
  const faq = Array.isArray(landing.faq) ? landing.faq as Faq[] : []
  const proof = Array.isArray(landing.social_proof) ? landing.social_proof as Proof[] : []
  const PRIMARY = theme.primary || '#dc2626'
  const DARK = theme.accent || '#0f172a'
  const font = '"Poppins", "Inter", sans-serif'
  const discount = product.compare_at_price && product.compare_at_price > product.price
    ? Math.round((1 - product.price / product.compare_at_price) * 100) : 0

  return (
    <main style={{ background: '#fff', color: '#0f172a', fontFamily: font, minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Bold red announcement */}
      <div style={{ background: PRIMARY, color: '#fff', textAlign: 'center', padding: '10px 16px', fontSize: 12, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        🔥 {theme.announcement} 🔥
      </div>

      {/* Bold nav */}
      <header style={{ position: 'sticky', top: 0, zIndex: 40, background: '#0f172a', color: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <a href="#" style={{ fontWeight: 900, fontSize: 20, textDecoration: 'none', color: '#fff', letterSpacing: '-0.02em' }}>{agency.company_name}</a>
          <a href="#order" style={{ background: PRIMARY, color: '#fff', padding: '10px 24px', borderRadius: 6, fontSize: 13, fontWeight: 900, textDecoration: 'none', boxShadow: `0 0 20px ${PRIMARY}66`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {landing.cta_text}
          </a>
        </div>
      </header>

      {/* Bold hero — full gradient */}
      <section style={{ background: `linear-gradient(135deg, ${DARK} 0%, #1e293b 50%, ${DARK} 100%)`, padding: '72px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(rgba(220,38,38,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(220,38,38,0.05) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <div>
            {discount > 0 && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: PRIMARY, color: '#fff', padding: '6px 14px', borderRadius: 4, marginBottom: 20, fontSize: 13, fontWeight: 900 }}>
                🔥 -{discount}% OFFRE LIMITÉE
              </div>
            )}
            <h1 style={{ fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 900, lineHeight: 0.95, letterSpacing: '-0.03em', color: '#fff', marginBottom: 20, textTransform: 'uppercase' }}>
              {landing.headline}
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: 'rgba(255,255,255,0.65)', marginBottom: 32 }}>{landing.subheadline}</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 36 }}>
              <strong style={{ fontSize: 48, fontWeight: 900, color: PRIMARY }}>{money(product.price)}</strong>
              {product.compare_at_price && product.compare_at_price > product.price && <span style={{ fontSize: 22, color: 'rgba(255,255,255,0.35)', textDecoration: 'line-through' }}>{money(product.compare_at_price)}</span>}
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a href="#order" style={{ background: PRIMARY, color: '#fff', padding: '18px 40px', borderRadius: 6, fontWeight: 900, fontSize: 16, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, boxShadow: `0 0 40px ${PRIMARY}77`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {landing.cta_text} <ArrowRight style={{ width: 18, height: 18 }} />
              </a>
              {agency.phone && <a href={`tel:${agency.phone}`} style={{ border: '2px solid rgba(255,255,255,0.2)', color: '#fff', padding: '18px 28px', borderRadius: 6, fontWeight: 700, fontSize: 14, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Headphones style={{ width: 16, height: 16 }} /> Appeler
              </a>}
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <div style={{ borderRadius: 16, overflow: 'hidden', border: `3px solid ${PRIMARY}`, boxShadow: `0 0 60px ${PRIMARY}55`, aspectRatio: '1' }}>
              {images[0] ? (
                <img src={images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', minHeight: 360, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(220,38,38,0.1)' }}>
                  <ShoppingBag style={{ width: 64, height: 64, color: `${PRIMARY}55` }} />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <div style={{ background: PRIMARY, padding: '20px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 0, textAlign: 'center', color: '#fff' }}>
          {[
            { icon: '🚚', t: 'Livraison Express' },
            { icon: '💳', t: 'Paiement à la Livraison' },
            { icon: '✅', t: 'Commande Confirmée' },
            { icon: '📞', t: 'Support 7j/7' },
          ].map((item) => <div key={item.t} style={{ padding: '8px 16px', fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>{item.icon} {item.t}</div>)}
        </div>
      </div>

      {benefits.length > 0 && (
        <section style={{ padding: '64px 24px', background: '#f8fafc' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ display: 'inline-block', background: PRIMARY, color: '#fff', padding: '6px 16px', borderRadius: 4, fontSize: 11, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 24 }}>Pourquoi choisir ce produit</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
              {benefits.map((b, i) => (
                <div key={b} style={{ background: '#fff', borderRadius: 8, padding: '28px 20px', border: '1px solid #e2e8f0', textAlign: 'left', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ width: 40, height: 40, background: PRIMARY, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: 16, fontWeight: 900, color: '#fff' }}>{i + 1}</div>
                  <p style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.5 }}>{b}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {proof.length > 0 && (
        <section style={{ padding: '64px 24px', background: DARK }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: 36, fontWeight: 900, color: '#fff', marginBottom: 48, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>Ils ont adoré 🔥</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {proof.map((p) => (
                <div key={p.author} style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${PRIMARY}33`, borderRadius: 12, padding: '24px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>{[1,2,3,4,5].map((s) => <Star key={s} style={{ width: 14, height: 14, fill: PRIMARY, color: PRIMARY }} />)}</div>
                  <p style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(255,255,255,0.75)', marginBottom: 16 }}>&ldquo;{p.quote}&rdquo;</p>
                  <p style={{ fontSize: 12, fontWeight: 800, color: PRIMARY, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{p.author}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="order" style={{ padding: '64px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 36, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>Commander Maintenant</h2>
            <p style={{ fontSize: 16, color: '#64748b', marginTop: 8 }}>{theme.trustNote}</p>
          </div>
          <OrderForm agency={agency} product={product} landing={landing} shippingZones={shippingZones} theme={theme} radius="8px" font={font} />
        </div>
      </section>

      {faq.length > 0 && (
        <section id="faq" style={{ padding: '64px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <h2 style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', color: PRIMARY, marginBottom: 32 }}>FAQ</h2>
            {faq.map((q) => (
              <details key={q.question} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '14px 18px', marginBottom: 10, background: '#fff' }}>
                <summary style={{ fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
                  {q.question} <ChevronDown style={{ width: 18, height: 18, flexShrink: 0 }} />
                </summary>
                <p style={{ marginTop: 10, fontSize: 14, lineHeight: 1.7, color: '#64748b' }}>{q.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      <footer style={{ background: DARK, color: '#fff', padding: '28px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontWeight: 900, fontSize: 18 }}>{agency.company_name}</span>
        <span style={{ fontSize: 12, opacity: 0.4 }}>© {new Date().getFullYear()}</span>
      </footer>

      {theme.showStickyCta && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: '#0f172a', padding: '12px 16px', borderTop: `2px solid ${PRIMARY}` }}>
          <a href="#order" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: PRIMARY, color: '#fff', padding: '14px 20px', borderRadius: 6, fontWeight: 900, fontSize: 14, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.05em', boxShadow: `0 0 20px ${PRIMARY}55` }}>
            <span>{landing.cta_text} 🔥</span><span>{money(product.price)}</span>
          </a>
        </div>
      )}
    </main>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// THEME 6: CLASSIC (original — kept as fallback)
// ═══════════════════════════════════════════════════════════════════════════════
function LandingClassic(props: LandingProps) {
  const { agency, product, landing, shippingZones, relatedProducts } = props
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [shippingId, setShippingId] = useState(shippingZones[0]?.id || '')
  const [error, setError] = useState('')
  const images = strings(product.images)
  const benefits = strings(landing.benefits)
  const faq = Array.isArray(landing.faq) ? landing.faq as Faq[] : []
  const proof = Array.isArray(landing.social_proof) ? landing.social_proof as Proof[] : []
  const variantGroups = variantsFrom(product.variants)
  const theme = themeFrom(landing.theme)
  const radius = theme.radius === 'sharp' ? '10px' : theme.radius === 'soft' ? '22px' : '32px'
  const font = theme.font === 'serif' ? 'Georgia, Cambria, "Times New Roman", serif' : theme.font === 'jakarta' ? '"Plus Jakarta Sans", sans-serif' : '"Outfit", sans-serif'
  const initialVariants = useMemo(() => Object.fromEntries(variantGroups.map((g) => [g.name, g.options[0]])), [product.id])
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(initialVariants)
  const selectedShipping = shippingZones.find((z) => z.id === shippingId)
  const subtotal = product.price * quantity
  const shippingFee = selectedShipping?.base_fee || 0
  const total = subtotal + shippingFee
  const discount = product.compare_at_price && product.compare_at_price > product.price
    ? Math.round((1 - product.price / product.compare_at_price) * 100) : 0

  function submit(formData: FormData) {
    setError('')
    const campaign = Object.fromEntries(
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'ttclid']
        .map((k) => [k, searchParams.get(k)])
        .filter((e): e is [string, string] => Boolean(e[1]))
    )
    startTransition(async () => {
      const result = await placePublicEcommerceOrder({
        agencyId: agency.id, productId: product.id, landingPageId: landing.id,
        customerName: formData.get('name'), customerPhone: formData.get('phone'),
        customerCity: formData.get('city'), customerAddress: formData.get('address'),
        shippingZoneId: formData.get('shippingZoneId') || null,
        promotionCode: formData.get('promotionCode'), notes: formData.get('notes'),
        quantity, variant: selectedVariants, campaign,
      })
      if (!result.success) { setError(result.error); return }
      router.push(`/order/${result.order.public_token}`)
    })
  }

  return (
    <main className="min-h-screen overflow-x-hidden" style={{ '--landing-primary': theme.primary, '--landing-accent': theme.accent, '--landing-bg': theme.background, '--landing-surface': theme.surface, '--landing-text': theme.text, '--landing-radius': radius, background: theme.background, color: theme.text, fontFamily: font } as React.CSSProperties}>
      <div className="bg-[var(--landing-accent)] px-4 py-2.5 text-center text-xs font-bold tracking-wide text-white">{theme.announcement}</div>
      <header className="sticky top-0 z-40 border-b border-black/5 bg-[color:var(--landing-surface)]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 lg:px-8">
          <a href="#" className="flex items-center gap-3 font-black"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--landing-primary)] text-white"><ShoppingBag className="h-5 w-5" /></span><span className="text-lg">{agency.company_name}</span></a>
          <a href="#order" className="rounded-full bg-[var(--landing-primary)] px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-black/10">{landing.cta_text}</a>
        </div>
      </header>
      <p className="text-center py-20 text-slate-500">Classic landing page theme. Configure theme.style to use a premium theme.</p>
    </main>
  )
}
