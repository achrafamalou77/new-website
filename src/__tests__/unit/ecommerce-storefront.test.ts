import { describe, expect, it } from 'vitest'
import {
  ECOMMERCE_STOREFRONT_TEMPLATES,
  createEcommerceStorefrontConfig,
  getTemplatesForCategory,
} from '@/lib/ecommerce-storefront'

describe('ecommerce storefront presets', () => {
  it('provides one complete, distinctive shoe-store storefront template', () => {
    expect(ECOMMERCE_STOREFRONT_TEMPLATES).toHaveLength(1)
    expect(ECOMMERCE_STOREFRONT_TEMPLATES[0].id).toBe('sole-district')

    for (const template of ECOMMERCE_STOREFRONT_TEMPLATES) {
      expect(template.config.templateId).toBe(template.id)
      expect(template.config.category).toBe(template.category)
      expect(template.config.heroImage).toMatch(/^https:\/\//)
      expect(template.config.trustItems).toHaveLength(3)
      expect(template.config.promoImage).toMatch(/^https:\/\//)
      expect(template.config.catalogSubtitle.length).toBeGreaterThan(20)
      expect(template.config.shippingPolicy.length).toBeGreaterThan(20)
      expect(template.config.enableSearch).toBe(true)
      expect(template.config.enableCart).toBe(true)
    }
  })

  it('creates an independent config with the tenant store name', () => {
    const first = createEcommerceStorefrontConfig('sole-district', 'My Sneaker Shop')
    const second = createEcommerceStorefrontConfig('sole-district', 'Another Shop')

    expect(first.storeName).toBe('My Sneaker Shop')
    expect(first.category).toBe('shoes')
    first.heroTitle = 'Changed locally'
    expect(second.heroTitle).not.toBe('Changed locally')
  })

  it('falls back to the shoe-store preset for every category', () => {
    expect(getTemplatesForCategory('beauty').map((template) => template.id)).toEqual(['sole-district'])
    expect(getTemplatesForCategory('general').map((template) => template.id)).toEqual(['sole-district'])
  })
})
