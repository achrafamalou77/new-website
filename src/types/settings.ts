// src/types/settings.ts

export type BusinessHours = {
  saturday: string;
  sunday: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  show_on_website: boolean;
};

export type SocialMedia = {
  facebook: string;
  instagram: string;
  tiktok: string;
  youtube: string;
  twitter: string;
  linkedin: string;
};

export type WebsiteConfig = {
  design: {
    logo_url: string;
    favicon_url: string;
    primary_color: string;
    secondary_color: string;
    text_color: string;
    bg_color: string;
    card_bg_color: string;
    border_color: string;
    dark_mode_enabled: boolean;
    font_family: string;
    heading_style: string;
    base_font_size: number;
    border_radius: number;
    card_shadow: string;
    card_shadow_enabled: boolean;
    card_shadow_intensity: number;
    section_spacing: string;
    section_spacing_val: number;
    container_width: string;
    container_width_val: number;
    grid_columns: number;
    grid_gap: number;
    line_height: number;
    letter_spacing: number;
    button_shape: string;
    button_style: string;
    button_size: string;
    enable_animations: boolean;
    animation_speed: string;
    scroll_reveal: boolean;
    stagger_children: boolean;
    heading_size: number;
    body_size: number;
  };
  content: {
    hero_bg_type: string;
    hero_bg_url: string;
    hero_overlay: number;
    hero_title: string;
    hero_subtitle: string;
    hero_cta_text: string;
    hero_cta_link: string;
    show_search_bar: boolean;
    hero_height: string;
    show_logo_in_navbar: boolean;
    show_agency_name_in_navbar: boolean;
    navbar_style: string;
    sticky_navbar: boolean;
    show_stats_bar: boolean;
    show_why_choose_us: boolean;
    show_testimonials: boolean;
    show_newsletter: boolean;
    show_contact_section: boolean;
    show_footer: boolean;
    footer_columns: number;
    footer_col1_title: string;
    footer_col1_content: string;
    footer_col2_title: string;
    footer_col3_title: string;
    footer_col4_title: string;
    show_social_icons: boolean;
    copyright_text: string;
    show_powered_by: boolean;
    section_order: string[];
    hero_badge_text: string;
    hero_primary_cta_text: string;
    hero_secondary_cta_text: string;
    stats_cards: { number: string; label: string; icon: string }[];
    why_choose_us_cards: { icon: string; title: string; description: string }[];
    testimonials: { name: string; location: string; quote: string; rating: number; avatar: string }[];
    footer_col1_links: { text: string; url: string }[];
    footer_col2_links: { text: string; url: string }[];
    footer_col3_links: { text: string; url: string }[];
    footer_col4_links: { text: string; url: string }[];
    footer_social_facebook: string;
    footer_social_instagram: string;
    footer_social_whatsapp: string;
    footer_social_enabled: boolean;
  };
  trips_display: {
    card_style: string;
    show_trip_image: boolean;
    image_aspect_ratio: string;
    show_duration_badge: boolean;
    show_price: boolean;
    show_original_price: boolean;
    show_savings_badge: boolean;
    show_destination: boolean;
    show_description: boolean;
    description_length: number;
    price_format: string;
    book_now_style: string;
    book_now_text: string;
    modal_style: string;
    show_image_gallery: boolean;
    show_itinerary: boolean;
    show_inclusions: boolean;
    show_exclusions: boolean;
    show_terms: boolean;
    show_similar_trips: boolean;
    enable_search: boolean;
    enable_filter_destination: boolean;
    enable_filter_price: boolean;
    enable_filter_duration: boolean;
    default_sort: string;
    cards_per_row: number;
    show_share_button: boolean;
    show_book_now_button: boolean;
  };
  seo: {
    page_title: string;
    meta_description: string;
    keywords: string[];
    keywords_tags: string[];
    og_image: string;
    og_image_upload: string;
    favicon: string;
    twitter_card_style: string;
    google_analytics_id: string;
    facebook_pixel_id: string;
    google_search_console: string;
  };
  advanced: {
    custom_header_scripts: string;
    custom_footer_scripts: string;
    password_protection: boolean;
    password_hash: string;
    maintenance_mode: boolean;
    maintenance_message: string;
    cookie_consent: boolean;
    cookie_message: string;
    publish_status: 'draft' | 'published';
  };
};

export type ChatbotConfig = {
  personality: {
    bot_name: string;
    bot_avatar: string;
    bot_greeting: string;
    bot_farewell: string;
    typing_indicator_text: string;
    response_tone: string;
    language_style: string;
    formality_level: number;
    use_emojis: boolean;
    emoji_style: string;
    greeting_language: string;
  };
  behavior: {
    response_speed: number;
    max_message_length: number;
    follow_up_questions: boolean;
    proactive_messages: boolean;
    proactive_delay: number;
    auto_qualify_leads: boolean;
    required_info_before_handoff: string[];
    auto_handoff_trigger: string;
    handoff_message: string;
    working_hours_auto_handoff: boolean;
    human_queue_message: string;
  };
  knowledge: {
    allowed_trips: string[]; // UUIDs of active trips
    featured_trip: string; // UUID of primary trip
    pricing_rules: string;
    sync_vehicles_catalog?: boolean;
  };
  appearance: {
    widget_position: string;
    widget_size: string;
    widget_color: string;
    widget_header_text: string;
    widget_icon: string;
    open_on_load: boolean;
    open_delay: number;
    bot_bubble_color: string;
    bot_text_color: string;
    user_bubble_color: string;
    user_text_color: string;
    bubble_shape: string;
    show_timestamps: boolean;
    show_read_receipts: boolean;
    launcher_style: string;
    launcher_text: string;
    launcher_badge: boolean;
  };
  advanced: {
    ai_model: string;
    creativity_level: number;
    max_response_tokens: number;
    enable_voice_notes: boolean;
    voice_transcription: boolean;
    show_transcript: boolean;
    voice_reply: boolean;
    show_conversation_stats: boolean;
  };
  import_settings?: {
    // Timeline & Logistics
    import_timeline: string;           // e.g., "3.5 mois en moyenne"
    import_timeline_breakdown: string; // e.g., "Fabrication: 6 sem, Transport: 5-6 sem, Douane: 2-3 sem"
    // Contact Info
    contact_phone_1: string;
    contact_phone_2: string;
    contact_whatsapp: string;
    contact_address: string;
    contact_email: string;
    // Payment methods (toggleable)
    payment_cash: boolean;
    payment_ccp: boolean;
    payment_ccp_details: string;       // e.g., "CCP: 00218765321 / Clé: 89"
    payment_virement: boolean;
    payment_virement_details: string;
    // Value propositions (toggleable checkboxes)
    vp_free_insurance: boolean;
    vp_warranty: boolean;
    vp_free_delivery: boolean;
    vp_test_drive: boolean;
    vp_financing: boolean;
    vp_financing_details: string;      // e.g., "CPA, BADR – à partir de 7.5%"
    vp_certificate_conformity: boolean;
    vp_custom_order: boolean;
    // Customs / Dédouanement
    dedouanement_enabled: boolean;
    dedouanement_description: string;  // How to explain the process to clients
    customs_fee_context: string;       // Info about DTP, TIC, TVA, etc.
    transitaire_included: boolean;
    // Container tracking
    enable_container_tracking: boolean;
    tracking_intro_message: string;    // What AI says when client asks about their car
    // Custom AI instructions
    custom_ai_instructions: string;    // Raw system prompt additions
    // Extra value propositions (free text list)
    extra_value_props: string[];
  };
  faq?: Array<{ question: string; answer: string; category?: string }>;
};
