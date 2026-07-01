'use client'

import { useMemo, useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Building2, Car, CreditCard, Key, Package, Plane, Plus, Trash2, User, Users, UploadCloud
} from 'lucide-react'
import { getAvailableInventoryAction } from '@/app/actions/inventory-fetch'
import { createClientWithTransactionAction, createTravelClientWorkflowAction } from '@/app/actions/client-transaction'
import { updateClientAction } from '@/app/actions/clients'
import { uploadCarImageAction } from '@/app/actions/inventory-management'
import { useLanguage } from '@/lib/contexts/LanguageContext'
import { cn } from '@/lib/utils'

type ClientClass = 'retail' | 'b2b' | 'corporate' | 'wholesale'
type TransactionTab = 'ventes' | 'location' | 'commande' | 'bookings' | 'visa' | 'invoices'

const RELATIONSHIP_LABELS: Record<string, string> = {
  conjoint: 'Conjoint(e)', fils: 'Fils', fille: 'Fille', pere: 'Père', mere: 'Mère',
  frere: 'Frère', soeur: 'Sœur', grand_parent: 'Grand-parent', oncle_tante: 'Oncle/Tante',
  cousin: 'Cousin(e)', ami: 'Ami(e)', collegue: 'Collègue', autre: 'Autre'
}
const TYPE_LABELS: Record<string, string> = {
  adult: 'Adulte', child: 'Enfant', infant: 'Bébé'
}

interface AddClientModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingClients?: Array<{ id: string; full_name: string }>
  clientToEdit?: any
  onSuccess?: () => void
  activeTransactionTab?: TransactionTab
  activeClientTypeTab?: 'normal' | 'gros'
  businessTypeSlug?: string
  availableTrips?: any[]
}

const emptyCompanion = () => ({
  id: crypto.randomUUID(),
  full_name: '',
  relationship: 'conjoint',
  gender: 'M',
  date_of_birth: '',
  id_card_number: '',
  passport_number: '',
  nationality: 'Algérienne',
  type: 'adult',
  expanded: true,
})

export function AddClientModal({
  open,
  onOpenChange,
  clientToEdit = null,
  onSuccess,
  activeTransactionTab = 'bookings',
  activeClientTypeTab = 'normal',
  businessTypeSlug = 'travel_agency',
  availableTrips = [],
}: AddClientModalProps) {
  const isTravel = businessTypeSlug !== 'car_showroom'
  const isEdit = !!clientToEdit
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [classification, setClassification] = useState<ClientClass>(
    clientToEdit?.classification || (activeClientTypeTab === 'normal' ? 'retail' : 'b2b')
  )
  const [selectedTransactionTab, setSelectedTransactionTab] = useState<TransactionTab>(
    activeTransactionTab === 'location' || activeTransactionTab === 'commande' || activeTransactionTab === 'ventes'
      ? activeTransactionTab
      : 'ventes'
  )
  const isGroupClient = classification !== 'retail'

  const [inventory, setInventory] = useState<any[]>([])
  const [vehicleData, setVehicleData] = useState({
    car_id: '',
    car_name: '',
    brand: '',
    model: '',
    year: '',
    color: '',
    version: '',
    start_date: '',
    end_date: '',
    sale_price: '',
    total_price: '',
    deposit_paid: '',
    payment_method: 'Cash',
    id_card_url: clientToEdit?.id_card_url || '',
    passport_url: clientToEdit?.passport_url || '',
    license_url: clientToEdit?.license_url || '',
  })

  const [bookingData, setBookingData] = useState({
    trip_id: '',
    adults: '1',
    children: '0',
    infants: '0',
    total_price: '',
    amount_paid: '0',
    due_date: new Date().toISOString().split('T')[0],
    payment_method: 'Cash',
    group_name: '',
    room_preference: '',
    special_requests: '',
    generate_invoice: true,
  })
  const [companions, setCompanions] = useState<any[]>([])

  useEffect(() => {
    if (open && !isTravel) {
      getAvailableInventoryAction(selectedTransactionTab as 'ventes' | 'location' | 'commande').then(res => {
        if (res.success && res.cars) setInventory(res.cars)
      })
    }
  }, [open, isTravel, selectedTransactionTab])

  const selectedTrip = useMemo(
    () => availableTrips.find(t => t.id === bookingData.trip_id),
    [availableTrips, bookingData.trip_id]
  )

  const travelersCount = useMemo(() => {
    return Math.max(1, Number(bookingData.adults || 0) + Number(bookingData.children || 0) + Number(bookingData.infants || 0))
  }, [bookingData.adults, bookingData.children, bookingData.infants])

  const resolvedBookingTotal = useMemo(() => {
    if (bookingData.total_price) return bookingData.total_price
    const basePrice = Number(selectedTrip?.price || 0)
    return basePrice ? String(basePrice * travelersCount) : ''
  }, [bookingData.total_price, selectedTrip?.price, travelersCount])

  const handleVehicleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value
    const car = inventory.find(c => c.id === selectedId)
    const price = car
      ? String(selectedTransactionTab === 'location'
        ? (car.daily_rate || car.final_price || car.selling_price || car.price || 0)
        : (car.final_price || car.selling_price || car.price || 0))
      : vehicleData.sale_price
    setVehicleData(prev => ({
      ...prev,
      car_id: selectedId,
      car_name: car ? `${car.brand} ${car.model} (${car.year})` : '',
      brand: car?.brand || '',
      model: car?.model || '',
      year: car?.year ? String(car.year) : '',
      color: car?.color || '',
      version: car?.version || car?.variant || '',
      sale_price: selectedTransactionTab === 'commande' ? prev.sale_price : price,
      total_price: price,
    }))
  }

  const buildClientData = (formData: FormData) => {
    return {
      full_name: String(formData.get('full_name') || '').trim(),
      phone: String(formData.get('phone') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      id_card_number: String(formData.get('id_card_number') || '').trim(),
      passport_number: String(formData.get('passport_number') || '').trim(),
      date_of_birth: String(formData.get('date_of_birth') || '').trim(),
      address: String(formData.get('address') || '').trim(),
      city: String(formData.get('city') || '').trim(),
      source: String(formData.get('source') || 'walk_in'),
      referred_by_id: String(formData.get('referred_by_id') || '') || null,
      notes: String(formData.get('notes') || '').trim(),
      classification,
      company_legal_name: String(formData.get('company_legal_name') || '').trim(),
      company_nif: String(formData.get('company_nif') || '').trim(),
      company_rc: String(formData.get('company_rc') || '').trim(),
      company_address: String(formData.get('company_address') || '').trim(),
      contact_person: String(formData.get('contact_person') || '').trim(),
      volume_discount_tier: Number(formData.get('volume_discount_tier') || 0),
      id_card_url: vehicleData.id_card_url,
      passport_url: vehicleData.passport_url,
      license_url: vehicleData.license_url,
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const clientData = buildClientData(formData)

    if (!clientData.full_name) {
      setError('Le nom complet est obligatoire.')
      setLoading(false)
      return
    }

    try {
      const hasVehicleTransaction =
        Boolean(vehicleData.car_id) ||
        (selectedTransactionTab === 'commande' && Boolean(vehicleData.brand || vehicleData.model))

      if (isTravel) {
        const validCompanions = companions.filter(c => c.full_name?.trim())
        const res = await createTravelClientWorkflowAction({
          clientToEditId: clientToEdit?.id,
          clientData,
          bookingData: {
            ...bookingData,
            total_price: resolvedBookingTotal,
            companions: validCompanions,
            invoice_label: selectedTrip ? `Reservation: ${selectedTrip.title}` : 'Service voyage',
          },
        })

        if (!res.success) {
          setError('error' in res ? res.error || 'Erreur lors de l enregistrement' : 'Erreur lors de l enregistrement')
          return
        }
      } else if (clientToEdit && !hasVehicleTransaction) {
        const res = await updateClientAction(clientToEdit.id, clientData)
        if (!res.success) {
          setError(res.error || 'Erreur de mise a jour')
          return
        }
      } else {
        const res = await createClientWithTransactionAction({
          clientToEditId: clientToEdit?.id,
          clientData,
          transactionType: selectedTransactionTab,
          transactionData: vehicleData,
        })

        if (!res.success) {
          setError(res.error || 'Erreur lors de la creation de la transaction')
          return
        }
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const classOptions = activeClientTypeTab === 'normal'
    ? [{ value: 'retail', label: isTravel ? 'Voyageur individuel' : 'Client particulier', icon: User }]
    : isTravel
      ? [
          { value: 'b2b', label: 'Groupe', icon: Users },
          { value: 'corporate', label: 'Entreprise', icon: Building2 },
          { value: 'wholesale', label: 'Agence partenaire', icon: BriefcaseIcon },
        ]
      : [
          { value: 'b2b', label: 'Revendeur / marchand', icon: Users },
          { value: 'corporate', label: 'Entreprise / flotte', icon: Building2 },
          { value: 'wholesale', label: 'Client gros volume', icon: BriefcaseIcon },
        ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(1180px,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl sm:max-w-[min(1180px,calc(100vw-2rem))]">
        <DialogHeader className="border-b border-slate-200 bg-slate-950 px-8 py-6 text-left text-white">
          <DialogTitle className="flex items-center gap-3 text-2xl font-black tracking-tight">
            {isTravel ? <Plane className="h-6 w-6 text-sky-300" /> : <Car className="h-6 w-6 text-indigo-300" />}
            {isEdit ? 'Modifier la fiche client' : isTravel ? 'Nouveau dossier voyageur' : 'Nouveau client showroom'}
          </DialogTitle>
          <DialogDescription className="max-w-2xl text-sm leading-relaxed text-slate-300">
            {isTravel
              ? 'Ajoutez un client, un groupe de voyageurs et une reservation optionnelle avec facture.'
              : 'Ajoutez le client et liez-le a une vente, location ou commande vehicule.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="max-h-[calc(92vh-150px)] overflow-y-auto px-8 py-7">
            {error && (
              <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                {error}
              </div>
            )}

            <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
              <section className="space-y-6">
                <SectionTitle icon={<User className="h-4 w-4" />} title="Profil client" />

                <div className="grid gap-3 md:grid-cols-3">
                  {classOptions.map(opt => {
                    const Icon = opt.icon
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setClassification(opt.value as ClientClass)}
                        className={cn(
                          'flex min-h-14 items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-black transition',
                          classification === opt.value
                            ? 'border-sky-500 bg-sky-50 text-sky-800 ring-2 ring-sky-100'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        {opt.label}
                      </button>
                    )
                  })}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Nom complet" required>
                    <Input name="full_name" defaultValue={clientToEdit?.full_name || ''} placeholder="Ex: Achraf Amalou" className="h-12 rounded-xl border-slate-200 bg-white text-base" />
                  </Field>
                  <Field label="Telephone">
                    <Input name="phone" defaultValue={clientToEdit?.phone || ''} placeholder="+213..." className="h-12 rounded-xl border-slate-200 bg-white text-base" />
                  </Field>
                  <Field label="Email">
                    <Input name="email" type="email" defaultValue={clientToEdit?.email || ''} placeholder="client@email.com" className="h-12 rounded-xl border-slate-200 bg-white text-base" />
                  </Field>
                  <Field label="Source">
                    <select name="source" defaultValue={clientToEdit?.source || 'walk_in'} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-700 outline-none">
                      <option value="walk_in">{isTravel ? 'Agence' : 'Showroom'}</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="facebook">Facebook</option>
                      <option value="instagram">Instagram</option>
                      <option value="phone">Telephone</option>
                      <option value="referral">Recommandation</option>
                    </select>
                  </Field>
                  <Field label="Ville / Wilaya">
                    <Input name="city" defaultValue={clientToEdit?.city || ''} placeholder="Alger" className="h-12 rounded-xl border-slate-200 bg-white text-base" />
                  </Field>
                  <Field label={isTravel ? 'Date de naissance' : 'Date de naissance / dossier'}>
                    <Input name="date_of_birth" type="date" defaultValue={clientToEdit?.date_of_birth || ''} className="h-12 rounded-xl border-slate-200 bg-white text-base" />
                  </Field>
                  <Field label="N carte nationale">
                    <Input name="id_card_number" defaultValue={clientToEdit?.id_card_number || ''} className="h-12 rounded-xl border-slate-200 bg-white text-base" />
                  </Field>
                  <Field label={isTravel ? 'Passeport' : 'Permis / document secondaire'}>
                    <Input name="passport_number" defaultValue={clientToEdit?.passport_number || ''} className="h-12 rounded-xl border-slate-200 bg-white text-base" />
                  </Field>
                  <Field label="Adresse" className="md:col-span-2">
                    <Input name="address" defaultValue={clientToEdit?.address || ''} placeholder="Adresse complete" className="h-12 rounded-xl border-slate-200 bg-white text-base" />
                  </Field>
                </div>

                {isGroupClient && (
                  <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-5">
                    <SectionTitle icon={<Building2 className="h-4 w-4" />} title={isTravel ? 'Groupe / entreprise' : 'Entreprise / revendeur'} compact />
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <Field label={isTravel ? 'Nom groupe / entreprise' : 'Nom entreprise / revendeur'}>
                        <Input name="company_legal_name" defaultValue={clientToEdit?.company_legal_name || ''} className="h-11 rounded-xl border-sky-200 bg-white text-base" />
                      </Field>
                      <Field label="Contact principal">
                        <Input name="contact_person" defaultValue={clientToEdit?.contact_person || ''} className="h-11 rounded-xl border-sky-200 bg-white text-base" />
                      </Field>
                      <Field label="NIF">
                        <Input name="company_nif" defaultValue={clientToEdit?.company_nif || ''} className="h-11 rounded-xl border-sky-200 bg-white text-base" />
                      </Field>
                      <Field label="RC">
                        <Input name="company_rc" defaultValue={clientToEdit?.company_rc || ''} className="h-11 rounded-xl border-sky-200 bg-white text-base" />
                      </Field>
                      <Field label={isTravel ? 'Remise groupe (%)' : 'Remise volume (%)'}>
                        <Input name="volume_discount_tier" type="number" min="0" max="100" defaultValue={clientToEdit?.volume_discount_tier || 0} className="h-11 rounded-xl border-sky-200 bg-white text-base" />
                      </Field>
                      <Field label={isTravel ? 'Adresse entreprise' : 'Adresse entreprise / parc'}>
                        <Input name="company_address" defaultValue={clientToEdit?.company_address || ''} className="h-11 rounded-xl border-sky-200 bg-white text-base" />
                      </Field>
                    </div>
                  </div>
                )}
              </section>

              {isTravel ? (
                <TravelPanel
                  trips={availableTrips}
                  bookingData={bookingData}
                  setBookingData={setBookingData}
                  selectedTrip={selectedTrip}
                  travelersCount={travelersCount}
                  resolvedBookingTotal={resolvedBookingTotal}
                  companions={companions}
                  setCompanions={setCompanions}
                />
              ) : (
                <VehiclePanel
                  activeTransactionTab={selectedTransactionTab}
                  setActiveTransactionTab={setSelectedTransactionTab}
                  inventory={inventory}
                  vehicleData={vehicleData}
                  setVehicleData={setVehicleData}
                  handleVehicleSelect={handleVehicleSelect}
                />
              )}
            </div>

            <Field label="Notes internes" className="mt-7">
              <textarea
                name="notes"
                defaultValue={clientToEdit?.notes || ''}
                className="min-h-24 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-base outline-none focus:border-sky-400"
	                placeholder={isTravel ? 'Preferences, remarques, demandes speciales...' : 'Vehicule recherche, budget, reprise, financement, remarques commerciales...'}
              />
            </Field>
          </div>

          <DialogFooter className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-8 py-5">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-11 rounded-xl border-slate-200 px-6 text-base">
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="h-11 rounded-xl bg-slate-950 px-8 text-base font-black text-white hover:bg-slate-800">
              {loading ? 'Enregistrement...' : isTravel ? 'Enregistrer le dossier' : 'Enregistrer & generer facture'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function TravelPanel({ trips, bookingData, setBookingData, selectedTrip, travelersCount, resolvedBookingTotal, companions, setCompanions }: any) {
  const balanceDue = Math.max(0, Number(resolvedBookingTotal || 0) - Number(bookingData.amount_paid || 0))

  const updateCompanion = (id: string, key: string, value: string) => {
    setCompanions((prev: any[]) => prev.map(c => c.id === id ? { ...c, [key]: value } : c))
  }

  return (
    <section className="space-y-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
      <SectionTitle icon={<Plane className="h-4 w-4" />} title="Reservation voyage" />

      <Field label="Voyage / offre">
        <select
          value={bookingData.trip_id}
          onChange={e => setBookingData((prev: any) => ({ ...prev, trip_id: e.target.value }))}
          className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-700 outline-none"
        >
          <option value="">Client seulement, sans reservation</option>
          {trips.map((trip: any) => (
            <option key={trip.id} value={trip.id}>
              {trip.title} - {trip.destination || 'Destination'} - {Number(trip.price || 0).toLocaleString()} DZD
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Adultes">
          <Input value={bookingData.adults} type="number" min="1" onChange={e => setBookingData((p: any) => ({ ...p, adults: e.target.value }))} className="h-12 rounded-xl bg-white text-base" />
        </Field>
        <Field label="Enfants">
          <Input value={bookingData.children} type="number" min="0" onChange={e => setBookingData((p: any) => ({ ...p, children: e.target.value }))} className="h-12 rounded-xl bg-white text-base" />
        </Field>
        <Field label="Bebes">
          <Input value={bookingData.infants} type="number" min="0" onChange={e => setBookingData((p: any) => ({ ...p, infants: e.target.value }))} className="h-12 rounded-xl bg-white text-base" />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Total dossier (DZD)">
          <Input value={resolvedBookingTotal} type="number" min="0" onChange={e => setBookingData((p: any) => ({ ...p, total_price: e.target.value }))} className="h-12 rounded-xl border-sky-200 bg-white text-base font-black text-sky-800" />
        </Field>
        <Field label="Avance payee (DZD)">
          <Input value={bookingData.amount_paid} type="number" min="0" onChange={e => setBookingData((p: any) => ({ ...p, amount_paid: e.target.value }))} className="h-12 rounded-xl bg-white text-base" />
        </Field>
        <Field label="Paiement">
          <select value={bookingData.payment_method} onChange={e => setBookingData((p: any) => ({ ...p, payment_method: e.target.value }))} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base">
            <option value="Cash">Especes</option>
            <option value="CCP">CCP</option>
            <option value="Bank Transfer">Virement</option>
            <option value="Check">Cheque</option>
            <option value="Edahabia">Edahabia</option>
          </select>
        </Field>
        <Field label="Echeance">
          <Input value={bookingData.due_date} type="date" onChange={e => setBookingData((p: any) => ({ ...p, due_date: e.target.value }))} className="h-12 rounded-xl bg-white text-base" />
        </Field>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm">
        <div className="flex items-center justify-between gap-4 font-black text-slate-800">
          <span>{travelersCount} voyageur(s)</span>
          <span className="text-lg">{Number(resolvedBookingTotal || 0).toLocaleString()} DZD</span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-4 text-slate-500">
          <span>{selectedTrip?.destination || 'Aucune offre selectionnee'}</span>
          <span className="font-bold text-slate-700">Reste: {balanceDue.toLocaleString()} DZD</span>
        </div>
      </div>

      {/* ─── FAMILY MEMBERS / COMPANIONS — Always visible ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SectionTitle icon={<Users className="h-4 w-4" />} title="Membres de la famille & Accompagnateurs" compact />
            {companions.length > 0 && (
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-black text-sky-700">
                {companions.length}
              </span>
            )}
          </div>
          <Button
            type="button"
            onClick={() => setCompanions((prev: any[]) => [...prev, emptyCompanion()])}
            className="h-9 rounded-xl bg-sky-600 px-4 text-xs font-black text-white hover:bg-sky-700"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Ajouter un membre
          </Button>
        </div>

        {companions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-5 text-center">
            <Users className="mx-auto mb-2 h-6 w-6 text-slate-300" />
            <p className="text-xs font-semibold text-slate-400">Aucun accompagnateur pour l&apos;instant</p>
            <p className="mt-0.5 text-[10px] text-slate-300">Cliquez sur &quot;Ajouter un membre&quot; pour ajouter la famille du voyageur</p>
          </div>
        ) : (
          <div className="space-y-3">
            {companions.map((person: any, index: number) => (
              <div key={person.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                {/* Card header — always visible */}
                <div
                  className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50"
                  onClick={() => setCompanions((prev: any[]) => prev.map((c: any) => c.id === person.id ? { ...c, expanded: !c.expanded } : c))}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                      person.type === 'adult' ? 'bg-sky-100 text-sky-700'
                      : person.type === 'child' ? 'bg-amber-100 text-amber-700'
                      : 'bg-rose-100 text-rose-700'
                    }`}>
                      {index + 2}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-800">
                        {person.full_name || <span className="font-normal italic text-slate-400">Nom non renseigné</span>}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {RELATIONSHIP_LABELS[person.relationship] || person.relationship} — {TYPE_LABELS[person.type]}
                        {person.date_of_birth ? ` — né(e) le ${person.date_of_birth}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-slate-400">{person.expanded ? '▲' : '▼'}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); setCompanions((prev: any[]) => prev.filter((c: any) => c.id !== person.id)) }}
                      className="h-8 w-8 rounded-lg p-0 text-rose-400 hover:bg-rose-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Expanded fields */}
                {person.expanded && (
                  <div className="border-t border-slate-100 bg-slate-50/60 px-4 pb-4 pt-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {/* Full name */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wide text-slate-500">Nom complet <span className="text-rose-500">*</span></label>
                        <Input
                          value={person.full_name}
                          onChange={e => updateCompanion(person.id, 'full_name', e.target.value)}
                          placeholder={`Ex: Amalou ${index + 2 === 2 ? 'Fatima' : 'Mohamed'}`}
                          className="h-10 rounded-lg border-slate-200 bg-white text-sm"
                        />
                      </div>

                      {/* Relationship */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wide text-slate-500">Lien de parenté</label>
                        <select
                          value={person.relationship}
                          onChange={e => updateCompanion(person.id, 'relationship', e.target.value)}
                          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none"
                        >
                          <option value="conjoint">Conjoint(e) / Époux(se)</option>
                          <option value="fils">Fils</option>
                          <option value="fille">Fille</option>
                          <option value="pere">Père</option>
                          <option value="mere">Mère</option>
                          <option value="frere">Frère</option>
                          <option value="soeur">Sœur</option>
                          <option value="grand_parent">Grand-parent</option>
                          <option value="oncle_tante">Oncle / Tante</option>
                          <option value="cousin">Cousin(e)</option>
                          <option value="ami">Ami(e)</option>
                          <option value="collegue">Collègue</option>
                          <option value="autre">Autre</option>
                        </select>
                      </div>

                      {/* Gender */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wide text-slate-500">Sexe</label>
                        <div className="flex gap-2">
                          {[{ val: 'M', label: '👨 Masculin' }, { val: 'F', label: '👩 Féminin' }].map(opt => (
                            <button
                              key={opt.val}
                              type="button"
                              onClick={() => updateCompanion(person.id, 'gender', opt.val)}
                              className={`flex-1 rounded-lg border py-2 text-xs font-black transition ${
                                person.gender === opt.val
                                  ? 'border-sky-500 bg-sky-50 text-sky-700'
                                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Age category */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wide text-slate-500">Catégorie d&apos;âge</label>
                        <select
                          value={person.type}
                          onChange={e => updateCompanion(person.id, 'type', e.target.value)}
                          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none"
                        >
                          <option value="adult">Adulte (12 ans et +)</option>
                          <option value="child">Enfant (2 — 11 ans)</option>
                          <option value="infant">Bébé (0 — 23 mois)</option>
                        </select>
                      </div>

                      {/* Date of birth */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wide text-slate-500">Date de naissance</label>
                        <Input
                          type="date"
                          value={person.date_of_birth}
                          onChange={e => updateCompanion(person.id, 'date_of_birth', e.target.value)}
                          className="h-10 rounded-lg border-slate-200 bg-white text-sm"
                        />
                      </div>

                      {/* Nationality */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wide text-slate-500">Nationalité</label>
                        <Input
                          value={person.nationality}
                          onChange={e => updateCompanion(person.id, 'nationality', e.target.value)}
                          placeholder="Algérienne"
                          className="h-10 rounded-lg border-slate-200 bg-white text-sm"
                        />
                      </div>

                      {/* ID Card */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wide text-slate-500">N° Carte nationale</label>
                        <Input
                          value={person.id_card_number}
                          onChange={e => updateCompanion(person.id, 'id_card_number', e.target.value)}
                          placeholder="Ex: 123456789"
                          className="h-10 rounded-lg border-slate-200 bg-white text-sm"
                        />
                      </div>

                      {/* Passport */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wide text-slate-500">N° Passeport</label>
                        <Input
                          value={person.passport_number}
                          onChange={e => updateCompanion(person.id, 'passport_number', e.target.value)}
                          placeholder="Ex: AA1234567"
                          className="h-10 rounded-lg border-slate-200 bg-white text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Field label="Preference chambre / places">
        <Input value={bookingData.room_preference} onChange={e => setBookingData((p: any) => ({ ...p, room_preference: e.target.value }))} placeholder="Double, triple, places cote a cote..." className="h-12 rounded-xl bg-white text-base" />
      </Field>
      <Field label="Demandes speciales">
        <textarea value={bookingData.special_requests} onChange={e => setBookingData((p: any) => ({ ...p, special_requests: e.target.value }))} className="min-h-24 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base outline-none" />
      </Field>
    </section>
  )
}

function VehiclePanel({ activeTransactionTab, setActiveTransactionTab, inventory, vehicleData, setVehicleData, handleVehicleSelect }: any) {
  const { language } = useLanguage()
  const [uploadingIdCard, setUploadingIdCard] = useState(false)
  const [uploadingLicense, setUploadingLicense] = useState(false)

  const transactionOptions = [
    { value: 'ventes', label: 'Vente stock', description: 'Choisir une voiture du stock', icon: Car },
    { value: 'location', label: 'Location', description: 'Choisir une voiture de location', icon: Key },
    { value: 'commande', label: 'Sur Commande', description: 'Choisir ou saisir une voiture', icon: Package },
  ] as const

  const changeTransactionTab = (value: 'ventes' | 'location' | 'commande') => {
    setActiveTransactionTab(value)
    setVehicleData((prev: any) => ({
      ...prev,
      car_id: '',
      car_name: '',
      brand: '',
      model: '',
      year: '',
      color: '',
      version: '',
      sale_price: '',
      total_price: '',
      deposit_paid: '',
    }))
  }

  const handleFileUpload = async (file: File, fieldKey: 'id_card_url' | 'license_url' | 'passport_url', setUploading: (u: boolean) => void) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await uploadCarImageAction(formData)
      if (res.success && res.url) {
        setVehicleData((prev: any) => ({ ...prev, [fieldKey]: res.url }))
      } else {
        alert(res.error || "Erreur lors de l'upload.")
      }
    } catch (err: any) {
      alert(err.message || "Erreur réseau lors de l'upload.")
    } finally {
      setUploading(false)
    }
  }

  const panelTitle =
    activeTransactionTab === 'location'
      ? (language === 'ar' ? 'عقد تأجير سيارة' : 'Contrat location véhicule')
      : activeTransactionTab === 'commande'
        ? (language === 'ar' ? 'طلب استيراد سيارة' : 'Commande import véhicule')
        : (language === 'ar' ? 'بيع سيارة من المخزون' : 'Vente véhicule showroom')

  const selectedVehicleLabel =
    activeTransactionTab === 'location'
      ? (language === 'ar' ? 'السيارة المطلوبة للتأجير' : 'Véhicule à récupérer (Location)')
      : activeTransactionTab === 'commande'
        ? (language === 'ar' ? 'السيارة المطلوبة للاستيراد' : 'Véhicule à récupérer (Import)')
        : (language === 'ar' ? 'السيارة المطلوبة (بيع مخزون)' : 'Véhicule à récupérer (Vente Stock)')

  const amountLabel =
    activeTransactionTab === 'ventes'
      ? 'Prix vente (DZD)'
      : activeTransactionTab === 'location'
        ? 'Montant location (DZD)'
        : 'Montant commande (DZD)'

  return (
    <section className="space-y-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
      <SectionTitle icon={<CreditCard className="h-4 w-4" />} title={panelTitle} />

      <div className="grid gap-3 md:grid-cols-3">
        {transactionOptions.map(option => {
          const Icon = option.icon
          const active = activeTransactionTab === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => changeTransactionTab(option.value)}
              className={cn(
                'rounded-xl border p-3 text-left transition',
                active ? 'border-indigo-500 bg-indigo-50 text-indigo-800 ring-2 ring-indigo-100' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              )}
            >
              <div className="flex items-center gap-2 text-sm font-black">
                <Icon className="h-4 w-4" />
                {option.label}
              </div>
              <p className="mt-1 text-[10px] font-semibold text-slate-400">{option.description}</p>
            </button>
          )
        })}
      </div>
      <Field label={selectedVehicleLabel}>
        <select value={vehicleData.car_id} onChange={handleVehicleSelect} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base font-medium">
          <option value="">
            {language === 'ar' ? 'عميل بدون معاملة فورية' : 'Client sans transaction immédiate'}
          </option>
          {inventory.map((car: any) => (
            <option key={car.id} value={car.id}>
              {car.brand} {car.model} {car.year} - {Number(activeTransactionTab === 'location' ? (car.daily_rate || car.final_price || car.price || 0) : (car.final_price || car.price || 0)).toLocaleString()} DZD
            </option>
          ))}
        </select>
      </Field>
      {inventory.length === 0 && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-700">
          {activeTransactionTab === 'location'
            ? 'Aucune voiture de location disponible. Ajoutez une voiture dans Location Voitures ou changez son statut en available.'
            : activeTransactionTab === 'commande'
              ? 'Aucune voiture sur commande trouvee. Vous pouvez remplir marque, modele, annee et enregistrer la demande manuellement.'
              : 'Aucune voiture en stock disponible. Verifiez le statut et le type dans Ventes Stock.'
          }
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Marque">
          <Input value={vehicleData.brand} onChange={e => setVehicleData((p: any) => ({ ...p, brand: e.target.value, car_name: `${e.target.value} ${p.model}`.trim() }))} placeholder="BMW, Audi..." className="h-12 rounded-xl bg-white text-base" />
        </Field>
        <Field label="Modele">
          <Input value={vehicleData.model} onChange={e => setVehicleData((p: any) => ({ ...p, model: e.target.value, car_name: `${p.brand} ${e.target.value}`.trim() }))} placeholder="X3, A8..." className="h-12 rounded-xl bg-white text-base" />
        </Field>
        <Field label="Annee">
          <Input value={vehicleData.year} type="number" onChange={e => setVehicleData((p: any) => ({ ...p, year: e.target.value }))} placeholder="2026" className="h-12 rounded-xl bg-white text-base" />
        </Field>
        <Field label="Couleur / finition">
          <Input value={vehicleData.color} onChange={e => setVehicleData((p: any) => ({ ...p, color: e.target.value }))} placeholder="Noir, blanc, Pack M..." className="h-12 rounded-xl bg-white text-base" />
        </Field>
      </div>
      {activeTransactionTab === 'location' && (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Date debut">
            <Input type="datetime-local" value={vehicleData.start_date} onChange={e => setVehicleData((p: any) => ({ ...p, start_date: e.target.value }))} className="h-12 rounded-xl bg-white text-base" />
          </Field>
          <Field label="Date fin">
            <Input type="datetime-local" value={vehicleData.end_date} onChange={e => setVehicleData((p: any) => ({ ...p, end_date: e.target.value }))} className="h-12 rounded-xl bg-white text-base" />
          </Field>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={amountLabel}>
          <Input
            type="number"
            value={activeTransactionTab === 'ventes' ? vehicleData.sale_price : vehicleData.total_price}
            onChange={e => setVehicleData((p: any) => activeTransactionTab === 'ventes'
              ? { ...p, sale_price: e.target.value, total_price: e.target.value }
              : { ...p, total_price: e.target.value }
            )}
            className="h-12 rounded-xl border-indigo-200 bg-white text-base font-black text-indigo-700"
          />
        </Field>
        <Field label="Paiement">
          <select value={vehicleData.payment_method} onChange={e => setVehicleData((p: any) => ({ ...p, payment_method: e.target.value }))} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base">
            <option value="Cash">Espèces</option>
            <option value="Bank Transfer">Virement</option>
            <option value="Check">Chèque</option>
          </select>
        </Field>
      </div>
      {activeTransactionTab === 'commande' && (
        <Field label="Avance payee (DZD)">
          <Input type="number" value={vehicleData.deposit_paid} onChange={e => setVehicleData((p: any) => ({ ...p, deposit_paid: e.target.value }))} className="h-12 rounded-xl bg-white text-base font-black text-emerald-700" />
        </Field>
      )}

      <div className="space-y-4 border-t border-slate-200 pt-4">
        {/* Identity Document Upload */}
        <div className="space-y-2">
          <Label className="text-xs font-black uppercase tracking-wide text-slate-600">
            {language === 'ar' ? 'بطاقة التعريف الوطنية (تحميل)' : "Carte d'identité (Upload CNI)"}
          </Label>
          <div className="flex items-center gap-3">
            <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/20 rounded-xl p-4 cursor-pointer transition text-center min-h-[90px]">
              <UploadCloud className="h-6 w-6 text-slate-400 mb-1" />
              <span className="text-[11px] font-bold text-slate-500">
                {uploadingIdCard 
                  ? (language === 'ar' ? 'جاري التحميل...' : 'Téléchargement...') 
                  : (language === 'ar' ? 'اضغط أو اسحب لرفع بطاقة التعريف' : 'Glissez ou cliquez pour uploader la CNI')
                }
              </span>
              <span className="text-[9px] text-slate-400 mt-0.5">Format PNG, JPG, PDF</span>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                disabled={uploadingIdCard}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file, 'id_card_url', setUploadingIdCard)
                }}
              />
            </label>
            {vehicleData.id_card_url && (
              <div className="flex flex-col items-center gap-1.5 p-2 border border-slate-200 rounded-xl bg-white shrink-0 w-20">
                <div className="h-10 w-14 rounded bg-slate-100 flex items-center justify-center text-emerald-600 font-bold text-[10px] border overflow-hidden">
                  {vehicleData.id_card_url.endsWith('.pdf') ? (
                    'PDF'
                  ) : (
                    <img src={vehicleData.id_card_url} className="object-cover h-full w-full" alt="CNI Preview" />
                  )}
                </div>
                <a
                  href={vehicleData.id_card_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[9px] font-black text-indigo-600 hover:underline"
                >
                  {language === 'ar' ? 'معاينة' : 'Voir Copie'}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Driver's License or Secondary Document Upload */}
        <div className="space-y-2">
          <Label className="text-xs font-black uppercase tracking-wide text-slate-600">
            {activeTransactionTab === 'location' 
              ? (language === 'ar' ? 'رخصة السياقة (تحميل)' : 'Permis de Conduire (Upload)')
              : (language === 'ar' ? 'وثيقة ثانوية / جواز السفر (تحميل)' : 'Document Secondaire / Passeport')
            }
          </Label>
          <div className="flex items-center gap-3">
            <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/20 rounded-xl p-4 cursor-pointer transition text-center min-h-[90px]">
              <UploadCloud className="h-6 w-6 text-slate-400 mb-1" />
              <span className="text-[11px] font-bold text-slate-500">
                {uploadingLicense 
                  ? (language === 'ar' ? 'جاري التحميل...' : 'Téléchargement...') 
                  : (language === 'ar' ? 'اضغط أو اسحب لرفع الوثيقة' : 'Glissez ou cliquez pour uploader')
                }
              </span>
              <span className="text-[9px] text-slate-400 mt-0.5">Format PNG, JPG, PDF</span>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                disabled={uploadingLicense}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    const key = activeTransactionTab === 'location' ? 'license_url' : 'passport_url'
                    handleFileUpload(file, key, setUploadingLicense)
                  }
                }}
              />
            </label>
            {((activeTransactionTab === 'location' && vehicleData.license_url) || (activeTransactionTab !== 'location' && vehicleData.passport_url)) && (
              <div className="flex flex-col items-center gap-1.5 p-2 border border-slate-200 rounded-xl bg-white shrink-0 w-20">
                <div className="h-10 w-14 rounded bg-slate-100 flex items-center justify-center text-emerald-600 font-bold text-[10px] border overflow-hidden">
                  {((activeTransactionTab === 'location' ? vehicleData.license_url : vehicleData.passport_url) || '').endsWith('.pdf') ? (
                    'PDF'
                  ) : (
                    <img src={activeTransactionTab === 'location' ? vehicleData.license_url : vehicleData.passport_url} className="object-cover h-full w-full" alt="Doc Preview" />
                  )}
                </div>
                <a
                  href={activeTransactionTab === 'location' ? vehicleData.license_url : vehicleData.passport_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[9px] font-black text-indigo-600 hover:underline"
                >
                  {language === 'ar' ? 'معاينة' : 'Voir Copie'}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function Field({ label, children, required, className }: { label: string; children: React.ReactNode; required?: boolean; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-xs font-black uppercase tracking-wide text-slate-600">
        {label} {required && <span className="text-rose-500">*</span>}
      </Label>
      {children}
    </div>
  )
}

function SectionTitle({ icon, title, compact = false }: { icon: React.ReactNode; title: string; compact?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2 text-slate-900', !compact && 'border-b border-slate-200 pb-3')}>
      <span className="text-sky-600">{icon}</span>
      <h3 className="text-sm font-black uppercase tracking-widest">{title}</h3>
    </div>
  )
}

function BriefcaseIcon(props: React.ComponentProps<typeof Building2>) {
  return <Building2 {...props} />
}
