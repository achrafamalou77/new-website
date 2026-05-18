-- =========================================================================
-- COMBINED IDEMPOTENT MIGRATIONS (0002 to 0013)
-- Generated on 2026-05-18T23:22:36.986Z
-- =========================================================================

-- =========================================================================
-- START MIGRATION: 0002_rls_hybrid.sql
-- =========================================================================

CREATE OR REPLACE FUNCTION get_current_tenant_id() RETURNS uuid AS $$
DECLARE
    tenant_id uuid;
BEGIN
    -- Try to get from local setting first
    BEGIN
        tenant_id := current_setting('app.current_tenant_id', true)::uuid;
    EXCEPTION WHEN OTHERS THEN
        tenant_id := NULL;
    END;

    -- If not set, try to get from profiles table using auth.uid()
    IF tenant_id IS NULL THEN
        SELECT agency_id INTO tenant_id 
        FROM profiles 
        WHERE id = auth.uid();
    END IF;

    RETURN tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies
-- Recreate policies using get_current_tenant_id()
-- Agencies
DROP POLICY IF EXISTS "Select agencies" ON agencies;
CREATE POLICY "Select agencies" ON agencies FOR SELECT USING (id = get_current_tenant_id());
DROP POLICY IF EXISTS "Insert agencies" ON agencies;
CREATE POLICY "Insert agencies" ON agencies FOR INSERT WITH CHECK (id = get_current_tenant_id());
DROP POLICY IF EXISTS "Update agencies" ON agencies;
CREATE POLICY "Update agencies" ON agencies FOR UPDATE USING (id = get_current_tenant_id()) WITH CHECK (id = get_current_tenant_id());
DROP POLICY IF EXISTS "Delete agencies" ON agencies;
CREATE POLICY "Delete agencies" ON agencies FOR DELETE USING (id = get_current_tenant_id() AND is_superadmin());

-- Profiles
DROP POLICY IF EXISTS "Select profiles" ON profiles;
CREATE POLICY "Select profiles" ON profiles FOR SELECT USING (agency_id = get_current_tenant_id());
DROP POLICY IF EXISTS "Insert profiles" ON profiles;
CREATE POLICY "Insert profiles" ON profiles FOR INSERT WITH CHECK (agency_id = get_current_tenant_id());
DROP POLICY IF EXISTS "Update profiles" ON profiles;
CREATE POLICY "Update profiles" ON profiles FOR UPDATE USING (agency_id = get_current_tenant_id()) WITH CHECK (agency_id = get_current_tenant_id());
DROP POLICY IF EXISTS "Delete profiles" ON profiles;
CREATE POLICY "Delete profiles" ON profiles FOR DELETE USING (agency_id = get_current_tenant_id() AND is_superadmin());

-- Trips
DROP POLICY IF EXISTS "Select trips" ON trips;
CREATE POLICY "Select trips" ON trips FOR SELECT USING (agency_id = get_current_tenant_id());
DROP POLICY IF EXISTS "Insert trips" ON trips;
CREATE POLICY "Insert trips" ON trips FOR INSERT WITH CHECK (agency_id = get_current_tenant_id());
DROP POLICY IF EXISTS "Update trips" ON trips;
CREATE POLICY "Update trips" ON trips FOR UPDATE USING (agency_id = get_current_tenant_id()) WITH CHECK (agency_id = get_current_tenant_id());
DROP POLICY IF EXISTS "Delete trips" ON trips;
CREATE POLICY "Delete trips" ON trips FOR DELETE USING (agency_id = get_current_tenant_id() AND is_superadmin());

-- Conversations
DROP POLICY IF EXISTS "Select conversations" ON conversations;
CREATE POLICY "Select conversations" ON conversations FOR SELECT USING (agency_id = get_current_tenant_id());
DROP POLICY IF EXISTS "Insert conversations" ON conversations;
CREATE POLICY "Insert conversations" ON conversations FOR INSERT WITH CHECK (agency_id = get_current_tenant_id());
DROP POLICY IF EXISTS "Update conversations" ON conversations;
CREATE POLICY "Update conversations" ON conversations FOR UPDATE USING (agency_id = get_current_tenant_id()) WITH CHECK (agency_id = get_current_tenant_id());
DROP POLICY IF EXISTS "Delete conversations" ON conversations;
CREATE POLICY "Delete conversations" ON conversations FOR DELETE USING (agency_id = get_current_tenant_id() AND is_superadmin());

-- Messages
DROP POLICY IF EXISTS "Select messages" ON messages;
CREATE POLICY "Select messages" ON messages FOR SELECT USING (conversation_id IN (SELECT id FROM conversations WHERE agency_id = get_current_tenant_id()));
DROP POLICY IF EXISTS "Insert messages" ON messages;
CREATE POLICY "Insert messages" ON messages FOR INSERT WITH CHECK (conversation_id IN (SELECT id FROM conversations WHERE agency_id = get_current_tenant_id()));
DROP POLICY IF EXISTS "Update messages" ON messages;
CREATE POLICY "Update messages" ON messages FOR UPDATE USING (conversation_id IN (SELECT id FROM conversations WHERE agency_id = get_current_tenant_id())) WITH CHECK (conversation_id IN (SELECT id FROM conversations WHERE agency_id = get_current_tenant_id()));
DROP POLICY IF EXISTS "Delete messages" ON messages;
CREATE POLICY "Delete messages" ON messages FOR DELETE USING (conversation_id IN (SELECT id FROM conversations WHERE agency_id = get_current_tenant_id()) AND is_superadmin());

-- Bookings
DROP POLICY IF EXISTS "Select bookings" ON bookings;
CREATE POLICY "Select bookings" ON bookings FOR SELECT USING (agency_id = get_current_tenant_id());
DROP POLICY IF EXISTS "Insert bookings" ON bookings;
CREATE POLICY "Insert bookings" ON bookings FOR INSERT WITH CHECK (agency_id = get_current_tenant_id());
DROP POLICY IF EXISTS "Update bookings" ON bookings;
CREATE POLICY "Update bookings" ON bookings FOR UPDATE USING (agency_id = get_current_tenant_id()) WITH CHECK (agency_id = get_current_tenant_id());
DROP POLICY IF EXISTS "Delete bookings" ON bookings;
CREATE POLICY "Delete bookings" ON bookings FOR DELETE USING (agency_id = get_current_tenant_id() AND is_superadmin());


-- =========================================================================
-- END MIGRATION: 0002_rls_hybrid.sql
-- =========================================================================


-- =========================================================================
-- START MIGRATION: 0003_admin_panel.sql
-- =========================================================================

-- Table: plans
CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    description TEXT,
    features JSONB DEFAULT '{}'::jsonb,
    max_trips INTEGER NOT NULL,
    max_employees INTEGER NOT NULL,
    ai_credits_monthly INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Default Plans
INSERT INTO plans (id, name, price, description, features, max_trips, max_employees, ai_credits_monthly) VALUES
('free', 'Free', 0, 'Basic plan for new agencies', '{"chatbot": false, "website": true}'::jsonb, 5, 1, 0),
('growth', 'Growth', 25000, 'Perfect for growing agencies', '{"chatbot": true, "website": true}'::jsonb, 50, 5, 500),
('pro', 'Pro', 45000, 'Unlimited scaling for established businesses', '{"chatbot": true, "website": true, "priority_support": true}'::jsonb, 9999, 9999, 2000) ON CONFLICT (id) DO NOTHING;

-- Alter: agencies
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS plan TEXT REFERENCES plans(id) DEFAULT 'growth';
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('active', 'inactive', 'suspended')) DEFAULT 'active';
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS owner_email TEXT;

-- Alter: profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_platform_owner BOOLEAN DEFAULT false;

-- Table: admin_audit_log
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,
    target_agency_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for plans
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public plans" ON plans;
CREATE POLICY "Public plans" ON plans FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin plans all" ON plans;
CREATE POLICY "Admin plans all" ON plans FOR ALL USING (is_superadmin()); -- Only platform owner will manage this from server side using service_role

-- RLS for admin_audit_log
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
-- No policies because it's only accessed via service_role key


-- =========================================================================
-- END MIGRATION: 0003_admin_panel.sql
-- =========================================================================


-- =========================================================================
-- START MIGRATION: 0004_agency_control_panel.sql
-- =========================================================================

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


-- =========================================================================
-- END MIGRATION: 0004_agency_control_panel.sql
-- =========================================================================


-- =========================================================================
-- START MIGRATION: 0005_client_invoice_system.sql
-- =========================================================================

-- 0005_client_invoice_system.sql

-- 1. Create clients table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    id_card_number TEXT,
    passport_number TEXT,
    date_of_birth DATE,
    address TEXT,
    city TEXT,
    source TEXT CHECK (source IN ('whatsapp', 'facebook', 'instagram', 'walk_in', 'referral', 'phone')),
    referred_by_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL,
    trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status TEXT CHECK (status IN ('draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled')) DEFAULT 'draft',
    items JSONB DEFAULT '[]'::jsonb,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    discount_amount NUMERIC NOT NULL DEFAULT 0,
    discount_percent NUMERIC NOT NULL DEFAULT 0,
    tax_amount NUMERIC NOT NULL DEFAULT 0,
    tax_percent NUMERIC NOT NULL DEFAULT 0,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    amount_paid NUMERIC NOT NULL DEFAULT 0,
    balance_due NUMERIC NOT NULL DEFAULT 0,
    payment_method TEXT CHECK (payment_method IN ('CCP', 'Edahabia', 'Cash', 'Bank Transfer', 'Check')),
    payment_status TEXT CHECK (payment_status IN ('unpaid', 'partial', 'paid')) DEFAULT 'unpaid',
    notes TEXT,
    terms TEXT,
    pdf_url TEXT,
    sent_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(agency_id, invoice_number)
);

-- 3. Create invoice_payments table
CREATE TABLE IF NOT EXISTS invoice_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL,
    payment_date DATE NOT NULL,
    reference_number TEXT,
    notes TEXT,
    received_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable RLS on new tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for clients
DROP POLICY IF EXISTS "Select clients" ON clients;
CREATE POLICY "Select clients" ON clients FOR SELECT
USING (agency_id = get_current_tenant_id());

DROP POLICY IF EXISTS "Insert clients" ON clients;
CREATE POLICY "Insert clients" ON clients FOR INSERT
WITH CHECK (agency_id = get_current_tenant_id());

DROP POLICY IF EXISTS "Update clients" ON clients;
CREATE POLICY "Update clients" ON clients FOR UPDATE
USING (agency_id = get_current_tenant_id())
WITH CHECK (agency_id = get_current_tenant_id());

DROP POLICY IF EXISTS "Delete clients" ON clients;
CREATE POLICY "Delete clients" ON clients FOR DELETE
USING (agency_id = get_current_tenant_id() AND is_superadmin());

-- 6. RLS Policies for invoices
DROP POLICY IF EXISTS "Select invoices" ON invoices;
CREATE POLICY "Select invoices" ON invoices FOR SELECT
USING (agency_id = get_current_tenant_id());

DROP POLICY IF EXISTS "Insert invoices" ON invoices;
CREATE POLICY "Insert invoices" ON invoices FOR INSERT
WITH CHECK (agency_id = get_current_tenant_id());

DROP POLICY IF EXISTS "Update invoices" ON invoices;
CREATE POLICY "Update invoices" ON invoices FOR UPDATE
USING (agency_id = get_current_tenant_id())
WITH CHECK (agency_id = get_current_tenant_id());

DROP POLICY IF EXISTS "Delete invoices" ON invoices;
CREATE POLICY "Delete invoices" ON invoices FOR DELETE
USING (agency_id = get_current_tenant_id() AND is_superadmin());

-- 7. RLS Policies for invoice_payments
DROP POLICY IF EXISTS "Select payments" ON invoice_payments;
CREATE POLICY "Select payments" ON invoice_payments FOR SELECT
USING (invoice_id IN (SELECT id FROM invoices WHERE agency_id = get_current_tenant_id()));

DROP POLICY IF EXISTS "Insert payments" ON invoice_payments;
CREATE POLICY "Insert payments" ON invoice_payments FOR INSERT
WITH CHECK (invoice_id IN (SELECT id FROM invoices WHERE agency_id = get_current_tenant_id()));

DROP POLICY IF EXISTS "Update payments" ON invoice_payments;
CREATE POLICY "Update payments" ON invoice_payments FOR UPDATE
USING (invoice_id IN (SELECT id FROM invoices WHERE agency_id = get_current_tenant_id()))
WITH CHECK (invoice_id IN (SELECT id FROM invoices WHERE agency_id = get_current_tenant_id()));

DROP POLICY IF EXISTS "Delete payments" ON invoice_payments;
CREATE POLICY "Delete payments" ON invoice_payments FOR DELETE
USING (invoice_id IN (SELECT id FROM invoices WHERE agency_id = get_current_tenant_id()) AND is_superadmin());

-- 8. Auto-numbering function
CREATE OR REPLACE FUNCTION get_next_invoice_number(p_agency_id UUID, p_issue_date DATE)
RETURNS TEXT AS $$
DECLARE
    v_year TEXT;
    v_next_num INTEGER;
    v_max_str TEXT;
BEGIN
    v_year := to_char(p_issue_date, 'YYYY');
    
    SELECT MAX(invoice_number) INTO v_max_str 
    FROM invoices 
    WHERE agency_id = p_agency_id 
      AND invoice_number LIKE 'FA-' || v_year || '-%';
      
    IF v_max_str IS NULL THEN
        v_next_num := 1;
    ELSE
        v_next_num := (substring(v_max_str from 9)::integer) + 1;
    END IF;
    
    RETURN 'FA-' || v_year || '-' || lpad(v_next_num::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- 9. Trigger to auto-recalculate payment metrics on modification
CREATE OR REPLACE FUNCTION update_invoice_payment_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_invoice_id UUID;
    v_total NUMERIC;
    v_paid NUMERIC;
BEGIN
    v_invoice_id := COALESCE(NEW.invoice_id, OLD.invoice_id);
    
    SELECT total_amount INTO v_total FROM invoices WHERE id = v_invoice_id;
    SELECT COALESCE(SUM(amount), 0) INTO v_paid FROM invoice_payments WHERE invoice_id = v_invoice_id;
    
    UPDATE invoices
    SET 
        amount_paid = v_paid,
        balance_due = v_total - v_paid,
        payment_status = CASE 
            WHEN v_paid <= 0 THEN 'unpaid'
            WHEN v_paid >= v_total THEN 'paid'
            ELSE 'partial'
        END,
        status = CASE 
            WHEN v_paid >= v_total THEN 'paid'
            WHEN v_paid > 0 AND status = 'draft' THEN 'partial'
            ELSE status
        END,
        paid_at = CASE WHEN v_paid >= v_total THEN now() ELSE NULL END
    WHERE id = v_invoice_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_invoice_payment_totals ON invoice_payments;
CREATE TRIGGER trigger_update_invoice_payment_totals
AFTER INSERT OR UPDATE OR DELETE ON invoice_payments
FOR EACH ROW
EXECUTE FUNCTION update_invoice_payment_totals();


-- =========================================================================
-- END MIGRATION: 0005_client_invoice_system.sql
-- =========================================================================


-- =========================================================================
-- START MIGRATION: 0006_complex_travel_packages.sql
-- =========================================================================

-- supabase/migrations/0006_complex_travel_packages.sql

ALTER TABLE trips ADD COLUMN IF NOT EXISTS trip_type TEXT DEFAULT 'package';
ALTER TABLE trips ADD COLUMN IF NOT EXISTS destination_country TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS destination_cities JSONB DEFAULT '[]'::jsonb;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS transport_type TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS transport_details JSONB DEFAULT '{}'::jsonb;

ALTER TABLE trips ADD COLUMN IF NOT EXISTS accommodation_type TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS hotel_name TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS room_type TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS meal_plan TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS num_nights INTEGER;

ALTER TABLE trips ADD COLUMN IF NOT EXISTS itinerary JSONB DEFAULT '[]'::jsonb;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS included_items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS excluded_items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS guide_included BOOLEAN DEFAULT false;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS guide_language TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS group_size_min INTEGER;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS group_size_max INTEGER;

ALTER TABLE trips ADD COLUMN IF NOT EXISTS child_policy JSONB DEFAULT '{}'::jsonb;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS single_supplement INTEGER DEFAULT 0;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS group_discounts JSONB DEFAULT '[]'::jsonb;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS early_bird_discount JSONB DEFAULT '{}'::jsonb;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS last_minute_price INTEGER;

ALTER TABLE trips ADD COLUMN IF NOT EXISTS visa_required BOOLEAN DEFAULT false;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS visa_details JSONB DEFAULT '{}'::jsonb;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS passport_validity_months INTEGER DEFAULT 6;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS vaccinations_required BOOLEAN DEFAULT false;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS required_documents JSONB DEFAULT '[]'::jsonb;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS booking_deadline_days INTEGER DEFAULT 7;

ALTER TABLE trips ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS brochure_url TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS map_image_url TEXT;

ALTER TABLE trips ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS available_dates JSONB DEFAULT '[]'::jsonb;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS max_bookings INTEGER;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS bookings_open BOOLEAN DEFAULT true;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS show_on_website BOOLEAN DEFAULT true;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS show_on_chatbot BOOLEAN DEFAULT true;


-- =========================================================================
-- END MIGRATION: 0006_complex_travel_packages.sql
-- =========================================================================


-- =========================================================================
-- START MIGRATION: 0007_employee_management_hr.sql
-- =========================================================================

-- Supabase Migration: 0007_employee_management_hr.sql
-- Create Employee Management, Custom Roles, Attendance, Leave, Payroll, Kanban Tasks, and Announcements tables

-- 1. Roles Table
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  permissions JSONB DEFAULT '[]'::jsonb, -- Array of string keys
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (agency_id, name)
);

-- Enable RLS on roles
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all agency users to view roles" ON public.roles;
CREATE POLICY "Allow all agency users to view roles"
  ON public.roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.agency_id = roles.agency_id
    )
  );

DROP POLICY IF EXISTS "Allow superadmins to manage roles" ON public.roles;
CREATE POLICY "Allow superadmins to manage roles"
  ON public.roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.agency_id = roles.agency_id AND profiles.role = 'superadmin'
    )
  );

-- Pre-populate default roles helper function
CREATE OR REPLACE FUNCTION populate_default_roles(p_agency_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.roles (agency_id, name, permissions) VALUES
    (p_agency_id, 'Superadmin', '["all"]'::jsonb),
    (p_agency_id, 'Manager', '["view_dashboard", "manage_inbox", "manage_clients", "manage_trips", "manage_bookings", "manage_invoices", "manage_team", "manage_settings"]'::jsonb),
    (p_agency_id, 'Sales Agent', '["view_dashboard", "manage_inbox", "manage_clients", "manage_bookings", "manage_invoices"]'::jsonb),
    (p_agency_id, 'Guide', '["view_dashboard", "view_trips", "view_bookings"]'::jsonb),
    (p_agency_id, 'Accountant', '["view_dashboard", "manage_invoices", "manage_payroll"]'::jsonb),
    (p_agency_id, 'Social Media', '["view_dashboard", "manage_inbox", "manage_announcements"]'::jsonb),
    (p_agency_id, 'Read Only', '["view_dashboard"]'::jsonb)
  ON CONFLICT (agency_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically populate roles when a new agency is created
CREATE OR REPLACE FUNCTION handle_new_agency_roles()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM populate_default_roles(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_agency_created_roles ON public.agencies;
CREATE TRIGGER on_agency_created_roles
  AFTER INSERT ON public.agencies
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_agency_roles();

-- Run for existing agencies
DO $$
DECLARE
  v_agency RECORD;
BEGIN
  FOR v_agency IN SELECT id FROM public.agencies LOOP
    PERFORM populate_default_roles(v_agency.id);
  END LOOP;
END;
$$;


-- Helper to auto-generate employee code (EMP-001) per agency
CREATE OR REPLACE FUNCTION generate_employee_code(p_agency_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_next_num INTEGER;
  v_code TEXT;
BEGIN
  SELECT COALESCE(MAX(SUBSTRING(employee_code FROM '[0-9]+')::INTEGER), 0) + 1
  INTO v_next_num
  FROM public.employees
  WHERE agency_id = p_agency_id;
  
  v_code := 'EMP-' || LPAD(v_next_num::TEXT, 3, '0');
  RETURN v_code;
END;
$$ LANGUAGE plpgsql;


-- 2. Employees Table (extends profiles)
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  
  -- Personal
  date_of_birth DATE,
  place_of_birth TEXT,
  nationality TEXT DEFAULT 'Algerian',
  gender TEXT CHECK (gender IN ('male', 'female')),
  marital_status TEXT CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed')),
  num_children INTEGER DEFAULT 0,
  
  -- Employment
  employee_code TEXT, -- like EMP-001
  department TEXT CHECK (department IN ('Sales', 'Operations', 'Finance', 'Marketing', 'Guides')),
  role TEXT, -- custom role name
  employment_type TEXT CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'intern')),
  hire_date DATE DEFAULT CURRENT_DATE,
  probation_end DATE,
  contract_end DATE,
  status TEXT CHECK (status IN ('active', 'on_leave', 'suspended', 'terminated', 'resigned')) DEFAULT 'active',
  
  -- Compensation
  base_salary INTEGER DEFAULT 40000, -- monthly DZD
  commission_percent DECIMAL(5,2) DEFAULT 0,
  commission_tier JSONB DEFAULT '{}'::jsonb,
  bonus_eligible BOOLEAN DEFAULT false,
  payment_method TEXT CHECK (payment_method IN ('ccp', 'bank_transfer', 'cash')) DEFAULT 'ccp',
  ccp_account TEXT,
  bank_account TEXT,
  bank_name TEXT,
  
  -- Work
  work_schedule JSONB DEFAULT '{"saturday": "09:00 - 18:00", "sunday": "09:00 - 18:00", "monday": "09:00 - 18:00", "tuesday": "09:00 - 18:00", "wednesday": "09:00 - 18:00", "thursday": "09:00 - 18:00", "friday": "Closed"}'::jsonb,
  branch_location TEXT,
  manager_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  
  -- Documents
  id_card_front_url TEXT,
  id_card_back_url TEXT,
  passport_url TEXT,
  contract_url TEXT,
  certifications JSONB DEFAULT '[]'::jsonb,
  
  -- Emergency
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relation TEXT,
  
  -- Leave
  annual_leave_days INTEGER DEFAULT 30,
  sick_leave_days INTEGER DEFAULT 15,
  remaining_annual_leave INTEGER DEFAULT 30,
  remaining_sick_leave INTEGER DEFAULT 15,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on employees
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow agency users to view employee directory" ON public.employees;
CREATE POLICY "Allow agency users to view employee directory"
  ON public.employees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.agency_id = employees.agency_id
    )
  );

DROP POLICY IF EXISTS "Allow superadmins and managers to manage employees" ON public.employees;
CREATE POLICY "Allow superadmins and managers to manage employees"
  ON public.employees FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.agency_id = employees.agency_id AND profiles.role IN ('superadmin', 'manager')
    )
  );

-- Trigger to automatically create an employee entry when a profile is created
CREATE OR REPLACE FUNCTION public.handle_new_profile_employee()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.employees (
    id,
    agency_id,
    employee_code,
    status,
    nationality,
    annual_leave_days,
    sick_leave_days,
    remaining_annual_leave,
    remaining_sick_leave
  ) VALUES (
    NEW.id,
    NEW.agency_id,
    public.generate_employee_code(NEW.agency_id),
    'active',
    'Algerian',
    30,
    15,
    30,
    15
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created_employee ON public.profiles;
CREATE TRIGGER on_profile_created_employee
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_profile_employee();

-- Backfill employees for existing profiles
DO $$
DECLARE
  v_profile RECORD;
BEGIN
  FOR v_profile IN SELECT id, agency_id FROM public.profiles LOOP
    INSERT INTO public.employees (id, agency_id, employee_code, status, nationality)
    VALUES (v_profile.id, v_profile.agency_id, public.generate_employee_code(v_profile.agency_id), 'active', 'Algerian')
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END;
$$;


-- 3. Attendance Table
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT CHECK (status IN ('present', 'absent', 'late', 'leave')) NOT NULL,
  check_in TIME,
  check_out TIME,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (employee_id, date)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow members to view agency attendance" ON public.attendance;
CREATE POLICY "Allow members to view agency attendance"
  ON public.attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.agency_id = attendance.agency_id
    )
  );

DROP POLICY IF EXISTS "Allow members to record attendance" ON public.attendance;
CREATE POLICY "Allow members to record attendance"
  ON public.attendance FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.agency_id = attendance.agency_id
    )
  );


-- 4. Leaves Table
CREATE TABLE IF NOT EXISTS public.leaves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  leave_type TEXT CHECK (leave_type IN ('annual', 'sick', 'hajj', 'other')) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  reason TEXT,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow members to view leaves" ON public.leaves;
CREATE POLICY "Allow members to view leaves"
  ON public.leaves FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.agency_id = leaves.agency_id
    )
  );

DROP POLICY IF EXISTS "Allow managers or superadmins to approve leaves" ON public.leaves;
CREATE POLICY "Allow managers or superadmins to approve leaves"
  ON public.leaves FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.agency_id = leaves.agency_id AND profiles.role IN ('superadmin', 'manager')
    )
  );


-- 5. Payroll Table
CREATE TABLE IF NOT EXISTS public.payroll (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  month INTEGER CHECK (month >= 1 AND month <= 12) NOT NULL,
  year INTEGER NOT NULL,
  base_salary INTEGER NOT NULL,
  commission INTEGER DEFAULT 0,
  bonuses INTEGER DEFAULT 0,
  deductions INTEGER DEFAULT 0,
  net_salary INTEGER NOT NULL,
  status TEXT CHECK (status IN ('draft', 'paid')) DEFAULT 'draft',
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (employee_id, month, year)
);

ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow members to view their own payroll" ON public.payroll;
CREATE POLICY "Allow members to view their own payroll"
  ON public.payroll FOR SELECT
  USING (
    auth.uid() = employee_id OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.agency_id = payroll.agency_id AND profiles.role IN ('superadmin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Allow superadmins to manage payroll" ON public.payroll;
CREATE POLICY "Allow superadmins to manage payroll"
  ON public.payroll FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.agency_id = payroll.agency_id AND profiles.role IN ('superadmin', 'manager')
    )
  );


-- 6. Kanban Tasks Table
CREATE TABLE IF NOT EXISTS public.hr_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('todo', 'in_progress', 'done', 'blocked')) DEFAULT 'todo',
  assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.hr_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow members to view Kanban tasks" ON public.hr_tasks;
CREATE POLICY "Allow members to view Kanban tasks"
  ON public.hr_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.agency_id = hr_tasks.agency_id
    )
  );

DROP POLICY IF EXISTS "Allow members to manage Kanban tasks" ON public.hr_tasks;
CREATE POLICY "Allow members to manage Kanban tasks"
  ON public.hr_tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.agency_id = hr_tasks.agency_id
    )
  );


-- 7. Announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  read_by JSONB DEFAULT '[]'::jsonb, -- Array of profiles.id strings
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow members to view announcements" ON public.announcements;
CREATE POLICY "Allow members to view announcements"
  ON public.announcements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.agency_id = announcements.agency_id
    )
  );

DROP POLICY IF EXISTS "Allow managers to publish announcements" ON public.announcements;
CREATE POLICY "Allow managers to publish announcements"
  ON public.announcements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.agency_id = announcements.agency_id AND profiles.role IN ('superadmin', 'manager')
    )
  );


-- Indexing for maximum performance
CREATE INDEX IF NOT EXISTS idx_roles_agency_id ON public.roles(agency_id);
CREATE INDEX IF NOT EXISTS idx_employees_agency_id ON public.employees(agency_id);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON public.attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_leaves_employee_id ON public.leaves(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_employee_id ON public.payroll(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_tasks_agency_id ON public.hr_tasks(agency_id);
CREATE INDEX IF NOT EXISTS idx_announcements_agency_id ON public.announcements(agency_id);


-- =========================================================================
-- END MIGRATION: 0007_employee_management_hr.sql
-- =========================================================================


-- =========================================================================
-- START MIGRATION: 0008_finance_management.sql
-- =========================================================================

-- Supabase Migration: 0008_finance_management.sql
-- Finance & Money Management, Accounting, and Supplier Tracking (Fully Idempotent)

-- 1. Financial Accounts
CREATE TABLE IF NOT EXISTS public.financial_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('ccp', 'edahabia', 'cash', 'bank', 'other')),
  account_number TEXT,
  bank_name TEXT,
  opening_balance INTEGER DEFAULT 0,
  current_balance INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'DZD',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('airline', 'hotel', 'bus_company', 'guide_service', 'insurance', 'visa_service', 'other')),
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  country TEXT,
  payment_terms TEXT,
  currency TEXT DEFAULT 'DZD',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Supplier Payments (Accounts Payable)
CREATE TABLE IF NOT EXISTS public.supplier_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  description TEXT,
  amount_due INTEGER NOT NULL,
  amount_paid INTEGER DEFAULT 0,
  balance_due INTEGER GENERATED ALWAYS AS (amount_due - amount_paid) STORED,
  due_date DATE,
  status TEXT CHECK (status IN ('unpaid', 'partial', 'paid', 'overdue')) DEFAULT 'unpaid',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Transactions (Ledger)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.financial_accounts(id) ON DELETE CASCADE,
  transfer_to_account_id UUID REFERENCES public.financial_accounts(id) ON DELETE CASCADE, -- For transfers
  
  type TEXT CHECK (type IN ('income', 'expense', 'transfer')),
  category TEXT, 
  
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'DZD',
  exchange_rate DECIMAL(10,4) DEFAULT 1,
  
  description TEXT,
  reference_number TEXT, -- CCP receipt, etc.
  
  related_booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  related_invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  related_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  related_supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  
  payment_method TEXT CHECK (payment_method IN ('ccp', 'edahabia', 'cash', 'bank_transfer', 'check', 'other')),
  payment_proof_url TEXT,
  
  transaction_date DATE DEFAULT CURRENT_DATE,
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS Policies
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they already exist
-- Recreate policies
-- Financial Accounts Policy
DROP POLICY IF EXISTS "Allow users to view agency financial accounts" ON public.financial_accounts;
CREATE POLICY "Allow users to view agency financial accounts"
  ON public.financial_accounts FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.agency_id = financial_accounts.agency_id));

DROP POLICY IF EXISTS "Allow superadmins and managers to manage financial accounts" ON public.financial_accounts;
CREATE POLICY "Allow superadmins and managers to manage financial accounts"
  ON public.financial_accounts FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.agency_id = financial_accounts.agency_id AND profiles.role IN ('superadmin', 'manager', 'accountant')));

-- Suppliers Policy
DROP POLICY IF EXISTS "Allow users to view agency suppliers" ON public.suppliers;
CREATE POLICY "Allow users to view agency suppliers"
  ON public.suppliers FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.agency_id = suppliers.agency_id));

DROP POLICY IF EXISTS "Allow managers to manage suppliers" ON public.suppliers;
CREATE POLICY "Allow managers to manage suppliers"
  ON public.suppliers FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.agency_id = suppliers.agency_id AND profiles.role IN ('superadmin', 'manager', 'accountant')));

-- Supplier Payments Policy
DROP POLICY IF EXISTS "Allow users to view supplier payments" ON public.supplier_payments;
CREATE POLICY "Allow users to view supplier payments"
  ON public.supplier_payments FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.agency_id = supplier_payments.agency_id));

DROP POLICY IF EXISTS "Allow managers to manage supplier payments" ON public.supplier_payments;
CREATE POLICY "Allow managers to manage supplier payments"
  ON public.supplier_payments FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.agency_id = supplier_payments.agency_id AND profiles.role IN ('superadmin', 'manager', 'accountant')));

-- Transactions Policy
DROP POLICY IF EXISTS "Allow users to view transactions" ON public.transactions;
CREATE POLICY "Allow users to view transactions"
  ON public.transactions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.agency_id = transactions.agency_id));

DROP POLICY IF EXISTS "Allow users to insert transactions" ON public.transactions;
CREATE POLICY "Allow users to insert transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.agency_id = transactions.agency_id));

DROP POLICY IF EXISTS "Allow managers to update/delete transactions" ON public.transactions;
CREATE POLICY "Allow managers to update/delete transactions"
  ON public.transactions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.agency_id = transactions.agency_id AND profiles.role IN ('superadmin', 'manager', 'accountant')));

-- Trigger to update financial_accounts balance automatically
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle Insert
  IF (TG_OP = 'INSERT') THEN
    IF (NEW.type = 'income') THEN
      UPDATE public.financial_accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.account_id;
    ELSIF (NEW.type = 'expense') THEN
      UPDATE public.financial_accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.account_id;
    ELSIF (NEW.type = 'transfer') THEN
      UPDATE public.financial_accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.account_id;
      UPDATE public.financial_accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.transfer_to_account_id;
    END IF;
  
  -- Handle Delete
  ELSIF (TG_OP = 'DELETE') THEN
    IF (OLD.type = 'income') THEN
      UPDATE public.financial_accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.account_id;
    ELSIF (OLD.type = 'expense') THEN
      UPDATE public.financial_accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.account_id;
    ELSIF (OLD.type = 'transfer') THEN
      UPDATE public.financial_accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.account_id;
      UPDATE public.financial_accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.transfer_to_account_id;
    END IF;
    
  -- Handle Update
  ELSIF (TG_OP = 'UPDATE') THEN
    -- First revert old amount
    IF (OLD.type = 'income') THEN
      UPDATE public.financial_accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.account_id;
    ELSIF (OLD.type = 'expense') THEN
      UPDATE public.financial_accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.account_id;
    ELSIF (OLD.type = 'transfer') THEN
      UPDATE public.financial_accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.account_id;
      UPDATE public.financial_accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.transfer_to_account_id;
    END IF;
    
    -- Then apply new amount
    IF (NEW.type = 'income') THEN
      UPDATE public.financial_accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.account_id;
    ELSIF (NEW.type = 'expense') THEN
      UPDATE public.financial_accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.account_id;
    ELSIF (NEW.type = 'transfer') THEN
      UPDATE public.financial_accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.account_id;
      UPDATE public.financial_accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.transfer_to_account_id;
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger before creating it to prevent "already exists" errors
DROP TRIGGER IF EXISTS transaction_balance_trigger ON public.transactions;
CREATE TRIGGER transaction_balance_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION update_account_balance();


-- =========================================================================
-- END MIGRATION: 0008_finance_management.sql
-- =========================================================================


-- =========================================================================
-- START MIGRATION: 0009_website_template_system.sql
-- =========================================================================

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


-- =========================================================================
-- END MIGRATION: 0009_website_template_system.sql
-- =========================================================================


-- =========================================================================
-- START MIGRATION: 0010_visa_management.sql
-- =========================================================================

-- Supabase Migration: 0010_visa_management.sql
-- Create Visa Types, Visa Applications, Visa Payments, Visa Timeline Events, seeds defaults, and configures RLS & triggers

-- 1. Create visa_types table
CREATE TABLE IF NOT EXISTS public.visa_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    destination_country TEXT NOT NULL,
    category TEXT CHECK (category IN ('Tourism', 'Business', 'Medical', 'Umrah', 'Student', 'Transit')) DEFAULT 'Tourism',
    processing_time TEXT NOT NULL,
    validity TEXT NOT NULL,
    stay_duration TEXT NOT NULL,
    government_fee NUMERIC NOT NULL DEFAULT 0, -- DZD Government fee
    service_fee NUMERIC NOT NULL DEFAULT 0,    -- DZD Standard service charge
    express_fee NUMERIC NOT NULL DEFAULT 0,    -- DZD Express service charge
    application_method TEXT CHECK (application_method IN ('Online', 'Embassy', 'On Arrival', 'Agency')) DEFAULT 'Embassy',
    application_url TEXT,
    biometric_required BOOLEAN NOT NULL DEFAULT FALSE,
    interview_required BOOLEAN NOT NULL DEFAULT FALSE,
    applicable_wilayas INTEGER[] DEFAULT '{}'::integer[], -- 1 to 58
    documents_required JSONB DEFAULT '[]'::jsonb, -- Array of {name, description, required, notes}
    special_notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (agency_id, name)
);

-- 2. Create visa_applications table
CREATE TABLE IF NOT EXISTS public.visa_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    visa_type_id UUID REFERENCES public.visa_types(id) ON DELETE SET NULL,
    status TEXT CHECK (status IN ('inquiry', 'documents_pending', 'documents_received', 'application_submitted', 'under_review', 'approved', 'rejected', 'completed')) DEFAULT 'inquiry',
    service_level TEXT CHECK (service_level IN ('standard', 'express', 'vip')) DEFAULT 'standard',
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    -- Group Visa Linking (Umrah or family group coordination)
    group_id UUID, -- self-referencing or abstract ID grouping multiple applicants together
    group_name TEXT,
    
    -- Finances
    government_fee NUMERIC NOT NULL DEFAULT 0,
    service_fee NUMERIC NOT NULL DEFAULT 0,
    extra_fee NUMERIC NOT NULL DEFAULT 0, -- translation, courier, extra services
    total_fee NUMERIC NOT NULL DEFAULT 0,
    amount_paid NUMERIC NOT NULL DEFAULT 0,
    payment_status TEXT CHECK (payment_status IN ('unpaid', 'partial', 'paid')) DEFAULT 'unpaid',
    
    -- Dates
    appointment_date TIMESTAMPTZ,
    target_application_date DATE,
    decision_date DATE,
    expiry_date DATE,
    
    rejection_reason TEXT,
    client_notes TEXT,
    internal_notes TEXT,
    documents_status JSONB DEFAULT '[]'::jsonb, -- Array of {name, status, received_at, file_url}
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create visa_payments table (CCP/Cash tracking)
CREATE TABLE IF NOT EXISTS public.visa_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES public.visa_applications(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL DEFAULT 0,
    payment_method TEXT CHECK (payment_method IN ('CCP', 'Edahabia', 'Cash', 'Bank Transfer', 'Check')) NOT NULL,
    payment_date DATE NOT NULL,
    reference_number TEXT, -- CCP slip / Edahabia transaction ID / Receipt number
    receipt_url TEXT, -- uploaded receipt scan link
    notes TEXT,
    received_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create visa_timeline_events table
CREATE TABLE IF NOT EXISTS public.visa_timeline_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES public.visa_applications(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_internal BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.visa_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visa_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visa_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visa_timeline_events ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Visa Types RLS
DROP POLICY IF EXISTS "Select visa types" ON public.visa_types;
CREATE POLICY "Select visa types" ON public.visa_types FOR SELECT
    USING (agency_id = get_current_tenant_id());

DROP POLICY IF EXISTS "Insert visa types" ON public.visa_types;
CREATE POLICY "Insert visa types" ON public.visa_types FOR INSERT
    WITH CHECK (agency_id = get_current_tenant_id());

DROP POLICY IF EXISTS "Update visa types" ON public.visa_types;
CREATE POLICY "Update visa types" ON public.visa_types FOR UPDATE
    USING (agency_id = get_current_tenant_id())
    WITH CHECK (agency_id = get_current_tenant_id());

DROP POLICY IF EXISTS "Delete visa types" ON public.visa_types;
CREATE POLICY "Delete visa types" ON public.visa_types FOR DELETE
    USING (agency_id = get_current_tenant_id() AND is_superadmin());

-- Visa Applications RLS
DROP POLICY IF EXISTS "Select visa applications" ON public.visa_applications;
CREATE POLICY "Select visa applications" ON public.visa_applications FOR SELECT
    USING (agency_id = get_current_tenant_id());

DROP POLICY IF EXISTS "Insert visa applications" ON public.visa_applications;
CREATE POLICY "Insert visa applications" ON public.visa_applications FOR INSERT
    WITH CHECK (agency_id = get_current_tenant_id());

DROP POLICY IF EXISTS "Update visa applications" ON public.visa_applications;
CREATE POLICY "Update visa applications" ON public.visa_applications FOR UPDATE
    USING (agency_id = get_current_tenant_id())
    WITH CHECK (agency_id = get_current_tenant_id());

DROP POLICY IF EXISTS "Delete visa applications" ON public.visa_applications;
CREATE POLICY "Delete visa applications" ON public.visa_applications FOR DELETE
    USING (agency_id = get_current_tenant_id() AND is_superadmin());

-- Visa Payments RLS
DROP POLICY IF EXISTS "Select visa payments" ON public.visa_payments;
CREATE POLICY "Select visa payments" ON public.visa_payments FOR SELECT
    USING (application_id IN (SELECT id FROM public.visa_applications WHERE agency_id = get_current_tenant_id()));

DROP POLICY IF EXISTS "Insert visa payments" ON public.visa_payments;
CREATE POLICY "Insert visa payments" ON public.visa_payments FOR INSERT
    WITH CHECK (application_id IN (SELECT id FROM public.visa_applications WHERE agency_id = get_current_tenant_id()));

-- Visa Timeline Events RLS
DROP POLICY IF EXISTS "Select visa timeline events" ON public.visa_timeline_events;
CREATE POLICY "Select visa timeline events" ON public.visa_timeline_events FOR SELECT
    USING (application_id IN (SELECT id FROM public.visa_applications WHERE agency_id = get_current_tenant_id()));

DROP POLICY IF EXISTS "Insert visa timeline events" ON public.visa_timeline_events;
CREATE POLICY "Insert visa timeline events" ON public.visa_timeline_events FOR INSERT
    WITH CHECK (application_id IN (SELECT id FROM public.visa_applications WHERE agency_id = get_current_tenant_id()));


-- 6. Trigger to automatically calculate payment status on payment additions
CREATE OR REPLACE FUNCTION public.update_visa_payment_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_app_id UUID;
    v_total NUMERIC;
    v_paid NUMERIC;
BEGIN
    v_app_id := COALESCE(NEW.application_id, OLD.application_id);
    
    SELECT total_fee INTO v_total FROM public.visa_applications WHERE id = v_app_id;
    SELECT COALESCE(SUM(amount), 0) INTO v_paid FROM public.visa_payments WHERE application_id = v_app_id;
    
    UPDATE public.visa_applications
    SET 
        amount_paid = v_paid,
        payment_status = CASE 
            WHEN v_paid <= 0 THEN 'unpaid'
            WHEN v_paid >= v_total THEN 'paid'
            ELSE 'partial'
        END
    WHERE id = v_app_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_visa_payment_totals ON public.visa_payments;
CREATE TRIGGER trigger_update_visa_payment_totals
AFTER INSERT OR UPDATE OR DELETE ON public.visa_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_visa_payment_totals();


-- 7. Pre-populate default visa types helper function
CREATE OR REPLACE FUNCTION public.populate_default_visa_types(p_agency_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Turkey e-Visa
  INSERT INTO public.visa_types (agency_id, name, destination_country, category, processing_time, validity, stay_duration, government_fee, service_fee, express_fee, application_method, biometric_required, interview_required, applicable_wilayas, documents_required, special_notes)
  VALUES (
    p_agency_id,
    'Turkey e-Visa',
    'Turkey',
    'Tourism',
    '1-2 business days',
    '180 days',
    '30 days per entry',
    8500,
    5000,
    10000,
    'Online',
    FALSE,
    FALSE,
    ARRAY[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58],
    '[
      {"name": "Passport copy", "description": "Bio-page scan, valid at least 6 months", "required": true, "notes": "Must be clear, no fingers clipping"},
      {"name": "Algerian ID card (CNI)", "description": "National identity card scan", "required": true, "notes": "Both sides"},
      {"name": "Hotel Booking", "description": "Simulated or confirmed hotel voucher", "required": false, "notes": "Provided by agency if needed"},
      {"name": "Flight Ticket", "description": "Round trip ticket reservation", "required": false, "notes": "Provided by agency"}
    ]'::jsonb,
    'Usually approved instantly online. Under 18 or over 35 rules may apply for normal visas, but e-visa is direct for eligible passport holds.'
  ) ON CONFLICT (agency_id, name) DO NOTHING;

  -- Schengen France
  INSERT INTO public.visa_types (agency_id, name, destination_country, category, processing_time, validity, stay_duration, government_fee, service_fee, express_fee, application_method, biometric_required, interview_required, applicable_wilayas, documents_required, special_notes)
  VALUES (
    p_agency_id,
    'Schengen - France',
    'France',
    'Tourism',
    '10-15 business days',
    '90 days',
    '90 days per entry',
    12000,
    8000,
    15000,
    'Embassy',
    TRUE,
    FALSE,
    ARRAY[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58],
    '[
      {"name": "Passport scan", "description": "Copy of all pages containing visas or stamps", "required": true, "notes": "Must have 2 blank pages"},
      {"name": "National ID (CNI)", "description": "Clear color copy of Algerian national ID", "required": true, "notes": "Both sides"},
      {"name": "Bank Statement (Euros/DZD)", "description": "3-month detailed historical statement", "required": true, "notes": "Needs high balance (min 1500€ equivalent)"},
      {"name": "Affiliation CNAS or CASNOS", "description": "Social security registration proof", "required": true, "notes": "Recent update document"},
      {"name": "Work Attestation / Commercial Registry", "description": "Employment letter or business registration license", "required": true, "notes": "Signed and stamped"},
      {"name": "Travel Insurance", "description": "Aventra Schengen approved insurance covers min 30,000€", "required": true, "notes": "Provided by agency"}
    ]'::jsonb,
    'Requires biometric appointment at VFS Global (Algiers, Oran, or Constantine depending on Wilaya).'
  ) ON CONFLICT (agency_id, name) DO NOTHING;

  -- Schengen Spain
  INSERT INTO public.visa_types (agency_id, name, destination_country, category, processing_time, validity, stay_duration, government_fee, service_fee, express_fee, application_method, biometric_required, interview_required, applicable_wilayas, documents_required, special_notes)
  VALUES (
    p_agency_id,
    'Schengen - Spain',
    'Spain',
    'Tourism',
    '15-20 business days',
    '90 days',
    '90 days per entry',
    12000,
    8000,
    15000,
    'Embassy',
    TRUE,
    FALSE,
    ARRAY[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58],
    '[
      {"name": "Passport", "description": "Original passport valid for 6 months", "required": true, "notes": "Includes copies of previous Schengen visas"},
      {"name": "National ID (CNI)", "description": "Algerian ID card scan", "required": true, "notes": "Clear color copy"},
      {"name": "Euros Bank Statement", "description": "3-month statement from Euro account", "required": true, "notes": "High balance is critical"},
      {"name": "CNAS Updates", "description": "Employment social security history certificate", "required": true, "notes": "Attestation de mise à jour"},
      {"name": "Travel Insurance", "description": "Schengen compliant health travel insurance", "required": true, "notes": "Provided by agency"}
    ]'::jsonb,
    'Processed through BLS International offices in Algiers and Oran.'
  ) ON CONFLICT (agency_id, name) DO NOTHING;

  -- Schengen Italy
  INSERT INTO public.visa_types (agency_id, name, destination_country, category, processing_time, validity, stay_duration, government_fee, service_fee, express_fee, application_method, biometric_required, interview_required, applicable_wilayas, documents_required, special_notes)
  VALUES (
    p_agency_id,
    'Schengen - Italy',
    'Italy',
    'Tourism',
    '10-15 business days',
    '90 days',
    '90 days per entry',
    12000,
    8000,
    15000,
    'Embassy',
    TRUE,
    FALSE,
    ARRAY[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58],
    '[
      {"name": "Passport copy", "description": "Clear copy of passport pages", "required": true, "notes": "Valid at least 6 months"},
      {"name": "Bank Statement (DZD & Euros)", "description": "Active bank statements for 3 months", "required": true, "notes": "Must show regular salary / income deposits"},
      {"name": "CNAS Proof", "description": "CNAS affiliation card scan", "required": true, "notes": "Social security proof"},
      {"name": "Work Attestation", "description": "Attestation de travail signed by manager", "required": true, "notes": "Must mention recruitment date"}
    ]'::jsonb,
    'Processed through VFS Global Italy center in Algiers.'
  ) ON CONFLICT (agency_id, name) DO NOTHING;

  -- UK Visa
  INSERT INTO public.visa_types (agency_id, name, destination_country, category, processing_time, validity, stay_duration, government_fee, service_fee, express_fee, application_method, biometric_required, interview_required, applicable_wilayas, documents_required, special_notes)
  VALUES (
    p_agency_id,
    'UK Visa',
    'United Kingdom',
    'Tourism',
    '15-30 business days',
    '180 days',
    '180 days per entry',
    22000,
    15000,
    30000,
    'Embassy',
    TRUE,
    FALSE,
    ARRAY[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58],
    '[
      {"name": "Passport original", "description": "Requires original passport submission", "required": true, "notes": "Must have 2 free pages"},
      {"name": "English Translations", "description": "All Arabic/French documents must be officially translated", "required": true, "notes": "Agency can manage for translation extra fee"},
      {"name": "Euro Bank Statement", "description": "Euro account balance statement with solid history", "required": true, "notes": "Min 3000€ equivalent"},
      {"name": "Job Verification Letter", "description": "Official employer letter stating salary and role", "required": true, "notes": "Translated to English"}
    ]'::jsonb,
    'Processed via TLScontact in Algiers. High visa rejection rates; financial ties to Algeria must be thoroughly documented.'
  ) ON CONFLICT (agency_id, name) DO NOTHING;

  -- Egypt Visa
  INSERT INTO public.visa_types (agency_id, name, destination_country, category, processing_time, validity, stay_duration, government_fee, service_fee, express_fee, application_method, biometric_required, interview_required, applicable_wilayas, documents_required, special_notes)
  VALUES (
    p_agency_id,
    'Egypt Visa',
    'Egypt',
    'Tourism',
    '5-10 business days',
    '90 days',
    '30 days per entry',
    6000,
    4000,
    7000,
    'Embassy',
    FALSE,
    FALSE,
    ARRAY[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58],
    '[
      {"name": "Passport copy", "description": "Bio page copy", "required": true, "notes": "Clear scan"},
      {"name": "2 Photos", "description": "4x6 passport photos, white background", "required": true, "notes": "Recent"},
      {"name": "National ID (CNI)", "description": "Algerian ID card", "required": true, "notes": "Both sides"},
      {"name": "Work Attestation", "description": "Employment status confirmation proof", "required": true, "notes": "Recent"}
    ]'::jsonb,
    'Egypt visa is highly requested by Algerian tourists. Processing times are typically stable.'
  ) ON CONFLICT (agency_id, name) DO NOTHING;

  -- Saudi Umrah
  INSERT INTO public.visa_types (agency_id, name, destination_country, category, processing_time, validity, stay_duration, government_fee, service_fee, express_fee, application_method, biometric_required, interview_required, applicable_wilayas, documents_required, special_notes)
  VALUES (
    p_agency_id,
    'Saudi Arabia (Umrah)',
    'Saudi Arabia',
    'Umrah',
    '2-5 business days',
    '90 days',
    '90 days per entry',
    35000,
    10000,
    15000,
    'Online',
    FALSE,
    FALSE,
    ARRAY[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58],
    '[
      {"name": "Passport scan", "description": "Passport biometric page copy", "required": true, "notes": "Clear color copy"},
      {"name": "Meningitis Vaccination Certificate", "description": "Vaccin contre la méningite ACYW135", "required": true, "notes": "Mandatory for entry"},
      {"name": "National ID (CNI)", "description": "Algerian ID card", "required": true, "notes": "Both sides"},
      {"name": "Personal Photo", "description": "Biometric photo scan with white background", "required": true, "notes": "Square photo"}
    ]'::jsonb,
    'Umrah visa is processed in high volumes particularly during Ramadan. Ramadan scheduling alert: embassy processing might slow down, apply at least 15 days in advance.'
  ) ON CONFLICT (agency_id, name) DO NOTHING;

  -- UAE Dubai
  INSERT INTO public.visa_types (agency_id, name, destination_country, category, processing_time, validity, stay_duration, government_fee, service_fee, express_fee, application_method, biometric_required, interview_required, applicable_wilayas, documents_required, special_notes)
  VALUES (
    p_agency_id,
    'UAE/Dubai Visa',
    'United Arab Emirates',
    'Tourism',
    '2-4 business days',
    '60 days',
    '30 days per entry',
    18000,
    6000,
    12000,
    'Online',
    FALSE,
    FALSE,
    ARRAY[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58],
    '[
      {"name": "Passport copy", "description": "Color biometric page scan", "required": true, "notes": "No glare"},
      {"name": "Personal Photo", "description": "High resolution square photo", "required": true, "notes": "White background"}
    ]'::jsonb,
    'Simulated e-visa delivery. Approved direct by Dubai DNRD.'
  ) ON CONFLICT (agency_id, name) DO NOTHING;

  -- USA
  INSERT INTO public.visa_types (agency_id, name, destination_country, category, processing_time, validity, stay_duration, government_fee, service_fee, express_fee, application_method, biometric_required, interview_required, applicable_wilayas, documents_required, special_notes)
  VALUES (
    p_agency_id,
    'USA B1/B2 Visa',
    'United States',
    'Tourism',
    '30-60 business days',
    '365 days',
    '180 days per entry',
    25000,
    20000,
    35000,
    'Embassy',
    TRUE,
    TRUE,
    ARRAY[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58],
    '[
      {"name": "DS-160 Confirmation Page", "description": "Barcode confirmation sheet from online B1/B2 form", "required": true, "notes": "DS-160 number must match profile"},
      {"name": "Interview Appointment Sheet", "description": "Printed appointment time receipt page", "required": true, "notes": "Scheduled at US Embassy Algiers"},
      {"name": "Asset & Income Proof", "description": "Solid proof of property ownership, regular monthly DZD or Euro incomes", "required": true, "notes": "Shows deep ties to Algeria"},
      {"name": "National ID (CNI)", "description": "Algerian ID card", "required": true, "notes": "Both sides"}
    ]'::jsonb,
    'Requires an interactive face-to-face interview at the US Embassy in Algiers (Hydra). All applicants must speak either Arabic, French, or English.'
  ) ON CONFLICT (agency_id, name) DO NOTHING;

  -- Canada
  INSERT INTO public.visa_types (agency_id, name, destination_country, category, processing_time, validity, stay_duration, government_fee, service_fee, express_fee, application_method, biometric_required, interview_required, applicable_wilayas, documents_required, special_notes)
  VALUES (
    p_agency_id,
    'Canada Visitor Visa',
    'Canada',
    'Tourism',
    '30-90 business days',
    '3650 days',
    '180 days per entry',
    18500,
    15000,
    25000,
    'Online',
    TRUE,
    FALSE,
    ARRAY[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58],
    '[
      {"name": "Passport Copy", "description": "Full passport scan of all blank and visa pages", "required": true, "notes": "Must be high resolution"},
      {"name": "Family Information Attestation (Fiche Familiale)", "description": "Official Algerian family registry record sheet", "required": true, "notes": "Translated to French or English"},
      {"name": "CNAS/CASNOS Social Attestation", "description": "Historical social security updates in Algeria", "required": true, "notes": "Updated less than 3 months ago"},
      {"name": "Detailed Financial Statements", "description": "Comprehensive bank balances, salary, and savings history in Algeria", "required": true, "notes": "Highly critical for approvals"}
    ]'::jsonb,
    'Submitted online via IRCC Portal. Requires a biometric collection appointment at VFS Global Algiers.'
  ) ON CONFLICT (agency_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 8. Trigger to automatically populate default visa types when a new agency is created
CREATE OR REPLACE FUNCTION public.handle_new_agency_visa_types()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.populate_default_visa_types(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_agency_created_visa_types ON public.agencies;
CREATE TRIGGER on_agency_created_visa_types
  AFTER INSERT ON public.agencies
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_agency_visa_types();


-- 9. Backfill default visa types for existing agencies


DO $$
DECLARE
  v_agency RECORD;
BEGIN
  FOR v_agency IN SELECT id FROM public.agencies LOOP
    PERFORM public.populate_default_visa_types(v_agency.id);
  END LOOP;
END;
$$;


-- 10. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_visa_types_agency_id ON public.visa_types(agency_id);
CREATE INDEX IF NOT EXISTS idx_visa_applications_agency_id ON public.visa_applications(agency_id);
CREATE INDEX IF NOT EXISTS idx_visa_applications_client_id ON public.visa_applications(client_id);
CREATE INDEX IF NOT EXISTS idx_visa_payments_application_id ON public.visa_payments(application_id);
CREATE INDEX IF NOT EXISTS idx_visa_timeline_events_application_id ON public.visa_timeline_events(application_id);


-- =========================================================================
-- END MIGRATION: 0010_visa_management.sql
-- =========================================================================


-- =========================================================================
-- START MIGRATION: 0011_performance_optimization.sql
-- =========================================================================

-- 0011_performance_optimization.sql
-- Add pg_trgm and btree_gin extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- Core tables
CREATE INDEX IF NOT EXISTS idx_agencies_subdomain ON agencies(subdomain);
CREATE INDEX IF NOT EXISTS idx_profiles_agency_id ON profiles(agency_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Trips
CREATE INDEX IF NOT EXISTS idx_trips_agency_id ON trips(agency_id);
CREATE INDEX IF NOT EXISTS idx_trips_is_active ON trips(is_active);
CREATE INDEX IF NOT EXISTS idx_trips_destination_country ON trips(destination_country);
CREATE INDEX IF NOT EXISTS idx_trips_is_featured ON trips(is_featured);
CREATE INDEX IF NOT EXISTS idx_trips_agency_active ON trips(agency_id, is_active);
CREATE INDEX IF NOT EXISTS idx_trips_agency_featured ON trips(agency_id, is_featured);

-- Conversations / Inbox
CREATE INDEX IF NOT EXISTS idx_conversations_agency_id ON conversations(agency_id);
CREATE INDEX IF NOT EXISTS idx_conversations_customer_phone ON conversations(customer_phone);
CREATE INDEX IF NOT EXISTS idx_conversations_lead_score ON conversations(lead_score);
CREATE INDEX IF NOT EXISTS idx_conversations_platform ON conversations(platform);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_agency_score ON conversations(agency_id, lead_score);
CREATE INDEX IF NOT EXISTS idx_conversations_agency_platform ON conversations(agency_id, platform);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at DESC);

-- Bookings
CREATE INDEX IF NOT EXISTS idx_bookings_agency_id ON bookings(agency_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_trip_id ON bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_bookings_agency_status ON bookings(agency_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);

-- Clients
CREATE INDEX IF NOT EXISTS idx_clients_agency_id ON clients(agency_id);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_source ON clients(source);
CREATE INDEX IF NOT EXISTS idx_clients_agency_source ON clients(agency_id, source);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);

-- Invoices
CREATE INDEX IF NOT EXISTS idx_invoices_agency_id ON invoices(agency_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_agency_status ON invoices(agency_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

-- Employees
CREATE INDEX IF NOT EXISTS idx_employees_agency_id ON employees(agency_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_manager_id ON employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_employees_agency_status ON employees(agency_id, status);

-- Transactions / Finance
CREATE INDEX IF NOT EXISTS idx_transactions_agency_id ON transactions(agency_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_agency_date ON transactions(agency_id, transaction_date DESC);

-- Visa Applications
CREATE INDEX IF NOT EXISTS idx_visa_applications_agency_id ON visa_applications(agency_id);
CREATE INDEX IF NOT EXISTS idx_visa_applications_status ON visa_applications(status);
CREATE INDEX IF NOT EXISTS idx_visa_applications_client_id ON visa_applications(client_id);
CREATE INDEX IF NOT EXISTS idx_visa_applications_agency_status ON visa_applications(agency_id, status);

-- HR and tasks
CREATE INDEX IF NOT EXISTS idx_hr_tasks_assignee_id ON public.hr_tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_leaves_agency_id ON public.leaves(agency_id);
CREATE INDEX IF NOT EXISTS idx_payroll_agency_id ON public.payroll(agency_id);
CREATE INDEX IF NOT EXISTS idx_attendance_agency_id ON public.attendance(agency_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);


-- Create function for dashboard stats
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_agency_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'totalConversations', (SELECT COUNT(*) FROM conversations WHERE agency_id = p_agency_id),
    'hotLeads', (SELECT COUNT(*) FROM conversations WHERE agency_id = p_agency_id AND lead_score = 'HOT'),
    'bookingsThisMonth', (SELECT COUNT(*) FROM bookings WHERE agency_id = p_agency_id AND created_at >= DATE_TRUNC('month', NOW())),
    'tripsCount', (SELECT COUNT(*) FROM trips WHERE agency_id = p_agency_id),
    'invoicesCount', (SELECT COUNT(*) FROM invoices WHERE agency_id = p_agency_id),
    'accountsCount', (SELECT COUNT(*) FROM financial_accounts WHERE agency_id = p_agency_id),
    'faqsCount', (SELECT COUNT(*) FROM chatbot_faqs WHERE agency_id = p_agency_id),
    'visaApplicationsCount', (SELECT COUNT(*) FROM visa_applications WHERE agency_id = p_agency_id),
    'visaRevenue', (SELECT COALESCE(SUM(amount), 0) FROM visa_payments vp JOIN visa_applications va ON vp.application_id = va.id WHERE va.agency_id = p_agency_id)
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =========================================================================
-- END MIGRATION: 0011_performance_optimization.sql
-- =========================================================================


-- =========================================================================
-- START MIGRATION: 0012_multi_vertical_whitelabel.sql
-- =========================================================================

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


-- =========================================================================
-- END MIGRATION: 0012_multi_vertical_whitelabel.sql
-- =========================================================================


-- =========================================================================
-- START MIGRATION: 0013_showroom_advanced_management.sql
-- =========================================================================

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


-- =========================================================================
-- END MIGRATION: 0013_showroom_advanced_management.sql
-- =========================================================================


-- =========================================================================
-- START MIGRATION: 0014_showroom_website_templates.sql
-- =========================================================================

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


-- =========================================================================
-- END MIGRATION: 0014_showroom_website_templates.sql
-- =========================================================================


