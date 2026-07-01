'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentAgencyContext } from '@/lib/server/agency-context'
import type {
  EcommerceStoreData,
  LandingGenerationBrief,
  LandingPageInput,
  ProductInput,
} from '@/types/ecommerce'
import {
  ECOMMERCE_CATEGORIES,
  ECOMMERCE_STOREFRONT_TEMPLATES,
  type EcommerceStorefrontConfig,
} from '@/lib/ecommerce-storefront'

const productSchema = z.object({
  id: z.string().uuid().optional(),
  sku: z.string().trim().min(2).max(80),
  name: z.string().trim().min(2).max(180),
  description: z.string().trim().max(5000).optional().default(''),
  category: z.string().trim().min(1).max(100).optional().default('general'),
  brand: z.string().trim().max(100).optional().default(''),
  price: z.coerce.number().min(0),
  compare_at_price: z.coerce.number().min(0).nullable().optional(),
  cost_price: z.coerce.number().min(0).nullable().optional(),
  stock_quantity: z.coerce.number().int().min(0),
  low_stock_threshold: z.coerce.number().int().min(0).optional().default(5),
  variants: z.unknown().optional().default([]),
  images: z.array(z.string().url()).max(12).optional().default([]),
  channels: z.array(z.string().min(1)).max(10).optional().default(['website']),
  status: z.enum(['draft', 'active', 'archived']).optional().default('active'),
  is_featured: z.boolean().optional().default(false),
})

const shippingSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  carrier: z.string().trim().min(2).max(120),
  wilayas: z.array(z.string().trim().min(1)).max(58).default([]),
  base_fee: z.coerce.number().min(0),
  cod_enabled: z.boolean().default(true),
  estimated_days: z.string().trim().max(80).optional().default(''),
  is_active: z.boolean().default(true),
})

const promotionSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  code: z.string().trim().min(2).max(40).transform((value) => value.toUpperCase()),
  discount_type: z.enum(['percentage', 'fixed', 'free_shipping']),
  discount_value: z.coerce.number().min(0),
  target: z.unknown().optional().default({}),
  starts_at: z.string().nullable().optional(),
  ends_at: z.string().nullable().optional(),
  status: z.enum(['draft', 'scheduled', 'live', 'expired', 'paused']),
})

const landingSchema = z.object({
  product_id: z.string().uuid(),
  slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  headline: z.string().trim().min(8).max(180),
  subheadline: z.string().trim().min(5).max(260),
  description: z.string().trim().min(20).max(4000),
  benefits: z.array(z.string().trim().min(3).max(220)).min(3).max(8),
  faq: z.array(z.object({
    question: z.string().trim().min(3).max(180),
    answer: z.string().trim().min(3).max(500),
  })).max(8),
  social_proof: z.array(z.object({
    quote: z.string().trim().min(3).max(400),
    author: z.string().trim().min(2).max(100),
  })).max(6),
  urgency_text: z.string().trim().max(180).optional().default(''),
  cta_text: z.string().trim().min(2).max(80),
  theme: z.object({
    primary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    background: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().default('#f8fafc'),
    surface: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().default('#ffffff'),
    text: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().default('#111827'),
    style: z.string().trim().min(2).max(40),
    font: z.enum(['outfit', 'jakarta', 'serif']).optional().default('outfit'),
    heroLayout: z.enum(['split', 'editorial', 'spotlight']).optional().default('split'),
    radius: z.enum(['soft', 'rounded', 'sharp']).optional().default('rounded'),
    badge: z.string().trim().max(60).optional().default(''),
    announcement: z.string().trim().max(140).optional().default(''),
    trustNote: z.string().trim().max(180).optional().default(''),
    allowedShippingZoneIds: z.array(z.string().uuid()).max(30).optional().default([]),
    showRelatedProducts: z.boolean().optional().default(true),
    showStickyCta: z.boolean().optional().default(true),
  }),
  seo: z.object({
    title: z.string().trim().min(5).max(70),
    description: z.string().trim().min(20).max(170),
  }),
  status: z.enum(['draft', 'published', 'archived']).optional().default('draft'),
})

const aiLandingSchema = landingSchema.omit({
  product_id: true,
  slug: true,
  status: true,
})

const landingBriefSchema = z.object({
  audience: z.string().trim().max(300).optional().default(''),
  campaignAngle: z.string().trim().max(300).optional().default(''),
  tone: z.enum(['premium', 'direct', 'friendly', 'minimal']).optional().default('premium'),
  language: z.enum(['fr', 'ar', 'en']).optional().default('fr'),
  extraInstructions: z.string().trim().max(800).optional().default(''),
  designStyle: z.enum(['luxury', 'playful', 'editorial', 'minimal', 'bold']).optional().default('luxury'),
  landingStyle: z.enum(['editorial', 'luxury', 'playful', 'minimal', 'bold']).optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  shippingZoneIds: z.array(z.string().uuid()).max(30).optional().default([]),
})


function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

async function imagePart(url: string) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) })
    if (!response.ok) return null
    const mimeType = response.headers.get('content-type')?.split(';')[0] || ''
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mimeType)) return null
    const bytes = Buffer.from(await response.arrayBuffer())
    if (bytes.length > 5 * 1024 * 1024) return null
    return { inlineData: { mimeType, data: bytes.toString('base64') } }
  } catch {
    return null
  }
}

async function generateWithGemini({
  systemInstruction,
  prompt,
  imageUrls,
}: {
  systemInstruction: string
  prompt: string
  imageUrls: string[]
}) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured')

  const imageParts = (await Promise.all(imageUrls.map(imagePart))).filter(
    (part): part is NonNullable<Awaited<ReturnType<typeof imagePart>>> => Boolean(part)
  )
  const jsonSchema = z.toJSONSchema(aiLandingSchema, { unrepresentable: 'any' }) as Record<string, unknown>
  delete jsonSchema.$schema

  const model = process.env.GEMINI_LANDING_MODEL || 'gemini-2.5-flash'
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{
          role: 'user',
          parts: [{ text: prompt }, ...imageParts],
        }],
        generationConfig: {
          temperature: 0.65,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
          responseJsonSchema: jsonSchema,
        },
      }),
    }
  )

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(body?.error?.message || `Gemini request failed with status ${response.status}`)
  }
  const rawText = body?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text || '')
    .join('')
    .trim()
  if (!rawText) throw new Error('Gemini returned an empty response')

  const parsedJson = JSON.parse(rawText)
  return aiLandingSchema.parse(parsedJson)
}

/**
 * Generate landing page content with OpenAI GPT-4o.
 * Used when OPENAI_API_KEY is available (preferred over Gemini).
 */
async function generateWithOpenAI({
  systemInstruction,
  prompt,
  imageUrls,
}: {
  systemInstruction: string
  prompt: string
  imageUrls: string[]
}) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured')

  const model = process.env.OPENAI_LANDING_MODEL || 'gpt-4o'

  // Build content parts — text first, then images
  const contentParts: Array<{ type: string; text?: string; image_url?: { url: string; detail: string } }> = [
    { type: 'text', text: `System: ${systemInstruction}\n\nUser: ${prompt}` },
    ...imageUrls.slice(0, 3).map((url) => ({
      type: 'image_url',
      image_url: { url, detail: 'low' },
    })),
  ]

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      response_format: { type: 'json_object' },
      temperature: 0.65,
      max_tokens: 4096,
      messages: [
        {
          role: 'system',
          content: `${systemInstruction}\n\nYou MUST respond with valid JSON that matches the exact schema provided by the user. Do not include any markdown, code blocks, or explanatory text — only raw JSON.`,
        },
        {
          role: 'user',
          content: contentParts,
        },
      ],
    }),
  })

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(
      body?.error?.message ||
        `OpenAI request failed with status ${response.status}: ${JSON.stringify(body)}`
    )
  }

  const rawText = body?.choices?.[0]?.message?.content?.trim()
  if (!rawText) throw new Error('OpenAI returned an empty response')

  const parsedJson = JSON.parse(rawText)
  return aiLandingSchema.parse(parsedJson)
}

async function requireEcommerceManager() {
  const context = await getCurrentAgencyContext()
  if (!context.userId || !context.agencyId) {
    return { success: false as const, error: 'Unauthorized' }
  }
  if (context.businessTypeSlug !== 'ecommerce') {
    return { success: false as const, error: 'This workspace is not an online store' }
  }
  if (!['superadmin', 'manager'].includes(context.role || '')) {
    return { success: false as const, error: 'Manager access is required' }
  }
  return {
    success: true as const,
    context: { ...context, agencyId: context.agencyId as string },
  }
}

function refreshEcommercePaths() {
  revalidatePath('/dashboard/store')
  revalidatePath('/dashboard/store/analytics')
  revalidatePath('/dashboard/store/customers')
  revalidatePath('/dashboard/store/products')
  revalidatePath('/dashboard/store/orders')
  revalidatePath('/dashboard/store/inventory')
  revalidatePath('/dashboard/store/shipping')
  revalidatePath('/dashboard/store/promotions')
  revalidatePath('/dashboard/store/storefront')
  revalidatePath('/', 'layout')
}

export async function getEcommerceStoreData(): Promise<
  { success: true; data: EcommerceStoreData } | { success: false; error: string }
> {
  const guard = await requireEcommerceManager()
  if (!guard.success) return guard

  const supabase: any = await createClient()
  const agencyId = guard.context.agencyId

  const [agencyResult, productsResult, pagesResult, ordersResult, shippingResult, promotionsResult] =
    await Promise.all([
      supabase
        .from('agencies')
        .select('id, company_name, subdomain, phone, website_settings, custom_domain')
        .eq('id', agencyId)
        .single(),
      (supabase.from('ecommerce_products') as any)
        .select('*')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false }),
      (supabase.from('ecommerce_product_pages') as any)
        .select('*')
        .eq('agency_id', agencyId),
      (supabase.from('ecommerce_orders') as any)
        .select('*')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false })
        .limit(500),
      (supabase.from('ecommerce_shipping_zones') as any)
        .select('*')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false }),
      (supabase.from('ecommerce_promotions') as any)
        .select('*')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false }),
    ])

  const error =
    agencyResult.error ||
    productsResult.error ||
    pagesResult.error ||
    ordersResult.error ||
    shippingResult.error ||
    promotionsResult.error

  if (error || !agencyResult.data) {
    return { success: false, error: error?.message || 'Store data could not be loaded' }
  }

  const pagesByProduct = new Map(
    ((pagesResult.data || []) as any[]).map((page) => [page.product_id, page])
  )
  const products = ((productsResult.data || []) as any[]).map((product) => ({
    ...product,
    landing_page: pagesByProduct.get(product.id) || null,
  }))
  const orders = (ordersResult.data || []) as any[]
  const pages = (pagesResult.data || []) as any[]

  return {
    success: true,
    data: {
      agency: agencyResult.data as EcommerceStoreData['agency'],
      products,
      orders,
      shippingZones: (shippingResult.data || []) as any[],
      promotions: (promotionsResult.data || []) as any[],
      stats: {
        revenue: orders
          .filter((order) => order.payment_status === 'paid' || order.fulfillment_status === 'delivered')
          .reduce((sum, order) => sum + Number(order.total || 0), 0),
        openOrders: orders.filter((order) =>
          !['delivered', 'returned', 'cancelled'].includes(order.fulfillment_status)
        ).length,
        productsOnline: products.filter((product) => product.status === 'active').length,
        lowStock: products.filter(
          (product) => product.stock_quantity <= product.low_stock_threshold
        ).length,
        landingViews: pages.reduce((sum, page) => sum + Number(page.views || 0), 0),
        landingConversions: pages.reduce(
          (sum, page) => sum + Number(page.conversions || 0),
          0
        ),
      },
    },
  }
}

export async function saveEcommerceProduct(input: ProductInput) {
  const guard = await requireEcommerceManager()
  if (!guard.success) return guard

  const parsed = productSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message || 'Invalid product' }

  const supabase: any = await createClient()
  const { id, ...values } = parsed.data
  const payload = {
    ...values,
    agency_id: guard.context.agencyId,
    brand: values.brand || null,
    description: values.description || null,
    compare_at_price: values.compare_at_price || null,
    cost_price: values.cost_price || null,
  }

  const query = id
    ? (supabase.from('ecommerce_products') as any)
        .update(payload)
        .eq('id', id)
        .eq('agency_id', guard.context.agencyId)
    : (supabase.from('ecommerce_products') as any).insert(payload)

  const { data, error } = await query.select('*').single()
  if (error) return { success: false, error: error.message }

  refreshEcommercePaths()
  return { success: true, product: data }
}

export async function deleteEcommerceProduct(productId: string) {
  const guard = await requireEcommerceManager()
  if (!guard.success) return guard
  if (!z.string().uuid().safeParse(productId).success) {
    return { success: false, error: 'Invalid product ID' }
  }

  const supabase: any = await createClient()
  const { error } = await (supabase.from('ecommerce_products') as any)
    .delete()
    .eq('id', productId)
    .eq('agency_id', guard.context.agencyId)

  if (error) return { success: false, error: error.message }
  refreshEcommercePaths()
  return { success: true }
}

export async function adjustEcommerceStock(productId: string, stockQuantity: number) {
  const guard = await requireEcommerceManager()
  if (!guard.success) return guard
  const parsed = z.object({
    productId: z.string().uuid(),
    stockQuantity: z.coerce.number().int().min(0),
  }).safeParse({ productId, stockQuantity })
  if (!parsed.success) return { success: false, error: 'Invalid stock value' }

  const supabase: any = await createClient()
  const { error } = await (supabase.from('ecommerce_products') as any)
    .update({ stock_quantity: parsed.data.stockQuantity })
    .eq('id', parsed.data.productId)
    .eq('agency_id', guard.context.agencyId)

  if (error) return { success: false, error: error.message }
  refreshEcommercePaths()
  return { success: true }
}

export async function updateEcommerceOrder(
  orderId: string,
  updates: { fulfillment_status?: string; payment_status?: string; notes?: string }
) {
  const guard = await requireEcommerceManager()
  if (!guard.success) return guard

  const parsed = z.object({
    orderId: z.string().uuid(),
    fulfillment_status: z.enum([
      'new', 'confirmed', 'packed', 'shipped', 'delivered', 'returned', 'cancelled',
    ]).optional(),
    payment_status: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
    notes: z.string().max(2000).optional(),
  }).safeParse({ orderId, ...updates })
  if (!parsed.success) return { success: false, error: 'Invalid order update' }

  const { orderId: validOrderId, ...payload } = parsed.data
  const supabase: any = await createClient()
  const { error } = await (supabase.from('ecommerce_orders') as any)
    .update(payload)
    .eq('id', validOrderId)
    .eq('agency_id', guard.context.agencyId)

  if (error) return { success: false, error: error.message }
  refreshEcommercePaths()
  return { success: true }
}

export async function saveEcommerceShippingZone(input: unknown) {
  const guard = await requireEcommerceManager()
  if (!guard.success) return guard
  const parsed = shippingSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message || 'Invalid shipping zone' }

  const supabase: any = await createClient()
  const { id, ...values } = parsed.data
  const payload = {
    ...values,
    agency_id: guard.context.agencyId,
    estimated_days: values.estimated_days || null,
  }
  const query = id
    ? (supabase.from('ecommerce_shipping_zones') as any)
        .update(payload)
        .eq('id', id)
        .eq('agency_id', guard.context.agencyId)
    : (supabase.from('ecommerce_shipping_zones') as any).insert(payload)
  const { data, error } = await query.select('*').single()
  if (error) return { success: false, error: error.message }
  refreshEcommercePaths()
  return { success: true, shippingZone: data }
}

export async function deleteEcommerceShippingZone(id: string) {
  const guard = await requireEcommerceManager()
  if (!guard.success) return guard
  const supabase: any = await createClient()
  const { error } = await (supabase.from('ecommerce_shipping_zones') as any)
    .delete()
    .eq('id', id)
    .eq('agency_id', guard.context.agencyId)
  if (error) return { success: false, error: error.message }
  refreshEcommercePaths()
  return { success: true }
}

export async function saveEcommercePromotion(input: unknown) {
  const guard = await requireEcommerceManager()
  if (!guard.success) return guard
  const parsed = promotionSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message || 'Invalid promotion' }

  const supabase: any = await createClient()
  const { id, ...values } = parsed.data
  const payload = {
    ...values,
    agency_id: guard.context.agencyId,
    starts_at: values.starts_at || null,
    ends_at: values.ends_at || null,
  }
  const query = id
    ? (supabase.from('ecommerce_promotions') as any)
        .update(payload)
        .eq('id', id)
        .eq('agency_id', guard.context.agencyId)
    : (supabase.from('ecommerce_promotions') as any).insert(payload)
  const { data, error } = await query.select('*').single()
  if (error) return { success: false, error: error.message }
  refreshEcommercePaths()
  return { success: true, promotion: data }
}

export async function deleteEcommercePromotion(id: string) {
  const guard = await requireEcommerceManager()
  if (!guard.success) return guard
  const supabase: any = await createClient()
  const { error } = await (supabase.from('ecommerce_promotions') as any)
    .delete()
    .eq('id', id)
    .eq('agency_id', guard.context.agencyId)
  if (error) return { success: false, error: error.message }
  refreshEcommercePaths()
  return { success: true }
}

export async function saveEcommerceLandingPage(input: LandingPageInput) {
  const guard = await requireEcommerceManager()
  if (!guard.success) return guard
  const parsed = landingSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message || 'Invalid landing page' }

  const supabase: any = await createClient()
  const { data: product } = await (supabase.from('ecommerce_products') as any)
    .select('id')
    .eq('id', parsed.data.product_id)
    .eq('agency_id', guard.context.agencyId)
    .maybeSingle()
  if (!product) return { success: false, error: 'Product not found' }

  const payload = {
    ...parsed.data,
    agency_id: guard.context.agencyId,
    urgency_text: parsed.data.urgency_text || null,
    published_at: parsed.data.status === 'published' ? new Date().toISOString() : null,
  }
  const { data, error } = await (supabase.from('ecommerce_product_pages') as any)
    .upsert(payload, { onConflict: 'product_id' })
    .select('*')
    .single()
  if (error) return { success: false, error: error.message }
  refreshEcommercePaths()
  revalidatePath(`/shop/${parsed.data.slug}`)
  return { success: true, landingPage: data }
}

export async function generateEcommerceLandingPage(
  productId: string,
  brief?: LandingGenerationBrief
) {
  const guard = await requireEcommerceManager()
  if (!guard.success) return guard

  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY)
  const hasGemini = Boolean(process.env.GEMINI_API_KEY)
  if (!hasOpenAI && !hasGemini) {
    return { success: false, error: 'No AI API key configured (OPENAI_API_KEY or GEMINI_API_KEY required)' }
  }

  const parsedBrief = landingBriefSchema.safeParse(brief || {})
  if (!parsedBrief.success) {
    return { success: false, error: parsedBrief.error.issues[0]?.message || 'Invalid campaign brief' }
  }

  const supabase: any = await createClient()
  const [{ data: product }, { data: agency }, { data: shippingZones }] = await Promise.all([
    (supabase.from('ecommerce_products') as any)
      .select('*')
      .eq('id', productId)
      .eq('agency_id', guard.context.agencyId)
      .single(),
    supabase
      .from('agencies')
      .select('company_name, city')
      .eq('id', guard.context.agencyId)
      .single(),
    (supabase.from('ecommerce_shipping_zones') as any)
      .select('id, name, carrier, base_fee, estimated_days, cod_enabled')
      .eq('agency_id', guard.context.agencyId)
      .eq('is_active', true),
  ])
  if (!product || !agency) return { success: false, error: 'Product not found' }

  try {
    const productImages: string[] = Array.isArray(product.images)
      ? product.images.filter((image: unknown): image is string => typeof image === 'string').slice(0, 3)
      : []
    const designStyle = parsedBrief.data.landingStyle || parsedBrief.data.designStyle || 'editorial'

    const styleDescriptions: Record<string, string> = {
      editorial: 'Magazine editorial style with large bold typography, high whitespace, clean ink-black/white palette, numbered benefit list, photo-first layout',
      luxury: 'Dark luxury premium style with gold/dark color palette, elegant high-end copy, exclusive brand language, dark backgrounds',
      playful: 'Colorful energetic style with bright vivid colors, emoji usage, rounded corners, fun enthusiastic copy, youthful language',
      minimal: 'Ultra-clean minimalist style with lots of whitespace, neutral grays, understated typography, concise copy, almost no decoration',
      bold: 'High-contrast bold impact style with strong CTA focus, uppercase headlines, vivid accent colors, urgency-driven copy, large price display',
    }

    const systemInstruction = `You are a senior ecommerce creative director and conversion copywriter for the Algerian market.
Create a complete, polished product landing page from the supplied facts.

Design style requested: ${designStyle} — ${styleDescriptions[designStyle] || 'modern professional'}

Rules:
- Write in the requested language and match the requested tone.
- Make the headline specific, benefit-led, and suitable for paid social traffic.
- Produce 4 to 6 concise benefits and 3 to 5 useful FAQs.
- Never invent product capabilities, certifications, guarantees, reviews, medical claims, delivery times, or scarcity.
- social_proof must be empty unless factual proof is supplied.
- urgency_text must be empty unless the supplied facts justify urgency.
- Prices are in DZD and checkout uses cash on delivery.
- SEO title should be 50 to 65 characters; SEO description should be 120 to 160 characters.
- Create a coherent visual system in theme matching the design style: set theme.style to "${designStyle}".
- Choose accessible color contrast. background and surface must remain appropriate for ecommerce readability.
- For editorial style: use dark ink background=#fafaf8, surface=#ffffff, primary=#0f172a
- For luxury style: use dark backgrounds like background=#08080e, surface=#111111, primary=#d4af37
- For playful style: use bright warm backgrounds, vibrant primary color like #f59e0b or #ec4899
- For minimal style: use pure white background=#ffffff, surface=#fafafa, primary=#18181b
- For bold style: use dark accent background=#0f172a for hero, primary=#dc2626 or strong brand color
- badge, announcement, and trustNote must be short, factual, and useful.
- Preserve the supplied shippingZoneIds in theme.allowedShippingZoneIds.
- Return production-quality copy, not placeholders or commentary.
- Product images are visual context only. Do not infer hidden materials, specifications, authenticity, health claims, or guarantees from an image.
- IMPORTANT: theme.style MUST be set to exactly "${designStyle}"`

    const promptPayload = JSON.stringify({
      store: agency.company_name,
      city: agency.city,
      campaign: { ...parsedBrief.data, designStyle, landingStyle: designStyle },
      available_shipping: shippingZones || [],
      product: {
        name: product.name,
        sku: product.sku,
        category: product.category,
        brand: product.brand,
        description: product.description,
        price: product.price,
        compare_at_price: product.compare_at_price,
        variants: product.variants,
        images_count: productImages.length,
      },
    })

    // Prefer OpenAI GPT-4o; fall back to Gemini if not available
    const generated = hasOpenAI
      ? await generateWithOpenAI({ systemInstruction, prompt: promptPayload, imageUrls: productImages })
      : await generateWithGemini({ systemInstruction, prompt: promptPayload, imageUrls: productImages })

    // Force theme.style to the requested design style
    generated.theme.style = designStyle

    const baseSlug = slugify(product.name) || `product-${product.id.slice(0, 8)}`
    const { data: existing } = await (supabase.from('ecommerce_product_pages') as any)
      .select('slug, status')
      .eq('product_id', product.id)
      .maybeSingle()

    const payload = {
      ...generated,
      theme: {
        ...generated.theme,
        primary: parsedBrief.data.primaryColor || generated.theme.primary,
        allowedShippingZoneIds: parsedBrief.data.shippingZoneIds,
      },
      agency_id: guard.context.agencyId,
      product_id: product.id,
      slug: existing?.slug || `${baseSlug}-${product.id.slice(0, 6)}`,
      status: existing?.status || 'draft',
      generated_by_ai: true,
    }
    const { data, error } = await (supabase.from('ecommerce_product_pages') as any)
      .upsert(payload, { onConflict: 'product_id' })
      .select('*')
      .single()
    if (error) return { success: false, error: error.message }
    refreshEcommercePaths()
    return { success: true, landingPage: data }
  } catch (error) {
    console.error('Landing page generation failed', error)
    const message = error instanceof Error ? error.message : 'Unknown generation error'
    return {
      success: false,
      error: message.includes('API key') || message.includes('API_KEY')
        ? 'The AI API key is invalid or unavailable.'
        : `AI generation failed: ${message}`,
    }
  }
}

export async function setEcommerceLandingStatus(
  productId: string,
  status: 'draft' | 'published' | 'archived'
) {
  const guard = await requireEcommerceManager()
  if (!guard.success) return guard
  const parsed = z.object({
    productId: z.string().uuid(),
    status: z.enum(['draft', 'published', 'archived']),
  }).safeParse({ productId, status })
  if (!parsed.success) return { success: false, error: 'Invalid landing-page status' }

  const supabase: any = await createClient()
  const { data, error } = await (supabase.from('ecommerce_product_pages') as any)
    .update({
      status: parsed.data.status,
      published_at: parsed.data.status === 'published' ? new Date().toISOString() : null,
    })
    .eq('product_id', parsed.data.productId)
    .eq('agency_id', guard.context.agencyId)
    .select('*')
    .single()
  if (error) return { success: false, error: error.message }
  refreshEcommercePaths()
  if (data?.slug) revalidatePath(`/shop/${data.slug}`)
  return { success: true, landingPage: data }
}

export async function uploadEcommerceImage(formData: FormData) {
  const guard = await requireEcommerceManager()
  if (!guard.success) return guard
  const file = formData.get('file')
  if (!(file instanceof File)) return { success: false, error: 'No file provided' }
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
    return { success: false, error: 'Only JPG, PNG, WebP and GIF images are allowed' }
  }
  if (file.size > 10 * 1024 * 1024) {
    return { success: false, error: 'Image must be smaller than 10 MB' }
  }

  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${guard.context.agencyId}/${crypto.randomUUID()}.${extension}`
  const admin: any = createAdminClient()
  const { error } = await admin.storage
    .from('ecommerce-assets')
    .upload(path, file, { contentType: file.type, cacheControl: '31536000' })
  if (error) return { success: false, error: error.message }
  const { data } = admin.storage.from('ecommerce-assets').getPublicUrl(path)
  return { success: true, url: data.publicUrl }
}

const publicOrderSchema = z.object({
  agencyId: z.string().uuid(),
  productId: z.string().uuid(),
  landingPageId: z.string().uuid().nullable().optional(),
  customerName: z.string().trim().min(2).max(120),
  customerPhone: z.string().trim().min(8).max(30),
  customerCity: z.string().trim().max(100).optional().default(''),
  customerAddress: z.string().trim().min(5).max(500),
  quantity: z.coerce.number().int().min(1).max(20),
  variant: z.record(z.string(), z.string()).optional().default({}),
  shippingZoneId: z.string().uuid().nullable().optional(),
  promotionCode: z.string().trim().max(40).optional().default(''),
  notes: z.string().trim().max(1000).optional().default(''),
  campaign: z.record(z.string(), z.string()).optional().default({}),
})

export async function placePublicEcommerceOrder(input: unknown) {
  const parsed = publicOrderSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid order' }
  }

  const admin: any = createAdminClient()
  const values = parsed.data

  const { data: product } = await (admin.from('ecommerce_products') as any)
    .select('id, agency_id, price, status')
    .eq('id', values.productId)
    .eq('agency_id', values.agencyId)
    .eq('status', 'active')
    .maybeSingle()

  if (!product) return { success: false, error: 'Product is unavailable' }

  if (values.shippingZoneId) {
    const { data: shippingZone } = await (admin.from('ecommerce_shipping_zones') as any)
      .select('id, wilayas, is_active')
      .eq('id', values.shippingZoneId)
      .eq('agency_id', values.agencyId)
      .eq('is_active', true)
      .maybeSingle()

    if (!shippingZone) return { success: false, error: 'Shipping option is unavailable' }

    const allowedWilayas = Array.isArray(shippingZone.wilayas)
      ? shippingZone.wilayas.filter((wilaya: unknown): wilaya is string => typeof wilaya === 'string')
      : []
    const requestedCity = values.customerCity.trim().toLowerCase()
    if (
      allowedWilayas.length > 0 &&
      requestedCity &&
      !allowedWilayas.some((wilaya: string) => wilaya.trim().toLowerCase() === requestedCity)
    ) {
      return { success: false, error: 'Shipping is unavailable for this city or wilaya' }
    }
  }

  if (values.promotionCode) {
    const { data: promotion } = await (admin.from('ecommerce_promotions') as any)
      .select('*')
      .eq('agency_id', values.agencyId)
      .ilike('code', values.promotionCode.trim())
      .eq('status', 'live')
      .maybeSingle()

    const now = Date.now()
    if (
      !promotion ||
      (promotion.starts_at && new Date(promotion.starts_at).getTime() > now) ||
      (promotion.ends_at && new Date(promotion.ends_at).getTime() < now)
    ) {
      return { success: false, error: 'Promotion code is invalid or expired' }
    }

    const target = promotion.target && typeof promotion.target === 'object'
      ? promotion.target as Record<string, unknown>
      : {}
    const targetProductIds = Array.isArray(target.product_ids)
      ? target.product_ids.filter((id): id is string => typeof id === 'string')
      : []
    if (targetProductIds.length > 0 && !targetProductIds.includes(values.productId)) {
      return { success: false, error: 'Promotion does not apply to this product' }
    }

    const subtotal = Number(product.price || 0) * values.quantity
    const minOrder = Number(target.min_order_amount ?? target.minimum_order ?? 0)
    if (minOrder > 0 && subtotal < minOrder) {
      return { success: false, error: `Promotion requires a minimum order of ${minOrder.toLocaleString('fr-DZ')} DZD` }
    }

    const usageLimit = Number(target.usage_limit ?? target.usageLimit ?? target.max_uses ?? 0)
    if (usageLimit > 0) {
      const { count, error: countError } = await (admin.from('ecommerce_orders') as any)
        .select('id', { count: 'exact', head: true })
        .eq('agency_id', values.agencyId)
        .ilike('promotion_code', promotion.code)

      if (countError) return { success: false, error: countError.message }
      if ((count || 0) >= usageLimit) {
        return { success: false, error: 'Promotion usage limit has been reached' }
      }
    }
  }

  const { data, error } = await (admin.rpc as any)('place_ecommerce_order', {
    p_agency_id: values.agencyId,
    p_product_id: values.productId,
    p_landing_page_id: values.landingPageId || null,
    p_customer_name: values.customerName,
    p_customer_phone: values.customerPhone,
    p_customer_city: values.customerCity,
    p_customer_address: values.customerAddress,
    p_quantity: values.quantity,
    p_variant: values.variant,
    p_shipping_zone_id: values.shippingZoneId || null,
    p_promotion_code: values.promotionCode || null,
    p_notes: values.notes || null,
    p_campaign: values.campaign,
  })

  if (error) return { success: false, error: error.message }
  return { success: true, order: data }
}

// ─── Store Theme ──────────────────────────────────────────────────────────────

const storefrontTemplateIds = new Set(ECOMMERCE_STOREFRONT_TEMPLATES.map((template) => template.id))
const storefrontCategoryIds = new Set(ECOMMERCE_CATEGORIES.map((category) => category.id))

const storefrontConfigSchema = z.object({
  version: z.literal(1),
  templateId: z.string().refine((value) => storefrontTemplateIds.has(value as any), 'Invalid storefront template'),
  category: z.string().refine((value) => storefrontCategoryIds.has(value as any), 'Invalid store category'),
  storeName: z.string().trim().min(1).max(100),
  announcement: z.string().trim().max(160),
  heroEyebrow: z.string().trim().max(80),
  heroTitle: z.string().trim().min(1).max(160),
  heroSubtitle: z.string().trim().max(320),
  heroImage: z.string().trim().url(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  surfaceColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  textColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  headingFont: z.enum(['sans', 'serif', 'display']),
  heroLayout: z.enum(['split', 'editorial', 'centered']),
  productCardStyle: z.enum(['soft', 'editorial', 'bold']),
  borderRadius: z.number().int().min(0).max(40),
  showAnnouncement: z.boolean(),
  showCategories: z.boolean(),
  showFeaturedProducts: z.boolean(),
  showAllProducts: z.boolean(),
  showTrustBar: z.boolean(),
  showNewsletter: z.boolean(),
  featuredTitle: z.string().trim().min(1).max(100),
  catalogTitle: z.string().trim().min(1).max(100),
  trustItems: z.array(z.object({
    title: z.string().trim().min(1).max(80),
    text: z.string().trim().min(1).max(140),
  })).min(1).max(6),
  logoUrl: z.string().trim().max(1000),
  navStyle: z.enum(['boxed', 'full', 'minimal']),
  catalogSubtitle: z.string().trim().max(320),
  catalogColumns: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  showPromoSection: z.boolean(),
  promoEyebrow: z.string().trim().max(80),
  promoTitle: z.string().trim().max(160),
  promoText: z.string().trim().max(500),
  promoImage: z.string().trim().url(),
  aboutTitle: z.string().trim().max(160),
  aboutText: z.string().trim().max(2000),
  contactTitle: z.string().trim().max(160),
  contactSubtitle: z.string().trim().max(500),
  contactEmail: z.string().trim().max(160),
  contactAddress: z.string().trim().max(500),
  footerTagline: z.string().trim().max(320),
  instagramUrl: z.string().trim().max(1000),
  facebookUrl: z.string().trim().max(1000),
  enableSearch: z.boolean(),
  enableCart: z.boolean(),
  shippingPolicy: z.string().trim().max(5000),
  returnsPolicy: z.string().trim().max(5000),
  privacyPolicy: z.string().trim().max(5000),
  termsPolicy: z.string().trim().max(5000),
})

export async function updateEcommerceStorefrontConfig(input: EcommerceStorefrontConfig) {
  const guard = await requireEcommerceManager()
  if (!guard.success) return guard

  const parsed = storefrontConfigSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid storefront settings' }
  }

  const config = parsed.data as EcommerceStorefrontConfig
  const supabase = await createClient()
  const { data: agency, error: agencyError } = await (supabase as any)
    .from('agencies')
    .select('website_settings')
    .eq('id', guard.context.agencyId)
    .single()

  if (agencyError) return { success: false, error: agencyError.message }

  const currentSettings = agency?.website_settings && typeof agency.website_settings === 'object'
    ? agency.website_settings as Record<string, unknown>
    : {}

  const { error } = await (supabase as any)
    .from('agencies')
    .update({
      website_settings: {
        ...currentSettings,
        store_category: config.category,
        store_template_id: config.templateId,
        store_theme: config.templateId,
        storefront_config: config,
      },
    })
    .eq('id', guard.context.agencyId)

  if (error) return { success: false, error: error.message }

  await (supabase as any).from('website_configs').upsert(
    {
      agency_id: guard.context.agencyId,
      builder_data: {
        kind: 'ecommerce-storefront',
        version: 1,
        storefront: config,
      },
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'agency_id' }
  )

  refreshEcommercePaths()
  return { success: true, config }
}

const VALID_STORE_THEMES = ['sole-district'] as const

/**
 * Saves the chosen store theme to agency.website_settings.store_theme.
 * The theme is read by EcommercePublicSite and routes to the matching component.
 */
export async function updateEcommerceStoreTheme(theme: string) {
  const guard = await requireEcommerceManager()
  if (!guard.success) return guard

  const parsed = z.enum(VALID_STORE_THEMES).safeParse(theme)
  if (!parsed.success) {
    return { success: false, error: `Theme invalide. Choisissez: ${VALID_STORE_THEMES.join(', ')}` }
  }

  const supabase = await createClient()

  // Fetch current website_settings so we can merge rather than overwrite
  const { data: agency } = await (supabase as any)
    .from('agencies')
    .select('website_settings')
    .eq('id', guard.context.agencyId)
    .single()

  const currentSettings = (agency?.website_settings && typeof agency.website_settings === 'object')
    ? (agency.website_settings as Record<string, unknown>)
    : {}

  const { error } = await (supabase as any)
    .from('agencies')
    .update({
      website_settings: {
        ...currentSettings,
        store_theme: parsed.data,
      },
    })
    .eq('id', guard.context.agencyId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/store/appearance')
  revalidatePath('/')

  return { success: true, theme: parsed.data }
}
