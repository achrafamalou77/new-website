'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { EcommerceProduct, EcommerceProductPage } from '@/types/ecommerce'
import {
  ShoppingBag,
  ArrowRight,
  Package,
  Truck,
  ShieldCheck,
  Zap,
  Target,
  TrendingUp,
  Star,
  ExternalLink,
  Globe,
  ChevronRight,
  BadgeCheck,
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

export default function EcommerceThemeTitanBold({ agency, products, pages }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const company = agency.company_name || 'Titan Store'
  const whatsapp = String(agency.phone || '').replace(/\D/g, '')
  const settings = agency.website_settings || {}
  const pageByProduct = new Map(pages.map((p) => [p.product_id, p]))

  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))]
  const filtered = activeCategory === 'all' ? products : products.filter((p) => p.category === activeCategory)
  const featured = products.filter((p) => p.is_featured).slice(0, 4)

  const BLUE = '#2563eb'
  const ELECTRIC = '#3b82f6'
  const DARK = '#0f172a'
  const MID = '#1e293b'
  const LIGHT = '#f8fafc'
  const ACCENT = '#06b6d4'

  return (
    <main
      className="min-h-screen overflow-x-hidden"
      style={{ background: DARK, color: LIGHT, fontFamily: '"Poppins", "Inter", sans-serif' }}
    >
      {/* Top bar */}
      <div
        style={{
          background: BLUE,
          color: '#fff',
          textAlign: 'center',
          padding: '8px 16px',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.05em',
        }}
      >
        ⚡ LIVRAISON EXPRESS · PAIEMENT COD · STOCK LIMITÉ ⚡
      </div>

      {/* Nav */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(15, 23, 42, 0.96)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid rgba(59, 130, 246, 0.2)`,
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
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: '#fff' }}>
            <div
              style={{
                width: 40,
                height: 40,
                background: BLUE,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 20px rgba(37, 99, 235, 0.5)`,
              }}
            >
              <Zap size={20} fill="#fff" color="#fff" />
            </div>
            <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: '-0.02em' }}>{company}</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <a href="#products" style={{ fontSize: 13, fontWeight: 700, color: 'rgba(248,250,252,0.65)', textDecoration: 'none', letterSpacing: '0.03em' }}>
              Produits
            </a>
            <a href="#features" style={{ fontSize: 13, fontWeight: 700, color: 'rgba(248,250,252,0.65)', textDecoration: 'none', letterSpacing: '0.03em' }}>
              Avantages
            </a>
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: BLUE,
                  color: '#fff',
                  padding: '10px 22px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 800,
                  textDecoration: 'none',
                  boxShadow: `0 0 20px rgba(37, 99, 235, 0.4)`,
                  letterSpacing: '0.05em',
                }}
              >
                COMMANDER
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section
        style={{
          position: 'relative',
          minHeight: '90vh',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          padding: '80px 24px',
        }}
      >
        {/* Animated background grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(37, 99, 235, 0.07) 1px, transparent 1px),
              linear-gradient(90deg, rgba(37, 99, 235, 0.07) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />
        {/* Glow effect */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 800,
            height: 400,
            background: `radial-gradient(ellipse at center, rgba(37, 99, 235, 0.2) 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Blue side accent */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            background: `linear-gradient(to bottom, transparent, ${BLUE}, transparent)`,
          }}
        />

        <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 1, width: '100%' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: featured.length ? '1fr 1fr' : '1fr',
              gap: 80,
              alignItems: 'center',
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: `rgba(37, 99, 235, 0.15)`,
                  border: `1px solid rgba(37, 99, 235, 0.4)`,
                  padding: '6px 14px',
                  borderRadius: 6,
                  marginBottom: 28,
                }}
              >
                <Zap size={12} color={ELECTRIC} />
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.25em',
                    textTransform: 'uppercase',
                    color: ELECTRIC,
                  }}
                >
                  Performance & Style
                </span>
              </div>

              <h1
                style={{
                  fontSize: 'clamp(48px, 7vw, 96px)',
                  fontWeight: 900,
                  lineHeight: 0.95,
                  letterSpacing: '-0.04em',
                  marginBottom: 28,
                }}
              >
                {settings.hero_title || (
                  <>
                    DOMINEZ
                    <br />
                    <span
                      style={{
                        background: `linear-gradient(135deg, ${BLUE}, ${ACCENT})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      LE MARCHÉ
                    </span>
                  </>
                )}
              </h1>

              <p
                style={{
                  fontSize: 18,
                  lineHeight: 1.6,
                  color: 'rgba(248, 250, 252, 0.6)',
                  maxWidth: 480,
                  marginBottom: 44,
                }}
              >
                {settings.hero_subtitle || `${company} — Des produits haut de gamme pour les exigeants. Livraison express dans toute l'Algérie.`}
              </p>

              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <a
                  href="#products"
                  style={{
                    background: BLUE,
                    color: '#fff',
                    padding: '16px 36px',
                    borderRadius: 8,
                    fontWeight: 900,
                    fontSize: 14,
                    letterSpacing: '0.1em',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: `0 0 30px rgba(37, 99, 235, 0.5)`,
                    textTransform: 'uppercase',
                  }}
                >
                  Explorer <ArrowRight size={16} />
                </a>
                {whatsapp && (
                  <a
                    href={`https://wa.me/${whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      border: `2px solid rgba(37, 99, 235, 0.4)`,
                      color: ELECTRIC,
                      padding: '16px 36px',
                      borderRadius: 8,
                      fontWeight: 800,
                      fontSize: 14,
                      textDecoration: 'none',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    WhatsApp
                  </a>
                )}
              </div>

              {/* Trust indicators */}
              <div style={{ display: 'flex', gap: 28, marginTop: 44, flexWrap: 'wrap' }}>
                {[
                  { val: `${products.length}+`, label: 'Produits' },
                  { val: '48h', label: 'Livraison' },
                  { val: '100%', label: 'COD' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div style={{ fontSize: 24, fontWeight: 900, color: ELECTRIC }}>{stat.val}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(248,250,252,0.45)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Featured grid — diagonal/staggered */}
            {featured.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {featured.slice(0, 4).map((product, i) => {
                  const image = asStringArray(product.images)[0]
                  const page = pageByProduct.get(product.id)
                  const href = page?.status === 'published' ? `/shop/${page.slug}` : `/products/${product.id}`
                  return (
                    <Link
                      key={product.id}
                      href={href}
                      style={{
                        borderRadius: 12,
                        overflow: 'hidden',
                        aspectRatio: '1',
                        position: 'relative',
                        background: MID,
                        border: `1px solid rgba(37, 99, 235, 0.2)`,
                        transform: i % 2 === 1 ? 'translateY(24px)' : undefined,
                        boxShadow: `0 0 30px rgba(37, 99, 235, 0.08)`,
                        display: 'block',
                      }}
                    >
                      {image ? (
                        <img src={image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', minHeight: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Package size={32} color="rgba(59,130,246,0.3)" />
                        </div>
                      )}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: `linear-gradient(to top, rgba(15,23,42,0.9) 0%, transparent 60%)`,
                          padding: '24px 12px 12px',
                        }}
                      >
                        <p style={{ fontWeight: 800, fontSize: 13, color: '#fff', lineHeight: 1.2 }}>{product.name}</p>
                        <p style={{ fontSize: 12, fontWeight: 700, color: ELECTRIC, marginTop: 4 }}>{money(product.price)}</p>
                      </div>
                      {product.is_featured && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 10,
                            left: 10,
                            background: BLUE,
                            color: '#fff',
                            padding: '3px 8px',
                            borderRadius: 4,
                            fontSize: 9,
                            fontWeight: 900,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                          }}
                        >
                          TOP
                        </div>
                      )}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Products */}
      <section
        id="products"
        style={{ padding: '80px 24px', background: '#0a1628' }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 48, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase', color: ELECTRIC, marginBottom: 8 }}>
                ▸ CATALOGUE
              </div>
              <h2 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 900, letterSpacing: '-0.03em' }}>
                Nos Meilleurs Produits
              </h2>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 6,
                    border: activeCategory === cat ? 'none' : `1px solid rgba(37, 99, 235, 0.3)`,
                    background: activeCategory === cat ? BLUE : 'transparent',
                    color: activeCategory === cat ? '#fff' : 'rgba(248,250,252,0.55)',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    boxShadow: activeCategory === cat ? `0 0 16px rgba(37, 99, 235, 0.4)` : undefined,
                  }}
                >
                  {cat === 'all' ? 'TOUT' : cat.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {filtered.map((product) => {
              const image = asStringArray(product.images)[0]
              const page = pageByProduct.get(product.id)
              const discount =
                product.compare_at_price && product.compare_at_price > product.price
                  ? Math.round((1 - product.price / product.compare_at_price) * 100)
                  : 0

              return (
                <article
                  key={product.id}
                  style={{
                    background: MID,
                    border: `1px solid rgba(37, 99, 235, 0.12)`,
                    borderRadius: 12,
                    overflow: 'hidden',
                    transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)'
                    e.currentTarget.style.borderColor = `rgba(37, 99, 235, 0.5)`
                    e.currentTarget.style.boxShadow = `0 0 30px rgba(37, 99, 235, 0.2)`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.borderColor = `rgba(37, 99, 235, 0.12)`
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden' }}>
                    {discount > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 10,
                          left: 10,
                          zIndex: 2,
                          background: BLUE,
                          color: '#fff',
                          padding: '4px 10px',
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 900,
                          letterSpacing: '0.05em',
                          boxShadow: `0 0 12px rgba(37, 99, 235, 0.5)`,
                        }}
                      >
                        -{discount}%
                      </div>
                    )}
                    {product.is_featured && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          zIndex: 2,
                          background: ACCENT,
                          color: '#0a1628',
                          padding: '4px 8px',
                          borderRadius: 4,
                          fontSize: 9,
                          fontWeight: 900,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                        }}
                      >
                        TOP
                      </div>
                    )}
                    {image ? (
                      <img src={image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          minHeight: 180,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(37, 99, 235, 0.05)',
                        }}
                      >
                        <Package size={32} color="rgba(59,130,246,0.4)" />
                      </div>
                    )}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 60,
                        background: `linear-gradient(to top, ${MID}, transparent)`,
                      }}
                    />
                  </div>
                  <div style={{ padding: '16px 16px 20px' }}>
                    <div style={{ display: 'flex', gap: 2, marginBottom: 6 }}>
                      {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={11} color={ELECTRIC} fill={ELECTRIC} />)}
                    </div>
                    <h3 style={{ fontWeight: 800, fontSize: 15, marginBottom: 6, lineHeight: 1.3 }}>{product.name}</h3>
                    {product.brand && (
                      <p style={{ fontSize: 11, fontWeight: 700, color: ELECTRIC, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        {product.brand}
                      </p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div>
                        <span style={{ fontSize: 20, fontWeight: 900, color: ELECTRIC }}>{money(product.price)}</span>
                        {product.compare_at_price && product.compare_at_price > product.price && (
                          <span style={{ fontSize: 12, color: 'rgba(248,250,252,0.3)', textDecoration: 'line-through', marginLeft: 8 }}>
                            {money(product.compare_at_price)}
                          </span>
                        )}
                      </div>
                      {page?.status === 'published' ? (
                        <Link
                          href={`/shop/${page.slug}`}
                          style={{
                            background: BLUE,
                            color: '#fff',
                            padding: '8px 14px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 800,
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            letterSpacing: '0.05em',
                            boxShadow: `0 0 12px rgba(37, 99, 235, 0.4)`,
                          }}
                        >
                          Acheter <ChevronRight size={12} />
                        </Link>
                      ) : (
                        <Link
                          href={`/products/${product.id}`}
                          style={{
                            background: BLUE,
                            color: '#fff',
                            padding: '8px 14px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 800,
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            letterSpacing: '0.05em',
                            boxShadow: `0 0 12px rgba(37, 99, 235, 0.4)`,
                          }}
                        >
                          Détails <ChevronRight size={12} />
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(248,250,252,0.4)' }}>
              <Package size={48} color={ELECTRIC} style={{ margin: '0 auto 16px', display: 'block' }} />
              <p style={{ fontWeight: 700 }}>Aucun produit dans cette catégorie</p>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: '80px 24px', background: DARK }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              marginBottom: 48,
              textAlign: 'center',
            }}
          >
            Pourquoi choisir{' '}
            <span
              style={{
                background: `linear-gradient(135deg, ${BLUE}, ${ACCENT})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {company}
            </span>
            ?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            {[
              { icon: <Zap size={24} color={ELECTRIC} />, title: 'Livraison Express', desc: 'Expédition sous 24-48h dans toute l\'Algérie. Paiement à la réception.' },
              { icon: <ShieldCheck size={24} color={ELECTRIC} />, title: 'Qualité Garantie', desc: 'Tous nos produits sont vérifiés et sélectionnés avec des standards stricts.' },
              { icon: <Target size={24} color={ELECTRIC} />, title: 'Prix Compétitifs', desc: 'Les meilleurs prix du marché algérien avec des offres exclusives régulières.' },
              { icon: <TrendingUp size={24} color={ACCENT} />, title: 'Service Client', desc: 'Notre équipe est disponible sur WhatsApp pour vous aider 7j/7.' },
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  background: MID,
                  border: `1px solid rgba(37, 99, 235, 0.12)`,
                  borderRadius: 12,
                  padding: '28px 24px',
                  display: 'flex',
                  gap: 16,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 10,
                    background: `rgba(37, 99, 235, 0.1)`,
                    border: `1px solid rgba(37, 99, 235, 0.2)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </div>
                <div>
                  <h3 style={{ fontWeight: 800, fontSize: 15, marginBottom: 8 }}>{item.title}</h3>
                  <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(248,250,252,0.55)' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#060e1a', borderTop: '1px solid rgba(37, 99, 235, 0.1)', padding: '48px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, background: BLUE, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={16} fill="#fff" color="#fff" />
              </div>
              <span style={{ fontWeight: 900, fontSize: 16, letterSpacing: '-0.01em' }}>{company}</span>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(248,250,252,0.4)', maxWidth: 260 }}>Boutique en ligne · Livraison dans toute l&apos;Algérie</p>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(248,250,252,0.25)' }}>© {new Date().getFullYear()} {company}. Tous droits réservés.</p>
        </div>
      </footer>

      {/* Sticky CTA */}
      {whatsapp && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            padding: '12px 16px',
            background: 'rgba(10, 22, 40, 0.97)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(37, 99, 235, 0.2)',
          }}
        >
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: BLUE,
              color: '#fff',
              padding: '14px',
              borderRadius: 8,
              fontWeight: 900,
              fontSize: 13,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              boxShadow: `0 0 24px rgba(37, 99, 235, 0.5)`,
            }}
          >
            <Zap size={16} fill="#fff" />
            Commander Maintenant
          </a>
        </div>
      )}
    </main>
  )
}
