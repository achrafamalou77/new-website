// src/app/actions/contact.ts
'use server';

import { createClient } from '@/lib/supabase/server';

export interface ContactFormData {
  name: string;
  phone: string;
  email?: string;
  message: string;
}

export async function submitContactForm(data: ContactFormData, agencyId: string) {
  const supabase = await createClient();

  // 1. Try to save to contacts table (graceful catch if table doesn't exist)
  try {
    const { error: contactError } = await (supabase.from('contacts')).insert({
      agency_id: agencyId,
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      message: data.message,
      source: 'website_contact_form',
      status: 'new',
      created_at: new Date().toISOString(),
    } as any);
    if (contactError) {
      console.warn("Contacts table insert failed, falling back to conversations:", contactError.message);
    }
  } catch (err) {
    console.warn("Contacts table insert failed, falling back to conversations:", err);
  }

  // 2. Insert or create conversation for the employee dashboard inbox
  const { error: convError } = await (supabase.from('conversations')).insert({
    agency_id: agencyId,
    customer_name: data.name,
    customer_phone: data.phone,
    platform: 'website',
    status: 'unread',
    lead_score: 'WARM',
    last_message: data.message,
    last_message_at: new Date().toISOString(),
  } as any);

  if (convError) {
    console.error("Conversation insert failed:", convError.message);
    return { success: false, error: convError.message };
  }

  return { success: true };
}
