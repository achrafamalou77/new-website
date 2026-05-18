import { getVisaTypes } from '@/app/actions/visa'
import { VisaTypeCard } from '@/components/visa/VisaTypeCard'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Compass, ChevronLeft, PlusCircle, Layers } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function VisaTypesPage() {
  const result = await getVisaTypes()
  const visaTypes = result.success && result.data ? result.data : []

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 lg:p-8 font-geist">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Navigation back and header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link 
              href="/dashboard/visa" 
              className="inline-flex items-center text-xs font-bold text-slate-400 hover:text-slate-600 transition gap-1 uppercase"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Visa Services
            </Link>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2 mt-1">
              <Compass className="h-7 w-7 text-blue-600" />
              Visa Catalog & Rule Configuration
            </h1>
            <p className="text-[12px] text-slate-500 font-semibold uppercase tracking-wide">
              Pre-load standard embassy guidelines, configure standard/express agency service fees
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Badge className="bg-slate-100 text-slate-700 border text-xs px-3 py-1 font-bold rounded-xl shrink-0">
              {visaTypes.length} Active Classes
            </Badge>
          </div>
        </div>

        {/* Informative alert box */}
        <div className="p-4 bg-slate-900 border border-slate-800 text-white rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
          <div className="space-y-1">
            <h4 className="font-extrabold text-[13px] text-amber-400">Algerian SaaS Default Settings loaded</h4>
            <p className="text-[11px] text-slate-400 font-medium">
              We've pre-seeded the system with official defaults for Turkey, France, UK, Saudi Arabia, UAE, USA, and Canada. Standard/Express fee ratios are fully configurable.
            </p>
          </div>
          <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
            <Layers className="h-3 w-3" />
            58 Wilayas Supported
          </div>
        </div>

        {/* Grid and list */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visaTypes.map((vt) => (
            <VisaTypeCard 
              key={vt.id} 
              visaType={vt} 
            />
          ))}
        </div>

      </div>
    </div>
  )
}

// Inline badge helper since it is used directly
function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${className}`}>
      {children}
    </span>
  )
}
