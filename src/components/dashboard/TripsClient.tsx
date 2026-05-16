'use client'

import { useState } from 'react'
import { Trip } from '@/lib/mock-data'
import { createTrip, updateTrip, deleteTrip } from '@/app/actions/trips'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Edit2, Trash2, Search, Loader2 } from 'lucide-react'
import { z } from 'zod'

const tripSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  destination: z.string().min(2, "Destination must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.number().min(1, "Price must be greater than 0"),
  duration_days: z.number().min(1, "Duration must be at least 1 day"),
  image_urls: z.string().min(5, "Please provide at least one image URL"),
  is_active: z.boolean()
})

export function TripsClient({ initialTrips, userRole }: { initialTrips: Trip[], userRole: string }) {
  const [trips, setTrips] = useState<Trip[]>(initialTrips)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    destination: '',
    description: '',
    price: '',
    duration_days: '',
    image_urls: '',
    is_active: true
  })

  const filteredTrips = trips.filter(t => 
    t.destination.toLowerCase().includes(search.toLowerCase()) || 
    t.title.toLowerCase().includes(search.toLowerCase())
  )

  const openAddModal = () => {
    setEditingTrip(null)
    setFormData({
      title: '', destination: '', description: '', price: '', duration_days: '', image_urls: '', is_active: true
    })
    setError('')
    setIsModalOpen(true)
  }

  const openEditModal = (trip: Trip) => {
    setEditingTrip(trip)
    setFormData({
      title: trip.title,
      destination: trip.destination,
      description: trip.description || '',
      price: trip.price.toString(),
      duration_days: trip.duration_days.toString(),
      image_urls: ((trip.image_urls as string[]) || []).join(', '),
      is_active: trip.is_active || false
    })
    setError('')
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this trip?')) return
    
    setIsDeleting(id)
    const result = await deleteTrip(id)
    if (result.success) {
      setTrips(trips.filter(t => t.id !== id))
    } else {
      alert(result.error)
    }
    setIsDeleting(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    try {
      const parsedData = tripSchema.parse({
        ...formData,
        price: Number(formData.price),
        duration_days: Number(formData.duration_days)
      })

      setLoading(true)
      
      let result
      if (editingTrip) {
        result = await updateTrip(editingTrip.id, parsedData)
      } else {
        result = await createTrip(parsedData)
      }

      if (result.success) {
        setIsModalOpen(false)
        // In a real app, Server Actions with revalidatePath will refresh the page data
        // For demo mode, we force a reload to see mock changes (or we could mutate local state)
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
          alert('Saved successfully (Demo mode)')
        } else {
          window.location.reload()
        }
      } else {
        setError(result.error || 'Failed to save trip')
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError((err as any).errors[0].message)
      } else {
        setError('An unexpected error occurred')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Trips Management</h1>
          <p className="text-sm text-slate-500">Manage your travel catalog and packages.</p>
        </div>
        {userRole === 'superadmin' && (
          <Button onClick={openAddModal}>
            <Plus className="mr-2 h-4 w-4" /> Add New Trip
          </Button>
        )}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input 
          placeholder="Search by destination..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredTrips.length === 0 ? (
        <div className="text-center py-24 bg-white border border-dashed rounded-xl">
          <p className="text-slate-500 mb-4">No trips found.</p>
          {userRole === 'superadmin' && (
            <Button onClick={openAddModal} variant="outline">Create your first trip</Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {filteredTrips.map((trip) => (
            <Card key={trip.id} className="overflow-hidden flex flex-col">
              <div 
                className="h-48 bg-slate-200 bg-cover bg-center"
                style={{ backgroundImage: `url(${((trip.image_urls as string[]) || [])[0] || ''})` }}
              />
              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg line-clamp-1">{trip.title}</h3>
                  <div className={`px-2 py-1 text-[10px] font-bold rounded-full ${trip.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {trip.is_active ? 'ACTIVE' : 'DRAFT'}
                  </div>
                </div>
                <p className="text-sm text-slate-500 mb-4 line-clamp-2">{trip.description}</p>
                <div className="mt-auto space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Destination</span>
                    <span className="font-medium">{trip.destination}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Duration</span>
                    <span className="font-medium">{trip.duration_days} Days</span>
                  </div>
                  <div className="flex justify-between text-sm items-center pt-2 border-t">
                    <span className="font-bold text-lg text-blue-600">{trip.price.toLocaleString()} DZD</span>
                    {userRole === 'superadmin' && (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditModal(trip)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(trip.id)} disabled={isDeleting === trip.id}>
                          {isDeleting === trip.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingTrip ? 'Edit Trip' : 'Add New Trip'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md">{error}</div>}
            
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Summer in Paris" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Destination</Label>
                <Input value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value})} placeholder="France" />
              </div>
              <div className="space-y-2">
                <Label>Duration (Days)</Label>
                <Input type="number" value={formData.duration_days} onChange={e => setFormData({...formData, duration_days: e.target.value})} placeholder="7" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Price (DZD)</Label>
              <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="150000" />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe the trip..." />
            </div>

            <div className="space-y-2">
              <Label>Image URLs (comma separated)</Label>
              <Textarea value={formData.image_urls} onChange={e => setFormData({...formData, image_urls: e.target.value})} placeholder="https://..., https://..." />
            </div>

            <div className="flex items-center justify-between pt-2">
              <Label>Active (Visible to customers)</Label>
              <Switch checked={formData.is_active} onCheckedChange={c => setFormData({...formData, is_active: c})} />
            </div>

            <div className="pt-6 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingTrip ? 'Save Changes' : 'Create Trip'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
