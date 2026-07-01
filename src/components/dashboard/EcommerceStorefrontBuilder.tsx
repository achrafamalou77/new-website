'use client'

import { useMemo, useState, useTransition } from 'react'
import {
  Check, ExternalLink, FileText, Home, ImagePlus, LayoutTemplate, Loader2,
  Monitor, Palette, Save, Settings2, ShoppingBag, Smartphone, Store, Type,
} from 'lucide-react'
import { updateEcommerceStorefrontConfig, uploadEcommerceImage } from '@/app/actions/ecommerce'
import EcommerceStorefrontRenderer from '@/components/website/EcommerceStorefrontRenderer'
import EcommerceCatalog from '@/components/website/EcommerceCatalog'
import EcommerceContactPage from '@/components/website/EcommerceContactPage'
import EcommercePolicyPage from '@/components/website/EcommercePolicyPage'
import {
  ECOMMERCE_STOREFRONT_TEMPLATES,
  createEcommerceStorefrontConfig,
  type EcommerceStorefrontConfig,
} from '@/lib/ecommerce-storefront'
import type { EcommerceProduct, EcommerceProductPage } from '@/types/ecommerce'

type EditorTab = 'pages' | 'content' | 'design' | 'settings' | 'templates'
type BuilderPage = 'home' | 'catalog' | 'contact' | 'shipping' | 'returns' | 'privacy' | 'terms'

const fieldClass = 'mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100'
const labelClass = 'block text-xs font-bold text-slate-600'

const tabs: Array<{ id: EditorTab; label: string; icon: typeof Type }> = [
  { id: 'pages', label: 'Pages', icon: FileText },
  { id: 'content', label: 'Editing', icon: Type },
  { id: 'design', label: 'Style', icon: Palette },
  { id: 'settings', label: 'Settings', icon: Settings2 },
  { id: 'templates', label: 'Themes', icon: LayoutTemplate },
]

const pageDefinitions: Array<{ id: BuilderPage; label: string; icon: typeof Home }> = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'catalog', label: 'Catalog', icon: ShoppingBag },
  { id: 'contact', label: 'Contact', icon: Store },
  { id: 'shipping', label: 'Shipping policy', icon: FileText },
  { id: 'returns', label: 'Returns policy', icon: FileText },
  { id: 'privacy', label: 'Privacy policy', icon: FileText },
  { id: 'terms', label: 'Terms and conditions', icon: FileText },
]

export default function EcommerceStorefrontBuilder({
  agency,
  initialConfig,
  products,
  pages,
  storeUrl,
}: {
  agency: { company_name: string; phone?: string | null; email?: string | null; address?: string | null; website_settings?: Record<string, unknown> }
  initialConfig: EcommerceStorefrontConfig
  products: EcommerceProduct[]
  pages: EcommerceProductPage[]
  storeUrl: string
}) {
  const [config, setConfig] = useState(initialConfig)
  const [savedConfig, setSavedConfig] = useState(initialConfig)
  const [tab, setTab] = useState<EditorTab>('pages')
  const [activePage, setActivePage] = useState<BuilderPage>('home')
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [message, setMessage] = useState('')
  const [uploading, setUploading] = useState(false)
  const [pending, startTransition] = useTransition()
  const dirty = useMemo(() => JSON.stringify(config) !== JSON.stringify(savedConfig), [config, savedConfig])

  function update<K extends keyof EcommerceStorefrontConfig>(key: K, value: EcommerceStorefrontConfig[K]) {
    setConfig((current) => ({ ...current, [key]: value }))
    setMessage('')
  }

  function save() {
    setMessage('')
    startTransition(async () => {
      const result = await updateEcommerceStorefrontConfig(config)
      if (!result.success) {
        setMessage(result.error || 'Could not save the storefront.')
        return
      }
      setSavedConfig(config)
      setMessage('Storefront published successfully.')
    })
  }

  async function uploadImage(file: File | undefined, target: 'heroImage' | 'promoImage' | 'logoUrl') {
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.set('file', file)
    const result = await uploadEcommerceImage(formData)
    setUploading(false)
    if (!result.success) {
      setMessage(result.error || 'Image upload failed.')
      return
    }
    update(target, result.url)
  }

  function applyTemplate(templateId: EcommerceStorefrontConfig['templateId']) {
    const preset = createEcommerceStorefrontConfig(templateId, config.storeName)
    setConfig({
      ...preset,
      storeName: config.storeName,
      contactEmail: config.contactEmail,
      contactAddress: config.contactAddress,
      instagramUrl: config.instagramUrl,
      facebookUrl: config.facebookUrl,
    })
    setMessage('Complete website theme applied. Publish to make it live.')
  }

  function selectPage(page: BuilderPage) {
    setActivePage(page)
    setTab('content')
  }

  function preview() {
    if (activePage === 'catalog') return <EcommerceCatalog agency={agency} products={products} config={config} preview storefrontBaseUrl={storeUrl} />
    if (activePage === 'contact') return <EcommerceContactPage agency={agency} products={products} config={config} preview storefrontBaseUrl={storeUrl} />
    const policies: Record<Exclude<BuilderPage, 'home' | 'catalog' | 'contact'>, [string, string]> = {
      shipping: ['Shipping policy', config.shippingPolicy],
      returns: ['Returns policy', config.returnsPolicy],
      privacy: ['Privacy policy', config.privacyPolicy],
      terms: ['Terms and conditions', config.termsPolicy],
    }
    if (activePage in policies) {
      const [title, content] = policies[activePage as keyof typeof policies]
      return <EcommercePolicyPage agency={agency} products={products} config={config} title={title} content={content} preview storefrontBaseUrl={storeUrl} />
    }
    return <EcommerceStorefrontRenderer agency={agency} products={products} pages={pages} config={config} preview storefrontBaseUrl={storeUrl} />
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-slate-100">
      <header className="flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:px-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black text-slate-950">Storefront Builder</h1>
            {dirty && <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black uppercase text-amber-700">Unsaved</span>}
          </div>
          <p className="text-xs text-slate-500">Multi-page website · {products.length} live products</p>
        </div>
        <div className="flex items-center gap-2">
          <a href={storeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-700">Open store <ExternalLink className="h-4 w-4" /></a>
          <button onClick={save} disabled={pending || !dirty} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Publish
          </button>
        </div>
      </header>

      {message && <div className={`shrink-0 border-b px-6 py-2 text-center text-xs font-bold ${message.includes('successfully') ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>{message}</div>}

      <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="min-h-0 overflow-y-auto border-r border-slate-200 bg-white">
          <div className="sticky top-0 z-10 grid grid-cols-5 border-b border-slate-200 bg-white">
            {tabs.map((item) => {
              const Icon = item.icon
              return <button key={item.id} onClick={() => setTab(item.id)} className={`flex flex-col items-center gap-1 px-1 py-3 text-[9px] font-black ${tab === item.id ? 'border-b-2 border-violet-600 bg-violet-50 text-violet-700' : 'text-slate-500'}`}><Icon className="h-4 w-4" />{item.label}</button>
            })}
          </div>

          <div className="space-y-5 p-5">
            {tab === 'pages' && (
              <>
                <div><p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Website pages</p><p className="mt-2 text-xs leading-5 text-slate-500">Select a page to edit. Product pages are generated automatically.</p></div>
                <div className="space-y-2">
                  {pageDefinitions.map((page) => {
                    const Icon = page.icon
                    return <button key={page.id} onClick={() => selectPage(page.id)} className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-bold ${activePage === page.id ? 'border-violet-400 bg-violet-50 text-violet-700' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}><Icon className="h-4 w-4" />{page.label}</button>
                  })}
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs leading-5 text-emerald-800"><strong className="block">Automatic product pages</strong>Every active product has images, live stock, variants, cart and ordering.</div>
              </>
            )}

            {tab === 'content' && (
              <>
                <button onClick={() => setTab('pages')} className="text-xs font-black text-violet-600">← All pages</button>
                <div className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white">{pageDefinitions.find((page) => page.id === activePage)?.label}</div>
                {activePage === 'home' && <HomeEditor config={config} update={update} uploading={uploading} uploadImage={uploadImage} />}
                {activePage === 'catalog' && <CatalogEditor config={config} update={update} />}
                {activePage === 'contact' && <ContactEditor config={config} update={update} />}
                {activePage === 'shipping' && <PolicyEditor label="Shipping policy" value={config.shippingPolicy} onChange={(value) => update('shippingPolicy', value)} />}
                {activePage === 'returns' && <PolicyEditor label="Returns policy" value={config.returnsPolicy} onChange={(value) => update('returnsPolicy', value)} />}
                {activePage === 'privacy' && <PolicyEditor label="Privacy policy" value={config.privacyPolicy} onChange={(value) => update('privacyPolicy', value)} />}
                {activePage === 'terms' && <PolicyEditor label="Terms and conditions" value={config.termsPolicy} onChange={(value) => update('termsPolicy', value)} />}
              </>
            )}

            {tab === 'design' && (
              <>
                <ImageField label="Logo" value={config.logoUrl} target="logoUrl" uploading={uploading} uploadImage={uploadImage} update={update} />
                {([['primaryColor', 'Primary color'], ['accentColor', 'Accent color'], ['backgroundColor', 'Page background'], ['surfaceColor', 'Cards and surfaces'], ['textColor', 'Text color']] as const).map(([key, label]) => (
                  <label key={key} className={labelClass}>{label}<span className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 p-2"><input type="color" value={config[key]} onChange={(event) => update(key, event.target.value)} className="h-9 w-12 cursor-pointer rounded-lg border-0 bg-transparent" /><input value={config[key]} onChange={(event) => update(key, event.target.value)} className="min-w-0 flex-1 text-sm font-bold uppercase outline-none" /></span></label>
                ))}
                <SelectField label="Navigation style" value={config.navStyle} onChange={(value) => update('navStyle', value as EcommerceStorefrontConfig['navStyle'])} options={[['boxed', 'Boxed'], ['full', 'Full width'], ['minimal', 'Minimal']]} />
                <SelectField label="Heading font" value={config.headingFont} onChange={(value) => update('headingFont', value as EcommerceStorefrontConfig['headingFont'])} options={[['sans', 'Modern sans'], ['serif', 'Editorial serif'], ['display', 'Bold display']]} />
                <SelectField label="Hero layout" value={config.heroLayout} onChange={(value) => update('heroLayout', value as EcommerceStorefrontConfig['heroLayout'])} options={[['split', 'Split image'], ['editorial', 'Editorial'], ['centered', 'Centered spotlight']]} />
                <SelectField label="Product cards" value={config.productCardStyle} onChange={(value) => update('productCardStyle', value as EcommerceStorefrontConfig['productCardStyle'])} options={[['soft', 'Soft shadow'], ['editorial', 'Editorial'], ['bold', 'Bold retail']]} />
                <label className={labelClass}>Corner radius: {config.borderRadius}px<input type="range" min="0" max="40" value={config.borderRadius} onChange={(event) => update('borderRadius', Number(event.target.value))} className="mt-3 w-full accent-violet-600" /></label>
              </>
            )}

            {tab === 'settings' && (
              <>
                <label className={labelClass}>Store name<input className={fieldClass} value={config.storeName} onChange={(event) => update('storeName', event.target.value)} /></label>
                <label className={labelClass}>Announcement<input className={fieldClass} value={config.announcement} onChange={(event) => update('announcement', event.target.value)} /></label>
                <Toggle label="Announcement bar" checked={config.showAnnouncement} onChange={(value) => update('showAnnouncement', value)} />
                <Toggle label="Search" checked={config.enableSearch} onChange={(value) => update('enableSearch', value)} />
                <Toggle label="Shopping cart" checked={config.enableCart} onChange={(value) => update('enableCart', value)} />
                <Toggle label="Home promotion" checked={config.showPromoSection} onChange={(value) => update('showPromoSection', value)} />
                <Toggle label="Category filters" checked={config.showCategories} onChange={(value) => update('showCategories', value)} />
                <Toggle label="Featured products" checked={config.showFeaturedProducts} onChange={(value) => update('showFeaturedProducts', value)} />
                <Toggle label="Home catalog" checked={config.showAllProducts} onChange={(value) => update('showAllProducts', value)} />
                <Toggle label="Trust section" checked={config.showTrustBar} onChange={(value) => update('showTrustBar', value)} />
                <label className={labelClass}>Footer tagline<textarea rows={3} className={fieldClass} value={config.footerTagline} onChange={(event) => update('footerTagline', event.target.value)} /></label>
                <label className={labelClass}>Instagram URL<input className={fieldClass} value={config.instagramUrl} onChange={(event) => update('instagramUrl', event.target.value)} /></label>
                <label className={labelClass}>Facebook URL<input className={fieldClass} value={config.facebookUrl} onChange={(event) => update('facebookUrl', event.target.value)} /></label>
              </>
            )}

            {tab === 'templates' && (
              <div className="space-y-4">
                <p className="text-xs leading-5 text-slate-500">Themes now change the complete site: every page, navigation, catalog, product cards, footer and content defaults.</p>
                {ECOMMERCE_STOREFRONT_TEMPLATES.map((template) => (
                  <button key={template.id} onClick={() => applyTemplate(template.id)} className={`w-full overflow-hidden rounded-2xl border text-left transition ${config.templateId === template.id ? 'border-violet-500 ring-2 ring-violet-100' : 'border-slate-200 hover:border-slate-300'}`}>
                    <img src={template.thumbnail} alt="" className="h-28 w-full object-cover" />
                    <span className="flex items-start justify-between gap-3 p-4"><span><strong className="block text-sm text-slate-950">{template.name}</strong><span className="mt-1 block text-xs leading-5 text-slate-500">{template.tagline}</span></span>{config.templateId === template.id && <Check className="h-5 w-5 text-violet-600" />}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        <section className="flex flex-col min-h-0 min-w-0 overflow-hidden p-4 lg:p-6">
          <div className="mb-4 flex shrink-0 items-center justify-between">
            <div><p className="text-xs font-black uppercase tracking-wider text-slate-500">Live preview · {pageDefinitions.find((page) => page.id === activePage)?.label}</p><p className="text-xs text-slate-400">Real products, routes, search and cart behavior.</p></div>
            <div className="flex rounded-xl border border-slate-200 bg-white p-1"><button onClick={() => setDevice('desktop')} className={`rounded-lg p-2 ${device === 'desktop' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}><Monitor className="h-4 w-4" /></button><button onClick={() => setDevice('mobile')} className={`rounded-lg p-2 ${device === 'mobile' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}><Smartphone className="h-4 w-4" /></button></div>
          </div>
          <div className={`mx-auto flex flex-1 flex-col min-h-0 w-full overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-2xl transition-all ${device === 'mobile' ? 'max-w-[390px]' : 'max-w-full'}`}>
            <div className="flex h-9 shrink-0 items-center gap-2 border-b border-slate-200 bg-slate-50 px-3"><span className="h-2.5 w-2.5 rounded-full bg-red-400" /><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /><span className="ml-2 truncate rounded-md bg-white px-3 py-1 text-[10px] text-slate-400">{storeUrl}/{activePage === 'home' ? '' : activePage}</span></div>
            <div className="flex-1 overflow-y-auto scrollbar-thin">{preview()}</div>
          </div>
        </section>
      </div>
    </div>
  )
}

type Update = <K extends keyof EcommerceStorefrontConfig>(key: K, value: EcommerceStorefrontConfig[K]) => void
type Upload = (file: File | undefined, target: 'heroImage' | 'promoImage' | 'logoUrl') => Promise<void>

function HomeEditor({ config, update, uploading, uploadImage }: { config: EcommerceStorefrontConfig; update: Update; uploading: boolean; uploadImage: Upload }) {
  return <><label className={labelClass}>Hero eyebrow<input className={fieldClass} value={config.heroEyebrow} onChange={(event) => update('heroEyebrow', event.target.value)} /></label><label className={labelClass}>Hero title<textarea rows={3} className={fieldClass} value={config.heroTitle} onChange={(event) => update('heroTitle', event.target.value)} /></label><label className={labelClass}>Hero description<textarea rows={4} className={fieldClass} value={config.heroSubtitle} onChange={(event) => update('heroSubtitle', event.target.value)} /></label><ImageField label="Hero image" value={config.heroImage} target="heroImage" uploading={uploading} uploadImage={uploadImage} update={update} /><label className={labelClass}>Promotion eyebrow<input className={fieldClass} value={config.promoEyebrow} onChange={(event) => update('promoEyebrow', event.target.value)} /></label><label className={labelClass}>Promotion title<textarea rows={2} className={fieldClass} value={config.promoTitle} onChange={(event) => update('promoTitle', event.target.value)} /></label><label className={labelClass}>Promotion text<textarea rows={4} className={fieldClass} value={config.promoText} onChange={(event) => update('promoText', event.target.value)} /></label><ImageField label="Promotion image" value={config.promoImage} target="promoImage" uploading={uploading} uploadImage={uploadImage} update={update} /><label className={labelClass}>Featured heading<input className={fieldClass} value={config.featuredTitle} onChange={(event) => update('featuredTitle', event.target.value)} /></label></>
}

function CatalogEditor({ config, update }: { config: EcommerceStorefrontConfig; update: Update }) {
  return <><label className={labelClass}>Catalog heading<input className={fieldClass} value={config.catalogTitle} onChange={(event) => update('catalogTitle', event.target.value)} /></label><label className={labelClass}>Catalog subtitle<textarea rows={4} className={fieldClass} value={config.catalogSubtitle} onChange={(event) => update('catalogSubtitle', event.target.value)} /></label><label className={labelClass}>Desktop columns<select className={fieldClass} value={config.catalogColumns} onChange={(event) => update('catalogColumns', Number(event.target.value) as 2 | 3 | 4)}><option value="2">2 columns</option><option value="3">3 columns</option><option value="4">4 columns</option></select></label></>
}

function ContactEditor({ config, update }: { config: EcommerceStorefrontConfig; update: Update }) {
  return <><label className={labelClass}>Contact title<input className={fieldClass} value={config.contactTitle} onChange={(event) => update('contactTitle', event.target.value)} /></label><label className={labelClass}>Contact subtitle<textarea rows={3} className={fieldClass} value={config.contactSubtitle} onChange={(event) => update('contactSubtitle', event.target.value)} /></label><label className={labelClass}>About title<input className={fieldClass} value={config.aboutTitle} onChange={(event) => update('aboutTitle', event.target.value)} /></label><label className={labelClass}>About text<textarea rows={6} className={fieldClass} value={config.aboutText} onChange={(event) => update('aboutText', event.target.value)} /></label><label className={labelClass}>Public email<input className={fieldClass} value={config.contactEmail} onChange={(event) => update('contactEmail', event.target.value)} /></label><label className={labelClass}>Public address<textarea rows={3} className={fieldClass} value={config.contactAddress} onChange={(event) => update('contactAddress', event.target.value)} /></label></>
}

function PolicyEditor({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className={labelClass}>{label}<textarea rows={14} className={fieldClass} value={value} onChange={(event) => onChange(event.target.value)} /></label>
}

function ImageField({ label, value, target, uploading, uploadImage, update }: { label: string; value: string; target: 'heroImage' | 'promoImage' | 'logoUrl'; uploading: boolean; uploadImage: Upload; update: Update }) {
  return <div><span className={labelClass}>{label}</span>{value && <img src={value} alt="" className="mt-2 h-32 w-full rounded-xl border border-slate-200 object-cover" />}<label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-xs font-black text-slate-700">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} Upload image<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" disabled={uploading} onChange={(event) => uploadImage(event.target.files?.[0], target)} /></label><input className={fieldClass} value={value} onChange={(event) => update(target, event.target.value)} placeholder="Or paste an image URL" /></div>
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<[string, string]> }) {
  return <label className={labelClass}>{label}<select className={fieldClass} value={value} onChange={(event) => onChange(event.target.value)}>{options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 p-4 text-sm font-bold text-slate-800">{label}<input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 accent-violet-600" /></label>
}
