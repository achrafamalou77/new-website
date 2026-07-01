'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentAgencyContext } from '@/lib/server/agency-context'

async function requireShowroomContext() {
  const context = await getCurrentAgencyContext()
  if (!context.userId || !context.agencyId) return { success: false as const, error: 'Unauthorized' }
  if (context.businessTypeSlug !== 'car_showroom') {
    return { success: false as const, error: 'Sales orders are only available for car showroom agencies' }
  }
  return { success: true as const, context: { ...context, agencyId: context.agencyId as string } }
}

export async function createSalesOrder(data: {
  client_id: string
  car_id: string
  sale_price: number
  invoice_id?: string
}) {
  const supabase = await createClient()
  const guard = await requireShowroomContext()
  if (!guard.success) return guard

  const { data: order, error } = await supabase.from('car_sales_orders').insert({
    agency_id: guard.context.agencyId,
    client_id: data.client_id,
    car_id: data.car_id,
    sale_price: data.sale_price,
    invoice_id: data.invoice_id || null,
    status: 'completed'
  } as any).select().single()

  if (error) return { success: false, error: error.message }

  // Update car inventory status to 'sold'
  await supabase.from('car_sales_inventory')
    .update({ status: 'sold' } as any)
    .eq('id', data.car_id)
    .eq('agency_id', guard.context.agencyId)

  revalidatePath('/dashboard/clients')
  revalidatePath(`/dashboard/clients/${data.client_id}`)
  return { success: true, order }
}

export async function updateSalesOrderStatus(orderId: string, status: string) {
  const supabase = await createClient()
  const guard = await requireShowroomContext()
  if (!guard.success) return guard

  const { data: order, error } = await supabase.from('car_sales_orders')
    .update({ status: status } as any)
    .eq('id', orderId)
    .eq('agency_id', guard.context.agencyId)
    .select('id')
    .maybeSingle()

  if (error) return { success: false, error: error.message }
  if (!order) return { success: false, error: 'Sales order not found in this agency' }
  
  revalidatePath('/dashboard/clients')
  return { success: true }
}

export async function deleteSalesOrder(orderId: string, carId: string) {
  const supabase = await createClient()
  const guard = await requireShowroomContext()
  if (!guard.success) return guard

  const { data: order, error } = await supabase
    .from('car_sales_orders')
    .delete()
    .eq('id', orderId)
    .eq('agency_id', guard.context.agencyId)
    .select('id')
    .maybeSingle()
  if (error) return { success: false, error: error.message }
  if (!order) return { success: false, error: 'Sales order not found in this agency' }

  // Optionally revert car inventory status to 'available'
  await supabase.from('car_sales_inventory')
    .update({ status: 'available' } as any)
    .eq('id', carId)
    .eq('agency_id', guard.context.agencyId)

  revalidatePath('/dashboard/clients')
  return { success: true }
}
