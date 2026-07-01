'use server';
import { createClient } from '@/lib/supabase/server';

export type CarFilters = {
  brand?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  car_type?: 'sell' | 'sur_command' | 'rental';
};

export type ContactFormData = {
  name: string;
  phone: string;
  email?: string;
  message?: string;
};

export async function getPublicCars(agencyId: string, filters?: CarFilters) {
  const supabase = await createClient();
  const isRental = filters?.car_type === 'rental';
  const tableName = isRental ? 'car_rental_fleet' : 'car_sales_inventory';

  let query = supabase
    .from(tableName)
    .select('*')
    .eq('agency_id', agencyId)
    .eq('status', 'available')
    .order('created_at', { ascending: false });

  if (filters?.brand) query = query.eq('brand', filters.brand);

  const { data, error } = await query;
  if (error) throw error;

  // Map and flatten specs JSONB onto the root so the public templates can read them flat
  const flattened = (data || []).map((car: any) => {
    const specs = car.specs || {}
    return {
      ...car,
      ...specs,
      // Fallback aliases for frontend/template compatibility
      color_exterior: car.color || specs.color_exterior || '',
      selling_price: isRental ? (car.daily_rate || car.price || specs.selling_price || 0) : (car.price || specs.selling_price || 0),
      purchase_price: car.cost_price || specs.purchase_price || 0,
      car_type: isRental ? 'rental' : (car.car_type || car.type || specs.car_type || 'sell'),
      condition: specs.condition || 'new',
      show_on_website: specs.show_on_website !== false,
    }
  })

  // Apply visibility and other specs-based filters in JavaScript
  let filteredData = flattened.filter(car => car.show_on_website !== false);

  if (filters?.condition) {
    filteredData = filteredData.filter(car => car.condition === filters.condition);
  }
  if (filters?.car_type) {
    filteredData = filteredData.filter(car => car.car_type === filters.car_type);
  }
  if (filters?.minPrice !== undefined && filters?.minPrice !== null) {
    filteredData = filteredData.filter(car => (car.final_price || car.selling_price || 0) >= Number(filters.minPrice));
  }
  if (filters?.maxPrice !== undefined && filters?.maxPrice !== null) {
    filteredData = filteredData.filter(car => (car.final_price || car.selling_price || 0) <= Number(filters.maxPrice));
  }
  if (filters?.minYear !== undefined && filters?.minYear !== null) {
    filteredData = filteredData.filter(car => car.year >= Number(filters.minYear));
  }
  if (filters?.maxYear !== undefined && filters?.maxYear !== null) {
    filteredData = filteredData.filter(car => car.year <= Number(filters.maxYear));
  }

  // Sort by featured (which is stored in specs!) in JavaScript
  filteredData.sort((a, b) => {
    const aFeat = a.featured === true || a.featured === 'true' ? 1 : 0
    const bFeat = b.featured === true || b.featured === 'true' ? 1 : 0
    return bFeat - aFeat;
  })

  return filteredData;
}

export async function getPublicAgency(subdomain: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('agencies')
    .select('*')
    .eq('subdomain', subdomain)
    .single();
  if (error) throw error;

  const settings = (data as any).website_settings || {};
  const config = (data as any).website_config || {};
  const agencyData = (data as any) || {};

  return {
    ...agencyData,
    name: agencyData.company_name,
    phone: settings.phone || config.content?.phone || '0560 00 31 02',
    email: settings.email || config.content?.email || 'contact@amineauto.dz',
    address: settings.address || config.content?.address || 'Boumerdes, Algérie',
    logo_url: settings.logo_url || '/images/logo.png',
  };
}

export async function submitContactForm(formData: ContactFormData, agencyId: string) {
  const supabase = await createClient();

  // 1. Find or create the client
  let clientId: string | null = null
  const { data: existingClient } = await (supabase.from('clients') as any)
    .select('id')
    .eq('agency_id', agencyId)
    .eq('phone', formData.phone)
    .maybeSingle()

  if (existingClient) {
    clientId = existingClient.id
  } else {
    const { data: newClient } = await (supabase.from('clients') as any).insert({
      agency_id: agencyId,
      full_name: formData.name,
      phone: formData.phone,
      email: formData.email || null,
      source: 'website_contact_form',
    }).select('id').single()
    clientId = newClient?.id || null
  }

  // 2. Save to contacts
  await (supabase.from('contacts')).insert({
    agency_id: agencyId,
    name: formData.name,
    phone: formData.phone,
    email: formData.email || null,
    message: formData.message,
    source: 'website_contact_form',
    status: 'new',
  });

  // 3. Create conversation for inbox (only if we have a client)
  if (clientId) {
    await (supabase.from('conversations') as any).insert({
      agency_id: agencyId,
      client_id: clientId,
      customer_name: formData.name,
      customer_phone: formData.phone,
      platform: 'website',
      unread: true,
      lead_score: 'warm',
      lead_summary: formData.message || 'Nouveau contact via le formulaire du site',
      last_message_at: new Date().toISOString(),
    });
  }

  return { success: true };
}
