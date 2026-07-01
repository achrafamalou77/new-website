'use client'

import { useEffect, useState } from 'react'
import { Bell, Menu, Search, ChevronRight, ChevronLeft, User, LogOut, CreditCard, Sun, Moon } from 'lucide-react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useSidebarStore } from '@/lib/stores/sidebar-store'
import { useLanguage } from '@/lib/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/dashboard/LanguageSwitcher'

export function Header({ role }: { role?: string }) {
  const pathname = usePathname()
  const { t, dir } = useLanguage()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isRtl = mounted && dir === 'rtl'
  const ChevronIcon = isRtl ? ChevronLeft : ChevronRight
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const { isPinned, toggleOpen } = useSidebarStore()

  const translate = (key: string, fallback: string) => {
    return mounted ? t(key, fallback) : fallback
  }

  const runSearch = (value: FormDataEntryValue | string | null) => {
    const q = value?.toString().trim()
    if (q) window.location.href = `/dashboard/clients?search=${encodeURIComponent(q)}`
  }

  useEffect(() => {
    const savedTheme = localStorage.getItem('dashboard-theme')
    const shouldUseDark = savedTheme === 'dark'
    setIsDarkMode(shouldUseDark)
    document.documentElement.classList.toggle('dark', shouldUseDark)
  }, [])

  const updateTheme = (nextIsDark: boolean) => {
    setIsDarkMode(nextIsDark)
    localStorage.setItem('dashboard-theme', nextIsDark ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', nextIsDark)
  }

  const getPageTitle = () => {
    if (pathname.includes('/ads')) return { title: translate('nav.aiadsstudio', 'AI Ads Studio'), category: translate('nav.channels', 'Channels') }
    if (pathname.includes('/settings/website')) return { title: translate('nav.websitesettings', 'Website Settings'), category: translate('nav.settings', 'Settings') }
    if (pathname.includes('/settings/chatbot')) return { title: translate('nav.chatbotsettings', 'Chatbot Settings'), category: translate('nav.settings', 'Settings') }
    if (pathname.includes('/settings/agency')) return { title: translate('nav.agencysettings', 'Agency Settings'), category: translate('nav.settings', 'Settings') }
    if (pathname.includes('/inbox')) return { title: translate('nav.inbox', 'Inbox'), category: translate('nav.conversations', 'Conversations') }
    if (pathname.includes('/trips')) return { title: translate('nav.tripscatalog', 'Trips'), category: translate('nav.inventory', 'Inventory') }
    if (pathname.includes('/bookings')) return { title: translate('nav.bookings', 'Bookings'), category: translate('nav.management', 'Management') }
    if (pathname.includes('/team')) return { title: translate('nav.teammembers', 'Team Members'), category: translate('nav.organization', 'Organization') }
    if (pathname.includes('/management/sales')) return { title: translate('nav.carsales', 'Car Sales'), category: translate('nav.management', 'Management') }
    if (pathname.includes('/management/rental')) return { title: translate('nav.carrental', 'Car Rental'), category: translate('nav.management', 'Management') }
    if (pathname.includes('/management/import')) return { title: translate('nav.carimport', 'Car Import'), category: translate('nav.management', 'Management') }
    if (pathname.includes('/finance')) return { title: translate('nav.customsfinance', 'Finance'), category: translate('nav.management', 'Management') }
    if (pathname.includes('/leads')) return { title: translate('nav.leadsboard', 'Leads Board'), category: translate('nav.management', 'Management') }
    if (pathname.includes('/clients')) return { title: translate('nav.clients', 'Clients'), category: translate('nav.management', 'Management') }
    if (pathname.includes('/visa')) return { title: translate('nav.visaservices', 'Visa Services'), category: translate('nav.management', 'Management') }
    if (pathname.includes('/invoices')) return { title: translate('nav.invoices', 'Invoices'), category: translate('nav.management', 'Management') }
    return { title: translate('nav.overview', 'Overview'), category: translate('header.breadcrumb', 'Dashboard') }
  }

  const { title, category } = getPageTitle()

  return (
    <header className="flex h-[54px] shrink-0 items-center justify-between bg-white border-b border-[#e8eaed] px-4 relative z-20">

      {/* Left: Mobile Menu + Breadcrumb */}
      <div className="flex items-center gap-3">
        {!isPinned ? (
          <button
            className="flex h-8 w-8 rounded-[9px] border border-[#e5e7eb] bg-white items-center justify-center text-gray-500 hover:bg-[#f3f4f6] hover:text-gray-700 transition-all cursor-pointer"
            onClick={toggleOpen}
            title="Open Navigation Menu"
          >
            <Menu className="h-[15px] w-[15px]" strokeWidth={2} />
          </button>
        ) : (
          <button className="lg:hidden cursor-pointer h-8 w-8 flex items-center justify-center rounded-[9px] border border-[#e5e7eb] hover:bg-[#f3f4f6]" onClick={toggleOpen}>
            <Menu className="h-[15px] w-[15px] text-gray-600" />
          </button>
        )}

        <div className="hidden sm:flex items-center gap-1 text-[11.5px] font-medium text-gray-400">
          <span className="hover:text-gray-600 cursor-pointer transition-colors">{translate('header.breadcrumb', 'Dashboard')}</span>
          <ChevronIcon className="h-[11px] w-[11px] text-gray-300" />
          <span className="hover:text-gray-600 cursor-pointer transition-colors">{category}</span>
          <ChevronIcon className="h-[11px] w-[11px] text-gray-300" />
          <span className="text-gray-800 font-semibold">{title}</span>
        </div>
      </div>

      {/* Center: Search */}
      <div className="hidden md:flex items-center max-w-[280px] w-full mx-4">
        <form
          className="relative w-full"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            runSearch(fd.get('q'))
          }}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[13px] w-[13px] text-gray-400 rtl:left-auto rtl:right-3" />
          <input
            type="text"
            name="q"
            placeholder={translate('header.search', 'Search clients, trips...')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                runSearch(e.currentTarget.value)
              }
            }}
            className="w-full pl-[30px] pr-10 py-1.5 text-[12.5px] font-medium bg-[#f4f5f7] border border-transparent rounded-full focus:bg-white focus:border-[#d1d5db] focus:ring-0 focus:outline-none transition-all h-8 text-gray-700 placeholder:text-gray-400 rtl:pl-10 rtl:pr-[30px]"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 rtl:right-auto rtl:left-2.5">
            <kbd className="inline-flex h-[18px] select-none items-center gap-[2px] rounded-[5px] border border-gray-200 bg-white px-1.5 font-mono text-[9px] font-bold text-gray-400 shadow-sm">
              ⌘K
            </kbd>
          </div>
        </form>
      </div>

      {/* Right: Language + Theme + Notifications + User */}
      <div className="flex items-center gap-1">

        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Theme Toggle */}
        <div className="flex items-center bg-[#f3f4f6] p-[3px] rounded-[8px] ml-0.5">
          <button
            onClick={() => updateTheme(false)}
            title="Light mode"
            className={`p-1.5 rounded-[6px] transition-all duration-150 cursor-pointer ${!isDarkMode ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Sun className="h-[13px] w-[13px]" />
          </button>
          <button
            onClick={() => updateTheme(true)}
            title="Dark mode"
            className={`p-1.5 rounded-[6px] transition-all duration-150 cursor-pointer ${isDarkMode ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Moon className="h-[13px] w-[13px]" />
          </button>
        </div>

        {/* Notification Bell */}
        <div className="relative ml-0.5">
          <button
            className="relative h-8 w-8 flex items-center justify-center rounded-[9px] text-gray-500 hover:text-gray-700 hover:bg-[#f3f4f6] transition-all cursor-pointer"
            onClick={() => setNotificationsOpen(prev => !prev)}
            aria-expanded={notificationsOpen}
            aria-label={translate('notifications.open', 'Open notifications')}
          >
            <Bell className="h-[15px] w-[15px]" strokeWidth={1.9} />
            <span className="absolute right-[8px] top-[8px] flex h-[6px] w-[6px] rounded-full bg-red-500">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60" />
            </span>
          </button>

          {notificationsOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
              <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.10),0_2px_8px_rgba(0,0,0,0.06)] z-50 rtl:right-auto rtl:left-0">
                <div className="flex items-center justify-between border-b border-[#f0f1f3] px-4 py-3">
                  <div>
                    <p className="text-[13px] font-bold text-gray-900">{translate('notifications.title', 'Notifications')}</p>
                    <p className="text-[11px] font-medium text-gray-400">{translate('notifications.subtitle', 'Latest platform updates')}</p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">3</span>
                </div>

                <div className="max-h-80 overflow-y-auto p-2">
                  {[
                    { title: translate('notifications.importReady', 'Importer is ready'), body: translate('notifications.importReadyBody', 'AI importer can now analyze files from the dashboard.'), tone: 'bg-blue-500' },
                    { title: translate('notifications.adsDraft', 'Ads Studio draft mode'), body: translate('notifications.adsDraftBody', 'Campaigns stay paused until you review and send them.'), tone: 'bg-violet-500' },
                    { title: translate('notifications.security', 'Security check passed'), body: translate('notifications.securityBody', 'Tenant isolation and dashboard access are protected.'), tone: 'bg-emerald-500' },
                  ].map((item) => (
                    <div key={item.title} className="flex gap-3 rounded-xl px-3 py-3 hover:bg-[#f7f8fa]">
                      <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.tone}`} />
                      <div>
                        <p className="text-[12.5px] font-bold text-gray-900">{item.title}</p>
                        <p className="mt-0.5 text-[11.5px] font-medium leading-5 text-gray-500">{item.body}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setNotificationsOpen(false)}
                  className="w-full border-t border-[#f0f1f3] px-4 py-2.5 text-[12px] font-bold text-blue-600 hover:bg-blue-50"
                >
                  {translate('notifications.markRead', 'Mark all as read')}
                </button>
              </div>
            </>
          )}
        </div>

        {/* User Dropdown */}
        <div className="relative ml-0.5">
          <button
            className="relative h-8 w-8 rounded-full overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-200 transition-all flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 text-white text-[11px] font-bold shadow-sm"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            SA
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 mt-2 w-52 bg-white border border-[#e5e7eb] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.10),0_2px_8px_rgba(0,0,0,0.06)] py-2 z-50 animate-scaleIn rtl:right-auto rtl:left-0 overflow-hidden">
                <div className="px-3.5 py-2.5 border-b border-[#f0f1f3] mb-1">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      SA
                    </div>
                    <div>
                      <p className="text-[12.5px] font-semibold text-gray-900 leading-tight">Achraf Amalou</p>
                      <p className="text-[10.5px] text-gray-400 font-medium mt-[1px] capitalize">{role || 'superadmin'}</p>
                    </div>
                  </div>
                </div>
                <div className="px-1.5 pb-1">
                  <Link
                    href="/dashboard/settings/agency"
                    onClick={() => setDropdownOpen(false)}
                    className="flex w-full items-center gap-2.5 px-2.5 py-2 text-[12.5px] font-medium text-gray-600 hover:bg-[#f3f4f6] hover:text-gray-900 rounded-[10px] transition-all text-left rtl:text-right"
                  >
                    <User className="h-[13px] w-[13px] text-gray-400" />
                    {translate('nav.profile', 'Profile Settings')}
                  </Link>
                  <Link
                    href="/admin/plans"
                    onClick={() => setDropdownOpen(false)}
                    className="flex w-full items-center gap-2.5 px-2.5 py-2 text-[12.5px] font-medium text-gray-600 hover:bg-[#f3f4f6] hover:text-gray-900 rounded-[10px] transition-all text-left rtl:text-right"
                  >
                    <CreditCard className="h-[13px] w-[13px] text-gray-400" />
                    {translate('nav.billing', 'Billing & Plans')}
                  </Link>
                  <div className="h-px bg-[#f0f1f3] my-1.5 mx-1" />
                  <button
                    onClick={() => {
                      setDropdownOpen(false)
                      window.location.href = '/api/auth/logout'
                    }}
                    className="flex w-full items-center gap-2.5 px-2.5 py-2 text-[12.5px] font-medium text-red-600 hover:bg-red-50 rounded-[10px] transition-all text-left rtl:text-right cursor-pointer"
                  >
                    <LogOut className="h-[13px] w-[13px] text-red-400" />
                    {translate('nav.logout', 'Log out')}
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
