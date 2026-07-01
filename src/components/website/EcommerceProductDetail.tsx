'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Check, ChevronRight, MessageCircle, PackageCheck,
  ShieldCheck, ShoppingBag, Truck,
} from 'lucide-react'
import type { EcommerceProduct, EcommerceProductPage } from '@/types/ecommerce'
import type { EcommerceStorefrontConfig } from '@/lib/ecommerce-storefront'
import EcommerceStoreShell, { addStoreCartItem } from '@/components/website/EcommerceStoreShell'

type VariantGroup = { name: string; options: string[] }

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function variants(value: unknown): VariantGroup[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const entry = item as { name?: unknown; options?: unknown }
    const options = strings(entry.options)
    return typeof entry.name === 'string' && options.length
      ? [{ name: entry.name, options }]
      : []
  })
}

function money(value: number) {
  return `${Number(value || 0).toLocaleString('fr-DZ')} DZD`
}

export default function EcommerceProductDetail({
  agency,
  product,
  landing,
  relatedProducts,
  config,
}: {
  agency: { company_name: string; phone: string | null }
  product: EcommerceProduct
  landing: EcommerceProductPage | null
  relatedProducts: EcommerceProduct[]
  config: EcommerceStorefrontConfig
}) {
  const images = strings(product.images)
  const groups = variants(product.variants)
  const [activeImage, setActiveImage] = useState(images[0] || '')
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(
    Object.fromEntries(groups.map((group) => [group.name, group.options[0]]))
  )
  const whatsapp = String(agency.phone || '').replace(/\D/g, '')
  const selectedText = useMemo(
    () => Object.entries(selectedVariants).map(([name, value]) => `${name}: ${value}`).join(', '),
    [selectedVariants]
  )
  const orderMessage = encodeURIComponent(
    `Bonjour, je veux commander: ${product.name}${selectedText ? ` (${selectedText})` : ''}`
  )
  const orderHref = landing?.status === 'published'
    ? `/shop/${landing.slug}`
    : whatsapp
      ? `https://wa.me/${whatsapp}?text=${orderMessage}`
      : '#'
  const radius = `${config.borderRadius}px`

  return (
    <EcommerceStoreShell agency={agency} products={[product, ...relatedProducts]} config={config} activePage="product">
      <main>
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-10 lg:grid-cols-[1.08fr_.92fr] lg:px-8 lg:py-16">
        <div>
          <div className="overflow-hidden border" style={{ borderColor: `${config.textColor}15`, borderRadius: radius, background: config.surfaceColor }}>
            {activeImage ? (
              <img src={activeImage} alt={product.name} className="aspect-square w-full object-cover" />
            ) : (
              <div className="grid aspect-square place-items-center opacity-30"><ShoppingBag className="h-20 w-20" /></div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-4 grid grid-cols-5 gap-3">
              {images.map((image) => (
                <button
                  key={image}
                  onClick={() => setActiveImage(image)}
                  className="overflow-hidden border-2"
                  style={{ borderColor: activeImage === image ? config.primaryColor : 'transparent', borderRadius: radius }}
                >
                  <img src={image} alt="" className="aspect-square w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white" style={{ background: config.primaryColor, borderRadius: radius }}>
              {product.category}
            </span>
            {product.brand && <span className="text-xs font-bold opacity-55">{product.brand}</span>}
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-5xl">{product.name}</h1>
          <div className="mt-5 flex flex-wrap items-end gap-3">
            <strong className="text-3xl font-black" style={{ color: config.primaryColor }}>{money(product.price)}</strong>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="pb-1 text-base font-bold line-through opacity-40">{money(product.compare_at_price)}</span>
            )}
          </div>

          <div className="mt-5 flex items-center gap-2 text-sm font-bold">
            <PackageCheck className="h-5 w-5" style={{ color: product.stock_quantity > 0 ? '#16a34a' : '#dc2626' }} />
            {product.stock_quantity > 0 ? `${product.stock_quantity} units available` : 'Currently out of stock'}
          </div>

          {product.description && (
            <p className="mt-7 whitespace-pre-line text-base leading-8 opacity-65">{product.description}</p>
          )}

          {groups.map((group) => (
            <div key={group.name} className="mt-7">
              <p className="text-xs font-black uppercase tracking-wider">{group.name}: <span style={{ color: config.primaryColor }}>{selectedVariants[group.name]}</span></p>
              <div className="mt-3 flex flex-wrap gap-2">
                {group.options.map((option) => {
                  const selected = selectedVariants[group.name] === option
                  return (
                    <button
                      key={option}
                      onClick={() => setSelectedVariants((current) => ({ ...current, [group.name]: option }))}
                      className="inline-flex items-center gap-2 border px-4 py-2.5 text-xs font-black"
                      style={{
                        borderColor: selected ? config.primaryColor : `${config.textColor}25`,
                        background: selected ? `${config.primaryColor}12` : config.surfaceColor,
                        borderRadius: radius,
                      }}
                    >
                      {selected && <Check className="h-3.5 w-3.5" />}{option}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {config.enableCart && (
              <button
                onClick={() => addStoreCartItem(product)}
                disabled={product.stock_quantity <= 0}
                className="flex w-full items-center justify-center gap-3 border px-6 py-4 text-sm font-black disabled:opacity-45"
                style={{ borderColor: config.primaryColor, color: config.primaryColor, borderRadius: radius }}
              >
                <ShoppingBag className="h-5 w-5" /> Add to cart
              </button>
            )}
            <a
              href={orderHref}
              className={`flex w-full items-center justify-center gap-3 px-6 py-4 text-sm font-black text-white ${product.stock_quantity <= 0 ? 'pointer-events-none opacity-45' : ''}`}
              style={{ background: config.primaryColor, borderRadius: radius }}
            >
              {landing?.status === 'published' ? <ShoppingBag className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
              {landing?.status === 'published' ? 'Order this product' : 'Order on WhatsApp'}
              <ChevronRight className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              [Truck, 'Delivery', 'Configured by the store'],
              [ShieldCheck, 'Confirmation', 'Before every dispatch'],
              [PackageCheck, 'Live stock', 'Updated from dashboard'],
            ].map(([Icon, title, text]) => (
              <div key={String(title)} className="border p-4" style={{ borderColor: `${config.textColor}15`, background: config.surfaceColor, borderRadius: radius }}>
                <Icon className="h-5 w-5" style={{ color: config.primaryColor }} />
                <p className="mt-3 text-xs font-black">{String(title)}</p>
                <p className="mt-1 text-[11px] leading-5 opacity-50">{String(text)}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t pt-5 text-xs opacity-45" style={{ borderColor: `${config.textColor}15` }}>
            Product reference: {product.sku}
          </div>
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className="border-t px-5 py-16 lg:px-8" style={{ borderColor: `${config.textColor}12`, background: `${config.surfaceColor}70` }}>
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: config.primaryColor }}>You may also like</p>
            <h2 className="mt-3 text-3xl font-black">Related products</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((related) => {
                const image = strings(related.images)[0]
                return (
                  <Link key={related.id} href={`/products/${related.id}`} className="group overflow-hidden border" style={{ borderColor: `${config.textColor}15`, background: config.surfaceColor, borderRadius: radius }}>
                    {image && <img src={image} alt={related.name} className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105" />}
                    <div className="p-5">
                      <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: config.primaryColor }}>{related.category}</p>
                      <h3 className="mt-2 font-black">{related.name}</h3>
                      <p className="mt-3 text-sm font-black">{money(related.price)}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}
      </main>
    </EcommerceStoreShell>
  )
}
