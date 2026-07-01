import { describe, expect, it } from 'vitest'
import { canAccessPath, hasPermission, normalizeRole } from '@/lib/permissions'

describe('team permissions', () => {
  it('normalizes legacy and business role aliases', () => {
    expect(normalizeRole('owner')).toBe('owner')
    expect(normalizeRole('admin')).toBe('superadmin')
    expect(normalizeRole('sales_agent')).toBe('sales')
    expect(normalizeRole('restricted_employee')).toBe('employee')
    expect(normalizeRole('unknown')).toBe('employee')
  })

  it('keeps restricted employees away from company management areas', () => {
    for (const path of [
      '/dashboard/team',
      '/dashboard/settings/agency',
      '/dashboard/settings/subscription',
      '/dashboard/settings/chatbot',
      '/dashboard/finance',
      '/dashboard/ads',
      '/dashboard/assistant',
    ]) {
      expect(canAccessPath('employee', path), path).toBe(false)
    }

    expect(canAccessPath('employee', '/dashboard/inbox')).toBe(true)
  })

  it('gives sales and support only their operational areas', () => {
    expect(canAccessPath('sales', '/dashboard/clients')).toBe(true)
    expect(canAccessPath('sales', '/dashboard/bookings')).toBe(true)
    expect(canAccessPath('sales', '/dashboard/team')).toBe(false)
    expect(canAccessPath('sales', '/dashboard/settings/agency')).toBe(false)

    expect(canAccessPath('support', '/dashboard/inbox')).toBe(true)
    expect(canAccessPath('support', '/dashboard/bookings')).toBe(true)
    expect(canAccessPath('support', '/dashboard/invoices')).toBe(false)
  })

  it('lets managers run operations but not owner-only settings or billing', () => {
    expect(canAccessPath('manager', '/dashboard/team')).toBe(true)
    expect(canAccessPath('manager', '/dashboard/finance')).toBe(true)
    expect(canAccessPath('manager', '/dashboard/ads')).toBe(true)
    expect(canAccessPath('manager', '/dashboard/onboarding')).toBe(true)
    expect(canAccessPath('manager', '/dashboard/management/import')).toBe(true)
    expect(canAccessPath('owner', '/dashboard/trips')).toBe(true)
    expect(canAccessPath('manager', '/dashboard/trips')).toBe(true)
    expect(hasPermission('owner', 'catalog:manage')).toBe(true)
    expect(hasPermission('manager', 'catalog:manage')).toBe(true)
    expect(canAccessPath('manager', '/dashboard/settings/agency')).toBe(false)
    expect(canAccessPath('manager', '/dashboard/settings/subscription')).toBe(false)
    expect(hasPermission('manager', 'billing:manage')).toBe(false)
  })
})
