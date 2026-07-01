import { z } from 'zod';

const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format').nullable().optional().transform(v => v ?? '#0f172a').default('#0f172a');
const phoneSchema = z.string().regex(/^\+213[0-9]{9}$/, 'Must be a valid Algerian phone number (+213XXXXXXXXX)').or(z.literal('')).nullable().optional().transform(v => v ?? '').default('');
const optionalUrlSchema = z.string().trim().url('Invalid URL').or(z.literal('')).nullable().optional().transform(v => v ?? '').default('');
const publicUrlSchema = z.preprocess(
  (value) => value == null ? '' : String(value).trim(),
  z.string()
    .max(1000, 'URL is too long')
    .refine((value) => value === '' || /^https?:\/\//i.test(value), 'Use a public http or https URL')
    .refine((value) => value === '' || !value.startsWith('data:'), 'Paste a hosted image URL, not a raw image file')
    .refine((value) => {
      if (value === '') return true
      try {
        new URL(value)
        return true
      } catch {
        return false
      }
    }, 'Invalid URL')
).default('');
const boundedText = (label: string, max = 250) => z.string().trim().max(max, `${label} is too long`).optional().default('');

export const businessHoursSchema = z.object({
  saturday: z.string().default('09:00 - 18:00'),
  sunday: z.string().default('09:00 - 18:00'),
  monday: z.string().default('09:00 - 18:00'),
  tuesday: z.string().default('09:00 - 18:00'),
  wednesday: z.string().default('09:00 - 18:00'),
  thursday: z.string().default('09:00 - 18:00'),
  friday: z.string().default('Closed'),
  show_on_website: z.boolean().optional().default(true)
});

export const socialMediaSchema = z.object({
  facebook: publicUrlSchema,
  instagram: publicUrlSchema,
  tiktok: publicUrlSchema,
  youtube: publicUrlSchema,
  twitter: publicUrlSchema,
  linkedin: publicUrlSchema
});

export const websiteConfigSchema = z.object({
  design: z.object({
    logo_url: optionalUrlSchema,
    favicon_url: optionalUrlSchema,
    primary_color: z.string().optional().default('#3b82f6'),
    secondary_color: z.string().optional().default('#1d4ed8'),
    text_color: z.string().optional().default('#1e293b'),
    bg_color: z.string().optional().default('#f8fafc'),
    card_bg_color: z.string().optional().default('#ffffff'),
    border_color: z.string().optional().default('#e2e8f0'),
    dark_mode_enabled: z.boolean().optional().default(false),
    font_family: z.string().optional().default('Inter'),
    heading_style: z.string().optional().default('Modern'),
    base_font_size: z.number().optional().default(16),
    border_radius: z.number().optional().default(12),
    card_shadow: z.string().optional().default('Soft'),
    card_shadow_enabled: z.boolean().optional().default(true),
    card_shadow_intensity: z.number().optional().default(4),
    section_spacing: z.string().optional().default('py-16'),
    section_spacing_val: z.number().optional().default(16),
    container_width: z.string().optional().default('max-w-7xl'),
    container_width_val: z.number().optional().default(1200),
    grid_columns: z.number().optional().default(3),
    grid_gap: z.number().optional().default(6),
    line_height: z.number().optional().default(1.5),
    letter_spacing: z.number().optional().default(0),
    button_shape: z.string().optional().default('Rounded'),
    button_style: z.string().optional().default('Filled'),
    button_size: z.string().optional().default('Medium'),
    enable_animations: z.boolean().optional().default(true),
    animation_speed: z.string().optional().default('Normal'),
    scroll_reveal: z.boolean().optional().default(true),
    stagger_children: z.boolean().optional().default(true),
    heading_size: z.number().optional().default(40),
    body_size: z.number().optional().default(16)
  }).optional().default({} as any),
  content: z.object({
    hero_bg_type: z.string().optional().default('Gradient'),
    hero_bg_url: optionalUrlSchema,
    hero_overlay: z.number().min(0).max(100).optional().default(30),
    hero_title: z.string().optional().default('Welcome to our Agency'),
    hero_subtitle: z.string().optional().default('Book your next dream vacation with us today. Best prices, expert guides, and 24/7 support.'),
    hero_cta_text: z.string().optional().default('Explore Our Trips'),
    hero_cta_link: z.string().optional().default('trips'),
    show_search_bar: z.boolean().optional().default(true),
    hero_height: z.string().optional().default('70vh'),
    show_logo_in_navbar: z.boolean().optional().default(true),
    show_agency_name_in_navbar: z.boolean().optional().default(true),
    navbar_style: z.string().optional().default('Glassmorphism'),
    sticky_navbar: z.boolean().optional().default(true),
    show_stats_bar: z.boolean().optional().default(true),
    show_why_choose_us: z.boolean().optional().default(true),
    show_testimonials: z.boolean().optional().default(true),
    show_newsletter: z.boolean().optional().default(false),
    show_contact_section: z.boolean().optional().default(true),
    show_footer: z.boolean().optional().default(true),
    footer_columns: z.number().optional().default(4),
    footer_col1_title: z.string().optional().default('About Us'),
    footer_col1_content: z.string().optional().default('We are a premier travel agency dedicated to providing unforgettable experiences.'),
    footer_col2_title: z.string().optional().default('Quick Links'),
    footer_col3_title: z.string().optional().default('Contact'),
    footer_col4_title: z.string().optional().default('Newsletter'),
    show_social_icons: z.boolean().optional().default(true),
    copyright_text: z.string().optional().default('All rights reserved.'),
    show_powered_by: z.boolean().optional().default(true),
    section_order: z.array(z.string()).optional().default(['Hero', 'Stats', 'Why Choose Us', 'Trips', 'Testimonials', 'Footer']),
    hero_badge_text: z.string().optional().default('🌴 EXCLUSIVE VACATIONS'),
    hero_primary_cta_text: z.string().optional().default('Explore Catalog'),
    hero_secondary_cta_text: z.string().optional().default('Contact Us'),
    stats_cards: z.array(z.object({
      number: z.string().optional().default(''),
      label: z.string().optional().default(''),
      icon: z.string().optional().default('Clock')
    })).optional().default([]),
    why_choose_us_cards: z.array(z.object({
      icon: z.string().optional().default('Compass'),
      title: z.string().optional().default(''),
      description: z.string().optional().default('')
    })).optional().default([]),
    testimonials: z.array(z.object({
      name: z.string().optional().default(''),
      location: z.string().optional().default(''),
      quote: z.string().optional().default(''),
      rating: z.number().optional().default(5),
      avatar: z.string().optional().default('')
    })).optional().default([]),
    footer_col1_links: z.array(z.object({ text: z.string(), url: z.string() })).optional().default([]),
    footer_col2_links: z.array(z.object({ text: z.string(), url: z.string() })).optional().default([]),
    footer_col3_links: z.array(z.object({ text: z.string(), url: z.string() })).optional().default([]),
    footer_col4_links: z.array(z.object({ text: z.string(), url: z.string() })).optional().default([]),
    footer_social_facebook: z.string().optional().default(''),
    footer_social_instagram: z.string().optional().default(''),
    footer_social_whatsapp: z.string().optional().default(''),
    footer_social_enabled: z.boolean().optional().default(true)
  }).optional().default({} as any),
  trips_display: z.object({
    card_style: z.string().optional().default('Standard'),
    show_trip_image: z.boolean().optional().default(true),
    image_aspect_ratio: z.string().optional().default('16:9'),
    show_duration_badge: z.boolean().optional().default(true),
    show_price: z.boolean().optional().default(true),
    show_original_price: z.boolean().optional().default(true),
    show_savings_badge: z.boolean().optional().default(true),
    show_destination: z.boolean().optional().default(true),
    show_description: z.boolean().optional().default(true),
    description_length: z.number().optional().default(120),
    price_format: z.string().optional().default('12,000,000 DZD'),
    book_now_style: z.string().optional().default('Solid filled'),
    book_now_text: z.string().optional().default('Book Now'),
    modal_style: z.string().optional().default('Center modal'),
    show_image_gallery: z.boolean().optional().default(true),
    show_itinerary: z.boolean().optional().default(true),
    show_inclusions: z.boolean().optional().default(true),
    show_exclusions: z.boolean().optional().default(true),
    show_terms: z.boolean().optional().default(true),
    show_similar_trips: z.boolean().optional().default(true),
    enable_search: z.boolean().optional().default(true),
    enable_filter_destination: z.boolean().optional().default(true),
    enable_filter_price: z.boolean().optional().default(true),
    enable_filter_duration: z.boolean().optional().default(true),
    default_sort: z.string().optional().default('Newest first'),
    cards_per_row: z.number().optional().default(3),
    show_share_button: z.boolean().optional().default(true),
    show_book_now_button: z.boolean().optional().default(true)
  }).optional().default({} as any),
  seo: z.object({
    page_title: z.string().optional().default('Travel Agency'),
    meta_description: z.string().optional().default('Book your next vacation.'),
    keywords: z.array(z.string()).optional().default([]),
    keywords_tags: z.array(z.string()).optional().default([]),
    og_image: optionalUrlSchema,
    og_image_upload: z.string().optional().default(''),
    favicon: z.string().optional().default(''),
    twitter_card_style: z.string().optional().default('Summary Large Image'),
    google_analytics_id: z.string().optional().default(''),
    facebook_pixel_id: z.string().optional().default(''),
    google_search_console: z.string().optional().default('')
  }).optional().default({} as any),
  advanced: z.object({
    custom_header_scripts: z.string().optional().default(''),
    custom_footer_scripts: z.string().optional().default(''),
    password_protection: z.boolean().optional().default(false),
    password_hash: z.string().optional().default(''),
    maintenance_mode: z.boolean().optional().default(false),
    maintenance_message: z.string().optional().default('We are currently updating our website.'),
    cookie_consent: z.boolean().optional().default(false),
    cookie_message: z.string().optional().default('We use cookies.'),
    publish_status: z.enum(['draft', 'published', 'maintenance']).optional().default('published')
  }).passthrough().optional().default({} as any)
}).passthrough();

export const chatbotConfigSchema = z.object({
  personality: z.object({
    bot_name: z.string().max(100).optional().default('Assistant'),
    bot_avatar: optionalUrlSchema,
    bot_greeting: z.string().max(500).optional().default('Hello! How can I help you?'),
    bot_farewell: z.string().max(500).optional().default('Goodbye!'),
    typing_indicator_text: z.string().max(50).optional().default('typing...'),
    response_tone: z.string().optional().default('Friendly & Casual'),
    language_style: z.string().optional().default('Algerian Darja'),
    formality_level: z.number().min(0).max(100).optional().default(50),
    use_emojis: z.boolean().optional().default(true),
    emoji_style: z.string().optional().default('Moderate'),
    greeting_language: z.string().optional().default('Auto-detect')
  }).optional().default({} as any),
  behavior: z.object({
    response_speed: z.number().min(0).max(10).optional().default(2),
    max_message_length: z.number().min(1).max(5).optional().default(3),
    follow_up_questions: z.boolean().optional().default(true),
    proactive_messages: z.boolean().optional().default(true),
    proactive_delay: z.number().min(0).max(60).optional().default(10),
    auto_qualify_leads: z.boolean().optional().default(true),
    required_info_before_handoff: z.array(z.string()).optional().default([]),
    auto_handoff_trigger: z.string().optional().default('On complex question'),
    handoff_message: z.string().max(200).optional().default('Connecting with a human...'),
    working_hours_auto_handoff: z.boolean().optional().default(false),
    human_queue_message: z.string().max(200).optional().default('Agent will be with you shortly.')
  }).optional().default({} as any),
  knowledge: z.object({
    allowed_trips: z.array(z.string().uuid()).optional().default([]),
    featured_trip: z.string().uuid().or(z.literal('')).optional().default(''),
    pricing_rules: z.string().max(1000).optional().default('')
  }).optional().default({} as any),
  appearance: z.object({
    widget_position: z.string().optional().default('Bottom-right'),
    widget_size: z.string().optional().default('Standard'),
    widget_color: hexColorSchema,
    widget_header_text: z.string().max(50).optional().default('Chat with us'),
    widget_icon: z.string().optional().default('MessageCircle'),
    open_on_load: z.boolean().optional().default(false),
    open_delay: z.number().min(0).max(60).optional().default(5),
    bot_bubble_color: hexColorSchema,
    bot_text_color: hexColorSchema,
    user_bubble_color: hexColorSchema,
    user_text_color: hexColorSchema,
    bubble_shape: z.string().optional().default('Rounded'),
    show_timestamps: z.boolean().optional().default(true),
    show_read_receipts: z.boolean().optional().default(true),
    launcher_style: z.string().optional().default('Floating button'),
    launcher_text: z.string().max(30).optional().default('Chat with us'),
    launcher_badge: z.boolean().optional().default(true)
  }).optional().default({} as any),
  advanced: z.object({
    ai_model: z.string().optional().default('Gemini 3.1 Pro'),
    creativity_level: z.number().min(0).max(100).optional().default(70),
    max_response_tokens: z.number().min(50).max(2000).optional().default(500),
    enable_voice_notes: z.boolean().optional().default(true),
    voice_transcription: z.boolean().optional().default(true),
    show_transcript: z.boolean().optional().default(true),
    voice_reply: z.boolean().optional().default(false),
    show_conversation_stats: z.boolean().optional().default(true)
  }).optional().default({} as any)
}).passthrough();

export const agencyInfoSchema = z.object({
  company_name: z.string().trim().min(2, 'Business name is required').max(120, 'Business name is too long'),
  phone: phoneSchema.refine((value) => value.length > 0, 'Business phone is required'),
  whatsapp_phone: phoneSchema,
  email: z.string().trim().email('Enter a valid business email').max(160, 'Business email is too long'),
  address: boundedText('Address', 500),
  logo_url: publicUrlSchema,
  currency: z.enum(['DZD', 'EUR', 'USD', 'SAR', 'AED']).optional().default('DZD'),
  payment_info: z.object({
    ccp_account: boundedText('CCP account', 80),
    bank_name: boundedText('Bank name', 120),
    bank_account: boundedText('Bank account', 120),
    rib: boundedText('RIB', 120),
    payment_notes: boundedText('Payment notes', 600)
  }).optional().default({} as any),
  bank_integrations: z.record(z.string(), z.boolean()).optional().default({}),
  business_hours: businessHoursSchema.optional().default({} as any),
  social_media: socialMediaSchema.optional().default({} as any)
});
