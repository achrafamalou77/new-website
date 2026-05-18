-- Migration: Advanced Car Showroom Operational Modules
-- 0013_showroom_advanced_management.sql

-- 1. Create CAR SALES INVENTORY table
CREATE TABLE IF NOT EXISTS car_sales_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Identification
  stock_number TEXT NOT NULL,
  vin TEXT,
  registration_number TEXT,
  
  -- Vehicle Info
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  variant TEXT,
  version TEXT,
  
  -- Condition
  condition TEXT CHECK (condition IN ('new', 'used', 'certified_pre_owned', 'demo')) DEFAULT 'new',
  mileage INTEGER DEFAULT 0,
  previous_owners INTEGER DEFAULT 0,
  
  -- Origin
  origin_country TEXT,
  import_type TEXT CHECK (import_type IN ('local', 'imported', 'sur_command')) DEFAULT 'local',
  
  -- Pricing
  purchase_price INTEGER,
  selling_price INTEGER NOT NULL,
  negotiable BOOLEAN DEFAULT true,
  
  -- Discounts
  discount_type TEXT CHECK (discount_type IN ('none', 'fixed', 'percent', 'trade_in_bonus')) DEFAULT 'none',
  discount_amount INTEGER DEFAULT 0,
  discount_percent INTEGER DEFAULT 0,
  
  -- Specifications
  fuel_type TEXT CHECK (fuel_type IN ('petrol', 'diesel', 'hybrid', 'electric', 'lpg')),
  transmission TEXT CHECK (transmission IN ('manual', 'automatic', 'cvt', 'dct')),
  engine_size DECIMAL(3,1),
  horsepower INTEGER,
  torque_nm INTEGER,
  cylinders INTEGER,
  drivetrain TEXT CHECK (drivetrain IN ('fwd', 'rwd', 'awd', '4wd')),
  
  -- Dimensions
  color_exterior TEXT,
  color_interior TEXT,
  doors INTEGER CHECK (doors IN (3, 4, 5)),
  seats INTEGER DEFAULT 5,
  body_type TEXT CHECK (body_type IN ('sedan', 'hatchback', 'suv', 'pickup', 'van', 'coupe', 'convertible', 'wagon')),
  
  -- Features & Equipment
  features JSONB DEFAULT '[]'::jsonb,
  wheels_size INTEGER,
  tires_brand TEXT,
  tires_condition TEXT CHECK (tires_condition IN ('new', 'good', 'fair', 'needs_replacement')),
  spare_tire_included BOOLEAN DEFAULT true,
  jack_and_tools BOOLEAN DEFAULT true,
  
  -- Documents
  registration_card_url TEXT,
  technical_inspection_url TEXT,
  insurance_document_url TEXT,
  customs_clearance_url TEXT,
  purchase_invoice_url TEXT,
  
  -- Warranty
  warranty_months INTEGER DEFAULT 12,
  warranty_km INTEGER DEFAULT 100000,
  warranty_type TEXT CHECK (warranty_type IN ('manufacturer', 'dealer', 'extended', 'none')) DEFAULT 'dealer',
  warranty_details TEXT,
  
  -- Status
  status TEXT CHECK (status IN ('available', 'reserved', 'sold', 'in_preparation', 'in_transit', 'maintenance')) DEFAULT 'available',
  reserved_until DATE,
  reserved_by UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  -- Location
  showroom_location TEXT,
  parking_spot TEXT,
  
  -- Media
  cover_image_url TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  video_url TEXT,
  video_360_url TEXT,
  
  -- SEO / Marketing
  slug TEXT UNIQUE,
  meta_title TEXT,
  meta_description TEXT,
  featured BOOLEAN DEFAULT false,
  views_count INTEGER DEFAULT 0,
  inquiries_count INTEGER DEFAULT 0,
  test_drives_count INTEGER DEFAULT 0,
  
  -- Dates
  arrival_date DATE,
  available_from DATE,
  sold_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create CAR RENTAL FLEET table
CREATE TABLE IF NOT EXISTS car_rental_fleet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  stock_number TEXT NOT NULL,
  vin TEXT,
  registration_number TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  mileage INTEGER DEFAULT 0,
  fuel_level_percent INTEGER DEFAULT 100,
  transmission TEXT CHECK (transmission IN ('manual', 'automatic')) DEFAULT 'automatic',
  fuel_type TEXT CHECK (fuel_type IN ('petrol', 'diesel', 'hybrid', 'electric')) DEFAULT 'petrol',
  daily_rate INTEGER NOT NULL,
  security_deposit INTEGER DEFAULT 50000,
  status TEXT CHECK (status IN ('available', 'rented', 'maintenance', 'in_pickup', 'in_return')) DEFAULT 'available',
  last_maintenance_km INTEGER DEFAULT 0,
  next_maintenance_km INTEGER DEFAULT 10000,
  condition_notes TEXT,
  body_damages JSONB DEFAULT '[]'::jsonb,
  images JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create RENTAL BOOKINGS table
CREATE TABLE IF NOT EXISTS rental_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  car_id UUID REFERENCES car_rental_fleet(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('booked', 'active', 'completed', 'cancelled')) DEFAULT 'booked',
  pickup_date DATE NOT NULL,
  return_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  daily_rate INTEGER NOT NULL,
  subtotal INTEGER NOT NULL,
  security_deposit_amount INTEGER DEFAULT 50000,
  security_deposit_status TEXT CHECK (security_deposit_status IN ('pending', 'paid', 'refunded', 'retained_partial', 'retained_full')) DEFAULT 'pending',
  
  -- Pickup Details
  pickup_km INTEGER,
  pickup_fuel_percent INTEGER,
  pickup_condition JSONB DEFAULT '[]'::jsonb,
  pickup_notes TEXT,
  
  -- Return Details
  return_km INTEGER,
  return_fuel_percent INTEGER,
  return_condition JSONB DEFAULT '[]'::jsonb,
  damage_notes TEXT,
  damage_charges INTEGER DEFAULT 0,
  fuel_charges INTEGER DEFAULT 0,
  extra_km_charges INTEGER DEFAULT 0,
  cleaning_charges INTEGER DEFAULT 0,
  late_charges INTEGER DEFAULT 0,
  final_settlement_amount INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create CAR IMPORT ORDERS (Sur Command) table
CREATE TABLE IF NOT EXISTS car_import_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('inquiry', 'quoted', 'ordered', 'shipped', 'customs_clearance', 'delivered')) DEFAULT 'inquiry',
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  specs JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  
  -- Dédouanement breakdown
  droits_de_douane INTEGER DEFAULT 0,
  tva INTEGER DEFAULT 0,
  daccis INTEGER DEFAULT 0,
  redevance_statistique INTEGER DEFAULT 0,
  frais_de_dedouanement INTEGER DEFAULT 0,
  magasinage INTEGER DEFAULT 0,
  gerbage INTEGER DEFAULT 0,
  visite INTEGER DEFAULT 0,
  banque INTEGER DEFAULT 0,
  transport_local INTEGER DEFAULT 0,
  frais_divers INTEGER DEFAULT 0,
  
  -- Pricing & Purchase
  purchase_cost INTEGER DEFAULT 0,
  selling_price INTEGER DEFAULT 0,
  
  -- Shipping details
  shipping_carrier TEXT,
  tracking_number TEXT,
  departure_port TEXT,
  arrival_port TEXT,
  departure_date DATE,
  arrival_date DATE,
  shipping_documents JSONB DEFAULT '[]'::jsonb,
  
  -- Milestone payments (30% on order, 30% on shipping, 40% on delivery)
  milestone_1_amount INTEGER DEFAULT 0,
  milestone_1_paid BOOLEAN DEFAULT false,
  milestone_2_amount INTEGER DEFAULT 0,
  milestone_2_paid BOOLEAN DEFAULT false,
  milestone_3_amount INTEGER DEFAULT 0,
  milestone_3_paid BOOLEAN DEFAULT false,
  
  -- Timeline history & Auditing
  timeline JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE car_sales_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_rental_fleet ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_import_orders ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
DROP POLICY IF EXISTS "Select sales inventory" ON car_sales_inventory;
CREATE POLICY "Select sales inventory" ON car_sales_inventory FOR SELECT USING (agency_id = get_current_tenant_id());
DROP POLICY IF EXISTS "Insert sales inventory" ON car_sales_inventory;
CREATE POLICY "Insert sales inventory" ON car_sales_inventory FOR INSERT WITH CHECK (agency_id = get_current_tenant_id());
DROP POLICY IF EXISTS "Update sales inventory" ON car_sales_inventory;
CREATE POLICY "Update sales inventory" ON car_sales_inventory FOR UPDATE USING (agency_id = get_current_tenant_id()) WITH CHECK (agency_id = get_current_tenant_id());
DROP POLICY IF EXISTS "Delete sales inventory" ON car_sales_inventory;
CREATE POLICY "Delete sales inventory" ON car_sales_inventory FOR DELETE USING (agency_id = get_current_tenant_id());

DROP POLICY IF EXISTS "Select rental fleet" ON car_rental_fleet;
CREATE POLICY "Select rental fleet" ON car_rental_fleet FOR SELECT USING (agency_id = get_current_tenant_id());
DROP POLICY IF EXISTS "Insert rental fleet" ON car_rental_fleet;
CREATE POLICY "Insert rental fleet" ON car_rental_fleet FOR INSERT WITH CHECK (agency_id = get_current_tenant_id());
DROP POLICY IF EXISTS "Update rental fleet" ON car_rental_fleet;
CREATE POLICY "Update rental fleet" ON car_rental_fleet FOR UPDATE USING (agency_id = get_current_tenant_id()) WITH CHECK (agency_id = get_current_tenant_id());
DROP POLICY IF EXISTS "Delete rental fleet" ON car_rental_fleet;
CREATE POLICY "Delete rental fleet" ON car_rental_fleet FOR DELETE USING (agency_id = get_current_tenant_id());

DROP POLICY IF EXISTS "Select rental bookings" ON rental_bookings;
CREATE POLICY "Select rental bookings" ON rental_bookings FOR SELECT USING (agency_id = get_current_tenant_id());
DROP POLICY IF EXISTS "Insert rental bookings" ON rental_bookings;
CREATE POLICY "Insert rental bookings" ON rental_bookings FOR INSERT WITH CHECK (agency_id = get_current_tenant_id());
DROP POLICY IF EXISTS "Update rental bookings" ON rental_bookings;
CREATE POLICY "Update rental bookings" ON rental_bookings FOR UPDATE USING (agency_id = get_current_tenant_id()) WITH CHECK (agency_id = get_current_tenant_id());
DROP POLICY IF EXISTS "Delete rental bookings" ON rental_bookings;
CREATE POLICY "Delete rental bookings" ON rental_bookings FOR DELETE USING (agency_id = get_current_tenant_id());

DROP POLICY IF EXISTS "Select import orders" ON car_import_orders;
CREATE POLICY "Select import orders" ON car_import_orders FOR SELECT USING (agency_id = get_current_tenant_id());
DROP POLICY IF EXISTS "Insert import orders" ON car_import_orders;
CREATE POLICY "Insert import orders" ON car_import_orders FOR INSERT WITH CHECK (agency_id = get_current_tenant_id());
DROP POLICY IF EXISTS "Update import orders" ON car_import_orders;
CREATE POLICY "Update import orders" ON car_import_orders FOR UPDATE USING (agency_id = get_current_tenant_id()) WITH CHECK (agency_id = get_current_tenant_id());
DROP POLICY IF EXISTS "Delete import orders" ON car_import_orders;
CREATE POLICY "Delete import orders" ON car_import_orders FOR DELETE USING (agency_id = get_current_tenant_id());
