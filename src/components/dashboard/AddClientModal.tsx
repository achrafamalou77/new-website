'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { User, Phone, Mail, FileText, Calendar, MapPin, Building2, Briefcase, BadgePercent, Car, Key, Package, CreditCard } from 'lucide-react'
import { getAvailableInventoryAction } from '@/app/actions/inventory-fetch'
import { createClientWithTransactionAction } from '@/app/actions/client-transaction'
import { updateClientAction } from '@/app/actions/clients'

interface AddClientModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingClients?: Array<{ id: string; full_name: string }>
  clientToEdit?: any 
  onSuccess?: () => void
  activeTransactionTab?: 'ventes' | 'location' | 'commande'
  activeClientTypeTab?: 'normal' | 'gros'
}

export function AddClientModal({
  open,
  onOpenChange,
  existingClients = [],
  clientToEdit = null,
  onSuccess,
  activeTransactionTab = 'ventes',
  activeClientTypeTab = 'normal'
}: AddClientModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Client States
  const [source, setSource] = useState(clientToEdit?.source || 'walk_in')
  const [classification, setClassification] = useState<'retail' | 'b2b' | 'corporate' | 'wholesale'>(
    clientToEdit?.classification || (activeClientTypeTab === 'normal' ? 'retail' : 'b2b')
  )
  const isB2B = classification !== 'retail'

  // Inventory / Transaction States
  const [inventory, setInventory] = useState<any[]>([])
  const [transactionData, setTransactionData] = useState({
    car_id: '',
    car_name: '',
    start_date: '',
    end_date: '',
    sale_price: '',
    total_price: '',
    payment_method: 'Cash',
    id_card_url: clientToEdit?.id_card_url || '',
    passport_url: clientToEdit?.passport_url || '',
    license_url: clientToEdit?.license_url || ''
  })

  // Fetch Inventory on mount if we're dealing with transactions
  useEffect(() => {
    if (open) {
      getAvailableInventoryAction().then(res => {
        if (res.success && res.cars) {
          setInventory(res.cars)
        }
      })
    }
  }, [open])

  const handleCarSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value
    const car = inventory.find(c => c.id === selectedId)
    setTransactionData(prev => ({
      ...prev,
      car_id: selectedId,
      car_name: car ? `${car.brand} ${car.model} (${car.year})` : '',
      sale_price: car ? car.final_price : prev.sale_price,
      total_price: car ? car.final_price : prev.total_price
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    
    // 1. Gather Client Data
    const clientData: any = {
      full_name: formData.get('full_name') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      id_card_number: formData.get('id_card_number') as string,
      passport_number: formData.get('passport_number') as string,
      date_of_birth: formData.get('date_of_birth') as string,
      address: formData.get('address') as string,
      city: formData.get('city') as string,
      source: formData.get('source') as any,
      referred_by_id: formData.get('referred_by_id') as string || null,
      notes: formData.get('notes') as string,
      classification,
      id_card_url: transactionData.id_card_url,
      passport_url: transactionData.passport_url,
      license_url: transactionData.license_url
    }

    if (isB2B) {
      clientData.company_legal_name = formData.get('company_legal_name') as string
      clientData.company_nif = formData.get('company_nif') as string
      clientData.company_rc = formData.get('company_rc') as string
      clientData.company_address = formData.get('company_address') as string
      clientData.contact_person = formData.get('contact_person') as string
      const discountTier = formData.get('volume_discount_tier') as string
      clientData.volume_discount_tier = discountTier ? Number(discountTier) : 0
    }

    try {
      if (clientToEdit && !transactionData.car_id) {
        // Just updating client, no new transaction being registered
        const res = await updateClientAction(clientToEdit.id, clientData)
        if (res.success) {
          onOpenChange(false)
          if (onSuccess) onSuccess()
        } else {
          setError(res.error || "Erreur de mise à jour")
        }
      } else {
        // Creating client and/or new transaction
        const payload = {
          clientToEditId: clientToEdit?.id,
          clientData,
          transactionType: activeTransactionTab,
          transactionData
        }

        const res = await createClientWithTransactionAction(payload)
        
        if (res.success) {
          onOpenChange(false)
          if (onSuccess) onSuccess()
        } else {
          setError(res.error || 'Erreur lors de la création de la transaction')
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const isEdit = !!clientToEdit

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl rounded-2xl overflow-hidden font-geist bg-white border border-slate-100 shadow-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-left pb-2 border-b border-slate-100">
          <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            {activeTransactionTab === 'ventes' && <Car className="h-5 w-5 text-indigo-500" />}
            {activeTransactionTab === 'location' && <Key className="h-5 w-5 text-teal-500" />}
            {activeTransactionTab === 'commande' && <Package className="h-5 w-5 text-orange-500" />}
            {isEdit ? 'Modifier la Fiche Client & Transaction' : `Ajouter un Client (${activeTransactionTab.toUpperCase()})`}
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-xs">
            Enregistrez les informations du client ainsi que les détails de sa transaction. Une facture sera générée automatiquement.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="py-4 text-left">
          {error && (
            <div className="p-3 mb-4 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-100">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* LEFT COLUMN: CLIENT INFO */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <User className="h-4 w-4 text-slate-400" />
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Infos Client</h3>
              </div>

              {/* Client Type Selector */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'retail', label: 'Retail', icon: '👤', color: 'border-slate-300 text-slate-700' },
                  { value: 'b2b', label: 'B2B', icon: '🏢', color: 'border-purple-300 text-purple-700' },
                  { value: 'corporate', label: 'Corporate', icon: '🏛️', color: 'border-orange-300 text-orange-700' },
                  { value: 'wholesale', label: 'Wholesale', icon: '📦', color: 'border-amber-300 text-amber-700' },
                ].map(opt => {
                  // Only show relevant options based on the active top-level tab
                  if (activeClientTypeTab === 'normal' && opt.value !== 'retail') return null
                  if (activeClientTypeTab === 'gros' && opt.value === 'retail') return null
                  
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setClassification(opt.value as any)}
                      className={`p-2 rounded-xl border-2 text-center transition font-bold text-xs space-y-0.5 focus:outline-none ${
                        classification === opt.value
                          ? opt.color + ' ring-2 ring-offset-1 ring-indigo-400 bg-slate-50'
                          : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-base">{opt.icon} {opt.label}</div>
                    </button>
                  )
                })}
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Nom Complet <span className="text-red-500">*</span></Label>
                  <Input className="rounded-xl bg-slate-50 border-0" name="full_name" required defaultValue={clientToEdit?.full_name || ''} placeholder="Ex: Achraf Amalou" />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">Téléphone</Label>
                    <Input className="rounded-xl bg-slate-50 border-0" name="phone" defaultValue={clientToEdit?.phone || ''} placeholder="+213..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">Email</Label>
                    <Input className="rounded-xl bg-slate-50 border-0" name="email" type="email" defaultValue={clientToEdit?.email || ''} placeholder="@" />
                  </div>
                </div>

                {isB2B && (
                  <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/30 p-4 mt-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-amber-800">Raison Sociale</Label>
                      <Input className="rounded-xl bg-white border-amber-200" name="company_legal_name" defaultValue={clientToEdit?.company_legal_name || ''} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-amber-800">NIF</Label>
                        <Input className="rounded-xl bg-white border-amber-200" name="company_nif" defaultValue={clientToEdit?.company_nif || ''} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-amber-800">RC</Label>
                        <Input className="rounded-xl bg-white border-amber-200" name="company_rc" defaultValue={clientToEdit?.company_rc || ''} />
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">N° Carte Nationale</Label>
                    <Input className="rounded-xl bg-slate-50 border-0" name="id_card_number" defaultValue={clientToEdit?.id_card_number || ''} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">Date de Naissance</Label>
                    <Input className="rounded-xl bg-slate-50 border-0" name="date_of_birth" type="date" defaultValue={clientToEdit?.date_of_birth || ''} />
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: TRANSACTION INFO */}
            <div className="space-y-5 bg-slate-50/50 rounded-2xl p-5 border border-slate-100">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <CreditCard className="h-4 w-4 text-indigo-500" />
                <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest">
                  Transaction & Documents
                </h3>
              </div>

              {/* Car Selection */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Sélectionner un Véhicule <span className="text-red-500">*</span></Label>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={transactionData.car_id}
                  onChange={handleCarSelect}
                >
                  <option value="">-- Choisir un véhicule du Stock --</option>
                  {inventory.map(car => (
                    <option key={car.id} value={car.id}>
                      {car.brand} {car.model} {car.year} - {car.final_price?.toLocaleString()} DZD ({car.car_type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Transaction Fields */}
              {activeTransactionTab === 'location' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">Date de Début</Label>
                    <Input 
                      className="rounded-xl bg-white border border-slate-200" 
                      type="datetime-local" 
                      value={transactionData.start_date}
                      onChange={(e) => setTransactionData({...transactionData, start_date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">Date de Fin</Label>
                    <Input 
                      className="rounded-xl bg-white border border-slate-200" 
                      type="datetime-local" 
                      value={transactionData.end_date}
                      onChange={(e) => setTransactionData({...transactionData, end_date: e.target.value})}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">
                    {activeTransactionTab === 'ventes' ? 'Prix de Vente (DZD)' : 'Montant Total (DZD)'}
                  </Label>
                  <Input 
                    className="rounded-xl bg-white border border-indigo-200 font-bold text-indigo-700" 
                    type="number"
                    value={activeTransactionTab === 'ventes' ? transactionData.sale_price : transactionData.total_price}
                    onChange={(e) => setTransactionData(prev => ({
                      ...prev,
                      sale_price: e.target.value,
                      total_price: e.target.value
                    }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Méthode de Paiement</Label>
                  <select 
                    className="flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={transactionData.payment_method}
                    onChange={(e) => setTransactionData({...transactionData, payment_method: e.target.value})}
                  >
                    <option value="Cash">Espèces (Cash)</option>
                    <option value="Bank Transfer">Virement Bancaire</option>
                    <option value="Check">Chèque</option>
                  </select>
                </div>
              </div>

              {/* Document Uploads / URLs */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <Label className="text-xs font-black text-slate-700 uppercase tracking-wider">Documents Joints (Liens/URLs)</Label>
                <div className="space-y-2">
                  <Input 
                    className="rounded-xl bg-white border border-slate-200 text-xs" 
                    placeholder="Lien URL - Carte d'Identité / ID Card" 
                    value={transactionData.id_card_url}
                    onChange={(e) => setTransactionData({...transactionData, id_card_url: e.target.value})}
                  />
                  {activeTransactionTab === 'location' && (
                    <Input 
                      className="rounded-xl bg-white border border-slate-200 text-xs" 
                      placeholder="Lien URL - Permis de Conduire (License)" 
                      value={transactionData.license_url}
                      onChange={(e) => setTransactionData({...transactionData, license_url: e.target.value})}
                    />
                  )}
                  {activeTransactionTab === 'commande' && (
                    <Input 
                      className="rounded-xl bg-white border border-slate-200 text-xs" 
                      placeholder="Lien URL - Passeport (Passport)" 
                      value={transactionData.passport_url}
                      onChange={(e) => setTransactionData({...transactionData, passport_url: e.target.value})}
                    />
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-semibold italic">Collez les liens Google Drive ou Supabase de vos documents scannés.</p>
              </div>

            </div>
          </div>

          <DialogFooter className="pt-6 mt-6 border-t border-slate-100 gap-2 flex items-center justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl border-slate-200 text-slate-600">
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold px-8 shadow-md">
              {loading ? 'Enregistrement...' : 'Enregistrer & Générer Facture'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
