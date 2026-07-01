import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import EcommerceProductDetail from '@/components/website/EcommerceProductDetail'
import {
  normalizeEcommerceStorefrontConfig,
  type EcommerceStorefrontConfig,
} from '@/lib/ecommerce-storefront'
import { ECOMMERCE_BUSINESS_TYPE_SLUGS } from '@/lib/business-types'

type Params = Promise<{ subdomain: string; id: string }>

async function loadProduct(subdomain: string, id: string) {
  const db: any = createAdminClient()
  const { data: agency } = await db
    .from('agencies')
    .select('id, company_name, phone, website_settings, business_type_slug')
    .eq('subdomain', subdomain)
    .in('business_type_slug', ECOMMERCE_BUSINESS_TYPE_SLUGS)
    .maybeSingle()

  if (!agency) return null

  const [{ data: product }, { data: landing }] = await Promise.all([
    db
      .from('ecommerce_products')
      .select('*')
      .eq('id', id)
      .eq('agency_id', agency.id)
      .eq('status', 'active')
      .maybeSingle(),
    db
      .from('ecommerce_product_pages')
      .select('*')
      .eq('product_id', id)
      .eq('agency_id', agency.id)
      .eq('status', 'published')
      .maybeSingle(),
  ])

  if (!product) return null

  const { data: relatedProducts } = await db
    .from('ecommerce_products')
    .select('*')
    .eq('agency_id', agency.id)
    .eq('status', 'active')
    .neq('id', product.id)
    .eq('category', product.category)
    .limit(4)

  const settings = agency.website_settings || {}
  const storedConfig = settings.storefront_config as EcommerceStorefrontConfig | undefined
  const config = normalizeEcommerceStorefrontConfig(storedConfig, agency.company_name, settings.store_template_id)

  return {
    agency,
    product,
    landing: landing || null,
    relatedProducts: relatedProducts || [],
    config,
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { subdomain, id } = await params
  const data = await loadProduct(subdomain, id)
  if (!data) return { title: 'Product not found' }
  const image = Array.isArray(data.product.images) ? data.product.images[0] : undefined

  return {
    title: `${data.product.name} | ${data.agency.company_name}`,
    description: data.product.description || `View ${data.product.name} and order online.`,
    openGraph: {
      title: data.product.name,
      description: data.product.description || `Available from ${data.agency.company_name}`,
      images: image ? [{ url: image }] : [],
      type: 'website',
    },
  }
}

export default async function EcommerceProductPage({ params }: { params: Params }) {
  const { subdomain, id } = await params
  const data = await loadProduct(subdomain, id)
  if (!data) notFound()

  return <EcommerceProductDetail {...data} />
}
