// src/lib/navigation.ts
import { 
  Inbox, Flame, Users, Car, Users2, Bot, Globe, Settings,
  Compass, ClipboardList, FileText, Landmark, HeartHandshake, Calendar, Sparkles, CreditCard, UploadCloud,
  ShoppingBag, Package, Boxes, Truck, ReceiptText, Tags, BarChart3, UserRoundSearch, Palette, Megaphone
} from 'lucide-react'

export interface NavigationItem {
  name: string
  href: string
  icon: any
  badgeKey?: 'unreadInboxCount' | 'clientsCount' | 'unpaidInvoicesCount' | 'pendingVisasCount' | 'activeLeadsCount' | 'testDrivesCount' | 'financingCount' | 'salesCount' | 'rentalCount' | 'importCount' | 'ordersCount' | 'productsCount' | 'lowStockCount'
  badgeColor?: string
  showGlobe?: boolean
}

export interface NavigationGroup {
  title?: string
  items: NavigationItem[]
}

export const NAVIGATION_CONFIG: Record<string, NavigationGroup[]> = {
  travel: [
    {
      title: 'nav.category.workspace',
      items: [
        { name: 'Inbox', href: '/dashboard/inbox', icon: Inbox, badgeKey: 'unreadInboxCount', badgeColor: 'bg-blue-500 text-white hover:bg-blue-500' },
        { name: 'Autonomous Agent', href: '/dashboard/agent', icon: Sparkles },
        { name: 'Leads Board', href: '/dashboard/leads', icon: HeartHandshake },
        { name: 'Clients', href: '/dashboard/clients', icon: Users, badgeKey: 'clientsCount', badgeColor: 'bg-amber-500 text-white hover:bg-amber-500' },
      ]
    },
    {
      title: 'nav.category.travel_management',
      items: [
        { name: 'Trips Catalog', href: '/dashboard/trips', icon: Compass },
        { name: 'Bookings', href: '/dashboard/bookings', icon: ClipboardList },
        { name: 'Visa Services', href: '/dashboard/visa', icon: FileText, badgeKey: 'pendingVisasCount', badgeColor: 'bg-amber-500 text-white hover:bg-amber-500 font-semibold flex items-center gap-1', showGlobe: true },
        { name: 'Invoices', href: '/dashboard/invoices', icon: FileText, badgeKey: 'unpaidInvoicesCount', badgeColor: 'bg-red-500 text-white hover:bg-red-500 animate-pulse' },
      ]
    },
    {
      title: 'nav.category.channels',
      items: [
        { name: 'Site Web Builder', href: '/dashboard/settings/website', icon: Globe },
        { name: 'Chatbot Bot AI', href: '/dashboard/settings/chatbot', icon: Bot },
        { name: 'Data Importer', href: '/dashboard/onboarding', icon: UploadCloud },
        { name: 'AI Ads Studio', href: '/dashboard/ads', icon: Megaphone },
      ]
    },
    {
      title: 'nav.category.administration',
      items: [
        { name: 'Finance & Money', href: '/dashboard/finance', icon: Landmark },
        { name: 'Team Members', href: '/dashboard/team', icon: Users2 },
        { name: 'Agency Settings', href: '/dashboard/settings/agency', icon: Settings },
        { name: 'Subscription & Plan', href: '/dashboard/settings/subscription', icon: CreditCard },
      ]
    }
  ],
  car_showroom: [
    {
      title: 'nav.category.workspace',
      items: [
        { name: 'Inbox', href: '/dashboard/inbox', icon: Inbox, badgeKey: 'unreadInboxCount', badgeColor: 'bg-blue-500 text-white hover:bg-blue-500' },
        { name: 'Autonomous Agent', href: '/dashboard/agent', icon: Sparkles },
        { name: 'Leads Board', href: '/dashboard/leads', icon: Flame, badgeKey: 'activeLeadsCount', badgeColor: 'bg-red-500 text-white hover:bg-red-500 animate-pulse' },
        { name: 'Clients', href: '/dashboard/clients', icon: Users, badgeKey: 'clientsCount', badgeColor: 'bg-amber-500 text-white hover:bg-amber-500' },
      ]
    },
    {
      title: 'nav.category.showroom_management',
      items: [
        { name: 'Car Sales', href: '/dashboard/management/sales', icon: Car, badgeKey: 'salesCount', badgeColor: 'bg-red-500 text-white' },
        { name: 'Car Rental', href: '/dashboard/management/rental', icon: Calendar, badgeKey: 'rentalCount', badgeColor: 'bg-blue-500 text-white' },
        { name: 'Car Import', href: '/dashboard/management/import', icon: Globe, badgeKey: 'importCount', badgeColor: 'bg-indigo-500 text-white' },
      ]
    },
    {
      title: 'nav.category.channels',
      items: [
        { name: 'Website Settings', href: '/dashboard/settings/website', icon: Globe },
        { name: 'Chatbot Settings', href: '/dashboard/settings/chatbot', icon: Bot },
        { name: 'Data Importer', href: '/dashboard/onboarding', icon: UploadCloud },
        { name: 'AI Ads Studio', href: '/dashboard/ads', icon: Megaphone },
      ]
    },
    {
      title: 'nav.category.administration',
      items: [
        { name: 'Customs & Finance', href: '/dashboard/finance', icon: Landmark },
        { name: 'Team', href: '/dashboard/team', icon: Users2 },
        { name: 'Business Settings', href: '/dashboard/settings/agency', icon: Settings },
        { name: 'Subscription & Plan', href: '/dashboard/settings/subscription', icon: CreditCard },
      ]
    }
  ],
  ecommerce: [
    {
      title: 'nav.category.workspace',
      items: [
        { name: 'Inbox', href: '/dashboard/inbox', icon: Inbox, badgeKey: 'unreadInboxCount', badgeColor: 'bg-blue-500 text-white hover:bg-blue-500' },
        { name: 'Autonomous Agent', href: '/dashboard/agent', icon: Sparkles },
        { name: 'Leads Board', href: '/dashboard/leads', icon: HeartHandshake, badgeKey: 'activeLeadsCount', badgeColor: 'bg-purple-500 text-white hover:bg-purple-500' },
        { name: 'Clients', href: '/dashboard/clients', icon: Users, badgeKey: 'clientsCount', badgeColor: 'bg-amber-500 text-white hover:bg-amber-500' },
      ]
    },
    {
      title: 'nav.category.store_management',
      items: [
        { name: 'Store Analytics', href: '/dashboard/store/analytics', icon: BarChart3 },
        { name: 'Store Customers', href: '/dashboard/store/customers', icon: UserRoundSearch },
        { name: 'Products', href: '/dashboard/store/products', icon: ShoppingBag, badgeKey: 'productsCount', badgeColor: 'bg-purple-600 text-white' },
        { name: 'Orders', href: '/dashboard/store/orders', icon: ReceiptText, badgeKey: 'ordersCount', badgeColor: 'bg-emerald-500 text-white animate-pulse' },
        { name: 'Inventory', href: '/dashboard/store/inventory', icon: Boxes, badgeKey: 'lowStockCount', badgeColor: 'bg-red-500 text-white' },
        { name: 'Shipping', href: '/dashboard/store/shipping', icon: Truck },
        { name: 'Promotions', href: '/dashboard/store/promotions', icon: Tags },
      ]
    },
    {
      title: 'nav.category.channels',
      items: [
        { name: 'Storefront Builder', href: '/dashboard/store/storefront', icon: Globe },
        { name: 'Store Appearance', href: '/dashboard/store/appearance', icon: Palette },
        { name: 'Chatbot Settings', href: '/dashboard/settings/chatbot', icon: Bot },
        { name: 'Product Importer', href: '/dashboard/onboarding', icon: Package },
        { name: 'AI Ads Studio', href: '/dashboard/ads', icon: Megaphone },
      ]
    },
    {
      title: 'nav.category.administration',
      items: [
        { name: 'Finance & Money', href: '/dashboard/finance', icon: Landmark },
        { name: 'Team', href: '/dashboard/team', icon: Users2 },
        { name: 'Business Settings', href: '/dashboard/settings/agency', icon: Settings },
        { name: 'Subscription & Plan', href: '/dashboard/settings/subscription', icon: CreditCard },
      ]
    }
  ]
}
