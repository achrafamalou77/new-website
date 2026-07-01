import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import EcommerceLandingPage from '@/components/website/EcommerceLandingPage'
import { ECOMMERCE_BUSINESS_TYPE_SLUGS } from '@/lib/business-types'

type Params = Promise<{ subdomain: string; slug: string }>

async function loadPage(subdomain: string, slug: string) {
  const db: any = createAdminClient()
  const { data: agency } = await db
    .from('agencies')
    .select('id, company_name, phone, business_type_slug')
    .eq('subdomain', subdomain)
    .in('business_type_slug', ECOMMERCE_BUSINESS_TYPE_SLUGS)
    .maybeSingle()
  if (!agency) return null

  const { data: landing } = await db
    .from('ecommerce_product_pages')
    .select('*')
    .eq('agency_id', agency.id)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()
  if (!landing) return null

  const [{ data: product }, { data: shippingZones }, { data: relatedProducts }] = await Promise.all([
    db.from('ecommerce_products').select('*').eq('id', landing.product_id).eq('agency_id', agency.id).eq('status', 'active').maybeSingle(),
    db.from('ecommerce_shipping_zones').select('*').eq('agency_id', agency.id).eq('is_active', true).order('base_fee'),
    db.from('ecommerce_products').select('*').eq('agency_id', agency.id).eq('status', 'active').neq('id', landing.product_id).limit(4),
  ])
  if (!product) return null
  const allowedIds = Array.isArray(landing.theme?.allowedShippingZoneIds)
    ? landing.theme.allowedShippingZoneIds
    : []
  const availableShipping = allowedIds.length
    ? (shippingZones || []).filter((zone: { id: string }) => allowedIds.includes(zone.id))
    : shippingZones || []
  return { agency, landing, product, shippingZones: availableShipping, relatedProducts: relatedProducts || [] }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { subdomain, slug } = await params
  const data = await loadPage(subdomain, slug)
  if (!data) return { title: 'Produit introuvable' }
  const seo = data.landing.seo || {}
  const image = Array.isArray(data.product.images) ? data.product.images[0] : undefined
  return {
    title: seo.title || data.landing.headline,
    description: seo.description || data.landing.subheadline,
    openGraph: {
      title: seo.title || data.landing.headline,
      description: seo.description || data.landing.subheadline,
      images: image ? [{ url: image }] : [],
      type: 'website',
    },
  }
}

export default async function ProductLandingPage({ params }: { params: Params }) {
  const { subdomain, slug } = await params
  const data = await loadPage(subdomain, slug)
  if (!data) notFound()

  const db: any = createAdminClient()
  await db
    .from('ecommerce_product_pages')
    .update({ views: Number(data.landing.views || 0) + 1 })
    .eq('id', data.landing.id)

  return <EcommerceLandingPage {...data} />
}
