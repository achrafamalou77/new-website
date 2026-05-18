-- Migration: website template system & customizable sections

CREATE TABLE IF NOT EXISTS website_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  category TEXT CHECK (category IN ('general', 'luxury', 'family', 'adventure', 'religious')),
  is_default BOOLEAN DEFAULT false,
  is_custom BOOLEAN DEFAULT false,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  structure JSONB NOT NULL,
  global_styles JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies
ALTER TABLE website_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read of templates" ON website_templates;
CREATE POLICY "Allow public read of templates" ON website_templates
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated full control of own custom templates" ON website_templates;
CREATE POLICY "Allow authenticated full control of own custom templates" ON website_templates
  FOR ALL TO authenticated USING (
    is_custom = true AND (agency_id IS NULL OR agency_id IN (
      SELECT agency_id FROM profiles WHERE id = auth.uid()
    ))
  );

-- Update agencies table
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS active_template_id UUID REFERENCES website_templates(id);
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS custom_templates JSONB DEFAULT '[]'::jsonb;
