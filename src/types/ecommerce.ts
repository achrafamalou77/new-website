import type { Json } from '@/types/database'

export type EcommerceStoreView =
  | 'overview'
  | 'analytics'
  | 'customers'
  | 'products'
  | 'orders'
  | 'inventory'
  | 'shipping'
  | 'promotions'
  | 'import'

export interface EcommerceProduct {
  id: string
  agency_id: string
  sku: string
  name: string
  description: string | null
  category: string
  brand: string | null
  price: number
  compare_at_price: number | null
  cost_price: number | null
  stock_quantity: number
  low_stock_threshold: number
  variants: Json
  images: Json
  channels: Json
  status: 'draft' | 'active' | 'archived'
  is_featured: boolean
  created_at: string
  updated_at: string
  landing_page?: EcommerceProductPage | null
}

export interface EcommerceOrder {
  id: string
  agency_id: string
  order_number: string
  customer_name: string
  customer_phone: string
  customer_city: string | null
  customer_address: string | null
  items: Json
  subtotal: number
  shipping_fee: number
  discount_amount: number
  total: number
  payment_method: string
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  fulfillment_status:
    | 'new'
    | 'confirmed'
    | 'packed'
    | 'shipped'
    | 'delivered'
    | 'returned'
    | 'cancelled'
  source: string
  notes: string | null
  promotion_code: string | null
  public_token: string
  campaign: Json
  created_at: string
  updated_at: string
}

export interface EcommerceShippingZone {
  id: string
  agency_id: string
  name: string
  carrier: string
  wilayas: Json
  base_fee: number
  cod_enabled: boolean
  estimated_days: string | null
  is_active: boolean
  created_at: string
}

export interface EcommercePromotion {
  id: string
  agency_id: string
  name: string
  code: string
  discount_type: 'percentage' | 'fixed' | 'free_shipping'
  discount_value: number
  target: Json
  starts_at: string | null
  ends_at: string | null
  status: 'draft' | 'scheduled' | 'live' | 'expired' | 'paused'
  created_at: string
}

export interface EcommerceProductPage {
  id: string
  agency_id: string
  product_id: string
  slug: string
  status: 'draft' | 'published' | 'archived'
  headline: string
  subheadline: string
  description: string
  benefits: Json
  faq: Json
  social_proof: Json
  urgency_text: string | null
  cta_text: string
  theme: Json
  seo: Json
  generated_by_ai: boolean
  views: number
  conversions: number
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface EcommerceStoreData {
  agency: {
    id: string
    company_name: string
    subdomain: string
    phone: string | null
    custom_domain?: string | null
    website_settings?: any
  }
  products: EcommerceProduct[]
  orders: EcommerceOrder[]
  shippingZones: EcommerceShippingZone[]
  promotions: EcommercePromotion[]
  stats: {
    revenue: number
    openOrders: number
    productsOnline: number
    lowStock: number
    landingViews: number
    landingConversions: number
  }
}

export interface ProductInput {
  id?: string
  sku: string
  name: string
  description?: string
  category?: string
  brand?: string
  price: number
  compare_at_price?: number | null
  cost_price?: number | null
  stock_quantity: number
  low_stock_threshold?: number
  variants?: Json
  images?: string[]
  channels?: string[]
  status?: 'draft' | 'active' | 'archived'
  is_featured?: boolean
}

export interface LandingPageInput {
  product_id: string
  slug: string
  headline: string
  subheadline: string
  description: string
  benefits: string[]
  faq: Array<{ question: string; answer: string }>
  social_proof: Array<{ quote: string; author: string }>
  urgency_text?: string
  cta_text: string
  theme: LandingPageTheme
  seo: { title: string; description: string }
  status?: 'draft' | 'published' | 'archived'
}

export interface LandingGenerationBrief {
  audience?: string
  campaignAngle?: string
  tone?: 'premium' | 'direct' | 'friendly' | 'minimal'
  language?: 'fr' | 'ar' | 'en'
  extraInstructions?: string
  designStyle?: 'luxury' | 'playful' | 'editorial' | 'minimal' | 'bold'
  landingStyle?: 'editorial' | 'luxury' | 'playful' | 'minimal' | 'bold'
  primaryColor?: string
  shippingZoneIds?: string[]
}

export interface LandingPageTheme {
  primary: string
  accent: string
  background?: string
  surface?: string
  text?: string
  style: 'editorial' | 'luxury' | 'playful' | 'minimal' | 'bold' | 'bold-impact' | string
  font?: 'outfit' | 'jakarta' | 'serif'
  heroLayout?: 'split' | 'editorial' | 'spotlight'
  radius?: 'soft' | 'rounded' | 'sharp'
  badge?: string
  announcement?: string
  trustNote?: string
  allowedShippingZoneIds?: string[]
  showRelatedProducts?: boolean
  showStickyCta?: boolean
}
