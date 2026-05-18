-- Migration: Multi-Vertical White-Label Platform Transformation
-- 0012_multi_vertical_whitelabel.sql

-- 1. Create business_types table
CREATE TABLE IF NOT EXISTS business_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_ar TEXT,
  name_fr TEXT,
  description TEXT,
  icon TEXT,
  color TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  default_template_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pre-populate business_types
INSERT INTO business_types (slug, name, name_ar, name_fr, description, icon, color, features)
VALUES 
  ('travel', 'Travel Agency', 'وكالة سفر', 'Agence de Voyage', 'Algerian travel agency platform with trip catalog, booking management, and visa tracker.', 'Compass', '#3b82f6', '["inbox", "leads", "clients", "trips", "bookings", "visa", "invoices", "team", "chatbot", "website", "settings"]'),
  ('car_showroom', 'Car Showroom', 'معرض السيارات', 'Showroom Auto', 'Automobile dealership software with car inventory, test drive planner, and financing options.', 'Car', '#ef4444', '["inbox", "leads", "clients", "management", "team", "chatbot", "website", "settings"]'),
  ('real_estate', 'Real Estate', 'الوكالة العقارية', 'Agence Immobilière', 'Property listings portal with agents, scheduled visits, and contract tracking.', 'Home', '#10b981', '["inbox", "leads", "clients", "listings", "visits", "contracts", "team", "chatbot", "website", "settings"]'),
  ('ecommerce', 'E-commerce', 'التجارة الإلكترونية', 'E-commerce', 'Online retail business manager with product inventory, shopping cart checkout, and shipping tracking.', 'ShoppingBag', '#8b5cf6', '["inbox", "leads", "clients", "products", "orders", "inventory", "shipping", "team", "chatbot", "website", "settings"]'),
  ('restaurant', 'Restaurant', 'مطعم', 'Restaurant', 'Food menu ordering systems with table reservation and home delivery logistics.', 'Utensils', '#f59e0b', '["inbox", "leads", "menu", "reservations", "orders", "team", "chatbot", "website"]'),
  ('salon', 'Beauty Salon', 'صالون التجميل', 'Salon de Beauté', 'Hair and beauty spa reservation manager with stylist calendar schedules.', 'Scissors', '#ec4899', '["inbox", "leads", "services", "appointments", "team", "chatbot", "website"]'),
  ('clinic', 'Medical Clinic', 'عيادة طبية', 'Clinique Médicale', 'Doctor patient scheduling portal with prescription and consultation tracking.', 'Stethoscope', '#14b8a6', '["inbox", "leads", "patients", "appointments", "team", "chatbot", "website"]'),
  ('lawyer', 'Law Office', 'مكتب محاماة', 'Cabinet d''Avocats', 'Legal case manager with scheduled consultation calendar, documents, and client billings.', 'Scale', '#64748b', '["inbox", "leads", "cases", "consultations", "team", "chatbot", "website"]') ON CONFLICT (slug) DO NOTHING;

-- 2. Update agencies table with business type columns
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS business_type_id UUID REFERENCES business_types(id);
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS business_type_slug TEXT DEFAULT 'travel';
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS features_enabled JSONB DEFAULT '[]'::jsonb;

-- Backfill existing agencies to travel vertical
UPDATE agencies 
SET 
  business_type_id = (SELECT id FROM business_types WHERE slug = 'travel'),
  business_type_slug = 'travel',
  features_enabled = '["inbox", "leads", "clients", "trips", "bookings", "visa", "invoices", "team", "chatbot", "website", "settings"]'::jsonb
WHERE business_type_id IS NULL;

-- 3. Create Leads Table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  car_interest TEXT, -- Free text or reference to inventory
  budget INTEGER, -- in DZD
  source TEXT CHECK (source IN ('whatsapp', 'instagram', 'facebook', 'walk_in', 'phone', 'website')) DEFAULT 'website',
  score TEXT CHECK (score IN ('HOT', 'WARM', 'COLD')) DEFAULT 'WARM',
  stage TEXT CHECK (stage IN ('new', 'contacted', 'test_drive', 'negotiation', 'won', 'lost')) DEFAULT 'new',
  assigned_to UUID REFERENCES employees(id) ON DELETE SET NULL,
  last_contacted_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create Car Inventory Table
CREATE TABLE IF NOT EXISTS car_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  stock_number TEXT,
  status TEXT CHECK (status IN ('available', 'reserved', 'sold', 'maintenance')) DEFAULT 'available',
  
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  variant TEXT,
  condition TEXT CHECK (condition IN ('new', 'used', 'certified_pre_owned')) DEFAULT 'new',
  mileage INTEGER DEFAULT 0,
  
  price INTEGER NOT NULL,
  original_price INTEGER,
  discount_amount INTEGER DEFAULT 0,
  discount_percent INTEGER DEFAULT 0,
  final_price INTEGER GENERATED ALWAYS AS (price - discount_amount) STORED,
  
  fuel_type TEXT CHECK (fuel_type IN ('petrol', 'diesel', 'hybrid', 'electric', 'lpg')),
  transmission TEXT CHECK (transmission IN ('manual', 'automatic', 'cvt')),
  engine_size DECIMAL(3,1),
  horsepower INTEGER,
  color TEXT,
  interior_color TEXT,
  doors INTEGER CHECK (doors IN (3, 4, 5)) DEFAULT 4,
  seats INTEGER DEFAULT 5,
  
  features JSONB DEFAULT '[]'::jsonb,
  images JSONB DEFAULT '[]'::jsonb,
  video_url TEXT,
  view_360_url TEXT,
  
  financing_available BOOLEAN DEFAULT false,
  down_payment_percent INTEGER DEFAULT 30,
  monthly_installment INTEGER,
  installment_months INTEGER DEFAULT 60,
  
  description TEXT,
  highlights JSONB DEFAULT '[]'::jsonb,
  
  is_featured BOOLEAN DEFAULT false,
  views_count INTEGER DEFAULT 0,
  inquiries_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Create Test Drives Table
CREATE TABLE IF NOT EXISTS test_drives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  car_id UUID REFERENCES car_inventory(id) ON DELETE CASCADE,
  
  status TEXT CHECK (status IN ('requested', 'confirmed', 'completed', 'cancelled', 'no_show')) DEFAULT 'requested',
  requested_date DATE NOT NULL,
  requested_time TIME NOT NULL,
  confirmed_date DATE,
  confirmed_time TIME,
  
  client_notes TEXT,
  employee_notes TEXT,
  feedback TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  
  assigned_to UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Create Financing Applications Table
CREATE TABLE IF NOT EXISTS financing_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  car_id UUID REFERENCES car_inventory(id) ON DELETE CASCADE,
  
  status TEXT CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'completed')) DEFAULT 'submitted',
  
  monthly_income INTEGER,
  employment_type TEXT,
  employer_name TEXT,
  years_employed INTEGER,
  
  down_payment_amount INTEGER,
  loan_amount INTEGER,
  interest_rate DECIMAL(5,2),
  monthly_payment INTEGER,
  duration_months INTEGER DEFAULT 60,
  
  documents_received JSONB DEFAULT '[]'::jsonb,
  financing_partner TEXT,
  partner_reference TEXT,
  notes TEXT,
  
  assigned_to UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Add Indexes
CREATE INDEX IF NOT EXISTS idx_business_types_slug ON business_types(slug);
CREATE INDEX IF NOT EXISTS idx_agencies_business_type_id ON agencies(business_type_id);
CREATE INDEX IF NOT EXISTS idx_agencies_business_type_slug ON agencies(business_type_slug);

CREATE INDEX IF NOT EXISTS idx_leads_agency_id ON leads(agency_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(score);

CREATE INDEX IF NOT EXISTS idx_car_inventory_agency_id ON car_inventory(agency_id);
CREATE INDEX IF NOT EXISTS idx_car_inventory_status ON car_inventory(status);
CREATE INDEX IF NOT EXISTS idx_car_inventory_brand_model ON car_inventory(brand, model);

CREATE INDEX IF NOT EXISTS idx_test_drives_agency_id ON test_drives(agency_id);
CREATE INDEX IF NOT EXISTS idx_test_drives_client_id ON test_drives(client_id);
CREATE INDEX IF NOT EXISTS idx_test_drives_car_id ON test_drives(car_id);

CREATE INDEX IF NOT EXISTS idx_financing_applications_agency_id ON financing_applications(agency_id);
CREATE INDEX IF NOT EXISTS idx_financing_applications_client_id ON financing_applications(client_id);
CREATE INDEX IF NOT EXISTS idx_financing_applications_car_id ON financing_applications(car_id);

-- 8. Enable Row Level Security (RLS)
ALTER TABLE business_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE financing_applications ENABLE ROW LEVEL SECURITY;

-- 9. Security Policies
DROP POLICY IF EXISTS "Allow public read of business_types" ON business_types;
CREATE POLICY "Allow public read of business_types" ON business_types FOR SELECT USING (true);

-- Create a helper function if not already there, we know it returns get_current_tenant_id()
-- Leads Policies
DROP POLICY IF EXISTS "Select leads" ON leads;
CREATE POLICY "Select leads" ON leads FOR SELECT USING (agency_id = get_current_tenant_id());
DROP POLICY IF EXISTS "Insert leads" ON leads;
CREATE POLICY "Insert leads" ON leads FOR INSERT WITH CHECK (agency_id = get_current_tenant_id());
DROP POLICY IF EXISTS "Update leads" ON leads;
CREATE POLICY "Update leads" ON leads FOR UPDATE USING (agency_id = get_current_tenant_id()) WITH CHECK (agency_id = get_current_tenant_id());
DROP POLICY IF EXISTS "Delete leads" ON leads;
CREATE POLICY "Delete leads" ON leads FOR DELETE USING (agency_id = get_current_tenant_id());

-- Car Inventory Policies
DROP POLICY IF EXISTS "Select car_inventory" ON car_inventory;
CREATE POLICY "Select car_inventory" ON car_inventory FOR SELECT USING (agency_id = get_current_tenant_id());
DROP POLICY IF EXISTS "Insert car_inventory" ON car_inventory;
CREATE POLICY "Insert car_inventory" ON car_inventory FOR INSERT WITH CHECK (agency_id = get_current_tenant_id());
DROP POLICY IF EXISTS "Update car_inventory" ON car_inventory;
CREATE POLICY "Update car_inventory" ON car_inventory FOR UPDATE USING (agency_id = get_current_tenant_id()) WITH CHECK (agency_id = get_current_tenant_id());
DROP POLICY IF EXISTS "Delete car_inventory" ON car_inventory;
CREATE POLICY "Delete car_inventory" ON car_inventory FOR DELETE USING (agency_id = get_current_tenant_id());

-- Test Drives Policies
DROP POLICY IF EXISTS "Select test_drives" ON test_drives;
CREATE POLICY "Select test_drives" ON test_drives FOR SELECT USING (agency_id = get_current_tenant_id());
DROP POLICY IF EXISTS "Insert test_drives" ON test_drives;
CREATE POLICY "Insert test_drives" ON test_drives FOR INSERT WITH CHECK (agency_id = get_current_tenant_id());
DROP POLICY IF EXISTS "Update test_drives" ON test_drives;
CREATE POLICY "Update test_drives" ON test_drives FOR UPDATE USING (agency_id = get_current_tenant_id()) WITH CHECK (agency_id = get_current_tenant_id());
DROP POLICY IF EXISTS "Delete test_drives" ON test_drives;
CREATE POLICY "Delete test_drives" ON test_drives FOR DELETE USING (agency_id = get_current_tenant_id());

-- Financing Applications Policies
DROP POLICY IF EXISTS "Select financing_applications" ON financing_applications;
CREATE POLICY "Select financing_applications" ON financing_applications FOR SELECT USING (agency_id = get_current_tenant_id());
DROP POLICY IF EXISTS "Insert financing_applications" ON financing_applications;
CREATE POLICY "Insert financing_applications" ON financing_applications FOR INSERT WITH CHECK (agency_id = get_current_tenant_id());
DROP POLICY IF EXISTS "Update financing_applications" ON financing_applications;
CREATE POLICY "Update financing_applications" ON financing_applications FOR UPDATE USING (agency_id = get_current_tenant_id()) WITH CHECK (agency_id = get_current_tenant_id());
DROP POLICY IF EXISTS "Delete financing_applications" ON financing_applications;
CREATE POLICY "Delete financing_applications" ON financing_applications FOR DELETE USING (agency_id = get_current_tenant_id());
