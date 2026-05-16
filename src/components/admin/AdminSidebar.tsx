'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LayoutDashboard, Building2, CreditCard, BarChart3, LogOut } from 'lucide-react'

const MENU_ITEMS = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Agencies', href: '/admin/agencies', icon: Building2 },
  { name: 'Plans', href: '/admin/plans', icon: CreditCard },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }
    router.push('/admin/login')
  }

  return (
    <div className="w-64 h-screen bg-slate-950 text-slate-300 flex flex-col border-r border-slate-800">
      <div className="p-6">
        <div className="text-white font-bold text-xl tracking-tight">SaaS Admin</div>
        <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Owner Portal</div>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
          const Icon = item.icon
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-blue-200' : 'text-slate-500'}`} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-md hover:bg-slate-900 transition-colors text-sm font-medium text-slate-400 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  )
}
