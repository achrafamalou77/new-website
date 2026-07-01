'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  BarChart3,
  Boxes,
  CheckCircle2,
  Clipboard,
  ExternalLink,
  Eye,
  Globe2,
  Loader2,
  Package,
  Palette,
  Pencil,
  Plus,
  ReceiptText,
  Search,
  ShoppingBag,
  Sparkles,
  Tags,
  Trash2,
  Truck,
  UserRoundSearch,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  adjustEcommerceStock,
  deleteEcommerceProduct,
  deleteEcommercePromotion,
  deleteEcommerceShippingZone,
  saveEcommerceProduct,
  saveEcommercePromotion,
  saveEcommerceShippingZone,
  updateEcommerceStoreTheme,
  updateEcommerceOrder,
  uploadEcommerceImage,
} from '@/app/actions/ecommerce'
import type {
  EcommerceOrder,
  EcommerceProduct,
  EcommercePromotion,
  EcommerceShippingZone,
  EcommerceStoreData,
  EcommerceStoreView,
  LandingPageInput,
  ProductInput,
} from '@/types/ecommerce'
import EcommerceLandingStudio from './EcommerceLandingStudio'
import EcommerceInsights from './EcommerceInsights'
import StoreThemeSelector from './StoreThemeSelector'
import ProductImporter from './ProductImporter'

const emptyProduct: ProductInput = {
  sku: '',
  name: '',
  description: '',
  category: 'general',
  brand: '',
  price: 0,
  compare_at_price: null,
  cost_price: null,
  stock_quantity: 0,
  low_stock_threshold: 5,
  variants: [],
  images: [],
  channels: ['website'],
  status: 'active',
  is_featured: false,
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function formatMoney(value: number) {
  return `${new Intl.NumberFormat('fr-DZ').format(Number(value || 0))} DZD`
}

function orderItems(order: EcommerceOrder) {
  return Array.isArray(order.items) ? order.items as Array<Record<string, unknown>> : []
}

function buildLandingUrl(data: EcommerceStoreData, slug: string) {
  if (data.agency.custom_domain) {
    return `https://${data.agency.custom_domain.replace(/^https?:\/\//, '').replace(/\/+$/, '')}/shop/${slug}`
  }
  if (typeof window === 'undefined') return `/shop/${slug}`
  const { protocol, hostname, port } = window.location
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.lvh.me')) {
    return `${protocol}//${data.agency.subdomain}.lvh.me${port ? `:${port}` : ''}/shop/${slug}`
  }
  const parts = hostname.split('.')
  const rootDomain = parts.length > 2 ? parts.slice(-2).join('.') : hostname
  return `${protocol}//${data.agency.subdomain}.${rootDomain}/shop/${slug}`
}

export default function EcommerceStoreClient({
  view,
  initialData,
}: {
  view: EcommerceStoreView
  initialData: EcommerceStoreData
}) {
  const router = useRouter()
  const [data, setData] = useState(initialData)
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [productOpen, setProductOpen] = useState(false)
  const [landingOpen, setLandingOpen] = useState(false)
  const [shippingOpen, setShippingOpen] = useState(false)
  const [promotionOpen, setPromotionOpen] = useState(false)
  const [productForm, setProductForm] = useState<ProductInput>(emptyProduct)
  const [landingProduct, setLandingProduct] = useState<EcommerceProduct | null>(null)
  const [shippingForm, setShippingForm] = useState<Partial<EcommerceShippingZone>>({})
  const [promotionForm, setPromotionForm] = useState<Partial<EcommercePromotion>>({})
  const [activeStoreTab, setActiveStoreTab] = useState<string>(view)

  useEffect(() => setData(initialData), [initialData])
  useEffect(() => setActiveStoreTab(view), [view])

  const visibleProducts = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return data.products
    return data.products.filter((product) =>
      `${product.name} ${product.category} ${product.sku} ${product.brand || ''}`
        .toLowerCase()
        .includes(term)
    )
  }, [data.products, query])

  function run(task: () => Promise<any>, successText: string, after?: (result: any) => void) {
    setNotice(null)
    startTransition(async () => {
      const result = await task()
      if (!result?.success) {
        setNotice({ tone: 'error', text: result?.error || 'Operation failed' })
        return
      }
      after?.(result)
      setNotice({ tone: 'success', text: successText })
      router.refresh()
    })
  }

  function openProduct(product?: EcommerceProduct) {
    setProductForm(product ? {
      id: product.id,
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      category: product.category,
      brand: product.brand || '',
      price: product.price,
      compare_at_price: product.compare_at_price,
      cost_price: product.cost_price,
      stock_quantity: product.stock_quantity,
      low_stock_threshold: product.low_stock_threshold,
      variants: product.variants,
      images: toStringArray(product.images),
      channels: toStringArray(product.channels),
      status: product.status,
      is_featured: product.is_featured,
    } : { ...emptyProduct })
    setProductOpen(true)
  }

  function openLanding(product: EcommerceProduct) {
    setLandingProduct(product)
    setLandingOpen(true)
  }

  function updateLandingPage(productId: string, landingPage: EcommerceProduct['landing_page']) {
    setLandingProduct((current) =>
      current?.id === productId ? { ...current, landing_page: landingPage } : current
    )
    setData((current) => ({
      ...current,
      products: current.products.map((product) =>
        product.id === productId ? { ...product, landing_page: landingPage } : product
      ),
    }))
  }

  const storeNavTabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'customers', label: 'Customers', icon: UserRoundSearch },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'orders', label: 'Orders', icon: ReceiptText },
    { id: 'inventory', label: 'Inventory', icon: Boxes },
    { id: 'shipping', label: 'Shipping', icon: Truck },
    { id: 'promotions', label: 'Promotions', icon: Tags },
    { id: 'themes', label: 'Themes', icon: Palette },
    { id: 'import', label: '⚡ Importer', icon: Sparkles },
  ] as const

  return (
    <div className="flex-1 overflow-y-auto bg-[#f4f5f7]">
      <div className="mx-auto max-w-7xl space-y-5 p-4 lg:p-6">

        {/* Premium Header Banner */}
        <div className="bg-white border border-[#e8eaed] rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/40 via-transparent to-indigo-50/30 pointer-events-none rounded-2xl" />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-600/25 shrink-0">
                <ShoppingBag className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] uppercase tracking-widest font-extrabold text-purple-600">Online Store</span>
                  <Badge className="text-[9px] font-bold bg-purple-100 text-purple-700 hover:bg-purple-100 border-none px-1.5 py-0.5 rounded-md">{data.agency.company_name}</Badge>
                </div>
                <h1 className="text-[20px] font-black tracking-tight text-gray-900">Store Command Center</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(activeStoreTab === 'overview' || activeStoreTab === 'products') && (
                <Button onClick={() => openProduct()} className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl h-9 px-4 text-xs font-bold shadow-sm">
                  <Plus className="mr-1.5 h-4 w-4" /> Add Product
                </Button>
              )}
              {activeStoreTab === 'shipping' && (
                <Button onClick={() => { setShippingForm({ cod_enabled: true, is_active: true, base_fee: 0 }); setShippingOpen(true) }} className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl h-9 px-4 text-xs font-bold shadow-sm">
                  <Plus className="mr-1.5 h-4 w-4" /> Add Zone
                </Button>
              )}
              {activeStoreTab === 'promotions' && (
                <Button onClick={() => { setPromotionForm({ discount_type: 'percentage', discount_value: 10, status: 'draft' }); setPromotionOpen(true) }} className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl h-9 px-4 text-xs font-bold shadow-sm">
                  <Plus className="mr-1.5 h-4 w-4" /> Add Promo
                </Button>
              )}
            </div>
          </div>

          {/* Internal Tab Navigation */}
          <div className="relative mt-4 flex gap-0.5 border-b border-[#f0f1f3] overflow-x-auto -mx-0 pb-0">
            {storeNavTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveStoreTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all duration-150 whitespace-nowrap ${
                  activeStoreTab === tab.id
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
                {tab.id === 'orders' && data.orders.filter(o => o.fulfillment_status === 'new').length > 0 && (
                  <span className="h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                    {data.orders.filter(o => o.fulfillment_status === 'new').length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {notice && (
          <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${notice.tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
            {notice.text}
          </div>
        )}

        <Stats data={data} />

        {activeStoreTab === 'overview' && (
          <Overview data={data} openProduct={openProduct} openLanding={openLanding} />
        )}
        {activeStoreTab === 'analytics' && (
          <EcommerceInsights mode="analytics" data={data} />
        )}
        {activeStoreTab === 'customers' && (
          <EcommerceInsights mode="customers" data={data} />
        )}
        {activeStoreTab === 'products' && (
          <Products
            products={visibleProducts}
            query={query}
            setQuery={setQuery}
            openProduct={openProduct}
            openLanding={openLanding}
            onDelete={(id) => {
              if (window.confirm('Delete this product and its landing page?')) {
                run(() => deleteEcommerceProduct(id), 'Product deleted')
              }
            }}
          />
        )}
        {activeStoreTab === 'inventory' && (
          <Inventory
            products={visibleProducts}
            query={query}
            setQuery={setQuery}
            pending={isPending}
            onSave={(productId, stock) =>
              run(() => adjustEcommerceStock(productId, stock), 'Stock updated')
            }
          />
        )}
        {activeStoreTab === 'orders' && (
          <Orders
            orders={data.orders}
            pending={isPending}
            onUpdate={(id, updates) =>
              run(() => updateEcommerceOrder(id, updates), 'Order updated')
            }
          />
        )}
        {activeStoreTab === 'shipping' && (
          <Shipping
            zones={data.shippingZones}
            onEdit={(zone) => { setShippingForm(zone); setShippingOpen(true) }}
            onDelete={(id) => {
              if (window.confirm('Delete this shipping zone?')) {
                run(() => deleteEcommerceShippingZone(id), 'Shipping zone deleted')
              }
            }}
          />
        )}
        {activeStoreTab === 'promotions' && (
          <Promotions
            promotions={data.promotions}
            onEdit={(promotion) => { setPromotionForm(promotion); setPromotionOpen(true) }}
            onDelete={(id) => {
              if (window.confirm('Delete this promotion?')) {
                run(() => deleteEcommercePromotion(id), 'Promotion deleted')
              }
            }}
          />
        )}
        {activeStoreTab === 'themes' && (
          <div className="bg-white border border-[#e8eaed] rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
            <StoreThemeSelector
              currentThemeId={data.agency.website_settings?.store_theme || 'sole-district'}
              onApply={(theme) => {
                run(() => updateEcommerceStoreTheme(theme.id), `Theme "${theme.name}" applied to your store`)
              }}
            />
          </div>
        )}
        {activeStoreTab === 'import' && (
          <ProductImporter products={data.products} orders={data.orders} />
        )}
      </div>

      <ProductDialog
        open={productOpen}
        setOpen={setProductOpen}
        form={productForm}
        setForm={setProductForm}
        pending={isPending}
        onSubmit={() =>
          run(
            () => saveEcommerceProduct(productForm),
            productForm.id ? 'Product updated' : 'Product created',
            () => setProductOpen(false)
          )
        }
        onUpload={(file) =>
          run(
            async () => {
              const formData = new FormData()
              formData.set('file', file)
              return uploadEcommerceImage(formData)
            },
            'Image uploaded',
            (result) => setProductForm((current) => ({
              ...current,
              images: [...(current.images || []), result.url],
            }))
          )
        }
      />

      <EcommerceLandingStudio
        open={landingOpen}
        setOpen={setLandingOpen}
        product={landingProduct}
        data={data}
        onChanged={(landingPage) => {
          if (!landingProduct) return
          updateLandingPage(landingProduct.id, landingPage)
          router.refresh()
        }}
      />

      <ShippingDialog
        open={shippingOpen}
        setOpen={setShippingOpen}
        form={shippingForm}
        setForm={setShippingForm}
        pending={isPending}
        onSubmit={() => run(
          () => saveEcommerceShippingZone({
            ...shippingForm,
            wilayas: typeof shippingForm.wilayas === 'string'
              ? String(shippingForm.wilayas).split(',').map((value) => value.trim()).filter(Boolean)
              : shippingForm.wilayas || [],
          }),
          shippingForm.id ? 'Shipping zone updated' : 'Shipping zone created',
          () => setShippingOpen(false)
        )}
      />

      <PromotionDialog
        open={promotionOpen}
        setOpen={setPromotionOpen}
        form={promotionForm}
        setForm={setPromotionForm}
        pending={isPending}
        onSubmit={() => run(
          () => saveEcommercePromotion(promotionForm),
          promotionForm.id ? 'Promotion updated' : 'Promotion created',
          () => setPromotionOpen(false)
        )}
      />
    </div>
  )
}

function Stats({ data }: { data: EcommerceStoreData }) {
  const stats = [
    { label: 'Revenue', value: formatMoney(data.stats.revenue), icon: BarChart3, tone: 'bg-emerald-50 text-emerald-600' },
    { label: 'Open orders', value: String(data.stats.openOrders), icon: ReceiptText, tone: 'bg-blue-50 text-blue-600' },
    { label: 'Products online', value: String(data.stats.productsOnline), icon: Package, tone: 'bg-purple-50 text-purple-600' },
    { label: 'Low stock', value: String(data.stats.lowStock), icon: Boxes, tone: 'bg-red-50 text-red-600' },
  ]
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-white border border-[#e8eaed] rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200">
          <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${stat.tone}`}>
            <stat.icon className="h-5 w-5" />
          </div>
          <div className="text-[26px] font-black text-gray-900 leading-none tracking-tight">{stat.value}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mt-1.5">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}

function Overview({
  data,
  openProduct,
  openLanding,
}: {
  data: EcommerceStoreData
  openProduct: (product?: EcommerceProduct) => void
  openLanding: (product: EcommerceProduct) => void
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
      <div className="bg-white border border-[#e8eaed] rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#f0f1f3] flex items-center justify-between">
          <div>
            <h2 className="text-[13px] font-bold text-gray-900">Recent orders</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">Newest customer activity.</p>
          </div>
          <Badge variant="outline" className="text-[10px] font-semibold border-[#e5e7eb]">{data.orders.length} total</Badge>
        </div>
        <div className="p-3 space-y-1.5">
          {data.orders.slice(0, 6).map((order) => (
            <div key={order.id} className="flex items-center justify-between rounded-xl bg-[#f9fafb] hover:bg-[#f4f5f7] px-4 py-3 transition-colors">
              <div>
                <div className="text-[12.5px] font-semibold text-gray-800">{order.order_number} · {order.customer_name}</div>
                <div className="text-[10.5px] text-gray-500 mt-0.5">{order.customer_city || 'No city'} · {order.fulfillment_status}</div>
              </div>
              <div className="text-[12.5px] font-black text-gray-900">{formatMoney(order.total)}</div>
            </div>
          ))}
          {!data.orders.length && <Empty text="Orders from landing pages and the storefront will appear here." />}
        </div>
      </div>
      <div className="bg-white border border-[#e8eaed] rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#f0f1f3]">
          <h2 className="text-[13px] font-bold text-gray-900">Campaign pages</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">{data.stats.landingViews} views · {data.stats.landingConversions} conversions</p>
        </div>
        <div className="p-3 space-y-1.5">
          {data.products.slice(0, 5).map((product) => (
            <button key={product.id} onClick={() => openLanding(product)} className="flex w-full items-center justify-between rounded-xl border border-[#f0f1f3] hover:border-purple-200 hover:bg-purple-50/40 px-4 py-3 text-left transition-all">
              <div>
                <div className="text-[12.5px] font-semibold text-gray-800">{product.name}</div>
                <div className="text-[10.5px] text-gray-500 mt-0.5 capitalize">{product.landing_page?.status || 'No landing page'}</div>
              </div>
              <Sparkles className="h-3.5 w-3.5 text-purple-600" />
            </button>
          ))}
          {!data.products.length && <Button onClick={() => openProduct()} className="w-full">Create the first product</Button>}
        </div>
      </div>
    </div>
  )
}

function Products({
  products,
  query,
  setQuery,
  openProduct,
  openLanding,
  onDelete,
}: {
  products: EcommerceProduct[]
  query: string
  setQuery: (value: string) => void
  openProduct: (product?: EcommerceProduct) => void
  openLanding: (product: EcommerceProduct) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="bg-white border border-[#e8eaed] rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-[#f0f1f3] p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-[13px] font-bold text-gray-900">Live catalog</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">Products, media, channels and campaign pages.</p>
        </div>
        <SearchInput query={query} setQuery={setQuery} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-sm">
          <thead className="bg-[#f9fafb] text-left">
            <tr className="border-b border-[#f0f1f3]"><th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">Product</th><th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">Stock</th><th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">Price</th><th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">Status</th><th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">Landing page</th><th className="py-3 px-4 text-right text-[10px] font-bold uppercase tracking-wider text-gray-500">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 overflow-hidden rounded-xl bg-slate-100">
                      {toStringArray(product.images)[0] && <img src={toStringArray(product.images)[0]} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div><div className="font-bold">{product.name}</div><div className="text-xs text-slate-400">{product.sku} · {product.category}</div></div>
                  </div>
                </td>
                <td className="p-4 font-bold">{product.stock_quantity}</td>
                <td className="p-4 font-black">{formatMoney(product.price)}</td>
                <td className="p-4"><StatusBadge value={product.status} /></td>
                <td className="p-4">
                  <button onClick={() => openLanding(product)} className="flex items-center gap-2 text-left">
                    <StatusBadge value={product.landing_page?.status || 'not created'} />
                    {product.landing_page && <span className="text-xs text-slate-400">{product.landing_page.views} views</span>}
                  </button>
                </td>
                <td className="p-4">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => openLanding(product)}><Sparkles className="h-4 w-4" /> Landing</Button>
                    <Button size="icon-sm" variant="outline" onClick={() => openProduct(product)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon-sm" variant="outline" onClick={() => onDelete(product.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!products.length && <Empty text="No products match this catalog." />}
      </div>
    </div>
  )
}

function Inventory({
  products,
  query,
  setQuery,
  pending,
  onSave,
}: {
  products: EcommerceProduct[]
  query: string
  setQuery: (value: string) => void
  pending: boolean
  onSave: (productId: string, stock: number) => void
}) {
  return (
    <div className="bg-white border border-[#e8eaed] rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-[#f0f1f3] p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-[13px] font-bold text-gray-900">Stock control</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">Set exact available quantities after receipts or audits.</p>
        </div>
        <SearchInput query={query} setQuery={setQuery} />
      </div>
      <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => <StockCard key={product.id} product={product} pending={pending} onSave={onSave} />)}
      </div>
      {!products.length && <Empty text="No inventory records found." />}
    </div>
  )
}

function StockCard({ product, pending, onSave }: { product: EcommerceProduct; pending: boolean; onSave: (id: string, stock: number) => void }) {
  const [stock, setStock] = useState(product.stock_quantity)
  useEffect(() => setStock(product.stock_quantity), [product.stock_quantity])
  const low = stock <= product.low_stock_threshold
  return (
    <div className={`rounded-2xl border p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)] ${low ? 'border-red-200 bg-red-50/40' : 'border-[#e8eaed] bg-white'}`}>
      <div className="mb-4 flex items-start justify-between">
        <div><div className="font-black">{product.name}</div><div className="text-xs text-slate-500">{product.sku}</div></div>
        {low && <Badge className="bg-red-100 text-red-700">Low stock</Badge>}
      </div>
      <div className="flex items-center gap-2">
        <Input type="number" min={0} value={stock} onChange={(event) => setStock(Number(event.target.value))} />
        <Button disabled={pending || stock === product.stock_quantity} onClick={() => onSave(product.id, stock)}>Save</Button>
      </div>
      <div className="mt-3 text-xs text-slate-500">Alert threshold: {product.low_stock_threshold}</div>
    </div>
  )
}

const ORDER_PIPELINE = ['new', 'confirmed', 'packed', 'shipped', 'delivered'] as const
const ORDER_STATUS_LABELS: Record<string, string> = {
  new: 'pending',
  confirmed: 'confirmed',
  packed: 'processing',
  shipped: 'shipped',
  delivered: 'delivered',
  returned: 'refunded',
  cancelled: 'cancelled',
}

function orderStatusLabel(value: string) {
  return ORDER_STATUS_LABELS[value] || value
}

function Orders({
  orders,
  pending,
  onUpdate,
}: {
  orders: EcommerceOrder[]
  pending: boolean
  onUpdate: (id: string, updates: { fulfillment_status?: string; payment_status?: string }) => void
}) {
  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const pipelineIndex = ORDER_PIPELINE.indexOf(order.fulfillment_status as any)
        const isCancelled = order.fulfillment_status === 'cancelled' || order.fulfillment_status === 'returned'
        const progressIndex = Math.max(0, pipelineIndex)
        return (
          <div key={order.id} className="bg-white border border-[#e8eaed] rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
            {/* Order header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-5 py-4 border-b border-[#f0f1f3]">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                  <ShoppingBag className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-black text-gray-900">{order.order_number}</span>
                    <StatusBadge value={order.payment_status} />
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{order.customer_name} · {order.customer_phone} · {order.customer_city || 'No city'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-[20px] font-black text-gray-900">{formatMoney(order.total)}</div>
                <select
                  disabled={pending}
                  value={order.payment_status}
                  onChange={(e) => onUpdate(order.id, { payment_status: e.target.value })}
                  className="h-8 rounded-lg border border-[#e8eaed] bg-white px-2 text-xs font-semibold text-gray-700"
                >
                  {['pending', 'paid', 'failed', 'refunded'].map((v) => <option key={v}>{v}</option>)}
                </select>
              </div>
            </div>

            {/* Fulfillment pipeline */}
            {!isCancelled ? (
              <div className="px-5 py-4">
                <div className="flex items-center justify-between relative">
                  {/* Progress line */}
                  <div className="absolute left-0 right-0 top-[14px] h-0.5 bg-[#f0f1f3] mx-7" />
                  <div
                    className="absolute left-7 top-[14px] h-0.5 bg-purple-500 transition-all duration-500"
                    style={{ right: `${(ORDER_PIPELINE.length - 1 - progressIndex) * (100 / (ORDER_PIPELINE.length - 1))}%` }}
                  />
                  {ORDER_PIPELINE.map((step, i) => {
                    const done = progressIndex >= i
                    return (
                      <button
                        key={step}
                        disabled={pending}
                        onClick={() => onUpdate(order.id, { fulfillment_status: step })}
                        className="flex flex-col items-center gap-1 relative z-10 transition-all duration-200"
                        title={`Mark as ${orderStatusLabel(step)}`}
                      >
                        <div className={`h-7 w-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                          done
                            ? 'bg-purple-600 border-purple-600 shadow-md shadow-purple-600/30'
                            : 'bg-white border-[#e8eaed]'
                        }`}>
                          {done && <div className="h-2 w-2 rounded-full bg-white" />}
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-wide whitespace-nowrap ${
                          done ? 'text-purple-700' : 'text-gray-400'
                        }`}>{orderStatusLabel(step)}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="px-5 py-3 bg-red-50/50">
                <StatusBadge value={order.fulfillment_status} />
                <span className="ml-2 text-xs text-gray-500">This order has been {orderStatusLabel(order.fulfillment_status)}.</span>
                <button
                  onClick={() => onUpdate(order.id, { fulfillment_status: 'new' })}
                  className="ml-3 text-xs font-semibold text-blue-600 hover:underline"
                >
                  Restore
                </button>
              </div>
            )}

            {/* Items + cancel */}
            {orderItems(order).length > 0 && (
              <div className="px-5 pb-4 flex items-center justify-between">
                <div className="text-[11px] text-gray-500">
                  {orderItems(order).map((item) => `${item.name} × ${item.quantity}`).join(', ')}
                </div>
                {!isCancelled && (
                  <button
                    onClick={() => onUpdate(order.id, { fulfillment_status: 'cancelled' })}
                    className="text-[10px] font-bold text-red-500 hover:text-red-700 transition"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}
      {!orders.length && <Empty text="No orders yet. Publish a product landing page and send traffic to it." />}
    </div>
  )
}

function Shipping({ zones, onEdit, onDelete }: { zones: EcommerceShippingZone[]; onEdit: (zone: EcommerceShippingZone) => void; onDelete: (id: string) => void }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {zones.map((zone) => (
        <div key={zone.id} className="bg-white border border-[#e8eaed] rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200">
          <div className="mb-4 flex items-center justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-600"><Truck className="h-5 w-5" /></div><StatusBadge value={zone.is_active ? 'active' : 'inactive'} /></div>
          <h3 className="font-black">{zone.name}</h3>
          <p className="text-sm text-slate-500">{zone.carrier} · {zone.estimated_days || 'No delivery estimate'}</p>
          <p className="mt-3 text-sm font-bold">{formatMoney(zone.base_fee)} · {zone.cod_enabled ? 'COD enabled' : 'Prepaid only'}</p>
          <p className="mt-2 text-xs text-slate-400">{toStringArray(zone.wilayas).join(', ') || 'All configured locations'}</p>
          <div className="mt-5 flex gap-2"><Button variant="outline" size="sm" onClick={() => onEdit(zone)}><Pencil className="h-4 w-4" /> Edit</Button><Button variant="outline" size="sm" onClick={() => onDelete(zone.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button></div>
        </div>
      ))}
      {!zones.length && <Empty text="Add a delivery zone so checkout can calculate shipping." />}
    </div>
  )
}

function Promotions({ promotions, onEdit, onDelete }: { promotions: EcommercePromotion[]; onEdit: (promotion: EcommercePromotion) => void; onDelete: (id: string) => void }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {promotions.map((promotion) => (
        <div key={promotion.id} className="bg-white border border-[#e8eaed] rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200">
          <div className="mb-4 flex items-center justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"><Tags className="h-5 w-5" /></div><StatusBadge value={promotion.status} /></div>
          <h3 className="font-black">{promotion.name}</h3>
          <p className="mt-1 font-mono text-sm font-bold text-purple-700">{promotion.code}</p>
          <p className="mt-3 text-sm text-slate-500">{promotion.discount_type === 'free_shipping' ? 'Free shipping' : `${promotion.discount_value}${promotion.discount_type === 'percentage' ? '%' : ' DZD'} off`}</p>
          <div className="mt-5 flex gap-2"><Button variant="outline" size="sm" onClick={() => onEdit(promotion)}><Pencil className="h-4 w-4" /> Edit</Button><Button variant="outline" size="sm" onClick={() => onDelete(promotion.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button></div>
        </div>
      ))}
      {!promotions.length && <Empty text="Create a promotion code for an ad campaign." />}
    </div>
  )
}

function ProductDialog({
  open,
  setOpen,
  form,
  setForm,
  pending,
  onSubmit,
  onUpload,
}: {
  open: boolean
  setOpen: (value: boolean) => void
  form: ProductInput
  setForm: React.Dispatch<React.SetStateAction<ProductInput>>
  pending: boolean
  onSubmit: () => void
  onUpload: (file: File) => void
}) {
  const images = form.images || []
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader><DialogTitle>{form.id ? 'Edit product' : 'Create product'}</DialogTitle><DialogDescription>Catalog data is reused by the storefront, checkout and AI landing page.</DialogDescription></DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Product name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="SKU"><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></Field>
          <Field label="Category"><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
          <Field label="Brand"><Input value={form.brand || ''} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></Field>
          <Field label="Price (DZD)"><Input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></Field>
          <Field label="Compare-at price"><Input type="number" min={0} value={form.compare_at_price || ''} onChange={(e) => setForm({ ...form, compare_at_price: e.target.value ? Number(e.target.value) : null })} /></Field>
          <Field label="Cost price"><Input type="number" min={0} value={form.cost_price || ''} onChange={(e) => setForm({ ...form, cost_price: e.target.value ? Number(e.target.value) : null })} /></Field>
          <Field label="Stock"><Input type="number" min={0} value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: Number(e.target.value) })} /></Field>
          <Field label="Low-stock threshold"><Input type="number" min={0} value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: Number(e.target.value) })} /></Field>
          <Field label="Status"><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ProductInput['status'] })} className="h-9 w-full rounded-lg border px-3 text-sm"><option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option></select></Field>
          <div className="md:col-span-2"><Field label="Description"><Textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field></div>
          <div className="md:col-span-2">
            <Field label="Product images">
              <Input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => event.target.files?.[0] && onUpload(event.target.files[0])} />
              <div className="mt-3 flex flex-wrap gap-3">
                {images.map((image) => <div key={image} className="relative h-20 w-20 overflow-hidden rounded-xl border"><img src={image} alt="" className="h-full w-full object-cover" /><button onClick={() => setForm({ ...form, images: images.filter((item) => item !== image) })} className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white"><Trash2 className="h-3 w-3" /></button></div>)}
              </div>
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} /> Featured product</label>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={pending} onClick={onSubmit}>{pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save product</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function LandingDialog({
  open,
  setOpen,
  product,
  data,
  pending,
  onGenerate,
  onSave,
  onStatus,
}: {
  open: boolean
  setOpen: (value: boolean) => void
  product: EcommerceProduct | null
  data: EcommerceStoreData
  pending: boolean
  onGenerate: () => void
  onSave: (input: LandingPageInput) => void
  onStatus: (status: 'draft' | 'published' | 'archived') => void
}) {
  const page = product?.landing_page
  const [form, setForm] = useState<LandingPageInput | null>(null)
  useEffect(() => {
    if (!product) return
    setForm({
      product_id: product.id,
      slug: page?.slug || `${product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${product.id.slice(0, 6)}`,
      headline: page?.headline || product.name,
      subheadline: page?.subheadline || product.description || `Commandez ${product.name} avec livraison.`,
      description: page?.description || product.description || product.name,
      benefits: toStringArray(page?.benefits),
      faq: Array.isArray(page?.faq) ? page.faq as LandingPageInput['faq'] : [],
      social_proof: Array.isArray(page?.social_proof) ? page.social_proof as LandingPageInput['social_proof'] : [],
      urgency_text: page?.urgency_text || '',
      cta_text: page?.cta_text || 'Commander maintenant',
      theme: (page?.theme as unknown as LandingPageInput['theme']) || { primary: '#7c3aed', accent: '#111827', style: 'modern' },
      seo: (page?.seo as LandingPageInput['seo']) || { title: product.name, description: product.description || product.name },
      status: page?.status || 'draft',
    })
  }, [product, page])

  if (!product || !form) return null
  const landingUrl = page ? buildLandingUrl(data, page.slug) : ''
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader><DialogTitle>Ad landing page · {product.name}</DialogTitle><DialogDescription>Generate conversion copy with AI, review it, publish it, then use the link in Meta or TikTok ads.</DialogDescription></DialogHeader>
        <div className="flex flex-wrap gap-2">
          <Button disabled={pending} onClick={onGenerate}><Sparkles className="mr-2 h-4 w-4" /> {page ? 'Regenerate with AI' : 'Generate with AI'}</Button>
          {page?.status !== 'published' && <Button disabled={pending || !page} variant="outline" onClick={() => onStatus('published')}><Globe2 className="mr-2 h-4 w-4" /> Publish</Button>}
          {page?.status === 'published' && <Button disabled={pending} variant="outline" onClick={() => onStatus('draft')}>Unpublish</Button>}
          {page?.status === 'published' && <Button variant="outline" onClick={() => window.open(landingUrl, '_blank')}><ExternalLink className="mr-2 h-4 w-4" /> Open page</Button>}
        </div>
        {page?.status === 'published' && (
          <div className="flex gap-2 rounded-2xl bg-purple-50 p-3">
            <Input readOnly value={landingUrl} />
            <Button onClick={() => navigator.clipboard.writeText(landingUrl)}><Clipboard className="h-4 w-4" /></Button>
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="URL slug"><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} /></Field>
          <Field label="CTA text"><Input value={form.cta_text} onChange={(e) => setForm({ ...form, cta_text: e.target.value })} /></Field>
          <div className="md:col-span-2"><Field label="Headline"><Input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} /></Field></div>
          <div className="md:col-span-2"><Field label="Subheadline"><Textarea value={form.subheadline} onChange={(e) => setForm({ ...form, subheadline: e.target.value })} /></Field></div>
          <div className="md:col-span-2"><Field label="Sales description"><Textarea rows={6} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field></div>
          <div className="md:col-span-2"><Field label="Benefits (one per line)"><Textarea value={form.benefits.join('\n')} onChange={(e) => setForm({ ...form, benefits: e.target.value.split('\n').filter(Boolean) })} /></Field></div>
          <Field label="Urgency text"><Input value={form.urgency_text} onChange={(e) => setForm({ ...form, urgency_text: e.target.value })} /></Field>
          <Field label="Primary color"><Input type="color" value={form.theme.primary} onChange={(e) => setForm({ ...form, theme: { ...form.theme, primary: e.target.value } })} /></Field>
          <Field label="SEO title"><Input value={form.seo.title} onChange={(e) => setForm({ ...form, seo: { ...form.seo, title: e.target.value } })} /></Field>
          <Field label="SEO description"><Input value={form.seo.description} onChange={(e) => setForm({ ...form, seo: { ...form.seo, description: e.target.value } })} /></Field>
        </div>
        {page && <div className="flex gap-4 text-xs font-bold text-slate-500"><span><Eye className="mr-1 inline h-3 w-3" />{page.views} views</span><span><CheckCircle2 className="mr-1 inline h-3 w-3" />{page.conversions} orders</span></div>}
        <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Close</Button><Button disabled={pending} onClick={() => onSave(form)}>Save landing page</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ShippingDialog({ open, setOpen, form, setForm, pending, onSubmit }: { open: boolean; setOpen: (value: boolean) => void; form: Partial<EcommerceShippingZone>; setForm: React.Dispatch<React.SetStateAction<Partial<EcommerceShippingZone>>>; pending: boolean; onSubmit: () => void }) {
  return (
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Shipping zone</DialogTitle><DialogDescription>Fees selected at checkout are validated again by the database.</DialogDescription></DialogHeader>
      <Field label="Zone name"><Input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
      <Field label="Carrier"><Input value={form.carrier || ''} onChange={(e) => setForm({ ...form, carrier: e.target.value })} /></Field>
      <Field label="Wilayas (comma separated)"><Input value={toStringArray(form.wilayas).join(', ')} onChange={(e) => setForm({ ...form, wilayas: e.target.value.split(',').map((value) => value.trim()) })} /></Field>
      <Field label="Delivery fee (DZD)"><Input type="number" min={0} value={form.base_fee || 0} onChange={(e) => setForm({ ...form, base_fee: Number(e.target.value) })} /></Field>
      <Field label="Estimated delivery"><Input value={form.estimated_days || ''} onChange={(e) => setForm({ ...form, estimated_days: e.target.value })} /></Field>
      <label className="flex gap-2 text-sm"><input type="checkbox" checked={form.cod_enabled ?? true} onChange={(e) => setForm({ ...form, cod_enabled: e.target.checked })} /> Cash on delivery</label>
      <label className="flex gap-2 text-sm"><input type="checkbox" checked={form.is_active ?? true} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
      <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={pending} onClick={onSubmit}>Save</Button></DialogFooter>
    </DialogContent></Dialog>
  )
}

function PromotionDialog({ open, setOpen, form, setForm, pending, onSubmit }: { open: boolean; setOpen: (value: boolean) => void; form: Partial<EcommercePromotion>; setForm: React.Dispatch<React.SetStateAction<Partial<EcommercePromotion>>>; pending: boolean; onSubmit: () => void }) {
  const target = form.target && typeof form.target === 'object' && !Array.isArray(form.target)
    ? form.target as Record<string, unknown>
    : {}

  function updateTarget(key: string, value: unknown) {
    setForm({ ...form, target: { ...target, [key]: value } as EcommercePromotion['target'] })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Promotion</DialogTitle><DialogDescription>Codes are checked for status and date during checkout.</DialogDescription></DialogHeader>
      <Field label="Campaign name"><Input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
      <Field label="Code"><Input value={form.code || ''} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} /></Field>
      <Field label="Discount type"><select value={form.discount_type || 'percentage'} onChange={(e) => setForm({ ...form, discount_type: e.target.value as EcommercePromotion['discount_type'] })} className="h-9 w-full rounded-lg border px-3"><option value="percentage">Percentage</option><option value="fixed">Fixed DZD</option><option value="free_shipping">Free shipping</option></select></Field>
      <Field label="Discount value"><Input type="number" min={0} value={form.discount_value || 0} disabled={form.discount_type === 'free_shipping'} onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })} /></Field>
      <Field label="Minimum order (DZD)"><Input type="number" min={0} value={Number(target.min_order_amount || 0)} onChange={(e) => updateTarget('min_order_amount', Number(e.target.value) || 0)} /></Field>
      <Field label="Usage limit"><Input type="number" min={0} value={Number(target.usage_limit || 0)} onChange={(e) => updateTarget('usage_limit', Number(e.target.value) || 0)} /></Field>
      <Field label="Starts at"><Input type="datetime-local" value={form.starts_at?.slice(0, 16) || ''} onChange={(e) => setForm({ ...form, starts_at: e.target.value ? new Date(e.target.value).toISOString() : null })} /></Field>
      <Field label="Ends at"><Input type="datetime-local" value={form.ends_at?.slice(0, 16) || ''} onChange={(e) => setForm({ ...form, ends_at: e.target.value ? new Date(e.target.value).toISOString() : null })} /></Field>
      <Field label="Status"><select value={form.status || 'draft'} onChange={(e) => setForm({ ...form, status: e.target.value as EcommercePromotion['status'] })} className="h-9 w-full rounded-lg border px-3"><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="live">Live</option><option value="paused">Paused</option><option value="expired">Expired</option></select></Field>
      <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={pending} onClick={onSubmit}>Save</Button></DialogFooter>
    </DialogContent></Dialog>
  )
}

function SearchInput({ query, setQuery }: { query: string; setQuery: (value: string) => void }) {
  return <div className="relative w-full md:w-80"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search product or SKU" className="pl-9" /></div>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>
}

function StatusBadge({ value }: { value: string }) {
  const positive = ['active', 'published', 'paid', 'delivered', 'live', 'confirmed'].includes(value)
  const warning = ['draft', 'pending', 'new', 'scheduled', 'packed'].includes(value)
  return <Badge className={positive ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50' : warning ? 'bg-amber-50 text-amber-700 hover:bg-amber-50' : 'bg-slate-100 text-slate-700 hover:bg-slate-100'}>{orderStatusLabel(value)}</Badge>
}

function Empty({ text }: { text: string }) {
  return (
    <div className="m-4 rounded-2xl border-2 border-dashed border-[#e8eaed] bg-[#f9fafb] p-10 text-center">
      <div className="text-2xl mb-2">📦</div>
      <div className="text-sm font-bold text-gray-500">{text}</div>
    </div>
  )
}
