'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentAgencyContext } from '@/lib/server/agency-context'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── Bulk import products from parsed rows ─────────────────────────────────
export async function bulkImportEcommerceProducts(rows: Array<{
  name: string
  sku: string
  category: string
  brand: string
  price: number
  compare_at_price: number | null
  cost_price: number | null
  stock_quantity: number
  description: string
  status: 'active' | 'draft' | 'archived'
  is_featured: boolean
}>) {
  const ctx = await getCurrentAgencyContext()
  if (!ctx) return { success: false, error: 'Not authenticated' }
  const admin: any = createAdminClient()

  const records = rows.map((row) => ({
    agency_id: ctx.agencyId,
    name: String(row.name || '').trim().slice(0, 180),
    sku: String(row.sku || `SKU-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`).trim().slice(0, 80),
    category: String(row.category || 'general').trim().slice(0, 100),
    brand: String(row.brand || '').trim().slice(0, 100),
    price: Number(row.price) || 0,
    compare_at_price: row.compare_at_price ? Number(row.compare_at_price) : null,
    cost_price: row.cost_price ? Number(row.cost_price) : null,
    stock_quantity: Number(row.stock_quantity) || 0,
    low_stock_threshold: 5,
    description: String(row.description || '').trim().slice(0, 5000),
    status: (['active', 'draft', 'archived'].includes(row.status) ? row.status : 'active') as 'active' | 'draft' | 'archived',
    is_featured: Boolean(row.is_featured),
    variants: [],
    images: [],
    channels: ['website'],
  }))

  if (!records.length) return { success: false, error: 'No valid rows to import' }

  const { error } = await admin.from('ecommerce_products').insert(records)
  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/store/products')
  revalidatePath('/dashboard/store')
  return { success: true, count: records.length }
}

// ─── Seed test orders ──────────────────────────────────────────────────────
export async function seedTestOrders(count: number = 5) {
  const ctx = await getCurrentAgencyContext()
  if (!ctx) return { success: false, error: 'Not authenticated' }
  const admin: any = createAdminClient()

  // Fetch existing products to reference
  const { data: products } = await admin
    .from('ecommerce_products')
    .select('id, name, price')
    .eq('agency_id', ctx.agencyId)
    .limit(10)

  const names = ['Ahmed Benali', 'Sara Kader', 'Mohamed Saidi', 'Fatima Bouzid', 'Karim Meziane', 'Nadia Hamdi', 'Yacine Cherif', 'Amina Tizi', 'Bilal Rais', 'Houria Menad']
  const cities = ['Alger', 'Oran', 'Constantine', 'Annaba', 'Sétif', 'Tlemcen', 'Blida', 'Béjaïa', 'Batna', 'Mostaganem']
  const statuses = ['new', 'confirmed', 'packed', 'shipped', 'delivered'] as const
  const paymentStatuses = ['pending', 'paid', 'pending', 'pending', 'paid'] as const

  const orders = Array.from({ length: Math.min(count, 20) }, (_, i) => {
    const product = (products as any[])?.[i % ((products as any[])?.length || 1)]
    const qty = Math.floor(Math.random() * 3) + 1
    const price = product?.price || 3500
    const shipping = 500 + Math.floor(Math.random() * 500)
    const total = price * qty + shipping

    return {
      agency_id: ctx.agencyId,
      order_number: `ORD-TEST-${Date.now()}-${i}`,
      customer_name: names[i % names.length],
      customer_phone: `+213 5${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
      customer_city: cities[i % cities.length],
      customer_address: `${Math.floor(Math.random() * 200) + 1} Rue Didouche Mourad`,
      items: product ? [{ id: product.id, name: product.name, price, quantity: qty }] : [],
      subtotal: price * qty,
      shipping_fee: shipping,
      discount_amount: 0,
      total,
      payment_method: 'cod',
      payment_status: paymentStatuses[i % paymentStatuses.length],
      fulfillment_status: statuses[i % statuses.length],
      source: 'test_import',
      notes: `Test order #${i + 1} seeded for demo`,
      promotion_code: null,
      public_token: `test_${Date.now()}_${i}`,
      campaign: {},
    }
  })

  const { error } = await admin.from('ecommerce_orders').insert(orders)
  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/store/orders')
  revalidatePath('/dashboard/store')
  return { success: true, count: orders.length }
}

// ─── Delete all test orders ────────────────────────────────────────────────
export async function deleteTestOrders() {
  const ctx = await getCurrentAgencyContext()
  if (!ctx) return { success: false, error: 'Not authenticated' }
  const admin: any = createAdminClient()

  const { error } = await admin
    .from('ecommerce_orders')
    .delete()
    .eq('agency_id', ctx.agencyId)
    .eq('source', 'test_import')

  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard/store/orders')
  revalidatePath('/dashboard/store')
  return { success: true }
}
