import { describe, expect, it } from 'vitest'
import { buildContainerTrackingSnapshot } from '@/lib/container-tracking'

describe('buildContainerTrackingSnapshot', () => {
  it('does not invent live AIS/GPS telemetry', () => {
    const snapshot = buildContainerTrackingSnapshot({
      status: 'in transit',
      departure_port: 'Marseille',
      arrival_port: 'Algiers',
      vessel_name: null,
      departure_date: '2026-06-01',
      estimated_arrival_date: '2026-06-05'
    })

    expect(snapshot).toMatchObject({
      vessel_name: null,
      vessel_speed: null,
      vessel_heading: null,
      vessel_lat: null,
      vessel_lng: null,
      is_live: false,
      source: 'agency_record'
    })
    expect(snapshot?.ais_quality).toContain('not connected')
    expect(snapshot?.vessel_route).toBe('Marseille -> Algiers')
  })
})
