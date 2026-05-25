// src/types/builder.ts

export type SectionType = 
  | 'Hero' 
  | 'Stats' 
  | 'Trips' 
  | 'WhyUs' 
  | 'Testimonials' 
  | 'Gallery' 
  | 'FAQ' 
  | 'Team' 
  | 'Blog' 
  | 'Contact' 
  | 'Text' 
  | 'Video' 
  | 'HTML'
  | 'SalesInventory'
  | 'RentalBooking'
  | 'ImportCalculator'
  | 'BrandGrid'
  | 'Banner'
  | 'Timeline'
  | 'Navbar'
  | 'Car Grid'
  | 'Services'
  | 'Map'
  | 'Footer';

export interface Section {
  id: string;
  type: SectionType;
  variant: string; // e.g., 'full', 'split', 'slider', 'minimal', 'grid', 'masonry', 'accordion'
  content: Record<string, any>;
  styles: {
    bg_type: 'solid' | 'gradient' | 'image';
    bg_color: string;
    text_color: string;
    padding_top: number;
    padding_bottom: number;
    animation: 'fade' | 'slide' | 'zoom' | 'none';
  };
  visibility: {
    desktop: boolean;
    mobile: boolean;
  };
}

export interface GlobalStyles {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  bg_color: string;
  card_bg_color: string;
  border_color: string;
  
  heading_font: string;
  body_font: string;
  base_font_size: number;
  
  button_shape: 'Rounded' | 'Square' | 'Pill';
  button_style: 'Filled' | 'Outline' | 'Ghost';
  button_size: 'Small' | 'Medium' | 'Large';
  
  card_border_radius: number;
  card_shadow: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  card_hover_effect: boolean;
  
  section_gap: number;
  content_width: number;
  page_padding: number;
  
  global_animation_speed: 'Fast' | 'Normal' | 'Slow';
  stagger_delay: number;
}

export interface WebsiteTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail_url: string;
  category: 'general' | 'luxury' | 'family' | 'adventure' | 'religious';
  is_default: boolean;
  is_custom: boolean;
  agency_id?: string | null;
  business_type_slug?: string;
  structure: {
    sections: Section[];
  };
  global_styles: GlobalStyles;
}
