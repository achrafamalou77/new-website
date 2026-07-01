import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import ShowroomSubPage from '@/components/website/showroom/ShowroomSubPage'
import { PERFECT_SHOWROOM_TEMPLATE } from '@/lib/car-showroom-builder-template'

export default async function StockPage(props: { params: Promise<{ subdomain: string }> }) {
  const params = await props.params
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
      logoUrl: agency.website_settings?.logo_url || config.global.logoUrl,
    }
  }

  const { data: carsData } = await (supabase.from('car_sales_inventory') as any)
    .select('*').eq('agency_id', agency.id).eq('status', 'available')
    .order('created_at', { ascending: false })

  const cars = ((carsData as any[]) || []).map((car: any) => ({
    ...car,
    ...(car.specs || {}),
    selling_price: car.price || car.specs?.selling_price || 0,
    car_type: car.car_type || car.specs?.car_type || 'sell',
    condition: car.specs?.condition || 'new',
  }))

  return <ShowroomSubPage config={config} agency={agency} pageType="stock" cars={cars} />
}
