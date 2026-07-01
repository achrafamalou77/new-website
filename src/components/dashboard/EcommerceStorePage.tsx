import { redirect } from 'next/navigation'
import { getEcommerceStoreData } from '@/app/actions/ecommerce'
import EcommerceStoreClient from '@/components/dashboard/EcommerceStoreClient'
import type { EcommerceStoreView } from '@/types/ecommerce'

export default async function EcommerceStorePage({ view }: { view: EcommerceStoreView }) {
  const result = await getEcommerceStoreData()
  if (!result.success) {
    if (result.error === 'Unauthorized') redirect('/login')
    return (
      <div className="flex flex-1 items-center justify-center bg-slate-50 p-8">
        <div className="max-w-md rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-black text-slate-900">Store unavailable</h1>
          <p className="mt-3 text-sm text-red-700">{result.error}</p>
        </div>
      </div>
    )
  }
  return <EcommerceStoreClient view={view} initialData={result.data} />
}
