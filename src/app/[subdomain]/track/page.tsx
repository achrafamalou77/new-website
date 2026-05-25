import { getPublicAgency } from '@/app/actions/public-cars'
import { notFound } from 'next/navigation'
import TrackingClient from './TrackingClient'
import type { Metadata } from 'next'

export async function generateMetadata(props: { params: Promise<{ subdomain: string }> }): Promise<Metadata> {
  const params = await props.params
  const agency = await getPublicAgency(params.subdomain).catch(() => null)
  if (!agency) return { title: 'Agency Not Found' }

  return {
    title: `Suivi d'Expédition \u2014 ${agency.company_name}`,
    description: `Suivez en temps réel l'état de livraison de vos véhicules importés avec ${agency.company_name}.`
  }
}

export default async function TrackPage(props: { params: Promise<{ subdomain: string }> }) {
  const params = await props.params
  const agency = await getPublicAgency(params.subdomain).catch(() => null)

  if (!agency) {
    notFound()
  }

  return <TrackingClient agency={agency} />
}
