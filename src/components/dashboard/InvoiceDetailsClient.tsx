'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { 
  ArrowLeft, FileText, Printer, Share2, CreditCard, Plus, HelpCircle, 
  Calendar, AlertCircle, CheckCircle, User, Award, MapPin, Copy, Save, Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { recordPaymentAction } from '@/app/actions/invoices'
import { numberToFrenchWords } from '@/lib/number-to-words'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { InvoicePDFDocument } from './InvoicePDFDocument'
import { cn } from '@/lib/utils'

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { ssr: false, loading: () => <span className="text-xs font-bold text-slate-400">Chargement du PDF...</span> }
)

interface InvoiceDetailsClientProps {
  invoice: any
  initialPayments: any[]
}

export function InvoiceDetailsClient({ invoice, initialPayments }: InvoiceDetailsClientProps) {
  const router = useRouter()
  const [payments, setPayments] = useState(initialPayments)
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Payment Form States
  const [amount, setAmount] = useState(invoice.balance_due)
  const [method, setMethod] = useState('CCP')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [refNum, setRefNum] = useState('')
  const [collector, setCollector] = useState('Amine Admin')
  const [notes, setNotes] = useState('')

  // Custom template saving state
  const [templateSavedMsg, setTemplateSavedMsg] = useState('')

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (Number(amount) <= 0) {
      setError('Le montant doit être supérieur à 0 DZD.')
      setLoading(false)
      return
    }

    if (Number(amount) > invoice.balance_due) {
      setError(`Le montant ne peut pas dépasser le solde restant de ${invoice.balance_due.toLocaleString()} DZD.`);
      setLoading(false)
      return
    }

    const payload = {
      amount: Number(amount),
      payment_method: method,
      payment_date: date,
      reference_number: refNum,
      notes: notes,
      received_by: collector,
    }

    try {
      const res = await recordPaymentAction(invoice.id, payload)
      if (res.success) {
        setModalOpen(false)
        router.refresh()
        setTimeout(() => {
          window.location.reload()
        }, 400)
      } else {
        setError(res.error || 'Erreur lors de l\'enregistrement du versement')
      }
    } catch (e: any) {
      setError(e.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const handleSendWhatsAppReceipt = () => {
    if (!invoice.client?.phone) {
      alert("Ce client n'a pas de numéro de téléphone enregistré.")
      return
    }
    const cleanPhone = invoice.client.phone.replace(/[^0-9]/g, '')
    const message = `Bonjour ${invoice.client.full_name}, Travel Agency confirme la réception de votre règlement de ${invoice.amount_paid.toLocaleString()} DZD pour la facture ${invoice.invoice_number} (solde restant: ${invoice.balance_due.toLocaleString()} DZD). Merci pour votre règlement.`
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  const handleSaveAsTemplate = () => {
    const tplName = prompt("Entrez un nom pour sauvegarder ces prestations comme modèle (ex: Turquie Premium 2026) :")
    if (!tplName || !tplName.trim()) return

    const newTpl = {
      name: tplName.trim(),
      items: invoice.items || [],
      discountPercent: invoice.discount_percent || 0,
      taxPercent: invoice.tax_percent || 0,
      paymentMethod: invoice.payment_method || 'CCP',
      terms: invoice.terms || ''
    }

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('saas_travel_invoice_templates')
      let list = []
      if (stored) {
        try {
          list = JSON.parse(stored)
        } catch (e) {}
      }
      list.push(newTpl)
      localStorage.setItem('saas_travel_invoice_templates', JSON.stringify(list))
      setTemplateSavedMsg("Modèle sauvegardé avec succès dans le wizard !")
      setTimeout(() => setTemplateSavedMsg(''), 4000)
    }
  }

  const getInvoiceStatusBadge = (inv: any) => {
    const isDatePast = parseISO(inv.due_date).getTime() < Date.now()
    const isOverdue = inv.status !== 'paid' && inv.status !== 'cancelled' && isDatePast

    if (isOverdue) {
      return (
        <Badge variant="outline" className="rounded-xl px-2 py-0.5 text-[10px] font-bold bg-red-50 text-red-650 border-red-150 animate-pulse flex items-center gap-1 shadow-sm ring-2 ring-red-100">
          <AlertCircle className="h-3 w-3 text-red-500 shrink-0" />
          Facture en Retard
        </Badge>
      )
    }

    const mapping: Record<string, { label: string; style: string }> = {
      draft: { label: 'Brouillon', style: 'bg-slate-100 text-slate-650 border-slate-200' },
      sent: { label: 'Envoyée', style: 'bg-blue-50 text-blue-655 border-blue-100' },
      paid: { label: 'Payée', style: 'bg-emerald-50 text-emerald-650 border-emerald-150' },
      partial: { label: 'Partiel', style: 'bg-amber-50 text-amber-655 border-amber-150' },
      cancelled: { label: 'Annulée', style: 'bg-rose-50 text-rose-500 border-rose-100' }
    }
    const current = mapping[inv.status] || { label: inv.status, style: 'bg-slate-100 text-slate-650' }
    return (
      <Badge variant="outline" className={`rounded-xl px-2 py-0.5 text-[10px] font-bold ${current.style}`}>
        {current.label}
      </Badge>
    )
  }

  const prixEnLettres = numberToFrenchWords(invoice.total_amount)
  const items = (invoice.items as any[]) || []

  // Timeline computation
  const totalAmount = invoice.total_amount || 1
  const amountPaid = invoice.amount_paid || 0
  const percentPaid = Math.round((amountPaid / totalAmount) * 100)

  // 4 steps determination
  const isAcompteChecked = percentPaid >= 25 || payments.length >= 1
  const isTranche1Checked = percentPaid >= 50 || payments.length >= 2
  const isTranche2Checked = percentPaid >= 75 || payments.length >= 3
  const isFinalChecked = percentPaid >= 100 || invoice.status === 'paid'

  // Approximate dates for nodes from historical receipts
  const acompteDate = payments[0] ? format(parseISO(payments[0].payment_date), 'dd/MM/yy') : null
  const tranche1Date = payments[1] ? format(parseISO(payments[1].payment_date), 'dd/MM/yy') : null
  const tranche2Date = payments[2] ? format(parseISO(payments[2].payment_date), 'dd/MM/yy') : null
  const finalDate = payments[payments.length - 1] && percentPaid >= 100 ? format(parseISO(payments[payments.length - 1].payment_date), 'dd/MM/yy') : null

  // Check if overdue for pulse red border animation
  const isDatePast = parseISO(invoice.due_date).getTime() < Date.now()
  const isOverdue = invoice.status !== 'paid' && invoice.status !== 'cancelled' && isDatePast

  return (
    <div className="space-y-7 text-left font-geist">
      {/* Back button */}
      <Link href="/dashboard/invoices" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-700 transition select-none">
        <ArrowLeft className="h-4 w-4" />
        Retour aux Factures
      </Link>

      {/* Header Actions */}
      <div className={cn(
        "flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/50 shadow-sm",
        isOverdue ? "border-l-[4px] border-l-red-500 animate-pulse-details" : ""
      )}>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              Détails Facture : {invoice.invoice_number}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {getInvoiceStatusBadge(invoice)}
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">ID: {invoice.id.substring(0, 8)}...</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Duplicate Cloner Link */}
          <Link href={`/dashboard/invoices/new?duplicate_id=${invoice.id}`}>
            <Button variant="outline" className="rounded-xl border-slate-200 text-slate-600 text-xs font-bold py-2 px-3 flex items-center gap-1.5 transition">
              <Copy className="h-4 w-4" />
              Dupliquer Facture
            </Button>
          </Link>

          {/* Save as Template button */}
          <Button 
            variant="outline" 
            onClick={handleSaveAsTemplate}
            className="rounded-xl border-slate-200 text-slate-600 text-xs font-bold py-2 px-3 flex items-center gap-1.5 transition"
          >
            <Save className="h-4 w-4" />
            Sauver comme Modèle
          </Button>

          {/* Print Layout */}
          <Link href={`/dashboard/invoices/${invoice.id}/print`} target="_blank">
            <Button variant="outline" className="rounded-xl border-slate-200 text-slate-600 text-xs font-bold py-2 px-3 flex items-center gap-1.5 transition">
              <Printer className="h-4 w-4" />
              Imprimer (A4)
            </Button>
          </Link>

          {/* Dynamic react-pdf Download Link */}
          <div className="rounded-xl border border-slate-200 hover:bg-slate-50 transition px-3 py-2 text-xs font-bold flex items-center justify-center bg-white cursor-pointer select-none">
            <PDFDownloadLink 
              document={<InvoicePDFDocument invoice={invoice} />} 
              fileName={`Facture-${invoice.invoice_number}.pdf`}
            >
              {({ loading }) => (
                <span className="text-slate-655 flex items-center gap-1.5 text-slate-700">
                  <FileText className="h-4 w-4 text-slate-500" />
                  {loading ? 'Préparation PDF...' : 'Télécharger PDF'}
                </span>
              )}
            </PDFDownloadLink>
          </div>

          {/* WhatsApp receipt share */}
          {invoice.client?.phone && (
            <Button 
              variant="outline"
              onClick={handleSendWhatsAppReceipt}
              className="rounded-xl border-[#25D366]/35 text-[#25D366] hover:bg-[#25D366]/5 text-xs font-bold py-2 px-3 flex items-center gap-1.5 transition"
            >
              <Share2 className="h-4 w-4" />
              WhatsApp Reçu
            </Button>
          )}

          {/* Record payment */}
          {invoice.balance_due > 0 && (
            <Button 
              onClick={() => {
                setAmount(invoice.balance_due)
                setModalOpen(true)
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold py-2 px-4 shadow-sm shadow-indigo-150 transition flex items-center gap-1.5"
            >
              <Plus className="h-4.5 w-4.5" />
              Enregistrer Versement
            </Button>
          )}
        </div>
      </div>

      {templateSavedMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-700 text-xs font-black rounded-2xl border border-emerald-100 flex items-center gap-2 animate-bounce">
          <CheckCircle className="h-4.5 w-4.5 text-emerald-600" />
          {templateSavedMsg}
        </div>
      )}

      {/* PROGRESSIVE PAYMENT TIMELINE */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-2">
            <CreditCard className="h-4.5 w-4.5 text-indigo-650" />
            Échéancier & Ligne Temporelle des Versements ({percentPaid}% payé)
          </h3>
          <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 uppercase tracking-widest text-[9px] rounded-xl font-bold py-1">
            Installments timeline
          </Badge>
        </div>
        
        <div className="relative pt-4 pb-2 px-4 select-none">
          {/* Background track line */}
          <div className="absolute top-1/2 left-8 right-8 h-1 bg-slate-100 -translate-y-1/2 z-0" />
          {/* Active track line fill */}
          <div 
            className="absolute top-1/2 left-8 h-1 bg-indigo-500 -translate-y-1/2 z-0 transition-all duration-500"
            style={{ width: `calc(${Math.min(percentPaid, 100)}% - 40px)` }}
          />
          
          <div className="flex items-center justify-between relative z-10">
            {/* Node 1: Acompte */}
            <div className="flex flex-col items-center gap-1 bg-white px-2">
              <div className={cn(
                "h-8 w-8 rounded-full border-2 flex items-center justify-center font-bold text-xs transition duration-300",
                isAcompteChecked ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100 scale-110" : "bg-white border-slate-200 text-slate-400"
              )}>
                {isAcompteChecked ? <Check className="h-4 w-4" /> : "1"}
              </div>
              <span className="text-[10px] font-black text-slate-800 mt-1 uppercase tracking-wide">Acompte (Deposit)</span>
              <span className="text-[9px] text-slate-400 font-bold">{acompteDate || "25% requis"}</span>
            </div>

            {/* Node 2: Installment 1 */}
            <div className="flex flex-col items-center gap-1 bg-white px-2">
              <div className={cn(
                "h-8 w-8 rounded-full border-2 flex items-center justify-center font-bold text-xs transition duration-300",
                isTranche1Checked ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100 scale-110" : "bg-white border-slate-200 text-slate-400"
              )}>
                {isTranche1Checked ? <Check className="h-4 w-4" /> : "2"}
              </div>
              <span className="text-[10px] font-black text-slate-800 mt-1 uppercase tracking-wide">Versement 1</span>
              <span className="text-[9px] text-slate-400 font-bold">{tranche1Date || "50% requis"}</span>
            </div>

            {/* Node 3: Installment 2 */}
            <div className="flex flex-col items-center gap-1 bg-white px-2">
              <div className={cn(
                "h-8 w-8 rounded-full border-2 flex items-center justify-center font-bold text-xs transition duration-300",
                isTranche2Checked ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100 scale-110" : "bg-white border-slate-200 text-slate-400"
              )}>
                {isTranche2Checked ? <Check className="h-4 w-4" /> : "3"}
              </div>
              <span className="text-[10px] font-black text-slate-800 mt-1 uppercase tracking-wide">Versement 2</span>
              <span className="text-[9px] text-slate-400 font-bold">{tranche2Date || "75% requis"}</span>
            </div>

            {/* Node 4: Solde Final */}
            <div className="flex flex-col items-center gap-1 bg-white px-2">
              <div className={cn(
                "h-8 w-8 rounded-full border-2 flex items-center justify-center font-bold text-xs transition duration-300",
                isFinalChecked ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-100 scale-110" : "bg-white border-slate-200 text-slate-400"
              )}>
                {isFinalChecked ? <Check className="h-4 w-4" /> : "4"}
              </div>
              <span className="text-[10px] font-black text-slate-800 mt-1 uppercase tracking-wide">Solde Final</span>
              <span className="text-[9px] text-slate-400 font-bold">{finalDate || "100% payé"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Overview & Client Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Bill To Info */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/50 shadow-sm text-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2.5 flex items-center gap-1.5">
            <User className="h-4 w-4 text-indigo-500" />
            Facturé à (Voyageur)
          </h3>

          {invoice.client ? (
            <div className="grid grid-cols-2 gap-4 text-left">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Nom Complet :</span>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block">{invoice.client.full_name}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Téléphone de Contact :</span>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block">{invoice.client.phone || 'Non renseigné'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Adresse Email :</span>
                <span className="font-bold text-slate-655 mt-0.5 block">{invoice.client.email || 'Non renseignée'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Localisation :</span>
                <span className="font-extrabold text-slate-700 mt-0.5 block flex items-center gap-0.5"><MapPin className="h-3.5 w-3.5 text-indigo-500 shrink-0" />{invoice.client.address || ''}, {invoice.client.city || ''}</span>
              </div>
            </div>
          ) : (
            <span className="text-red-500 font-bold">Détails client indisponibles.</span>
          )}
        </div>

        {/* Invoice details & Dates */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/50 shadow-sm text-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2.5 flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-indigo-500" />
            Informations Échéance
          </h3>
          <div className="space-y-3 font-bold text-slate-800 text-left">
            <div className="flex justify-between">
              <span className="text-slate-450 font-normal">Date d'Émission :</span>
              <span>{invoice.issue_date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-450 font-normal">Date Échéance Limite :</span>
              <span className="text-red-655 font-bold">{invoice.due_date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-450 font-normal">Méthode de Règlement :</span>
              <span className="text-indigo-650 text-indigo-600 font-bold">{invoice.payment_method || 'CCP'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Prestations Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden text-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-800 text-sm">
          Prestations de Voyage & Détail Tarifs
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
              <th className="py-3 px-6">Description Prestation</th>
              <th className="py-3 px-4 text-center">Quantité</th>
              <th className="py-3 px-4 text-right">Prix Unitaire</th>
              <th className="py-3 px-6 text-right">Total (DZD)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
            {items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-3.5 px-6 font-bold text-slate-800">{item.description}</td>
                <td className="py-3.5 px-4 text-center">{item.qty}</td>
                <td className="py-3.5 px-4 text-right">{(item.unit_price || 0).toLocaleString()} DZD</td>
                <td className="py-3.5 px-6 text-right text-slate-800">{(item.total || 0).toLocaleString()} DZD</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Calculations breakdown & Prix en Lettres */}
        <div className="p-6 bg-slate-50/30 border-t border-slate-100 flex flex-col md:flex-row justify-between gap-6">
          {/* Prix en lettres en français */}
          <div className="flex-1 text-left space-y-3">
            <div className="bg-slate-100 p-4 rounded-xl border border-slate-200/40 text-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Arrêté la présente facture à la somme de (En Lettres) :</span>
              <span className="font-black text-indigo-900 leading-relaxed block capitalize text-sm">
                {prixEnLettres ? prixEnLettres + ' dinars algériens' : 'zéro dinar algérien'}.
              </span>
            </div>

            {/* CCP account instructions */}
            {invoice.payment_method === 'CCP' && (
              <div className="bg-[#eff6ff] p-4 rounded-xl border border-blue-100 text-xs text-left animate-fade-in">
                <span className="font-bold text-[#1d4ed8] block mb-1">Informations de Paiement CCP :</span>
                <span className="block font-bold text-[#1e3a8a] mt-1 font-mono">
                  Titulaire : <span className="font-extrabold">Amalou Achraf</span> | CCP Compte : <span className="font-extrabold">0021876532</span> Clé : <span className="font-extrabold">89</span>
                </span>
              </div>
            )}
          </div>

          {/* Subtotals Block */}
          <div className="w-full md:w-80 text-left text-xs font-semibold space-y-2.5">
            <div className="flex justify-between text-slate-400">
              <span>Sous-total Prestations:</span>
              <span>{(invoice.subtotal || 0).toLocaleString()} DZD</span>
            </div>
            {invoice.discount_amount > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Remise Générale ({invoice.discount_percent}%):</span>
                <span>- {(invoice.discount_amount || 0).toLocaleString()} DZD</span>
              </div>
            )}
            {invoice.tax_amount > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>TVA Complémentaire ({invoice.tax_percent}%):</span>
                <span>+ {(invoice.tax_amount || 0).toLocaleString()} DZD</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-slate-800 border-t border-slate-100 pt-2">
              <span>MONTANT TOTAL DZD :</span>
              <span className="text-indigo-650 text-indigo-650 text-indigo-600">{invoice.total_amount.toLocaleString()} DZD</span>
            </div>
            <div className="flex justify-between text-emerald-600 font-bold pt-1 border-t border-slate-100/50">
              <span>Déjà Encaissé :</span>
              <span>{(invoice.amount_paid || 0).toLocaleString()} DZD</span>
            </div>
            <div className="flex justify-between text-red-655 text-red-655 text-red-600 font-bold pt-1">
              <span>SOLDE RESTANT DU :</span>
              <span>{(invoice.balance_due || 0).toLocaleString()} DZD</span>
            </div>
          </div>
        </div>
      </div>

      {/* Règlements & Partial Payments Tracking Table */}
      <div className="bg-white rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden text-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-800 text-sm flex items-center justify-between">
          <span>Historique des Versements Reçus (Tactile Payment Sheet)</span>
          <Badge className="bg-emerald-500 text-white font-bold">{payments.length} Versements</Badge>
        </div>

        {payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                  <th className="py-2.5 px-6">Date Versement</th>
                  <th className="py-2.5 px-4">Montant Reçu</th>
                  <th className="py-2.5 px-4">Mode Règlement</th>
                  <th className="py-2.5 px-4">Réf / Reçu N°</th>
                  <th className="py-2.5 px-4">Encaissé Par</th>
                  <th className="py-2.5 px-6">Notes / Remarques</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {payments.map((p, idx) => (
                  <tr key={p.id || idx}>
                    <td className="py-3 px-6 text-slate-400 font-medium">
                      {format(parseISO(p.payment_date), 'd MMMM yyyy', { locale: fr })}
                    </td>
                    <td className="py-3 px-4 text-emerald-600 font-bold">{(p.amount || 0).toLocaleString()} DZD</td>
                    <td className="py-3 px-4 text-slate-800">{p.payment_method}</td>
                    <td className="py-3 px-4 font-mono text-slate-550 text-[10px]">{p.reference_number || <span className="text-slate-400 font-normal italic">Aucun</span>}</td>
                    <td className="py-3 px-4 text-slate-655 font-bold">{p.received_by || 'Admin'}</td>
                    <td className="py-3 px-6 text-slate-400 font-normal">{p.notes || <span className="italic">Aucune remarque</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 italic">
            Aucun versement n'a encore été enregistré pour cette facture. Le solde du est de 100%.
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {modalOpen && (
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-md rounded-2xl overflow-hidden font-geist bg-white border border-slate-100 shadow-xl">
            <DialogHeader className="text-left pb-2 border-b border-slate-100">
              <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-indigo-500" />
                Enregistrer un Versement Client
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs">
                Enregistrez un paiement partiel ou total reçu pour la facture {invoice.invoice_number}. Le solde restant sera recalculé instantanément.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleRecordPayment} className="space-y-4 py-4 text-left">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-100">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Montant Encaissé (DZD) <span className="text-red-500">*</span></Label>
                <Input 
                  type="number"
                  required
                  max={invoice.balance_due}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder={`Max: ${invoice.balance_due.toLocaleString()} DZD`}
                  className="rounded-xl bg-slate-100 border-0 text-sm focus:bg-white transition" 
                />
                <span className="text-[10px] text-slate-400 font-medium block">Solde restant facturé : {invoice.balance_due.toLocaleString()} DZD</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Mode Règlement <span className="text-red-500">*</span></Label>
                  <select 
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="flex h-10 w-full items-center justify-between rounded-xl border-0 bg-slate-100 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                  >
                    <option value="CCP">CCP (Poste)</option>
                    <option value="Edahabia">Edahabia (CIB)</option>
                    <option value="Cash">Espèces</option>
                    <option value="Bank Transfer">Virement</option>
                    <option value="Check">Chèque</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Date Versement <span className="text-red-500">*</span></Label>
                  <Input 
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="rounded-xl bg-slate-100 border-0 text-xs focus:bg-white transition" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Référence / N° Reçu</Label>
                  <Input 
                    value={refNum}
                    onChange={(e) => setRefNum(e.target.value)}
                    placeholder="E.g., BORD-12345"
                    className="rounded-xl bg-slate-100 border-0 text-xs focus:bg-white transition" 
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Encaissé par (Agent)</Label>
                  <Input 
                    value={collector}
                    onChange={(e) => setCollector(e.target.value)}
                    placeholder="E.g., Amine Admin"
                    className="rounded-xl bg-slate-100 border-0 text-xs focus:bg-white transition" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Notes / Remarques Internes</Label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="flex min-h-[60px] w-full rounded-xl border-0 bg-slate-100 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition resize-y" 
                  placeholder="Renseignez les détails du versement (ex: virement en attente)..." 
                />
              </div>

              <DialogFooter className="pt-4 border-t border-slate-100 gap-2 flex items-center justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border-slate-200 text-slate-600 text-xs"
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-indigo-650 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-150"
                >
                  {loading ? 'Enregistrement...' : 'Valider le Règlement'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Pulse Red Details Border & Shadow keyframe overrides */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-details {
          0%, 100% {
            box-shadow: 0 4px 20px -4px rgba(239, 68, 68, 0.05);
            border-color: rgba(239, 68, 68, 0.2);
          }
          50% {
            box-shadow: 0 4px 24px 2px rgba(239, 68, 68, 0.15);
            border-color: rgba(239, 68, 68, 0.4);
          }
        }
        .animate-pulse-details {
          animation: pulse-details 3s infinite ease-in-out;
        }
      `}} />
    </div>
  )
}
