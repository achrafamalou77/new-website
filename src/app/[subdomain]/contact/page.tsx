import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import ShowroomSubPage from '@/components/website/showroom/ShowroomSubPage'
import { PERFECT_SHOWROOM_TEMPLATE } from '@/lib/car-showroom-builder-template'
import { loadEcommerceStore } from '@/lib/ecommerce-storefront-server'
import EcommerceContactPage from '@/components/website/EcommerceContactPage'

export default async function ContactPage(props: { params: Promise<{ subdomain: string }> }) {
  const params = await props.params
  const ecommerce = await loadEcommerceStore(params.subdomain)
  if (ecommerce) {
    return <EcommerceContactPage agency={ecommerce.agency} products={ecommerce.products} config={ecommerce.config} />
  }

  const supabase = createAdminClient()

  const { data: agency } = await (supabase.from('agencies') as any)
    .select('*').eq('subdomain', params.subdomain).single()
  if (!agency || agency.business_type_slug !== 'car_showroom') notFound()

  const { data: configData } = await (supabase.from('website_configs') as any)
    .select('builder_data, published_data').eq('agency_id', agency.id).maybeSingle()

  let config = configData?.published_data || configData?.builder_data || PERFECT_SHOWROOM_TEMPLATE
  config = {
    ...config,
    global: {
      ...config.global,
      companyName: agency.company_name || config.global.companyName,
      phone: agency.phone || config.global.phone,
      whatsapp: agency.phone || config.global.whatsapp,
      address: agency.address || config.global.address,
      email: agency.email || config.global.email,
      logoUrl: agency.website_settings?.logo_url || config.global.logoUrl,
      socialFacebook: agency.website_settings?.social_facebook || config.global.socialFacebook,
      socialInstagram: agency.website_settings?.social_instagram || config.global.socialInstagram,
    }
  }

  return <ShowroomSubPage config={config} agency={agency} pageType="contact" cars={[]} />
}
