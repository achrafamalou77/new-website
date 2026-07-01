import { describe, expect, it } from 'vitest'
import { isEcommerceBusinessType, normalizeBusinessTypeSlug } from '@/lib/business-types'

describe('business type normalization', () => {
  it('treats online store aliases as ecommerce', () => {
    expect(isEcommerceBusinessType('ecommerce')).toBe(true)
    expect(isEcommerceBusinessType('online_store')).toBe(true)
    expect(isEcommerceBusinessType('online-store')).toBe(true)
    expect(isEcommerceBusinessType('online store')).toBe(true)
    expect(normalizeBusinessTypeSlug('online_store')).toBe('ecommerce')
  })
})
