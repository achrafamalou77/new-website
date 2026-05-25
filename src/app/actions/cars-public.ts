// src/app/actions/cars-public.ts
'use server';

import { createClient } from '@/lib/supabase/server';

export interface CarFilters {
  brand?: string;
  model?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  car_type?: 'sell' | 'sur_command' | 'rental';
}

export async function getPublicCars(agencyId: string, filters?: CarFilters) {
  const supabase = await createClient();

  let query = supabase
    .from('car_sales_inventory')
    .select('id, stock_number, brand, model, year, variant, condition, mileage, selling_price, final_price, fuel_type, transmission, color_exterior, cover_image_url, images, status, featured, description, features, warranty_months')
    .eq('agency_id', agencyId)
    .eq('status', 'available')
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false }) as any;

  if (filters?.brand) query = query.eq('brand', filters.brand);
  if (filters?.model) query = query.eq('model', filters.model);
  if (filters?.condition) query = query.eq('condition', filters.condition);
  if (filters?.minPrice !== undefined && filters?.minPrice !== null) {
    query = query.gte('final_price', filters.minPrice);
  }
  if (filters?.maxPrice !== undefined && filters?.maxPrice !== null) {
    query = query.lte('final_price', filters.maxPrice);
  }
  if (filters?.minYear !== undefined && filters?.minYear !== null) {
    query = query.gte('year', filters.minYear);
  }
  if (filters?.maxYear !== undefined && filters?.maxYear !== null) {
    query = query.lte('year', filters.maxYear);
  }
  if (filters?.car_type) {
    query = query.eq('car_type', filters.car_type);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching public cars:', error);
    throw error;
  }
  return data || [];
}

export async function getPublicAgency(subdomain: string) {
  const supabase = await createClient();
  const { data, error } = await (supabase
    .from('agencies') as any)
    .select('*')
    .eq('subdomain', subdomain)
    .single();

  if (error) {
    console.error('Error fetching public agency:', error);
    return null;
  }

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
