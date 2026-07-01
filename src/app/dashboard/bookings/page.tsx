import { createClient } from '@/lib/supabase/server'
import { isSupabaseConnected } from '@/lib/supabase/client'
import { BookingsClient } from '@/components/dashboard/BookingsClient'
import { getCurrentAgencyContext } from '@/lib/server/agency-context'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

export default async function BookingsPage() {
  return (
    <Suspense fallback={
      <div className="p-6 space-y-6 animate-pulse">
        <div className="flex justify-between items-center bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <div className="space-y-2">
            <div className="h-6 bg-slate-200 rounded-lg w-48" />
            <div className="h-4 bg-slate-200 rounded-lg w-72" />
          </div>
          <div className="h-10 bg-indigo-200 rounded-full w-32" />
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 h-64 w-full" />
      </div>
    }>
      <BookingsContent />
    </Suspense>
  )
}

async function BookingsContent() {
  let initialBookings: any[] = []
  let trips: any[] = []
  const context = await getCurrentAgencyContext()

  if (context.businessTypeSlug === 'car_showroom') {
    redirect('/dashboard')
  }

  if (isSupabaseConnected && context.agencyId) {
    const supabase = await createClient()

    const { data: bookingsData } = await supabase
      .from('bookings')
      .select('*')
      .eq('agency_id', context.agencyId)
      .order('created_at', { ascending: false })
      
    if (bookingsData) initialBookings = bookingsData

    const { data: tripsData } = await supabase
      .from('trips')
      .select('id, title')
      .eq('agency_id', context.agencyId)
      
    if (tripsData) trips = tripsData as any[]
  }

  return <BookingsClient initialBookings={initialBookings} trips={trips} />
}
