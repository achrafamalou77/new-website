import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadEcommerceStore } from '@/lib/ecommerce-storefront-server'
import EcommerceCatalog from '@/components/website/EcommerceCatalog'

export async function generateMetadata({ params }: { params: Promise<{ subdomain: string }> }): Promise<Metadata> {
  const { subdomain } = await params
  const data = await loadEcommerceStore(subdomain)
  if (!data) return { title: 'Catalog not found' }
  return {
    title: `${data.config.catalogTitle} | ${data.config.storeName}`,
    description: data.config.catalogSubtitle,
  }
}

export default async function CatalogPage({ params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await params
  const data = await loadEcommerceStore(subdomain)
  if (!data) notFound()
  return <EcommerceCatalog agency={data.agency} products={data.products} config={data.config} />
}
