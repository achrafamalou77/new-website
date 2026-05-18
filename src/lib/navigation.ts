// src/lib/navigation.ts
import { 
  Inbox, Flame, Users, Car, Users2, Bot, Globe, Settings,
  Compass, ClipboardList, FileText, Landmark, HeartHandshake, Calendar
} from 'lucide-react'

export interface NavigationItem {
  name: string
  href: string
  icon: any
  badgeKey?: 'unreadInboxCount' | 'clientsCount' | 'unpaidInvoicesCount' | 'pendingVisasCount' | 'activeLeadsCount' | 'testDrivesCount' | 'financingCount' | 'salesCount' | 'rentalCount' | 'importCount'
  badgeColor?: string
  showGlobe?: boolean
}

export interface NavigationGroup {
  items: NavigationItem[]
}

export const NAVIGATION_CONFIG: Record<string, NavigationGroup[]> = {
  travel: [
    {
      items: [
        { name: 'Inbox', href: '/dashboard/inbox', icon: Inbox, badgeKey: 'unreadInboxCount', badgeColor: 'bg-blue-500 text-white hover:bg-blue-500' },
        { name: 'Leads Board', href: '/dashboard/leads', icon: HeartHandshake },
        { name: 'Clients', href: '/dashboard/clients', icon: Users, badgeKey: 'clientsCount', badgeColor: 'bg-amber-500 text-white hover:bg-amber-500' },
        { name: 'Trips Catalog', href: '/dashboard/trips', icon: Compass },
        { name: 'Bookings', href: '/dashboard/bookings', icon: ClipboardList },
        { name: 'Visa Services', href: '/dashboard/visa', icon: FileText, badgeKey: 'pendingVisasCount', badgeColor: 'bg-amber-500 text-white hover:bg-amber-500 font-semibold flex items-center gap-1', showGlobe: true },
        { name: 'Invoices', href: '/dashboard/invoices', icon: FileText, badgeKey: 'unpaidInvoicesCount', badgeColor: 'bg-red-500 text-white hover:bg-red-500 animate-pulse' },
        { name: 'Finance & Money', href: '/dashboard/finance', icon: Landmark },
        { name: 'Team Members', href: '/dashboard/team', icon: Users2 },
      ]
    },
    {
      items: [
        { name: 'Website Config', href: '/dashboard/settings/website', icon: Globe },
        { name: 'Chatbot Bot AI', href: '/dashboard/settings/chatbot', icon: Bot },
        { name: 'Agency Settings', href: '/dashboard/settings/agency', icon: Settings },
      ]
    }
  ],
  car_showroom: [
    {
      items: [
        { name: 'Inbox', href: '/dashboard/inbox', icon: Inbox, badgeKey: 'unreadInboxCount', badgeColor: 'bg-blue-500 text-white hover:bg-blue-500' },
        { name: 'Leads Board', href: '/dashboard/leads', icon: Flame, badgeKey: 'activeLeadsCount', badgeColor: 'bg-red-500 text-white hover:bg-red-500 animate-pulse' },
        { name: 'Clients', href: '/dashboard/clients', icon: Users, badgeKey: 'clientsCount', badgeColor: 'bg-amber-500 text-white hover:bg-amber-500' },
        { name: 'Car Sales', href: '/dashboard/management/sales', icon: Car, badgeKey: 'salesCount', badgeColor: 'bg-red-500 text-white' },
        { name: 'Car Rental', href: '/dashboard/management/rental', icon: Calendar, badgeKey: 'rentalCount', badgeColor: 'bg-blue-500 text-white' },
        { name: 'Car Import', href: '/dashboard/management/import', icon: Globe, badgeKey: 'importCount', badgeColor: 'bg-indigo-500 text-white' },
        { name: 'Team', href: '/dashboard/team', icon: Users2 },
      ]
    },
    {
      items: [
        { name: 'Chatbot Settings', href: '/dashboard/settings/chatbot', icon: Bot },
        { name: 'Website Settings', href: '/dashboard/settings/website', icon: Globe },
        { name: 'Business Settings', href: '/dashboard/settings/agency', icon: Settings },
      ]
    }
  ]
}
