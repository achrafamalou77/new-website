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
  Leaf,
  Sun,
  Droplets,
  Wind,
  Star,
  ExternalLink,
  Globe,
  Heart,
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

export default function EcommerceThemeTerraEarth({ agency, products, pages }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const company = agency.company_name || 'Terra Earth'
  const whatsapp = String(agency.phone || '').replace(/\D/g, '')
  const settings = agency.website_settings || {}
  const pageByProduct = new Map(pages.map((p) => [p.product_id, p]))

  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))]
  const filtered = activeCategory === 'all' ? products : products.filter((p) => p.category === activeCategory)
  const featured = products.filter((p) => p.is_featured).slice(0, 3)

  const TERRA = '#c2560e'
  const WARM = '#d4761e'
  const BEIGE = '#f5f0e8'
  const SAND = '#e8dcc8'
  const DARK_BROWN = '#3a1e0a'
  const MID_BROWN = '#5c3417'
  const GREEN = '#4a6741'

  return (
    <main
      className="min-h-screen overflow-x-hidden"
      style={{ background: BEIGE, color: DARK_BROWN, fontFamily: '"Outfit", "Georgia", serif' }}
    >
      {/* Nature banner */}
      <div
        style={{
          background: `linear-gradient(90deg, ${GREEN}, #3d5a35, ${GREEN})`,
          color: '#fff',
          textAlign: 'center',
          padding: '9px 16px',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.04em',
        }}
      >
        🌿 Produits naturels · Livraison dans toute l&apos;Algérie · Paiement à la livraison 🌿
      </div>

      {/* Nav */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: `rgba(245, 240, 232, 0.94)`,
          backdropFilter: 'blur(16px)',
          borderBottom: `1px solid rgba(194, 86, 14, 0.12)`,
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
            height: 70,
          }}
        >
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: DARK_BROWN }}>
            <div
              style={{
                width: 40,
                height: 40,
                background: TERRA,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Leaf size={18} color="#fff" />
            </div>
            <div>
              <span style={{ display: 'block', fontWeight: 900, fontSize: 18, letterSpacing: '-0.01em', fontFamily: '"Georgia", serif' }}>
                {company}
              </span>
              <span style={{ display: 'block', fontSize: 9, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: TERRA, opacity: 0.8 }}>
                Naturel & Authentique
              </span>
            </div>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <a href="#products" style={{ fontSize: 13, fontWeight: 600, color: MID_BROWN, textDecoration: 'none', opacity: 0.75 }}>
              Boutique
            </a>
            <a href="#story" style={{ fontSize: 13, fontWeight: 600, color: MID_BROWN, textDecoration: 'none', opacity: 0.75 }}>
              Notre Histoire
            </a>
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: TERRA,
                  color: '#fff',
                  padding: '10px 24px',
                  borderRadius: 50,
                  fontSize: 12,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                Commander
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero — organic layout */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '72px 24px 60px',
        }}
      >
        {/* Organic texture */}
        <div
          style={{
            position: 'absolute',
            top: -100,
            right: -80,
            width: 500,
            height: 500,
            borderRadius: '60% 40% 70% 30% / 60% 30% 70% 40%',
            background: `rgba(194, 86, 14, 0.06)`,
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -60,
            left: -40,
            width: 350,
            height: 350,
            borderRadius: '40% 60% 30% 70% / 40% 70% 30% 60%',
            background: `rgba(74, 103, 65, 0.05)`,
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: featured.length ? '1fr 1fr' : '1fr',
              gap: 64,
              alignItems: 'center',
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: `rgba(194, 86, 14, 0.08)`,
                  border: `1px solid rgba(194, 86, 14, 0.18)`,
                  padding: '7px 16px',
                  borderRadius: 50,
                  marginBottom: 24,
                }}
              >
                <Leaf size={12} color={GREEN} />
                <span style={{ fontSize: 11, fontWeight: 700, color: TERRA, letterSpacing: '0.05em' }}>
                  100% Naturel &amp; Artisanal
                </span>
              </div>

              <h1
                style={{
                  fontSize: 'clamp(40px, 6vw, 76px)',
                  fontWeight: 900,
                  lineHeight: 1.0,
                  letterSpacing: '-0.02em',
                  color: DARK_BROWN,
                  marginBottom: 24,
                  fontFamily: '"Georgia", "Amiri", serif',
                }}
              >
                {settings.hero_title || (
                  <>
                    La Nature,{' '}
                    <span
                      style={{
                        background: `linear-gradient(135deg, ${TERRA}, ${WARM})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      Cueillie
                    </span>
                    <br />
                    pour Vous
                  </>
                )}
              </h1>

              <p
                style={{
                  fontSize: 17,
                  lineHeight: 1.75,
                  color: MID_BROWN,
                  maxWidth: 460,
                  marginBottom: 40,
                  opacity: 0.7,
                }}
              >
                {settings.hero_subtitle || `Découvrez notre collection de produits naturels, soigneusement sélectionnés pour respecter la tradition algérienne et votre bien-être.`}
              </p>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <a
                  href="#products"
                  style={{
                    background: TERRA,
                    color: '#fff',
                    padding: '15px 36px',
                    borderRadius: 50,
                    fontWeight: 700,
                    fontSize: 14,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  Découvrir <ArrowRight size={16} />
                </a>
                {whatsapp && (
                  <a
                    href={`https://wa.me/${whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      border: `2px solid rgba(194, 86, 14, 0.3)`,
                      color: TERRA,
                      padding: '15px 36px',
                      borderRadius: 50,
                      fontWeight: 600,
                      fontSize: 14,
                      textDecoration: 'none',
                    }}
                  >
                    Nous Contacter
                  </a>
                )}
              </div>

              {/* Nature badges */}
              <div style={{ display: 'flex', gap: 20, marginTop: 40, flexWrap: 'wrap' }}>
                {[
                  { icon: <Sun size={14} color={WARM} />, text: 'Ingrédients naturels' },
                  { icon: <Droplets size={14} color={GREEN} />, text: 'Sans produits chimiques' },
                  { icon: <Wind size={14} color={TERRA} />, text: 'Respect de l\'environnement' },
                ].map((badge) => (
                  <div key={badge.text} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: MID_BROWN, opacity: 0.7 }}>
                    {badge.icon}
                    {badge.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Featured products — organic shapes */}
            {featured.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 20,
                }}
              >
                {featured.map((product, i) => {
                  const image = asStringArray(product.images)[0]
                  const page = pageByProduct.get(product.id)
                  const href = page?.status === 'published' ? `/shop/${page.slug}` : `/products/${product.id}`
                  const shapes = [
                    '64px 28px 44px 28px',
                    '28px 64px 28px 44px',
                    '44px 28px 64px 28px',
                  ]
                  return (
                    <Link
                      key={product.id}
                      href={href}
                      style={{
                        gridColumn: i === 0 ? '1 / -1' : undefined,
                        position: 'relative',
                        overflow: 'hidden',
                        aspectRatio: i === 0 ? '16/8' : '4/3',
                        background: SAND,
                        borderRadius: shapes[i] || '24px',
                        boxShadow: '0 4px 24px rgba(58, 30, 10, 0.08)',
                        display: 'block',
                      }}
                    >
                      {image ? (
                        <img src={image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            minHeight: 160,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: `linear-gradient(135deg, rgba(194, 86, 14, 0.08), rgba(74, 103, 65, 0.06))`,
                          }}
                        >
                          <Leaf size={32} color={`rgba(194, 86, 14, 0.3)`} />
                        </div>
                      )}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: `linear-gradient(to top, rgba(58, 30, 10, 0.75) 0%, transparent 55%)`,
                          padding: '24px 16px 16px',
                        }}
                      >
                        <p style={{ fontWeight: 700, fontSize: 13, color: '#fff', lineHeight: 1.3 }}>{product.name}</p>
                        <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{money(product.price)}</p>
                      </div>
                    </Link>
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
          background: SAND,
          padding: '24px',
          borderTop: `1px solid rgba(194, 86, 14, 0.08)`,
          borderBottom: `1px solid rgba(194, 86, 14, 0.08)`,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            textAlign: 'center',
          }}
        >
          {[
            { value: `${products.length}+`, label: 'Produits' },
            { value: '3 200+', label: 'Clients Fidèles' },
            { value: '100%', label: 'Naturel' },
            { value: 'COD', label: 'Paiement Livraison' },
          ].map((stat, i) => (
            <div key={stat.label} style={{ padding: '16px', borderRight: i < 3 ? `1px solid rgba(194, 86, 14, 0.1)` : undefined }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: TERRA, fontFamily: '"Georgia", serif' }}>{stat.value}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: MID_BROWN, marginTop: 4, opacity: 0.6 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Products */}
      <section id="products" style={{ padding: '72px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: TERRA }}>
              🌿 Notre Collection
            </span>
            <h2
              style={{
                fontSize: 'clamp(32px, 5vw, 48px)',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                color: DARK_BROWN,
                marginTop: 8,
                fontFamily: '"Georgia", serif',
              }}
            >
              Produits du Terroir
            </h2>
          </div>

          {categories.length > 2 && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 50,
                    border: activeCategory === cat ? `2px solid ${TERRA}` : `2px solid rgba(194, 86, 14, 0.2)`,
                    background: activeCategory === cat ? TERRA : 'transparent',
                    color: activeCategory === cat ? '#fff' : TERRA,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {cat === 'all' ? '🌿 Tout' : cat}
                </button>
              ))}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 24 }}>
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
                    border: `1px solid rgba(194, 86, 14, 0.08)`,
                    boxShadow: '0 2px 16px rgba(58, 30, 10, 0.05)',
                    transition: 'transform 0.25s, box-shadow 0.25s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)'
                    e.currentTarget.style.boxShadow = '0 12px 36px rgba(58, 30, 10, 0.12)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 2px 16px rgba(58, 30, 10, 0.05)'
                  }}
                >
                  <div style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', background: SAND }}>
                    {discount > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          zIndex: 2,
                          background: TERRA,
                          color: '#fff',
                          padding: '4px 10px',
                          borderRadius: 50,
                          fontSize: 11,
                          fontWeight: 700,
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
                        }}
                      >
                        <Leaf size={36} color={`rgba(194, 86, 14, 0.25)`} />
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '16px 16px 20px' }}>
                    {product.brand && (
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: GREEN, display: 'block', marginBottom: 6 }}>
                        {product.brand}
                      </span>
                    )}
                    <h3 style={{ fontWeight: 700, fontSize: 15, color: DARK_BROWN, marginBottom: 6, lineHeight: 1.4, fontFamily: '"Georgia", serif' }}>
                      {product.name}
                    </h3>
                    <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>
                      {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={11} color={WARM} fill={WARM} />)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div>
                        <span style={{ fontSize: 18, fontWeight: 900, color: TERRA }}>{money(product.price)}</span>
                        {product.compare_at_price && product.compare_at_price > product.price && (
                          <span style={{ fontSize: 12, color: 'rgba(58, 30, 10, 0.3)', textDecoration: 'line-through', marginLeft: 6 }}>
                            {money(product.compare_at_price)}
                          </span>
                        )}
                      </div>
                      {page?.status === 'published' ? (
                        <Link
                          href={`/shop/${page.slug}`}
                          style={{
                            background: TERRA,
                            color: '#fff',
                            padding: '8px 16px',
                            borderRadius: 50,
                            fontSize: 12,
                            fontWeight: 700,
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          Acheter <ArrowRight size={12} />
                        </Link>
                      ) : (
                        <Link
                          href={`/products/${product.id}`}
                          style={{
                            background: TERRA,
                            color: '#fff',
                            padding: '8px 16px',
                            borderRadius: 50,
                            fontSize: 12,
                            fontWeight: 700,
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
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
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(58, 30, 10, 0.4)' }}>
              <Leaf size={48} color={`rgba(194, 86, 14, 0.3)`} style={{ margin: '0 auto 16px', display: 'block' }} />
              <p style={{ fontWeight: 700 }}>Aucun produit dans cette catégorie</p>
            </div>
          )}
        </div>
      </section>

      {/* Story */}
      <section id="story" style={{ padding: '72px 24px', background: SAND }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32 }}>
          {[
            { icon: <Leaf size={28} color={GREEN} />, title: 'Produits Naturels', desc: 'Sélectionnés avec soin pour préserver toutes leurs propriétés naturelles et bienfaits.' },
            { icon: <Heart size={28} color={TERRA} />, title: 'Fabrication Artisanale', desc: 'Chaque produit est préparé à la main selon les traditions algériennes ancestrales.' },
            { icon: <Truck size={28} color={MID_BROWN} />, title: 'Livraison Soignée', desc: 'Emballage écologique et livraison rapide dans toute l\'Algérie avec COD.' },
            { icon: <ShieldCheck size={28} color={TERRA} />, title: 'Qualité Certifiée', desc: 'Tous nos produits sont testés et ne contiennent aucun additif chimique nocif.' },
          ].map((item) => (
            <div key={item.title} style={{ background: '#fff', borderRadius: 20, padding: '28px 20px', border: `1px solid rgba(194, 86, 14, 0.08)` }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: `rgba(194, 86, 14, 0.08)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                {item.icon}
              </div>
              <h3 style={{ fontWeight: 800, fontSize: 16, color: DARK_BROWN, marginBottom: 8, fontFamily: '"Georgia", serif' }}>{item.title}</h3>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: MID_BROWN, opacity: 0.7 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: DARK_BROWN, color: '#fff', padding: '48px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, background: TERRA, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Leaf size={14} color="#fff" />
              </div>
              <span style={{ fontWeight: 900, fontSize: 16, fontFamily: '"Georgia", serif' }}>{company}</span>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', maxWidth: 260, lineHeight: 1.6 }}>
              Produits naturels et artisanaux algériens. Livraison COD partout en Algérie.
            </p>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', alignSelf: 'flex-end' }}>
            © {new Date().getFullYear()} {company}. Tous droits réservés.
          </p>
        </div>
      </footer>

      {/* Sticky CTA */}
      {whatsapp && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, padding: '12px 16px', background: `rgba(245, 240, 232, 0.96)`, backdropFilter: 'blur(16px)', borderTop: `1px solid rgba(194, 86, 14, 0.12)` }}>
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: TERRA,
              color: '#fff',
              padding: '14px',
              borderRadius: 50,
              fontWeight: 700,
              fontSize: 14,
              textDecoration: 'none',
            }}
          >
            <ShoppingBag size={18} /> Commander Maintenant
          </a>
        </div>
      )}
    </main>
  )
}
