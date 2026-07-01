import type { BusinessTypeSlug } from '@/lib/server/agency-context'

export type MetaObjective =
  | 'OUTCOME_TRAFFIC'
  | 'OUTCOME_LEADS'
  | 'OUTCOME_SALES'
  | 'OUTCOME_ENGAGEMENT'

export interface AdsVerticalConfig {
  label: string
  itemLabel: string
  defaultObjective: MetaObjective
  objectives: MetaObjective[]
  defaultCta: string
  promptFocus: string
}

export const META_PAUSED_STATUS = 'PAUSED'
export const FIRST_META_TEST_DAILY_BUDGET_DZD = 1000
export const FIRST_META_TEST_DURATION_DAYS = 3

export const ADS_VERTICALS: Record<BusinessTypeSlug, AdsVerticalConfig> = {
  travel_agency: {
    label: 'Travel campaign',
    itemLabel: 'trip',
    defaultObjective: 'OUTCOME_LEADS',
    objectives: ['OUTCOME_LEADS', 'OUTCOME_TRAFFIC', 'OUTCOME_ENGAGEMENT'],
    defaultCta: 'CONTACT_US',
    promptFocus: 'destination desire, itinerary value, dates, trust, visa support and WhatsApp enquiries',
  },
  car_showroom: {
    label: 'Automotive campaign',
    itemLabel: 'vehicle',
    defaultObjective: 'OUTCOME_LEADS',
    objectives: ['OUTCOME_LEADS', 'OUTCOME_TRAFFIC', 'OUTCOME_ENGAGEMENT'],
    defaultCta: 'CONTACT_US',
    promptFocus: 'vehicle condition, price, financing, test drives, rental or import intent and qualified leads',
  },
  ecommerce: {
    label: 'Commerce campaign',
    itemLabel: 'product',
    defaultObjective: 'OUTCOME_SALES',
    objectives: ['OUTCOME_SALES', 'OUTCOME_TRAFFIC', 'OUTCOME_ENGAGEMENT'],
    defaultCta: 'SHOP_NOW',
    promptFocus: 'product benefit, offer, delivery, cash on delivery, stock urgency and purchase conversion',
  },
}

export function validateFirstMetaTestPublish(input: {
  hasPreviousMetaPublish: boolean
  dailyBudgetDzd: number
  durationDays: number
}) {
  if (input.hasPreviousMetaPublish) return

  if (
    input.dailyBudgetDzd > FIRST_META_TEST_DAILY_BUDGET_DZD ||
    input.durationDays > FIRST_META_TEST_DURATION_DAYS
  ) {
    throw new Error(
      `First Meta publish must be a tiny paused test: max ${FIRST_META_TEST_DAILY_BUDGET_DZD} DZD/day for ${FIRST_META_TEST_DURATION_DAYS} days.`
    )
  }
}

export function metaOptimizationGoal(objective: MetaObjective) {
  if (objective === 'OUTCOME_LEADS') return 'LEAD_GENERATION'
  if (objective === 'OUTCOME_SALES') return 'OFFSITE_CONVERSIONS'
  if (objective === 'OUTCOME_ENGAGEMENT') return 'POST_ENGAGEMENT'
  return 'LINK_CLICKS'
}

export function buildMetaTargeting(targeting: {
  country?: string
  age_min?: number
  age_max?: number
  placements?: string[]
}) {
  const placements = targeting.placements || ['facebook_feed', 'instagram_feed', 'instagram_stories']
  const result: Record<string, unknown> = {
    geo_locations: { countries: [targeting.country || 'DZ'] },
    age_min: Math.max(18, Math.min(65, targeting.age_min || 21)),
    age_max: Math.max(18, Math.min(65, targeting.age_max || 55)),
  }
  const facebookPositions = placements.filter((item) => item.startsWith('facebook_')).map((item) => item.replace('facebook_', ''))
  const instagramPositions = placements.filter((item) => item.startsWith('instagram_')).map((item) => item.replace('instagram_', ''))
  const platforms = []
  if (facebookPositions.length) platforms.push('facebook')
  if (instagramPositions.length) platforms.push('instagram')
  if (platforms.length) result.publisher_platforms = platforms
  if (facebookPositions.length) result.facebook_positions = facebookPositions
  if (instagramPositions.length) result.instagram_positions = instagramPositions
  return result
}

export function firstImage(value: unknown): string | null {
  if (!Array.isArray(value)) return null
  const image = value.find((item) => typeof item === 'string' && item.startsWith('http'))
  return typeof image === 'string' ? image : null
}
