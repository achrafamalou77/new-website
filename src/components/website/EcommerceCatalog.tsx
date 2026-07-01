'use client'

import { useMemo, useState } from 'react'
import { Grid2X2, Search, SlidersHorizontal } from 'lucide-react'
import type { EcommerceProduct } from '@/types/ecommerce'
import type { EcommerceStorefrontConfig } from '@/lib/ecommerce-storefront'
import EcommerceStoreShell from '@/components/website/EcommerceStoreShell'
import { StoreProductCard } from '@/components/website/EcommerceStorefrontRenderer'

export default function EcommerceCatalog({
  agency,
  products,
  config,
  preview = false,
  storefrontBaseUrl = '',
}: {
  agency: { company_name: string; phone?: string | null }
  products: EcommerceProduct[]
  config: EcommerceStorefrontConfig
  preview?: boolean
  storefrontBaseUrl?: string
}) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('featured')
  const categories = useMemo(() => Array.from(new Set(products.map((product) => product.category).filter(Boolean))), [products])
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    const result = products.filter((product) =>
      (category === 'all' || product.category === category)
      && (!term || [product.name, product.brand, product.description, product.category].some((value) => String(value || '').toLowerCase().includes(term)))
    )
    return [...result].sort((a, b) => {
      if (sort === 'price-low') return a.price - b.price
      if (sort === 'price-high') return b.price - a.price
      if (sort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      return Number(b.is_featured) - Number(a.is_featured)
    })
  }, [products, query, category, sort])
  const columns = config.catalogColumns === 2 ? 'lg:grid-cols-2' : config.catalogColumns === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'

  return (
    <EcommerceStoreShell agency={agency} products={products} config={config} activePage="catalog" preview={preview} storefrontBaseUrl={storefrontBaseUrl}>
      <section className="border-b px-5 py-14 text-center lg:px-8" style={{ borderColor: `${config.textColor}12` }}>
        <p className="text-xs font-black uppercase tracking-[0.25em]" style={{ color: config.primaryColor }}>Our collection</p>
        <h1 className="mt-4 text-4xl font-black sm:text-6xl">{config.catalogTitle}</h1>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 opacity-55">{config.catalogSubtitle}</p>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <div className="grid gap-4 border-b pb-7 md:grid-cols-[1fr_auto_auto]" style={{ borderColor: `${config.textColor}15` }}>
          <label className="flex items-center gap-3 border px-4 py-3" style={{ background: config.surfaceColor, borderColor: `${config.textColor}20`, borderRadius: `${config.borderRadius}px` }}>
            <Search className="h-4 w-4 opacity-40" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the catalog..." className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
          </label>
          <label className="flex items-center gap-2 border px-4" style={{ background: config.surfaceColor, borderColor: `${config.textColor}20`, borderRadius: `${config.borderRadius}px` }}>
            <SlidersHorizontal className="h-4 w-4 opacity-40" />
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-full bg-transparent py-3 text-sm font-bold outline-none">
              <option value="all">All categories</option>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 border px-4" style={{ background: config.surfaceColor, borderColor: `${config.textColor}20`, borderRadius: `${config.borderRadius}px` }}>
            <Grid2X2 className="h-4 w-4 opacity-40" />
            <select value={sort} onChange={(event) => setSort(event.target.value)} className="h-full bg-transparent py-3 text-sm font-bold outline-none">
              <option value="featured">Featured first</option>
              <option value="newest">Newest</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
            </select>
          </label>
        </div>

        <div className="mt-6 flex items-center justify-between text-xs font-bold opacity-50">
          <p>{filtered.length} products</p>
          <p>Live stock and prices</p>
        </div>
        {filtered.length ? (
          <div className={`mt-7 grid gap-5 sm:grid-cols-2 ${columns}`}>
            {filtered.map((product) => <StoreProductCard key={product.id} product={product} config={config} preview={preview} storefrontBaseUrl={storefrontBaseUrl} />)}
          </div>
        ) : (
          <div className="mt-8 border border-dashed p-16 text-center text-sm opacity-50" style={{ borderColor: `${config.textColor}25`, borderRadius: `${config.borderRadius}px` }}>No matching products.</div>
        )}
      </section>
    </EcommerceStoreShell>
  )
}
