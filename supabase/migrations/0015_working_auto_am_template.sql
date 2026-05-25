-- Migration: 0015_working_auto_am_template.sql
-- Ensure all necessary showroom fields and contacts table exist

-- 1. Alter car_sales_inventory table (safety check)
ALTER TABLE car_sales_inventory ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE car_sales_inventory ADD COLUMN IF NOT EXISTS final_price INTEGER;

-- 2. Create contacts table for website form inquiries
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  message TEXT,
  source TEXT DEFAULT 'website_contact_form',
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS on contacts table
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies on contacts table
DROP POLICY IF EXISTS "Select contacts for agency admin" ON contacts;
CREATE POLICY "Select contacts for agency admin" ON contacts 
  FOR SELECT USING (agency_id = get_current_tenant_id());

DROP POLICY IF EXISTS "Insert contacts from public site" ON contacts;
CREATE POLICY "Insert contacts from public site" ON contacts 
  FOR INSERT WITH CHECK (true);

-- 5. Add dynamic database indexes for contact queries
CREATE INDEX IF NOT EXISTS idx_contacts_agency ON contacts(agency_id);
CREATE INDEX IF NOT EXISTS idx_car_sales_agency_status ON car_sales_inventory(agency_id, status);
