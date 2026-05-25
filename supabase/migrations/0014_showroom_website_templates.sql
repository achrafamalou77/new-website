-- Migration: add business_type_slug to website_templates and seed showroom templates

ALTER TABLE website_templates ADD COLUMN IF NOT EXISTS business_type_slug TEXT DEFAULT 'travel';

-- Remove the old broken templates
DELETE FROM website_templates WHERE id IN (
  'a0a0a0a0-b0b0-c0c0-d0d0-e0e0e0e0e0e0',
  'a1a1a1a1-b1b1-c1c1-d1d1-e1e1e1e1e1e1',
  'a2a2a2a2-b2b2-c2c2-d2d2-e2e2e2e2e2e2',
  'a3a3a3a3-b3b3-c3c3-d3d3-e3e3e3e3e3e3',
  'a4a4a4a4-b4b4-c4c4-d4d4-e4e4e4e4e4e4'
);

-- Insert the single default premium showroom template
INSERT INTO website_templates (id, name, description, category, is_default, is_custom, business_type_slug, structure, global_styles) VALUES
(
  'a5a5a5a5-b5b5-c5c5-d5d5-e5e5e5e5e5e5',
  'Auto AM',
  'Algerian premier car marketplace template with auto Hero slider, dynamic Brand/Model compound filters, spec details popup, WhatsApp negation integration, and inbox leads submitting form.',
  'general',
  true,
  false,
  'car_showroom',
  '{"sections": []}'::jsonb,
  '{"primary_color": "#0f0f0f", "secondary_color": "#1f2937", "accent_color": "#e31937", "text_color": "#f3f4f6", "bg_color": "#0f0f0f", "card_bg_color": "#1f2937", "border_color": "#374151"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  business_type_slug = EXCLUDED.business_type_slug,
  global_styles = EXCLUDED.global_styles;
