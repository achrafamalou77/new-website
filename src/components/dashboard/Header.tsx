'use client'

import { useState } from 'react'
import { Bell, Menu, Search, ChevronRight, User, LogOut, CreditCard, Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePathname } from 'next/navigation'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { logout } from '@/app/actions/auth'

export function Header({ onMenuClick, role }: { onMenuClick?: () => void; role?: string }) {
  const pathname = usePathname()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Dynamically calculate dynamic breadcrumbs and title
  const getPageTitle = () => {
    if (pathname.includes('/settings/website')) return { title: 'Website Settings', category: 'Settings' }
    if (pathname.includes('/settings/chatbot')) return { title: 'Chatbot Settings', category: 'Settings' }
    if (pathname.includes('/settings/agency')) return { title: 'Agency Settings', category: 'Settings' }
    if (pathname.includes('/inbox')) return { title: 'Inbox', category: 'Conversations' }
    if (pathname.includes('/trips')) return { title: 'Trips', category: 'Inventory' }
    if (pathname.includes('/bookings')) return { title: 'Bookings', category: 'Sales' }
    if (pathname.includes('/team')) return { title: 'Team Members', category: 'Organization' }
    return { title: 'Overview', category: 'Dashboard' }
  }

  const { title, category } = getPageTitle()

  return (
    <header className="flex h-16 shrink-0 items-center justify-between bg-white border-b border-slate-200/80 px-6 font-geist relative z-20">
      {/* Left Area: Mobile Menu Trigger + Dynamic Breadcrumbs */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5 text-slate-600" />
        </Button>
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-400">
          <span className="hover:text-slate-600 cursor-pointer">Dashboard</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="hover:text-slate-600 cursor-pointer">{category}</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-indigo-600 font-bold">{title}</span>
        </div>
      </div>

      {/* Middle Area: Centered Search Input with Command-K shortcut */}
      <div className="hidden md:flex items-center max-w-md w-full mx-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search anything..." 
            className="w-full pl-9 pr-14 py-1.5 text-xs font-medium bg-slate-100/60 border-0 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition h-9 text-slate-800"
            disabled
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-5 select-none items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 font-mono text-[9px] font-bold text-slate-400">
            <span>⌘</span>K
          </kbd>
        </div>
      </div>

      {/* Right Area: Sun/Moon Toggle + Notifications + User Menu */}
      <div className="flex items-center gap-4">
        
        {/* Sun/Moon Toggle switch (Decorative, matches Dribbble Healthcare dashboard) */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setIsDarkMode(false)} 
            className={`p-1 rounded-lg transition ${!isDarkMode ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
          >
            <Sun className="h-3.5 w-3.5" />
          </button>
          <button 
            onClick={() => setIsDarkMode(true)} 
            className={`p-1 rounded-lg transition ${isDarkMode ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
          >
            <Moon className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Notification Bell */}
        <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl h-9 w-9">
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-red-500" />
        </Button>

        {/* User Dropdown */}
        <div className="relative">
          <Button 
            variant="ghost" 
            className="relative h-8 w-8 rounded-full border border-slate-200 shadow-sm p-0 overflow-hidden"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-indigo-50 text-indigo-600 font-bold text-xs">SA</AvatarFallback>
            </Avatar>
          </Button>

          {dropdownOpen && (
            <>
              {/* Overlay to close dropdown */}
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              
              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200/80 rounded-2xl shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-800">My Account</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">{role || 'superadmin'}</p>
                </div>
                <div className="p-1.5 space-y-0.5">
                  <button className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition text-left">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    Profile Settings
                  </button>
                  <button className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition text-left">
                    <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                    Billing & Plans
                  </button>
                  <button 
                    onClick={async () => {
                      setDropdownOpen(false)
                      await logout()
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-xl transition text-left font-bold"
                  >
                    <LogOut className="h-3.5 w-3.5 text-red-400" />
                    Log out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
