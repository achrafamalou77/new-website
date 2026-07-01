'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { EcommerceProduct, EcommerceProductPage } from '@/types/ecommerce'
import {
  ShoppingBag,
  Star,
  ArrowRight,
  Package,
  Truck,
  ShieldCheck,
  ChevronDown,
  Crown,
  Gem,
  ExternalLink,
  Globe,
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

export default function EcommerceThemeNoirLuxe({ agency, products, pages }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const company = agency.company_name || 'Noir Luxe'
  const whatsapp = String(agency.phone || '').replace(/\D/g, '')
  const settings = agency.website_settings || {}
  const pageByProduct = new Map(pages.map((p) => [p.product_id, p]))

  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))]
  const filtered = activeCategory === 'all' ? products : products.filter((p) => p.category === activeCategory)
  const featured = products.filter((p) => p.is_featured).slice(0, 3)

  return (
    <main
      className="min-h-screen overflow-x-hidden"
      style={{
        background: '#0a0a0a',
        color: '#f5f0e8',
        fontFamily: '"Geist", "Inter", sans-serif',
      }}
    >
      {/* Gold accent top bar */}
      <div
        style={{
          background: 'linear-gradient(90deg, #b8860b, #d4af37, #f0d060, #d4af37, #b8860b)',
          height: '2px',
        }}
      />

      {/* Sticky Nav */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(10, 10, 10, 0.92)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(212, 175, 55, 0.15)',
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
            height: 72,
          }}
        >
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <div
              style={{
                width: 40,
                height: 40,
                background: 'linear-gradient(135deg, #b8860b, #d4af37)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Crown size={18} color="#0a0a0a" />
            </div>
            <span
              style={{
                fontWeight: 900,
                fontSize: 20,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#f5f0e8',
              }}
            >
              {company}
            </span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <a href="#products" style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(245, 240, 232, 0.6)', textDecoration: 'none' }}>
              Collection
            </a>
            <a href="#about" style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(245, 240, 232, 0.6)', textDecoration: 'none' }}>
              À propos
            </a>
            <a href="#contact" style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(245, 240, 232, 0.6)', textDecoration: 'none' }}>
              Contact
            </a>
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: 'linear-gradient(135deg, #b8860b, #d4af37)',
                  color: '#0a0a0a',
                  padding: '10px 20px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                }}
              >
                Commander
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
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
        {/* Background grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(212,175,55,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(212,175,55,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
        {/* Radial glow */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            right: '-10%',
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
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
                  border: '1px solid rgba(212,175,55,0.4)',
                  padding: '6px 16px',
                  borderRadius: 2,
                  marginBottom: 32,
                }}
              >
                <Gem size={12} color="#d4af37" />
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                    color: '#d4af37',
                  }}
                >
                  Collection Exclusive
                </span>
              </div>
              <h1
                style={{
                  fontSize: 'clamp(48px, 7vw, 96px)',
                  fontWeight: 900,
                  lineHeight: 0.9,
                  letterSpacing: '-0.03em',
                  marginBottom: 32,
                }}
              >
                {settings.hero_title || (
                  <>
                    L&apos;Art du{' '}
                    <span
                      style={{
                        background: 'linear-gradient(135deg, #b8860b, #d4af37, #f0d060)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      Luxe
                    </span>{' '}
                    <br />
                    Redéfini
                  </>
                )}
              </h1>
              <p
                style={{
                  fontSize: 18,
                  lineHeight: 1.7,
                  color: 'rgba(245,240,232,0.55)',
                  maxWidth: 500,
                  marginBottom: 48,
                }}
              >
                {settings.hero_subtitle || `${company} — Une sélection rigoureuse de produits d'exception. Qualité irréprochable, livraison en Algérie.`}
              </p>
              <div style={{ display: 'flex', gap: 16 }}>
                <a
                  href="#products"
                  style={{
                    background: 'linear-gradient(135deg, #b8860b, #d4af37)',
                    color: '#0a0a0a',
                    padding: '16px 36px',
                    borderRadius: 4,
                    fontWeight: 900,
                    fontSize: 13,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  Voir la Collection <ArrowRight size={16} />
                </a>
                {whatsapp && (
                  <a
                    href={`https://wa.me/${whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      border: '1px solid rgba(212,175,55,0.4)',
                      color: '#d4af37',
                      padding: '16px 36px',
                      borderRadius: 4,
                      fontWeight: 700,
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
            </div>

            {featured.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: featured.length >= 2 ? '1fr 1fr' : '1fr',
                  gap: 16,
                }}
              >
                {featured.slice(0, 3).map((product, i) => {
                  const image = asStringArray(product.images)[0]
                  const page = pageByProduct.get(product.id)
                  const href = page?.status === 'published' ? `/shop/${page.slug}` : `/products/${product.id}`
                  return (
                    <Link
                      key={product.id}
                      href={href}
                      style={{
                        gridColumn: i === 0 && featured.length >= 2 ? '1 / -1' : undefined,
                        position: 'relative',
                        overflow: 'hidden',
                        borderRadius: 8,
                        border: '1px solid rgba(212,175,55,0.15)',
                        background: '#111',
                        aspectRatio: i === 0 ? '16/9' : '4/3',
                        display: 'block',
                      }}
                    >
                      {image ? (
                        <img
                          src={image}
                          alt={product.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            opacity: 0.8,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            minHeight: 180,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, #111, #1a1a1a)',
                          }}
                        >
                          <Package size={32} color="rgba(212,175,55,0.3)" />
                        </div>
                      )}
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)',
                        }}
                      />
                      <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
                        <p
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            letterSpacing: '0.25em',
                            textTransform: 'uppercase',
                            color: '#d4af37',
                            marginBottom: 4,
                          }}
                        >
                          {product.category}
                        </p>
                        <p style={{ fontWeight: 800, fontSize: 14, color: '#fff' }}>{product.name}</p>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#d4af37', marginTop: 4 }}>
                          {money(product.price)}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <div
        style={{
          borderTop: '1px solid rgba(212,175,55,0.1)',
          borderBottom: '1px solid rgba(212,175,55,0.1)',
          padding: '24px 24px',
          background: 'rgba(212,175,55,0.03)',
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 0,
          }}
        >
          {[
            { label: 'Produits Exclusifs', value: `${products.length}+` },
            { label: 'Clients Satisfaits', value: '2 500+' },
            { label: 'Livraison Algérie', value: '48h' },
            { label: 'Paiement COD', value: '100%' },
          ].map((stat, i) => (
            <div
              key={stat.label}
              style={{
                textAlign: 'center',
                padding: '16px 24px',
                borderRight: i < 3 ? '1px solid rgba(212,175,55,0.1)' : undefined,
              }}
            >
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  letterSpacing: '-0.02em',
                  background: 'linear-gradient(135deg, #b8860b, #d4af37)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'rgba(245,240,232,0.45)',
                  marginTop: 4,
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Products */}
      <section id="products" style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16,
              }}
            >
              <div style={{ width: 32, height: 1, background: '#d4af37' }} />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  color: '#d4af37',
                }}
              >
                La Collection
              </span>
              <div style={{ width: 32, height: 1, background: '#d4af37' }} />
            </div>
            <h2
              style={{
                fontSize: 'clamp(36px, 5vw, 56px)',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                color: '#f5f0e8',
              }}
            >
              Pièces d&apos;Exception
            </h2>
          </div>

          {/* Category filter */}
          {categories.length > 2 && (
            <div
              style={{
                display: 'flex',
                gap: 8,
                justifyContent: 'center',
                flexWrap: 'wrap',
                marginBottom: 48,
              }}
            >
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '8px 20px',
                    border: activeCategory === cat ? '1px solid #d4af37' : '1px solid rgba(212,175,55,0.2)',
                    background: activeCategory === cat ? 'rgba(212,175,55,0.1)' : 'transparent',
                    color: activeCategory === cat ? '#d4af37' : 'rgba(245,240,232,0.5)',
                    borderRadius: 2,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {cat === 'all' ? 'Tout voir' : cat}
                </button>
              ))}
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 24,
            }}
          >
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
                    background: '#111',
                    border: '1px solid rgba(212,175,55,0.1)',
                    borderRadius: 8,
                    overflow: 'hidden',
                    transition: 'border-color 0.3s, transform 0.3s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(212,175,55,0.5)'
                    e.currentTarget.style.transform = 'translateY(-4px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(212,175,55,0.1)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden' }}>
                    {discount > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 12,
                          left: 12,
                          zIndex: 2,
                          background: 'linear-gradient(135deg, #b8860b, #d4af37)',
                          color: '#0a0a0a',
                          padding: '4px 10px',
                          borderRadius: 2,
                          fontSize: 10,
                          fontWeight: 900,
                          letterSpacing: '0.1em',
                        }}
                      >
                        -{discount}%
                      </div>
                    )}
                    {image ? (
                      <img
                        src={image}
                        alt={product.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          minHeight: 200,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'linear-gradient(135deg, #141414, #1a1a1a)',
                        }}
                      >
                        <Package size={32} color="rgba(212,175,55,0.3)" />
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '20px 20px 24px' }}>
                    <p
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: '0.25em',
                        textTransform: 'uppercase',
                        color: '#d4af37',
                        marginBottom: 8,
                      }}
                    >
                      {product.category || product.brand}
                    </p>
                    <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 12, color: '#f5f0e8', lineHeight: 1.3 }}>
                      {product.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div>
                        <span
                          style={{
                            fontSize: 20,
                            fontWeight: 900,
                            background: 'linear-gradient(135deg, #b8860b, #d4af37)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                          }}
                        >
                          {money(product.price)}
                        </span>
                        {product.compare_at_price && product.compare_at_price > product.price && (
                          <span
                            style={{
                              fontSize: 13,
                              color: 'rgba(245,240,232,0.3)',
                              textDecoration: 'line-through',
                              marginLeft: 8,
                            }}
                          >
                            {money(product.compare_at_price)}
                          </span>
                        )}
                      </div>
                      {page?.status === 'published' ? (
                        <Link
                          href={`/shop/${page.slug}`}
                          style={{
                            background: 'linear-gradient(135deg, #b8860b, #d4af37)',
                            color: '#0a0a0a',
                            padding: '8px 16px',
                            borderRadius: 2,
                            fontSize: 10,
                            fontWeight: 900,
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Commander <ArrowRight size={12} />
                        </Link>
                      ) : (
                        <Link
                          href={`/products/${product.id}`}
                          style={{
                            border: '1px solid rgba(212,175,55,0.4)',
                            color: '#d4af37',
                            padding: '8px 16px',
                            borderRadius: 2,
                            fontSize: 10,
                            fontWeight: 900,
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            textDecoration: 'none',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          Détails <ArrowRight size={12} />
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(245,240,232,0.4)' }}>
              <Package size={48} style={{ margin: '0 auto 16px' }} />
              <p style={{ fontSize: 16, fontWeight: 700 }}>Aucun produit dans cette catégorie</p>
            </div>
          )}
        </div>
      </section>

      {/* Trust bar */}
      <section
        id="about"
        style={{
          padding: '64px 24px',
          background: 'rgba(212,175,55,0.04)',
          borderTop: '1px solid rgba(212,175,55,0.1)',
          borderBottom: '1px solid rgba(212,175,55,0.1)',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 40,
            }}
          >
            {[
              {
                icon: <Crown size={24} color="#d4af37" />,
                title: 'Produits Certifiés',
                desc: 'Chaque pièce est sélectionnée avec soin pour garantir la plus haute qualité.',
              },
              {
                icon: <Truck size={24} color="#d4af37" />,
                title: 'Livraison Express',
                desc: 'Expédition rapide vers toutes les wilayas d\'Algérie, paiement à la livraison.',
              },
              {
                icon: <ShieldCheck size={24} color="#d4af37" />,
                title: 'Garantie Satisfait',
                desc: 'Commandez avec confiance. Notre service client vous accompagne.',
              },
              {
                icon: <Star size={24} color="#d4af37" />,
                title: 'Service VIP',
                desc: 'Conseils personnalisés sur WhatsApp pour choisir votre produit.',
              },
            ].map((item) => (
              <div key={item.title} style={{ display: 'flex', gap: 16 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    border: '1px solid rgba(212,175,55,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </div>
                <div>
                  <h3 style={{ fontWeight: 800, fontSize: 15, marginBottom: 6, color: '#f5f0e8' }}>{item.title}</h3>
                  <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(245,240,232,0.5)' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      {whatsapp && (
        <section
          id="contact"
          style={{
            padding: '80px 24px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `linear-gradient(rgba(212,175,55,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.04) 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }}
          />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                border: '1px solid rgba(212,175,55,0.3)',
                padding: '6px 16px',
                borderRadius: 2,
                marginBottom: 24,
              }}
            >
              <Gem size={12} color="#d4af37" />
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#d4af37' }}>
                Conseils Gratuits
              </span>
            </div>
            <h2
              style={{
                fontSize: 'clamp(32px, 5vw, 56px)',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                marginBottom: 20,
              }}
            >
              Vous avez une question ?
            </h2>
            <p style={{ fontSize: 18, color: 'rgba(245,240,232,0.55)', marginBottom: 40, maxWidth: 500, margin: '0 auto 40px' }}>
              Notre équipe est disponible sur WhatsApp pour vous guider vers la pièce parfaite.
            </p>
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
                background: 'linear-gradient(135deg, #b8860b, #d4af37)',
                color: '#0a0a0a',
                padding: '18px 48px',
                borderRadius: 4,
                fontWeight: 900,
                fontSize: 14,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                textDecoration: 'none',
              }}
            >
              <ShoppingBag size={18} />
              Contacter sur WhatsApp
            </a>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer
        style={{
          background: '#050505',
          borderTop: '1px solid rgba(212,175,55,0.1)',
          padding: '48px 24px',
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: 32,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  background: 'linear-gradient(135deg, #b8860b, #d4af37)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Crown size={14} color="#0a0a0a" />
              </div>
              <span style={{ fontWeight: 900, fontSize: 16, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {company}
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(245,240,232,0.4)', maxWidth: 260, lineHeight: 1.7 }}>
              Boutique en ligne premium. Livraison dans toute l&apos;Algérie avec paiement à la livraison.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {agency.instagram && (
              <a href={agency.instagram} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(245, 240, 232, 0.4)', textDecoration: 'none' }}>
                <ExternalLink size={20} />
              </a>
            )}
            {agency.facebook && (
              <a href={agency.facebook} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(245, 240, 232, 0.4)', textDecoration: 'none' }}>
                <Globe size={20} />
              </a>
            )}
          </div>
        </div>
        <div
          style={{
            maxWidth: 1280,
            margin: '24px auto 0',
            paddingTop: 24,
            borderTop: '1px solid rgba(212,175,55,0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <p style={{ fontSize: 12, color: 'rgba(245,240,232,0.25)' }}>
            © {new Date().getFullYear()} {company}. Tous droits réservés.
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              color: 'rgba(212,175,55,0.5)',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#d4af37',
                animation: 'pulse 2s infinite',
              }}
            />
            Paiement à la livraison disponible
          </div>
        </div>
      </footer>

      {/* Sticky mobile CTA */}
      {whatsapp && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            padding: '12px 16px',
            background: 'rgba(5,5,5,0.95)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(212,175,55,0.15)',
            display: 'flex',
            gap: 12,
          }}
        >
          <a
            href="#products"
            style={{
              flex: 1,
              textAlign: 'center',
              border: '1px solid rgba(212,175,55,0.3)',
              color: '#d4af37',
              padding: '12px',
              borderRadius: 4,
              fontWeight: 800,
              fontSize: 12,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              textDecoration: 'none',
            }}
          >
            Collection
          </a>
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 2,
              textAlign: 'center',
              background: 'linear-gradient(135deg, #b8860b, #d4af37)',
              color: '#0a0a0a',
              padding: '12px',
              borderRadius: 4,
              fontWeight: 900,
              fontSize: 12,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              textDecoration: 'none',
            }}
          >
            Commander sur WhatsApp
          </a>
        </div>
      )}
    </main>
  )
}
