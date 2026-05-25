'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createSalesOrder(data: {
  client_id: string
  car_id: string
  sale_price: number
  invoice_id?: string
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('agency_id').eq('id', user.id).single()
  if (!profile || !profile.agency_id) return { success: false, error: 'Agency ID not found' }

  const { data: order, error } = await supabase.from('car_sales_orders').insert({
    agency_id: profile.agency_id,
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

  revalidatePath('/dashboard/clients')
  revalidatePath(`/dashboard/clients/${data.client_id}`)
  return { success: true, order }
}

export async function updateSalesOrderStatus(orderId: string, status: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { error } = await supabase.from('car_sales_orders')
    .update({ status: status } as any)
    .eq('id', orderId)

  if (error) return { success: false, error: error.message }
  
  revalidatePath('/dashboard/clients')
  return { success: true }
}

export async function deleteSalesOrder(orderId: string, carId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { error } = await supabase.from('car_sales_orders').delete().eq('id', orderId)
  if (error) return { success: false, error: error.message }

  // Optionally revert car inventory status to 'available'
  await supabase.from('car_sales_inventory')
    .update({ status: 'available' } as any)
    .eq('id', carId)

  revalidatePath('/dashboard/clients')
  return { success: true }
}
