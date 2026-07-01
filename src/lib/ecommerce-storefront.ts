export const ECOMMERCE_CATEGORIES = [
  { id: 'fashion', name: 'Clothing & Fashion', description: 'Clothing, modest fashion, streetwear and seasonal collections.' },
  { id: 'shoes', name: 'Shoes & Sneakers', description: 'Sneakers, formal shoes, sports footwear and accessories.' },
  { id: 'kids', name: 'Kids & Baby', description: 'Children clothing, toys, nursery products and baby essentials.' },
  { id: 'accessories', name: 'Jewelry & Accessories', description: 'Jewelry, bags, watches, scarves and premium accessories.' },
  { id: 'beauty', name: 'Beauty & Cosmetics', description: 'Skincare, makeup, fragrance and personal care.' },
  { id: 'electronics', name: 'Electronics & Tech', description: 'Phones, computers, gaming, gadgets and smart devices.' },
  { id: 'home', name: 'Home & Decoration', description: 'Furniture, decoration, kitchen and home essentials.' },
  { id: 'general', name: 'General Store', description: 'A flexible catalog for mixed products and broad collections.' },
] as const

export type EcommerceCategoryId = typeof ECOMMERCE_CATEGORIES[number]['id']
export type EcommerceTemplateId = 'sole-district'

export interface EcommerceStorefrontConfig {
  version: 1
  templateId: EcommerceTemplateId
  category: EcommerceCategoryId
  storeName: string
  announcement: string
  heroEyebrow: string
  heroTitle: string
  heroSubtitle: string
  heroImage: string
  primaryColor: string
  accentColor: string
  backgroundColor: string
  surfaceColor: string
  textColor: string
  headingFont: 'sans' | 'serif' | 'display'
  heroLayout: 'split' | 'editorial' | 'centered'
  productCardStyle: 'soft' | 'editorial' | 'bold'
  borderRadius: number
  showAnnouncement: boolean
  showCategories: boolean
  showFeaturedProducts: boolean
  showAllProducts: boolean
  showTrustBar: boolean
  showNewsletter: boolean
  featuredTitle: string
  catalogTitle: string
  trustItems: Array<{ title: string; text: string }>
  logoUrl: string
  navStyle: 'boxed' | 'full' | 'minimal'
  catalogSubtitle: string
  catalogColumns: 2 | 3 | 4
  showPromoSection: boolean
  promoEyebrow: string
  promoTitle: string
  promoText: string
  promoImage: string
  aboutTitle: string
  aboutText: string
  contactTitle: string
  contactSubtitle: string
  contactEmail: string
  contactAddress: string
  footerTagline: string
  instagramUrl: string
  facebookUrl: string
  enableSearch: boolean
  enableCart: boolean
  shippingPolicy: string
  returnsPolicy: string
  privacyPolicy: string
  termsPolicy: string
}

export interface EcommerceTemplateDefinition {
  id: EcommerceTemplateId
  name: string
  category: EcommerceCategoryId
  tagline: string
  description: string
  thumbnail: string
  config: EcommerceStorefrontConfig
}

function template(
  definition: Omit<EcommerceTemplateDefinition, 'config'> & {
    config: Omit<
      EcommerceStorefrontConfig,
      | 'version'
      | 'templateId'
      | 'category'
      | 'logoUrl'
      | 'navStyle'
      | 'catalogSubtitle'
      | 'catalogColumns'
      | 'showPromoSection'
      | 'promoEyebrow'
      | 'promoTitle'
      | 'promoText'
      | 'promoImage'
      | 'aboutTitle'
      | 'aboutText'
      | 'contactTitle'
      | 'contactSubtitle'
      | 'contactEmail'
      | 'contactAddress'
      | 'footerTagline'
      | 'instagramUrl'
      | 'facebookUrl'
      | 'enableSearch'
      | 'enableCart'
      | 'shippingPolicy'
      | 'returnsPolicy'
      | 'privacyPolicy'
      | 'termsPolicy'
    > & Partial<Pick<
      EcommerceStorefrontConfig,
      | 'logoUrl'
      | 'navStyle'
      | 'catalogSubtitle'
      | 'catalogColumns'
      | 'showPromoSection'
      | 'promoEyebrow'
      | 'promoTitle'
      | 'promoText'
      | 'promoImage'
      | 'aboutTitle'
      | 'aboutText'
      | 'contactTitle'
      | 'contactSubtitle'
      | 'contactEmail'
      | 'contactAddress'
      | 'footerTagline'
      | 'instagramUrl'
      | 'facebookUrl'
      | 'enableSearch'
      | 'enableCart'
      | 'shippingPolicy'
      | 'returnsPolicy'
      | 'privacyPolicy'
      | 'termsPolicy'
    >>
  }
): EcommerceTemplateDefinition {
  const defaults = createPageDefaults(definition.name, definition.thumbnail)
  return {
    ...definition,
    config: {
      version: 1,
      templateId: definition.id,
      category: definition.category,
      ...defaults,
      ...definition.config,
    },
  }
}

function createPageDefaults(storeName: string, image: string) {
  return {
    logoUrl: '',
    navStyle: 'boxed' as const,
    catalogSubtitle: 'A carefully organized catalog designed to help customers find the right product.',
    catalogColumns: 4 as const,
    showPromoSection: true,
    promoEyebrow: 'Discover the collection',
    promoTitle: 'Products selected for everyday life.',
    promoText: 'Explore real products, current prices and live availability from our online store.',
    promoImage: image,
    aboutTitle: `About ${storeName}`,
    aboutText: 'We are an online store focused on clear product information, dependable service and simple ordering.',
    contactTitle: 'We are here to help',
    contactSubtitle: 'Questions about a product, delivery or an order? Contact our team.',
    contactEmail: '',
    contactAddress: 'Algeria',
    footerTagline: 'Products, support and delivery in one simple online store.',
    instagramUrl: '',
    facebookUrl: '',
    enableSearch: true,
    enableCart: true,
    shippingPolicy: 'Delivery times and fees depend on the selected destination. Every order is confirmed before dispatch.',
    returnsPolicy: 'Contact the store as soon as possible if a delivered product has a problem. Eligibility is reviewed per order.',
    privacyPolicy: 'Customer information is used only to process orders, provide support and improve store service.',
    termsPolicy: 'Prices, stock and delivery availability may change. Orders are confirmed by the store before dispatch.',
  }
}

export const ECOMMERCE_STOREFRONT_TEMPLATES: EcommerceTemplateDefinition[] = [
  template({
    id: 'sole-district',
    name: 'Sole District',
    category: 'shoes',
    tagline: 'High-energy sneaker drops',
    description: 'Bold typography, drop-style merchandising and product cards designed for footwear.',
    thumbnail: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200',
    config: {
      storeName: 'Sole District',
      announcement: 'Galaxy footwear drops, live stock and order confirmation before delivery',
      heroEyebrow: 'Galaxy footwear drops',
      heroTitle: 'Step into another orbit.',
      heroSubtitle: 'Premium sneakers and daily footwear presented with clean visuals, live stock and a smooth shopping experience.',
      heroImage: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=1800',
      primaryColor: '#8b5cf6',
      accentColor: '#22d3ee',
      backgroundColor: '#080812',
      surfaceColor: '#111827',
      textColor: '#f8fafc',
      headingFont: 'display',
      heroLayout: 'split',
      productCardStyle: 'bold',
      borderRadius: 10,
      showAnnouncement: true,
      showCategories: true,
      showFeaturedProducts: true,
      showAllProducts: true,
      showTrustBar: true,
      showNewsletter: false,
      featuredTitle: 'Orbit picks',
      catalogTitle: 'Explore the collection',
      trustItems: [
        { title: 'Real stock', text: 'Live availability from your catalog.' },
        { title: 'Fast confirmation', text: 'Every order is confirmed.' },
        { title: 'Size support', text: 'Help customers choose confidently.' },
      ],
      navStyle: 'full',
      catalogSubtitle: 'Browse sneakers, trainers and daily footwear with glassy product cards, clear prices, live stock and easy ordering.',
      promoEyebrow: 'Limited orbit',
      promoTitle: 'The drop with the strongest pull.',
      promoText: 'Feature your best arrivals, limited sizes and premium footwear in a cinematic shopping section.',
      promoImage: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=1800',
      aboutTitle: 'A galaxy-inspired shoe store',
      aboutText: 'Sole District helps customers discover the right pair quickly with strong visuals, useful product information, size support and simple ordering.',
      contactTitle: 'Need help choosing a pair?',
      contactSubtitle: 'Ask about sizes, stock, delivery or a specific shoe before ordering.',
      footerTagline: 'Galaxy footwear, live stock, size support and fast order confirmation.',
    },
  }),
]

export function getEcommerceTemplate(templateId?: string | null) {
  return ECOMMERCE_STOREFRONT_TEMPLATES.find((item) => item.id === templateId)
    || ECOMMERCE_STOREFRONT_TEMPLATES[0]
}

export function getTemplatesForCategory(category?: string | null) {
  const matching = ECOMMERCE_STOREFRONT_TEMPLATES.filter((item) => item.category === category)
  return matching.length ? matching : ECOMMERCE_STOREFRONT_TEMPLATES
}

export function createEcommerceStorefrontConfig(
  templateId: string | null | undefined,
  storeName: string
): EcommerceStorefrontConfig {
  const preset = getEcommerceTemplate(templateId)
  return {
    ...structuredClone(preset.config),
    storeName: storeName || preset.config.storeName,
  }
}

export function normalizeEcommerceStorefrontConfig(
  value: Partial<EcommerceStorefrontConfig> | null | undefined,
  storeName: string,
  templateId?: string | null
): EcommerceStorefrontConfig {
  const requestedTemplateId = value?.templateId || templateId
  const preset = createEcommerceStorefrontConfig(
    requestedTemplateId,
    storeName
  )
  const isLegacyStoredDesign = Boolean(
    value && (
      value.category !== 'shoes' ||
      value.heroTitle === 'Style that feels entirely your own.' ||
      value.heroTitle === 'Technology, without the noise.' ||
      value.heroTitle === 'Glow in your own way.' ||
      value.heroTitle === 'Details that become signatures.' ||
      value.heroTitle === 'Happy finds for growing families.'
    )
  )
  const isCurrentTemplate = requestedTemplateId === preset.templateId && !isLegacyStoredDesign
  const preserved = value
    ? Object.fromEntries(Object.entries({
        storeName: value.storeName,
        logoUrl: value.logoUrl,
        contactEmail: value.contactEmail,
        contactAddress: value.contactAddress,
        instagramUrl: value.instagramUrl,
        facebookUrl: value.facebookUrl,
        shippingPolicy: value.shippingPolicy,
        returnsPolicy: value.returnsPolicy,
        privacyPolicy: value.privacyPolicy,
        termsPolicy: value.termsPolicy,
      }).filter(([, entryValue]) => entryValue !== undefined))
    : {}

  return {
    ...preset,
    ...(isCurrentTemplate ? (value || {}) : preserved),
    templateId: preset.templateId,
    category: isCurrentTemplate && value?.category ? value.category : preset.category,
    storeName: value?.storeName || storeName || preset.storeName,
    trustItems: isCurrentTemplate && Array.isArray(value?.trustItems) && value.trustItems.length
      ? value.trustItems
      : preset.trustItems,
  }
}
