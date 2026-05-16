import { Database } from '@/types/database'

export type Conversation = Database['public']['Tables']['conversations']['Row']
export type Message = Database['public']['Tables']['messages']['Row']

const AGENCY_ID = '00000000-0000-0000-0000-000000000000'

export const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    agency_id: AGENCY_ID,
    customer_phone: '+213555123456',
    customer_name: 'Achraf',
    platform: 'whatsapp',

    lead_score: 'HOT',
    lead_summary: 'Interested in Turkey package for next week.',
    ai_status: true,
    last_message_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(), // 2 mins ago
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: 'conv-2',
    agency_id: AGENCY_ID,
    customer_phone: '+213770987654',
    customer_name: 'Sarah',
    platform: 'instagram',

    lead_score: 'HOT',
    lead_summary: 'Asking for Umrah visa details urgently.',
    ai_status: false,
    last_message_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'conv-3',
    agency_id: AGENCY_ID,
    customer_phone: '+213661112233',
    customer_name: 'Mourad',
    platform: 'facebook',

    lead_score: 'HOT',
    lead_summary: 'Wants to book Tunisia hotel for family.',
    ai_status: true,
    last_message_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: 'conv-4',
    agency_id: AGENCY_ID,
    customer_phone: '+213550223344',
    customer_name: 'Fatima',
    platform: 'whatsapp',

    lead_score: 'WARM',
    lead_summary: 'Asking for summer beach prices in Bejaia.',
    ai_status: true,
    last_message_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
  },
  {
    id: 'conv-5',
    agency_id: AGENCY_ID,
    customer_phone: '+213771556677',
    customer_name: 'Karim',
    platform: 'whatsapp',

    lead_score: 'WARM',
    lead_summary: 'Wants to know if there are group discounts for Turkey.',
    ai_status: true,
    last_message_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: 'conv-6',
    agency_id: AGENCY_ID,
    customer_phone: '+213662998877',
    customer_name: 'Yasmine',
    platform: 'instagram',

    lead_score: 'WARM',
    lead_summary: 'Inquiring about available dates for Malaysia.',
    ai_status: false,
    last_message_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: 'conv-7',
    agency_id: AGENCY_ID,
    customer_phone: '+213554443322',
    customer_name: 'Nassim',
    platform: 'facebook',

    lead_score: 'COLD',
    lead_summary: 'Just asking for address.',
    ai_status: true,
    last_message_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: 'conv-8',
    agency_id: AGENCY_ID,
    customer_phone: '+213775112233',
    customer_name: 'Amine',
    platform: 'whatsapp',

    lead_score: 'COLD',
    lead_summary: 'Sent a sticker.',
    ai_status: true,
    last_message_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48 * 2).toISOString(),
  },
]

export const mockMessages: Message[] = [
  // Conversation 1 - HOT
  {
    id: 'msg-1',
    conversation_id: 'conv-1',
    sender_type: 'customer',
    content: 'Salam, ch7al voyage Turquie la semaine prochaine pour 2 personnes?',
    media_url: null,
    is_voice_note: false,
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 'msg-2',
    conversation_id: 'conv-1',
    sender_type: 'ai',
    content: 'وعليكم السلام أشرف! رحلات تركيا الأسبوع القادم تبدأ من 120,000 دج للشخص. هل تريد فندق 4 أو 5 نجوم؟',
    media_url: null,
    is_voice_note: false,
    created_at: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
  },
  {
    id: 'msg-3',
    conversation_id: 'conv-1',
    sender_type: 'customer',
    content: 'Voice Note (0:15) - "Khouya bghit 5 étoiles ida kayna f Istanbul, w choufli les dates exactes stp."',
    media_url: 'https://example.com/audio.mp3',
    is_voice_note: true,
    created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
  },
  
  // Conversation 2 - HOT
  {
    id: 'msg-4',
    conversation_id: 'conv-2',
    sender_type: 'customer',
    content: 'Salam, 3andi dossier ta3 Umrah w rani mzoorba shwiya. Ya9der yekhredj visa f 3 ayam?',
    media_url: null,
    is_voice_note: false,
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },

  // Conversation 3 - HOT
  {
    id: 'msg-5',
    conversation_id: 'conv-3',
    sender_type: 'customer',
    content: 'Bonjour, nsaksik 3la les hôtels f Sousse pour 4 personnes (2 enfants).',
    media_url: null,
    is_voice_note: false,
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
]

export type Trip = Database['public']['Tables']['trips']['Row']
export type Booking = Database['public']['Tables']['bookings']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']

export const mockTrips: Trip[] = [
  {
    id: 'trip-1',
    agency_id: AGENCY_ID,
    title: 'Istanbul & Bursa Summer Tour',
    description: 'A 7-day tour covering the best of Istanbul and Bursa with 4-star hotels.',
    price: 150000,
    destination: 'Turkey',
    duration_days: 7,
    image_urls: ['https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&auto=format&fit=crop'],
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'trip-2',
    agency_id: AGENCY_ID,
    title: 'VIP Umrah Package 15 Days',
    description: 'Luxury Umrah package with 5-star hotels near Haram.',
    price: 320000,
    destination: 'Saudi Arabia',
    duration_days: 15,
    image_urls: ['https://images.unsplash.com/photo-1565552643952-b50458f2762a?w=800&auto=format&fit=crop'],
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'trip-3',
    agency_id: AGENCY_ID,
    title: 'Tunisia Sousse Beach Holiday',
    description: 'Affordable family vacation in Sousse with all-inclusive resorts.',
    price: 65000,
    destination: 'Tunisia',
    duration_days: 5,
    image_urls: ['https://images.unsplash.com/photo-1589883661923-6476cb0ae9f2?w=800&auto=format&fit=crop'],
    is_active: true,
    created_at: new Date().toISOString(),
  },
]

export const mockBookings: Booking[] = [
  {
    id: 'book-1',
    agency_id: AGENCY_ID,
    conversation_id: 'conv-1',
    trip_id: 'trip-1',
    client_manifest: { name: 'Achraf Benali', email: 'achraf@example.com', adults: 2, children: 0 },
    status: 'pending_payment',
    total_price: 300000,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'book-2',
    agency_id: AGENCY_ID,
    conversation_id: 'conv-2',
    trip_id: 'trip-2',
    client_manifest: { name: 'Sarah', phone: '+213770987654', adults: 1, children: 0 },
    status: 'completed',
    total_price: 320000,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: 'book-3',
    agency_id: AGENCY_ID,
    conversation_id: 'conv-3',
    trip_id: 'trip-3',
    client_manifest: { name: 'Mourad', adults: 2, children: 2 },
    status: 'cancelled',
    total_price: 195000,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
]

export const mockProfiles: Profile[] = [
  {
    id: 'prof-1',
    agency_id: AGENCY_ID,
    full_name: 'Super Admin User',
    role: 'superadmin',
    phone: '+213555000000',
    created_at: new Date().toISOString(),
  },
  {
    id: 'prof-2',
    agency_id: AGENCY_ID,
    full_name: 'Employee One',
    role: 'employee',
    phone: null,
    created_at: new Date().toISOString(),
  },
]
