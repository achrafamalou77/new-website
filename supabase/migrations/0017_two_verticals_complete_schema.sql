-- Supabase SQL Migration: Core Multi-Vertical SaaS Schema (Car Showroom + Travel Agency)
-- Drop existing tables to ensure clean, idempotent state
DROP TABLE IF EXISTS travel_agency_websites CASCADE;
DROP TABLE IF EXISTS travel_agency_templates CASCADE;
DROP TABLE IF EXISTS custom_trip_requests CASCADE;
DROP TABLE IF EXISTS travel_inquiries CASCADE;
DROP TABLE IF EXISTS travel_bookings CASCADE;
DROP TABLE IF EXISTS travel_packages CASCADE;
DROP TABLE IF EXISTS travel_agency_config CASCADE;
DROP TABLE IF EXISTS car_showroom_websites CASCADE;
DROP TABLE IF EXISTS car_showroom_templates CASCADE;
DROP TABLE IF EXISTS parts_inventory CASCADE;
DROP TABLE IF EXISTS service_appointments CASCADE;
DROP TABLE IF EXISTS shipping_carriers CASCADE;
DROP TABLE IF EXISTS import_orders CASCADE;
DROP TABLE IF EXISTS rental_bookings CASCADE;
DROP TABLE IF EXISTS car_rental_fleet CASCADE;
DROP TABLE IF EXISTS car_sales_inventory CASCADE;
DROP TABLE IF EXISTS car_showroom_config CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS agencies CASCADE;

-- ============================================================================
-- === CORE TABLES (Shared, Minimal namespace) ===
-- ============================================================================

CREATE TABLE IF NOT EXISTS agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
    business_type_slug VARCHAR(50) NOT NULL CHECK (business_type_slug IN ('car_showroom', 'travel_agency')),
    company_name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    logo_url TEXT,
    cover_image_url TEXT,
    working_hours JSONB DEFAULT '{}'::jsonb,
    social_links JSONB DEFAULT '{}'::jsonb,
    chatbot_enabled BOOLEAN NOT NULL DEFAULT false,
    theme_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    source VARCHAR(100) DEFAULT 'direct',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL DEFAULT 'whatsapp',
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'needs_human', 'image_inspection', 'closed')),
    lead_score VARCHAR(50) DEFAULT 'cold' CHECK (lead_score IN ('cold', 'warm', 'hot')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    content TEXT,
    sender_type VARCHAR(50) NOT NULL CHECK (sender_type IN ('client', 'agent', 'bot')),
    platform VARCHAR(50) NOT NULL DEFAULT 'whatsapp',
    media_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- === CAR SHOWROOM TABLES (Separate Namespace) ===
-- ============================================================================

CREATE TABLE IF NOT EXISTS car_showroom_config (
    agency_id UUID PRIMARY KEY REFERENCES agencies(id) ON DELETE CASCADE,
    sales_enabled BOOLEAN NOT NULL DEFAULT true,
    rental_enabled BOOLEAN NOT NULL DEFAULT false,
    sur_commande_enabled BOOLEAN NOT NULL DEFAULT false,
    import_tracking_enabled BOOLEAN NOT NULL DEFAULT false,
    service_enabled BOOLEAN NOT NULL DEFAULT false,
    parts_enabled BOOLEAN NOT NULL DEFAULT false,
    ai_personality JSONB NOT NULL DEFAULT '{
        "bot_name": "A2S Auto AI",
        "greeting": "Bienvenue chez A2S Auto!",
        "tone": "professional",
        "languages": ["fr", "ar", "en"],
        "working_hours": {"start": "08:00", "end": "18:00"},
        "auto_handoff": false
    }'::jsonb
);

CREATE TABLE IF NOT EXISTS car_sales_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    version VARCHAR(100),
    color VARCHAR(50),
    price DECIMAL(15, 2) NOT NULL,
    cost_price DECIMAL(15, 2),
    margin DECIMAL(15, 2),
    status VARCHAR(50) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'pending_import', 'in_transit')),
    type VARCHAR(50) NOT NULL DEFAULT 'stock' CHECK (type IN ('stock', 'sur_commande')),
    specs JSONB DEFAULT '{}'::jsonb,
    images JSONB DEFAULT '[]'::jsonb,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS car_rental_fleet (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    color VARCHAR(50),
    daily_rate DECIMAL(15, 2) NOT NULL,
    weekly_rate DECIMAL(15, 2),
    monthly_rate DECIMAL(15, 2),
    status VARCHAR(50) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'rented', 'maintenance', 'reserved')),
    specs JSONB DEFAULT '{}'::jsonb,
    images JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rental_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    car_id UUID NOT NULL REFERENCES car_rental_fleet(id) ON DELETE CASCADE,
    pickup_date TIMESTAMPTZ NOT NULL,
    return_date TIMESTAMPTZ NOT NULL,
    actual_return_date TIMESTAMPTZ,
    total_price DECIMAL(15, 2) NOT NULL,
    deposit_amount DECIMAL(15, 2),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
    pickup_location TEXT,
    return_location TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS import_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    vehicle_brand VARCHAR(100) NOT NULL,
    vehicle_model VARCHAR(100) NOT NULL,
    vehicle_year INTEGER NOT NULL,
    color VARCHAR(50),
    specs JSONB DEFAULT '{}'::jsonb,
    supplier_name VARCHAR(100),
    origin_country VARCHAR(100),
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'quote_requested' CHECK (status IN ('quote_requested', 'deposit_paid', 'ordered', 'in_production', 'shipped', 'in_transit', 'at_port_algiers', 'customs', 'delivered')),
    carrier VARCHAR(100),
    tracking_number VARCHAR(100),
    container_number VARCHAR(100),
    estimated_arrival TIMESTAMPTZ,
    actual_arrival TIMESTAMPTZ,
    total_cost DECIMAL(15, 2),
    deposit_paid DECIMAL(15, 2),
    balance_due DECIMAL(15, 2),
    last_tracking_update TIMESTAMPTZ,
    shipping_status JSONB DEFAULT '[]'::jsonb,
    client_notified BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS shipping_carriers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    carrier_name VARCHAR(50) NOT NULL CHECK (carrier_name IN ('maersk', 'msc', 'cma_cgm', 'evergreen')),
    api_key TEXT,
    api_endpoint TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS service_appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    service_type VARCHAR(100) NOT NULL,
    vehicle_info JSONB DEFAULT '{}'::jsonb,
    appointment_date TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    technician_id UUID,
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    parts_used JSONB DEFAULT '[]'::jsonb,
    total_cost DECIMAL(15, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS parts_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    part_number VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    compatible_models JSONB DEFAULT '[]'::jsonb,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    cost_price DECIMAL(15, 2) NOT NULL,
    sale_price DECIMAL(15, 2) NOT NULL,
    supplier VARCHAR(100),
    reorder_level INTEGER NOT NULL DEFAULT 5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS car_showroom_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    vertical_type VARCHAR(50) NOT NULL DEFAULT 'car_showroom' CHECK (vertical_type = 'car_showroom'),
    default_config JSONB DEFAULT '{}'::jsonb,
    preview_image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS car_showroom_websites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES car_showroom_templates(id),
    config JSONB DEFAULT '{}'::jsonb,
    is_published BOOLEAN NOT NULL DEFAULT false,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- === TRAVEL AGENCY TABLES (Separate Namespace) ===
-- ============================================================================

CREATE TABLE IF NOT EXISTS travel_agency_config (
    agency_id UUID PRIMARY KEY REFERENCES agencies(id) ON DELETE CASCADE,
    packages_enabled BOOLEAN NOT NULL DEFAULT true,
    custom_trips_enabled BOOLEAN NOT NULL DEFAULT false,
    visa_service_enabled BOOLEAN NOT NULL DEFAULT false,
    insurance_enabled BOOLEAN NOT NULL DEFAULT false,
    group_bookings_enabled BOOLEAN NOT NULL DEFAULT false,
    ai_personality JSONB NOT NULL DEFAULT '{
        "bot_name": "VoyagePro AI",
        "greeting": "Bienvenue! Prêt pour votre prochain voyage?",
        "tone": "friendly_enthusiastic",
        "languages": ["fr", "ar", "en"],
        "working_hours": {"start": "09:00", "end": "19:00"},
        "auto_handoff": false
    }'::jsonb
);

CREATE TABLE IF NOT EXISTS travel_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    destination_country VARCHAR(100) NOT NULL,
    destination_city VARCHAR(100),
    duration_days INTEGER NOT NULL,
    max_travelers INTEGER,
    min_travelers INTEGER,
    base_price_per_person DECIMAL(15, 2) NOT NULL,
    child_price DECIMAL(15, 2),
    infant_price DECIMAL(15, 2),
    price_includes JSONB DEFAULT '[]'::jsonb,
    price_excludes JSONB DEFAULT '[]'::jsonb,
    itinerary JSONB DEFAULT '[]'::jsonb,
    available_dates JSONB DEFAULT '[]'::jsonb,
    images JSONB DEFAULT '[]'::jsonb,
    tags JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS travel_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES travel_packages(id) ON DELETE CASCADE,
    departure_date DATE NOT NULL,
    return_date DATE,
    travelers_count INTEGER NOT NULL DEFAULT 1,
    adults_count INTEGER NOT NULL DEFAULT 1,
    children_count INTEGER NOT NULL DEFAULT 0,
    infants_count INTEGER NOT NULL DEFAULT 0,
    total_price DECIMAL(15, 2) NOT NULL,
    deposit_paid DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    balance_due DECIMAL(15, 2) NOT NULL,
    special_requests TEXT,
    room_preferences TEXT,
    dietary_requirements TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'deposit_paid', 'confirmed', 'in_progress', 'completed', 'cancelled')),
    documents JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS travel_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    inquiry_type VARCHAR(50) NOT NULL CHECK (inquiry_type IN ('package', 'custom', 'visa', 'insurance')),
    destination_preference VARCHAR(100),
    date_preference VARCHAR(100),
    budget_range VARCHAR(100),
    travelers_count INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(50) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'quoted', 'converted', 'cancelled')),
    assigned_agent_id UUID,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS custom_trip_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    destinations JSONB NOT NULL DEFAULT '[]'::jsonb,
    duration_days INTEGER,
    budget_range VARCHAR(100),
    travelers_count INTEGER NOT NULL DEFAULT 1,
    accommodation_preference VARCHAR(100),
    activities JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'quoted', 'accepted', 'rejected')),
    quote_amount DECIMAL(15, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS travel_agency_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    vertical_type VARCHAR(50) NOT NULL DEFAULT 'travel_agency' CHECK (vertical_type = 'travel_agency'),
    default_config JSONB DEFAULT '{}'::jsonb,
    preview_image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS travel_agency_websites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES travel_agency_templates(id),
    config JSONB DEFAULT '{}'::jsonb,
    is_published BOOLEAN NOT NULL DEFAULT false,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- === INDEXES & PERFORMANCE OPTIMIZATIONS ===
-- ============================================================================

-- B-Tree Indexes on Foreign Keys (Core + Shared)
CREATE INDEX IF NOT EXISTS idx_clients_agency_id ON clients(agency_id);
CREATE INDEX IF NOT EXISTS idx_conversations_agency_id ON conversations(agency_id);
CREATE INDEX IF NOT EXISTS idx_conversations_client_id ON conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);

-- B-Tree Indexes on Foreign Keys (Car Showroom)
CREATE INDEX IF NOT EXISTS idx_car_sales_inventory_agency ON car_sales_inventory(agency_id);
CREATE INDEX IF NOT EXISTS idx_car_rental_fleet_agency ON car_rental_fleet(agency_id);
CREATE INDEX IF NOT EXISTS idx_rental_bookings_agency ON rental_bookings(agency_id);
CREATE INDEX IF NOT EXISTS idx_rental_bookings_client ON rental_bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_rental_bookings_car ON rental_bookings(car_id);
CREATE INDEX IF NOT EXISTS idx_import_orders_agency ON import_orders(agency_id);
CREATE INDEX IF NOT EXISTS idx_import_orders_client ON import_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_shipping_carriers_agency ON shipping_carriers(agency_id);
CREATE INDEX IF NOT EXISTS idx_service_appointments_agency ON service_appointments(agency_id);
CREATE INDEX IF NOT EXISTS idx_service_appointments_client ON service_appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_parts_inventory_agency ON parts_inventory(agency_id);
CREATE INDEX IF NOT EXISTS idx_car_showroom_websites_agency ON car_showroom_websites(agency_id);
CREATE INDEX IF NOT EXISTS idx_car_showroom_websites_template ON car_showroom_websites(template_id);

-- B-Tree Indexes on Foreign Keys (Travel Agency)
CREATE INDEX IF NOT EXISTS idx_travel_packages_agency ON travel_packages(agency_id);
CREATE INDEX IF NOT EXISTS idx_travel_bookings_agency ON travel_bookings(agency_id);
CREATE INDEX IF NOT EXISTS idx_travel_bookings_client ON travel_bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_travel_bookings_package ON travel_bookings(package_id);
CREATE INDEX IF NOT EXISTS idx_travel_inquiries_agency ON travel_inquiries(agency_id);
CREATE INDEX IF NOT EXISTS idx_travel_inquiries_client ON travel_inquiries(client_id);
CREATE INDEX IF NOT EXISTS idx_custom_trip_requests_agency ON custom_trip_requests(agency_id);
CREATE INDEX IF NOT EXISTS idx_custom_trip_requests_client ON custom_trip_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_travel_agency_websites_agency ON travel_agency_websites(agency_id);
CREATE INDEX IF NOT EXISTS idx_travel_agency_websites_template ON travel_agency_websites(template_id);

-- Performance Indexes on Status Columns
CREATE INDEX IF NOT EXISTS idx_agencies_status ON agencies(status);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_car_sales_inventory_status ON car_sales_inventory(status);
CREATE INDEX IF NOT EXISTS idx_car_rental_fleet_status ON car_rental_fleet(status);
CREATE INDEX IF NOT EXISTS idx_rental_bookings_status ON rental_bookings(status);
CREATE INDEX IF NOT EXISTS idx_import_orders_status ON import_orders(status);
CREATE INDEX IF NOT EXISTS idx_service_appointments_status ON service_appointments(status);
CREATE INDEX IF NOT EXISTS idx_travel_packages_status ON travel_packages(status);
CREATE INDEX IF NOT EXISTS idx_travel_bookings_status ON travel_bookings(status);
CREATE INDEX IF NOT EXISTS idx_travel_inquiries_status ON travel_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_custom_trip_requests_status ON custom_trip_requests(status);

-- Indexes on Phone Columns (for normalized WhatsApp lookup speeds)
CREATE INDEX IF NOT EXISTS idx_agencies_phone ON agencies(phone);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);

-- Sort & Timestamp Index optimizations
CREATE INDEX IF NOT EXISTS idx_agencies_created_at ON agencies(created_at);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_car_sales_inventory_created ON car_sales_inventory(created_at);
CREATE INDEX IF NOT EXISTS idx_car_rental_fleet_created ON car_rental_fleet(created_at);
CREATE INDEX IF NOT EXISTS idx_rental_bookings_created ON rental_bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_import_orders_created ON import_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_service_appointments_date ON service_appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_travel_packages_created ON travel_packages(created_at);
CREATE INDEX IF NOT EXISTS idx_travel_bookings_created ON travel_bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_travel_inquiries_created ON travel_inquiries(created_at);

-- GIN Indexes on JSONB Columns for fast deep JSON queries
CREATE INDEX IF NOT EXISTS idx_agencies_working_hours ON agencies USING gin (working_hours);
CREATE INDEX IF NOT EXISTS idx_agencies_social_links ON agencies USING gin (social_links);
CREATE INDEX IF NOT EXISTS idx_agencies_theme_config ON agencies USING gin (theme_config);
CREATE INDEX IF NOT EXISTS idx_car_showroom_config_ai ON car_showroom_config USING gin (ai_personality);
CREATE INDEX IF NOT EXISTS idx_car_sales_inventory_specs ON car_sales_inventory USING gin (specs);
CREATE INDEX IF NOT EXISTS idx_car_sales_inventory_images ON car_sales_inventory USING gin (images);
CREATE INDEX IF NOT EXISTS idx_car_rental_fleet_specs ON car_rental_fleet USING gin (specs);
CREATE INDEX IF NOT EXISTS idx_car_rental_fleet_images ON car_rental_fleet USING gin (images);
CREATE INDEX IF NOT EXISTS idx_import_orders_specs ON import_orders USING gin (specs);
CREATE INDEX IF NOT EXISTS idx_import_orders_shipping ON import_orders USING gin (shipping_status);
CREATE INDEX IF NOT EXISTS idx_service_appointments_veh ON service_appointments USING gin (vehicle_info);
CREATE INDEX IF NOT EXISTS idx_service_appointments_parts ON service_appointments USING gin (parts_used);
CREATE INDEX IF NOT EXISTS idx_parts_compatible ON parts_inventory USING gin (compatible_models);
CREATE INDEX IF NOT EXISTS idx_car_showroom_websites_cfg ON car_showroom_websites USING gin (config);
CREATE INDEX IF NOT EXISTS idx_travel_agency_config_ai ON travel_agency_config USING gin (ai_personality);
CREATE INDEX IF NOT EXISTS idx_travel_packages_includes ON travel_packages USING gin (price_includes);
CREATE INDEX IF NOT EXISTS idx_travel_packages_excludes ON travel_packages USING gin (price_excludes);
CREATE INDEX IF NOT EXISTS idx_travel_packages_itinerary ON travel_packages USING gin (itinerary);
CREATE INDEX IF NOT EXISTS idx_travel_packages_dates ON travel_packages USING gin (available_dates);
CREATE INDEX IF NOT EXISTS idx_travel_packages_images ON travel_packages USING gin (images);
CREATE INDEX IF NOT EXISTS idx_travel_packages_tags ON travel_packages USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_travel_bookings_documents ON travel_bookings USING gin (documents);
CREATE INDEX IF NOT EXISTS idx_custom_trip_destinations ON custom_trip_requests USING gin (destinations);
CREATE INDEX IF NOT EXISTS idx_custom_trip_activities ON custom_trip_requests USING gin (activities);
CREATE INDEX IF NOT EXISTS idx_travel_agency_websites_cfg ON travel_agency_websites USING gin (config);

-- ============================================================================
-- === COMPREHENSIVE SEED DATA ===
-- ============================================================================

-- 1. Create seed agencies (one for each vertical)
INSERT INTO agencies (id, name, phone, email, subdomain, status, business_type_slug, company_name, address, city, logo_url, cover_image_url, working_hours, social_links, chatbot_enabled, theme_config)
VALUES 
(
  'a25a818c-34d1-44eb-991b-689e246995a9', 
  'A2S Auto Showroom', 
  '+213550123456', 
  'contact@a2sauto.dz', 
  'a2sauto', 
  'active', 
  'car_showroom', 
  'Sarl A2S Auto Algérie', 
  '12 Rue des Frères Bouadou, Bir Mourad Raïs', 
  'Algiers', 
  'https://api.sarl2sauto.dz/assets/logo.png', 
  'https://api.sarl2sauto.dz/assets/cover.jpg', 
  '{"weekday": "08:30 - 17:30", "saturday": "09:00 - 15:00", "sunday": "closed"}'::jsonb,
  '{"facebook": "facebook.com/a2sauto", "instagram": "instagram.com/a2sauto"}'::jsonb,
  true, 
  '{"primary_color": "#1E3A8A", "secondary_color": "#EF4444", "font_family": "Outfit"}'::jsonb
),
(
  'b99a818c-34d1-44eb-991b-689e246995b0', 
  'VoyagePro Travel Agency', 
  '+21321606060', 
  'info@voyagepro.dz', 
  'voyagepro', 
  'active', 
  'travel_agency', 
  'VoyagePro Algérie S.A.R.L', 
  '45 Boulevard Mohamed V', 
  'Algiers', 
  'https://api.voyagepro.dz/assets/logo.png', 
  'https://api.voyagepro.dz/assets/cover.jpg', 
  '{"weekday": "09:00 - 18:30", "saturday": "09:00 - 16:00", "sunday": "closed"}'::jsonb,
  '{"facebook": "facebook.com/voyagepro", "instagram": "instagram.com/voyagepro"}'::jsonb,
  true, 
  '{"primary_color": "#0D9488", "secondary_color": "#F59E0B", "font_family": "Inter"}'::jsonb
);

-- 2. Configure multi-vertical config settings
INSERT INTO car_showroom_config (agency_id, sales_enabled, rental_enabled, sur_commande_enabled, import_tracking_enabled, service_enabled, parts_enabled)
VALUES ('a25a818c-34d1-44eb-991b-689e246995a9', true, true, true, true, true, true);

INSERT INTO travel_agency_config (agency_id, packages_enabled, custom_trips_enabled, visa_service_enabled, insurance_enabled, group_bookings_enabled)
VALUES ('b99a818c-34d1-44eb-991b-689e246995b0', true, true, true, true, true);

-- 3. Seed clients
INSERT INTO clients (id, agency_id, full_name, phone, email, source)
VALUES 
('c11a818c-34d1-44eb-991b-689e246995c1', 'a25a818c-34d1-44eb-991b-689e246995a9', 'Sofiane Amara', '+213770123456', 'sofiane.amara@gmail.com', 'whatsapp'),
('c22a818c-34d1-44eb-991b-689e246995c2', 'b99a818c-34d1-44eb-991b-689e246995b0', 'Yacine Bensalah', '+213661987654', 'yacine.b@outlook.com', 'webchat');

-- 4. Seed Car Sales Inventory (3 stock, 2 sur commande)
INSERT INTO car_sales_inventory (agency_id, brand, model, year, version, color, price, cost_price, margin, status, type, specs, images, description)
VALUES 
(
  'a25a818c-34d1-44eb-991b-689e246995a9', 'Volkswagen', 'Golf 8', 2023, 'R-Line 2.0 TDI', 'Gris Dauphin', 6500000.00, 5800000.00, 700000.00, 'available', 'stock',
  '{"engine": "2.0 TDI", "transmission": "DSG 7", "fuel": "Diesel", "power": "150 hp", "options": ["Panoramic Roof", "Matrix LED", "Virtual Cockpit"]}'::jsonb,
  '["https://api.sarl2sauto.dz/cars/golf8_1.jpg", "https://api.sarl2sauto.dz/cars/golf8_2.jpg"]'::jsonb,
  'Superbe Golf 8 R-Line importée neuve avec toutes les options sportives.'
),
(
  'a25a818c-34d1-44eb-991b-689e246995a9', 'Hyundai', 'Tucson', 2023, 'N-Line 1.6 T-GDI', 'Noir Profond', 7200000.00, 6600000.00, 600000.00, 'available', 'stock',
  '{"engine": "1.6 T-GDI", "transmission": "Automatic", "fuel": "Petrol", "power": "180 hp", "options": ["Leather Seats", "360 Camera", "Ventilated Seats"]}'::jsonb,
  '["https://api.sarl2sauto.dz/cars/tucson_1.jpg"]'::jsonb,
  'SUV moderne et agressif, disponible immédiatement avec garantie constructeur.'
),
(
  'a25a818c-34d1-44eb-991b-689e246995a9', 'Seat', 'Ibiza', 2022, 'Highline 1.6 MPI', 'Blanc Nevada', 3400000.00, 3100000.00, 300000.00, 'sold', 'stock',
  '{"engine": "1.6 MPI", "transmission": "Manual", "fuel": "Petrol", "power": "110 hp", "options": ["LED Lights", "Alloy Wheels 16", "Rear Sensors"]}'::jsonb,
  '[]'::jsonb,
  'Voiture citadine très économique et fiable, déjà vendue à un client fidèle.'
),
(
  'a25a818c-34d1-44eb-991b-689e246995a9', 'Porsche', '911 Carrera S', 2024, 'Carrera S Coupe', 'Bleu Gentiane', 29000000.00, 26000000.00, 3000000.00, 'available', 'sur_commande',
  '{"engine": "3.0L Flat-6 Twin-Turbo", "transmission": "PDK 8", "fuel": "Petrol", "power": "450 hp", "options": ["Sport Chrono Package", "Bose Sound", "Carbon Trim"]}'::jsonb,
  '["https://api.sarl2sauto.dz/cars/911.jpg"]'::jsonb,
  'Disponible sur commande. Livraison estimée sous 60 jours via transitaire agréé.'
),
(
  'a25a818c-34d1-44eb-991b-689e246995a9', 'Mercedes-Benz', 'Classe G 63', 2024, 'AMG', 'Noir Mat', 48000000.00, 43000000.00, 5000000.00, 'reserved', 'sur_commande',
  '{"engine": "4.0L V8 BiTurbo", "transmission": "AMG Speedshift 9G", "fuel": "Petrol", "power": "585 hp", "options": ["Night Package", "Burmester 3D", "Carbon Wheels"]}'::jsonb,
  '[]'::jsonb,
  'Commande spéciale client en cours de transit.'
);

-- 5. Seed Car Rental Fleet
INSERT INTO car_rental_fleet (id, agency_id, brand, model, year, color, daily_rate, weekly_rate, monthly_rate, status, specs, images)
VALUES 
(
  'f11a818c-34d1-44eb-991b-689e246995f1', 'a25a818c-34d1-44eb-991b-689e246995a9', 'Renault', 'Clio 5', 2022, 'Gris Platine', 7500.00, 48000.00, 180000.00, 'available',
  '{"engine": "1.5 dCi", "transmission": "Manual", "fuel": "Diesel", "seats": 5}'::jsonb,
  '["https://api.sarl2sauto.dz/rental/clio5.jpg"]'::jsonb
),
(
  'f22a818c-34d1-44eb-991b-689e246995f2', 'a25a818c-34d1-44eb-991b-689e246995a9', 'Dacia', 'Duster', 2023, 'Blanc Glacier', 12000.00, 78000.00, 290000.00, 'available',
  '{"engine": "1.5 dCi 4x4", "transmission": "Manual", "fuel": "Diesel", "seats": 5}'::jsonb,
  '["https://api.sarl2sauto.dz/rental/duster.jpg"]'::jsonb
);

-- 6. Seed Import Order with tracking (using client Sofiane Amara)
INSERT INTO import_orders (id, agency_id, client_id, vehicle_brand, vehicle_model, vehicle_year, color, specs, supplier_name, origin_country, status, carrier, tracking_number, container_number, total_cost, deposit_paid, balance_due, shipping_status)
VALUES 
(
  'd99a818c-34d1-44eb-991b-689e246995d9', 
  'a25a818c-34d1-44eb-991b-689e246995a9', 
  'c11a818c-34d1-44eb-991b-689e246995c1', 
  'Audi', 
  'RS6 Avant', 
  2023, 
  'Gris Nardo', 
  '{"engine": "4.0L V8", "power": "600 hp", "wheels": "22 inches"}'::jsonb, 
  'Audi Center Munich', 
  'Germany', 
  'shipped', 
  'CMA CGM', 
  'CC123456789', 
  'TC-99881122', 
  24000000.00, 
  12000000.00, 
  12000000.00, 
  '[
    {"status": "ordered", "date": "2026-04-10T10:00:00Z", "location": "Munich, Germany"},
    {"status": "shipped", "date": "2026-05-02T14:30:00Z", "location": "Port of Hamburg"},
    {"status": "in_transit", "date": "2026-05-15T08:00:00Z", "location": "Mediterranean Sea"}
  ]'::jsonb
);

-- 7. Seed Travel Templates & Web configuration
INSERT INTO travel_agency_templates (id, name, slug, vertical_type, default_config, preview_image_url)
VALUES 
(
  '011a818c-34d1-44eb-991b-689e246995aa', 
  'Escape Premium Template', 
  'escape-premium', 
  'travel_agency', 
  '{"theme": "teal", "hero_title": "Découvrez le monde avec élégance", "show_testimonials": true}'::jsonb, 
  'https://api.voyagepro.dz/templates/escape_preview.png'
);

INSERT INTO travel_agency_websites (agency_id, template_id, config, is_published, subdomain)
VALUES 
(
  'b99a818c-34d1-44eb-991b-689e246995b0', 
  '011a818c-34d1-44eb-991b-689e246995aa', 
  '{"hero": {"title": "Voyagez Plus Loin"}, "colors": {"primary": "#0D9488"}}'::jsonb, 
  true, 
  'escape-resort'
);

-- 8. Seed Travel Packages (Turkey, Dubai, Umrah)
INSERT INTO travel_packages (id, agency_id, title, subtitle, destination_country, destination_city, duration_days, max_travelers, base_price_per_person, child_price, infant_price, price_includes, price_excludes, itinerary, available_dates, images, tags, status)
VALUES 
(
  '111a818c-34d1-44eb-991b-689e24699501', 
  'b99a818c-34d1-44eb-991b-689e246995b0', 
  'Merveilles de Turquie', 
  'Découvrez Istanbul et la Cappadoce', 
  'Turkey', 
  'Istanbul', 
  7, 
  25, 
  145000.00, 
  95000.00, 
  25000.00, 
  '["Billet d''avion Alger - Istanbul (Aller-Retour)", "Hébergement en hôtel 4* avec petit-déjeuner", "Guide touristique francophone", "Excursions mentionnées au programme"]'::jsonb, 
  '["Dépenses personnelles", "Boissons lors des repas", "Assurance voyage optionnelle"]'::jsonb, 
  '[
    {"day": 1, "title": "Arrivée et Installation", "description": "Accueil à l''aéroport d''Istanbul et transfert à l''hôtel."},
    {"day": 2, "title": "Tour Historique", "description": "Visite guidée du Palais de Topkapi et de la Mosquée Bleue."},
    {"day": 3, "title": "Croisière sur le Bosphore", "description": "Croisière inoubliable entre deux continents."}
  ]'::jsonb, 
  '[{"departure": "2026-07-15", "price": 145000.00}, {"departure": "2026-08-10", "price": 155000.00}]'::jsonb, 
  '["https://api.voyagepro.dz/packages/istanbul1.jpg"]'::jsonb, 
  '["Culture", "Shopping", "Bosphore"]'::jsonb, 
  'active'
),
(
  '222a818c-34d1-44eb-991b-689e24699502', 
  'b99a818c-34d1-44eb-991b-689e246995b0', 
  'Évasion Moderne à Dubai', 
  'Soleil, Gratte-ciel et Aventure', 
  'United Arab Emirates', 
  'Dubai', 
  5, 
  30, 
  189000.00, 
  125000.00, 
  35000.00, 
  '["Vols directs Alger - Dubai", "Hébergement 5 jours à l''hôtel Citymax Bur Dubai", "Safari 4x4 dans le désert avec dîner BBQ", "Visa d''entrée inclus"]'::jsonb, 
  '["Déjeuners", "Pourboires", "Tickets pour Burj Khalifa"]'::jsonb, 
  '[
    {"day": 1, "title": "Bienvenue à Dubai", "description": "Arrivée à l''aéroport international de Dubai et transfert privé."},
    {"day": 2, "title": "Safari dans le désert", "description": "Aventure en 4x4 dans les dunes suivie d''une soirée traditionnelle."}
  ]'::jsonb, 
  '[{"departure": "2026-06-20", "price": 189000.00}, {"departure": "2026-09-05", "price": 179000.00}]'::jsonb, 
  '["https://api.voyagepro.dz/packages/dubai1.jpg"]'::jsonb, 
  '["Luxury", "Desert Safari", "Modern"]'::jsonb, 
  'active'
),
(
  '333a818c-34d1-44eb-991b-689e24699503', 
  'b99a818c-34d1-44eb-991b-689e246995b0', 
  'Omra Spirituelle Premium', 
  'Voyage spirituel de confort', 
  'Saudi Arabia', 
  'Mecca', 
  10, 
  40, 
  260000.00, 
  190000.00, 
  45000.00, 
  '["Vol direct avec Air Algérie", "Visa Omra", "Hébergement 5 étoiles proche du Haram à Makkah", "Transferts internes en bus VIP"]'::jsonb, 
  '["Repas non mentionnés", "Assurance médicale spéciale"]'::jsonb, 
  '[
    {"day": 1, "title": "Vol vers Médine", "description": "Arrivée à Médine, installation et prières dans la Mosquée du Prophète."},
    {"day": 5, "title": "Transfert à Makkah", "description": "Habillage de l''Ihram à l''étape de Miqat et départ pour Makkah pour effectuer l''Omra."}
  ]'::jsonb, 
  '[{"departure": "2026-10-01", "price": 260000.00}, {"departure": "2026-11-15", "price": 275000.00}]'::jsonb, 
  '["https://api.voyagepro.dz/packages/omra.jpg"]'::jsonb, 
  '["Omra", "Makkah", "Medina"]'::jsonb, 
  'active'
);

-- 9. Seed Travel Booking (using client Yacine Bensalah for Turkey package)
INSERT INTO travel_bookings (id, agency_id, client_id, package_id, departure_date, return_date, travelers_count, adults_count, children_count, infants_count, total_price, deposit_paid, balance_due, special_requests, room_preferences, dietary_requirements, status)
VALUES 
(
  'b88a818c-34d1-44eb-991b-689e246995b8', 
  'b99a818c-34d1-44eb-991b-689e246995b0', 
  'c22a818c-34d1-44eb-991b-689e246995c2', 
  '111a818c-34d1-44eb-991b-689e24699501', 
  '2026-07-15', 
  '2026-07-22', 
  2, 
  2, 
  0, 
  0, 
  290000.00, 
  100000.00, 
  190000.00, 
  'Besoin d''une assistance fauteuil roulant lors des embarquements.', 
  'Chambre Double Standard (Lit Double) - Non Fumeur', 
  'Sans préférence particulière', 
  'deposit_paid'
);

-- 10. Seed showroom template for completeness
INSERT INTO car_showroom_templates (id, name, slug, vertical_type, default_config, preview_image_url)
VALUES 
(
  '022a818c-34d1-44eb-991b-689e246995ab', 
  'Aventra Showroom Template', 
  'aventra-showroom', 
  'car_showroom', 
  '{"theme": "dark", "hero_height": "70vh", "show_quick_search": true}'::jsonb, 
  'https://api.sarl2sauto.dz/templates/aventra_preview.png'
);

INSERT INTO car_showroom_websites (agency_id, template_id, config, is_published, subdomain)
VALUES 
(
  'a25a818c-34d1-44eb-991b-689e246995a9', 
  '022a818c-34d1-44eb-991b-689e246995ab', 
  '{"hero": {"title": "Aventra Motors"}, "colors": {"primary": "#1E3A8A"}}'::jsonb, 
  true, 
  'aventra-bir-mourad-rais'
);

-- ============================================================================
-- === PRE-CREATED TEST ACCOUNTS AND PROFILES ===
-- ============================================================================

-- Ensure pgcrypto is enabled for secure hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Seed auth.users with credentials (if they do not exist)
-- Password for Platform Owner: 'secretpassword'
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at, 
  raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, 
  role, aud, confirmation_token
) VALUES (
  '8a23bb8e-1282-4bf1-bfd0-40a2bc2275f9',
  '00000000-0000-0000-0000-000000000000',
  'admin@example.com',
  crypt('secretpassword', gen_salt('bf', 10)),
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"full_name": "Platform Owner"}'::jsonb,
  false,
  now(),
  now(),
  'authenticated',
  'authenticated',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Password for Travel Admin: 'travel123'
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at, 
  raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, 
  role, aud, confirmation_token
) VALUES (
  '0150dc2d-8181-45f8-a450-7a3d639875e1',
  '00000000-0000-0000-0000-000000000000',
  'travel@agency.com',
  crypt('travel123', gen_salt('bf', 10)),
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"full_name": "Travel Admin"}'::jsonb,
  false,
  now(),
  now(),
  'authenticated',
  'authenticated',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Password for Showroom Admin: 'showroom123'
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at, 
  raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, 
  role, aud, confirmation_token
) VALUES (
  '5b533cb4-77e8-4680-bc9b-38e9a5a73e6a',
  '00000000-0000-0000-0000-000000000000',
  'showroom@agency.com',
  crypt('showroom123', gen_salt('bf', 10)),
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"full_name": "Showroom Admin"}'::jsonb,
  false,
  now(),
  now(),
  'authenticated',
  'authenticated',
  ''
) ON CONFLICT (id) DO NOTHING;

-- 2. Seed public.profiles with corresponding rows linked to the correct agency verticals
INSERT INTO public.profiles (
  id, agency_id, full_name, role, is_platform_owner, created_at, updated_at
) VALUES 
(
  '8a23bb8e-1282-4bf1-bfd0-40a2bc2275f9',
  NULL,
  'Platform Owner',
  'superadmin',
  true,
  now(),
  now()
),
(
  '0150dc2d-8181-45f8-a450-7a3d639875e1',
  'b99a818c-34d1-44eb-991b-689e246995b0', -- VoyagePro Travel Agency
  'Travel Admin',
  'superadmin',
  false,
  now(),
  now()
),
(
  '5b533cb4-77e8-4680-bc9b-38e9a5a73e6a',
  'a25a818c-34d1-44eb-991b-689e246995a9', -- A2S Auto Showroom
  'Showroom Admin',
  'superadmin',
  false,
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;
