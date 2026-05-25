import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import PublicSite from '@/components/website/PublicSite'
import type { Metadata } from 'next'

export const revalidate = 60

// Dynamic SEO metadata with Open Graph + Twitter cards
export async function generateMetadata(props: { params: Promise<{ subdomain: string }> }): Promise<Metadata> {
  const params = await props.params
  const supabase = createAdminClient()

  const { data: agency } = await supabase
    .from('agencies')
    .select('company_name, website_settings')
    .eq('subdomain', params.subdomain)
    .single()

  if (!agency) return { title: 'Agency Not Found' }

  const settings = (agency as any).website_settings || {}
  const title = `${(agency as any).company_name} — Your Trusted Travel Agency`
  const description = settings.hero_subtitle || `Book your next dream vacation with ${(agency as any).company_name}. Best prices, expert guides, and 24/7 support.`
  const ogImage = settings.logo_url || undefined
  const url = `https://${params.subdomain}.yoursaas.com`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: (agency as any).company_name,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : [],
    },
  }
}

export default async function SubdomainPage(props: { params: Promise<{ subdomain: string }> }) {
  const params = await props.params
  const supabase = createAdminClient()

  // 1. Fetch agency
  const { data: agencyData, error: agencyError } = await (supabase
    .from('agencies') as any)
    .select('*')
    .eq('subdomain', params.subdomain)
    .single()

  if (agencyError || !agencyData) {
    notFound()
  }

  // Fetch live website config from the visual builder configs table
  const { data: configData } = await (supabase
    .from('website_configs') as any)
    .select('*')
    .eq('agency_id', (agencyData as any).id)
    .maybeSingle()

  const agency = {
    ...agencyData,
    website_config: configData?.builder_data && Object.keys(configData.builder_data).length > 0
      ? configData.builder_data
      : agencyData.website_config
  } as any

  // 2. Fetch active trips for this agency
  const { data: tripsData } = await supabase
    .from('trips')
    .select('*')
    .eq('agency_id', agency.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const trips = (tripsData as any[]) || []

  // 3. Fetch showroom inventory if business vertical is showroom
  let salesCars: any[] = []
  let rentalCars: any[] = []

  if (agency.business_type_slug === 'car_showroom') {
    const { data: salesData } = await supabase
      .from('car_sales_inventory')
      .select('*')
      .eq('agency_id', agency.id)
      .eq('status', 'available')
      .order('created_at', { ascending: false })
    salesCars = ((salesData as any[]) || []).map((car: any) => {
      const specs = car.specs || {}
      return {
        ...car,
        ...specs,
        color_exterior: car.color || specs.color_exterior || '',
        selling_price: car.price || specs.selling_price || 0,
        purchase_price: car.cost_price || specs.purchase_price || 0,
        car_type: car.car_type || car.type || specs.car_type || 'sell',
        condition: specs.condition || 'new',
        show_on_website: specs.show_on_website !== false,
      }
    }).filter(car => car.show_on_website !== false)

    const { data: rentalData } = await supabase
      .from('car_rental_fleet')
      .select('*')
      .eq('agency_id', agency.id)
      .eq('status', 'available')
      .order('created_at', { ascending: false })
    rentalCars = ((rentalData as any[]) || []).map((car: any) => {
      const specs = car.specs || {}
      return {
        ...car,
        ...specs,
        color_exterior: car.color || specs.color_exterior || '',
        selling_price: car.price || specs.selling_price || car.daily_rate || 0,
        purchase_price: car.cost_price || specs.purchase_price || 0,
        car_type: 'rental',
        condition: specs.condition || 'new',
        show_on_website: specs.show_on_website !== false,
      }
    }).filter(car => car.show_on_website !== false)
  }

  // Extract theme colors for CSS custom properties (fallback to defaults)
  const primaryColor = agency.website_config?.design?.primary_color || '#0f172a'
  const secondaryColor = agency.website_config?.design?.secondary_color || '#3b82f6'

  return (
    <div
      className="min-h-screen bg-white font-geist overflow-x-hidden antialiased"
      style={{ '--primary': primaryColor, '--secondary': secondaryColor } as React.CSSProperties}
    >
      <PublicSite agency={agency} trips={trips} salesCars={salesCars} rentalCars={rentalCars} />
    </div>
  )
}
