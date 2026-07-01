'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createClientAction, updateClientAction } from './clients'
import { createSalesOrder } from './sales-orders'
import { createRentalBooking } from './rental-bookings'
import { createInvoiceAction, recordPaymentAction } from './invoices'

async function getAgencyBusinessContext(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false as const, error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single()

  if (!profile?.agency_id) return { success: false as const, error: 'Agency profile not found' }

  const { data: agency } = await supabase
    .from('agencies')
    .select('business_type_slug')
    .eq('id', profile.agency_id)
    .single()

  return {
    success: true as const,
    user,
    agencyId: profile.agency_id as string,
    businessTypeSlug: agency?.business_type_slug || 'travel_agency',
  }
}

export async function createClientWithTransactionAction(payload: any) {
  const supabase = await createClient()

  const context = await getAgencyBusinessContext(supabase)
  if (!context.success) return context
  if (context.businessTypeSlug !== 'car_showroom') {
    return { success: false, error: 'Vehicle transactions are only available for car showroom agencies' }
  }

  // 1. Create or Update Client
  let clientId = payload.clientToEditId
  if (!clientId) {
    const clientRes = await createClientAction(payload.clientData)
    if (!clientRes.success) return clientRes

    const { data: newClient } = await supabase.from('clients')
      .select('id')
      .eq('agency_id', context.agencyId)
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
    const salePrice = Number(transData.sale_price || transData.total_price || 0)
    if (salePrice <= 0) {
      return { success: false, error: 'Le prix de vente est obligatoire pour creer une vente.' }
    }

    // Generate Invoice first
    const invoiceRes = await createInvoiceAction({
      client_id: clientId,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date().toISOString().split('T')[0],
      status: 'paid', // Mark as paid if they gave full amount, or partial
      items: [{
        description: `Achat Véhicule: ${transData.car_name}`,
        qty: 1,
        unit_price: salePrice,
        total: salePrice
      }],
      subtotal: salePrice,
      total_amount: salePrice,
      payment_method: transData.payment_method || 'Cash'
    })

    if (!invoiceRes.success) return invoiceRes

    // Create Sales Order
    const orderRes = await createSalesOrder({
      client_id: clientId,
      car_id: transData.car_id,
      sale_price: salePrice,
      invoice_id: invoiceRes.invoiceId
    })
    
    if (!orderRes.success) return orderRes
  }

  if (transactionType === 'location' && transData?.car_id) {
    const totalPrice = Number(transData.total_price || 0)
    if (!transData.start_date || !transData.end_date) {
      return { success: false, error: 'Les dates debut et fin sont obligatoires pour une location.' }
    }
    if (totalPrice <= 0) {
      return { success: false, error: 'Le montant de location est obligatoire.' }
    }

    // Generate Invoice first
    const invoiceRes = await createInvoiceAction({
      client_id: clientId,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: transData.end_date.split('T')[0],
      status: 'paid', 
      items: [{
        description: `Location Véhicule: ${transData.car_name} (${transData.start_date.split('T')[0]} - ${transData.end_date.split('T')[0]})`,
        qty: 1,
        unit_price: totalPrice,
        total: totalPrice
      }],
      subtotal: totalPrice,
      total_amount: totalPrice,
      payment_method: transData.payment_method || 'Cash'
    })

    if (!invoiceRes.success) return invoiceRes

    // Create Rental Booking
    const bookingRes = await createRentalBooking({
      client_id: clientId,
      car_id: transData.car_id,
      start_date: transData.start_date,
      end_date: transData.end_date,
      total_price: totalPrice,
      invoice_id: invoiceRes.invoiceId
    })
    
    if (!bookingRes.success) return bookingRes
  }

  // Handle 'commande' (Import Order) similarly if needed, but the user currently uses import_orders action.
  if (transactionType === 'commande' && (transData?.car_id || transData?.brand || transData?.model)) {
    const totalCost = Number(transData.total_price || 0)
    const depositPaid = Number(transData.deposit_paid || transData.sale_price || 0)

    if (totalCost > 0) {
     // Generate Invoice
     const invoiceRes = await createInvoiceAction({
      client_id: clientId,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date().toISOString().split('T')[0],
      status: depositPaid >= totalCost ? 'paid' : 'partial',
      items: [{
        description: `Commande Import Véhicule: ${transData.car_name}`,
        qty: 1,
        unit_price: totalCost,
        total: totalCost
      }],
      subtotal: totalCost,
      total_amount: totalCost,
      payment_method: transData.payment_method || 'Cash'
    })

      if (!invoiceRes.success) return invoiceRes
    }

    const { error: importError } = await supabase.from('import_orders').insert({
      agency_id: context.agencyId,
      client_id: clientId,
      vehicle_brand: transData.brand || 'A completer',
      vehicle_model: transData.model || transData.car_name || 'A completer',
      vehicle_year: Number(transData.year || new Date().getFullYear()),
      color: transData.color || null,
      specs: {
        selected_inventory_id: transData.car_id || null,
        version: transData.version || null,
        requested_vehicle: transData.car_name || null,
        payment_method: transData.payment_method || 'Cash',
      },
      total_cost: totalCost,
      deposit_paid: depositPaid,
      balance_due: Math.max(0, totalCost - depositPaid),
      status: depositPaid > 0 ? 'deposit_paid' : 'quote_requested'
    })

    if (importError) return { success: false, error: importError.message }
  }

  revalidatePath('/dashboard/clients')
  return { success: true }
}

export async function createTravelClientWorkflowAction(payload: any) {
  const supabase = await createClient()

  const context = await getAgencyBusinessContext(supabase)
  if (!context.success) return context
  if (context.businessTypeSlug === 'car_showroom') {
    return { success: false, error: 'Travel bookings are not available for car showroom agencies' }
  }

  let clientId = payload.clientToEditId
  if (clientId) {
    const updateRes = await updateClientAction(clientId, payload.clientData)
    if (!updateRes.success) return updateRes
  } else {
    const clientRes = await createClientAction(payload.clientData)
    if (!clientRes.success) return clientRes
    clientId = clientRes.clientId
  }

  if (!clientId) return { success: false, error: 'Client could not be saved' }

  const booking = payload.bookingData || {}
  const totalPrice = Number(booking.total_price || 0)
  const amountPaid = Math.min(Math.max(Number(booking.amount_paid || 0), 0), totalPrice)

  if (booking.trip_id && totalPrice > 0) {
    const manifest = {
      name: payload.clientData.full_name,
      phone: payload.clientData.phone,
      email: payload.clientData.email,
      adults: Number(booking.adults || 1),
      children: Number(booking.children || 0),
      infants: Number(booking.infants || 0),
      group_name: booking.group_name || null,
      companions: booking.companions || [],
      room_preference: booking.room_preference || '',
      special_requests: booking.special_requests || '',
      client_id: clientId,
    }

      const { error: bookingError } = await supabase.from('bookings').insert({
      agency_id: context.agencyId,
      trip_id: booking.trip_id,
      client_manifest: manifest,
        status: amountPaid >= totalPrice ? 'completed' : 'pending_payment',
        total_price: totalPrice,
      } as any)

    if (bookingError) return { success: false, error: bookingError.message }

    if (booking.generate_invoice !== false) {
      const invoiceRes = await createInvoiceAction({
        client_id: clientId,
        trip_id: booking.trip_id,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: booking.due_date || new Date().toISOString().split('T')[0],
        status: amountPaid >= totalPrice ? 'paid' : amountPaid > 0 ? 'partial' : 'sent',
        items: [{
          description: booking.invoice_label || `Reservation voyage - ${booking.group_name || payload.clientData.full_name}`,
          qty: 1,
          unit_price: totalPrice,
          total: totalPrice,
        }],
        subtotal: totalPrice,
        total_amount: totalPrice,
        payment_method: booking.payment_method || 'Cash',
        notes: booking.special_requests || '',
      })

      if (!invoiceRes.success) return invoiceRes

      if (invoiceRes.invoiceId && amountPaid > 0) {
        const paymentRes = await recordPaymentAction(invoiceRes.invoiceId, {
          amount: amountPaid,
          payment_method: booking.payment_method || 'Cash',
          payment_date: new Date().toISOString().split('T')[0],
          reference_number: booking.payment_reference || '',
          notes: `Initial payment for travel booking - ${booking.group_name || payload.clientData.full_name}`,
        })

        if (!paymentRes.success) return paymentRes
      }
    }
  }

  revalidatePath('/dashboard/clients')
  revalidatePath('/dashboard/bookings')
  revalidatePath('/dashboard/invoices')
  return { success: true, clientId }
}
