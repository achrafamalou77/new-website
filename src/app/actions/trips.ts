'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentAgencyContext } from '@/lib/server/agency-context'
import { hasPermission } from '@/lib/permissions'

async function requireTravelSuperadmin() {
  const context = await getCurrentAgencyContext()
  if (!context.userId || !context.agencyId) return { success: false as const, error: 'Unauthorized' }
  if (context.businessTypeSlug === 'car_showroom') {
    return { success: false as const, error: 'Trips are only available for travel agencies' }
  }
  if (!hasPermission(context.role, 'catalog:manage')) {
    return { success: false as const, error: 'You do not have permission to manage trips' }
  }
  return { success: true as const, context: { ...context, agencyId: context.agencyId as string } }
}

export async function createTrip(formData: any) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { success: true } // Demo mode
  }

  const supabase = await createClient()
  const guard = await requireTravelSuperadmin()
  if (!guard.success) return guard

  const tripsTable: any = supabase.from('trips')
  const { error } = await tripsTable.insert({
    agency_id: guard.context.agencyId,
    title: formData.title,
    description: formData.description,
    price: Number(formData.price),
    destination: formData.destination,
    duration_days: Number(formData.duration_days),
    image_urls: typeof formData.image_urls === 'string' ? formData.image_urls.split(',').map((url: string) => url.trim()) : formData.image_urls || [],
    is_active: !!formData.is_active,

    // Step 1: Basic Information
    trip_type: formData.trip_type || 'package',
    destination_country: formData.destination_country,
    destination_cities: Array.isArray(formData.destination_cities) ? formData.destination_cities : [],

    // Step 2: Transport Configuration
    transport_type: formData.transport_type,
    transport_details: formData.transport_details || {},

    // Step 3: Accommodation & Meals
    accommodation_type: formData.accommodation_type,
    hotel_name: formData.hotel_name,
    room_type: formData.room_type,
    meal_plan: formData.meal_plan,
    num_nights: Number(formData.num_nights) || (Number(formData.duration_days) > 1 ? Number(formData.duration_days) - 1 : 0),

    // Step 4: Itinerary & Activities
    itinerary: Array.isArray(formData.itinerary) ? formData.itinerary : [],
    included_items: Array.isArray(formData.included_items) ? formData.included_items : [],
    excluded_items: Array.isArray(formData.excluded_items) ? formData.excluded_items : [],
    guide_included: !!formData.guide_included,
    guide_language: formData.guide_language,
    group_size_min: formData.group_size_min ? Number(formData.group_size_min) : null,
    group_size_max: formData.group_size_max ? Number(formData.group_size_max) : null,

    // Step 5: Pricing & Options
    child_policy: formData.child_policy || {},
    single_supplement: Number(formData.single_supplement) || 0,
    group_discounts: Array.isArray(formData.group_discounts) ? formData.group_discounts : [],
    early_bird_discount: formData.early_bird_discount || {},
    last_minute_price: formData.last_minute_price ? Number(formData.last_minute_price) : null,

    // Step 6: Documents & Requirements
    visa_required: !!formData.visa_required,
    visa_details: formData.visa_details || {},
    passport_validity_months: Number(formData.passport_validity_months) || 6,
    vaccinations_required: !!formData.vaccinations_required,
    required_documents: Array.isArray(formData.required_documents) ? formData.required_documents : [],
    booking_deadline_days: Number(formData.booking_deadline_days) || 7,

    // Step 7: Images & Media
    gallery_images: Array.isArray(formData.gallery_images) ? formData.gallery_images : [],
    video_url: formData.video_url,
    brochure_url: formData.brochure_url,
    map_image_url: formData.map_image_url,

    // Step 8: Publishing & Visibility
    is_featured: !!formData.is_featured,
    available_dates: Array.isArray(formData.available_dates) ? formData.available_dates : [],
    max_bookings: formData.max_bookings ? Number(formData.max_bookings) : null,
    bookings_open: formData.bookings_open !== false,
    show_on_website: formData.show_on_website !== false,
    show_on_chatbot: formData.show_on_chatbot !== false
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/trips')
  return { success: true }
}

export async function updateTrip(tripId: string, formData: any) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return { success: true }

  const supabase = await createClient()
  const guard = await requireTravelSuperadmin()
  if (!guard.success) return guard

  const tripsTable: any = supabase.from('trips')
  const { data: trip, error } = await tripsTable.update({
    title: formData.title,
    description: formData.description,
    price: Number(formData.price),
    destination: formData.destination,
    duration_days: Number(formData.duration_days),
    image_urls: typeof formData.image_urls === 'string' ? formData.image_urls.split(',').map((url: string) => url.trim()) : formData.image_urls || [],
    is_active: !!formData.is_active,

    // Step 1: Basic Information
    trip_type: formData.trip_type || 'package',
    destination_country: formData.destination_country,
    destination_cities: Array.isArray(formData.destination_cities) ? formData.destination_cities : [],

    // Step 2: Transport Configuration
    transport_type: formData.transport_type,
    transport_details: formData.transport_details || {},

    // Step 3: Accommodation & Meals
    accommodation_type: formData.accommodation_type,
    hotel_name: formData.hotel_name,
    room_type: formData.room_type,
    meal_plan: formData.meal_plan,
    num_nights: Number(formData.num_nights) || (Number(formData.duration_days) > 1 ? Number(formData.duration_days) - 1 : 0),

    // Step 4: Itinerary & Activities
    itinerary: Array.isArray(formData.itinerary) ? formData.itinerary : [],
    included_items: Array.isArray(formData.included_items) ? formData.included_items : [],
    excluded_items: Array.isArray(formData.excluded_items) ? formData.excluded_items : [],
    guide_included: !!formData.guide_included,
    guide_language: formData.guide_language,
    group_size_min: formData.group_size_min ? Number(formData.group_size_min) : null,
    group_size_max: formData.group_size_max ? Number(formData.group_size_max) : null,

    // Step 5: Pricing & Options
    child_policy: formData.child_policy || {},
    single_supplement: Number(formData.single_supplement) || 0,
    group_discounts: Array.isArray(formData.group_discounts) ? formData.group_discounts : [],
    early_bird_discount: formData.early_bird_discount || {},
    last_minute_price: formData.last_minute_price ? Number(formData.last_minute_price) : null,

    // Step 6: Documents & Requirements
    visa_required: !!formData.visa_required,
    visa_details: formData.visa_details || {},
    passport_validity_months: Number(formData.passport_validity_months) || 6,
    vaccinations_required: !!formData.vaccinations_required,
    required_documents: Array.isArray(formData.required_documents) ? formData.required_documents : [],
    booking_deadline_days: Number(formData.booking_deadline_days) || 7,

    // Step 7: Images & Media
    gallery_images: Array.isArray(formData.gallery_images) ? formData.gallery_images : [],
    video_url: formData.video_url,
    brochure_url: formData.brochure_url,
    map_image_url: formData.map_image_url,

    // Step 8: Publishing & Visibility
    is_featured: !!formData.is_featured,
    available_dates: Array.isArray(formData.available_dates) ? formData.available_dates : [],
    max_bookings: formData.max_bookings ? Number(formData.max_bookings) : null,
    bookings_open: formData.bookings_open !== false,
    show_on_website: formData.show_on_website !== false,
    show_on_chatbot: formData.show_on_chatbot !== false
  })
    .eq('id', tripId)
    .eq('agency_id', guard.context.agencyId)
    .select('id')
    .maybeSingle()

  if (error) {
    return { success: false, error: error.message }
  }

  if (!trip) return { success: false, error: 'Trip not found in this agency' }

  revalidatePath('/dashboard/trips')
  return { success: true }
}

export async function deleteTrip(tripId: string) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return { success: true }

  const supabase = await createClient()
  const guard = await requireTravelSuperadmin()
  if (!guard.success) return guard

  // Check for active bookings
  const { count, error: countError } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('trip_id', tripId)
    .eq('agency_id', guard.context.agencyId)
    .neq('status', 'cancelled')

  if (countError) {
    return { success: false, error: 'Failed to verify active bookings' }
  }

  if (count && count > 0) {
    return { success: false, error: 'Cannot delete trip with active bookings.' }
  }

  const { data: trip, error } = await supabase
    .from('trips')
    .delete()
    .eq('id', tripId)
    .eq('agency_id', guard.context.agencyId)
    .select('id')
    .maybeSingle()

  if (error) {
    return { success: false, error: error.message }
  }

  if (!trip) return { success: false, error: 'Trip not found in this agency' }

  revalidatePath('/dashboard/trips')
  return { success: true }
}
