import { getVisaStats, getVisaApplications } from '@/app/actions/visa'
import { getEmployees } from '@/app/actions/employees'
import { createClient } from '@/lib/supabase/server'
import { VisaStats } from '@/components/visa/VisaStats'
import { ApplicationsTable } from '@/components/visa/ApplicationsTable'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { FileText, PlusCircle, Compass, RefreshCw, Layers } from 'lucide-react'
import { getCurrentAgencyContext } from '@/lib/server/agency-context'
import { redirect } from 'next/navigation'

export default async function VisaDashboardPage() {
  const context = await getCurrentAgencyContext()

  if (context.businessTypeSlug === 'car_showroom') {
    redirect('/dashboard')
  }

  // Fetch stats, applications list, and employees list in parallel
  const [statsRes, appsRes, employees] = await Promise.all([
    getVisaStats(),
    getVisaApplications(),
    getEmployees()
  ])

  const stats = statsRes.success && statsRes.stats ? statsRes.stats : {
    activeApplications: 0,
    pendingDocuments: 0,
    underReview: 0,
    approvedThisMonth: 0,
    revenue: 0,
    ccpRevenue: 0,
    cashRevenue: 0
  }

  const applications = appsRes.success && appsRes.data ? appsRes.data : []

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 lg:p-8 font-geist">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <FileText className="h-7 w-7 text-blue-600" />
              Visa Services & Processing Hub
            </h1>
            <p className="text-[12px] text-slate-500 font-semibold uppercase tracking-wide">
              Manage client visa files, schedule biometrics, and track post-office CCP receipts
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/dashboard/visa/types">
              <Button variant="outline" className="border-slate-200 hover:bg-slate-50 text-slate-655 font-bold rounded-xl text-xs h-10 px-4">
                <Compass className="h-4 w-4 mr-2 text-slate-400" />
                Visa Catalog & Fees
              </Button>
            </Link>
            
            <Link href="/dashboard/visa/new">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs h-10 px-5 shadow-sm shadow-blue-500/10 animate-pulse">
                <PlusCircle className="h-4 w-4 mr-2" />
                New Application
              </Button>
            </Link>
          </div>
        </div>

        <VisaStats stats={stats} />

        {/* Applications List Table Panel */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-extrabold text-slate-800 text-[15px] tracking-tight uppercase">
              Active Visa Submissions ({applications.length})
            </h2>
            <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-full border">
              <Layers className="h-3 w-3" />
              Wilaya Filter Enabled (1-58)
            </div>
          </div>

          <ApplicationsTable 
            initialApplications={applications} 
            employees={employees} 
          />
        </div>

      </div>
    </div>
  )
}
