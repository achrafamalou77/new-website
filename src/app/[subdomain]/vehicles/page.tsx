import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import ShowroomSubPage from '@/components/website/showroom/ShowroomSubPage'
import { PERFECT_SHOWROOM_TEMPLATE } from '@/lib/car-showroom-builder-template'

export default async function VehiclesPage(props: {
  params: Promise<{ subdomain: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
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

  // Fetch ALL cars (both sales and rental)
  const [{ data: salesData }, { data: rentalData }] = await Promise.all([
    (supabase.from('car_sales_inventory') as any)
      .select('*').eq('agency_id', agency.id).eq('status', 'available')
      .order('created_at', { ascending: false }),
    (supabase.from('car_rental_fleet') as any)
      .select('*').eq('agency_id', agency.id).eq('status', 'available')
      .order('created_at', { ascending: false }),
  ])

  const salesCars = ((salesData as any[]) || []).map((car: any) => ({
    ...car, ...(car.specs || {}),
    selling_price: car.price || car.specs?.selling_price || 0,
    car_type: car.car_type || 'sell',
  }))
  const rentalCars = ((rentalData as any[]) || []).map((car: any) => ({
    ...car, ...(car.specs || {}),
    daily_rate: car.daily_rate || car.price || 0,
    car_type: 'rental',
  }))

  const allCars = [...salesCars, ...rentalCars]

  return <ShowroomSubPage config={config} agency={agency} pageType="stock" cars={allCars} />
}
