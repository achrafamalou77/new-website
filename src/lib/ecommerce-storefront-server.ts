import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import {
  normalizeEcommerceStorefrontConfig,
  type EcommerceStorefrontConfig,
} from '@/lib/ecommerce-storefront'
import { ECOMMERCE_BUSINESS_TYPE_SLUGS } from '@/lib/business-types'

export async function loadEcommerceStore(subdomain: string) {
  const db: any = createAdminClient()
  const { data: agency } = await db
    .from('agencies')
    .select('id, company_name, phone, email, address, subdomain, custom_domain, website_settings, business_type_slug')
    .eq('subdomain', subdomain)
    .in('business_type_slug', ECOMMERCE_BUSINESS_TYPE_SLUGS)
    .maybeSingle()

  if (!agency) return null

  const [{ data: products }, { data: pages }] = await Promise.all([
    db
      .from('ecommerce_products')
      .select('*')
      .eq('agency_id', agency.id)
      .eq('status', 'active')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false }),
    db
      .from('ecommerce_product_pages')
      .select('*')
      .eq('agency_id', agency.id)
      .eq('status', 'published'),
  ])

  const settings = agency.website_settings || {}
  const config = normalizeEcommerceStorefrontConfig(
    settings.storefront_config as Partial<EcommerceStorefrontConfig> | undefined,
    agency.company_name,
    settings.store_template_id
  )

  if (!config.contactEmail && agency.email) config.contactEmail = agency.email
  if ((!config.contactAddress || config.contactAddress === 'Algeria') && agency.address) {
    config.contactAddress = agency.address
  }

  return {
    agency,
    products: products || [],
    pages: pages || [],
    config,
  }
}
