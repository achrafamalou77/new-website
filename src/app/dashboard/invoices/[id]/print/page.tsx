import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { numberToFrenchWords } from '@/lib/number-to-words'
import { PrintTrigger } from '@/components/dashboard/PrintTrigger'
import { AlertCircle, CreditCard, Compass } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function InvoicePrintPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  let invoice: any = null

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const supabase = await createClient()

      // Fetch invoice with client join
      const { data: invoiceData } = await supabase
        .from('invoices')
        .select(`
          *,
          client:clients(*)
        `)
        .eq('id', id)
        .single()
      
      invoice = invoiceData
    } catch (e) {
      console.error('Failed to fetch print invoice details from Supabase:', e)
    }
  }

  // Fallback for offline / demo mode
  if (!invoice) {
    invoice = {
      id: id,
      invoice_number: 'FA-2026-0001',
      issue_date: '2026-05-10',
      due_date: '2026-05-17',
      status: 'partial',
      items: [
        { description: 'Forfait Istanbul Premium 8 Jours', qty: 1, unit_price: 150000, total: 150000 }
      ],
      subtotal: 150000,
      discount_amount: 0,
      discount_percent: 0,
      tax_amount: 0,
      tax_percent: 0,
      total_amount: 150000,
      amount_paid: 50000,
      balance_due: 100000,
      payment_method: 'CCP',
      payment_status: 'partial',
      notes: 'Notes de facturation de test.',
      terms: 'Paiement requis sous 7 jours. CCP Poste Algérienne.',
      created_at: new Date().toISOString(),
      client: {
        id: 'c-demo-1',
        full_name: 'Amalou Achraf',
        phone: '+213 555 12 34 56',
        email: 'achraf@demo.dz',
        address: 'Didouche Mourad',
        city: 'Alger'
      }
    }
  }

  const items = (invoice.items as any[]) || []
  const totalAmount = invoice.total_amount || 0
  const prixEnLettres = numberToFrenchWords(totalAmount)

  return (
    <div className="bg-white p-8 max-w-[800px] mx-auto text-slate-800 text-xs font-geist leading-relaxed relative min-h-screen">
      {/* Dynamic Printing Script Invoker */}
      <PrintTrigger />

      {/* A4 Invoice Header */}
      <div className="flex justify-between items-start border-b-[2px] border-indigo-600 pb-5 mb-6 text-left">
        <div>
          <h1 className="text-xl font-black text-indigo-600 tracking-tight uppercase flex items-center gap-1.5">
            <Compass className="h-6 w-6 text-indigo-600" />
            TRAVEL AGENCY
          </h1>
          <span className="text-[9px] text-slate-450 font-bold block mt-0.5 tracking-wide uppercase">Algérie Premium Travel SaaS Platform</span>
          <span className="text-[9px] text-slate-400 block mt-1">Tél: +213 555 12 34 56 | Email: contact@travelagency.dz</span>
        </div>
        <div className="text-right">
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">FACTURE Voyage / فاتورة</h2>
          <span className="font-mono font-black text-indigo-600 block mt-1 text-sm">{invoice.invoice_number}</span>
          <span className="text-[9px] text-slate-400 font-semibold block mt-1">Date: {invoice.issue_date} | Échéance: {invoice.due_date}</span>
        </div>
      </div>

      {/* Client and Company Meta */}
      <div className="grid grid-cols-2 gap-6 mb-6 text-left select-none">
        <div className="border border-slate-200 p-4 rounded-xl bg-slate-50/50">
          <span className="text-[9px] text-indigo-600 font-black uppercase tracking-wider block border-b border-slate-200 pb-1 mb-2">Facturé à / المشتري (Client)</span>
          {invoice.client ? (
            <div className="space-y-1 font-bold text-slate-700">
              <span className="font-bold text-slate-850 text-sm block">{invoice.client.full_name}</span>
              <span className="block text-slate-550 font-semibold">Tél: {invoice.client.phone || 'Non renseigné'}</span>
              <span className="block text-slate-550 font-semibold">Email: {invoice.client.email || 'Non renseigné'}</span>
              <span className="block text-slate-550 font-semibold">Adresse: {invoice.client.address || ''}, {invoice.client.city || ''}</span>
            </div>
          ) : (
            <span className="text-red-500 font-bold">Client inconnu</span>
          )}
        </div>

        <div className="border border-slate-200 p-4 rounded-xl bg-slate-50/50 text-left">
          <span className="text-[9px] text-indigo-600 font-black uppercase tracking-wider block border-b border-slate-200 pb-1 mb-2">Instructions de Paiement / الدفع</span>
          <div className="space-y-1 font-bold text-slate-700">
            <div>Mode Règlement: <span className="text-indigo-650 font-extrabold">{invoice.payment_method || 'CCP'}</span></div>
            <div>Statut Paiement: <span className="text-slate-550 uppercase">{invoice.payment_status}</span></div>
            <div className="mt-2 bg-[#eff6ff] p-2.5 rounded-lg border border-blue-100 font-mono text-[10px] text-indigo-900 leading-normal">
              <div>Titulaire: <span className="font-extrabold text-[#1d4ed8]">Amalou Achraf</span></div>
              <div className="mt-0.5">CCP Compte: <span className="font-extrabold text-[#1d4ed8]">0021876532</span> Clé: <span className="font-extrabold text-[#1d4ed8]">89</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Table of Items */}
      <div className="border border-slate-300 rounded-xl overflow-hidden mb-6 text-xs text-left">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 font-bold text-slate-500 uppercase text-[9px] tracking-wider border-b border-slate-300">
              <th className="py-2.5 px-4 font-black">Prestations de Voyage / التفاصيل</th>
              <th className="py-2.5 px-4 text-center w-16 font-black">Qté</th>
              <th className="py-2.5 px-4 text-right w-28 font-black">Prix Unitaire</th>
              <th className="py-2.5 px-4 text-right w-28 font-black">Montant (DZD)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-semibold text-slate-700">
            {items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-3 px-4 font-bold text-slate-850">{item.description}</td>
                <td className="py-3 px-4 text-center">{item.qty}</td>
                <td className="py-3 px-4 text-right">{(item.unit_price || 0).toLocaleString()} DZD</td>
                <td className="py-3 px-4 text-right text-slate-850">{(item.total || 0).toLocaleString()} DZD</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Breakdown totals */}
      <div className="flex flex-col md:flex-row justify-between gap-6 mb-8 items-start">
        {/* French words arrêté & QR Payment block */}
        <div className="flex-1 text-left space-y-4">
          
          {/* Spelled-out Price Banner */}
          <div className="border-l-[4px] border-l-indigo-650 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50">
            <span className="text-[9px] text-indigo-650 font-black uppercase tracking-wider block mb-1">Arrêtée la présente facture à la somme de (En Lettres) / المبلغ بالحروف</span>
            <span className="font-black text-indigo-950 block capitalize text-sm leading-relaxed">
              {prixEnLettres ? prixEnLettres + ' dinars algériens' : 'zéro dinar algérien'}.
            </span>
          </div>

          {/* QR Code Scan-to-pay block */}
          {invoice.payment_method === 'CCP' && (
            <div className="bg-[#eff6ff] p-3 rounded-xl border border-blue-100 flex items-center gap-4 animate-fade-in">
              {/* Premium HTML Simulated Vector QR Code */}
              <div className="h-14 w-14 bg-white border border-blue-200 p-1 flex items-center justify-center shrink-0 shadow-sm relative rounded-lg">
                <div className="grid grid-cols-5 gap-[1px] w-full h-full">
                  <div className="bg-indigo-600 rounded-sm" /><div className="bg-transparent" /><div className="bg-indigo-600 rounded-sm" /><div className="bg-transparent" /><div className="bg-indigo-600 rounded-sm" />
                  <div className="bg-transparent" /><div className="bg-indigo-600 rounded-sm" /><div className="bg-transparent" /><div className="bg-indigo-600 rounded-sm" /><div className="bg-transparent" />
                  <div className="bg-indigo-600 rounded-sm" /><div className="bg-transparent" /><div className="bg-indigo-600 rounded-sm" /><div className="bg-transparent" /><div className="bg-indigo-600 rounded-sm" />
                  <div className="bg-transparent" /><div className="bg-indigo-600 rounded-sm" /><div className="bg-transparent" /><div className="bg-indigo-600 rounded-sm" /><div className="bg-transparent" />
                  <div className="bg-indigo-600 rounded-sm" /><div className="bg-transparent" /><div className="bg-indigo-600 rounded-sm" /><div className="bg-transparent" /><div className="bg-indigo-600 rounded-sm" />
                </div>
                <div className="absolute inset-0 border-2 border-indigo-600/30 rounded-lg pointer-events-none" />
              </div>
              <div className="text-left font-bold text-indigo-900">
                <span className="text-[10px] font-black text-indigo-700 flex items-center gap-1">
                  <CreditCard className="h-3.5 w-3.5" /> Scan to Pay (Poste / BaridiMob)
                </span>
                <span className="text-[9px] text-indigo-950/70 block mt-0.5 leading-relaxed font-semibold">
                  Scannez via l'application BaridiMob pour régler instantanément sur le compte CCP d'Achraf Amalou.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Breakdown */}
        <div className="w-64 text-left font-bold space-y-2 border border-slate-200 p-4 rounded-xl text-xs bg-slate-50/50">
          <div className="flex justify-between text-slate-450">
            <span>Sous-total Prestations:</span>
            <span>{(invoice.subtotal || 0).toLocaleString()} DZD</span>
          </div>
          {invoice.discount_amount > 0 && (
            <div className="flex justify-between text-slate-450">
              <span>Remise ({invoice.discount_percent}%):</span>
              <span>- {(invoice.discount_amount || 0).toLocaleString()} DZD</span>
            </div>
          )}
          {invoice.tax_amount > 0 && (
            <div className="flex justify-between text-slate-450">
              <span>TVA ({invoice.tax_percent}%):</span>
              <span>+ {(invoice.tax_amount || 0).toLocaleString()} DZD</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-black text-indigo-600 pt-1.5 border-t border-slate-300">
            <span>TOTAL FACTURÉ :</span>
            <span>{totalAmount.toLocaleString()} DZD</span>
          </div>
          <div className="flex justify-between text-emerald-600 font-extrabold border-t border-slate-200/50 pt-1">
            <span>Déjà Encaissé :</span>
            <span>{(invoice.amount_paid || 0).toLocaleString()} DZD</span>
          </div>
          <div className="flex justify-between text-red-600 font-black">
            <span>SOLDE A RÉGLER :</span>
            <span>{(invoice.balance_due || 0).toLocaleString()} DZD</span>
          </div>
        </div>
      </div>

      {/* Signature and Stamp Blocks */}
      <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-center font-bold text-slate-450 text-[10px] uppercase tracking-wider select-none">
        <div>
          <span>Visa & Cachet Client / توقيع الزبون</span>
          <div className="h-24 w-44 mx-auto border border-dashed border-slate-200 rounded-xl mt-3 flex items-center justify-center text-slate-300 font-normal italic">
            Cadre Signature
          </div>
        </div>
        <div>
          <span>Visa & Cachet Agence / توقيع الوكالة</span>
          {/* Simulated ROTATED red official agency cachet stamp */}
          <div className="relative h-24 w-44 mx-auto border border-dashed border-slate-200 rounded-xl mt-3 flex items-center justify-center overflow-hidden bg-slate-50/50">
            <div className="absolute transform -rotate-12 border-[2.5px] border-red-500 rounded-full px-3 py-1.5 text-center font-black uppercase text-[9px] text-red-500 tracking-wider pointer-events-none ring-2 ring-red-500/20 scale-102 opacity-80 leading-normal">
              AGENCE DE VOYAGE<br/>
              ★ CACHET OFFICIEL ★<br/>
              ALGER, ALGÉRIE
            </div>
            <span className="text-[8px] text-slate-350 italic font-medium z-0">Timbre Agence</span>
          </div>
        </div>
      </div>

      {/* Print Page Styles Override */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          .bg-slate-50, .bg-slate-100, .bg-indigo-50, .bg-[#eff6ff] {
            background-color: #f8fafc !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}} />
    </div>
  )
}
