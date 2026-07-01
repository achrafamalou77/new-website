'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, PackageCheck, ShoppingBag, ShieldCheck } from 'lucide-react'
import { placePublicEcommerceOrder } from '@/app/actions/ecommerce'
import type { EcommerceProduct, EcommerceShippingZone } from '@/types/ecommerce'
import type { EcommerceStorefrontConfig } from '@/lib/ecommerce-storefront'
import EcommerceStoreShell, { readStoreCart, writeStoreCart } from '@/components/website/EcommerceStoreShell'

type CartLine = { id: string; name: string; price: number; image: string; quantity: number }

function money(value: number) {
  return `${Number(value || 0).toLocaleString('fr-DZ')} DZD`
}

function variants(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const entry = item as { name?: unknown; options?: unknown }
    const options = Array.isArray(entry.options)
      ? entry.options.filter((option): option is string => typeof option === 'string')
      : []
    return typeof entry.name === 'string' && options.length ? [{ name: entry.name, options }] : []
  })
}

export default function EcommerceCheckoutPage({
  agency,
  products,
  shippingZones,
  config,
}: {
  agency: { id: string; company_name: string; phone?: string | null }
  products: EcommerceProduct[]
  shippingZones: EcommerceShippingZone[]
  config: EcommerceStorefrontConfig
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [cart, setCart] = useState<CartLine[]>([])
  const [productId, setProductId] = useState(searchParams.get('product') || '')
  const [quantity, setQuantity] = useState(1)
  const [shippingId, setShippingId] = useState(shippingZones[0]?.id || '')
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({})
  const [error, setError] = useState('')

  useEffect(() => {
    const storedCart = readStoreCart()
    setCart(storedCart)
    if (!productId && storedCart[0]?.id) {
      setProductId(storedCart[0].id)
      setQuantity(storedCart[0].quantity)
    }
  }, [productId])

  const product = useMemo(
    () => products.find((item) => item.id === productId) || products[0] || null,
    [products, productId]
  )
  const variantGroups = useMemo(() => variants(product?.variants), [product?.id])

  useEffect(() => {
    setSelectedVariants(Object.fromEntries(variantGroups.map((group) => [group.name, group.options[0]])))
  }, [variantGroups])

  const shipping = shippingZones.find((zone) => zone.id === shippingId)
  const subtotal = Number(product?.price || 0) * quantity
  const shippingFee = Number(shipping?.base_fee || 0)
  const total = subtotal + shippingFee
  const radius = `${config.borderRadius}px`

  function submit(formData: FormData) {
    if (!product) return
    setError('')
    startTransition(async () => {
      const result = await placePublicEcommerceOrder({
        agencyId: agency.id,
        productId: product.id,
        landingPageId: null,
        customerName: formData.get('name'),
        customerPhone: formData.get('phone'),
        customerCity: formData.get('city'),
        customerAddress: formData.get('address'),
        quantity,
        variant: selectedVariants,
        shippingZoneId: shippingId || null,
        promotionCode: formData.get('promotionCode'),
        notes: formData.get('notes'),
        campaign: { source: 'storefront_checkout' },
      })

      if (!result.success) {
        setError(result.error)
        return
      }

      const nextCart = cart.filter((line) => line.id !== product.id)
      setCart(nextCart)
      writeStoreCart(nextCart)
      window.dispatchEvent(new CustomEvent('ecommerce-cart-change'))
      router.push(`/order/${result.order.public_token}`)
    })
  }

  return (
    <EcommerceStoreShell agency={agency} products={products} config={config} activePage="cart">
      <section className="mx-auto max-w-6xl px-5 py-14 lg:px-8 lg:py-20">
        <p className="text-xs font-black uppercase tracking-[0.25em]" style={{ color: config.primaryColor }}>Secure checkout</p>
        <h1 className="mt-4 text-4xl font-black sm:text-6xl">Confirm your order</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 opacity-55">
          Stock, shipping, promotion and totals are checked again on the server before the order is saved.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
          <form action={submit} className="space-y-5 border p-6" style={{ background: config.surfaceColor, borderColor: `${config.textColor}15`, borderRadius: radius }}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-bold">
                Product
                <select
                  value={product?.id || ''}
                  onChange={(event) => {
                    setProductId(event.target.value)
                    const selectedLine = cart.find((line) => line.id === event.target.value)
                    setQuantity(selectedLine?.quantity || 1)
                  }}
                  className="h-12 w-full border bg-transparent px-3 text-sm"
                  style={{ borderColor: `${config.textColor}18`, borderRadius: radius }}
                >
                  {products.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm font-bold">
                Quantity
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={quantity}
                  onChange={(event) => setQuantity(Math.max(1, Math.min(20, Number(event.target.value) || 1)))}
                  className="h-12 w-full border bg-transparent px-3 text-sm"
                  style={{ borderColor: `${config.textColor}18`, borderRadius: radius }}
                />
              </label>
            </div>

            {variantGroups.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                {variantGroups.map((group) => (
                  <label key={group.name} className="space-y-2 text-sm font-bold">
                    {group.name}
                    <select
                      value={selectedVariants[group.name] || ''}
                      onChange={(event) => setSelectedVariants((current) => ({ ...current, [group.name]: event.target.value }))}
                      className="h-12 w-full border bg-transparent px-3 text-sm"
                      style={{ borderColor: `${config.textColor}18`, borderRadius: radius }}
                    >
                      {group.options.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </label>
                ))}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <Field name="name" label="Full name" required config={config} />
              <Field name="phone" label="Phone" type="tel" required config={config} />
              <Field name="city" label="City / Wilaya" required config={config} />
              <Field name="promotionCode" label="Promotion code" config={config} />
            </div>

            {shippingZones.length > 0 && (
              <div>
                <p className="text-sm font-black">Shipping</p>
                <div className="mt-3 grid gap-3">
                  {shippingZones.map((zone) => (
                    <label
                      key={zone.id}
                      className="flex cursor-pointer items-center justify-between border p-4 text-sm"
                      style={{
                        borderColor: shippingId === zone.id ? config.primaryColor : `${config.textColor}18`,
                        background: shippingId === zone.id ? `${config.primaryColor}10` : 'transparent',
                        borderRadius: radius,
                      }}
                    >
                      <span>
                        <span className="block font-black">{zone.name}</span>
                        <span className="text-xs opacity-50">{zone.carrier}{zone.estimated_days ? ` · ${zone.estimated_days}` : ''}</span>
                      </span>
                      <span className="font-black">{money(zone.base_fee)}</span>
                      <input className="sr-only" type="radio" name="shippingZoneId" value={zone.id} checked={shippingId === zone.id} onChange={() => setShippingId(zone.id)} />
                    </label>
                  ))}
                </div>
              </div>
            )}

            <label className="space-y-2 text-sm font-bold">
              Address
              <textarea
                name="address"
                required
                minLength={5}
                className="min-h-28 w-full border bg-transparent p-3 text-sm"
                style={{ borderColor: `${config.textColor}18`, borderRadius: radius }}
              />
            </label>
            <Field name="notes" label="Order note" config={config} />

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {error}
              </div>
            )}

            <button
              disabled={pending || !product || product.stock_quantity < 1}
              className="flex w-full items-center justify-center gap-3 px-5 py-4 text-sm font-black text-white disabled:opacity-45"
              style={{ background: config.primaryColor, borderRadius: radius }}
            >
              {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShoppingBag className="h-5 w-5" />}
              Place order · {money(total)}
            </button>
          </form>

          <aside className="h-fit border p-6" style={{ background: config.surfaceColor, borderColor: `${config.textColor}15`, borderRadius: radius }}>
            {product ? (
              <>
                <div className="flex gap-4">
                  <div className="h-24 w-24 shrink-0 overflow-hidden bg-black/5" style={{ borderRadius: radius }}>
                    {Array.isArray(product.images) && typeof product.images[0] === 'string' && <img src={product.images[0]} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div>
                    <p className="font-black">{product.name}</p>
                    <p className="mt-2 text-xs opacity-50">{product.sku}</p>
                    <p className="mt-3 flex items-center gap-2 text-xs font-bold">
                      <PackageCheck className="h-4 w-4" style={{ color: product.stock_quantity > 0 ? '#16a34a' : '#dc2626' }} />
                      {product.stock_quantity} in stock
                    </p>
                  </div>
                </div>
                <div className="mt-6 space-y-3 border-t pt-5 text-sm" style={{ borderColor: `${config.textColor}15` }}>
                  <div className="flex justify-between"><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
                  <div className="flex justify-between"><span>Shipping</span><strong>{money(shippingFee)}</strong></div>
                  <div className="flex justify-between text-lg font-black"><span>Total before promo</span><span>{money(total)}</span></div>
                </div>
                <p className="mt-5 flex items-center gap-2 text-xs leading-5 opacity-50">
                  <ShieldCheck className="h-4 w-4" /> Promotion discounts and oversell checks are calculated by the server at submit time.
                </p>
              </>
            ) : (
              <p className="text-sm font-bold opacity-50">No active products are available for checkout.</p>
            )}
          </aside>
        </div>
      </section>
    </EcommerceStoreShell>
  )
}

function Field({
  name,
  label,
  type = 'text',
  required = false,
  config,
}: {
  name: string
  label: string
  type?: string
  required?: boolean
  config: EcommerceStorefrontConfig
}) {
  return (
    <label className="space-y-2 text-sm font-bold">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        className="h-12 w-full border bg-transparent px-3 text-sm"
        style={{ borderColor: `${config.textColor}18`, borderRadius: `${config.borderRadius}px` }}
      />
    </label>
  )
}
