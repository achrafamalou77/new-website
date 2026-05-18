-- Migration: add business_type_slug to website_templates and seed showroom templates

ALTER TABLE website_templates ADD COLUMN IF NOT EXISTS business_type_slug TEXT DEFAULT 'travel';

-- Insert the 5 premium showroom templates
INSERT INTO website_templates (id, name, description, category, is_default, is_custom, business_type_slug, structure, global_styles) VALUES
(
  'a0a0a0a0-b0b0-c0c0-d0d0-e0e0e0e0e0e0',
  'AutoMax Classic',
  'Sophisticated dark hero with red accents, category grid, import calculator, and premium vehicle cards.',
  'general',
  true,
  false,
  'car_showroom',
  '{"sections": []}'::jsonb,
  '{"primary_color": "#1a1a1a", "secondary_color": "#ffffff", "accent_color": "#e31937"}'::jsonb
),
(
  'a1a1a1a1-b1b1-c1c1-d1d1-e1e1e1e1e1e1',
  'AutoBaraka Minimal',
  'Minimalist Arabic-first theme optimized for direct direct WhatsApp contact and whitespace.',
  'general',
  false,
  false,
  'car_showroom',
  '{"sections": []}'::jsonb,
  '{"primary_color": "#0f172a", "secondary_color": "#f8fafc", "accent_color": "#25D366"}'::jsonb
),
(
  'a2a2a2a2-b2b2-c2c2-d2d2-e2e2e2e2e2e2',
  'ImportPro',
  'Deep navy and amber specialized layouts containing timelines and express customs calculators.',
  'adventure',
  false,
  false,
  'car_showroom',
  '{"sections": []}'::jsonb,
  '{"primary_color": "#0b132b", "secondary_color": "#fafafa", "accent_color": "#f5a623"}'::jsonb
),
(
  'a3a3a3a3-b3b3-c3c3-d3d3-e3e3e3e3e3e3',
  'RentalFleet',
  'Ocean sky-blue with energetic orange accents, booking widgets, and vehicle specs comparison cards.',
  'family',
  false,
  false,
  'car_showroom',
  '{"sections": []}'::jsonb,
  '{"primary_color": "#0284c7", "secondary_color": "#fafafa", "accent_color": "#f97316"}'::jsonb
),
(
  'a4a4a4a4-b4b4-c4c4-d4d4-e4e4e4e4e4e4',
  'LuxuryMotors',
  'High-end gold-on-black dark mode masonry portfolio with premium call to actions.',
  'luxury',
  false,
  false,
  'car_showroom',
  '{"sections": []}'::jsonb,
  '{"primary_color": "#000000", "secondary_color": "#121212", "accent_color": "#c5a880"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  business_type_slug = EXCLUDED.business_type_slug;
