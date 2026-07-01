'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, MessageCircle, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import type { EcommerceProduct } from '@/types/ecommerce'
import type { EcommerceStorefrontConfig } from '@/lib/ecommerce-storefront'
import EcommerceStoreShell, { readStoreCart, writeStoreCart } from '@/components/website/EcommerceStoreShell'

type CartLine = { id: string; name: string; price: number; image: string; quantity: number }

function money(value: number) {
  return `${Number(value || 0).toLocaleString('fr-DZ')} DZD`
}

export default function EcommerceCartPage({
  agency,
  products,
  config,
}: {
  agency: { company_name: string; phone?: string | null }
  products: EcommerceProduct[]
  config: EcommerceStorefrontConfig
}) {
  const [cart, setCart] = useState<CartLine[]>([])

  useEffect(() => {
    const timer = window.setTimeout(() => setCart(readStoreCart()), 0)
    return () => window.clearTimeout(timer)
  }, [])

  const total = cart.reduce((sum, line) => sum + line.price * line.quantity, 0)
  const whatsapp = String(agency.phone || '').replace(/\D/g, '')

  function update(next: CartLine[]) {
    setCart(next)
    writeStoreCart(next)
    window.dispatchEvent(new CustomEvent('ecommerce-cart-change'))
  }

  const message = encodeURIComponent(
    `Bonjour, je souhaite commander:\n${cart.map((line) => `- ${line.name} x${line.quantity} = ${money(line.price * line.quantity)}`).join('\n')}\nTotal: ${money(total)}`
  )
  const radius = `${Math.min(config.borderRadius, 16)}px`

  return (
    <EcommerceStoreShell agency={agency} products={products} config={config} activePage="cart">
      <section className="mx-auto max-w-6xl px-5 py-12 lg:px-8 lg:py-16">
        <Link href="/catalog" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider opacity-55">
          <ArrowLeft className="h-4 w-4" /> Continue shopping
        </Link>
        <p className="mt-8 text-xs font-black uppercase tracking-[0.25em]" style={{ color: config.primaryColor }}>Shopping cart</p>
        <h1 className="mt-4 text-4xl font-black tracking-normal sm:text-6xl">Review your order</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 opacity-55">Confirm quantities before checkout. The store will verify stock, delivery and final details.</p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            {cart.map((line) => (
              <div key={line.id} className="flex gap-4 border p-4 shadow-sm" style={{ background: config.surfaceColor, borderColor: `${config.textColor}15`, borderRadius: radius }}>
                <div className="h-24 w-24 shrink-0 overflow-hidden bg-black/5" style={{ borderRadius: radius }}>
                  {line.image && <img src={line.image} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-black">{line.name}</p>
                  <p className="mt-2 text-sm opacity-50">{money(line.price)}</p>
                  <div className="mt-4 inline-flex items-center overflow-hidden rounded-lg border" style={{ borderColor: `${config.textColor}18` }}>
                    <button onClick={() => update(cart.map((item) => item.id === line.id ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item))} className="grid h-9 w-9 place-items-center" aria-label="Decrease quantity">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="grid h-9 min-w-9 place-items-center px-2 text-sm font-black">{line.quantity}</span>
                    <button onClick={() => update(cart.map((item) => item.id === line.id ? { ...item, quantity: item.quantity + 1 } : item))} className="grid h-9 w-9 place-items-center" aria-label="Increase quantity">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <button onClick={() => update(cart.filter((item) => item.id !== line.id))} className="self-start rounded-lg p-2 opacity-40 hover:bg-black/5" aria-label="Remove item">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            {!cart.length && (
              <div className="border border-dashed bg-white p-16 text-center" style={{ borderColor: `${config.textColor}25`, borderRadius: radius }}>
                <ShoppingBag className="mx-auto h-10 w-10 opacity-20" />
                <p className="mt-4 text-sm font-bold opacity-50">Your cart is empty.</p>
                <Link href="/catalog" className="mt-6 inline-flex px-5 py-3 text-sm font-black text-white" style={{ background: config.primaryColor, borderRadius: `${config.borderRadius}px` }}>
                  Shop products
                </Link>
              </div>
            )}
          </div>

          <aside className="h-fit border p-6 shadow-sm" style={{ background: config.surfaceColor, borderColor: `${config.textColor}15`, borderRadius: radius }}>
            <p className="text-lg font-black">Order summary</p>
            <div className="mt-5 space-y-3 border-t pt-5 text-sm" style={{ borderColor: `${config.textColor}15` }}>
              {cart.map((line) => (
                <div key={line.id} className="flex justify-between gap-4 opacity-60">
                  <span>{line.name} x {line.quantity}</span>
                  <span>{money(line.price * line.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 flex justify-between border-t pt-5 text-lg font-black" style={{ borderColor: `${config.textColor}15` }}>
              <span>Total</span><span>{money(total)}</span>
            </div>
            {cart.length > 0 && (
              <Link href="/commande" className="mt-6 flex items-center justify-center gap-2 px-5 py-4 text-sm font-black text-white" style={{ background: config.primaryColor, borderRadius: `${config.borderRadius}px` }}>
                <ShoppingBag className="h-5 w-5" /> Checkout
              </Link>
            )}
            {whatsapp && cart.length > 0 && (
              <a href={`https://wa.me/${whatsapp}?text=${message}`} className="mt-3 flex items-center justify-center gap-2 border px-5 py-4 text-sm font-black" style={{ borderColor: `${config.textColor}18`, borderRadius: `${config.borderRadius}px` }}>
                <MessageCircle className="h-5 w-5" /> Send order on WhatsApp
              </a>
            )}
            <p className="mt-4 text-xs leading-5 opacity-45">The store will confirm stock, delivery and final order details.</p>
          </aside>
        </div>
      </section>
    </EcommerceStoreShell>
  )
}
