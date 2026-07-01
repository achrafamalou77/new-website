import { getLeadsBoardData } from '@/app/actions/leads'
import { LeadsBoardClient } from '@/components/dashboard/LeadsBoardClient'
import { LanguageProvider } from '@/lib/contexts/LanguageContext'
import { Suspense } from 'react'

export default async function LeadsBoardPage() {
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
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          <div className="h-96 bg-slate-200 rounded-2xl w-full" />
          <div className="h-96 bg-slate-200 rounded-2xl w-full" />
          <div className="h-96 bg-slate-200 rounded-2xl w-full" />
          <div className="h-96 bg-slate-200 rounded-2xl w-full" />
          <div className="h-96 bg-slate-200 rounded-2xl w-full" />
          <div className="h-96 bg-slate-200 rounded-2xl w-full" />
        </div>
      </div>
    }>
      <LeadsBoardContent />
    </Suspense>
  )
}

async function LeadsBoardContent() {
  const result = await getLeadsBoardData()
  const leads = result.leads || []
  const businessTypeSlug = result.businessTypeSlug || 'travel'

  return (
    <LanguageProvider>
      <LeadsBoardClient initialLeads={leads} businessTypeSlug={businessTypeSlug} />
    </LanguageProvider>
  )
}
