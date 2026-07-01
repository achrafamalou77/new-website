import { describe, expect, it } from 'vitest'
import {
  ADS_VERTICALS,
  FIRST_META_TEST_DAILY_BUDGET_DZD,
  FIRST_META_TEST_DURATION_DAYS,
  META_PAUSED_STATUS,
  buildMetaTargeting,
  firstImage,
  metaOptimizationGoal,
  validateFirstMetaTestPublish,
} from '@/lib/meta-ads'

describe('Meta ads helpers', () => {
  it('uses a distinct strategy for every business vertical', () => {
    expect(ADS_VERTICALS.travel_agency.defaultObjective).toBe('OUTCOME_LEADS')
    expect(ADS_VERTICALS.car_showroom.itemLabel).toBe('vehicle')
    expect(ADS_VERTICALS.ecommerce.defaultObjective).toBe('OUTCOME_SALES')
  })

  it('maps campaign objectives to Meta optimization goals', () => {
    expect(metaOptimizationGoal('OUTCOME_LEADS')).toBe('LEAD_GENERATION')
    expect(metaOptimizationGoal('OUTCOME_SALES')).toBe('OFFSITE_CONVERSIONS')
    expect(metaOptimizationGoal('OUTCOME_TRAFFIC')).toBe('LINK_CLICKS')
    expect(metaOptimizationGoal('OUTCOME_ENGAGEMENT')).toBe('POST_ENGAGEMENT')
  })

  it('clamps target ages and defaults to Algeria', () => {
    expect(buildMetaTargeting({ age_min: 12, age_max: 90 })).toEqual({
      geo_locations: { countries: ['DZ'] },
      age_min: 18,
      age_max: 65,
      publisher_platforms: ['facebook', 'instagram'],
      facebook_positions: ['feed'],
      instagram_positions: ['feed', 'stories'],
    })
  })

  it('only accepts a usable remote catalog image', () => {
    expect(firstImage(['bad', 'https://cdn.example.com/item.jpg'])).toBe('https://cdn.example.com/item.jpg')
    expect(firstImage(null)).toBeNull()
  })

  it('builds placement targeting for selected Meta surfaces only', () => {
    expect(buildMetaTargeting({
      country: 'DZ',
      age_min: 25,
      age_max: 44,
      placements: ['facebook_marketplace', 'facebook_reels', 'instagram_reels'],
    })).toEqual({
      geo_locations: { countries: ['DZ'] },
      age_min: 25,
      age_max: 44,
      publisher_platforms: ['facebook', 'instagram'],
      facebook_positions: ['marketplace', 'reels'],
      instagram_positions: ['reels'],
    })
  })

  it('requires the first Meta publish to be a tiny paused test', () => {
    expect(META_PAUSED_STATUS).toBe('PAUSED')
    expect(() => validateFirstMetaTestPublish({
      hasPreviousMetaPublish: false,
      dailyBudgetDzd: FIRST_META_TEST_DAILY_BUDGET_DZD,
      durationDays: FIRST_META_TEST_DURATION_DAYS,
    })).not.toThrow()
    expect(() => validateFirstMetaTestPublish({
      hasPreviousMetaPublish: false,
      dailyBudgetDzd: FIRST_META_TEST_DAILY_BUDGET_DZD + 1,
      durationDays: FIRST_META_TEST_DURATION_DAYS,
    })).toThrow('First Meta publish must be a tiny paused test')
    expect(() => validateFirstMetaTestPublish({
      hasPreviousMetaPublish: true,
      dailyBudgetDzd: 5000,
      durationDays: 14,
    })).not.toThrow()
  })
})
