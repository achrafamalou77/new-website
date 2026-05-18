import { getVisaApplicationById } from '@/app/actions/visa'
import { VisaDetailsClient } from '@/components/visa/VisaDetailsClient'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function VisaApplicationDetailPage({ params }: PageProps) {
  const { id } = await params
  
  const result = await getVisaApplicationById(id)
  
  if (!result.success || !result.data) {
    redirect('/dashboard/visa')
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 lg:p-8 font-geist">
      <div className="max-w-7xl mx-auto">
        <VisaDetailsClient initialData={result.data as any} />
      </div>
    </div>
  )
}
