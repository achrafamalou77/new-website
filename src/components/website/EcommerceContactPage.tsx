'use client'

import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import type { EcommerceProduct } from '@/types/ecommerce'
import type { EcommerceStorefrontConfig } from '@/lib/ecommerce-storefront'
import EcommerceStoreShell from '@/components/website/EcommerceStoreShell'

export default function EcommerceContactPage({
  agency,
  products,
  config,
  preview = false,
  storefrontBaseUrl = '',
}: {
  agency: { company_name: string; phone?: string | null; email?: string | null; address?: string | null }
  products: EcommerceProduct[]
  config: EcommerceStorefrontConfig
  preview?: boolean
  storefrontBaseUrl?: string
}) {
  const whatsapp = String(agency.phone || '').replace(/\D/g, '')
  const cards = [
    [Phone, 'Phone', agency.phone || 'Not configured'],
    [Mail, 'Email', config.contactEmail || agency.email || 'Not configured'],
    [MapPin, 'Address', config.contactAddress || agency.address || 'Algeria'],
  ] as const

  return (
    <EcommerceStoreShell agency={agency} products={products} config={config} activePage="contact" preview={preview} storefrontBaseUrl={storefrontBaseUrl}>
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[.9fr_1.1fr] lg:px-8 lg:py-24">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em]" style={{ color: config.primaryColor }}>Contact</p>
          <h1 className="mt-4 text-4xl font-black leading-tight sm:text-6xl">{config.contactTitle}</h1>
          <p className="mt-6 max-w-xl text-base leading-8 opacity-60">{config.contactSubtitle}</p>
          <div className="mt-10 space-y-4">
            {cards.map(([Icon, title, value]) => (
              <div key={title} className="flex items-start gap-4 border p-5" style={{ background: config.surfaceColor, borderColor: `${config.textColor}15`, borderRadius: `${config.borderRadius}px` }}>
                <span className="grid h-11 w-11 shrink-0 place-items-center text-white" style={{ background: config.primaryColor, borderRadius: `${config.borderRadius}px` }}><Icon className="h-5 w-5" /></span>
                <div><p className="text-xs font-black uppercase tracking-wider opacity-45">{title}</p><p className="mt-2 text-sm font-bold">{value}</p></div>
              </div>
            ))}
          </div>
        </div>

        <div className="border p-7 sm:p-10" style={{ background: config.surfaceColor, borderColor: `${config.textColor}15`, borderRadius: `${config.borderRadius}px` }}>
          <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: config.primaryColor }}>About the store</p>
          <h2 className="mt-4 text-3xl font-black">{config.aboutTitle}</h2>
          <p className="mt-5 whitespace-pre-line text-sm leading-8 opacity-60">{config.aboutText}</p>
          {whatsapp && (
            <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent('Bonjour, je souhaite contacter votre boutique.')}`} className="mt-8 inline-flex items-center gap-3 px-6 py-4 text-sm font-black text-white" style={{ background: config.primaryColor, borderRadius: `${config.borderRadius}px` }}>
              <MessageCircle className="h-5 w-5" /> Chat on WhatsApp
            </a>
          )}
        </div>
      </section>
    </EcommerceStoreShell>
  )
}
