import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadEcommerceStore } from '@/lib/ecommerce-storefront-server'
import EcommercePolicyPage from '@/components/website/EcommercePolicyPage'

const policyMap = {
  shipping: ['Shipping policy', 'shippingPolicy'],
  returns: ['Returns policy', 'returnsPolicy'],
  privacy: ['Privacy policy', 'privacyPolicy'],
  terms: ['Terms and conditions', 'termsPolicy'],
} as const

export async function generateMetadata({ params }: { params: Promise<{ subdomain: string; slug: string }> }): Promise<Metadata> {
  const { subdomain, slug } = await params
  const data = await loadEcommerceStore(subdomain)
  const policy = policyMap[slug as keyof typeof policyMap]
  if (!data || !policy) return { title: 'Page not found' }
  return { title: `${policy[0]} | ${data.config.storeName}` }
}

export default async function PolicyPage({ params }: { params: Promise<{ subdomain: string; slug: string }> }) {
  const { subdomain, slug } = await params
  const data = await loadEcommerceStore(subdomain)
  const policy = policyMap[slug as keyof typeof policyMap]
  if (!data || !policy) notFound()
  return (
    <EcommercePolicyPage
      agency={data.agency}
      products={data.products}
      config={data.config}
      title={policy[0]}
      content={data.config[policy[1]]}
    />
  )
}
