import { CheckCircle2 } from 'lucide-react'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { ECOMMERCE_BUSINESS_TYPE_SLUGS } from '@/lib/business-types'

function money(value: number) {
  return `${Number(value || 0).toLocaleString('fr-DZ')} DZD`
}

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ subdomain: string; token: string }>
}) {
  const { subdomain, token } = await params
  const db: any = createAdminClient()
  const { data: agency } = await db
    .from('agencies')
    .select('id, company_name, phone')
    .eq('subdomain', subdomain)
    .in('business_type_slug', ECOMMERCE_BUSINESS_TYPE_SLUGS)
    .maybeSingle()
  if (!agency) notFound()

  const { data: order } = await db
    .from('ecommerce_orders')
    .select('order_number, customer_name, items, subtotal, shipping_fee, discount_amount, total, fulfillment_status, created_at')
    .eq('agency_id', agency.id)
    .eq('public_token', token)
    .maybeSingle()
  if (!order) notFound()

  const items = Array.isArray(order.items) ? order.items : []
  const whatsapp = String(agency.phone || '').replace(/\D/g, '')

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-16">
      <div className="w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl lg:p-12">
        <CheckCircle2 className="h-14 w-14 text-emerald-500" />
        <p className="mt-6 text-xs font-black uppercase tracking-[0.25em] text-emerald-600">Commande recue</p>
        <h1 className="mt-3 text-4xl font-black">Merci {order.customer_name}</h1>
        <p className="mt-3 text-slate-600">{agency.company_name} va vous contacter pour confirmer la livraison.</p>
        <div className="mt-8 rounded-2xl bg-slate-50 p-5">
          <div className="flex justify-between font-black"><span>Commande</span><span>{order.order_number}</span></div>
          {items.map((item: any, index: number) => (
            <div key={`${item.product_id}-${index}`} className="mt-4 flex justify-between border-t border-slate-200 pt-4 text-sm">
              <span>{item.name} x {item.quantity}</span>
              <span className="font-bold">{money(Number(item.unit_price) * Number(item.quantity))}</span>
            </div>
          ))}
          <div className="mt-5 space-y-2 border-t border-slate-200 pt-4 text-sm">
            <div className="flex justify-between"><span>Livraison</span><span>{money(order.shipping_fee)}</span></div>
            {Number(order.discount_amount) > 0 && <div className="flex justify-between text-emerald-600"><span>Reduction</span><span>-{money(order.discount_amount)}</span></div>}
            <div className="flex justify-between text-lg font-black"><span>Total</span><span>{money(order.total)}</span></div>
          </div>
        </div>
        {whatsapp && (
          <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Bonjour, je souhaite suivre la commande ${order.order_number}`)}`} className="mt-8 inline-flex rounded-full bg-slate-950 px-6 py-3 text-sm font-black text-white">
            Contacter la boutique
          </a>
        )}
      </div>
    </main>
  )
}
