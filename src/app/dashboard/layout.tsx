import { Sidebar } from '@/components/dashboard/Sidebar'
import { Header } from '@/components/dashboard/Header'
import { headers } from 'next/headers'
import { LanguageProvider } from '@/lib/contexts/LanguageContext'
import { Suspense } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <LanguageProvider>
      <Suspense fallback={
        <div className="flex h-screen w-screen bg-[#f4f5f7] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 animate-pulse" />
            <div className="text-[11px] font-semibold text-gray-400 tracking-wide">Loading...</div>
          </div>
        </div>
      }>
        <DashboardLayoutInner>
          {children}
        </DashboardLayoutInner>
      </Suspense>
    </LanguageProvider>
  )
}

async function DashboardLayoutInner({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const userRole = headersList.get('x-user-role') || 'superadmin'
  const businessTypeHeader = headersList.get('x-business-type-slug')
  const cookieHeader = headersList.get('cookie') || ''
  const match = cookieHeader.match(/demo_business_type_slug=([^;]+)/)
  const rawBusinessType = businessTypeHeader || (match ? match[1] : 'travel')
  const businessTypeSlug = rawBusinessType === 'travel_agency' ? 'travel' : rawBusinessType

  return (
    <div className="dashboard-shell flex h-screen overflow-hidden bg-[#f4f5f7]">
      <Sidebar
        role={userRole}
        businessTypeSlug={businessTypeSlug}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header role={userRole} />
        <main className="flex flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
