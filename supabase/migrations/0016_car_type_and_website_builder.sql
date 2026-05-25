-- Migration: 0016_car_type_and_website_builder.sql

-- 1. Add car_type to car_sales_inventory with CHECK constraint and DEFAULT
ALTER TABLE car_sales_inventory ADD COLUMN IF NOT EXISTS car_type TEXT 
  CHECK (car_type IN ('sell', 'sur_command', 'rental')) 
  DEFAULT 'sell';

-- Index for fast filtering by agency, type and status
CREATE INDEX IF NOT EXISTS idx_car_sales_type ON car_sales_inventory(agency_id, car_type, status);

-- Update existing data to default to 'sell'
UPDATE car_sales_inventory SET car_type = 'sell' WHERE car_type IS NULL;

-- 2. Create website_configs table if not exists and extend/initialize
CREATE TABLE IF NOT EXISTS website_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE UNIQUE,
  builder_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on website_configs
ALTER TABLE website_configs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for website configs
DROP POLICY IF EXISTS "Select website configs for agency admins" ON website_configs;
CREATE POLICY "Select website configs for agency admins" ON website_configs
  FOR SELECT USING (agency_id = get_current_tenant_id());

DROP POLICY IF EXISTS "Modify website configs for agency admins" ON website_configs;
CREATE POLICY "Modify website configs for agency admins" ON website_configs
  FOR ALL USING (agency_id = get_current_tenant_id())
  WITH CHECK (agency_id = get_current_tenant_id());

-- Allow public select for subdomain loading
DROP POLICY IF EXISTS "Allow public select of website configs" ON website_configs;
CREATE POLICY "Allow public select of website configs" ON website_configs
  FOR SELECT USING (true);

-- Extend website_configs with builder_data JSONB column (idempotent helper)
ALTER TABLE website_configs ADD COLUMN IF NOT EXISTS builder_data JSONB DEFAULT '{}'::jsonb;

-- 3. Create separate table website_revisions for Visual Builder revision tracking
CREATE TABLE IF NOT EXISTS website_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  revision_number INTEGER NOT NULL,
  builder_data JSONB NOT NULL,
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast sorting of revisions by agency
CREATE INDEX IF NOT EXISTS idx_website_revisions_agency ON website_revisions(agency_id, revision_number DESC);

-- Enable RLS on website_revisions
ALTER TABLE website_revisions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
-- Create RLS policies for website revisions
DROP POLICY IF EXISTS "Select website revisions for agency admins" ON website_revisions;
CREATE POLICY "Select website revisions for agency admins" ON website_revisions
  FOR SELECT USING (agency_id = get_current_tenant_id());

DROP POLICY IF EXISTS "Modify website revisions for agency admins" ON website_revisions;
CREATE POLICY "Modify website revisions for agency admins" ON website_revisions
  FOR ALL USING (agency_id = get_current_tenant_id())
  WITH CHECK (agency_id = get_current_tenant_id());
