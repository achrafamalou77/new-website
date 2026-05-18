'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  FileText, User, Calendar, ListPlus, Sliders, CreditCard, Check, 
  ArrowRight, ArrowLeft, Trash2, Plus, AlertCircle, Compass, HelpCircle, 
  Save, Copy, Sparkles, FolderHeart
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { AddClientModal } from './AddClientModal'
import { createInvoiceAction, getInvoiceAction } from '@/app/actions/invoices'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface NewInvoiceWizardClientProps {
  initialClients: any[]
  initialTrips: any[]
}

interface PrestationTemplate {
  name: string;
  items: Array<{ description: string; qty: number; unit_price: number; total: number }>;
  discountPercent: number;
  taxPercent: number;
  paymentMethod: 'CCP' | 'Edahabia' | 'Cash' | 'Bank Transfer' | 'Check';
  terms: string;
}

export function NewInvoiceWizardClient({ initialClients, initialTrips }: NewInvoiceWizardClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [clients, setClients] = useState(initialClients)
  const [trips] = useState(initialTrips)
  
  // Wizard steps
  const [step, setStep] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1: Client Select
  const [selectedClientId, setSelectedClientId] = useState('')
  
  // Step 2: Trip & Dates
  const [selectedTripId, setSelectedTripId] = useState('')
  const [issueDate, setIssueDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [dueDate, setDueDate] = useState(format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'))
  
  // Step 3: Line Items
  const [items, setItems] = useState<Array<{ description: string; qty: number; unit_price: number; total: number }>>([
    { description: '', qty: 1, unit_price: 0, total: 0 }
  ])

  // Step 4: Discounts & Taxes
  const [discountPercent, setDiscountPercent] = useState(0)
  const [taxPercent, setTaxPercent] = useState(0)
  
  // Step 5: Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'CCP' | 'Edahabia' | 'Cash' | 'Bank Transfer' | 'Check'>('CCP')
  const [notes, setNotes] = useState('')
  const [terms, setTerms] = useState('Paiement requis à réception. CCP Poste Algérienne : 0021876532 Clé 89.')

  // Custom Local Storage Templates
  const [customTemplates, setCustomTemplates] = useState<PrestationTemplate[]>([])
  const [newTemplateName, setNewTemplateName] = useState('')
  const [templateSavedMsg, setTemplateSavedMsg] = useState('')

  // System Catalog Templates
  const systemTemplates: PrestationTemplate[] = [
    {
      name: '🇹🇷 Turquie Standard (Circuit 9 Jours)',
      items: [{ description: 'Forfait Circuit Turquie Premium 9 Jours (Vol, Transferts, Hôtel 4* DP, Guides)', qty: 1, unit_price: 145000, total: 145000 }],
      discountPercent: 0,
      taxPercent: 0,
      paymentMethod: 'CCP',
      terms: 'Paiement requis à la réservation. CCP Poste Algérienne : 0021876532 Clé 89.'
    },
    {
      name: '🕋 Omra Confort (15 Jours Double)',
      items: [{ description: 'Séjour Omra 15 Jours VIP (Vol direct, Visa Omra, Chambre Double, Hôtel Proche Haram)', qty: 1, unit_price: 290000, total: 290000 }],
      discountPercent: 0,
      taxPercent: 0,
      paymentMethod: 'CCP',
      terms: 'Paiement requis sous 7 jours. CCP Poste Algérienne : 0021876532 Clé 89.'
    },
    {
      name: '🇹🇳 Tunisie Balnéaire (Bus VIP)',
      items: [{ description: 'Forfait Séjour Balnéaire Hammamet (Bus VIP climatisé + Hôtel 4* All-Inclusive)', qty: 1, unit_price: 68000, total: 68000 }],
      discountPercent: 0,
      taxPercent: 0,
      paymentMethod: 'Cash',
      terms: 'Paiement cash en agence.'
    }
  ]

  // Auto-populate client if passed in query param
  useEffect(() => {
    const cId = searchParams.get('client_id')
    if (cId) {
      setSelectedClientId(cId)
    }
  }, [searchParams])

  // Load custom templates on mount
  useEffect(() => {
    const stored = localStorage.getItem('saas_travel_invoice_templates')
    if (stored) {
      try {
        setCustomTemplates(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to parse templates', e)
      }
    }
  }, [])

  // Duplicate Invoice or Template Loader
  useEffect(() => {
    const duplicateId = searchParams.get('duplicate_id')
    if (duplicateId) {
      const fetchDuplicate = async () => {
        setLoading(true)
        setError(null)
        try {
          const res = await getInvoiceAction(duplicateId)
          if (res.success && res.invoice) {
            const inv = res.invoice
            setSelectedClientId(inv.client_id || '')
            setSelectedTripId(inv.trip_id || '')
            setItems(inv.items || [{ description: '', qty: 1, unit_price: 0, total: 0 }])
            setDiscountPercent(inv.discount_percent || 0)
            setTaxPercent(inv.tax_percent || 0)
            setPaymentMethod(inv.payment_method || 'CCP')
            setNotes(inv.notes || '')
            setTerms(inv.terms || '')
            setStep(3) // Skip directly to items to review
          } else {
            setError(res.error || 'Erreur lors du chargement de la facture à dupliquer')
          }
        } catch (e: any) {
          setError(e.message || 'Impossible de joindre le serveur.')
        } finally {
          setLoading(false)
        }
      }
      fetchDuplicate()
    }
  }, [searchParams])

  // Auto-populate Trip Pricing
  const handleTripChange = (tripId: string) => {
    setSelectedTripId(tripId)
    if (!tripId) return

    const trip = trips.find(t => t.id === tripId)
    if (trip) {
      setItems([{
        description: `Forfait Voyage : ${trip.title} (Destination: ${trip.destination})`,
        qty: 1,
        unit_price: Number(trip.price || 0),
        total: Number(trip.price || 0)
      }])
    }
  }

  // Load selected template
  const handleLoadTemplate = (tpl: PrestationTemplate) => {
    setItems(tpl.items)
    setDiscountPercent(tpl.discountPercent)
    setTaxPercent(tpl.taxPercent)
    setPaymentMethod(tpl.paymentMethod)
    setTerms(tpl.terms)
    alert(`Modèle "${tpl.name}" chargé avec succès !`)
  }

  // Save current details as a template
  const handleSaveAsTemplate = () => {
    if (!newTemplateName.trim()) {
      alert('Veuillez entrer un nom pour le modèle (ex: Tunisie Famille).')
      return
    }
    const tpl: PrestationTemplate = {
      name: newTemplateName.trim(),
      items,
      discountPercent,
      taxPercent,
      paymentMethod,
      terms
    }
    const next = [...customTemplates, tpl]
    setCustomTemplates(next)
    localStorage.setItem('saas_travel_invoice_templates', JSON.stringify(next))
    setNewTemplateName('')
    setTemplateSavedMsg('Modèle sauvegardé avec succès !')
    setTimeout(() => setTemplateSavedMsg(''), 3000)
  }

  // Delete custom template
  const handleDeleteTemplate = (name: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const next = customTemplates.filter(t => t.name !== name)
    setCustomTemplates(next)
    localStorage.setItem('saas_travel_invoice_templates', JSON.stringify(next))
  }

  // Handle client creations inside wizard
  const handleNewClientSuccess = () => {
    window.location.reload()
  }

  // Item handlers
  const handleItemChange = (index: number, field: string, val: any) => {
    const newItems = [...items]
    const item = { ...newItems[index] } as any
    item[field] = val
    if (field === 'qty' || field === 'unit_price') {
      item.total = Number(item.qty || 0) * Number(item.unit_price || 0)
    }
    newItems[index] = item
    setItems(newItems)
  }

  const handleAddItemRow = () => {
    setItems([...items, { description: '', qty: 1, unit_price: 0, total: 0 }])
  }

  const handleDeleteItemRow = (index: number) => {
    if (items.length === 1) return
    setItems(items.filter((_, idx) => idx !== index))
  }

  // Financial calculations
  const subtotal = items.reduce((acc, item) => acc + Number(item.total || 0), 0)
  const discountAmount = Math.round(subtotal * (discountPercent / 100))
  const taxAmount = Math.round((subtotal - discountAmount) * (taxPercent / 100))
  const totalAmount = subtotal - discountAmount + taxAmount

  // Submission handler
  const handleSaveInvoice = async () => {
    setLoading(true)
    setError(null)

    const payload = {
      client_id: selectedClientId,
      trip_id: selectedTripId || null,
      issue_date: issueDate,
      due_date: dueDate,
      status: 'sent', // default status
      items,
      subtotal,
      discount_amount: discountAmount,
      discount_percent: discountPercent,
      tax_amount: taxAmount,
      tax_percent: taxPercent,
      total_amount: totalAmount,
      payment_method: paymentMethod,
      notes,
      terms,
    }

    try {
      const res = await createInvoiceAction(payload)
      if (res.success && res.invoiceId) {
        router.push(`/dashboard/invoices/${res.invoiceId}`)
      } else {
        setError(res.error || 'Erreur lors de la sauvegarde de la facture')
      }
    } catch (e: any) {
      setError(e.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const selectedClient = clients.find(c => c.id === selectedClientId)
  const selectedTrip = trips.find(t => t.id === selectedTripId)

  // Steps definitions
  const stepsList = [
    { num: 1, name: 'Client', icon: User },
    { num: 2, name: 'Détails & Trip', icon: Calendar },
    { num: 3, name: 'Articles', icon: ListPlus },
    { num: 4, name: 'Calculs', icon: Sliders },
    { num: 5, name: 'Règlement', icon: CreditCard },
    { num: 6, name: 'Validation', icon: Check },
  ]

  return (
    <div className="space-y-7 text-left max-w-4xl mx-auto font-geist p-1">
      {/* Back button */}
      <Link href="/dashboard/invoices" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-700 transition select-none">
        <ArrowLeft className="h-4 w-4" />
        Retour aux Factures
      </Link>

      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="space-y-1">
          <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-indigo-650 text-indigo-600" />
            Assistant de Facturation (Slick Wizard)
          </h1>
          <p className="text-slate-400 text-xs">Générez une facture de voyage ou dupliquez un modèle en 6 étapes interactives.</p>
        </div>
        <Badge className="bg-indigo-50 text-indigo-600 border-indigo-150 uppercase tracking-widest text-[9px] rounded-xl font-bold py-1">
          SaaS Travel billing
        </Badge>
      </div>

      {/* Step Indicators */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto select-none">
        <div className="flex items-center justify-between min-w-[650px] relative">
          {/* Connector bar */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
          <div 
            className="absolute top-1/2 left-0 h-0.5 bg-indigo-500 -translate-y-1/2 z-0 transition-all duration-300"
            style={{ width: `${((step - 1) / 5) * 100}%` }}
          />

          {stepsList.map(s => {
            const isCompleted = step > s.num
            const isActive = step === s.num
            return (
              <button 
                key={s.num}
                onClick={() => {
                  if (s.num < step) setStep(s.num)
                }}
                disabled={s.num > step}
                className="z-10 flex flex-col items-center gap-2 disabled:cursor-not-allowed group focus:outline-none"
              >
                <div className={cn(
                  "h-9 w-9 rounded-xl border flex items-center justify-center font-bold text-xs transition duration-205",
                  isCompleted ? "bg-indigo-600 border-indigo-600 text-white shadow-sm" :
                  isActive ? "bg-white border-indigo-600 text-indigo-600 ring-4 ring-indigo-50 shadow-md scale-105" :
                  "bg-white border-slate-200 text-slate-400"
                )}>
                  {isCompleted ? <Check className="h-4.5 w-4.5" /> : <s.icon className="h-4 w-4" />}
                </div>
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-wider",
                  isActive ? "text-indigo-600" : "text-slate-400"
                )}>
                  {s.name}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Steps Contents */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        {error && (
          <div className="p-4 bg-red-50 text-red-700 text-xs font-semibold rounded-2xl border border-red-100 mb-5 flex items-center gap-2">
            <AlertCircle className="h-4.5 w-4.5 text-red-650 shrink-0" />
            {error}
          </div>
        )}

        {/* STEP 1: Select Client */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <User className="h-4.5 w-4.5 text-indigo-500" />
                Sélection du Client Voyageur
              </h3>
              <Button 
                onClick={() => setModalOpen(true)}
                variant="outline" 
                className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 text-xs rounded-xl font-bold py-1.5 px-3 flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Créer un Voyageur
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-655 block">Choisissez le client dans la liste :</Label>
              <select 
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="flex h-11 w-full items-center justify-between rounded-xl border-0 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition cursor-pointer font-bold"
              >
                <option value="">-- Cliquer pour choisir un client --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.full_name} ({c.phone || c.email || 'Sans contact'})</option>
                ))}
              </select>
            </div>

            {selectedClient && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-4 animate-fade-in text-left">
                <div className="h-11 w-11 rounded-xl bg-indigo-50 text-indigo-650 font-bold text-sm flex items-center justify-center shrink-0">
                  {selectedClient.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div className="text-xs">
                  <span className="font-bold text-slate-800 text-sm block">{selectedClient.full_name}</span>
                  <span className="text-slate-400 block mt-0.5">{selectedClient.email || 'Pas d\'email'} | {selectedClient.phone || 'Pas de téléphone'}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Trip & Dates */}
        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-indigo-500" />
              Catalogue Trips & Échéances de Paiement
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2 col-span-1 md:col-span-2">
                <Label className="text-xs font-bold text-slate-655 flex items-center gap-1">
                  Associer un Voyage / Trip <span className="text-slate-400 font-normal italic">(Facultatif - Remplira les articles automatiquement)</span>
                </Label>
                <select 
                  value={selectedTripId}
                  onChange={(e) => handleTripChange(e.target.value)}
                  className="flex h-11 w-full items-center justify-between rounded-xl border-0 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition cursor-pointer font-bold"
                >
                  <option value="">-- Aucun voyage du catalogue --</option>
                  {trips.map(t => (
                    <option key={t.id} value={t.id}>{t.title} ({(t.price || 0).toLocaleString()} DZD)</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-655">Date d'Émission <span className="text-red-500">*</span></Label>
                <Input 
                  type="date" 
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="rounded-xl bg-slate-50 border-0 h-11 focus:bg-white font-bold" 
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-655">Échéance de Paiement <span className="text-red-500">*</span></Label>
                <Input 
                  type="date" 
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="rounded-xl bg-slate-50 border-0 h-11 focus:bg-white font-bold" 
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Line Items & Templates Manager */}
        {step === 3 && (
          <div className="space-y-6">
            
            {/* Catalog Templates Selector Block */}
            <div className="bg-indigo-50/40 p-5 border border-indigo-100 rounded-3xl space-y-4">
              <div className="flex items-center gap-1.5 text-indigo-950 font-black text-xs uppercase tracking-wider">
                <FolderHeart className="h-4.5 w-4.5 text-indigo-600" /> Modèles de Prestations (Templates)
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Chargez un modèle pré-enregistré pour les voyageurs réguliers, ou enregistrez les prestations ci-dessous pour de futures facturations rapides.
              </p>
              
              {/* Load template section */}
              <div className="flex flex-wrap gap-2 pt-1 select-none">
                {systemTemplates.map((tpl) => (
                  <button
                    key={tpl.name}
                    type="button"
                    onClick={() => handleLoadTemplate(tpl)}
                    className="bg-white hover:bg-indigo-50/50 text-[10px] text-indigo-950 font-bold px-3 py-2 rounded-xl border border-indigo-100/50 shadow-sm transition hover:-translate-y-0.5 duration-200"
                  >
                    {tpl.name}
                  </button>
                ))}

                {customTemplates.map((tpl) => (
                  <div 
                    key={tpl.name}
                    className="inline-flex items-center bg-emerald-50 text-emerald-950 text-[10px] font-bold rounded-xl border border-emerald-100/50 shadow-sm overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => handleLoadTemplate(tpl)}
                      className="px-3 py-2 hover:bg-emerald-100/50 transition"
                    >
                      📁 {tpl.name}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteTemplate(tpl.name, e)}
                      className="px-2 py-2 hover:bg-red-500 hover:text-white border-l border-emerald-100/30 text-emerald-600 transition"
                      title="Supprimer ce modèle"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* Save template section */}
              <div className="pt-3 border-t border-indigo-100/30 flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Enregistrer les prestations sous le nom... (ex: Circuit Omra 2026)"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  className="flex-1 bg-white border border-indigo-100 focus:border-indigo-500 text-xs px-3 py-2 rounded-xl outline-none text-slate-800 transition"
                />
                <Button
                  onClick={handleSaveAsTemplate}
                  className="bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold px-3 shrink-0"
                >
                  <Save className="h-3.5 w-3.5 mr-1" /> Enregistrer comme Modèle
                </Button>
              </div>
              {templateSavedMsg && (
                <span className="text-[10px] text-emerald-600 font-bold block animate-pulse">{templateSavedMsg}</span>
              )}
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <ListPlus className="h-4.5 w-4.5 text-indigo-500" />
                Détail des Prestations / Articles
              </h3>
              <Button 
                onClick={handleAddItemRow}
                variant="outline" 
                className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 text-xs rounded-xl font-bold py-1.5 px-3 flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Ajouter une Ligne
              </Button>
            </div>

            <div className="space-y-4">
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-slate-50/40 p-3 rounded-2xl border border-slate-200/30">
                  <div className="space-y-1.5 md:col-span-6 text-left">
                    <Label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Description de la prestation</Label>
                    <Input 
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      placeholder="Ex: Vol Alger-Istanbul + Hôtel 5*" 
                      className="rounded-xl bg-slate-50 border-0 h-10 text-xs focus:bg-white font-bold"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2 text-left">
                    <Label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Qté</Label>
                    <Input 
                      type="number" 
                      min="1"
                      value={item.qty}
                      onChange={(e) => handleItemChange(idx, 'qty', Number(e.target.value))}
                      className="rounded-xl bg-slate-50 border-0 h-10 text-xs focus:bg-white text-center font-bold"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-3 text-left">
                    <Label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Prix Unitaire DZD</Label>
                    <Input 
                      type="number" 
                      min="0"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(idx, 'unit_price', Number(e.target.value))}
                      className="rounded-xl bg-slate-50 border-0 h-10 text-xs focus:bg-white font-bold"
                    />
                  </div>

                  <div className="md:col-span-1 flex items-center justify-center pb-1">
                    <Button 
                      disabled={items.length === 1}
                      onClick={() => handleDeleteItemRow(idx)}
                      variant="outline"
                      className="h-9 w-9 rounded-xl border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-100 transition shrink-0"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Live Subtotal Display */}
            <div className="text-right text-xs font-semibold text-slate-500 pr-4 pt-2">
              Sous-total Prestations : <span className="text-slate-800 font-black text-sm">{(subtotal || 0).toLocaleString()} DZD</span>
            </div>
          </div>
        )}

        {/* STEP 4: Taxes & Discounts */}
        {step === 4 && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Sliders className="h-4.5 w-4.5 text-indigo-500" />
              Réductions, Taxes & Calculs Financiers
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Discount Input Slider */}
              <div className="space-y-3 bg-slate-50/50 p-5 rounded-2xl border border-slate-200/30 text-left">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-700">Taux de Remise (Discount %)</Label>
                  <span className="text-xs font-bold text-indigo-650 bg-indigo-50 px-2.5 py-0.5 rounded-lg">{discountPercent} %</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="50" 
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <span className="text-[10px] text-slate-400 font-bold block">Réduction accordée : - {discountAmount.toLocaleString()} DZD</span>
              </div>

              {/* Tax Input Slider */}
              <div className="space-y-3 bg-slate-50/50 p-5 rounded-2xl border border-slate-200/30 text-left">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-700">Taux TVA / Taxes %</Label>
                  <span className="text-xs font-bold text-indigo-650 bg-indigo-50 px-2.5 py-0.5 rounded-lg">{taxPercent} %</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="25" 
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <span className="text-[10px] text-slate-400 font-bold block">TVA calculée : + {taxAmount.toLocaleString()} DZD</span>
              </div>
            </div>

            {/* Calculations Breakdown Card */}
            <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-md space-y-2 max-w-sm ml-auto text-left text-xs font-semibold">
              <div className="flex justify-between text-slate-400">
                <span>Sous-total:</span>
                <span>{subtotal.toLocaleString()} DZD</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Remise ({discountPercent}%):</span>
                <span>- {discountAmount.toLocaleString()} DZD</span>
              </div>
              <div className="flex justify-between text-slate-400 border-b border-slate-800 pb-2">
                <span>TVA / Taxes ({taxPercent}%):</span>
                <span>+ {taxAmount.toLocaleString()} DZD</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white pt-1">
                <span>TOTAL A PAYER :</span>
                <span className="text-indigo-400">{totalAmount.toLocaleString()} DZD</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Payment Method */}
        {step === 5 && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <CreditCard className="h-4.5 w-4.5 text-indigo-500" />
              Mode de Règlement & Mentions Légales
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              <div className="space-y-2 md:col-span-1">
                <Label className="text-xs font-bold text-slate-655">Mode de paiement préféré :</Label>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="flex h-11 w-full items-center justify-between rounded-xl border-0 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer font-bold"
                >
                  <option value="CCP">CCP (Poste Algérienne)</option>
                  <option value="Edahabia">Edahabia (CIB)</option>
                  <option value="Cash">Espèces / Cash</option>
                  <option value="Bank Transfer">Virement Bancaire</option>
                  <option value="Check">Chèque</option>
                </select>
              </div>

              {/* CCP account card alert (Algerian context) */}
              {paymentMethod === 'CCP' && (
                <div className="md:col-span-2 bg-indigo-50/40 border border-indigo-100 p-4 rounded-2xl text-xs space-y-2 text-left animate-fade-in">
                  <h4 className="font-black text-indigo-900 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-indigo-600" />
                    Instructions Coordonnées CCP
                  </h4>
                  <p className="text-slate-550 leading-relaxed font-semibold">Les coordonnées de CCP seront automatiquement inscrites sur la facture générée :</p>
                  <div className="grid grid-cols-2 gap-2 font-mono font-bold text-slate-800 mt-2 bg-white/70 p-3 rounded-xl border border-indigo-100/50">
                    <div>Titulaire :</div>
                    <div className="text-indigo-600 font-bold">Amalou Achraf</div>
                    <div>N° Compte CCP :</div>
                    <div className="text-indigo-600 font-bold">0021876532</div>
                    <div>Clé CCP :</div>
                    <div className="text-indigo-600 font-bold">89</div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-50">
              <div className="space-y-1.5 text-left">
                <Label className="text-xs font-bold text-slate-655">Conditions Générales de Vente (CGV)</Label>
                <textarea 
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="flex min-h-[90px] w-full rounded-xl border-0 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition resize-y font-bold leading-relaxed" 
                  placeholder="Inscrivez les mentions de paiement..."
                />
              </div>

              <div className="space-y-1.5 text-left">
                <Label className="text-xs font-bold text-slate-655">Notes Privées Internes</Label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="flex min-h-[90px] w-full rounded-xl border-0 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition resize-y font-semibold" 
                  placeholder="Notes optionnelles visibles uniquement en agence..."
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: Review & Save */}
        {step === 6 && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Check className="h-4.5 w-4.5 text-indigo-500" />
              Récapitulatif & Émission Finale de Facture
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-left">
              {/* Traveler */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider block mb-2">Dossier Voyageur</h4>
                {selectedClient ? (
                  <div className="space-y-1 font-bold text-slate-700">
                    <span className="font-bold text-slate-800 text-sm block">{selectedClient.full_name}</span>
                    <span className="text-slate-400 block font-semibold">{selectedClient.phone || 'Pas de numéro'}</span>
                    <span className="text-slate-450 block mt-0.5 font-semibold">Mode règlement choisi : <span className="font-bold text-indigo-650 text-indigo-650 text-indigo-600">{paymentMethod}</span></span>
                  </div>
                ) : (
                  <span className="text-red-500 font-bold flex items-center gap-1"><AlertCircle className="h-4 w-4" /> Aucun client sélectionné</span>
                )}
              </div>

              {/* Dates */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider block mb-2">Calendrier de Règlement</h4>
                <div className="space-y-1 font-bold text-slate-800">
                  <div>Date de Facture : <span className="text-slate-655 font-bold">{issueDate}</span></div>
                  <div>Échéance limite : <span className="text-slate-655 font-bold">{dueDate}</span></div>
                  {selectedTrip && (
                    <div className="text-[9px] text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg inline-block mt-2 font-black uppercase border border-indigo-100">Voyage : {selectedTrip.title}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Items Summary Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs text-left">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200">
                    <th className="py-3 px-4">Prestation Description</th>
                    <th className="py-3 px-4 text-center">Qté</th>
                    <th className="py-3 px-4 text-right">Prix Unitaire</th>
                    <th className="py-3 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-4 font-bold text-slate-800">{item.description || 'Prestation sans description'}</td>
                      <td className="py-2.5 px-4 text-center">{item.qty}</td>
                      <td className="py-2.5 px-4 text-right">{(item.unit_price || 0).toLocaleString()} DZD</td>
                      <td className="py-2.5 px-4 text-right text-slate-850">{(item.total || 0).toLocaleString()} DZD</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Grand Totals */}
            <div className="bg-indigo-950 text-white p-5 rounded-2xl shadow-md space-y-2 max-w-sm ml-auto text-left text-xs font-semibold">
              <div className="flex justify-between text-indigo-200">
                <span>Sous-total Prestations:</span>
                <span>{subtotal.toLocaleString()} DZD</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex justify-between text-indigo-200">
                  <span>Remise Générale ({discountPercent}%):</span>
                  <span>- {discountAmount.toLocaleString()} DZD</span>
                </div>
              )}
              {taxPercent > 0 && (
                <div className="flex justify-between text-indigo-200">
                  <span>TVA Complémentaire ({taxPercent}%):</span>
                  <span>+ {taxAmount.toLocaleString()} DZD</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-indigo-850">
                <span>MONTANT TOTAL DZD :</span>
                <span className="text-indigo-400">{totalAmount.toLocaleString()} DZD</span>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons (Prev / Next) */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between select-none">
          <Button 
            disabled={step === 1 || loading}
            onClick={() => setStep(step - 1)}
            variant="outline"
            className="rounded-xl border-slate-200 text-slate-650 font-bold"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Précédent
          </Button>

          {step < 6 ? (
            <Button 
              disabled={step === 1 && !selectedClientId}
              onClick={() => setStep(step + 1)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-150 transition"
            >
              Suivant
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button 
              disabled={loading || !selectedClientId}
              onClick={handleSaveInvoice}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold py-2.5 px-6 shadow-md shadow-emerald-150 transition flex items-center gap-1.5 animate-pulse"
            >
              <Check className="h-5 w-5" />
              {loading ? 'Création de la facture...' : 'Émettre la Facture Officielle'}
            </Button>
          )}
        </div>
      </div>

      {/* Add / Edit Client Modal */}
      {modalOpen && (
        <AddClientModal 
          open={modalOpen} 
          onOpenChange={setModalOpen} 
          existingClients={clients.map(c => ({ id: c.id, full_name: c.full_name }))}
          onSuccess={handleNewClientSuccess}
        />
      )}
    </div>
  )
}
