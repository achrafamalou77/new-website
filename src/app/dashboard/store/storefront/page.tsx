import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentAgencyContext } from '@/lib/server/agency-context'
import EcommerceStorefrontBuilder from '@/components/dashboard/EcommerceStorefrontBuilder'
import {
  normalizeEcommerceStorefrontConfig,
  type EcommerceStorefrontConfig,
} from '@/lib/ecommerce-storefront'

export const metadata = {
  title: 'Storefront Builder | Online Store',
  description: 'Customize and publish your online storefront.',
}

export default async function EcommerceStorefrontPage() {
  const context = await getCurrentAgencyContext()
  if (!context.userId || !context.agencyId) redirect('/login')
  if (context.businessTypeSlug !== 'ecommerce') redirect('/dashboard/settings/website')

  const supabase = await createClient()
  const [agencyResult, productsResult, pagesResult] = await Promise.all([
    (supabase as any)
      .from('agencies')
      .select('company_name, phone, email, address, website_settings, subdomain, custom_domain')
      .eq('id', context.agencyId)
      .single(),
    (supabase as any)
      .from('ecommerce_products')
      .select('*')
      .eq('agency_id', context.agencyId)
      .eq('status', 'active')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false }),
    (supabase as any)
      .from('ecommerce_product_pages')
      .select('*')
      .eq('agency_id', context.agencyId)
      .eq('status', 'published'),
  ])

  const agency = agencyResult.data
  if (!agency) redirect('/dashboard')

  const settings = agency.website_settings || {}
  const storedConfig = settings.storefront_config as EcommerceStorefrontConfig | undefined
  const initialConfig = normalizeEcommerceStorefrontConfig(storedConfig, agency.company_name, settings.store_template_id)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const storeUrl = agency.custom_domain
    ? `https://${agency.custom_domain}`
    : agency.subdomain && appUrl.includes('localhost')
      ? `http://${agency.subdomain}.lvh.me:3000`
      : agency.subdomain
        ? `https://${agency.subdomain}.${new URL(appUrl).host}`
        : appUrl

  return (
    <EcommerceStorefrontBuilder
      agency={agency}
      initialConfig={initialConfig}
      products={productsResult.data || []}
      pages={pagesResult.data || []}
      storeUrl={storeUrl}
    />
  )
}
