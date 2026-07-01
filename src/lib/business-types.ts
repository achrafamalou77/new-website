export type CanonicalBusinessTypeSlug = 'travel_agency' | 'car_showroom' | 'ecommerce'

const ECOMMERCE_ALIASES = new Set(['ecommerce', 'e-commerce', 'online_store', 'online-store', 'online store', 'store'])

export function isEcommerceBusinessType(slug?: string | null) {
  return ECOMMERCE_ALIASES.has(String(slug || '').trim().toLowerCase())
}

export function normalizeBusinessTypeSlug(slug?: string | null): CanonicalBusinessTypeSlug {
  const normalized = String(slug || '').trim().toLowerCase()
  if (normalized === 'car_showroom') return 'car_showroom'
  if (isEcommerceBusinessType(normalized)) return 'ecommerce'
  return 'travel_agency'
}

export const ECOMMERCE_BUSINESS_TYPE_SLUGS = Array.from(ECOMMERCE_ALIASES)
