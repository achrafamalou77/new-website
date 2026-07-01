'use client'

import TravelWebsiteBuilder from '@/components/dashboard/TravelWebsiteBuilder'

export function WebsiteSettingsClient({
  activeTrips,
  visaTypes = [],
}: {
  activeTrips: any[]
  visaTypes?: any[]
}) {
  // Page is only reached for travel agencies (car showroom redirects server-side)
  return (
    <TravelWebsiteBuilder
      activeTrips={activeTrips}
      visaTypes={visaTypes}
    />
  )
}
