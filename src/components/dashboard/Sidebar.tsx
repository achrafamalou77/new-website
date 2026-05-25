'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, ChevronLeft, ChevronRight, MessageSquare, Flame, Users, Car, Users2, Bot, Globe, Settings, Pin, PinOff, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { NAVIGATION_CONFIG } from '@/lib/navigation'
import { useSidebarStore } from '@/lib/stores/sidebar-store'

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
  importCount = 3
}: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { isOpen, setIsOpen, isPinned, togglePinned, isHovered, setIsHovered } = useSidebarStore()

  // Hover-expand logic: Expanded if not collapsed OR if hovered (only in pinned mode)
  const isExpanded = isPinned ? (!isCollapsed || isHovered) : true

  // Resolve active vertical slug dynamically based on pathname to prevent mixing contexts in showcase/demo mode
  let activeBusinessTypeSlug = businessTypeSlug
  if (pathname.includes('/dashboard/management/') || pathname.includes('/dashboard/management')) {
    activeBusinessTypeSlug = 'car_showroom'
  } else if (pathname.includes('/dashboard/trips') || pathname.includes('/dashboard/visa') || pathname.includes('/dashboard/bookings') || pathname.includes('/dashboard/invoices')) {
    activeBusinessTypeSlug = 'travel'
  }

  const currentConfig = NAVIGATION_CONFIG[activeBusinessTypeSlug] || NAVIGATION_CONFIG.travel

  // Map keys to prop values
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
      default: return 0
    }
  }

  // Keyboard Shortcuts (Cmd+1 for Inbox, etc.)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey
      if (isCmdOrCtrl && e.key >= '1' && e.key <= '9') {
        const idx = parseInt(e.key, 10) - 1
        
        // Flatten items to match index
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

  // Dynamic naming based on business vertical
  const getBranding = () => {
    switch (activeBusinessTypeSlug) {
      case 'car_showroom':
        return { name: 'Auto Showroom', sub: 'SaaS Showroom', bg: 'from-red-600 to-red-400', initial: 'AS' }
      case 'real_estate':
        return { name: 'Real Estate', sub: 'SaaS Agency', bg: 'from-emerald-600 to-emerald-400', initial: 'RE' }
      case 'ecommerce':
        return { name: 'ShopPro Elite', sub: 'SaaS E-store', bg: 'from-purple-600 to-purple-400', initial: 'SP' }
      default:
        return { name: 'Travel Agency', sub: 'SaaS Platform', bg: 'from-blue-600 to-blue-400', initial: 'TA' }
    }
  }

  const branding = getBranding()

  // Build responsive, dynamic wrapper classes
  const sidebarClasses = cn(
    "h-screen select-none transition-[width,transform,opacity] duration-200 cubic-bezier(0.16, 1, 0.3, 1) z-40 border-r border-slate-200/80 bg-white flex flex-col justify-between shadow-xs",
    isPinned 
      ? cn(
          "hidden lg:flex shrink-0 sticky top-0",
          isExpanded ? "w-[280px]" : "w-[80px]"
        )
      : cn(
          "fixed top-0 left-0 bg-white/75 backdrop-blur-md border-r border-white/20 shadow-2xl",
          isOpen ? "translate-x-0 w-[280px]" : "-translate-x-full w-0 overflow-hidden pointer-events-none"
        )
  )

  return (
    <>
      {/* Backdrop overlay for Focused (unpinned) drawer view */}
      {(!isPinned && isOpen) && (
        <div 
          onClick={() => setIsOpen(false)} 
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-30 transition-all duration-300 animate-fadeIn"
        />
      )}

      <div 
        onMouseEnter={() => { if (isPinned) setIsHovered(true) }}
        onMouseLeave={() => { if (isPinned) setIsHovered(false) }}
        className={sidebarClasses}
      >
        
        {/* Top Header Logo */}
        <div className="flex flex-col px-5 pt-6 pb-4">
          <div className={cn("flex items-center gap-3", !isExpanded && "justify-center")}>
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white font-bold shadow-md bg-gradient-to-tr", branding.bg)}>
              {branding.initial}
            </div>
            {isExpanded && (
              <div className="flex flex-col text-left animate-fadeIn">
                <span className="font-semibold text-slate-800 tracking-tight leading-tight">
                  {branding.name}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">{branding.sub}</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
          {currentConfig.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              {groupIdx > 0 && <div className="h-4" />}
              <div className="space-y-1">
                {group.items.map((item, itemIdx) => {
                  // Hide Team and Settings for employee
                  if (role === 'employee' && (item.name.includes('Team') || item.name.includes('Settings') || item.name.includes('Config') || item.name.includes('AI') || item.name.includes('Business'))) {
                    return null
                  }

                  // Check active state
                  const isActive = pathname.startsWith(item.href)
                  const shortcutIndex = groupIdx === 0 ? itemIdx + 1 : null
                  const badgeVal = getBadgeValue(item.badgeKey)

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      title={!isExpanded ? item.name : undefined}
                      onClick={() => {
                        if (!isPinned) setIsOpen(false)
                      }}
                      className={cn(
                        "flex items-center justify-between py-2.5 transition-all duration-200 group font-medium text-[13px] relative",
                        isActive 
                          ? "border-l-[3px] border-blue-600 bg-blue-50/50 text-blue-600 rounded-none pl-[9px] pr-3" 
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-700 rounded-xl pl-3 pr-3",
                        !isExpanded && "justify-center pl-0 pr-0"
                      )}
                    >
                      <div className={cn("flex items-center gap-3", !isExpanded && "justify-center")}>
                        <item.icon 
                          className={cn(
                            "h-[22px] w-[22px] shrink-0 transition-transform duration-200 group-hover:scale-105", 
                            isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                          )}
                          strokeWidth={2.5}
                        />
                        {isExpanded && <span className="animate-fadeIn">{item.name}</span>}
                      </div>

                      {isExpanded && (
                        <div className="flex items-center gap-1.5 ml-auto">
                          {/* Keyboard shortcut display */}
                          {shortcutIndex !== null && shortcutIndex <= 9 && (
                            <kbd className="hidden group-hover:inline-flex items-center text-[9px] text-slate-400 bg-slate-100 border border-slate-200 px-1 py-0.2 rounded font-mono select-none scale-90">
                              ⌘{shortcutIndex}
                            </kbd>
                          )}

                          {/* Badges */}
                          {badgeVal > 0 && (
                            <Badge className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full transition shadow-xs font-bold flex items-center gap-1",
                              item.badgeColor
                            )}>
                              {item.showGlobe && <Globe className="h-2.5 w-2.5 shrink-0" />}
                              {badgeVal}
                            </Badge>
                          )}
                        </div>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}

          {/* General Divider & Logout */}
          <div className="h-4" />
          <div className="space-y-1">
            <button 
              title={!isExpanded ? "Log Out" : undefined}
              onClick={async () => {
                const { logout } = await import('@/app/actions/auth')
                await logout()
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] text-slate-500 hover:bg-red-50 hover:text-red-600 font-medium transition text-left group cursor-pointer",
                !isExpanded && "justify-center px-0"
              )}
            >
              <LogOut 
                className="h-[22px] w-[22px] text-slate-400 group-hover:text-red-500 transition-colors shrink-0" 
                strokeWidth={2.5}
              />
              {isExpanded && <span className="animate-fadeIn">Log Out</span>}
            </button>
          </div>
        </div>

        {/* Bottom User Profile Section */}
        <div className={cn("p-4 border-t border-slate-100 bg-slate-50/50", !isExpanded && "flex justify-center")}>
          <div className={cn("flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200/40 shadow-xs w-full", !isExpanded && "p-1.5 border-0 bg-transparent shadow-none w-auto justify-center")}>
            <div className="relative shrink-0">
              <Avatar className={cn("h-10 w-10 border border-blue-100 shadow-xs shrink-0")}>
                <AvatarFallback className="bg-blue-50/80 text-blue-600 font-bold text-sm">
                  {role === 'employee' ? 'AB' : 'AA'}
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-400/20" />
            </div>
            {isExpanded && (
              <div className="flex flex-col overflow-hidden text-left min-w-0 animate-fadeIn">
                <span className="truncate text-xs font-bold text-slate-700 leading-tight">
                  {role === 'employee' ? 'Amine Belkadi' : 'Achraf Amalou'}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold capitalize mt-0.5 leading-none">
                  {role === 'employee' ? 'Sales Agent' : 'Superadmin'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Toggle Bar (Focused vs Docked, and Collapse trigger) */}
        <div className="p-4 border-t border-slate-100 flex flex-col gap-2 shrink-0 bg-white">
          
          {/* Focused View Pin Switch */}
          <div className="flex items-center justify-between">
            {isExpanded && (
              <span className="text-[11px] text-slate-400 font-semibold tracking-tight uppercase">Focused Mode</span>
            )}
            <button 
              onClick={togglePinned}
              className={cn(
                "h-8 w-8 rounded-lg transition-all flex items-center justify-center active:scale-95 cursor-pointer border",
                !isPinned 
                  ? "bg-indigo-50 border-indigo-100/50 text-indigo-600" 
                  : "bg-transparent border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50",
                !isExpanded && "mx-auto"
              )}
              title={isPinned ? "Switch to Focused Fullscreen View" : "Pin Menu (Docked View)"}
            >
              {isPinned ? (
                <PinOff className="h-3.5 w-3.5 stroke-[2.5]" />
              ) : (
                <Pin className="h-3.5 w-3.5 stroke-[2.5]" />
              )}
            </button>
          </div>

          {/* Traditional Expand/Collapse Arrow (Only shown when Docked/Pinned) */}
          {isPinned && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100/60 transition-all">
              {isExpanded && (
                <span className="text-[11px] text-slate-400 font-semibold uppercase">Minimize</span>
              )}
              <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={cn(
                  "h-8 w-8 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition flex items-center justify-center active:scale-95 cursor-pointer",
                  !isExpanded && "mx-auto"
                )}
                title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
              >
                {isCollapsed ? <ChevronRight className="h-4 w-4 stroke-[2.5]" /> : <ChevronLeft className="h-4 w-4 stroke-[2.5]" />}
              </button>
            </div>
          )}
        </div>

      </div>
    </>
  )
}
