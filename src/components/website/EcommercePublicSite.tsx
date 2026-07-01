import type { EcommerceProduct, EcommerceProductPage } from '@/types/ecommerce'
import EcommerceStorefrontRenderer from '@/components/website/EcommerceStorefrontRenderer'
import {
  normalizeEcommerceStorefrontConfig,
  type EcommerceStorefrontConfig,
  type EcommerceTemplateId,
} from '@/lib/ecommerce-storefront'

const legacyThemeMap: Record<string, EcommerceTemplateId> = {
  default: 'sole-district',
  'noir-luxe': 'sole-district',
  'bloom-fresh': 'sole-district',
  'titan-bold': 'sole-district',
  'terra-earth': 'sole-district',
  'neon-pulse': 'sole-district',
}

export default function EcommercePublicSite({
  agency,
  products,
  pages,
}: {
  agency: any
  products: EcommerceProduct[]
  pages: EcommerceProductPage[]
}) {
  const settings = agency.website_settings || {}
  const storedConfig = settings.storefront_config as EcommerceStorefrontConfig | undefined
  const templateId =
    settings.store_template_id ||
    legacyThemeMap[settings.store_theme] ||
    'sole-district'

  const config = normalizeEcommerceStorefrontConfig(storedConfig, agency.company_name, templateId)

  return (
    <EcommerceStorefrontRenderer
      agency={agency}
      products={products}
      pages={pages}
      config={config}
    />
  )
}
