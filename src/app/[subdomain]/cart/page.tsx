import { notFound } from 'next/navigation'
import { loadEcommerceStore } from '@/lib/ecommerce-storefront-server'
import EcommerceCartPage from '@/components/website/EcommerceCartPage'

export default async function CartPage({ params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await params
  const data = await loadEcommerceStore(subdomain)
  if (!data) notFound()
  return <EcommerceCartPage agency={data.agency} products={data.products} config={data.config} />
}
