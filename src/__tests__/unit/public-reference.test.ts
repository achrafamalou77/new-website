import { describe, expect, it } from 'vitest'
import { buildPublicReference } from '@/lib/public-reference'

describe('buildPublicReference', () => {
  it('builds a stable reference from a persisted record id', () => {
    expect(buildPublicReference('TRIP', '2af4fb01-91f1-4d70-9c57-8d54d342caaa')).toBe('TRIP-2AF4FB0191')
  })

  it('does not invent a random reference when no id exists', () => {
    expect(buildPublicReference('VISA', null)).toBe('VISA-PENDING')
  })
})
