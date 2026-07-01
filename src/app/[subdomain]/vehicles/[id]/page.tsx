import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getPublicAgency } from '@/app/actions/public-cars'
import { notFound } from 'next/navigation'
import ShowroomSubPage from '@/components/website/showroom/ShowroomSubPage'
import { PERFECT_SHOWROOM_TEMPLATE } from '@/lib/car-showroom-builder-template'

export default async function VehicleDetailPage(props: {
  params: Promise<{ subdomain: string; id: string }>
}) {
  const params = await props.params
  const supabase = createAdminClient()

  const agency = await getPublicAgency(params.subdomain).catch(() => null)
  if (!agency || agency.business_type_slug !== 'car_showroom') notFound()

  const { data: configData } = await (supabase.from('website_configs') as any)
    .select('builder_data, published_data').eq('agency_id', (agency as any).id).maybeSingle()

  let config = configData?.published_data || configData?.builder_data || PERFECT_SHOWROOM_TEMPLATE
  config = {
    ...config,
    global: {
      ...config.global,
      companyName: (agency as any).company_name || config.global.companyName,
      phone: (agency as any).phone || config.global.phone,
      whatsapp: (agency as any).phone || config.global.whatsapp,
      logoUrl: (agency as any).website_settings?.logo_url || config.global.logoUrl,
    }
  }

  // Fetch the specific vehicle
  const serverClient = await createClient()
  let vehicle: any = null
  let allCars: any[] = []

  const { data: salesVehicle } = await serverClient
    .from('car_sales_inventory')
    .select('*')
    .eq('id', params.id)
    .eq('agency_id', (agency as any).id)
    .maybeSingle()

  if (salesVehicle) {
    const specs = (salesVehicle as any).specs || {}
    vehicle = { ...(salesVehicle as any), ...specs, selling_price: (salesVehicle as any).price || specs.selling_price || 0, car_type: (salesVehicle as any).car_type || 'sell' }
  } else {
    const { data: rentalVehicle } = await serverClient
      .from('car_rental_fleet')
      .select('*')
      .eq('id', params.id)
      .eq('agency_id', (agency as any).id)
      .maybeSingle()
    if (rentalVehicle) {
      const specs = (rentalVehicle as any).specs || {}
      vehicle = { ...(rentalVehicle as any), ...specs, daily_rate: (rentalVehicle as any).daily_rate || 0, car_type: 'rental' }
    }
  }

  if (!vehicle) notFound()

  // Use ShowroomSubPage in stock mode with the single vehicle highlighted
  // Fetch similar cars for the grid
  const { data: similarData } = await serverClient
    .from('car_sales_inventory')
    .select('*')
    .eq('agency_id', (agency as any).id)
    .eq('status', 'available')
    .neq('id', params.id)
    .limit(6)

  allCars = [vehicle, ...((similarData as any[]) || []).map((c: any) => ({
    ...c, ...(c.specs || {}),
    selling_price: c.price || c.specs?.selling_price || 0,
    car_type: c.car_type || 'sell'
  }))]

  return <ShowroomSubPage config={config} agency={agency} pageType="stock" cars={allCars} />
}
