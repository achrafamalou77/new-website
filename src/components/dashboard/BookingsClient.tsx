'use client'

import { useState } from 'react'
import { Booking, Trip } from '@/lib/mock-data'
import { updateBookingStatus } from '@/app/actions/bookings'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { format } from 'date-fns'

export function BookingsClient({ initialBookings, trips }: { initialBookings: Booking[], trips: Trip[] }) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings)
  const [filter, setFilter] = useState<'All' | 'pending_payment' | 'completed' | 'cancelled'>('All')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const filteredBookings = filter === 'All' 
    ? bookings 
    : bookings.filter(b => b.status === filter)

  const getTripTitle = (tripId: string | null) => {
    if (!tripId) return 'Unknown Trip'
    return trips.find(t => t.id === tripId)?.title || 'Unknown Trip'
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
      case 'cancelled': return 'bg-red-100 text-red-700 hover:bg-red-200'
      default: return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
    }
  }

  const handleStatusUpdate = async (id: string, newStatus: 'pending_payment' | 'completed' | 'cancelled') => {
    setIsUpdating(true)
    const result = await updateBookingStatus(id, newStatus)
    
    if (result.success) {
      setBookings(bookings.map(b => b.id === id ? { ...b, status: newStatus } : b))
      setSelectedBooking(prev => prev && prev.id === id ? { ...prev, status: newStatus } : prev)
    } else {
      alert(result.error)
    }
    setIsUpdating(false)
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Bookings</h1>
          <p className="text-sm text-slate-500">Manage client reservations and payments.</p>
        </div>
      </div>

      <div className="flex gap-2 pb-2 border-b overflow-x-auto">
        {(['All', 'pending_payment', 'completed', 'cancelled'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              filter === tab 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            {tab === 'pending_payment' ? 'Pending' : tab === 'All' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {filteredBookings.length === 0 ? (
        <div className="text-center py-24 bg-white border border-dashed rounded-xl">
          <p className="text-slate-500">No bookings yet. Chatbot bookings appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Client Name</TableHead>
                <TableHead>Trip</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.map((booking) => {
                const manifest = (booking.client_manifest as any) || {}
                return (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{manifest.name || 'Unknown'}</TableCell>
                    <TableCell>{getTripTitle(booking.trip_id)}</TableCell>
                    <TableCell className="text-slate-500">{booking.created_at ? format(new Date(booking.created_at), 'MMM d, yyyy') : ''}</TableCell>
                    <TableCell className="font-medium">{(booking.total_price || 0).toLocaleString()} DZD</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getStatusColor(booking.status)}>
                        {booking.status === 'pending_payment' ? 'Pending' : booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => setSelectedBooking(booking)}>
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Sheet open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Booking Details</SheetTitle>
          </SheetHeader>
          
          {selectedBooking && (
            <div className="mt-8 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-2">Status</h3>
                <Badge className={getStatusColor(selectedBooking.status)}>
                  {selectedBooking.status === 'pending_payment' ? 'Pending Payment' : selectedBooking.status?.toUpperCase()}
                </Badge>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border space-y-3">
                <h3 className="font-semibold border-b pb-2">Client Information</h3>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="text-slate-500">Name</div>
                  <div className="font-medium">{(selectedBooking.client_manifest as any)?.name || 'N/A'}</div>
                  <div className="text-slate-500">Email</div>
                  <div className="font-medium">{(selectedBooking.client_manifest as any)?.email || 'N/A'}</div>
                  <div className="text-slate-500">Phone</div>
                  <div className="font-medium">{(selectedBooking.client_manifest as any)?.phone || 'N/A'}</div>
                  <div className="text-slate-500">Adults</div>
                  <div className="font-medium">{(selectedBooking.client_manifest as any)?.adults || 1}</div>
                  <div className="text-slate-500">Children</div>
                  <div className="font-medium">{(selectedBooking.client_manifest as any)?.children || 0}</div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border space-y-3">
                <h3 className="font-semibold border-b pb-2">Trip Summary</h3>
                <div className="space-y-1">
                  <div className="font-medium">{getTripTitle(selectedBooking.trip_id)}</div>
                  <div className="text-2xl font-bold text-blue-600">{(selectedBooking.total_price || 0).toLocaleString()} DZD</div>
                  <div className="text-xs text-slate-500 mt-2">
                    Booked on: {selectedBooking.created_at ? format(new Date(selectedBooking.created_at), 'PPP p') : ''}
                  </div>
                </div>
              </div>

              {selectedBooking.status === 'pending_payment' && (
                <div className="pt-4 flex gap-3">
                  <Button 
                    className="w-full bg-emerald-600 hover:bg-emerald-700" 
                    onClick={() => handleStatusUpdate(selectedBooking.id, 'completed')}
                    disabled={isUpdating}
                  >
                    Mark as Paid
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="w-full" 
                    onClick={() => handleStatusUpdate(selectedBooking.id, 'cancelled')}
                    disabled={isUpdating}
                  >
                    Cancel Booking
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
