'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { EcommerceProduct, EcommerceProductPage } from '@/types/ecommerce'
import {
  ShoppingBag,
  ArrowRight,
  Package,
  Truck,
  Zap,
  Star,
  ExternalLink,
  Globe,
  Cpu,
  Radio,
  ChevronRight,
  Activity,
} from 'lucide-react'

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function money(value: number) {
  return `${Number(value || 0).toLocaleString('fr-DZ')} DZD`
}

interface Props {
  agency: any
  products: EcommerceProduct[]
  pages: EcommerceProductPage[]
}

export default function EcommerceThemeNeonPulse({ agency, products, pages }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const company = agency.company_name || 'Neon Pulse'
  const whatsapp = String(agency.phone || '').replace(/\D/g, '')
  const settings = agency.website_settings || {}
  const pageByProduct = new Map(pages.map((p) => [p.product_id, p]))

  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))]
  const filtered = activeCategory === 'all' ? products : products.filter((p) => p.category === activeCategory)
  const featured = products.filter((p) => p.is_featured).slice(0, 4)

  const CYAN = '#06d6d6'
  const PURPLE = '#a855f7'
  const PINK = '#ec4899'
  const BG = '#08080e'
  const SURFACE = '#0f0f1a'
  const MID = '#16162a'
  const LIGHT = '#e2e8ff'

  return (
    <main
      className="min-h-screen overflow-x-hidden"
      style={{ background: BG, color: LIGHT, fontFamily: '"Inter", "Space Grotesk", monospace' }}
    >
      {/* Scrolling marquee bar */}
      <div
        style={{
          background: `linear-gradient(90deg, ${CYAN}22, ${PURPLE}22, ${PINK}22, ${PURPLE}22, ${CYAN}22)`,
          borderBottom: `1px solid ${CYAN}33`,
          overflow: 'hidden',
          padding: '8px 0',
        }}
      >
        <div
          style={{
            whiteSpace: 'nowrap',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.15em',
            color: CYAN,
            textTransform: 'uppercase',
            animation: 'marquee 20s linear infinite',
          }}
        >
          ⚡ LIVRAISON EXPRESS · {products.length}+ PRODUITS · PAIEMENT COD · ⚡ LIVRAISON EXPRESS · {products.length}+ PRODUITS · PAIEMENT COD · ⚡ LIVRAISON EXPRESS · {products.length}+ PRODUITS ·&nbsp;
        </div>
        <style>{`
          @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
          @keyframes pulse-glow { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
          @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
        `}</style>
      </div>

      {/* Nav */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: `rgba(8, 8, 14, 0.94)`,
          backdropFilter: 'blur(24px)',
          borderBottom: `1px solid ${CYAN}22`,
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            height: 68,
          }}
        >
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: `linear-gradient(135deg, ${CYAN}, ${PURPLE})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 20px ${CYAN}55`,
              }}
            >
              <Cpu size={18} color="#fff" />
            </div>
            <span
              style={{
                fontWeight: 900,
                fontSize: 18,
                letterSpacing: '0.05em',
                background: `linear-gradient(90deg, ${CYAN}, ${PURPLE})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {company}
            </span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <a href="#products" style={{ fontSize: 12, fontWeight: 700, color: `${LIGHT}88`, textDecoration: 'none', letterSpacing: '0.05em' }}>
              DROP
            </a>
            <a href="#about" style={{ fontSize: 12, fontWeight: 700, color: `${LIGHT}88`, textDecoration: 'none', letterSpacing: '0.05em' }}>
              ABOUT
            </a>
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: `linear-gradient(135deg, ${CYAN}, ${PURPLE})`,
                  color: '#fff',
                  padding: '9px 20px',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 900,
                  textDecoration: 'none',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  boxShadow: `0 0 20px ${CYAN}44`,
                }}
              >
                DROP NOW
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero — full cinematic */}
      <section
        style={{
          position: 'relative',
          minHeight: '92vh',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          padding: '80px 24px',
        }}
      >
        {/* Animated noise texture overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              radial-gradient(ellipse 80% 80% at 20% 50%, ${CYAN}15 0%, transparent 50%),
              radial-gradient(ellipse 60% 60% at 80% 30%, ${PURPLE}15 0%, transparent 50%),
              radial-gradient(ellipse 50% 50% at 60% 80%, ${PINK}10 0%, transparent 50%)
            `,
            pointerEvents: 'none',
          }}
        />

        {/* Hex grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(${CYAN}08 1px, transparent 1px),
              linear-gradient(90deg, ${CYAN}08 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 1, width: '100%' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: featured.length ? '1.1fr 0.9fr' : '1fr',
              gap: 80,
              alignItems: 'center',
            }}
          >
            <div>
              {/* Glitch badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: `${CYAN}15`,
                  border: `1px solid ${CYAN}44`,
                  padding: '6px 14px',
                  borderRadius: 6,
                  marginBottom: 28,
                  position: 'relative',
                }}
              >
                <Activity size={12} color={CYAN} style={{ animation: 'pulse-glow 2s infinite' }} />
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase', color: CYAN }}>
                  NEW DROP AVAILABLE
                </span>
                <span
                  style={{
                    position: 'absolute',
                    top: -3,
                    right: -3,
                    width: 8,
                    height: 8,
                    background: CYAN,
                    borderRadius: '50%',
                    animation: 'pulse-glow 1s infinite',
                    boxShadow: `0 0 8px ${CYAN}`,
                  }}
                />
              </div>

              <h1
                style={{
                  fontSize: 'clamp(52px, 8vw, 104px)',
                  fontWeight: 900,
                  lineHeight: 0.9,
                  letterSpacing: '-0.04em',
                  marginBottom: 28,
                  textTransform: 'uppercase',
                }}
              >
                {settings.hero_title || (
                  <>
                    <span
                      style={{
                        background: `linear-gradient(90deg, ${CYAN}, ${PURPLE})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        display: 'block',
                      }}
                    >
                      NEON
                    </span>
                    <span style={{ display: 'block', color: LIGHT }}>DROP</span>
                    <span
                      style={{
                        display: 'block',
                        background: `linear-gradient(90deg, ${PURPLE}, ${PINK})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontSize: '0.6em',
                      }}
                    >
                      COLLECTION
                    </span>
                  </>
                )}
              </h1>

              <p
                style={{
                  fontSize: 16,
                  lineHeight: 1.6,
                  color: `${LIGHT}88`,
                  maxWidth: 460,
                  marginBottom: 40,
                  letterSpacing: '0.02em',
                }}
              >
                {settings.hero_subtitle || `${company} — La collection qui va casser Internet. Drops exclusifs. Livraison express dans toute l'Algérie.`}
              </p>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <a
                  href="#products"
                  style={{
                    background: `linear-gradient(135deg, ${CYAN}, ${PURPLE})`,
                    color: '#fff',
                    padding: '15px 36px',
                    borderRadius: 8,
                    fontWeight: 900,
                    fontSize: 13,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: `0 0 30px ${CYAN}55, 0 0 60px ${PURPLE}33`,
                  }}
                >
                  Shop Now <Zap size={14} fill="#fff" />
                </a>
                {whatsapp && (
                  <a
                    href={`https://wa.me/${whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      border: `1px solid ${CYAN}55`,
                      color: CYAN,
                      padding: '15px 36px',
                      borderRadius: 8,
                      fontWeight: 800,
                      fontSize: 13,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      textDecoration: 'none',
                    }}
                  >
                    WhatsApp
                  </a>
                )}
              </div>

              {/* Metrics */}
              <div style={{ display: 'flex', gap: 32, marginTop: 48, flexWrap: 'wrap' }}>
                {[
                  { val: `${products.length}+`, label: 'Produits' },
                  { val: '24h', label: 'Delivery' },
                  { val: '100%', label: 'COD' },
                ].map((s) => (
                  <div key={s.label}>
                    <div
                      style={{
                        fontSize: 26,
                        fontWeight: 900,
                        background: `linear-gradient(135deg, ${CYAN}, ${PURPLE})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {s.val}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: `${LIGHT}55`, letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Featured — floating cards */}
            {featured.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {featured.slice(0, 4).map((product, i) => {
                  const image = asStringArray(product.images)[0]
                  const colors = [CYAN, PURPLE, PINK, CYAN]
                  const page = pageByProduct.get(product.id)
                  const href = page?.status === 'published' ? `/shop/${page.slug}` : `/products/${product.id}`
                  return (
                    <Link
                      key={product.id}
                      href={href}
                      style={{
                        borderRadius: 16,
                        overflow: 'hidden',
                        aspectRatio: i === 0 ? '3/4' : '1',
                        gridRow: i === 0 ? '1 / 3' : undefined,
                        position: 'relative',
                        background: SURFACE,
                        border: `1px solid ${colors[i]}33`,
                        boxShadow: `0 0 20px ${colors[i]}22`,
                        animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
                        display: 'block',
                      }}
                    >
                      {image ? (
                        <img src={image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', minHeight: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', background: MID }}>
                          <Package size={28} color={`${colors[i]}66`} />
                        </div>
                      )}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: `linear-gradient(to top, rgba(8,8,14,0.9) 0%, transparent 60%)`,
                          padding: '20px 12px 12px',
                        }}
                      >
                        <p style={{ fontWeight: 800, fontSize: 12, color: '#fff', lineHeight: 1.3 }}>{product.name}</p>
                        <p style={{ fontSize: 11, fontWeight: 700, color: colors[i], marginTop: 4 }}>{money(product.price)}</p>
                      </div>
                      <div
                        style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          background: `${colors[i]}22`,
                          border: `1px solid ${colors[i]}55`,
                          borderRadius: 6,
                          padding: '3px 6px',
                          fontSize: 8,
                          fontWeight: 900,
                          color: colors[i],
                          letterSpacing: '0.1em',
                        }}
                      >
                        NEW
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" style={{ padding: '80px 24px', background: SURFACE }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 48, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', color: CYAN, marginBottom: 8 }}>
                LATEST DROP
              </div>
              <h2
                style={{
                  fontSize: 'clamp(32px, 5vw, 52px)',
                  fontWeight: 900,
                  letterSpacing: '-0.03em',
                  textTransform: 'uppercase',
                  background: `linear-gradient(135deg, ${LIGHT}, ${CYAN})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Catalogue
              </h2>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {categories.map((cat, i) => {
                const tabColors = [CYAN, PURPLE, PINK, CYAN, PURPLE]
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    style={{
                      padding: '7px 16px',
                      borderRadius: 6,
                      border: activeCategory === cat ? 'none' : `1px solid ${tabColors[i % tabColors.length]}33`,
                      background: activeCategory === cat ? `linear-gradient(135deg, ${CYAN}, ${PURPLE})` : 'transparent',
                      color: activeCategory === cat ? '#fff' : `${tabColors[i % tabColors.length]}cc`,
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: 'pointer',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      boxShadow: activeCategory === cat ? `0 0 16px ${CYAN}55` : undefined,
                    }}
                  >
                    {cat === 'all' ? 'ALL' : cat.toUpperCase()}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {filtered.map((product, productIndex) => {
              const image = asStringArray(product.images)[0]
              const page = pageByProduct.get(product.id)
              const colors = [CYAN, PURPLE, PINK, CYAN, PURPLE, PINK]
              const c = colors[productIndex % colors.length]
              const discount =
                product.compare_at_price && product.compare_at_price > product.price
                  ? Math.round((1 - product.price / product.compare_at_price) * 100)
                  : 0

              return (
                <article
                  key={product.id}
                  style={{
                    background: MID,
                    border: `1px solid ${c}22`,
                    borderRadius: 12,
                    overflow: 'hidden',
                    transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.03)'
                    e.currentTarget.style.borderColor = `${c}77`
                    e.currentTarget.style.boxShadow = `0 0 30px ${c}33`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.borderColor = `${c}22`
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {/* Colored top stripe */}
                  <div style={{ height: 3, background: `linear-gradient(90deg, ${c}, ${c}44)` }} />

                  <div style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', background: SURFACE }}>
                    {discount > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 10,
                          left: 10,
                          zIndex: 2,
                          background: `linear-gradient(135deg, ${CYAN}, ${PURPLE})`,
                          color: '#fff',
                          padding: '3px 8px',
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 900,
                          letterSpacing: '0.05em',
                          boxShadow: `0 0 12px ${CYAN}55`,
                        }}
                      >
                        -{discount}%
                      </div>
                    )}
                    {image ? (
                      <img src={image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Package size={32} color={`${c}44`} />
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '14px 14px 18px' }}>
                    <h3 style={{ fontWeight: 800, fontSize: 14, marginBottom: 4, color: LIGHT, letterSpacing: '-0.01em' }}>
                      {product.name}
                    </h3>
                    {product.brand && (
                      <p style={{ fontSize: 10, fontWeight: 700, color: c, marginBottom: 8, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        {product.brand}
                      </p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div>
                        <span
                          style={{
                            fontSize: 18,
                            fontWeight: 900,
                            background: `linear-gradient(135deg, ${c}, ${PURPLE})`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                          }}
                        >
                          {money(product.price)}
                        </span>
                        {product.compare_at_price && product.compare_at_price > product.price && (
                          <span style={{ fontSize: 11, color: `${LIGHT}33`, textDecoration: 'line-through', marginLeft: 6 }}>
                            {money(product.compare_at_price)}
                          </span>
                        )}
                      </div>
                      {page?.status === 'published' ? (
                        <Link
                          href={`/shop/${page.slug}`}
                          style={{
                            background: `linear-gradient(135deg, ${c}, ${PURPLE})`,
                            color: '#fff',
                            padding: '7px 12px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 900,
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            boxShadow: `0 0 12px ${c}55`,
                          }}
                        >
                          Buy <ChevronRight size={12} />
                        </Link>
                      ) : (
                        <Link
                          href={`/products/${product.id}`}
                          style={{
                            background: `linear-gradient(135deg, ${c}, ${PURPLE})`,
                            color: '#fff',
                            padding: '7px 12px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 900,
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            boxShadow: `0 0 12px ${c}55`,
                          }}
                        >
                          Details <ChevronRight size={12} />
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 0', color: `${LIGHT}44` }}>
              <Package size={48} color={`${CYAN}55`} style={{ margin: '0 auto 16px', display: 'block' }} />
              <p style={{ fontWeight: 700, fontSize: 16 }}>Aucun produit dans cette catégorie</p>
            </div>
          )}
        </div>
      </section>

      {/* About */}
      <section id="about" style={{ padding: '72px 24px', background: BG }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
          {[
            { icon: <Zap size={24} color={CYAN} />, c: CYAN, title: 'Livraison Flash', desc: 'Partout en Algérie. Paiement à la livraison (COD) — sans risque.' },
            { icon: <Radio size={24} color={PURPLE} />, c: PURPLE, title: 'Drops Exclusifs', desc: 'Des produits uniques qui ne se trouvent nulle part ailleurs.' },
            { icon: <Cpu size={24} color={PINK} />, c: PINK, title: 'Qualité Premium', desc: 'Testé et validé avant chaque envoi. Zéro compromis.' },
            { icon: <Activity size={24} color={CYAN} />, c: CYAN, title: 'Support 24/7', desc: 'Notre team répond sur WhatsApp à tout moment.' },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                background: SURFACE,
                border: `1px solid ${item.c}22`,
                borderRadius: 12,
                padding: '24px 20px',
                display: 'flex',
                gap: 14,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 2, background: `linear-gradient(90deg, ${item.c}, ${item.c}00)` }} />
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: `${item.c}15`,
                  border: `1px solid ${item.c}33`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </div>
              <div>
                <h3 style={{ fontWeight: 800, fontSize: 14, color: LIGHT, marginBottom: 6 }}>{item.title}</h3>
                <p style={{ fontSize: 12, lineHeight: 1.6, color: `${LIGHT}66` }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#04040a', borderTop: `1px solid ${CYAN}22`, padding: '40px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg, ${CYAN}, ${PURPLE})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 16px ${CYAN}55` }}>
              <Cpu size={14} color="#fff" />
            </div>
            <span
              style={{
                fontWeight: 900,
                fontSize: 16,
                background: `linear-gradient(90deg, ${CYAN}, ${PURPLE})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {company}
            </span>
          </div>
          <p style={{ fontSize: 12, color: `${LIGHT}33` }}>© {new Date().getFullYear()} {company}. All rights reserved.</p>
        </div>
      </footer>

      {/* Sticky CTA */}
      {whatsapp && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, padding: '10px 16px', background: `rgba(4, 4, 10, 0.97)`, backdropFilter: 'blur(24px)', borderTop: `1px solid ${CYAN}33` }}>
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: `linear-gradient(135deg, ${CYAN}, ${PURPLE})`,
              color: '#fff',
              padding: '13px',
              borderRadius: 10,
              fontWeight: 900,
              fontSize: 13,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              boxShadow: `0 0 30px ${CYAN}66`,
            }}
          >
            <Zap size={16} fill="#fff" /> Shop Now
          </a>
        </div>
      )}
    </main>
  )
}
