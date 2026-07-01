import type { EcommerceProduct } from '@/types/ecommerce'
import type { EcommerceStorefrontConfig } from '@/lib/ecommerce-storefront'
import EcommerceStoreShell from '@/components/website/EcommerceStoreShell'

export default function EcommercePolicyPage({
  agency,
  products,
  config,
  title,
  content,
  preview = false,
  storefrontBaseUrl = '',
}: {
  agency: { company_name: string; phone?: string | null }
  products: EcommerceProduct[]
  config: EcommerceStorefrontConfig
  title: string
  content: string
  preview?: boolean
  storefrontBaseUrl?: string
}) {
  return (
    <EcommerceStoreShell agency={agency} products={products} config={config} activePage="policy" preview={preview} storefrontBaseUrl={storefrontBaseUrl}>
      <section className="mx-auto max-w-4xl px-5 py-16 lg:px-8 lg:py-24">
        <p className="text-xs font-black uppercase tracking-[0.25em]" style={{ color: config.primaryColor }}>Store information</p>
        <h1 className="mt-4 text-4xl font-black sm:text-6xl">{title}</h1>
        <div className="mt-10 border p-7 text-sm leading-8 opacity-70 sm:p-10" style={{ background: config.surfaceColor, borderColor: `${config.textColor}15`, borderRadius: `${config.borderRadius}px` }}>
          <p className="whitespace-pre-line">{content}</p>
        </div>
      </section>
    </EcommerceStoreShell>
  )
}
