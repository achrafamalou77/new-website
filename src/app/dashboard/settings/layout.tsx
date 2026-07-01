import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { SettingsProvider } from '@/components/dashboard/SettingsProvider'
import { getDefaultWebsiteConfig, getDefaultChatbotConfig } from '@/lib/settings-defaults'
import { templatesList } from '@/lib/templates-data'
import { hasPermission } from '@/lib/permissions'

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')

  const { data: profileData } = await supabase.from('profiles').select('agency_id, role').eq('id', user.id).single()
  const profile = profileData as any
  
  if (!profile || !hasPermission(profile.role, 'settings:manage')) {
    redirect('/dashboard/inbox')
  }

  let agencyData: any = null;
  if (profile?.agency_id) {
    const { data } = await supabase.from('agencies').select('*').eq('id', profile.agency_id).single()
    agencyData = data;
  }

  if (!agencyData) {
    redirect('/dashboard')
  }

  // Resolve business vertical (from DB or fallback to cookie 'demo_business_type_slug' for showcase)
  const headersList = await headers()
  const cookieHeader = headersList.get('cookie') || ''
  const match = cookieHeader.match(/demo_business_type_slug=([^;]+)/)
  let businessTypeSlug = match ? match[1] : 'travel'
  if (agencyData?.business_type_slug) {
    businessTypeSlug = agencyData.business_type_slug === 'travel_agency' ? 'travel' : agencyData.business_type_slug
  }

  // Fetch actual builder data from website_configs table
  const { data: configData } = await (supabase
    .from('website_configs') as any)
    .select('*')
    .eq('agency_id', agencyData.id)
    .maybeSingle()

  let website_config = (configData as any)?.builder_data && Object.keys((configData as any).builder_data).length > 0
    ? (configData as any).builder_data
    : null;

  if (!website_config) {
    if (businessTypeSlug === 'car_showroom') {
      const defaultShowroomTemplate = templatesList.find((t: any) => t.id === 'a5a5a5a5-b5b5-c5c5-d5d5-e5e5e5e5e5e5')
      website_config = defaultShowroomTemplate ? {
        active_template_id: defaultShowroomTemplate.id,
        global_styles: { ...defaultShowroomTemplate.global_styles },
        structure: { 
          sections: defaultShowroomTemplate.structure?.sections ? [...defaultShowroomTemplate.structure.sections] : []
        }
      } : {
        active_template_id: 'a5a5a5a5-b5b5-c5c5-d5d5-e5e5e5e5e5e5',
        global_styles: {},
        structure: { sections: [] }
      }
    } else {
      website_config = Object.keys(agencyData.website_config || {}).length > 0 
        ? agencyData.website_config 
        : getDefaultWebsiteConfig(agencyData.company_name);
    }
  }
    
  const chatbot_config = Object.keys(agencyData.chatbot_config || {}).length > 0 
    ? agencyData.chatbot_config 
    : getDefaultChatbotConfig(agencyData.company_name);

  const initialData = {
    website_config,
    chatbot_config,
    business_hours: agencyData.business_hours || null,
    social_media: agencyData.social_media || null,
    company_name: agencyData.company_name || '',
    subdomain: agencyData.subdomain || '',
    phone: agencyData.website_settings?.phone || agencyData.phone || '',
    whatsapp_phone: agencyData.website_settings?.whatsapp_phone || agencyData.website_settings?.phone || agencyData.phone || '',
    email: agencyData.website_settings?.email || agencyData.email || '',
    address: agencyData.website_settings?.address || agencyData.address || '',
    logo_url: agencyData.website_settings?.logo_url || '',
    currency: agencyData.website_settings?.currency || 'DZD',
    payment_info: agencyData.website_settings?.payment_info || {},
    bank_integrations: agencyData.website_settings?.bank_integrations || {},
    website_settings: agencyData.website_settings || {},
    business_type_slug: businessTypeSlug
  }

  return (
    <SettingsProvider initialData={initialData}>
      {children}
    </SettingsProvider>
  )
}
