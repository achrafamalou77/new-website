'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, ChevronLeft, ChevronRight, Globe, Pin, PinOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { NAVIGATION_CONFIG } from '@/lib/navigation'
import { useSidebarStore } from '@/lib/stores/sidebar-store'
import { useLanguage } from '@/lib/contexts/LanguageContext'
import { canAccessPath, ROLE_LABELS, normalizeRole } from '@/lib/permissions'

// Maps the hardcoded English nav item names in navigation.ts to their translation keys
const NAV_KEY_MAP: Record<string, string> = {
  'Inbox': 'nav.inbox',
  'Autonomous Agent': 'nav.autonomousagent',
  'Leads Board': 'nav.leadsboard',
  'Clients': 'nav.clients',
  'Trips Catalog': 'nav.tripscatalog',
  'Bookings': 'nav.bookings',
  'Visa Services': 'nav.visaservices',
  'Invoices': 'nav.invoices',
  'Finance & Money': 'nav.financemoney',
  'Team Members': 'nav.teammembers',
  'Team': 'nav.teammembers',
  'Site Web Builder': 'nav.sitewebbuilder',
  'Chatbot Bot AI': 'nav.chatbotbotai',
  'Data Importer': 'nav.dataimporter',
  'Agency Settings': 'nav.agencysettings',
  'Subscription & Plan': 'nav.subscriptionplan',
  'Car Sales': 'nav.carsales',
  'Car Rental': 'nav.carrental',
  'Car Import': 'nav.carimport',
  'Customs & Finance': 'nav.customsfinance',
  'Chatbot Settings': 'nav.chatbotsettings',
  'Website Settings': 'nav.websitesettings',
  'Business Settings': 'nav.businesssettings',
  'Products': 'nav.products',
  'Store Analytics': 'nav.storeanalytics',
  'Store Customers': 'nav.storecustomers',
  'Orders': 'nav.orders',
  'Inventory': 'nav.inventory',
  'Shipping': 'nav.shipping',
  'Promotions': 'nav.promotions',
  'Storefront Builder': 'nav.storefrontbuilder',
  'Product Importer': 'nav.productimporter',
}

interface SidebarProps {
  role?: string
  businessTypeSlug?: string
  unreadInboxCount?: number
  clientsCount?: number
  unpaidInvoicesCount?: number
  pendingVisasCount?: number
  activeLeadsCount?: number
  salesCount?: number
  rentalCount?: number
  importCount?: number
  ordersCount?: number
  productsCount?: number
  lowStockCount?: number
}

export function Sidebar({
  role = 'superadmin',
  businessTypeSlug = 'travel',
  unreadInboxCount = 0,
  clientsCount = 0,
  unpaidInvoicesCount = 0,
  pendingVisasCount = 3,
  activeLeadsCount = 0,
  salesCount = 8,
  rentalCount = 4,
  importCount = 3,
  ordersCount = 12,
  productsCount = 48,
  lowStockCount = 6
}: SidebarProps) {
  const { t, dir } = useLanguage()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isRtl = mounted && dir === 'rtl'
  const pathname = usePathname()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { isOpen, setIsOpen, isPinned, togglePinned, isHovered, setIsHovered } = useSidebarStore()

  const isExpanded = isPinned ? (!isCollapsed || isHovered) : true

  // Resolve active vertical slug dynamically
  let activeBusinessTypeSlug = businessTypeSlug
  if (pathname.includes('/dashboard/management/') || pathname.includes('/dashboard/management')) {
    activeBusinessTypeSlug = 'car_showroom'
  } else if (pathname.includes('/dashboard/store')) {
    activeBusinessTypeSlug = 'ecommerce'
  } else if (pathname.includes('/dashboard/trips') || pathname.includes('/dashboard/visa') || pathname.includes('/dashboard/bookings') || pathname.includes('/dashboard/invoices')) {
    activeBusinessTypeSlug = 'travel'
  }

  const currentConfig = NAVIGATION_CONFIG[activeBusinessTypeSlug] || NAVIGATION_CONFIG.travel

  const getBadgeValue = (key?: string) => {
    if (!key) return 0
    switch (key) {
      case 'unreadInboxCount': return unreadInboxCount
      case 'clientsCount': return clientsCount
      case 'unpaidInvoicesCount': return unpaidInvoicesCount
      case 'pendingVisasCount': return pendingVisasCount
      case 'activeLeadsCount': return activeLeadsCount
      case 'salesCount': return salesCount
      case 'rentalCount': return rentalCount
      case 'importCount': return importCount
      case 'ordersCount': return ordersCount
      case 'productsCount': return productsCount
      case 'lowStockCount': return lowStockCount
      default: return 0
    }
  }

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey
      if (isCmdOrCtrl && e.key >= '1' && e.key <= '9') {
        const idx = parseInt(e.key, 10) - 1
        const flatItems = currentConfig.flatMap(g => g.items)
        const targetItem = flatItems[idx]
        if (targetItem) {
          e.preventDefault()
          router.push(targetItem.href)
          if (!isPinned) setIsOpen(false)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router, role, currentConfig, isPinned, setIsOpen])

  const getBranding = () => {
    switch (activeBusinessTypeSlug) {
      case 'car_showroom':
        return { name: 'Auto Showroom', sub: 'Car SaaS', color: '#dc2626', bg: '#fef2f2', initial: 'AS' }
      case 'real_estate':
        return { name: 'Real Estate', sub: 'Property SaaS', color: '#059669', bg: '#ecfdf5', initial: 'RE' }
      case 'ecommerce':
        return { name: 'ShopPro Elite', sub: 'E-Store SaaS', color: '#7c3aed', bg: '#f5f3ff', initial: 'SP' }
      default:
        return { name: 'Snipe.dz', sub: 'Travel SaaS', color: '#2563eb', bg: '#eff6ff', initial: 'SN' }
    }
  }

  const branding = getBranding()

  const sidebarClasses = cn(
    "h-screen select-none transition-[width,transform] duration-200 ease-in-out z-50 flex flex-col rtl:border-r-0 rtl:border-l",
    "bg-white border-r border-[#e8eaed]",
    isPinned
      ? cn(
          "fixed top-0 left-0 shadow-2xl lg:sticky lg:flex lg:shrink-0 lg:translate-x-0 lg:shadow-none rtl:left-auto rtl:right-0",
          isOpen ? "translate-x-0 w-[252px]" : "-translate-x-full w-0 overflow-hidden pointer-events-none lg:pointer-events-auto rtl:translate-x-full lg:rtl:translate-x-0",
          isExpanded ? "lg:w-[252px]" : "lg:w-[68px]"
        )
      : cn(
          "fixed top-0 left-0 shadow-2xl rtl:left-auto rtl:right-0",
          isOpen ? "translate-x-0 w-[252px]" : "-translate-x-full w-0 overflow-hidden pointer-events-none rtl:translate-x-full"
        )
  )

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className={cn(
            "fixed inset-0 bg-gray-900/30 backdrop-blur-[2px] z-30 transition-opacity duration-200 animate-fadeIn",
            isPinned && "lg:hidden"
          )}
        />
      )}

      <div
        onMouseEnter={() => { if (isPinned) setIsHovered(true) }}
        onMouseLeave={() => { if (isPinned) setIsHovered(false) }}
        className={sidebarClasses}
      >

        {/* Logo / Branding */}
        <div className={cn("px-4 pt-[18px] pb-4 border-b border-[#f0f1f3]", !isExpanded && "px-3 pb-3")}>
          <div className={cn("flex items-center gap-3", !isExpanded && "justify-center")}>
            <div
              className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] text-white font-bold text-[12px] shadow-sm transition-all duration-200"
              style={{ backgroundColor: branding.color }}
            >
              {branding.initial}
            </div>
            {isExpanded && (
              <div className="flex flex-col text-left rtl:text-right animate-fadeIn min-w-0">
                <span className="font-[750] text-gray-900 text-[13px] leading-tight truncate tracking-tight">
                  {branding.name}
                </span>
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-[0.06em] mt-[1px]">
                  {branding.sub}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 scrollbar-none">
          {currentConfig.map((group, groupIdx) => (
            <div key={groupIdx} className={cn("space-y-[2px]", groupIdx > 0 && "mt-4")}>
              {isExpanded && group.title ? (
                <div className="px-3 mb-1.5 mt-4 first:mt-1">
                  <span className="text-[10px] font-[750] text-gray-400 uppercase tracking-[0.14em] block select-none">
                    {mounted ? t(group.title, group.title) : group.title}
                  </span>
                </div>
              ) : (
                !isExpanded && groupIdx > 0 && (
                  <div className="px-2 mb-2.5 mt-1">
                    <div className="h-px bg-[#f0f1f3]" />
                  </div>
                )
              )}
              {group.items.map((item) => {
                if (!canAccessPath(role, item.href)) {
                  return null
                }

                const isActive = pathname.startsWith(item.href)
                const badgeVal = getBadgeValue(item.badgeKey)

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={!isExpanded ? item.name : undefined}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center justify-between px-2.5 py-[7px] rounded-[10px] text-[13px] font-medium transition-all duration-100 group",
                      isActive
                        ? "bg-[#111827] text-white"
                        : "text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827]",
                      !isExpanded && "justify-center px-2"
                    )}
                  >
                    <div className={cn("flex items-center gap-2.5", !isExpanded && "justify-center")}>
                      <item.icon
                        className={cn(
                          "h-[15px] w-[15px] shrink-0 transition-colors",
                          isActive ? "text-white" : "text-[#9ca3af] group-hover:text-[#374151]"
                        )}
                        strokeWidth={isActive ? 2.2 : 1.9}
                      />
                      {isExpanded && (
                        <span className="animate-fadeIn leading-none text-[12.5px]">
                          {mounted
                            ? t(NAV_KEY_MAP[item.name] || 'nav.' + item.name.toLowerCase().replace(/[^a-z]/g, ''), item.name)
                            : item.name
                          }
                        </span>
                      )}
                    </div>

                    {isExpanded && badgeVal > 0 && (
                      <Badge className={cn(
                        "text-[10px] h-[18px] min-w-[18px] px-1.5 rounded-full font-bold ml-auto border-0 shadow-none",
                        isActive
                          ? "bg-white/20 text-white"
                          : item.badgeColor
                      )}>
                        {item.showGlobe && <Globe className="h-2.5 w-2.5 shrink-0 mr-0.5" />}
                        {badgeVal}
                      </Badge>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}

          {/* Logout */}
          <div className="mt-3 pt-3 border-t border-[#f0f1f3]">
            <button
              title={!isExpanded ? (mounted ? t('nav.logout', 'Log Out') : 'Log Out') : undefined}
              onClick={() => {
                window.location.href = '/api/auth/logout'
              }}
              className={cn(
                "flex w-full items-center gap-2.5 px-2.5 py-[7px] text-[12.5px] text-[#6b7280] hover:bg-red-50 hover:text-red-600 font-medium rounded-[10px] transition-all duration-100 cursor-pointer group text-left rtl:text-right",
                !isExpanded && "justify-center px-2"
              )}
            >
              <LogOut className="h-[15px] w-[15px] text-[#9ca3af] group-hover:text-red-500 transition-colors shrink-0" strokeWidth={1.9} />
              {isExpanded && <span className="animate-fadeIn">{mounted ? t('nav.logout', 'Log Out') : 'Log Out'}</span>}
            </button>
          </div>
        </div>

        {/* User Profile */}
        <div className={cn("px-2.5 py-3 border-t border-[#f0f1f3]", !isExpanded && "flex justify-center px-2")}>
          <div className={cn(
            "flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] transition-colors duration-100 cursor-pointer group w-full",
            "hover:bg-[#f3f4f6]",
            !isExpanded && "w-auto p-2 hover:bg-[#f3f4f6]"
          )}>
            <div className="relative shrink-0">
              <div className="h-[30px] w-[30px] rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-blue-100">
                {normalizeRole(role).slice(0, 2).toUpperCase()}
              </div>
              <span className="absolute -bottom-[1px] -right-[1px] h-[8px] w-[8px] rounded-full bg-emerald-500 border-[1.5px] border-white" />
            </div>
            {isExpanded && (
              <div className="flex flex-col overflow-hidden text-left rtl:text-right min-w-0 animate-fadeIn">
                <span className="truncate text-[12px] font-semibold text-[#111827] leading-tight">
                  {ROLE_LABELS[normalizeRole(role)]}
                </span>
                <span className="text-[10px] text-[#9ca3af] capitalize leading-tight mt-[1px]">
                  {ROLE_LABELS[normalizeRole(role)]}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="px-2.5 pb-3 pt-2 border-t border-[#f0f1f3] flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            {isExpanded && (
              <span className="text-[10px] text-[#9ca3af] font-semibold tracking-wide uppercase px-1">
                {mounted ? t('sidebar.focusedMode', 'Focused Mode') : 'Focused Mode'}
              </span>
            )}
            <button
              onClick={togglePinned}
              className={cn(
                "h-6 w-6 rounded-lg transition-all flex items-center justify-center cursor-pointer text-xs",
                !isPinned
                  ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                  : "bg-transparent text-[#9ca3af] hover:text-[#6b7280] hover:bg-[#f3f4f6]",
                !isExpanded && "mx-auto"
              )}
              title={isPinned ? "Switch to Focused View" : "Pin Menu (Docked)"}
            >
              {isPinned ? <PinOff className="h-[11px] w-[11px]" /> : <Pin className="h-[11px] w-[11px]" />}
            </button>
          </div>

          {isPinned && (
            <div className="flex items-center justify-between">
              {isExpanded && (
                <span className="text-[10px] text-[#9ca3af] font-semibold uppercase tracking-wide px-1">
                  {mounted ? t('sidebar.minimize', 'Minimize') : 'Minimize'}
                </span>
              )}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={cn(
                  "h-6 w-6 rounded-lg hover:bg-[#f3f4f6] text-[#9ca3af] hover:text-[#6b7280] transition flex items-center justify-center cursor-pointer",
                  !isExpanded && "mx-auto"
                )}
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isCollapsed
                  ? (isRtl ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />)
                  : (isRtl ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />)
                }
              </button>
            </div>
          )}
        </div>

      </div>
    </>
  )
}
