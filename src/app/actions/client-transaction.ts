'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createClientAction, updateClientAction } from './clients'
import { createSalesOrder, updateSalesOrderStatus } from './sales-orders'
import { createRentalBooking, updateRentalBookingStatus } from './rental-bookings'
import { createInvoiceAction } from './invoices'

export async function createClientWithTransactionAction(payload: any) {
  const supabase = await createClient()

  // 1. Create or Update Client
  let clientId = payload.clientToEditId
  if (!clientId) {
    const clientRes = await createClientAction(payload.clientData)
    if (!clientRes.success) return clientRes
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }
    const { data: profile } = await supabase.from('profiles').select('agency_id').eq('id', user.id).single()
    if (!profile || !profile.agency_id) return { success: false, error: 'Agency profile not found' }
    
    const { data: newClient } = await supabase.from('clients')
      .select('id')
      .eq('agency_id', profile.agency_id)
      .eq('full_name', payload.clientData.full_name)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
      
    if (!newClient) return { success: false, error: 'Failed to retrieve new client ID' }
    clientId = newClient.id
  } else {
    // Edit existing client info
    const updateRes = await updateClientAction(clientId, payload.clientData)
    if (!updateRes.success) return updateRes
  }

  // 2. Create Transaction and Invoice based on the Tab context
  const transactionType = payload.transactionType // 'ventes' | 'location' | 'commande'
  const transData = payload.transactionData

  if (transactionType === 'ventes' && transData?.car_id) {
    // Generate Invoice first
    const invoiceRes = await createInvoiceAction({
      client_id: clientId,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date().toISOString().split('T')[0],
      status: 'paid', // Mark as paid if they gave full amount, or partial
      items: [{
        description: `Achat Véhicule: ${transData.car_name}`,
        qty: 1,
        unit_price: Number(transData.sale_price),
        total: Number(transData.sale_price)
      }],
      subtotal: Number(transData.sale_price),
      total_amount: Number(transData.sale_price),
      payment_method: transData.payment_method || 'Cash'
    })

    if (!invoiceRes.success) return invoiceRes

    // Create Sales Order
    const orderRes = await createSalesOrder({
      client_id: clientId,
      car_id: transData.car_id,
      sale_price: Number(transData.sale_price),
      invoice_id: invoiceRes.invoiceId
    })
    
    if (!orderRes.success) return orderRes
  }

  if (transactionType === 'location' && transData?.car_id) {
    // Generate Invoice first
    const invoiceRes = await createInvoiceAction({
      client_id: clientId,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: transData.end_date.split('T')[0],
      status: 'paid', 
      items: [{
        description: `Location Véhicule: ${transData.car_name} (${transData.start_date.split('T')[0]} - ${transData.end_date.split('T')[0]})`,
        qty: 1,
        unit_price: Number(transData.total_price),
        total: Number(transData.total_price)
      }],
      subtotal: Number(transData.total_price),
      total_amount: Number(transData.total_price),
      payment_method: transData.payment_method || 'Cash'
    })

    if (!invoiceRes.success) return invoiceRes

    // Create Rental Booking
    const bookingRes = await createRentalBooking({
      client_id: clientId,
      car_id: transData.car_id,
      start_date: transData.start_date,
      end_date: transData.end_date,
      total_price: Number(transData.total_price),
      invoice_id: invoiceRes.invoiceId
    })
    
    if (!bookingRes.success) return bookingRes
  }

  // Handle 'commande' (Import Order) similarly if needed, but the user currently uses import_orders action.
  if (transactionType === 'commande' && transData?.car_id) {
     // Generate Invoice
     const invoiceRes = await createInvoiceAction({
      client_id: clientId,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date().toISOString().split('T')[0],
      status: 'partial', // usually imports have upfront payment
      items: [{
        description: `Commande Import Véhicule: ${transData.car_name}`,
        qty: 1,
        unit_price: Number(transData.total_price),
        total: Number(transData.total_price)
      }],
      subtotal: Number(transData.total_price),
      total_amount: Number(transData.total_price),
      payment_method: transData.payment_method || 'Cash'
    })

    if (!invoiceRes.success) return invoiceRes

    // Note: Creating the import_order might require the specific import_orders.ts action
    // We'll insert it manually for now
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }
    const { data: profile } = await supabase.from('profiles').select('agency_id').eq('id', user.id).single()
    if (!profile || !profile.agency_id) return { success: false, error: 'Agency profile not found' }
    
    await supabase.from('import_orders').insert({
      agency_id: profile.agency_id,
      client_id: clientId,
      vehicle_brand: transData.brand || 'Unknown',
      vehicle_model: transData.model || 'Unknown',
      vehicle_year: transData.year || 2024,
      total_cost: Number(transData.total_price),
      status: 'pending_payment'
    })
  }

  revalidatePath('/dashboard/clients')
  return { success: true }
}
