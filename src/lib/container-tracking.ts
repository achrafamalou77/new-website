type ContainerLike = {
  status?: string | null
  vessel_name?: string | null
  departure_port?: string | null
  arrival_port?: string | null
  departure_date?: string | null
  estimated_arrival_date?: string | null
  updated_at?: string | null
  created_at?: string | null
}

export function buildContainerTrackingSnapshot(containerObj: ContainerLike | null | undefined) {
  if (!containerObj) return null

  const status = containerObj.status || 'Status recorded'
  const routeParts = [containerObj.departure_port, containerObj.arrival_port].filter(Boolean)
  const history = [
    containerObj.departure_date
      ? {
          time: containerObj.departure_date,
          event: 'Departure date recorded by agency',
          loc: containerObj.departure_port || 'Departure port'
        }
      : null,
    containerObj.estimated_arrival_date
      ? {
          time: containerObj.estimated_arrival_date,
          event: 'Estimated arrival recorded by agency',
          loc: containerObj.arrival_port || 'Arrival port'
        }
      : null,
    containerObj.updated_at || containerObj.created_at
      ? {
          time: containerObj.updated_at || containerObj.created_at,
          event: `Current status: ${status}`,
          loc: routeParts.join(' to ') || 'Agency records'
        }
      : null
  ].filter(Boolean)

  return {
    vessel_name: containerObj.vessel_name || null,
    vessel_speed: null,
    vessel_heading: null,
    vessel_lat: null,
    vessel_lng: null,
    vessel_status: status,
    vessel_route: routeParts.length > 0 ? routeParts.join(' -> ') : null,
    ais_quality: 'Agency record only - live AIS/GPS not connected',
    ais_history: history,
    is_live: false,
    source: 'agency_record',
    disclaimer: 'Not live GPS/AIS. This status is based on the agency container record.'
  }
}
