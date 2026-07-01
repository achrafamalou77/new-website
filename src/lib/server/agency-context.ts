import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import {
  normalizeBusinessTypeSlug,
  type CanonicalBusinessTypeSlug,
} from '@/lib/business-types'

export type BusinessTypeSlug = CanonicalBusinessTypeSlug

export interface AgencyContext {
  userId: string | null
  agencyId: string | null
  role: string | null
  businessTypeSlug: BusinessTypeSlug
}

export async function getCurrentAgencyContext(): Promise<AgencyContext> {
  const supabase = await createClient()
  const headersList = await headers()
  const agencyIdHeader = headersList.get('x-agency-id')
  const roleHeader = headersList.get('x-user-role')

  const { data: { user } } = await supabase.auth.getUser()
  let agencyId = agencyIdHeader
  let role = roleHeader

  if ((!agencyId || !role) && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('agency_id, role')
      .eq('id', user.id)
      .single()

    agencyId = agencyId || profile?.agency_id || null
    role = role || profile?.role || null
  }

  let businessTypeSlug: BusinessTypeSlug = 'travel_agency'
  if (agencyId) {
    const { data: agency } = await supabase
      .from('agencies')
      .select('business_type_slug')
      .eq('id', agencyId)
      .single()

    businessTypeSlug = normalizeBusinessTypeSlug(agency?.business_type_slug)
  }

  return {
    userId: user?.id || null,
    agencyId,
    role,
    businessTypeSlug,
  }
}

