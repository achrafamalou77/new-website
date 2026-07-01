'use client'

import { useEffect, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Clipboard,
  ExternalLink,
  Eye,
  Globe2,
  Loader2,
  Megaphone,
  Palette,
  Save,
  Sparkles,
} from 'lucide-react'
import {
  generateEcommerceLandingPage,
  saveEcommerceLandingPage,
  setEcommerceLandingStatus,
} from '@/app/actions/ecommerce'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import type {
  EcommerceProduct,
  EcommerceStoreData,
  LandingGenerationBrief,
  LandingPageInput,
} from '@/types/ecommerce'
import { getTenantUrl } from '@/lib/tenant-url'

type Notice = { tone: 'success' | 'error'; text: string }

const themePresets = {
  luxury: { primary: '#111827', accent: '#c89b3c', background: '#f7f3eb', surface: '#ffffff', text: '#111827', style: 'luxury', font: 'serif', heroLayout: 'editorial', radius: 'soft' },
  playful: { primary: '#ec4899', accent: '#312e81', background: '#fff5fa', surface: '#ffffff', text: '#1e1b4b', style: 'playful', font: 'outfit', heroLayout: 'split', radius: 'rounded' },
  editorial: { primary: '#ea580c', accent: '#172554', background: '#fff7ed', surface: '#ffffff', text: '#172554', style: 'editorial', font: 'jakarta', heroLayout: 'editorial', radius: 'soft' },
  minimal: { primary: '#18181b', accent: '#52525b', background: '#fafafa', surface: '#ffffff', text: '#18181b', style: 'minimal', font: 'jakarta', heroLayout: 'split', radius: 'sharp' },
  bold: { primary: '#7c3aed', accent: '#0f172a', background: '#f5f3ff', surface: '#ffffff', text: '#0f172a', style: 'bold', font: 'outfit', heroLayout: 'spotlight', radius: 'rounded' },
} as const

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function money(value: number) {
  return `${new Intl.NumberFormat('fr-DZ').format(Number(value || 0))} DZD`
}

function buildUrl(data: EcommerceStoreData, slug: string) {
  return `${getTenantUrl(data.agency.subdomain, data.agency.custom_domain)}/shop/${slug}`
}

function cleanSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100)
}

function textLines(value: string) {
  return value.split('\n').map((item) => item.trim()).filter(Boolean).slice(0, 8)
}

function faqLines(value: string): LandingPageInput['faq'] {
  return value.split('\n').flatMap((line) => {
    const [question, ...answerParts] = line.split('|')
    const answer = answerParts.join('|').trim()
    return question?.trim() && answer ? [{ question: question.trim(), answer }] : []
  }).slice(0, 8)
}

function proofLines(value: string): LandingPageInput['social_proof'] {
  return value.split('\n').flatMap((line) => {
    const [quote, ...authorParts] = line.split('|')
    const author = authorParts.join('|').trim()
    return quote?.trim() && author ? [{ quote: quote.trim(), author }] : []
  }).slice(0, 6)
}

function validate(form: LandingPageInput) {
  const errors: string[] = []
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug) || form.slug.length < 2) errors.push('Use a valid URL slug.')
  if (form.headline.trim().length < 8) errors.push('Headline must contain at least 8 characters.')
  if (form.subheadline.trim().length < 5) errors.push('Subheadline must contain at least 5 characters.')
  if (form.description.trim().length < 20) errors.push('Sales description must contain at least 20 characters.')
  if (form.benefits.filter((item) => item.trim().length >= 3).length < 3) errors.push('Add at least three product benefits.')
  if (form.cta_text.trim().length < 2) errors.push('Add a call-to-action label.')
  if (form.seo.title.trim().length < 5 || form.seo.title.length > 70) errors.push('SEO title must contain 5 to 70 characters.')
  if (form.seo.description.trim().length < 20 || form.seo.description.length > 170) errors.push('SEO description must contain 20 to 170 characters.')
  return errors
}

function initialForm(product: EcommerceProduct, data: EcommerceStoreData): LandingPageInput {
  const page = product.landing_page
  const description = product.description?.trim()
  const savedTheme = (page?.theme || {}) as unknown as Partial<LandingPageInput['theme']>
  return {
    product_id: product.id,
    slug: page?.slug || `${cleanSlug(product.name) || 'product'}-${product.id.slice(0, 6)}`,
    headline: page?.headline || product.name,
    subheadline: page?.subheadline || description || `Commandez ${product.name} simplement, avec paiement a la livraison.`,
    description: page?.description || description || `Decouvrez ${product.name}, commandez en quelques etapes et faites-vous livrer partout ou le service est disponible.`,
    benefits: strings(page?.benefits).length
      ? strings(page?.benefits)
      : ['Commande rapide et simple', 'Paiement a la livraison', 'Confirmation avant expedition'],
    faq: Array.isArray(page?.faq) && page.faq.length
      ? page.faq as LandingPageInput['faq']
      : [
          { question: 'Comment commander ?', answer: 'Remplissez le formulaire puis notre equipe confirme votre commande.' },
          { question: 'Comment payer ?', answer: 'Le paiement est effectue a la livraison.' },
          { question: 'Ou livrez-vous ?', answer: 'Les options disponibles sont affichees dans le formulaire.' },
        ],
    social_proof: Array.isArray(page?.social_proof) ? page.social_proof as LandingPageInput['social_proof'] : [],
    urgency_text: page?.urgency_text || '',
    cta_text: page?.cta_text || 'Commander maintenant',
    theme: {
      ...themePresets.bold,
      ...savedTheme,
      allowedShippingZoneIds: savedTheme.allowedShippingZoneIds || data.shippingZones.map((zone) => zone.id),
      showRelatedProducts: savedTheme.showRelatedProducts ?? true,
      showStickyCta: savedTheme.showStickyCta ?? true,
    },
    seo: (page?.seo as LandingPageInput['seo']) || {
      title: `${product.name} | ${data.agency.company_name}`.slice(0, 70),
      description: description || `Commandez ${product.name} chez ${data.agency.company_name} avec paiement a la livraison.`,
    },
    status: page?.status || 'draft',
  }
}

export default function EcommerceLandingStudio({
  open,
  setOpen,
  product,
  data,
  onChanged,
}: {
  open: boolean
  setOpen: (value: boolean) => void
  product: EcommerceProduct | null
  data: EcommerceStoreData
  onChanged: (landingPage: EcommerceProduct['landing_page']) => void
}) {
  const [form, setForm] = useState<LandingPageInput | null>(null)
  const [brief, setBrief] = useState<LandingGenerationBrief>({
    audience: '',
    campaignAngle: '',
    tone: 'premium',
    language: 'fr',
    extraInstructions: '',
    designStyle: 'luxury',
    primaryColor: '#7c3aed',
    shippingZoneIds: data.shippingZones.map((zone) => zone.id),
  })
  const [busy, setBusy] = useState<'generate' | 'save' | 'publish' | 'status' | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)

  useEffect(() => {
    if (!product || !open) return
    const nextForm = initialForm(product, data)
    setForm(nextForm)
    setBrief((current) => ({
      ...current,
      designStyle: (nextForm.theme.style in themePresets ? nextForm.theme.style : 'luxury') as LandingGenerationBrief['designStyle'],
      primaryColor: nextForm.theme.primary,
      shippingZoneIds: nextForm.theme.allowedShippingZoneIds || data.shippingZones.map((zone) => zone.id),
    }))
    setNotice(null)
  }, [product, open, data])

  if (!product || !form) return null

  const currentProduct = product
  const currentForm = form
  const page = currentProduct.landing_page
  const images = strings(currentProduct.images)
  const errors = validate(currentForm)
  const readiness = Math.max(0, 100 - errors.length * 14)
  const landingUrl = buildUrl(data, currentForm.slug)

  async function perform(
    mode: 'generate' | 'save' | 'publish' | 'status',
    task: () => Promise<any>,
    successText: string
  ) {
    setBusy(mode)
    setNotice(null)
    try {
      const result = await task()
      if (!result?.success) {
        setNotice({ tone: 'error', text: result?.error || 'Operation failed.' })
        return null
      }
      if (result.landingPage) onChanged(result.landingPage)
      setNotice({ tone: 'success', text: successText })
      return result
    } catch (error) {
      setNotice({ tone: 'error', text: error instanceof Error ? error.message : 'Unexpected operation failure.' })
      return null
    } finally {
      setBusy(null)
    }
  }

  async function generate() {
    const result = await perform(
      'generate',
      () => generateEcommerceLandingPage(currentProduct.id, brief),
      'Professional AI copy generated. Review it before publishing.'
    )
    if (result?.landingPage) setForm(initialForm({ ...currentProduct, landing_page: result.landingPage }, data))
  }

  async function saveDraft() {
    if (errors.length) return setNotice({ tone: 'error', text: errors[0] })
    const payload: LandingPageInput = {
      ...currentForm,
      status: page?.status === 'published' ? 'published' : 'draft',
    }
    const result = await perform(
      'save',
      () => saveEcommerceLandingPage(payload),
      'Landing page saved.'
    )
    if (result?.landingPage) setForm(initialForm({ ...currentProduct, landing_page: result.landingPage }, data))
  }

  async function publish() {
    if (errors.length) return setNotice({ tone: 'error', text: errors[0] })
    const payload: LandingPageInput = { ...currentForm, status: 'published' }
    const result = await perform(
      'publish',
      () => saveEcommerceLandingPage(payload),
      'Landing page is live and ready for ads.'
    )
    if (result?.landingPage) setForm(initialForm({ ...currentProduct, landing_page: result.landingPage }, data))
  }

  async function unpublish() {
    const result = await perform(
      'status',
      () => setEcommerceLandingStatus(currentProduct.id, 'draft'),
      'Landing page unpublished.'
    )
    if (result?.landingPage) setForm(initialForm({ ...currentProduct, landing_page: result.landingPage }, data))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex h-[94dvh] max-h-[94dvh] min-h-0 flex-col gap-0 overflow-hidden p-0 sm:max-w-7xl">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 border-b bg-white px-6 py-5">
            <DialogHeader>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <DialogTitle className="text-xl">Landing Page Studio</DialogTitle>
                  <DialogDescription className="mt-1">
                    Build, preview, validate and publish a campaign page for {product.name}.
                  </DialogDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{page?.status || 'not saved'}</Badge>
                  <Badge className={readiness === 100 ? 'bg-emerald-600' : 'bg-amber-500'}>{readiness}% ready</Badge>
                  {page && <Badge variant="outline"><Eye className="mr-1 h-3 w-3" />{page.views} views</Badge>}
                  {page && <Badge variant="outline"><CheckCircle2 className="mr-1 h-3 w-3" />{page.conversions} orders</Badge>}
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[minmax(0,1.05fr)_minmax(380px,.95fr)]">
            <div className="scrollbar-thin min-h-0 overflow-x-hidden overflow-y-auto overscroll-contain border-r bg-white p-6 [touch-action:pan-y]">
              {notice && (
                <div className={`mb-5 flex gap-3 rounded-xl border p-4 text-sm font-semibold ${notice.tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
                  {notice.tone === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
                  <span>{notice.text}</span>
                </div>
              )}

              <Tabs defaultValue="ai">
                <TabsList className="mb-6 grid h-auto w-full grid-cols-4">
                  <TabsTrigger value="ai"><Sparkles /> AI brief</TabsTrigger>
                  <TabsTrigger value="content"><Megaphone /> Content</TabsTrigger>
                  <TabsTrigger value="design"><Palette /> Design</TabsTrigger>
                  <TabsTrigger value="seo"><Globe2 /> SEO</TabsTrigger>
                </TabsList>

                <TabsContent value="ai" className="space-y-5">
                  <Info title="AI campaign brief">
                    Define the audience and campaign angle. The generator only uses facts already stored on the product.
                  </Info>
                  <Field label="Target audience"><Input value={brief.audience || ''} onChange={(e) => setBrief({ ...brief, audience: e.target.value })} placeholder="Example: women 20-35 looking for premium everyday sneakers" /></Field>
                  <Field label="Campaign angle"><Input value={brief.campaignAngle || ''} onChange={(e) => setBrief({ ...brief, campaignAngle: e.target.value })} placeholder="Example: comfort, gifting, new collection, value" /></Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Tone">
                      <select className="h-10 w-full rounded-lg border bg-white px-3" value={brief.tone} onChange={(e) => setBrief({ ...brief, tone: e.target.value as LandingGenerationBrief['tone'] })}>
                        <option value="premium">Premium</option><option value="direct">Direct response</option><option value="friendly">Friendly</option><option value="minimal">Minimal</option>
                      </select>
                    </Field>
                    <Field label="Language">
                      <select className="h-10 w-full rounded-lg border bg-white px-3" value={brief.language} onChange={(e) => setBrief({ ...brief, language: e.target.value as LandingGenerationBrief['language'] })}>
                        <option value="fr">French</option><option value="ar">Arabic</option><option value="en">English</option>
                      </select>
                    </Field>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Design direction">
                      <select className="h-10 w-full rounded-lg border bg-white px-3" value={brief.designStyle} onChange={(e) => {
                        const designStyle = e.target.value as keyof typeof themePresets
                        const preset = themePresets[designStyle]
                        setBrief({ ...brief, designStyle, primaryColor: preset.primary })
                        setForm({ ...form, theme: { ...form.theme, ...preset } })
                      }}>
                        <option value="luxury">Luxury</option><option value="playful">Playful</option><option value="editorial">Editorial</option><option value="minimal">Minimal</option><option value="bold">Bold campaign</option>
                      </select>
                    </Field>
                    <ColorField label="Preferred color" value={brief.primaryColor || form.theme.primary} onChange={(primaryColor) => {
                      setBrief({ ...brief, primaryColor })
                      setForm({ ...form, theme: { ...form.theme, primary: primaryColor } })
                    }} />
                  </div>
                  <Field label="Shipping services on this page">
                    <div className="grid gap-2 rounded-xl border p-3">
                      {data.shippingZones.length ? data.shippingZones.map((zone) => {
                        const checked = (brief.shippingZoneIds || []).includes(zone.id)
                        return (
                          <label key={zone.id} className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm">
                            <span><strong>{zone.name}</strong><span className="ml-2 text-xs text-slate-500">{zone.carrier} · {money(zone.base_fee)}</span></span>
                            <input type="checkbox" checked={checked} onChange={() => {
                              const shippingZoneIds = checked
                                ? (brief.shippingZoneIds || []).filter((id) => id !== zone.id)
                                : [...(brief.shippingZoneIds || []), zone.id]
                              setBrief({ ...brief, shippingZoneIds })
                              setForm({ ...form, theme: { ...form.theme, allowedShippingZoneIds: shippingZoneIds } })
                            }} />
                          </label>
                        )
                      }) : <p className="text-xs text-amber-700">Create an active shipping zone before publishing.</p>}
                    </div>
                  </Field>
                  <Field label="Extra instructions"><Textarea rows={4} value={brief.extraInstructions || ''} onChange={(e) => setBrief({ ...brief, extraInstructions: e.target.value })} placeholder="Add factual positioning or details the AI should emphasize." /></Field>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700" disabled={Boolean(busy)} onClick={generate}>
                    {busy === 'generate' ? <Loader2 className="mr-2 animate-spin" /> : <Sparkles className="mr-2" />}
                    {page ? 'Regenerate professional copy' : 'Generate professional landing page'}
                  </Button>
                </TabsContent>

                <TabsContent value="content" className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="URL slug"><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: cleanSlug(e.target.value) })} /></Field>
                    <Field label="CTA button"><Input value={form.cta_text} onChange={(e) => setForm({ ...form, cta_text: e.target.value })} /></Field>
                  </div>
                  <Field label={`Headline (${form.headline.length}/180)`}><Input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} /></Field>
                  <Field label={`Subheadline (${form.subheadline.length}/260)`}><Textarea rows={3} value={form.subheadline} onChange={(e) => setForm({ ...form, subheadline: e.target.value })} /></Field>
                  <Field label="Sales description"><Textarea rows={7} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
                  <Field label="Benefits (one per line, minimum 3)"><Textarea rows={6} value={form.benefits.join('\n')} onChange={(e) => setForm({ ...form, benefits: textLines(e.target.value) })} /></Field>
                  <Field label="FAQ (one per line: Question | Answer)"><Textarea rows={7} value={form.faq.map((item) => `${item.question} | ${item.answer}`).join('\n')} onChange={(e) => setForm({ ...form, faq: faqLines(e.target.value) })} /></Field>
                  <Field label="Customer proof (one per line: Quote | Customer name)"><Textarea rows={4} value={form.social_proof.map((item) => `${item.quote} | ${item.author}`).join('\n')} onChange={(e) => setForm({ ...form, social_proof: proofLines(e.target.value) })} placeholder="Leave empty unless these are real customer quotes." /></Field>
                  <Field label="Urgency message (only when factual)"><Input value={form.urgency_text} onChange={(e) => setForm({ ...form, urgency_text: e.target.value })} placeholder="Example: Pre-orders close on 30 June" /></Field>
                </TabsContent>

                <TabsContent value="design" className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ColorField label="Primary color" value={form.theme.primary} onChange={(primary) => setForm({ ...form, theme: { ...form.theme, primary } })} />
                    <ColorField label="Accent color" value={form.theme.accent} onChange={(accent) => setForm({ ...form, theme: { ...form.theme, accent } })} />
                  </div>
                  <Field label="Visual style">
                    <select className="h-10 w-full rounded-lg border bg-white px-3" value={form.theme.style} onChange={(e) => {
                      const style = e.target.value as keyof typeof themePresets
                      setForm({ ...form, theme: { ...form.theme, ...themePresets[style] } })
                    }}>
                      <option value="luxury">Luxury</option><option value="playful">Playful</option><option value="editorial">Editorial</option><option value="minimal">Minimal</option><option value="bold">Bold campaign</option>
                    </select>
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ColorField label="Page background" value={form.theme.background || '#f8fafc'} onChange={(background) => setForm({ ...form, theme: { ...form.theme, background } })} />
                    <ColorField label="Card surface" value={form.theme.surface || '#ffffff'} onChange={(surface) => setForm({ ...form, theme: { ...form.theme, surface } })} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Typography"><select className="h-10 w-full rounded-lg border bg-white px-3" value={form.theme.font || 'outfit'} onChange={(e) => setForm({ ...form, theme: { ...form.theme, font: e.target.value as LandingPageInput['theme']['font'] } })}><option value="outfit">Outfit</option><option value="jakarta">Jakarta</option><option value="serif">Editorial serif</option></select></Field>
                    <Field label="Hero layout"><select className="h-10 w-full rounded-lg border bg-white px-3" value={form.theme.heroLayout || 'split'} onChange={(e) => setForm({ ...form, theme: { ...form.theme, heroLayout: e.target.value as LandingPageInput['theme']['heroLayout'] } })}><option value="split">Split</option><option value="editorial">Editorial</option><option value="spotlight">Spotlight</option></select></Field>
                    <Field label="Corners"><select className="h-10 w-full rounded-lg border bg-white px-3" value={form.theme.radius || 'rounded'} onChange={(e) => setForm({ ...form, theme: { ...form.theme, radius: e.target.value as LandingPageInput['theme']['radius'] } })}><option value="rounded">Rounded</option><option value="soft">Soft</option><option value="sharp">Sharp</option></select></Field>
                  </div>
                  <Field label="Top announcement"><Input value={form.theme.announcement || ''} onChange={(e) => setForm({ ...form, theme: { ...form.theme, announcement: e.target.value } })} placeholder="Livraison disponible dans toute l'Algerie" /></Field>
                  <Field label="Trust note"><Input value={form.theme.trustNote || ''} onChange={(e) => setForm({ ...form, theme: { ...form.theme, trustNote: e.target.value } })} placeholder="Confirmation telephonique avant expedition" /></Field>
                  <div className="grid gap-3 rounded-xl border p-4 text-sm">
                    <label className="flex items-center justify-between"><span>Show related products</span><input type="checkbox" checked={form.theme.showRelatedProducts ?? true} onChange={(e) => setForm({ ...form, theme: { ...form.theme, showRelatedProducts: e.target.checked } })} /></label>
                    <label className="flex items-center justify-between"><span>Show sticky mobile order button</span><input type="checkbox" checked={form.theme.showStickyCta ?? true} onChange={(e) => setForm({ ...form, theme: { ...form.theme, showStickyCta: e.target.checked } })} /></label>
                  </div>
                  <Info title="Product media">Photos come from the product catalog. Add multiple high-resolution images there for a stronger page.</Info>
                </TabsContent>

                <TabsContent value="seo" className="space-y-5">
                  <Field label={`SEO title (${form.seo.title.length}/70)`}><Input value={form.seo.title} onChange={(e) => setForm({ ...form, seo: { ...form.seo, title: e.target.value } })} /></Field>
                  <Field label={`SEO description (${form.seo.description.length}/170)`}><Textarea rows={4} value={form.seo.description} onChange={(e) => setForm({ ...form, seo: { ...form.seo, description: e.target.value } })} /></Field>
                  <div className="rounded-xl border p-4">
                    <p className="text-xs text-emerald-700">{landingUrl}</p>
                    <p className="mt-1 text-lg font-semibold text-blue-700">{form.seo.title || product.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{form.seo.description}</p>
                  </div>
                </TabsContent>
              </Tabs>

              {errors.length > 0 && (
                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="font-bold text-amber-900">Before publishing</p>
                  <ul className="mt-2 space-y-1 text-xs text-amber-800">
                    {errors.map((error) => <li key={error}>- {error}</li>)}
                  </ul>
                </div>
              )}
            </div>

            <div className="scrollbar-thin min-h-0 overflow-x-hidden overflow-y-auto overscroll-contain bg-slate-100 p-5 [touch-action:pan-y] lg:p-8">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Live preview</p>
                <span className="text-xs text-slate-400">Desktop</span>
              </div>
              <Preview product={product} form={form} images={images} company={data.agency.company_name} />
            </div>
          </div>

          <DialogFooter className="m-0 shrink-0 rounded-none border-t bg-white px-6 py-4 sm:justify-between">
            <div className="flex min-w-0 gap-2">
              {page?.status === 'published' && (
                <>
                  <Button variant="outline" onClick={() => window.open(landingUrl, '_blank')}><ExternalLink className="mr-2" /> Open live page</Button>
                  <Button variant="outline" onClick={() => navigator.clipboard.writeText(landingUrl)}><Clipboard className="mr-2" /> Copy link</Button>
                </>
              )}
            </div>
            <div className="flex gap-2">
              {page?.status === 'published' && <Button variant="outline" disabled={Boolean(busy)} onClick={unpublish}>Unpublish</Button>}
              <Button variant="outline" disabled={Boolean(busy)} onClick={saveDraft}>
                {busy === 'save' ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2" />} Save draft
              </Button>
              <Button disabled={Boolean(busy) || errors.length > 0} onClick={publish} className="bg-purple-600 hover:bg-purple-700">
                {busy === 'publish' ? <Loader2 className="mr-2 animate-spin" /> : <Globe2 className="mr-2" />} Publish
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>
}

function Info({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5"><h3 className="font-black text-purple-950">{title}</h3><p className="mt-1 text-xs leading-5 text-purple-800">{children}</p></div>
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <Field label={label}><div className="flex gap-2"><Input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-14 p-1" /><Input value={value} onChange={(e) => onChange(e.target.value)} /></div></Field>
}

function Preview({ product, form, images, company }: { product: EcommerceProduct; form: LandingPageInput; images: string[]; company: string }) {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border bg-white shadow-xl">
      <div className="flex items-center justify-between border-b px-5 py-3"><span className="text-sm font-black">{company}</span><span className="text-[10px] font-bold text-slate-400">Paiement a la livraison</span></div>
      <div className="grid gap-6 p-5 xl:grid-cols-2 xl:items-center">
        {images[0] ? <img src={images[0]} alt={product.name} className="aspect-square w-full rounded-2xl object-cover" /> : <div className="flex aspect-square items-center justify-center rounded-2xl bg-slate-100 text-xs font-bold text-slate-400">Add a product image</div>}
        <div>
          {form.urgency_text && <span className="mb-3 inline-flex rounded-full px-3 py-1 text-[10px] font-black text-white" style={{ backgroundColor: form.theme.primary }}>{form.urgency_text}</span>}
          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: form.theme.primary }}>{product.category}</p>
          <h2 className="mt-2 text-2xl font-black leading-tight" style={{ color: form.theme.accent }}>{form.headline || 'Your headline'}</h2>
          <p className="mt-3 text-xs leading-5 text-slate-600">{form.subheadline}</p>
          <p className="mt-4 text-xl font-black">{money(product.price)}</p>
          <div className="mt-4 space-y-2">{form.benefits.slice(0, 4).map((benefit) => <p key={benefit} className="flex gap-2 text-[11px] font-semibold text-slate-700"><CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: form.theme.primary }} />{benefit}</p>)}</div>
          <button type="button" className="mt-5 w-full rounded-xl px-4 py-3 text-xs font-black text-white" style={{ backgroundColor: form.theme.primary }}>{form.cta_text}</button>
        </div>
      </div>
      <div className="border-t bg-slate-50 p-5"><p className="line-clamp-4 whitespace-pre-line text-xs leading-5 text-slate-600">{form.description}</p><div className="mt-5 grid gap-2">{form.faq.slice(0, 3).map((item) => <div key={item.question} className="rounded-xl bg-white p-3 text-[11px] font-bold">{item.question}</div>)}</div></div>
    </div>
  )
}
