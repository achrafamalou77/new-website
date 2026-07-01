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
  Heart,
  Leaf,
  Sparkles,
  Star,
  ExternalLink,
  Globe,
  Phone,
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

export default function EcommerceThemeBloomFresh({ agency, products, pages }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const company = agency.company_name || 'Bloom Store'
  const whatsapp = String(agency.phone || '').replace(/\D/g, '')
  const settings = agency.website_settings || {}
  const pageByProduct = new Map(pages.map((p) => [p.product_id, p]))

  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))]
  const filtered = activeCategory === 'all' ? products : products.filter((p) => p.category === activeCategory)
  const featured = products.filter((p) => p.is_featured).slice(0, 4)

  const PINK = '#f472b6'
  const ROSE = '#ec4899'
  const SAGE = '#6b9e7b'
  const CREAM = '#fef9f5'
  const DARK = '#2d1a1e'

  return (
    <main
      className="min-h-screen overflow-x-hidden"
      style={{ background: CREAM, color: DARK, fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif' }}
    >
      {/* Promo bar */}
      <div
        style={{
          background: `linear-gradient(90deg, ${SAGE}, #4a7c59, ${SAGE})`,
          color: '#fff',
          textAlign: 'center',
          padding: '10px 16px',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.05em',
        }}
      >
        🌸 Livraison offerte dès 5 000 DZD · Paiement à la livraison dans toute l&apos;Algérie 🌸
      </div>

      {/* Nav */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(254, 249, 245, 0.92)',
          backdropFilter: 'blur(16px)',
          borderBottom: `1px solid rgba(244, 114, 182, 0.12)`,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            height: 68,
          }}
        >
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div
              style={{
                width: 36,
                height: 36,
                background: `linear-gradient(135deg, ${PINK}, ${ROSE})`,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 16px rgba(236, 72, 153, 0.3)`,
              }}
            >
              <Leaf size={16} color="#fff" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 18, color: DARK, letterSpacing: '-0.02em' }}>{company}</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <a href="#products" style={{ fontSize: 13, fontWeight: 600, color: DARK, textDecoration: 'none', opacity: 0.65 }}>
              Produits
            </a>
            <a href="#why" style={{ fontSize: 13, fontWeight: 600, color: DARK, textDecoration: 'none', opacity: 0.65 }}>
              Pourquoi nous
            </a>
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: `linear-gradient(135deg, ${PINK}, ${ROSE})`,
                  color: '#fff',
                  padding: '10px 22px',
                  borderRadius: 50,
                  fontSize: 12,
                  fontWeight: 800,
                  textDecoration: 'none',
                  boxShadow: `0 4px 16px rgba(236, 72, 153, 0.3)`,
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
          overflow: 'hidden',
          padding: '80px 24px 60px',
        }}
      >
        {/* Background blobs */}
        <div
          style={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(244, 114, 182, 0.15) 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -80,
            left: -40,
            width: 350,
            height: 350,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(107, 158, 123, 0.12) 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: featured.length ? '1fr 1fr' : '1fr',
              gap: 60,
              alignItems: 'center',
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: `rgba(244, 114, 182, 0.1)`,
                  border: `1px solid rgba(244, 114, 182, 0.2)`,
                  padding: '6px 14px',
                  borderRadius: 50,
                  marginBottom: 24,
                }}
              >
                <Sparkles size={12} color={PINK} />
                <span style={{ fontSize: 11, fontWeight: 700, color: ROSE, letterSpacing: '0.05em' }}>
                  Nouveautés Disponibles
                </span>
              </div>

              <h1
                style={{
                  fontSize: 'clamp(40px, 6vw, 72px)',
                  fontWeight: 900,
                  lineHeight: 1.05,
                  letterSpacing: '-0.03em',
                  color: DARK,
                  marginBottom: 20,
                }}
              >
                {settings.hero_title || (
                  <>
                    Découvrez ce qui{' '}
                    <span
                      style={{
                        background: `linear-gradient(135deg, ${PINK}, ${ROSE})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      vous ressemble
                    </span>
                  </>
                )}
              </h1>

              <p
                style={{
                  fontSize: 17,
                  lineHeight: 1.7,
                  color: 'rgba(45, 26, 30, 0.6)',
                  maxWidth: 440,
                  marginBottom: 40,
                }}
              >
                {settings.hero_subtitle || `Une sélection fraîche et soigneuse de produits beauté, lifestyle et bien-être. Livraison en Algérie.`}
              </p>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <a
                  href="#products"
                  style={{
                    background: `linear-gradient(135deg, ${PINK}, ${ROSE})`,
                    color: '#fff',
                    padding: '14px 32px',
                    borderRadius: 50,
                    fontWeight: 800,
                    fontSize: 14,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: `0 8px 24px rgba(236, 72, 153, 0.3)`,
                  }}
                >
                  Voir les Produits <ArrowRight size={16} />
                </a>
                {whatsapp && (
                  <a
                    href={`https://wa.me/${whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      border: `2px solid ${PINK}`,
                      color: ROSE,
                      padding: '14px 32px',
                      borderRadius: 50,
                      fontWeight: 700,
                      fontSize: 14,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Phone size={16} /> Nous Appeler
                  </a>
                )}
              </div>

              {/* Trust badges */}
              <div style={{ display: 'flex', gap: 24, marginTop: 40, flexWrap: 'wrap' }}>
                {[
                  { icon: <Truck size={14} color={SAGE} />, text: 'Livraison rapide' },
                  { icon: <ShieldCheck size={14} color={SAGE} />, text: 'Paiement sécurisé' },
                  { icon: <Heart size={14} color={ROSE} />, text: 'Satisfaite garantie' },
                ].map((badge) => (
                  <div
                    key={badge.text}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: DARK, opacity: 0.7 }}
                  >
                    {badge.icon}
                    {badge.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Featured products grid */}
            {featured.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 16,
                }}
              >
                {featured.slice(0, 4).map((product, i) => {
                  const image = asStringArray(product.images)[0]
                  return (
                    <div
                      key={product.id}
                      style={{
                        borderRadius: i === 0 ? '32px 32px 8px 32px' : i === 1 ? '32px 32px 32px 8px' : i === 2 ? '8px 32px 32px 32px' : '32px 8px 32px 32px',
                        overflow: 'hidden',
                        aspectRatio: '3/4',
                        position: 'relative',
                        background: '#f3d5e4',
                        boxShadow: `0 8px 32px rgba(244, 114, 182, 0.15)`,
                      }}
                    >
                      {image ? (
                        <img src={image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: `linear-gradient(135deg, rgba(244, 114, 182, 0.1), rgba(107, 158, 123, 0.1))`,
                          }}
                        >
                          <Package size={28} color={PINK} />
                        </div>
                      )}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: 'linear-gradient(to top, rgba(45,26,30,0.75) 0%, transparent 60%)',
                          padding: '16px 12px 12px',
                        }}
                      >
                        <p style={{ fontSize: 12, fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>{product.name}</p>
                        <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
                          {money(product.price)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      <div
        style={{
          background: `linear-gradient(135deg, ${PINK}12, ${SAGE}12)`,
          padding: '28px 24px',
          borderTop: `1px solid rgba(244, 114, 182, 0.1)`,
          borderBottom: `1px solid rgba(244, 114, 182, 0.1)`,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 0,
            textAlign: 'center',
          }}
        >
          {[
            { value: `${products.length}+`, label: 'Produits' },
            { value: '98%', label: 'Clientes Satisfaites' },
            { value: '2j', label: 'Livraison Moyenne' },
            { value: '100%', label: 'COD Disponible' },
          ].map((stat, i) => (
            <div key={stat.label} style={{ padding: '12px', borderRight: i < 3 ? `1px solid rgba(244, 114, 182, 0.15)` : undefined }}>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  background: `linear-gradient(135deg, ${ROSE}, ${PINK})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(45,26,30,0.5)', marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Products */}
      <section id="products" style={{ padding: '72px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span
              style={{
                display: 'inline-block',
                background: `linear-gradient(135deg, ${PINK}, ${ROSE})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                marginBottom: 12,
              }}
            >
              ✿ Notre Sélection
            </span>
            <h2 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 900, letterSpacing: '-0.02em', color: DARK }}>
              Produits Tendance
            </h2>
          </div>

          {/* Category pills */}
          {categories.length > 2 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 40 }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 50,
                    border: activeCategory === cat ? `2px solid ${ROSE}` : '2px solid rgba(244,114,182,0.2)',
                    background: activeCategory === cat ? `linear-gradient(135deg, ${PINK}, ${ROSE})` : 'transparent',
                    color: activeCategory === cat ? '#fff' : ROSE,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {cat === 'all' ? '✿ Tous' : cat}
                </button>
              ))}
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
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
                    background: '#fff',
                    borderRadius: 24,
                    overflow: 'hidden',
                    border: '1px solid rgba(244, 114, 182, 0.1)',
                    boxShadow: '0 2px 16px rgba(244, 114, 182, 0.06)',
                    transition: 'transform 0.25s, box-shadow 0.25s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-6px)'
                    e.currentTarget.style.boxShadow = `0 12px 40px rgba(244, 114, 182, 0.18)`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 2px 16px rgba(244, 114, 182, 0.06)'
                  }}
                >
                  <div style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden' }}>
                    {discount > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          zIndex: 2,
                          background: `linear-gradient(135deg, ${PINK}, ${ROSE})`,
                          color: '#fff',
                          padding: '4px 10px',
                          borderRadius: 50,
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      >
                        -{discount}%
                      </div>
                    )}
                    {image ? (
                      <img src={image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          minHeight: 200,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: `linear-gradient(135deg, rgba(244, 114, 182, 0.08), rgba(107, 158, 123, 0.06))`,
                        }}
                      >
                        <Package size={32} color={PINK} />
                      </div>
                    )}
                  </div>

                  <div style={{ padding: '16px 16px 20px' }}>
                    {product.brand && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.15em',
                          color: SAGE,
                          display: 'block',
                          marginBottom: 6,
                        }}
                      >
                        {product.brand}
                      </span>
                    )}
                    <h3 style={{ fontWeight: 700, fontSize: 15, color: DARK, marginBottom: 4, lineHeight: 1.3 }}>
                      {product.name}
                    </h3>
                    <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={11} color={ROSE} fill={ROSE} />
                      ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div>
                        <span style={{ fontSize: 18, fontWeight: 900, color: ROSE }}>{money(product.price)}</span>
                        {product.compare_at_price && product.compare_at_price > product.price && (
                          <span style={{ fontSize: 12, color: 'rgba(45,26,30,0.35)', textDecoration: 'line-through', marginLeft: 6 }}>
                            {money(product.compare_at_price)}
                          </span>
                        )}
                      </div>
                      {page?.status === 'published' ? (
                        <Link
                          href={`/shop/${page.slug}`}
                          style={{
                            background: `linear-gradient(135deg, ${PINK}, ${ROSE})`,
                            color: '#fff',
                            padding: '8px 16px',
                            borderRadius: 50,
                            fontSize: 11,
                            fontWeight: 800,
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            boxShadow: `0 4px 12px rgba(236, 72, 153, 0.3)`,
                          }}
                        >
                          Acheter <ArrowRight size={12} />
                        </Link>
                      ) : (
                        <Link
                          href={`/products/${product.id}`}
                          style={{
                            background: `linear-gradient(135deg, ${PINK}, ${ROSE})`,
                            color: '#fff',
                            padding: '8px 16px',
                            borderRadius: 50,
                            fontSize: 11,
                            fontWeight: 800,
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            boxShadow: `0 4px 12px rgba(236, 72, 153, 0.3)`,
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
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(45,26,30,0.4)' }}>
              <Leaf size={48} color={PINK} style={{ margin: '0 auto 16px', display: 'block' }} />
              <p style={{ fontSize: 16, fontWeight: 700 }}>Aucun produit dans cette catégorie</p>
            </div>
          )}
        </div>
      </section>

      {/* Why us */}
      <section
        id="why"
        style={{
          padding: '72px 24px',
          background: `linear-gradient(135deg, ${PINK}08, ${SAGE}08)`,
          borderTop: `1px solid rgba(244, 114, 182, 0.1)`,
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.02em', color: DARK, marginBottom: 48 }}>
            Pourquoi Nous Choisir ?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 28 }}>
            {[
              { icon: <Heart size={28} color={ROSE} />, title: 'Produits Soigneusement Sélectionnés', desc: 'Chaque produit est testé et approuvé par notre équipe avant d\'être proposé.' },
              { icon: <Truck size={28} color={SAGE} />, title: 'Livraison dans 48h', desc: 'Livraison rapide avec suivi et paiement à la livraison (COD) partout en Algérie.' },
              { icon: <ShieldCheck size={28} color={ROSE} />, title: 'Achats 100% Sécurisés', desc: 'Commandez en toute confiance. Satisfaite ou remboursée sur votre premier achat.' },
              { icon: <Sparkles size={28} color={PINK} />, title: 'Emballage Premium', desc: 'Vos produits arrivent dans un emballage élégant et protecteur, idéal pour offrir.' },
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  background: '#fff',
                  borderRadius: 20,
                  padding: '32px 24px',
                  border: `1px solid rgba(244, 114, 182, 0.1)`,
                  boxShadow: '0 2px 12px rgba(244, 114, 182, 0.06)',
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: `linear-gradient(135deg, ${PINK}15, ${ROSE}10)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                  }}
                >
                  {item.icon}
                </div>
                <h3 style={{ fontWeight: 800, fontSize: 15, color: DARK, marginBottom: 10 }}>{item.title}</h3>
                <p style={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(45,26,30,0.55)' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: DARK, color: '#fff', padding: '48px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    background: `linear-gradient(135deg, ${PINK}, ${ROSE})`,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Leaf size={14} color="#fff" />
                </div>
                <span style={{ fontWeight: 800, fontSize: 16 }}>{company}</span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', maxWidth: 280, lineHeight: 1.6 }}>
                Boutique beauté & lifestyle en ligne. Livraison dans toute l&apos;Algérie.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {agency.instagram && (
                <a href={agency.instagram} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  <ExternalLink size={20} />
                </a>
              )}
              {agency.facebook && (
                <a href={agency.facebook} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  <Globe size={20} />
                </a>
              )}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 32, paddingTop: 24, textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>© {new Date().getFullYear()} {company}. Tous droits réservés.</p>
          </div>
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
            background: 'rgba(254, 249, 245, 0.95)',
            backdropFilter: 'blur(16px)',
            borderTop: `1px solid rgba(244, 114, 182, 0.15)`,
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
              background: `linear-gradient(135deg, ${PINK}, ${ROSE})`,
              color: '#fff',
              padding: '14px',
              borderRadius: 50,
              fontWeight: 800,
              fontSize: 14,
              textDecoration: 'none',
              boxShadow: `0 8px 24px rgba(236, 72, 153, 0.4)`,
            }}
          >
            <ShoppingBag size={18} /> Commander sur WhatsApp
          </a>
        </div>
      )}
    </main>
  )
}
