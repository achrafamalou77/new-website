'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Footprints, Menu, Minus, Plus, Search, ShoppingBag, Trash2, X, Zap, ArrowRight } from 'lucide-react'
import type { EcommerceProduct } from '@/types/ecommerce'
import type { EcommerceStorefrontConfig } from '@/lib/ecommerce-storefront'

type CartLine = { id: string; name: string; price: number; image: string; quantity: number }

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function money(value: number) {
  return `${Number(value || 0).toLocaleString('fr-DZ')} DZD`
}

export function addStoreCartItem(product: EcommerceProduct) {
  if (typeof window === 'undefined') return
  const current = readStoreCart()
  const existing = current.find((line) => line.id === product.id)
  const next = existing
    ? current.map((line) => line.id === product.id ? { ...line, quantity: line.quantity + 1 } : line)
    : [...current, {
        id: product.id,
        name: product.name,
        price: product.price,
        image: strings(product.images)[0] || '',
        quantity: 1,
      }]
  writeStoreCart(next)
  window.dispatchEvent(new CustomEvent('ecommerce-cart-change'))
}

function updateStoreCartItemQuantity(id: string, quantity: number) {
  const next = readStoreCart().map((line) =>
    line.id === id ? { ...line, quantity: Math.max(1, quantity) } : line
  )
  writeStoreCart(next)
  window.dispatchEvent(new CustomEvent('ecommerce-cart-change'))
  return next
}

export function readStoreCart(): CartLine[] {
  if (typeof window === 'undefined') return []
  try {
    const value = JSON.parse(localStorage.getItem('ecommerce-store-cart') || '[]')
    if (Array.isArray(value) && value.length) return value
  } catch {}
  try {
    const entry = document.cookie.split('; ').find((item) => item.startsWith('ecommerce_store_cart='))
    const value = JSON.parse(decodeURIComponent(entry?.split('=')[1] || '[]'))
    return Array.isArray(value) ? value : []
  } catch {}
  return []
}

export function writeStoreCart(lines: CartLine[]) {
  if (typeof window === 'undefined') return
  const serialized = JSON.stringify(lines)
  try { localStorage.setItem('ecommerce-store-cart', serialized) } catch {}
  document.cookie = `ecommerce_store_cart=${encodeURIComponent(serialized)}; path=/; max-age=2592000; SameSite=Lax`
}

function fontFamily(font: EcommerceStorefrontConfig['headingFont']) {
  if (font === 'serif') return 'Georgia, Cambria, "Times New Roman", serif'
  if (font === 'display') return '"Arial Black", "Trebuchet MS", sans-serif'
  return '"Inter", "Segoe UI", sans-serif'
}

/* ── JS-driven breakpoint hook ────────────────────────────────────────────── */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return isDesktop
}

export default function EcommerceStoreShell({
  agency,
  products,
  config,
  children,
  activePage = 'home',
  preview = false,
  storefrontBaseUrl = '',
}: {
  agency: { company_name?: string; phone?: string | null }
  products: EcommerceProduct[]
  config: EcommerceStorefrontConfig
  children: React.ReactNode
  activePage?: 'home' | 'catalog' | 'contact' | 'product' | 'policy' | 'cart'
  preview?: boolean
  storefrontBaseUrl?: string
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [cart, setCart] = useState<CartLine[]>([])
  const [scrolled, setScrolled] = useState(false)
  const isDesktop = useIsDesktop()
  const company = config.storeName || agency.company_name || 'Online Store'
  const primary = config.primaryColor || '#6366f1'

  useEffect(() => {
    const update = () => setCart(readStoreCart())
    update()
    window.addEventListener('ecommerce-cart-change', update)
    window.addEventListener('storage', update)
    return () => {
      window.removeEventListener('ecommerce-cart-change', update)
      window.removeEventListener('storage', update)
    }
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (cartOpen || searchOpen || mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [cartOpen, searchOpen, mobileOpen])

  const href = (path: string) => storefrontBaseUrl
    ? `${storefrontBaseUrl.replace(/\/$/, '')}${path}`
    : path

  const searchResults = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return products.slice(0, 6)
    return products.filter((product) =>
      [product.name, product.category, product.brand, product.description]
        .some((value) => String(value || '').toLowerCase().includes(term))
    ).slice(0, 8)
  }, [products, query])

  const count = cart.reduce((sum, line) => sum + line.quantity, 0)
  const total = cart.reduce((sum, line) => sum + line.price * line.quantity, 0)

  const nav = [
    ['home', '/', 'Home'],
    ['catalog', '/catalog', 'Catalog'],
    ['cart', '/cart', 'Cart'],
    ['contact', '/contact', 'Contact'],
  ] as const

  function removeLine(id: string) {
    const next = cart.filter((line) => line.id !== id)
    writeStoreCart(next)
    setCart(next)
  }

  function changeQuantity(id: string, quantity: number) {
    setCart(updateStoreCartItemQuantity(id, quantity))
  }

  /* ── button icon styles ── */
  const iconBtn: React.CSSProperties = {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(255,255,255,0.65)',
    transition: 'all 0.2s ease',
    flexShrink: 0,
  }

  return (
    <div
      style={{
        minHeight: preview ? '100%' : '100vh',
        overflowX: 'hidden',
        background: '#050508',
        color: '#f1f5f9',
        fontFamily: '"Inter", "Segoe UI", sans-serif',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100%); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 ${primary}66; }
          50%       { box-shadow: 0 0 0 6px ${primary}00; }
        }
        .nav-link-ul {
          position: relative;
          padding-bottom: 2px;
        }
        .nav-link-ul::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0;
          width: 0; height: 2px;
          background: ${primary};
          border-radius: 2px;
          transition: width 0.25s ease;
        }
        .nav-link-ul:hover::after { width: 100%; }
        .nav-link-ul-active::after { width: 100% !important; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .icon-btn:hover { background: rgba(255,255,255,0.08) !important; color: #fff !important; }
        .footer-link:hover { color: #fff !important; }
        .cart-item-in { animation: slideInUp 0.3s ease both; }
        .cart-drawer-in { animation: slideInRight 0.35s cubic-bezier(0.16,1,0.3,1) both; }
        .search-in { animation: fadeSlideDown 0.22s ease both; }
        .mobile-in { animation: fadeSlideDown 0.18s ease both; }
      `}</style>

      {/* ── Announcement ticker ── */}
      {config.showAnnouncement && (
        <div
          style={{
            background: `linear-gradient(90deg, ${primary}1a, ${primary}33, ${primary}1a)`,
            borderBottom: `1px solid ${primary}2a`,
            height: '34px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', whiteSpace: 'nowrap', animation: 'ticker 28s linear infinite' }}>
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '20px',
                  paddingRight: '48px',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.75)',
                }}
              >
                <Zap style={{ width: 11, height: 11, color: primary, flexShrink: 0 }} />
                {config.announcement}
                <span style={{ color: primary }}>◆</span>
                Free Shipping on Orders Over 5000 DZD
                <span style={{ color: primary }}>◆</span>
                COD Available Nationwide
                <span style={{ color: primary }}>◆</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Navbar ── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50 }}>
        <nav
          style={{
            background: scrolled ? 'rgba(5,5,8,0.96)' : 'rgba(5,5,8,0.75)',
            backdropFilter: 'blur(24px)',
            borderBottom: scrolled ? '1px solid rgba(255,255,255,0.09)' : '1px solid rgba(255,255,255,0.04)',
            boxShadow: scrolled ? '0 4px 32px rgba(0,0,0,0.45)' : 'none',
            transition: 'all 0.3s ease',
          }}
        >
          <div
            style={{
              maxWidth: '80rem',
              margin: '0 auto',
              padding: '0 20px',
              height: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            {/* ── Logo ── */}
            <Link
              href={href('/')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                textDecoration: 'none',
                flexShrink: 0,
              }}
            >
              {config.logoUrl ? (
                <img
                  src={config.logoUrl}
                  alt={company}
                  style={{ height: '34px', maxWidth: '130px', objectFit: 'contain' }}
                />
              ) : (
                <>
                  <span
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: `linear-gradient(135deg, ${primary}, ${primary}cc)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: `0 4px 16px ${primary}44`,
                    }}
                  >
                    <Footprints style={{ width: 17, height: 17, color: '#fff' }} />
                  </span>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 900,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: '#fff',
                      fontFamily: fontFamily(config.headingFont),
                      maxWidth: isDesktop ? '200px' : '120px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {company}
                  </span>
                </>
              )}
            </Link>

            {/* ── Desktop nav (JS-driven visibility) ── */}
            {isDesktop && (
              <nav
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '32px',
                }}
              >
                {nav.map(([id, path, label]) => (
                  <Link
                    key={id}
                    href={href(path)}
                    className={`nav-link-ul ${activePage === id ? 'nav-link-ul-active' : ''}`}
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: activePage === id ? primary : 'rgba(255,255,255,0.7)',
                      textDecoration: 'none',
                      transition: 'color 0.2s ease',
                    }}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            )}

            {/* ── Action icons ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
              {config.enableSearch && (
                <button
                  className="icon-btn"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search"
                  style={iconBtn}
                >
                  <Search style={{ width: 17, height: 17 }} />
                </button>
              )}

              {config.enableCart && (
                <button
                  className="icon-btn"
                  onClick={() => setCartOpen(true)}
                  aria-label="Cart"
                  style={{ ...iconBtn, position: 'relative' }}
                >
                  <ShoppingBag style={{ width: 17, height: 17 }} />
                  {count > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        minWidth: '16px',
                        height: '16px',
                        borderRadius: '999px',
                        background: primary,
                        color: '#fff',
                        fontSize: '8px',
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 3px',
                        animation: 'pulse-glow 2s infinite',
                        lineHeight: 1,
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              )}

              {/* Mobile hamburger — JS-driven */}
              {!isDesktop && (
                <button
                  className="icon-btn"
                  onClick={() => setMobileOpen((v) => !v)}
                  aria-label="Menu"
                  style={{
                    ...iconBtn,
                    background: mobileOpen ? 'rgba(255,255,255,0.09)' : 'transparent',
                    color: '#fff',
                  }}
                >
                  {mobileOpen
                    ? <X style={{ width: 17, height: 17 }} />
                    : <Menu style={{ width: 17, height: 17 }} />
                  }
                </button>
              )}
            </div>
          </div>

          {/* ── Mobile menu ── */}
          {!isDesktop && mobileOpen && (
            <div
              className="mobile-in"
              style={{
                borderTop: '1px solid rgba(255,255,255,0.07)',
                background: 'rgba(5,5,8,0.98)',
                padding: '8px 20px 16px',
              }}
            >
              {nav.map(([id, path, label]) => (
                <Link
                  key={id}
                  href={href(path)}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 0',
                    fontSize: '14px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    color: activePage === id ? primary : 'rgba(255,255,255,0.82)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    letterSpacing: '0.04em',
                  }}
                >
                  {label}
                  <ArrowRight style={{ width: 13, height: 13, opacity: 0.35 }} />
                </Link>
              ))}
            </div>
          )}
        </nav>
      </header>

      {/* ── Page content ── */}
      {children}

      {/* ── Footer ── */}
      <footer
        style={{
          background: '#0a0a10',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '56px 20px 28px',
        }}
      >
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isDesktop ? '1.6fr 1fr 1fr 1fr' : '1fr',
              gap: isDesktop ? '40px' : '32px',
              marginBottom: '40px',
            }}
          >
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <span
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '9px',
                    background: `linear-gradient(135deg, ${primary}, ${primary}cc)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 4px 14px ${primary}44`,
                  }}
                >
                  <Footprints style={{ width: 15, height: 15, color: '#fff' }} />
                </span>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 900,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: '#fff',
                    fontFamily: fontFamily(config.headingFont),
                  }}
                >
                  {company}
                </span>
              </div>
              <p style={{ fontSize: '13px', lineHeight: 1.7, color: 'rgba(255,255,255,0.38)', maxWidth: '280px' }}>
                {config.footerTagline || 'Premium footwear with fast delivery across Algeria.'}
              </p>
            </div>

            {/* Shop */}
            <div>
              <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: primary, marginBottom: '18px' }}>Shop</p>
              {[['All Products', '/catalog'], ['Cart', '/cart'], ['Contact', '/contact']].map(([l, p]) => (
                <Link key={p} href={href(p)} className="footer-link" style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.42)', textDecoration: 'none', marginBottom: '10px', transition: 'color 0.2s' }}>{l}</Link>
              ))}
            </div>

            {/* Policies */}
            <div>
              <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: primary, marginBottom: '18px' }}>Policies</p>
              {[['Shipping', '/policies/shipping'], ['Returns', '/policies/returns'], ['Privacy', '/policies/privacy'], ['Terms', '/policies/terms']].map(([l, p]) => (
                <Link key={p} href={href(p)} className="footer-link" style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.42)', textDecoration: 'none', marginBottom: '10px', transition: 'color 0.2s' }}>{l}</Link>
              ))}
            </div>

            {/* Connect */}
            <div>
              <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: primary, marginBottom: '18px' }}>Connect</p>
              {config.instagramUrl && <a href={config.instagramUrl} target="_blank" rel="noopener noreferrer" className="footer-link" style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.42)', textDecoration: 'none', marginBottom: '10px', transition: 'color 0.2s' }}>Instagram</a>}
              {config.facebookUrl && <a href={config.facebookUrl} target="_blank" rel="noopener noreferrer" className="footer-link" style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.42)', textDecoration: 'none', marginBottom: '10px', transition: 'color 0.2s' }}>Facebook</a>}
              {config.contactEmail && <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.38)' }}>{config.contactEmail}</p>}
            </div>
          </div>

          <div
            style={{
              borderTop: '1px solid rgba(255,255,255,0.06)',
              paddingTop: '22px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.28)',
            }}
          >
            <p>© {new Date().getFullYear()} {company}. All rights reserved.</p>
            <p>Live stock · Cart · Search · Checkout — all connected.</p>
          </div>
        </div>
      </footer>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* SEARCH OVERLAY                                                 */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {searchOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 80,
            background: 'rgba(5,5,8,0.82)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '72px 16px 16px',
          }}
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="search-in"
            style={{
              width: '100%',
              maxWidth: '600px',
              background: '#12121c',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '18px',
              overflow: 'hidden',
              boxShadow: '0 40px 100px rgba(0,0,0,0.65)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Input */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 18px',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <Search style={{ width: 17, height: 17, color: primary, flexShrink: 0 }} />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search sneakers, brands..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '15px',
                  fontWeight: 500,
                  color: '#fff',
                  minWidth: 0,
                }}
              />
              <button
                onClick={() => setSearchOpen(false)}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.06)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255,255,255,0.5)',
                  flexShrink: 0,
                }}
              >
                <X style={{ width: 13, height: 13 }} />
              </button>
            </div>

            {/* Results */}
            <div style={{ maxHeight: '60vh', overflowY: 'auto' }} className="scrollbar-hide">
              {searchResults.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>
                  No products found
                </div>
              ) : (
                searchResults.map((product) => {
                  const img = strings(product.images)[0]
                  return (
                    <Link
                      key={product.id}
                      href={href(`/products/${product.id}`)}
                      onClick={() => setSearchOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '13px',
                        padding: '12px 18px',
                        textDecoration: 'none',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <div
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '10px',
                          background: 'rgba(255,255,255,0.05)',
                          overflow: 'hidden',
                          flexShrink: 0,
                        }}
                      >
                        {img && <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {product.name}
                        </p>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.38)', marginTop: '3px' }}>
                          {product.category || product.brand || 'Footwear'}
                        </p>
                      </div>
                      <p style={{ fontSize: '13px', fontWeight: 800, color: primary, flexShrink: 0 }}>
                        {money(product.price)}
                      </p>
                    </Link>
                  )
                })
              )}
            </div>

            <div style={{ padding: '10px 18px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.28)' }}>
              <span>{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</span>
              <span>ESC to close</span>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* CART DRAWER                                                    */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {cartOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 80,
            background: 'rgba(5,5,8,0.65)',
            backdropFilter: 'blur(8px)',
          }}
          onClick={() => setCartOpen(false)}
        >
          <aside
            className="cart-drawer-in"
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: '100%',
              maxWidth: '400px',
              background: '#0d0d18',
              borderLeft: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-24px 0 80px rgba(0,0,0,0.55)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 22px',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShoppingBag style={{ width: 17, height: 17, color: primary }} />
                  <p style={{ fontSize: '16px', fontWeight: 900, color: '#fff' }}>Your Cart</p>
                </div>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.38)', marginTop: '2px' }}>
                  {count} item{count !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '9px',
                  background: 'rgba(255,255,255,0.06)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255,255,255,0.55)',
                }}
              >
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>

            {/* Lines */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }} className="scrollbar-hide">
              {cart.length === 0 ? (
                <div
                  style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '14px',
                    color: 'rgba(255,255,255,0.25)',
                    paddingBottom: '80px',
                  }}
                >
                  <div
                    style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ShoppingBag style={{ width: 28, height: 28 }} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '15px', fontWeight: 700, marginBottom: '5px' }}>Cart is empty</p>
                    <p style={{ fontSize: '13px' }}>Add some kicks to get started</p>
                  </div>
                  <button
                    onClick={() => setCartOpen(false)}
                    style={{
                      marginTop: '8px',
                      padding: '9px 22px',
                      borderRadius: '10px',
                      background: primary,
                      border: 'none',
                      cursor: 'pointer',
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: 700,
                    }}
                  >
                    Start shopping
                  </button>
                </div>
              ) : (
                cart.map((line) => (
                  <div
                    key={line.id}
                    className="cart-item-in"
                    style={{
                      display: 'flex',
                      gap: '13px',
                      padding: '14px',
                      marginBottom: '8px',
                      borderRadius: '13px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div
                      style={{
                        width: '70px',
                        height: '70px',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.06)',
                        overflow: 'hidden',
                        flexShrink: 0,
                      }}
                    >
                      {line.image && <img src={line.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{line.name}</p>
                      <p style={{ fontSize: '13px', fontWeight: 800, color: primary, marginTop: '5px' }}>{money(line.price)}</p>
                      <div
                        style={{
                          marginTop: '9px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          borderRadius: '8px',
                          border: '1px solid rgba(255,255,255,0.1)',
                          overflow: 'hidden',
                        }}
                      >
                        <button onClick={() => changeQuantity(line.id, line.quantity - 1)} aria-label="Decrease" style={{ width: '30px', height: '30px', background: 'rgba(255,255,255,0.04)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)' }}>
                          <Minus style={{ width: 11, height: 11 }} />
                        </button>
                        <span style={{ width: '34px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, color: '#fff', background: 'rgba(255,255,255,0.06)' }}>{line.quantity}</span>
                        <button onClick={() => changeQuantity(line.id, line.quantity + 1)} aria-label="Increase" style={{ width: '30px', height: '30px', background: 'rgba(255,255,255,0.04)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)' }}>
                          <Plus style={{ width: 11, height: 11 }} />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => removeLine(line.id)}
                      aria-label="Remove"
                      style={{ alignSelf: 'flex-start', width: '30px', height: '30px', borderRadius: '8px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.22)', flexShrink: 0, transition: 'all 0.2s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.09)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.22)'; e.currentTarget.style.background = 'transparent' }}
                    >
                      <Trash2 style={{ width: 13, height: 13 }} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div
                style={{
                  padding: '18px 22px',
                  borderTop: '1px solid rgba(255,255,255,0.07)',
                  background: '#090914',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Subtotal</span>
                  <span style={{ fontSize: '20px', fontWeight: 900, color: '#fff' }}>{money(total)}</span>
                </div>
                <Link
                  href={href('/cart')}
                  onClick={() => setCartOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '15px',
                    borderRadius: '13px',
                    background: `linear-gradient(135deg, ${primary}, ${primary}cc)`,
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 800,
                    textDecoration: 'none',
                    boxShadow: `0 6px 28px ${primary}44`,
                    letterSpacing: '0.04em',
                  }}
                >
                  Checkout <ArrowRight style={{ width: 15, height: 15 }} />
                </Link>
                <p style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.28)', marginTop: '9px' }}>
                  Shipping calculated at checkout
                </p>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}
