import { createClient } from '@/lib/supabase/server'
import { isSupabaseConnected } from '@/lib/supabase/client'
import { mockTrips, mockProfiles } from '@/lib/mock-data'
import { TripsClient } from '@/components/dashboard/TripsClient'
import { getCurrentAgencyContext } from '@/lib/server/agency-context'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

export default async function TripsPage() {
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-200 rounded-2xl w-full" />
          <div className="h-64 bg-slate-200 rounded-2xl w-full" />
          <div className="h-64 bg-slate-200 rounded-2xl w-full" />
        </div>
      </div>
    }>
      <TripsContent />
    </Suspense>
  )
}

async function TripsContent() {
  let initialTrips = [...mockTrips]
  let userRole = mockProfiles[0].role // Default superadmin for mock
  const context = await getCurrentAgencyContext()

  if (context.businessTypeSlug === 'car_showroom') {
    redirect('/dashboard')
  }

  if (isSupabaseConnected) {
    const supabase = await createClient()

    userRole = context.role || userRole

    if (context.agencyId) {
      const { data: tripsData } = await supabase
        .from('trips')
        .select('*')
        .eq('agency_id', context.agencyId)
        .order('created_at', { ascending: false })

      if (tripsData) {
        initialTrips = tripsData
      }
    }
  }

  return <TripsClient initialTrips={initialTrips} userRole={userRole!} />
}
