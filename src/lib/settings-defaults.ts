import { WebsiteConfig, ChatbotConfig, BusinessHours, SocialMedia } from '@/types/settings';

export const defaultBusinessHours: BusinessHours = {
  saturday: '09:00 - 18:00',
  sunday: '09:00 - 18:00',
  monday: '09:00 - 18:00',
  tuesday: '09:00 - 18:00',
  wednesday: '09:00 - 18:00',
  thursday: '09:00 - 18:00',
  friday: 'Closed',
  show_on_website: true
};

export const defaultSocialMedia: SocialMedia = {
  facebook: '',
  instagram: '',
  tiktok: '',
  youtube: '',
  twitter: '',
  linkedin: ''
};

export const colorPresets = [
  {
    name: 'Travel Blue',
    primary_color: '#3b82f6',
    secondary_color: '#1d4ed8',
    text_color: '#1e293b',
    bg_color: '#f8fafc',
    card_bg_color: '#ffffff',
    border_color: '#e2e8f0'
  },
  {
    name: 'Desert Orange',
    primary_color: '#f97316',
    secondary_color: '#c2410c',
    text_color: '#1e293b',
    bg_color: '#fffaf5',
    card_bg_color: '#ffffff',
    border_color: '#fed7aa'
  },
  {
    name: 'Forest Green',
    primary_color: '#10b981',
    secondary_color: '#047857',
    text_color: '#0f172a',
    bg_color: '#f4fbf7',
    card_bg_color: '#ffffff',
    border_color: '#a7f3d0'
  },
  {
    name: 'Royal Purple',
    primary_color: '#8b5cf6',
    secondary_color: '#6d28d9',
    text_color: '#1e293b',
    bg_color: '#faf5ff',
    card_bg_color: '#ffffff',
    border_color: '#e9d5ff'
  },
  {
    name: 'Sunset Red',
    primary_color: '#ef4444',
    secondary_color: '#b91c1c',
    text_color: '#1e293b',
    bg_color: '#fff5f5',
    card_bg_color: '#ffffff',
    border_color: '#fee2e2'
  }
];

export const getDefaultWebsiteConfig = (agencyName: string): WebsiteConfig => ({
  design: {
    logo_url: '',
    favicon_url: '',
    primary_color: '#3b82f6',
    secondary_color: '#1d4ed8',
    text_color: '#1e293b',
    bg_color: '#f8fafc',
    card_bg_color: '#ffffff',
    border_color: '#e2e8f0',
    dark_mode_enabled: false,
    font_family: 'Inter',
    heading_style: 'Modern',
    base_font_size: 16,
    border_radius: 12,
    card_shadow: 'Soft',
    card_shadow_enabled: true,
    card_shadow_intensity: 4,
    section_spacing: 'py-16',
    section_spacing_val: 16,
    container_width: 'max-w-7xl',
    container_width_val: 1200,
    grid_columns: 3,
    grid_gap: 6,
    line_height: 1.5,
    letter_spacing: 0,
    button_shape: 'Rounded',
    button_style: 'Filled',
    button_size: 'Medium',
    enable_animations: true,
    animation_speed: 'Normal',
    scroll_reveal: true,
    stagger_children: true,
    heading_size: 40,
    body_size: 16
  },
  content: {
    hero_bg_type: 'Gradient',
    hero_bg_url: '',
    hero_overlay: 30,
    hero_title: `Welcome to ${agencyName || 'our Agency'}`,
    hero_subtitle: 'Book your next dream vacation with us today. Best prices, expert guides, and 24/7 support.',
    hero_cta_text: 'Explore Our Trips',
    hero_cta_link: 'trips',
    show_search_bar: true,
    hero_height: '70vh',
    show_logo_in_navbar: true,
    show_agency_name_in_navbar: true,
    navbar_style: 'Glassmorphism',
    sticky_navbar: true,
    show_stats_bar: true,
    show_why_choose_us: true,
    show_testimonials: true,
    show_newsletter: false,
    show_contact_section: true,
    show_footer: true,
    footer_columns: 4,
    footer_col1_title: 'About Us',
    footer_col1_content: 'We are a premier travel agency dedicated to providing unforgettable experiences.',
    footer_col2_title: 'Quick Links',
    footer_col3_title: 'Contact',
    footer_col4_title: 'Newsletter',
    show_social_icons: true,
    copyright_text: `© 2026 ${agencyName || 'Agency'}. All rights reserved.`,
    show_powered_by: true,
    section_order: ['Hero', 'Stats', 'Why Choose Us', 'Trips', 'Testimonials', 'Footer'],
    hero_badge_text: '🌴 EXCLUSIVE VACATIONS',
    hero_primary_cta_text: 'Explore Catalog',
    hero_secondary_cta_text: 'Contact Us',
    stats_cards: [
      { number: '15+', label: 'Years Experience', icon: 'Clock' },
      { number: '12k+', label: 'Happy Customers', icon: 'Users' },
      { number: '250+', label: 'Premium Destinies', icon: 'Globe' },
      { number: '5.0', label: 'Overall Rating', icon: 'Sparkles' }
    ],
    why_choose_us_cards: [
      { icon: 'Compass', title: 'Curated Itineraries', description: 'Handcrafted travels with the best accommodation and certified guides.' },
      { icon: 'Shield', title: 'Secure Operations', description: 'Complete security guarantees and flexible cancellations for peace of mind.' },
      { icon: 'HeartHandshake', title: '24/7 Dedicated Support', description: 'Our custom support team is there for you on WhatsApp whenever you need us.' }
    ],
    testimonials: [
      { name: 'Achraf Amalou', location: 'Algiers', quote: 'The Sahara tour was life-changing! Everything was perfectly handled by the chatbot and staff.', rating: 5, avatar: 'AA' },
      { name: 'Sarah Benzineb', location: 'Oran', quote: 'Excellent beach vacation in Bejaia. Very simple booking portal. 10/10 recommendation!', rating: 5, avatar: 'SB' },
      { name: 'Mourad Belkacem', location: 'Constantine', quote: 'Fast support and clear itineraries. Standard Aventra trip cards show all prices correctly.', rating: 4, avatar: 'MB' }
    ],
    footer_col1_links: [
      { text: 'About Us', url: '#about' },
      { text: 'Careers', url: '#careers' },
      { text: 'Press Center', url: '#press' }
    ],
    footer_col2_links: [
      { text: 'Trips Catalog', url: '#trips' },
      { text: 'Special Offers', url: '#offers' },
      { text: 'Group Bookings', url: '#groups' }
    ],
    footer_col3_links: [
      { text: 'Help Center', url: '#help' },
      { text: 'Safety Guidelines', url: '#safety' },
      { text: 'Terms of Service', url: '#terms' }
    ],
    footer_col4_links: [
      { text: 'WhatsApp Chat', url: '#whatsapp' },
      { text: 'Instagram Feed', url: '#instagram' },
      { text: 'Contact Us', url: '#contact' }
    ],
    footer_social_facebook: 'https://facebook.com',
    footer_social_instagram: 'https://instagram.com',
    footer_social_whatsapp: '+213555123456',
    footer_social_enabled: true
  },
  trips_display: {
    card_style: 'Standard',
    show_trip_image: true,
    image_aspect_ratio: '16:9',
    show_duration_badge: true,
    show_price: true,
    show_original_price: true,
    show_savings_badge: true,
    show_destination: true,
    show_description: true,
    description_length: 120,
    price_format: '12,000,000 DZD',
    book_now_style: 'Solid filled',
    book_now_text: 'Book Now',
    modal_style: 'Center modal',
    show_image_gallery: true,
    show_itinerary: true,
    show_inclusions: true,
    show_exclusions: true,
    show_terms: true,
    show_similar_trips: true,
    enable_search: true,
    enable_filter_destination: true,
    enable_filter_price: true,
    enable_filter_duration: true,
    default_sort: 'Newest first',
    cards_per_row: 3,
    show_share_button: true,
    show_book_now_button: true
  },
  seo: {
    page_title: `${agencyName || 'Agency'} — Best Travel Agency`,
    meta_description: 'Book unforgettable trips and custom vacations with us today.',
    keywords: ['travel', 'vacation', 'booking', 'algeria'],
    keywords_tags: ['Travel', 'Algeria', 'SaaS', 'Vacations'],
    og_image: '',
    og_image_upload: '',
    favicon: '',
    twitter_card_style: 'Summary Large Image',
    google_analytics_id: '',
    facebook_pixel_id: '',
    google_search_console: ''
  },
  advanced: {
    custom_header_scripts: '',
    custom_footer_scripts: '',
    password_protection: false,
    password_hash: '',
    maintenance_mode: false,
    maintenance_message: 'We are currently updating our website. Please check back later!',
    cookie_consent: false,
    cookie_message: 'We use cookies to ensure you get the best experience on our website.',
    publish_status: 'published'
  }
});

export const getDefaultChatbotConfig = (agencyName: string): ChatbotConfig => ({
  personality: {
    bot_name: `${agencyName || 'Agency'} Assistant`,
    bot_avatar: '',
    bot_greeting: 'Hello! How can I help you plan your next trip?',
    bot_farewell: 'Thank you for chatting with us! Have a great day.',
    typing_indicator_text: 'typing...',
    response_tone: 'Friendly & Casual',
    language_style: 'Algerian Darja',
    formality_level: 50,
    use_emojis: true,
    emoji_style: 'Moderate',
    greeting_language: 'Auto-detect'
  },
  behavior: {
    response_speed: 2,
    max_message_length: 3,
    follow_up_questions: true,
    proactive_messages: true,
    proactive_delay: 10,
    auto_qualify_leads: true,
    required_info_before_handoff: ['Name', 'Phone'],
    auto_handoff_trigger: 'On complex question',
    handoff_message: 'Let me connect you with a human agent who can better assist you.',
    working_hours_auto_handoff: false,
    human_queue_message: 'An agent will be with you shortly.'
  },
  knowledge: {
    allowed_trips: [],
    featured_trip: '',
    pricing_rules: ''
  },
  appearance: {
    widget_position: 'Bottom-right',
    widget_size: 'Standard',
    widget_color: '#3b82f6',
    widget_header_text: `Chat with ${agencyName || 'us'}`,
    widget_icon: 'MessageCircle',
    open_on_load: false,
    open_delay: 5,
    bot_bubble_color: '#f1f5f9',
    bot_text_color: '#0f172a',
    user_bubble_color: '#3b82f6',
    user_text_color: '#ffffff',
    bubble_shape: 'Rounded',
    show_timestamps: true,
    show_read_receipts: true,
    launcher_style: 'Floating button',
    launcher_text: 'Chat with us',
    launcher_badge: true
  },
  advanced: {
    ai_model: 'Gemini 3.1 Pro',
    creativity_level: 70,
    max_response_tokens: 500,
    enable_voice_notes: true,
    voice_transcription: true,
    show_transcript: true,
    voice_reply: false,
    show_conversation_stats: true
  },
  import_settings: {
    import_timeline: '3.5 mois en moyenne',
    import_timeline_breakdown: 'Fabrication: 6 semaines, Transport maritime: 5-6 semaines, Dédouanement Alger: 2-3 semaines',
    contact_phone_1: '',
    contact_phone_2: '',
    contact_whatsapp: '',
    contact_address: '',
    contact_email: '',
    payment_cash: true,
    payment_ccp: true,
    payment_ccp_details: '',
    payment_virement: false,
    payment_virement_details: '',
    vp_free_insurance: true,
    vp_warranty: true,
    vp_free_delivery: false,
    vp_test_drive: true,
    vp_financing: true,
    vp_financing_details: 'CPA, BADR, AGB – à partir de 7.5% sur 60 mois',
    vp_certificate_conformity: true,
    vp_custom_order: true,
    dedouanement_enabled: true,
    dedouanement_description: 'Nos transitaires agréés s\'occupent de tout le processus de dédouanement. Vous n\'avez rien à faire.',
    customs_fee_context: 'Les frais de dédouanement incluent: DTP (Droit de Timbre de Passage), TIC (Taxe Intérieure de Consommation), TVA 19%, et honoraires du transitaire.',
    transitaire_included: true,
    enable_container_tracking: true,
    tracking_intro_message: 'Je peux vérifier le statut de votre véhicule en temps réel. Donnez-moi votre numéro de téléphone ou de conteneur.',
    custom_ai_instructions: '',
    extra_value_props: []
  },
  faq: []
});
