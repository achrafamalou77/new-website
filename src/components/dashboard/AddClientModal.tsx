'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { User, Phone, Mail, FileText, Calendar, MapPin, Share2 } from 'lucide-react'
import { createClientAction, updateClientAction } from '@/app/actions/clients'

interface AddClientModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingClients?: Array<{ id: string; full_name: string }>
  clientToEdit?: any // If provided, modal acts as "Edit Client"
  onSuccess?: () => void
}

export function AddClientModal({
  open,
  onOpenChange,
  existingClients = [],
  clientToEdit = null,
  onSuccess
}: AddClientModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState(clientToEdit?.source || 'walk_in')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const payload = {
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
    }

    try {
      const res = clientToEdit 
        ? await updateClientAction(clientToEdit.id, payload)
        : await createClientAction(payload)

      if (res.success) {
        onOpenChange(false)
        if (onSuccess) onSuccess()
      } else {
        setError(res.error || 'Something went wrong')
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
      <DialogContent className="max-w-2xl rounded-2xl overflow-hidden font-geist bg-white border border-slate-100 shadow-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-left pb-2 border-b border-slate-100">
          <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-500" />
            {isEdit ? 'Modifier la Fiche Client' : 'Ajouter un Nouveau Client'}
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-xs">
            {isEdit ? 'Mettre à jour les informations du dossier de votre client.' : 'Enregistrez les informations personnelles et de contact de votre client voyageur.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4 text-left">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-100">
              {error}
            </div>
          )}

          {/* Section 1: Informations Primaires */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-1 md:col-span-2">
              <Label className="text-xs font-semibold text-slate-600">Nom Complet / Full Name <span className="text-red-500">*</span></Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  className="rounded-xl bg-slate-100 border-0 text-sm focus:bg-white pl-9 transition" 
                  name="full_name" 
                  required 
                  defaultValue={clientToEdit?.full_name || ''} 
                  placeholder="E.g., Achraf Amalou" 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Téléphone / Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  className="rounded-xl bg-slate-100 border-0 text-sm focus:bg-white pl-9 transition" 
                  name="phone" 
                  defaultValue={clientToEdit?.phone || ''} 
                  placeholder="E.g., +213 555 12 34 56" 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Adresse Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  className="rounded-xl bg-slate-100 border-0 text-sm focus:bg-white pl-9 transition" 
                  name="email" 
                  type="email" 
                  defaultValue={clientToEdit?.email || ''} 
                  placeholder="E.g., client@example.com" 
                />
              </div>
            </div>
          </div>

          {/* Section 2: Pièces d'identité & Naissance */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-50 pt-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">N° Carte Nationale (CNI)</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  className="rounded-xl bg-slate-100 border-0 text-sm focus:bg-white pl-9 transition" 
                  name="id_card_number" 
                  defaultValue={clientToEdit?.id_card_number || ''} 
                  placeholder="18-digit ID" 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">N° Passeport</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  className="rounded-xl bg-slate-100 border-0 text-sm focus:bg-white pl-9 transition" 
                  name="passport_number" 
                  defaultValue={clientToEdit?.passport_number || ''} 
                  placeholder="Passport number" 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Date de Naissance</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  className="rounded-xl bg-slate-100 border-0 text-sm focus:bg-white pl-9 transition" 
                  name="date_of_birth" 
                  type="date" 
                  defaultValue={clientToEdit?.date_of_birth || ''} 
                />
              </div>
            </div>
          </div>

          {/* Section 3: Adresse et Localisation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-50 pt-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Ville / City</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  className="rounded-xl bg-slate-100 border-0 text-sm focus:bg-white pl-9 transition" 
                  name="city" 
                  defaultValue={clientToEdit?.city || ''} 
                  placeholder="E.g., Alger, Oran, Constantine" 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Adresse Résidence</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  className="rounded-xl bg-slate-100 border-0 text-sm focus:bg-white pl-9 transition" 
                  name="address" 
                  defaultValue={clientToEdit?.address || ''} 
                  placeholder="Adresse complète" 
                />
              </div>
            </div>
          </div>

          {/* Section 4: Provenance / Acquisition */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-50 pt-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Canal d'Acquisition / Source <span className="text-red-500">*</span></Label>
              <select 
                name="source" 
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-xl border-0 bg-slate-100 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {/* Walk-in is first and slate colored style is added in rendering */}
                <option value="walk_in" className="text-slate-700 font-semibold">Walk-in (Sur Place / Slate)</option>
                <option value="whatsapp" className="text-[#25D366] font-semibold">WhatsApp</option>
                <option value="facebook" className="text-[#0084FF] font-semibold">Facebook</option>
                <option value="instagram" className="text-pink-600 font-semibold">Instagram</option>
                <option value="phone" className="text-blue-600 font-semibold">Téléphone / Phone</option>
                <option value="referral" className="text-amber-600 font-semibold">Referral (Parrainage)</option>
              </select>
            </div>

            {/* Conditional Referral Dropdown */}
            {source === 'referral' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Parrainé par / Referred by</Label>
                <div className="relative">
                  <select 
                    name="referred_by_id" 
                    defaultValue={clientToEdit?.referred_by_id || ''}
                    className="flex h-10 w-full items-center justify-between rounded-xl border-0 bg-slate-100 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">-- Sélectionner un parrain --</option>
                    {existingClients.map(c => (
                      <option key={c.id} value={c.id}>{c.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5 border-t border-slate-50 pt-4">
            <Label className="text-xs font-semibold text-slate-600">Notes / Remarques Internes</Label>
            <textarea 
              className="flex min-h-[80px] w-full rounded-xl border-0 bg-slate-100 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition resize-y" 
              name="notes" 
              defaultValue={clientToEdit?.notes || ''} 
              placeholder="Ajoutez des spécificités sur le voyageur (ex: repas spécial, visa en cours)..." 
            />
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100 gap-2 flex items-center justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="rounded-xl border-slate-200 text-slate-600"
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-indigo-650 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-md shadow-indigo-150"
            >
              {loading ? 'Enregistrement...' : isEdit ? 'Enregistrer les Modifications' : 'Enregistrer le Client'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
