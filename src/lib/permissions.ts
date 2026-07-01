export type AppRole = 'owner' | 'superadmin' | 'manager' | 'sales' | 'support' | 'employee'

export type PermissionKey =
  | 'dashboard:view'
  | 'inbox:manage'
  | 'clients:manage'
  | 'leads:manage'
  | 'catalog:manage'
  | 'bookings:manage'
  | 'invoices:manage'
  | 'team:manage'
  | 'hr:manage'
  | 'finance:manage'
  | 'settings:manage'
  | 'billing:manage'
  | 'ai:manage'
  | 'ads:manage'
  | 'importer:manage'

export const ROLE_LABELS: Record<AppRole, string> = {
  owner: 'Owner',
  superadmin: 'Owner',
  manager: 'Manager',
  sales: 'Sales',
  support: 'Support',
  employee: 'Restricted Employee',
}

export const ROLE_PERMISSIONS: Record<AppRole, PermissionKey[]> = {
  owner: [
    'dashboard:view', 'inbox:manage', 'clients:manage', 'leads:manage', 'catalog:manage',
    'bookings:manage', 'invoices:manage', 'team:manage', 'hr:manage', 'finance:manage',
    'settings:manage', 'billing:manage', 'ai:manage', 'ads:manage', 'importer:manage',
  ],
  superadmin: [
    'dashboard:view', 'inbox:manage', 'clients:manage', 'leads:manage', 'catalog:manage',
    'bookings:manage', 'invoices:manage', 'team:manage', 'hr:manage', 'finance:manage',
    'settings:manage', 'billing:manage', 'ai:manage', 'ads:manage', 'importer:manage',
  ],
  manager: [
    'dashboard:view', 'inbox:manage', 'clients:manage', 'leads:manage', 'catalog:manage',
    'bookings:manage', 'invoices:manage', 'team:manage', 'hr:manage', 'finance:manage',
    'ads:manage', 'importer:manage',
  ],
  sales: [
    'dashboard:view', 'inbox:manage', 'clients:manage', 'leads:manage', 'catalog:manage',
    'bookings:manage', 'invoices:manage',
  ],
  support: [
    'dashboard:view', 'inbox:manage', 'clients:manage', 'leads:manage', 'bookings:manage',
  ],
  employee: [
    'dashboard:view', 'inbox:manage',
  ],
}

const ROLE_ALIASES: Record<string, AppRole> = {
  owner: 'owner',
  admin: 'superadmin',
  superadmin: 'superadmin',
  manager: 'manager',
  sales: 'sales',
  sales_agent: 'sales',
  support: 'support',
  employee: 'employee',
  restricted_employee: 'employee',
}

export function normalizeRole(role?: string | null): AppRole {
  return ROLE_ALIASES[String(role || '').trim().toLowerCase()] || 'employee'
}

export function hasPermission(role: string | null | undefined, permission: PermissionKey) {
  return ROLE_PERMISSIONS[normalizeRole(role)].includes(permission)
}

export function canAccessPath(role: string | null | undefined, path: string) {
  const checks: Array<[boolean, PermissionKey]> = [
    [path.startsWith('/dashboard/settings/subscription'), 'billing:manage'],
    [path.startsWith('/dashboard/settings/chatbot') || path.startsWith('/dashboard/agent') || path.startsWith('/dashboard/assistant'), 'ai:manage'],
    [path.startsWith('/dashboard/settings') || path.startsWith('/dashboard/store/appearance') || path.startsWith('/dashboard/store/storefront'), 'settings:manage'],
    [path.startsWith('/dashboard/team'), 'team:manage'],
    [path.startsWith('/dashboard/finance'), 'finance:manage'],
    [path.startsWith('/dashboard/ads'), 'ads:manage'],
    [path.startsWith('/dashboard/onboarding') || path.startsWith('/dashboard/management/import'), 'importer:manage'],
    [path.startsWith('/dashboard/trips') || path.startsWith('/dashboard/management') || path.startsWith('/dashboard/store/products') || path.startsWith('/dashboard/store/inventory'), 'catalog:manage'],
    [path.startsWith('/dashboard/bookings') || path.startsWith('/dashboard/visa') || path.startsWith('/dashboard/store/orders'), 'bookings:manage'],
    [path.startsWith('/dashboard/invoices'), 'invoices:manage'],
    [path.startsWith('/dashboard/clients') || path.startsWith('/dashboard/store/customers'), 'clients:manage'],
    [path.startsWith('/dashboard/leads'), 'leads:manage'],
    [path.startsWith('/dashboard/inbox'), 'inbox:manage'],
  ]

  const blocked = checks.find(([matches]) => matches)
  return blocked ? hasPermission(role, blocked[1]) : hasPermission(role, 'dashboard:view')
}

export function isOwnerRole(role?: string | null) {
  const normalized = normalizeRole(role)
  return normalized === 'owner' || normalized === 'superadmin'
}

export function isManagerRole(role?: string | null) {
  return isOwnerRole(role) || normalizeRole(role) === 'manager'
}
