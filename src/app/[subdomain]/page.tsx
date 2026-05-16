import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/website/Navbar'
import { HeroSection } from '@/components/website/HeroSection'
import { StatsBar } from '@/components/website/StatsBar'
import { TripsSection } from '@/components/website/TripsSection'
import { WhyChooseUs } from '@/components/website/WhyChooseUs'
import { Testimonials } from '@/components/website/Testimonials'
import { ContactSection } from '@/components/website/ContactSection'
import { Footer } from '@/components/website/Footer'
import { WhatsAppButton } from '@/components/website/WhatsAppButton'
import type { Metadata } from 'next'

export const revalidate = 60

// Dynamic SEO metadata with Open Graph + Twitter cards
export async function generateMetadata(props: { params: Promise<{ subdomain: string }> }): Promise<Metadata> {
  const params = await props.params
  const supabase = await createClient()

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
  const supabase = await createClient()

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

  // Extract theme colors for CSS custom properties
  const settings = agency.website_settings || {}
  const primaryColor = settings.primary_color || '#0f172a'
  const secondaryColor = settings.secondary_color || '#3b82f6'

  return (
    <div
      className="min-h-screen bg-white font-sans overflow-x-hidden antialiased"
      style={{
        '--primary': primaryColor,
        '--secondary': secondaryColor,
      } as React.CSSProperties}
    >
      <Navbar agency={agency} />
      <main>
        <HeroSection agency={agency} />
        <StatsBar agency={agency} tripsCount={trips.length} />
        <TripsSection agency={agency} trips={trips} />
        <WhyChooseUs agency={agency} />
        <Testimonials agency={agency} />
        <ContactSection agency={agency} />
      </main>
      <Footer agency={agency} />
      <WhatsAppButton agency={agency} />
    </div>
  )
}
