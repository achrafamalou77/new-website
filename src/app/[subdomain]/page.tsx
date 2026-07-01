import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import ShowroomPublicSite from '@/components/website/ShowroomPublicSite'
import PublicSite from '@/components/website/PublicSite'
import EcommercePublicSite from '@/components/website/EcommercePublicSite'
import { PERFECT_SHOWROOM_TEMPLATE, type ShowroomBuilderConfig } from '@/lib/car-showroom-builder-template'
import { isEcommerceBusinessType } from '@/lib/business-types'
import type { Metadata } from 'next'

// ─── SEO METADATA ─────────────────────────────────────────────────────────────
export async function generateMetadata(props: { params: Promise<{ subdomain: string }> }): Promise<Metadata> {
  const params = await props.params
  const supabase = createAdminClient()

  const { data: agency } = await supabase
    .from('agencies')
    .select('company_name, website_settings, business_type_slug')
    .eq('subdomain', params.subdomain)
    .single()

  if (!agency) return { title: 'Agence Introuvable' }

  const a = agency as any

  // For car showrooms, try to use builder config SEO fields
  if (a.business_type_slug === 'car_showroom') {
    const { data: configData } = await (supabase
      .from('website_configs') as any)
      .select('builder_data')
      .eq('agency_id', a.id)
      .maybeSingle()

    const builderData = configData?.builder_data
    const seoTitle = builderData?.global?.seoTitle
      || `${a.company_name} | Importation & Showroom Premium`
    const seoDescription = builderData?.global?.seoDescription
      || `${a.company_name} — Spécialiste de l'importation et vente de véhicules premium. Dédouanement clé en main. Location disponible.`
    const logoUrl = builderData?.global?.logoUrl || a.website_settings?.logo_url
    const url = `https://${params.subdomain}.autopremium.dz`

    return {
      title: seoTitle,
      description: seoDescription,
      openGraph: {
        title: seoTitle,
        description: seoDescription,
        url,
        siteName: a.company_name,
        images: logoUrl ? [{ url: logoUrl, width: 1200, height: 630 }] : [],
        type: 'website',
        locale: 'fr_DZ'
      },
      twitter: {
        card: 'summary_large_image',
        title: seoTitle,
        description: seoDescription,
        images: logoUrl ? [logoUrl] : [],
      },
    }
  }

  // E-commerce store fallback
  if (isEcommerceBusinessType(a.business_type_slug)) {
    const settings = (a as any).website_settings || {}
    const title = settings.seo_title || `${a.company_name} — Boutique en ligne`
    const description = settings.hero_subtitle || `Commandez les meilleurs produits de ${a.company_name} avec livraison en Algérie.`
    return {
      title,
      description,
      openGraph: { title, description, siteName: a.company_name, type: 'website' },
      twitter: { card: 'summary_large_image', title, description },
    }
  }

  // Travel agency fallback
  const settings = (a as any).website_settings || {}
  const title = `${a.company_name} — Votre Agence de Voyage`
  const description = settings.hero_subtitle || `Réservez votre prochain voyage avec ${a.company_name}.`
  const ogImage = settings.logo_url || undefined
  const url = `https://${params.subdomain}.yoursaas.com`

  return {
    title,
    description,
    openGraph: { title, description, url, siteName: a.company_name, images: ogImage ? [{ url: ogImage }] : [], type: 'website' },
    twitter: { card: 'summary_large_image', title, description, images: ogImage ? [ogImage] : [] },
  }
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
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

  const agency = agencyData as any

  // ── CAR SHOWROOM ────────────────────────────────────────────────────────────
  if (agency.business_type_slug === 'car_showroom') {
    // 2. Fetch published builder config
    const { data: configData } = await (supabase
      .from('website_configs') as any)
      .select('*')
      .eq('agency_id', agency.id)
      .maybeSingle()

    // Build showroom config — prefer published builder data, fallback to default template
    let showroomConfig: ShowroomBuilderConfig = JSON.parse(JSON.stringify(PERFECT_SHOWROOM_TEMPLATE))

    const builderData = configData?.published_data || configData?.builder_data

    if (builderData?.global?.primaryColor && Array.isArray(builderData?.sections) && builderData.sections.length > 0) {
      showroomConfig = builderData as ShowroomBuilderConfig
    }

    // Always merge live agency data into global config (source of truth for contact info)
    showroomConfig = {
      ...showroomConfig,
      global: {
        ...showroomConfig.global,
        companyName: agency.company_name || showroomConfig.global.companyName,
        phone: agency.phone || showroomConfig.global.phone,
        whatsapp: agency.phone || showroomConfig.global.whatsapp,
        address: agency.address || showroomConfig.global.address,
        email: agency.email || showroomConfig.global.email,
        logoUrl: agency.website_settings?.logo_url || showroomConfig.global.logoUrl,
      }
    }

    // 3. Fetch inventory
    let salesCars: any[] = []
    let rentalCars: any[] = []

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
        selling_price: car.price || specs.selling_price || 0,
        purchase_price: car.cost_price || specs.purchase_price || 0,
        car_type: car.car_type || car.type || specs.car_type || 'sell',
        condition: specs.condition || 'new',
        show_on_website: specs.show_on_website !== false,
      }
    }).filter((car: any) => car.show_on_website !== false)

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
        selling_price: car.price || specs.selling_price || car.daily_rate || 0,
        car_type: 'rental',
        condition: specs.condition || 'new',
        show_on_website: specs.show_on_website !== false,
      }
    }).filter((car: any) => car.show_on_website !== false)

    return (
      <ShowroomPublicSite
        config={showroomConfig}
        salesCars={salesCars}
        rentalCars={rentalCars}
        isPreview={false}
      />
    )
  }

  // ── E-COMMERCE STORE ───────────────────────────────────────────────────────
  if (isEcommerceBusinessType(agency.business_type_slug)) {
    const db: any = supabase
    const [productsResult, pagesResult] = await Promise.all([
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

    return (
      <EcommercePublicSite
        agency={agency}
        products={productsResult.data || []}
        pages={pagesResult.data || []}
      />
    )
  }

  // ── TRAVEL AGENCY (keep existing) ───────────────────────────────────────────
  const { data: configData } = await (supabase
    .from('website_configs') as any)
    .select('*')
    .eq('agency_id', agency.id)
    .maybeSingle()

  const agencyWithConfig = {
    ...agency,
    website_config: configData?.builder_data && Object.keys(configData.builder_data).length > 0
      ? configData.builder_data
      : agency.website_config
  } as any

  // Fetch trips for travel agencies
  const { data: tripsData } = await supabase
    .from('trips')
    .select('*')
    .eq('agency_id', agency.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const trips = (tripsData as any[]) || []

  const { data: visaData } = await supabase
    .from('visa_types')
    .select('*')
    .eq('agency_id', agency.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  const visas = (visaData as any[]) || []

  const primaryColor = agencyWithConfig.website_config?.design?.primary_color || '#0f172a'
  const secondaryColor = agencyWithConfig.website_config?.design?.secondary_color || '#3b82f6'

  return (
    <div
      className="min-h-screen bg-white font-geist overflow-x-hidden antialiased"
      style={{ '--primary': primaryColor, '--secondary': secondaryColor } as React.CSSProperties}
    >
      <PublicSite agency={agencyWithConfig} trips={trips} visas={visas} salesCars={[]} rentalCars={[]} />
    </div>
  )
}
