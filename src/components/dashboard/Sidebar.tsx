'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Inbox, Calendar, ClipboardList, Users, Settings, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'

const navItems = [
  { name: 'Inbox', href: '/dashboard/inbox', icon: Inbox, badge: 3 },
  { name: 'Trips', href: '/dashboard/trips', icon: Calendar },
  { name: 'Bookings', href: '/dashboard/bookings', icon: ClipboardList },
  { name: 'Team', href: '/dashboard/team', icon: Users },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar({ role }: { role?: string }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className={cn("relative hidden lg:flex flex-col border-r bg-white transition-all duration-300", collapsed ? "w-20" : "w-64")}>
      <div className="flex h-16 items-center justify-center border-b px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-bold">
            TA
          </div>
          {!collapsed && <span className="font-semibold whitespace-nowrap overflow-hidden">Travel Agency</span>}
        </div>
      </div>

      <Button 
        variant="outline" 
        size="icon" 
        className="absolute -right-4 top-20 z-10 h-8 w-8 rounded-full bg-white shadow-sm"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          // Hide Team and Settings for employees
          if (role === 'employee' && (item.name === 'Team' || item.name === 'Settings')) {
            return null
          }

          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "relative flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive 
                  ? "bg-blue-50 text-blue-700" 
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-blue-700" : "text-slate-400")} />
                {!collapsed && <span>{item.name}</span>}
              </div>
              {!collapsed && item.badge && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                  {item.badge}
                </Badge>
              )}
              {collapsed && item.badge && (
                <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-blue-600" />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-4">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <Avatar>
            <AvatarFallback>SA</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-medium capitalize">{role || 'User'}</span>
              <span className="truncate text-xs text-slate-500">Agency Member</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
