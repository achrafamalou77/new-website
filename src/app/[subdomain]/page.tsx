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
  const { data: agencyData, error: agencyError } = await supabase
    .from('agencies')
    .select('*')
    .eq('subdomain', params.subdomain)
    .single()

  if (agencyError || !agencyData) {
    notFound()
  }

  const agency = agencyData as any

  // 2. Fetch active trips for this agency
  const { data: tripsData } = await supabase
    .from('trips')
    .select('*')
    .eq('agency_id', agency.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const trips = (tripsData as any[]) || []

  // No need for featured filtering per spec – show all active trips

  // Extract theme colors for CSS custom properties (fallback to defaults)
  const primaryColor = agency.website_config?.design?.primary_color || '#0f172a'
  const secondaryColor = agency.website_config?.design?.secondary_color || '#3b82f6'

  return (
    <div
      className="min-h-screen bg-white font-geist overflow-x-hidden antialiased"
      style={{ '--primary': primaryColor, '--secondary': secondaryColor } as React.CSSProperties}
    >
      <PublicSite agency={agency} trips={trips} />
    </div>
  )
}
