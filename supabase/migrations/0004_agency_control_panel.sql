-- 0004_agency_control_panel.sql

-- 1. Add granular JSONB configuration columns to agencies table
ALTER TABLE agencies 
ADD COLUMN IF NOT EXISTS website_config JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS chatbot_config JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS social_media JSONB DEFAULT '{}'::jsonb;

-- 2. Create chatbot_faqs table
CREATE TABLE IF NOT EXISTS chatbot_faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create chatbot_conversation_starters table
CREATE TABLE IF NOT EXISTS chatbot_conversation_starters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- 4. Enable RLS on new tables
ALTER TABLE chatbot_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_conversation_starters ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for chatbot_faqs
DROP POLICY IF EXISTS "Select chatbot_faqs" ON chatbot_faqs;
CREATE POLICY "Select chatbot_faqs" ON chatbot_faqs FOR SELECT
USING (agency_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS "Insert chatbot_faqs" ON chatbot_faqs;
CREATE POLICY "Insert chatbot_faqs" ON chatbot_faqs FOR INSERT
WITH CHECK (agency_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS "Update chatbot_faqs" ON chatbot_faqs;
CREATE POLICY "Update chatbot_faqs" ON chatbot_faqs FOR UPDATE
USING (agency_id = current_setting('app.current_tenant_id', true)::uuid)
WITH CHECK (agency_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS "Delete chatbot_faqs" ON chatbot_faqs;
CREATE POLICY "Delete chatbot_faqs" ON chatbot_faqs FOR DELETE
USING (agency_id = current_setting('app.current_tenant_id', true)::uuid AND is_superadmin());

-- 6. RLS Policies for chatbot_conversation_starters
DROP POLICY IF EXISTS "Select chatbot_conversation_starters" ON chatbot_conversation_starters;
CREATE POLICY "Select chatbot_conversation_starters" ON chatbot_conversation_starters FOR SELECT
USING (agency_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS "Insert chatbot_conversation_starters" ON chatbot_conversation_starters;
CREATE POLICY "Insert chatbot_conversation_starters" ON chatbot_conversation_starters FOR INSERT
WITH CHECK (agency_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS "Update chatbot_conversation_starters" ON chatbot_conversation_starters;
CREATE POLICY "Update chatbot_conversation_starters" ON chatbot_conversation_starters FOR UPDATE
USING (agency_id = current_setting('app.current_tenant_id', true)::uuid)
WITH CHECK (agency_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS "Delete chatbot_conversation_starters" ON chatbot_conversation_starters;
CREATE POLICY "Delete chatbot_conversation_starters" ON chatbot_conversation_starters FOR DELETE
USING (agency_id = current_setting('app.current_tenant_id', true)::uuid AND is_superadmin());

-- 7. Backfill existing agencies with sensible defaults
UPDATE agencies
SET 
  website_config = jsonb_build_object(
    'design', jsonb_build_object(
      'primary_color', '#0f172a',
      'secondary_color', '#3b82f6',
      'font_family', 'Inter'
    ),
    'content', jsonb_build_object(
      'hero_title', 'Welcome to ' || company_name,
      'hero_subtitle', 'Book your next dream vacation with us today.'
    )
  ),
  chatbot_config = jsonb_build_object(
    'personality', jsonb_build_object(
      'bot_name', company_name || ' Assistant',
      'bot_greeting', 'Hello! How can I help you plan your next trip?'
    )
  )
WHERE website_config = '{}'::jsonb;
