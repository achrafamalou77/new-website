-- ============================================================
-- 2S OTO SHOWROOM — Complete Supabase Database Setup
-- Run this ENTIRE script in your Supabase SQL Editor
-- (Dashboard → SQL Editor → New Query → Paste → Run)
-- ============================================================


-- ==========================================
-- 1. VEHICLES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS vehicles (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    TIMESTAMPTZ DEFAULT now(),

  -- Core Info
  make          TEXT NOT NULL,               -- Brand: MG, Jetour, VW...
  model         TEXT NOT NULL,               -- Model: ZS, T2, Tiguan...
  trim          TEXT DEFAULT '',             -- Finition: Luxury, R-Line...
  year          INTEGER NOT NULL,            -- 2024, 2025, 2026...
  price         BIGINT NOT NULL DEFAULT 0,   -- Price in DZD (Dinars)
  condition     TEXT DEFAULT 'Neuf',         -- 'Neuf' or 'Occasion'
  availability  TEXT DEFAULT 'Disponible',   -- 'Disponible' or 'Sur Commande'
  is_sold       BOOLEAN DEFAULT false,       -- Marks vehicle as sold

  -- Technical Specs
  "bodyType"    TEXT DEFAULT 'SUV',          -- SUV, Berline, Coupé, Pick-up...
  "engineSize"  TEXT DEFAULT '',             -- Engine: '1.5L Turbo', '2.0 TDI'...
  fuel          TEXT DEFAULT 'Essence',      -- Essence, Diesel, Hybride, Électrique, GPL
  transmission  TEXT DEFAULT 'Automatique',  -- Automatique, Manuelle, CVT, DCT
  "driveType"   TEXT DEFAULT 'FWD',          -- FWD, RWD, AWD, 4WD
  mileage       INTEGER DEFAULT 0,           -- Kilometers
  color         TEXT DEFAULT '',             -- Exterior color
  doors         INTEGER DEFAULT 4,           -- Number of doors
  cylinders     INTEGER DEFAULT 0,           -- Number of cylinders

  -- Details
  vin           TEXT DEFAULT '',             -- Vehicle Identification Number
  description   TEXT DEFAULT '',             -- Full description
  features      JSONB DEFAULT '[]'::jsonb,   -- Array of equipment strings
  images        JSONB DEFAULT '[]'::jsonb,   -- Array of image URLs
  featured      BOOLEAN DEFAULT false        -- Featured on homepage
);

-- Add comment for documentation
COMMENT ON TABLE vehicles IS 'Main inventory table for all vehicles in the showroom';


-- ==========================================
-- 2. ORDERS TABLE (Leads / Contact Requests)
-- ==========================================
CREATE TABLE IF NOT EXISTS orders (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        TIMESTAMPTZ DEFAULT now(),
  date              TIMESTAMPTZ DEFAULT now(),

  -- Client Info
  "clientName"      TEXT NOT NULL,            -- Client full name
  phone             TEXT NOT NULL,            -- Client phone number
  message           TEXT DEFAULT '',          -- Client message

  -- Vehicle Reference
  "vehicleId"       UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  "vehicleInterest" TEXT DEFAULT '',          -- e.g. "Jetour T2"

  -- Status Management
  status            TEXT DEFAULT 'nouveau',   -- 'nouveau' or 'contacté'
  is_archived       BOOLEAN DEFAULT false     -- Soft delete for archiving
);

COMMENT ON TABLE orders IS 'Customer leads and contact requests from the website';


-- ==========================================
-- 3. NEWSLETTER EMAILS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS newsletter_emails (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  TIMESTAMPTZ DEFAULT now(),
  email       TEXT NOT NULL UNIQUE           -- Subscriber email address
);

COMMENT ON TABLE newsletter_emails IS 'Newsletter email subscriptions';


-- ==========================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_emails ENABLE ROW LEVEL SECURITY;

-- VEHICLES: Anyone can read, only authenticated users can write
CREATE POLICY "Public can read vehicles"
  ON vehicles FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert vehicles"
  ON vehicles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update vehicles"
  ON vehicles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete vehicles"
  ON vehicles FOR DELETE
  TO authenticated
  USING (true);

-- ORDERS: Anyone can insert (contact form), only authenticated can read/update
CREATE POLICY "Anyone can create orders"
  ON orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read orders"
  ON orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- NEWSLETTER: Anyone can subscribe, only authenticated can read
CREATE POLICY "Anyone can subscribe to newsletter"
  ON newsletter_emails FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read newsletter emails"
  ON newsletter_emails FOR SELECT
  TO authenticated
  USING (true);


-- ==========================================
-- 5. PERFORMANCE INDEXES
-- ==========================================

-- Vehicles indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_make ON vehicles (make);
CREATE INDEX IF NOT EXISTS idx_vehicles_year ON vehicles (year DESC);
CREATE INDEX IF NOT EXISTS idx_vehicles_price ON vehicles (price ASC);
CREATE INDEX IF NOT EXISTS idx_vehicles_created ON vehicles (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicles_make_year ON vehicles (make, year DESC);
CREATE INDEX IF NOT EXISTS idx_vehicles_body_type ON vehicles ("bodyType");
CREATE INDEX IF NOT EXISTS idx_vehicles_is_sold ON vehicles (is_sold);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_vehicle ON orders ("vehicleId");
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_archived ON orders (is_archived);


-- ============================================================
-- DONE! Your database is fully configured.
-- Next step: Create a Storage Bucket (see instructions below)
-- ============================================================
