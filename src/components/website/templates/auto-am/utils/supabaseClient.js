import { createClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const getVehicles = unstable_cache(
  async () => {
    const { data, error } = await supabase.from('vehicles').select('*');
    if (error) {
      console.warn(`Avertissement (getVehicles): ${error.message}`);
      return [];
    }
    return data || [];
  },
  ['vehicles-list'],
  { tags: ['vehicles'], revalidate: 60 }
);

export const getVehicleById = unstable_cache(
  async (id) => {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.warn(`Avertissement (getVehicleById): ${error.message}`);
      return null;
    }
    return data;
  },
  ['vehicle-detail'],
  { tags: ['vehicles'], revalidate: 60 }
);

export async function getOrders() {
  const { data, error } = await supabase.from('orders').select('*');
  if (error) {
    console.warn(`Avertissement (getOrders): ${error.message}`);
    return [];
  }
  return data || [];
}

export async function addVehicle(vehicleData) {
  const { data, error } = await supabase
    .from('vehicles')
    .insert([vehicleData])
    .select();

  if (error) {
    console.error('Error inserting vehicle:', error);
    throw error;
  }
  return data;
}

export async function uploadVehicleImage(file) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('vehicle-images')
    .upload(fileName, file, { cacheControl: '3600', upsert: false });
    
  if (error) {
    throw error;
  }
  
  const { data: publicUrlData } = supabase.storage
    .from('vehicle-images')
    .getPublicUrl(fileName);
    
  return publicUrlData.publicUrl;
}

export async function updateVehicle(id, vehicleData) {
  const { data, error } = await supabase
    .from('vehicles')
    .update(vehicleData)
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error updating vehicle:', error);
    throw error;
  }
  return data;
}

export async function deleteVehicle(id) {
  // 1. Fetch Target Images Before Deletion
  const { data: vehicleData } = await supabase
    .from('vehicles')
    .select('images')
    .eq('id', id)
    .single();

  // 2. Parse Storage Paths
  if (vehicleData && vehicleData.images && Array.isArray(vehicleData.images)) {
    const pathsToRemove = vehicleData.images
      .map(url => {
        try {
          const parts = url.split('vehicle-images/');
          return parts.length > 1 ? parts[1] : null;
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean);

    // 3. Execute Storage Cleanup
    if (pathsToRemove.length > 0) {
      try {
        await supabase.storage.from('vehicle-images').remove(pathsToRemove);
        console.log('Images extraites et supprimées du bucket:', pathsToRemove);
      } catch (storageError) {
        console.error('Info: Échec mineur lors du nettoyage du bucket (ignoré):', storageError);
      }
    }
  }

  // 4. Execute Database Deletion
  const { data, error } = await supabase
    .from('vehicles')
    .delete()
    .eq('id', id)
    .select();

  console.log("Delete Response:", { data, error });

  if (error) {
    console.error("Delete Error:", error);
    throw error;
  }

  if (!data || data.length === 0) {
    // If the image was deleted but the row wasn't, you might have out-of-sync data if not careful, 
    // but the user only wanted one-way cleanup.
    throw new Error("Supabase a bloqué la suppression (0 lignes affectées). Vos règles RLS bloquent l'accès, ou l'ID est introuvable.");
  }
  
  return true;
}

export async function createOrder(orderData) {
  const { data, error } = await supabase
    .from('orders')
    .insert([orderData])
    .select();

  if (error) {
    console.error('Error creating order:', error);
    throw error;
  }
  return data;
}

export async function updateOrder(id, orderData) {
  const { data, error } = await supabase
    .from('orders')
    .update(orderData)
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error updating order:', error);
    throw error;
  }
  return data;
}

export async function loginAdmin(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }
  return data;
}

export async function logoutAdmin() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Logout Error:", error);
  }
}

/**
 * Smart multi-factor similar vehicles.
 * Priority: 1) same make  2) same bodyType  3) similar price ±30%  4) any other
 * Always returns up to `limit` vehicles, never the current one.
 */
export async function getSimilarVehicles(vehicle, limit = 3) {
  const found = [];
  const seenIds = new Set([vehicle.id]);

  const addResults = (rows) => {
    for (const row of rows || []) {
      if (found.length >= limit) break;
      if (seenIds.has(row.id)) continue;
      seenIds.add(row.id);
      found.push(row);
    }
  };

  try {
    // Priority 1 — Same make (brand)
    if (vehicle.make) {
      const { data } = await supabase
        .from('vehicles')
        .select('*')
        .eq('make', vehicle.make)
        .neq('id', vehicle.id)
        .limit(limit);
      addResults(data);
    }

    // Priority 2 — Same bodyType (SUV, Berline, etc.)
    if (found.length < limit && vehicle.bodyType) {
      const { data } = await supabase
        .from('vehicles')
        .select('*')
        .eq('bodyType', vehicle.bodyType)
        .neq('id', vehicle.id)
        .limit(limit);
      addResults(data);
    }

    // Priority 3 — Similar price range (±30%)
    if (found.length < limit && vehicle.price) {
      const minPrice = Math.round(vehicle.price * 0.7);
      const maxPrice = Math.round(vehicle.price * 1.3);
      const { data } = await supabase
        .from('vehicles')
        .select('*')
        .neq('id', vehicle.id)
        .gte('price', minPrice)
        .lte('price', maxPrice)
        .limit(limit);
      addResults(data);
    }

    // Priority 4 — Fallback: any other vehicles
    if (found.length < limit) {
      const { data } = await supabase
        .from('vehicles')
        .select('*')
        .neq('id', vehicle.id)
        .limit(limit);
      addResults(data);
    }
  } catch (err) {
    console.warn(`Avertissement (getSimilarVehicles): ${err.message}`);
  }

  return found;
}

export async function addNewsletterEmail(email) {
  const { data, error } = await supabase
    .from('newsletter_emails')
    .insert([{ email }])
    .select();

  if (error) {
    console.error('Newsletter insert error:', error);
    throw error;
  }
  return data;
}
