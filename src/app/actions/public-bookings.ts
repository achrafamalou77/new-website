'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { buildPublicReference } from '@/lib/public-reference'

interface PublicBookingPayload {
  agencyId: string
  tripId: string
  fullName: string
  phone: string
  email: string
  numTravelers: number
  selectedDate: string
  selectedRoom: string
  selectedMeal: string
  totalPrice: number
  notes?: string
}

export async function submitPublicBooking(payload: PublicBookingPayload) {
  const supabase = createAdminClient() as any

  try {
    const { agencyId, tripId, fullName, phone, email, numTravelers, selectedDate, selectedRoom, selectedMeal, totalPrice, notes } = payload

    if (!agencyId || !tripId || !fullName || !phone) {
      return { success: false, error: 'Champs obligatoires manquants (Nom, téléphone).' }
    }

    // 1. Get or create Client
    let clientId = null
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id, notes')
      .eq('agency_id', agencyId)
      .eq('phone', phone)
      .maybeSingle()

    if (existingClient?.id) {
      clientId = existingClient.id
      // Update client notes
      await supabase
        .from('clients')
        .update({
          full_name: fullName,
          email,
          notes: `${existingClient.notes || ''}\n[Paiement Acompte] Intérêt pour voyage ID ${tripId} le ${selectedDate}.`.trim()
        })
        .eq('id', clientId)
    } else {
      const { data: newClient, error: clientErr } = await supabase
        .from('clients')
        .insert({
          agency_id: agencyId,
          full_name: fullName,
          phone,
          email,
          source: 'website',
          classification: 'retail',
          notes: `Créé via formulaire de réservation. Intérêt pour voyage ID ${tripId}.`
        })
        .select('id')
        .single()

      if (clientErr) throw clientErr
      clientId = newClient.id
    }

    // 2. Create a Conversation in Inbox so employee sees it immediately
    let convId = null
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .eq('agency_id', agencyId)
      .eq('customer_phone', phone)
      .maybeSingle()

    const leadSummary = `Voyage ID: ${tripId} | Budget: ${totalPrice} DZD | Date: ${selectedDate}`

    if (existingConv?.id) {
      convId = existingConv.id
      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          unread: true,
          lead_score: 'hot',
          lead_summary: leadSummary
        })
        .eq('id', convId)
    } else {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({
          agency_id: agencyId,
          client_id: clientId,
          customer_name: fullName,
          customer_phone: phone,
          platform: 'website',
          status: 'active',
          lead_score: 'hot',
          lead_summary: leadSummary,
          unread: true,
          ai_status: true,
          last_message_at: new Date().toISOString()
        })
        .select('id')
        .single()

      convId = newConv?.id
    }

    // 3. Save Client Message
    if (convId) {
      const msgContent = `[DEMANDE DE RÉSERVATION EN LIGNE] Bonjour, je souhaite réserver le voyage. Détails: ${numTravelers} voyageur(s), Départ: ${selectedDate}, Chambre: ${selectedRoom}, Pension: ${selectedMeal}. Notes: ${notes || 'aucune'}. Prix total: ${totalPrice.toLocaleString()} DZD.`
      await supabase
        .from('conversation_messages')
        .insert({
          agency_id: agencyId,
          sender_id: phone,
          platform: 'website',
          role: 'client',
          content: msgContent,
          message_type: 'text'
        })
    }

    // 4. Create Booking record
    const clientManifest = {
      client_id: clientId,
      name: fullName,
      phone,
      email,
      adults: numTravelers,
      children: 0,
      infants: 0,
      travelers_count: numTravelers,
      preferred_dates: selectedDate,
      room_preference: selectedRoom,
      meal_preference: selectedMeal,
      special_requests: notes || null,
      source: 'website',
      created_by: 'public_portal'
    }

    const { data: booking, error: bookingErr } = await supabase
      .from('bookings')
      .insert({
        agency_id: agencyId,
        conversation_id: convId,
        trip_id: tripId,
        status: 'pending_payment',
        total_price: totalPrice,
        client_manifest: clientManifest
      })
      .select('id')
      .single()

    if (bookingErr) throw bookingErr

    // 5. Create Travel Inquiry record for double safety / CRM pipeline
    await supabase
      .from('travel_inquiries')
      .insert({
        agency_id: agencyId,
        client_id: clientId,
        inquiry_type: 'package',
        destination_preference: selectedDate, // Use departure dates details
        date_preference: selectedDate,
        budget_range: `${totalPrice} DZD`,
        travelers_count: numTravelers,
        status: 'new',
        notes: `Réservation directe créée: ID ${booking.id}. Chambre: ${selectedRoom}.`
      })

    const bookingCode = buildPublicReference('TRIP', booking.id)

    return {
      success: true,
      bookingId: booking.id,
      bookingCode
    }
  } catch (err: any) {
    console.error('submitPublicBooking error:', err)
    return {
      success: false,
      error: err.message || 'Une erreur interne est survenue lors de l\'enregistrement de votre réservation.'
    }
  }
}

interface VisaInquiryPayload {
  agencyId: string
  fullName: string
  phone: string
  email: string
  visaTypeId: string
  notes?: string
}

export async function submitVisaInquiry(payload: VisaInquiryPayload) {
  const supabase = createAdminClient() as any

  try {
    const { agencyId, fullName, phone, email, visaTypeId, notes } = payload

    if (!agencyId || !fullName || !phone || !visaTypeId) {
      return { success: false, error: 'Champs requis manquants.' }
    }

    // 1. Get or create Client
    let clientId = null
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id, notes')
      .eq('agency_id', agencyId)
      .eq('phone', phone)
      .maybeSingle()

    if (existingClient?.id) {
      clientId = existingClient.id
      await supabase
        .from('clients')
        .update({
          full_name: fullName,
          email,
          notes: `${existingClient.notes || ''}\n[Demande de Visa] Intérêt pour Visa ID ${visaTypeId}.`.trim()
        })
        .eq('id', clientId)
    } else {
      const { data: newClient } = await supabase
        .from('clients')
        .insert({
          agency_id: agencyId,
          full_name: fullName,
          phone,
          email,
          source: 'website',
          classification: 'retail',
          notes: `Créé via formulaire visa. Intérêt pour Visa ID ${visaTypeId}.`
        })
        .select('id')
        .single()
      clientId = newClient?.id
    }

    // 2. Create Conversation
    let convId = null
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .eq('agency_id', agencyId)
      .eq('customer_phone', phone)
      .maybeSingle()

    const leadSummary = `Demande Visa ID: ${visaTypeId}`

    if (existingConv?.id) {
      convId = existingConv.id
      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          unread: true,
          lead_score: 'warm',
          lead_summary: leadSummary
        })
        .eq('id', convId)
    } else {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({
          agency_id: agencyId,
          client_id: clientId,
          customer_name: fullName,
          customer_phone: phone,
          platform: 'website',
          status: 'active',
          lead_score: 'warm',
          lead_summary: leadSummary,
          unread: true,
          ai_status: true,
          last_message_at: new Date().toISOString()
        })
        .select('id')
        .single()
      convId = newConv?.id
    }

    // 3. Save Message
    if (convId) {
      const msgContent = `[DEMANDE DE VISA EN LIGNE] Bonjour, je souhaite obtenir des informations et lancer les démarches pour un visa. Détails/Notes: ${notes || 'aucune'}.`
      await supabase
        .from('conversation_messages')
        .insert({
          agency_id: agencyId,
          sender_id: phone,
          platform: 'website',
          role: 'client',
          content: msgContent,
          message_type: 'text'
        })
    }

    // 4. Create Visa Application record
    const { data: visaApp, error: appErr } = await supabase
      .from('visa_applications')
      .insert({
        agency_id: agencyId,
        client_id: clientId,
        visa_type_id: visaTypeId,
        status: 'submitted',
        notes: notes || 'Soumis via le site public.'
      })
      .select('id')
      .single()

    if (appErr) throw appErr

    // 5. Create Travel Inquiry
    await supabase
      .from('travel_inquiries')
      .insert({
        agency_id: agencyId,
        client_id: clientId,
        inquiry_type: 'visa',
        status: 'new',
        notes: `Demande de visa en ligne. Dossier créé ID: ${visaApp.id}.`
      })

    const code = buildPublicReference('VISA', visaApp.id)

    return {
      success: true,
      visaAppId: visaApp.id,
      code
    }
  } catch (err: any) {
    console.error('submitVisaInquiry error:', err)
    return {
      success: false,
      error: err.message || 'Une erreur interne est survenue lors de l\'enregistrement de votre demande.'
    }
  }
}

interface ContactFormPayload {
  agencyId: string
  fullName: string
  phone: string
  email: string
  subject: string
  message: string
}

export async function submitContactForm(payload: ContactFormPayload) {
  const supabase = createAdminClient() as any
  try {
    const { agencyId, fullName, phone, email, subject, message } = payload
    if (!agencyId || !fullName || !phone || !message) {
      return { success: false, error: 'Champs requis manquants.' }
    }
    // 1. Get/create client
    let clientId = null
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id, notes')
      .eq('agency_id', agencyId)
      .eq('phone', phone)
      .maybeSingle()

    if (existingClient?.id) {
      clientId = existingClient.id
      await supabase
        .from('clients')
        .update({
          full_name: fullName,
          email,
          notes: `${existingClient.notes || ''}\n[Formulaire Contact] Sujet: ${subject}. Message: ${message}`.trim()
        })
        .eq('id', clientId)
    } else {
      const { data: newClient } = await supabase
        .from('clients')
        .insert({
          agency_id: agencyId,
          full_name: fullName,
          phone,
          email,
          source: 'website',
          classification: 'retail',
          notes: `Créé via formulaire contact. Sujet: ${subject}.`
        })
        .select('id')
        .single()
      clientId = newClient?.id
    }

    // 2. Create conversation
    let convId = null
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .eq('agency_id', agencyId)
      .eq('customer_phone', phone)
      .maybeSingle()

    const leadSummary = `Contact: ${subject}`
    if (existingConv?.id) {
      convId = existingConv.id
      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          unread: true,
          lead_summary: leadSummary
        })
        .eq('id', convId)
    } else {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({
          agency_id: agencyId,
          client_id: clientId,
          customer_name: fullName,
          customer_phone: phone,
          platform: 'website',
          status: 'active',
          lead_score: 'warm',
          lead_summary: leadSummary,
          unread: true,
          ai_status: true,
          last_message_at: new Date().toISOString()
        })
        .select('id')
        .single()
      convId = newConv?.id
    }

    // 3. Save message
    if (convId) {
      const msgContent = `[FORMULAIRE DE CONTACT] Sujet: ${subject}\nMessage: ${message}`
      await supabase
        .from('conversation_messages')
        .insert({
          agency_id: agencyId,
          sender_id: phone,
          platform: 'website',
          role: 'client',
          content: msgContent,
          message_type: 'text'
        })
    }

    // 4. Create inquiry
    await supabase
      .from('travel_inquiries')
      .insert({
        agency_id: agencyId,
        client_id: clientId,
        inquiry_type: 'custom',
        status: 'new',
        notes: `Demande de contact en ligne. Sujet: ${subject}. Message: ${message}`
      })

    return { success: true }
  } catch (err: any) {
    console.error('submitContactForm error:', err)
    return { success: false, error: err.message || 'Une erreur interne est survenue.' }
  }
}
