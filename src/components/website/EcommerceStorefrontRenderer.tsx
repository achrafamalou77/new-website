'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Footprints,
  PackageSearch,
  RotateCcw,
  Ruler,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  Zap,
  BadgeCheck,
  Flame,
  TrendingUp,
} from 'lucide-react'
import type { EcommerceProduct, EcommerceProductPage } from '@/types/ecommerce'
import type { EcommerceStorefrontConfig } from '@/lib/ecommerce-storefront'
import EcommerceStoreShell, { addStoreCartItem } from '@/components/website/EcommerceStoreShell'

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function money(value: number) {
  return `${Number(value || 0).toLocaleString('fr-DZ')} DZD`
}

function fontFamily(font: EcommerceStorefrontConfig['headingFont']) {
  if (font === 'serif') return 'Georgia, Cambria, "Times New Roman", serif'
  if (font === 'display') return '"Arial Black", "Trebuchet MS", sans-serif'
  return '"Inter", "Segoe UI", sans-serif'
}

function discount(product: EcommerceProduct) {
  if (!product.compare_at_price || product.compare_at_price <= product.price) return null
  return Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
}

// ─── Animated number counter ────────────────────────────────────────────────
function AnimatedStat({ label, value, primary }: { label: string; value: string; primary: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setVisible(true) }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div
      ref={ref}
      style={{
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(12px)',
        padding: '16px 18px',
        transition: 'all 0.5s ease',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
      }}
    >
      <p style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>{label}</p>
      <p style={{ fontSize: '15px', fontWeight: 900, color: '#fff' }}>{value}</p>
    </div>
  )
}

// ─── Product Card ────────────────────────────────────────────────────────────
export function StoreProductCard({
  product,
  config,
  preview = false,
  storefrontBaseUrl = '',
}: {
  product: EcommerceProduct
  config: EcommerceStorefrontConfig
  preview?: boolean
  storefrontBaseUrl?: string
}) {
  const image = strings(product.images)[0]
  const path = `/products/${product.id}`
  const href = storefrontBaseUrl ? `${storefrontBaseUrl.replace(/\/$/, '')}${path}` : path
  const off = discount(product)
  const inStock = product.stock_quantity > 0
  const primary = config.primaryColor || '#6366f1'
  const [hovered, setHovered] = useState(false)
  const [adding, setAdding] = useState(false)

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault()
    if (!inStock || adding) return
    setAdding(true)
    addStoreCartItem(product)
    setTimeout(() => setAdding(false), 900)
  }

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: '20px',
        border: `1px solid ${hovered ? `${primary}30` : 'rgba(255,255,255,0.07)'}`,
        background: hovered ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(20px)',
        overflow: 'hidden',
        transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow: hovered ? `0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px ${primary}20` : '0 4px 16px rgba(0,0,0,0.2)',
        position: 'relative',
      }}
    >
      {/* Image container */}
      <Link href={href} target={preview ? '_blank' : undefined} style={{ display: 'block', position: 'relative', aspectRatio: '4/5', overflow: 'hidden', background: 'rgba(255,255,255,0.04)' }}>
        {image ? (
          <img
            src={image}
            alt={product.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.7s cubic-bezier(0.16,1,0.3,1)',
              transform: hovered ? 'scale(1.08)' : 'scale(1)',
            }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Footprints style={{ width: '48px', height: '48px', color: 'rgba(255,255,255,0.12)' }} />
          </div>
        )}

        {/* Overlay gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(5,5,8,0.7) 0%, transparent 55%)',
            opacity: hovered ? 1 : 0.5,
            transition: 'opacity 0.35s ease',
          }}
        />

        {/* Badges */}
        <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {product.is_featured && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '999px',
                background: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.2)',
                fontSize: '9px',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: '#fff',
              }}
            >
              <Star style={{ width: '9px', height: '9px', fill: '#fff' }} /> Featured
            </span>
          )}
          {off && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px 10px',
                borderRadius: '999px',
                background: `linear-gradient(135deg, ${primary}, ${primary}bb)`,
                fontSize: '9px',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#fff',
                boxShadow: `0 4px 12px ${primary}44`,
              }}
            >
              -{off}%
            </span>
          )}
        </div>

        {/* Stock indicator */}
        <div style={{ position: 'absolute', bottom: '10px', left: '12px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '999px',
              background: 'rgba(10,10,16,0.75)',
              backdropFilter: 'blur(8px)',
              fontSize: '10px',
              fontWeight: 800,
              color: inStock ? '#4ade80' : '#f87171',
            }}
          >
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: inStock ? '#4ade80' : '#f87171', flexShrink: 0 }} />
            {inStock ? `${product.stock_quantity} in stock` : 'Sold out'}
          </span>
        </div>
      </Link>

      {/* Card body */}
      <div style={{ padding: '16px' }}>
        <p
          style={{
            fontSize: '9px',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            color: primary,
            marginBottom: '6px',
          }}
        >
          {product.brand || product.category || 'Footwear'}
        </p>
        <h3
          style={{
            fontSize: '14px',
            fontWeight: 800,
            color: '#fff',
            lineHeight: 1.35,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            marginBottom: '12px',
            minHeight: '38px',
          }}
        >
          <Link href={href} target={preview ? '_blank' : undefined} style={{ color: 'inherit', textDecoration: 'none' }}>
            {product.name}
          </Link>
        </h3>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '14px' }}>
          <span style={{ fontSize: '17px', fontWeight: 900, color: '#fff' }}>{money(product.price)}</span>
          {product.compare_at_price && product.compare_at_price > product.price && (
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.35)', textDecoration: 'line-through' }}>
              {money(product.compare_at_price)}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px' }}>
          <Link
            href={href}
            target={preview ? '_blank' : undefined}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              height: '40px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: hovered ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 700,
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              letterSpacing: '0.04em',
            }}
          >
            Details <ChevronRight style={{ width: '13px', height: '13px' }} />
          </Link>
          <button
            onClick={handleAdd}
            disabled={!inStock}
            aria-label={`Add ${product.name} to cart`}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              border: 'none',
              cursor: inStock ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: adding ? '#22c55e' : `linear-gradient(135deg, ${primary}, ${primary}cc)`,
              color: '#fff',
              transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
              transform: adding ? 'scale(0.92)' : 'scale(1)',
              boxShadow: inStock ? `0 4px 16px ${adding ? '#22c55e55' : primary + '44'}` : 'none',
              opacity: inStock ? 1 : 0.4,
            }}
          >
            {adding
              ? <CheckCircle2 style={{ width: '16px', height: '16px' }} />
              : <ShoppingBag style={{ width: '15px', height: '15px' }} />
            }
          </button>
        </div>
      </div>
    </article>
  )
}

// ─── Section header helper ────────────────────────────────────────────────────
function SectionHeader({ eyebrow, title, subtitle, primary, font }: { eyebrow: string; title: string; subtitle?: string; primary: string; font: EcommerceStorefrontConfig['headingFont'] }) {
  return (
    <div style={{ marginBottom: '40px' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
        <span
          style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: primary,
            boxShadow: `0 0 6px ${primary}`,
          }}
        />
        <p
          style={{
            fontSize: '10px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            color: primary,
          }}
        >
          {eyebrow}
        </p>
      </div>
      <h2
        style={{
          fontSize: 'clamp(24px, 4vw, 48px)',
          fontWeight: 900,
          color: '#fff',
          lineHeight: 1.08,
          letterSpacing: '-0.02em',
          fontFamily: fontFamily(font),
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p style={{ marginTop: '12px', fontSize: '14px', lineHeight: 1.7, color: 'rgba(255,255,255,0.5)', maxWidth: '520px' }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

// ─── Main renderer ────────────────────────────────────────────────────────────
export default function EcommerceStorefrontRenderer({
  agency,
  products,
  pages: _pages,
  config,
  preview = false,
  storefrontBaseUrl = '',
}: {
  agency: { company_name?: string; phone?: string | null; website_settings?: Record<string, unknown> }
  products: EcommerceProduct[]
  pages: EcommerceProductPage[]
  config: EcommerceStorefrontConfig
  preview?: boolean
  storefrontBaseUrl?: string
}) {
  const [activeCategory, setActiveCategory] = useState('all')
  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category).filter(Boolean))), [products])
  const filteredProducts = activeCategory === 'all' ? products : products.filter((p) => p.category === activeCategory)
  const featured = products.filter((p) => p.is_featured)
  const featuredProducts = (featured.length ? featured : products).slice(0, 4)
  const newArrivals = [...products].slice(0, 8)
  const heroProduct = featuredProducts[0] || products[0]
  const heroProductImage = heroProduct ? strings(heroProduct.images)[0] : ''
  const href = (path: string) => storefrontBaseUrl ? `${storefrontBaseUrl.replace(/\/$/, '')}${path}` : path
  const company = config.storeName || agency.company_name || 'Sole District'
  const heroImage = heroProductImage || config.heroImage
  const primary = config.primaryColor || '#6366f1'
  const font = config.headingFont

  return (
    <EcommerceStoreShell
      agency={agency}
      products={products}
      config={config}
      activePage="home"
      preview={preview}
      storefrontBaseUrl={storefrontBaseUrl}
    >
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-12px) rotate(1deg); }
          66% { transform: translateY(-6px) rotate(-1deg); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.9); opacity: 0.6; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hero-title { animation: fadeSlideUp 0.8s cubic-bezier(0.16,1,0.3,1) forwards; }
        .hero-sub { animation: fadeSlideUp 0.8s 0.15s cubic-bezier(0.16,1,0.3,1) both; }
        .hero-ctas { animation: fadeSlideUp 0.8s 0.28s cubic-bezier(0.16,1,0.3,1) both; }
        .hero-stats { animation: fadeSlideUp 0.8s 0.4s cubic-bezier(0.16,1,0.3,1) both; }
        .hero-image { animation: fadeSlideUp 0.9s 0.1s cubic-bezier(0.16,1,0.3,1) both; }
        .feature-card:hover {
          transform: translateY(-4px) !important;
          border-color: rgba(99,102,241,0.3) !important;
        }
        .product-section-enter {
          animation: fadeSlideUp 0.7s cubic-bezier(0.16,1,0.3,1) both;
        }
        .cat-btn {
          transition: all 0.25s cubic-bezier(0.16,1,0.3,1) !important;
        }
        .cat-btn:hover {
          transform: translateY(-2px);
        }
      `}</style>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* HERO SECTION                                                        */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(160deg, #050508 0%, #0c0c18 45%, #080810 100%)',
          minHeight: preview ? 'auto' : 'min(calc(100vh - 70px), 900px)',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* Ambient glow blobs */}
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            right: '-5%',
            width: '55%',
            height: '70%',
            background: `radial-gradient(ellipse at center, ${primary}18 0%, transparent 65%)`,
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '5%',
            left: '-8%',
            width: '45%',
            height: '55%',
            background: `radial-gradient(ellipse at center, ${primary}0d 0%, transparent 65%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Dot grid texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            width: '100%',
            maxWidth: '80rem',
            margin: '0 auto',
            padding: preview ? '36px 20px' : '56px 20px 72px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))',
            gap: '40px',
            alignItems: 'center',
            boxSizing: 'border-box',
            overflowX: 'hidden',
          }}
        >
          {/* Left: copy */}
          <div>
            {/* Eyebrow tag */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 14px',
                borderRadius: '999px',
                border: `1px solid ${primary}33`,
                background: `${primary}12`,
                marginBottom: '28px',
                animation: 'fadeSlideUp 0.6s both',
              }}
            >
              <Zap style={{ width: '12px', height: '12px', color: primary, flexShrink: 0 }} />
              <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.75)' }}>
                {config.heroEyebrow || 'Galaxy Footwear Drops'}
              </span>
            </div>

            {/* Headline */}
            <h1
              className="hero-title"
              style={{
                fontSize: 'clamp(32px, 5.5vw, 78px)',
                fontWeight: 900,
                lineHeight: 1.0,
                letterSpacing: '-0.03em',
                color: '#fff',
                fontFamily: fontFamily(font),
                maxWidth: '100%',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
              }}
            >
              {config.heroTitle || (
                <>
                  Step into<br />
                  <span
                    style={{
                      background: `linear-gradient(135deg, #fff 0%, ${primary} 60%, #a78bfa 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    another orbit.
                  </span>
                </>
              )}
            </h1>

            {/* Subtitle */}
            <p
              className="hero-sub"
              style={{
                marginTop: '20px',
                fontSize: '14px',
                lineHeight: 1.75,
                color: 'rgba(255,255,255,0.55)',
                maxWidth: '100%',
              }}
            >
              {config.heroSubtitle || 'Sneakers and footwear curated for movement, comfort, and daily street style. Live stock, fast confirmation.'}
            </p>

            {/* CTA buttons */}
            <div className="hero-ctas" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '28px' }}>
              <Link
                href={href('/catalog')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '14px 28px',
                  borderRadius: '14px',
                  background: `linear-gradient(135deg, ${primary}, ${primary}cc)`,
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 800,
                  textDecoration: 'none',
                  boxShadow: `0 8px 32px ${primary}44`,
                  letterSpacing: '0.04em',
                  transition: 'all 0.25s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 14px 40px ${primary}55` }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 8px 32px ${primary}44` }}
              >
                Shop All Shoes <ArrowRight style={{ width: '15px', height: '15px' }} />
              </Link>
              <Link
                href={href('/contact')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '14px 28px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  backdropFilter: 'blur(8px)',
                  letterSpacing: '0.04em',
                  transition: 'all 0.25s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
              >
                Size Help <Ruler style={{ width: '15px', height: '15px' }} />
              </Link>
            </div>

            {/* Stats row */}
            <div className="hero-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '28px', maxWidth: '100%' }}>
              <AnimatedStat label="Live Stock" value={products.length ? `${products.length} products` : 'Ready'} primary={primary} />
              <AnimatedStat label="COD" value="Confirm first" primary={primary} />
              <AnimatedStat label="Support" value="Human help" primary={primary} />
            </div>
          </div>

          {/* Right: hero image */}
          <div
            className="hero-image"
            style={{
              position: 'relative',
              minHeight: '480px',
              borderRadius: '28px',
              overflow: 'hidden',
              border: `1px solid rgba(255,255,255,0.09)`,
              background: 'rgba(255,255,255,0.04)',
              boxShadow: `0 40px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06), inset 0 0 80px ${primary}08`,
            }}
          >
            {heroImage ? (
              <img
                src={heroImage}
                alt={company}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `linear-gradient(135deg, ${primary}15, ${primary}05)`,
                }}
              >
                <Footprints style={{ width: '80px', height: '80px', color: `${primary}30` }} />
              </div>
            )}

            {/* Overlay */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,5,8,0.75) 0%, rgba(5,5,8,0.1) 50%, transparent 100%)' }} />

            {/* Top badge */}
            <div
              style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                padding: '10px 14px',
                borderRadius: '12px',
                background: 'rgba(5,5,8,0.75)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <p style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.45)', marginBottom: '3px' }}>Drop Focus</p>
              <p style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>{heroProduct?.name || 'New Season Sneakers'}</p>
            </div>

            {/* Floating pulse ring */}
            <div
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '10px',
                height: '10px',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#4ade80',
                  display: 'block',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#4ade80',
                  animation: 'pulse-ring 1.8s ease-out infinite',
                }}
              />
            </div>

            {/* Bottom product card */}
            <div
              style={{
                position: 'absolute',
                bottom: '16px',
                left: '16px',
                right: '16px',
                borderRadius: '18px',
                background: 'rgba(5,5,8,0.8)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', marginBottom: '12px' }}>
                <div>
                  <p style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: primary, marginBottom: '5px' }}>
                    Limited Shelf
                  </p>
                  <p style={{ fontSize: '17px', fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>
                    {heroProduct?.name || 'Shop the latest footwear'}
                  </p>
                </div>
                {heroProduct && (
                  <p style={{ fontSize: '16px', fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                    {money(heroProduct.price)}
                  </p>
                )}
              </div>
              {heroProduct ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px' }}>
                  <Link
                    href={href(`/products/${heroProduct.id}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '44px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: 700,
                      textDecoration: 'none',
                      letterSpacing: '0.04em',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    View product
                  </Link>
                  <button
                    onClick={() => addStoreCartItem(heroProduct)}
                    style={{
                      height: '44px',
                      padding: '0 20px',
                      borderRadius: '12px',
                      border: 'none',
                      cursor: 'pointer',
                      background: `linear-gradient(135deg, ${primary}, ${primary}cc)`,
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: 800,
                      boxShadow: `0 4px 16px ${primary}44`,
                      transition: 'all 0.2s ease',
                      letterSpacing: '0.04em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Add to Cart
                  </button>
                </div>
              ) : (
                <Link
                  href={href('/catalog')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '44px',
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, ${primary}, ${primary}cc)`,
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 800,
                    textDecoration: 'none',
                    boxShadow: `0 4px 16px ${primary}44`,
                    letterSpacing: '0.04em',
                  }}
                >
                  Browse catalog
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* FEATURES BAR                                                        */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section
        style={{
          background: '#080810',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          padding: '28px 24px',
        }}
      >
        <div
          style={{
            maxWidth: '80rem',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
          }}
        >
          {([
            [Truck, 'Express Delivery', 'Shipping zones connected to checkout.'],
            [Ruler, 'Size Confidence', 'Variants and notes help customers choose.'],
            [RotateCcw, 'Easy Returns', 'Policy pages are generated and editable.'],
            [ShieldCheck, 'Order Confirmation', 'Every order is confirmed before dispatch.'],
          ] as const).map(([Icon, title, text], i) => (
            <div
              key={title}
              className="feature-card"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                padding: '18px',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.025)',
                transition: 'all 0.3s ease',
                cursor: 'default',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: `${primary}18`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  border: `1px solid ${primary}22`,
                }}
              >
                <Icon style={{ width: '16px', height: '16px', color: primary }} />
              </div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>{title}</p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* CATEGORY FILTER                                                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {config.showCategories && categories.length > 0 && (
        <section
          style={{
            background: '#050508',
            padding: '32px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <div
            style={{
              maxWidth: '80rem',
              margin: '0 auto',
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              paddingBottom: '4px',
            }}
            className="scrollbar-hide"
          >
            {['all', ...categories].map((cat) => {
              const active = activeCategory === cat
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="cat-btn"
                  style={{
                    padding: '9px 20px',
                    borderRadius: '999px',
                    border: `1px solid ${active ? primary : 'rgba(255,255,255,0.1)'}`,
                    background: active ? `linear-gradient(135deg, ${primary}, ${primary}cc)` : 'rgba(255,255,255,0.04)',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.05em',
                    boxShadow: active ? `0 4px 16px ${primary}44` : 'none',
                    flexShrink: 0,
                  }}
                >
                  {cat === 'all' ? 'All Shoes' : cat}
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* FEATURED PRODUCTS                                                   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {config.showFeaturedProducts && featuredProducts.length > 0 && activeCategory === 'all' && (
        <section style={{ background: '#050508', padding: '80px 24px' }}>
          <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '48px' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                  <Flame style={{ width: '13px', height: '13px', color: '#f97316' }} />
                  <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#f97316' }}>
                    Best Sellers
                  </span>
                </div>
                <h2
                  style={{
                    fontSize: 'clamp(28px, 5vw, 52px)',
                    fontWeight: 900,
                    color: '#fff',
                    lineHeight: 1.05,
                    letterSpacing: '-0.02em',
                    fontFamily: fontFamily(font),
                  }}
                >
                  {config.featuredTitle || 'Trending Now'}
                </h2>
              </div>
              <Link
                href={href('/catalog')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: primary,
                  textDecoration: 'none',
                  transition: 'gap 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.gap = '10px' }}
                onMouseLeave={(e) => { e.currentTarget.style.gap = '6px' }}
              >
                View all <ArrowRight style={{ width: '15px', height: '15px' }} />
              </Link>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))',
                gap: '20px',
              }}
            >
              {featuredProducts.map((product) => (
                <StoreProductCard key={product.id} product={product} config={config} preview={preview} storefrontBaseUrl={storefrontBaseUrl} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PROMO BANNER                                                        */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {config.showPromoSection && (
        <section style={{ background: '#0a0a14', padding: '80px 24px' }}>
          <div
            style={{
              maxWidth: '80rem',
              margin: '0 auto',
              borderRadius: '28px',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))',
              background: 'rgba(255,255,255,0.03)',
            }}
          >
            {/* Text col */}
            <div
              style={{
                padding: 'clamp(32px, 5vw, 56px)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '999px',
                  border: `1px solid ${primary}33`,
                  background: `${primary}12`,
                  marginBottom: '20px',
                  width: 'fit-content',
                }}
              >
                <TrendingUp style={{ width: '11px', height: '11px', color: primary }} />
                <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.16em', color: primary }}>
                  {config.promoEyebrow || 'Limited Drop'}
                </span>
              </div>
              <h2
                style={{
                  fontSize: 'clamp(32px, 5vw, 56px)',
                  fontWeight: 900,
                  color: '#fff',
                  lineHeight: 1.05,
                  letterSpacing: '-0.02em',
                  fontFamily: fontFamily(font),
                  marginBottom: '16px',
                }}
              >
                {config.promoTitle || 'Move before it\'s gone.'}
              </h2>
              {config.promoText && (
                <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'rgba(255,255,255,0.5)', marginBottom: '28px', maxWidth: '420px' }}>
                  {config.promoText}
                </p>
              )}
              <Link
                href={href('/catalog')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '13px 24px',
                  borderRadius: '12px',
                  background: '#fff',
                  color: '#050508',
                  fontSize: '13px',
                  fontWeight: 800,
                  textDecoration: 'none',
                  width: 'fit-content',
                  letterSpacing: '0.04em',
                  transition: 'all 0.25s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(255,255,255,0.15)' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                Explore Drops <ArrowRight style={{ width: '15px', height: '15px' }} />
              </Link>
            </div>

            {/* Image col */}
            {config.promoImage && (
              <div style={{ position: 'relative', minHeight: '340px' }}>
                <img
                  src={config.promoImage}
                  alt=""
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(10,10,20,0.35), transparent)' }} />
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ALL PRODUCTS / CATALOG GRID                                         */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {config.showAllProducts && (
        <section style={{ background: '#050508', padding: '80px 24px' }}>
          <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '48px' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: primary, boxShadow: `0 0 8px ${primary}` }} />
                  <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.22em', color: primary }}>
                    Live Catalog
                  </span>
                </div>
                <h2
                  style={{
                    fontSize: 'clamp(28px, 5vw, 52px)',
                    fontWeight: 900,
                    color: '#fff',
                    lineHeight: 1.05,
                    letterSpacing: '-0.02em',
                    fontFamily: fontFamily(font),
                  }}
                >
                  {activeCategory === 'all' ? (config.catalogTitle || 'All Shoes') : activeCategory}
                </h2>
                {config.catalogSubtitle && activeCategory === 'all' && (
                  <p style={{ marginTop: '10px', fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{config.catalogSubtitle}</p>
                )}
              </div>
              <span
                style={{
                  padding: '7px 16px',
                  borderRadius: '999px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.04)',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.5)',
                }}
              >
                {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
              </span>
            </div>

            {filteredProducts.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))',
                  gap: '20px',
                }}
              >
                {(activeCategory === 'all' ? newArrivals : filteredProducts).slice(0, 8).map((product) => (
                  <StoreProductCard key={product.id} product={product} config={config} preview={preview} storefrontBaseUrl={storefrontBaseUrl} />
                ))}
              </div>
            ) : (
              <div
                style={{
                  borderRadius: '24px',
                  border: '1px dashed rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.02)',
                  padding: '80px 24px',
                  textAlign: 'center',
                }}
              >
                <PackageSearch style={{ width: '40px', height: '40px', color: 'rgba(255,255,255,0.2)', margin: '0 auto 16px' }} />
                <p style={{ fontSize: '15px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
                  No shoes in this category yet.
                </p>
                <button
                  onClick={() => setActiveCategory('all')}
                  style={{
                    marginTop: '16px',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    background: `${primary}20`,
                    border: `1px solid ${primary}33`,
                    color: primary,
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  View all shoes
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TRUST BAR                                                           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {config.showTrustBar && (
        <section style={{ background: '#0a0a14', padding: '80px 24px' }}>
          <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
            <SectionHeader
              eyebrow="Why Choose Us"
              title="Built around trust"
              subtitle="Every feature is designed to give your customers confidence."
              primary={primary}
              font={font}
            />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '16px',
              }}
            >
              {(config.trustItems.length ? config.trustItems : [
                { title: 'Real Stock', text: 'Live availability pulled directly from your catalog.' },
                { title: 'Fast Confirmation', text: 'Every order is confirmed with you before dispatch.' },
                { title: 'Size Support', text: 'Help customers choose the right fit, every time.' },
              ]).map((item, index) => {
                const Icon = index === 0 ? CheckCircle2 : index === 1 ? Truck : ShieldCheck
                return (
                  <article
                    key={`${item.title}-${index}`}
                    style={{
                      padding: '28px',
                      borderRadius: '20px',
                      border: '1px solid rgba(255,255,255,0.07)',
                      background: 'rgba(255,255,255,0.03)',
                      transition: 'all 0.3s ease',
                      cursor: 'default',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = `${primary}30`; e.currentTarget.style.boxShadow = `0 16px 40px rgba(0,0,0,0.3)` }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '14px',
                        background: `${primary}18`,
                        border: `1px solid ${primary}25`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '20px',
                      }}
                    >
                      <Icon style={{ width: '22px', height: '22px', color: primary }} />
                    </div>
                    <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>{item.title}</h3>
                    <p style={{ fontSize: '14px', lineHeight: 1.65, color: 'rgba(255,255,255,0.45)' }}>{item.text}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* BOTTOM CTA SECTION                                                  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section
        style={{
          background: '#050508',
          padding: '80px 24px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient glow */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            width: '70%',
            height: '60%',
            background: `radial-gradient(ellipse, ${primary}0d 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            maxWidth: '80rem',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))',
            gap: '48px',
            alignItems: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
              <Sparkles style={{ width: '13px', height: '13px', color: primary }} />
              <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)' }}>
                Store Ready
              </span>
            </div>
            <h2
              style={{
                fontSize: 'clamp(28px, 5vw, 52px)',
                fontWeight: 900,
                color: '#fff',
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
                fontFamily: fontFamily(font),
                marginBottom: '16px',
              }}
            >
              Product pages, cart, search & checkout — connected.
            </h2>
            <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'rgba(255,255,255,0.45)', maxWidth: '520px' }}>
              Your public store gives shoppers search, product details, cart review, order paths, policy pages and real live stock from the dashboard.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { icon: Search, label: 'Search products' },
              { icon: ShoppingBag, label: 'Add to cart' },
              { icon: BadgeCheck, label: 'Review & checkout' },
              { icon: Truck, label: 'Order tracking' },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255,255,255,0.07)',
                  background: 'rgba(255,255,255,0.03)',
                  transition: 'all 0.25s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${primary}30`; e.currentTarget.style.background = `${primary}0a` }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
              >
                <Icon style={{ width: '16px', height: '16px', color: primary, flexShrink: 0 }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </EcommerceStoreShell>
  )
}
