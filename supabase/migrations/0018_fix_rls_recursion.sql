-- 0018_fix_rls_recursion.sql

-- 0. Ensure all missing configuration and social columns exist in agencies table
ALTER TABLE public.agencies 
ADD COLUMN IF NOT EXISTS website_config JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS chatbot_config JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS social_media JSONB DEFAULT '{}'::jsonb;

-- 1. Create a non-recursive helper to check if the current user is the platform owner
CREATE OR REPLACE FUNCTION public.is_platform_owner() 
RETURNS boolean AS $$
DECLARE
  v_owner boolean;
BEGIN
  SELECT is_platform_owner INTO v_owner 
  FROM public.profiles 
  WHERE id = auth.uid();
  RETURN COALESCE(v_owner, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Explicitly set owner to postgres to bypass RLS in subqueries
ALTER FUNCTION public.is_platform_owner() OWNER TO postgres;

-- 2. Create a non-recursive helper to get the current user's agency ID
CREATE OR REPLACE FUNCTION public.get_my_agency_id() 
RETURNS uuid AS $$
DECLARE
  v_agency_id uuid;
BEGIN
  SELECT agency_id INTO v_agency_id 
  FROM public.profiles 
  WHERE id = auth.uid();
  RETURN v_agency_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Explicitly set owner to postgres to bypass RLS in subqueries
ALTER FUNCTION public.get_my_agency_id() OWNER TO postgres;

-- 3. Create a non-recursive helper to check if the current user is a superadmin in their agency
CREATE OR REPLACE FUNCTION public.is_superadmin() 
RETURNS boolean AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role 
  FROM public.profiles 
  WHERE id = auth.uid();
  RETURN (v_role = 'superadmin' OR public.is_platform_owner());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Explicitly set owner to postgres to bypass RLS in subqueries
ALTER FUNCTION public.is_superadmin() OWNER TO postgres;

-- 4. Rewrite get_current_tenant_id() to use the non-recursive helper
CREATE OR REPLACE FUNCTION public.get_current_tenant_id() 
RETURNS uuid AS $$
DECLARE
    tenant_id uuid;
BEGIN
    -- Try to get from local setting first
    BEGIN
        tenant_id := current_setting('app.current_tenant_id', true)::uuid;
    EXCEPTION WHEN OTHERS THEN
        tenant_id := NULL;
    END;

    -- If not set, use our non-recursive helper
    IF tenant_id IS NULL THEN
        tenant_id := public.get_my_agency_id();
    END IF;

    RETURN tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Explicitly set owner to postgres to bypass RLS in subqueries
ALTER FUNCTION public.get_current_tenant_id() OWNER TO postgres;

-- 5. Re-apply clean, non-recursive RLS policies on profiles and agencies tables
DROP POLICY IF EXISTS "Select profiles" ON public.profiles;
CREATE POLICY "Select profiles" ON public.profiles FOR SELECT 
USING (
  id = auth.uid() OR 
  agency_id = public.get_my_agency_id() OR 
  public.is_platform_owner()
);

DROP POLICY IF EXISTS "Insert profiles" ON public.profiles;
CREATE POLICY "Insert profiles" ON public.profiles FOR INSERT 
WITH CHECK (
  public.is_platform_owner() OR 
  (agency_id = public.get_my_agency_id() AND public.is_superadmin())
);

DROP POLICY IF EXISTS "Update profiles" ON public.profiles;
CREATE POLICY "Update profiles" ON public.profiles FOR UPDATE 
USING (
  id = auth.uid() OR 
  agency_id = public.get_my_agency_id() OR 
  public.is_platform_owner()
);

DROP POLICY IF EXISTS "Delete profiles" ON public.profiles;
CREATE POLICY "Delete profiles" ON public.profiles FOR DELETE 
USING (
  (agency_id = public.get_my_agency_id() AND public.is_superadmin()) OR 
  public.is_platform_owner()
);

DROP POLICY IF EXISTS "Select agencies" ON public.agencies;
CREATE POLICY "Select agencies" ON public.agencies FOR SELECT 
USING (
  id = public.get_my_agency_id() OR 
  public.is_platform_owner() OR 
  status = 'active'
);

DROP POLICY IF EXISTS "Insert agencies" ON public.agencies;
CREATE POLICY "Insert agencies" ON public.agencies FOR INSERT 
WITH CHECK (
  public.is_platform_owner()
);

DROP POLICY IF EXISTS "Update agencies" ON public.agencies;
CREATE POLICY "Update agencies" ON public.agencies FOR UPDATE 
USING (
  id = public.get_my_agency_id() OR 
  public.is_platform_owner()
);

DROP POLICY IF EXISTS "Delete agencies" ON public.agencies;
CREATE POLICY "Delete agencies" ON public.agencies FOR DELETE 
USING (
  public.is_platform_owner()
);

-- 6. Apply clean, dynamic, non-recursive RLS policies on all other tables safely
DO $$
DECLARE
    t_name text;
    -- Group 1: Global Tables
    global_tables text[] := ARRAY['plans', 'website_templates', 'car_showroom_templates', 'travel_agency_templates', 'business_types'];
    
    -- Group 2: Standard Tenant-Scoped Tables
    tenant_tables text[] := ARRAY[
        'invoices', 'roles', 'employees',
        'attendance', 'leaves', 'payroll', 'hr_tasks', 'announcements', 'financial_accounts',
        'suppliers', 'supplier_payments', 'transactions', 'shipping_carriers', 'parts_inventory'
    ];
    
    -- Group 3: Public-Read Tenant-Scoped Tables
    public_read_tables text[] := ARRAY[
        'car_showroom_config', 'travel_agency_config', 'car_sales_inventory', 'car_rental_fleet',
        'travel_packages', 'car_showroom_websites', 'travel_agency_websites', 'website_configs',
        'website_revisions'
    ];
    
    -- Group 4: Public-Submit Tenant-Scoped Tables
    public_submit_tables text[] := ARRAY[
        'clients', 'conversations', 'rental_bookings', 'travel_bookings', 'service_appointments',
        'travel_inquiries', 'custom_trip_requests', 'leads', 'test_drives', 'financing_applications',
        'visa_applications', 'contacts'
    ];
BEGIN
    -- Enable RLS on all tables in Group 1, 2, 3, 4
    FOREACH t_name IN ARRAY array_cat(array_cat(array_cat(global_tables, tenant_tables), public_read_tables), public_submit_tables) LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t_name) THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t_name);
        END IF;
    END LOOP;

    -- Apply Group 1: Global Tables
    FOREACH t_name IN ARRAY global_tables LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t_name) THEN
            EXECUTE format('DROP POLICY IF EXISTS "Public select %s" ON public.%I;', t_name, t_name);
            EXECUTE format('DROP POLICY IF EXISTS "Public select %s" ON public.;
CREATE POLICY "Public select %s" ON public.%I FOR SELECT USING (true);', t_name, t_name);
            
            EXECUTE format('DROP POLICY IF EXISTS "Admin manage %s" ON public.%I;', t_name, t_name);
            EXECUTE format('DROP POLICY IF EXISTS "Admin manage %s" ON public.;
CREATE POLICY "Admin manage %s" ON public.%I FOR ALL USING (public.is_platform_owner());', t_name, t_name);
        END IF;
    END LOOP;

    -- Apply Group 2: Standard Tenant-Scoped Tables
    FOREACH t_name IN ARRAY tenant_tables LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t_name) THEN
            EXECUTE format('DROP POLICY IF EXISTS "Select %s" ON public.%I;', t_name, t_name);
            EXECUTE format('DROP POLICY IF EXISTS "Select %s" ON public.;
CREATE POLICY "Select %s" ON public.%I FOR SELECT USING (agency_id = public.get_my_agency_id() OR public.is_platform_owner());', t_name, t_name);
            
            EXECUTE format('DROP POLICY IF EXISTS "Modify %s" ON public.%I;', t_name, t_name);
            EXECUTE format('DROP POLICY IF EXISTS "Modify %s" ON public.;
CREATE POLICY "Modify %s" ON public.%I FOR ALL USING (agency_id = public.get_my_agency_id() OR public.is_platform_owner());', t_name, t_name);
        END IF;
    END LOOP;

    -- Apply Group 3: Public-Read Tenant-Scoped Tables
    FOREACH t_name IN ARRAY public_read_tables LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t_name) THEN
            EXECUTE format('DROP POLICY IF EXISTS "Select %s" ON public.%I;', t_name, t_name);
            EXECUTE format('DROP POLICY IF EXISTS "Select %s" ON public.;
CREATE POLICY "Select %s" ON public.%I FOR SELECT USING (agency_id = public.get_my_agency_id() OR public.is_platform_owner() OR agency_id = public.get_current_tenant_id());', t_name, t_name);
            
            EXECUTE format('DROP POLICY IF EXISTS "Modify %s" ON public.%I;', t_name, t_name);
            EXECUTE format('DROP POLICY IF EXISTS "Modify %s" ON public.;
CREATE POLICY "Modify %s" ON public.%I FOR ALL USING (agency_id = public.get_my_agency_id() OR public.is_platform_owner());', t_name, t_name);
        END IF;
    END LOOP;

    -- Apply Group 4: Public-Submit Tenant-Scoped Tables
    FOREACH t_name IN ARRAY public_submit_tables LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t_name) THEN
            EXECUTE format('DROP POLICY IF EXISTS "Select %s" ON public.%I;', t_name, t_name);
            EXECUTE format('DROP POLICY IF EXISTS "Select %s" ON public.;
CREATE POLICY "Select %s" ON public.%I FOR SELECT USING (agency_id = public.get_my_agency_id() OR public.is_platform_owner());', t_name, t_name);
            
            EXECUTE format('DROP POLICY IF EXISTS "Insert %s" ON public.%I;', t_name, t_name);
            EXECUTE format('DROP POLICY IF EXISTS "Insert %s" ON public.;
CREATE POLICY "Insert %s" ON public.%I FOR INSERT WITH CHECK (agency_id = public.get_current_tenant_id() OR public.is_platform_owner());', t_name, t_name);
            
            EXECUTE format('DROP POLICY IF EXISTS "Modify %s" ON public.%I;', t_name, t_name);
            EXECUTE format('DROP POLICY IF EXISTS "Modify %s" ON public.;
CREATE POLICY "Modify %s" ON public.%I FOR UPDATE USING (agency_id = public.get_my_agency_id() OR public.is_platform_owner());', t_name, t_name);

            EXECUTE format('DROP POLICY IF EXISTS "Delete %s" ON public.%I;', t_name, t_name);
            EXECUTE format('DROP POLICY IF EXISTS "Delete %s" ON public.;
CREATE POLICY "Delete %s" ON public.%I FOR DELETE USING (agency_id = public.get_my_agency_id() OR public.is_platform_owner());', t_name, t_name);
        END IF;
    END LOOP;
END $$;

-- 7. Specific policies for relationship-linked or non-standard tables
DO $$
BEGIN
    -- messages
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
        ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

        EXECUTE 'DROP POLICY IF EXISTS "Select messages" ON public.messages;
CREATE POLICY "Select messages" ON public.messages FOR SELECT USING (
          conversation_id IN (SELECT id FROM public.conversations WHERE agency_id = public.get_my_agency_id()) OR public.is_platform_owner()
        );';

        EXECUTE 'DROP POLICY IF EXISTS "Insert messages" ON public.messages;
CREATE POLICY "Insert messages" ON public.messages FOR INSERT WITH CHECK (
          conversation_id IN (SELECT id FROM public.conversations WHERE agency_id = public.get_current_tenant_id()) OR public.is_platform_owner()
        );';

        EXECUTE 'DROP POLICY IF EXISTS "Update messages" ON public.messages;
CREATE POLICY "Update messages" ON public.messages FOR UPDATE USING (
          conversation_id IN (SELECT id FROM public.conversations WHERE agency_id = public.get_my_agency_id()) OR public.is_platform_owner()
        );';

        EXECUTE 'DROP POLICY IF EXISTS "Delete messages" ON public.messages;
CREATE POLICY "Delete messages" ON public.messages FOR DELETE USING (
          conversation_id IN (SELECT id FROM public.conversations WHERE agency_id = public.get_my_agency_id()) OR public.is_platform_owner()
        );';
    END IF;

    -- invoice_payments
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoice_payments') THEN
        ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;

        EXECUTE 'DROP POLICY IF EXISTS "Select invoice_payments" ON public.invoice_payments;
CREATE POLICY "Select invoice_payments" ON public.invoice_payments FOR SELECT USING (
          invoice_id IN (SELECT id FROM public.invoices WHERE agency_id = public.get_my_agency_id()) OR public.is_platform_owner()
        );';

        EXECUTE 'DROP POLICY IF EXISTS "Insert invoice_payments" ON public.invoice_payments;
CREATE POLICY "Insert invoice_payments" ON public.invoice_payments FOR INSERT WITH CHECK (
          invoice_id IN (SELECT id FROM public.invoices WHERE agency_id = public.get_current_tenant_id()) OR public.is_platform_owner()
        );';

        EXECUTE 'DROP POLICY IF EXISTS "Update invoice_payments" ON public.invoice_payments;
CREATE POLICY "Update invoice_payments" ON public.invoice_payments FOR UPDATE USING (
          invoice_id IN (SELECT id FROM public.invoices WHERE agency_id = public.get_my_agency_id()) OR public.is_platform_owner()
        );';

        EXECUTE 'DROP POLICY IF EXISTS "Delete invoice_payments" ON public.invoice_payments;
CREATE POLICY "Delete invoice_payments" ON public.invoice_payments FOR DELETE USING (
          invoice_id IN (SELECT id FROM public.invoices WHERE agency_id = public.get_my_agency_id()) OR public.is_platform_owner()
        );';
    END IF;

    -- visa_payments
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'visa_payments') THEN
        ALTER TABLE public.visa_payments ENABLE ROW LEVEL SECURITY;

        EXECUTE 'DROP POLICY IF EXISTS "Select visa_payments" ON public.visa_payments;
CREATE POLICY "Select visa_payments" ON public.visa_payments FOR SELECT USING (
          application_id IN (SELECT id FROM public.visa_applications WHERE agency_id = public.get_my_agency_id()) OR public.is_platform_owner()
        );';

        EXECUTE 'DROP POLICY IF EXISTS "Insert visa_payments" ON public.visa_payments;
CREATE POLICY "Insert visa_payments" ON public.visa_payments FOR INSERT WITH CHECK (
          application_id IN (SELECT id FROM public.visa_applications WHERE agency_id = public.get_current_tenant_id()) OR public.is_platform_owner()
        );';

        EXECUTE 'DROP POLICY IF EXISTS "Update visa_payments" ON public.visa_payments;
CREATE POLICY "Update visa_payments" ON public.visa_payments FOR UPDATE USING (
          application_id IN (SELECT id FROM public.visa_applications WHERE agency_id = public.get_my_agency_id()) OR public.is_platform_owner()
        );';

        EXECUTE 'DROP POLICY IF EXISTS "Delete visa_payments" ON public.visa_payments;
CREATE POLICY "Delete visa_payments" ON public.visa_payments FOR DELETE USING (
          application_id IN (SELECT id FROM public.visa_applications WHERE agency_id = public.get_my_agency_id()) OR public.is_platform_owner()
        );';
    END IF;

    -- visa_timeline_events
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'visa_timeline_events') THEN
        ALTER TABLE public.visa_timeline_events ENABLE ROW LEVEL SECURITY;

        EXECUTE 'DROP POLICY IF EXISTS "Select visa_timeline_events" ON public.visa_timeline_events;
CREATE POLICY "Select visa_timeline_events" ON public.visa_timeline_events FOR SELECT USING (
          application_id IN (SELECT id FROM public.visa_applications WHERE agency_id = public.get_my_agency_id()) OR public.is_platform_owner()
        );';

        EXECUTE 'DROP POLICY IF EXISTS "Insert visa_timeline_events" ON public.visa_timeline_events;
CREATE POLICY "Insert visa_timeline_events" ON public.visa_timeline_events FOR INSERT WITH CHECK (
          application_id IN (SELECT id FROM public.visa_applications WHERE agency_id = public.get_current_tenant_id()) OR public.is_platform_owner()
        );';

        EXECUTE 'DROP POLICY IF EXISTS "Update visa_timeline_events" ON public.visa_timeline_events;
CREATE POLICY "Update visa_timeline_events" ON public.visa_timeline_events FOR UPDATE USING (
          application_id IN (SELECT id FROM public.visa_applications WHERE agency_id = public.get_my_agency_id()) OR public.is_platform_owner()
        );';

        EXECUTE 'DROP POLICY IF EXISTS "Delete visa_timeline_events" ON public.visa_timeline_events;
CREATE POLICY "Delete visa_timeline_events" ON public.visa_timeline_events FOR DELETE USING (
          application_id IN (SELECT id FROM public.visa_applications WHERE agency_id = public.get_my_agency_id()) OR public.is_platform_owner()
        );';
    END IF;

    -- admin_audit_log (owner only)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_audit_log') THEN
        ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

        EXECUTE 'DROP POLICY IF EXISTS "Platform owner audit log access" ON public.admin_audit_log;
CREATE POLICY "Platform owner audit log access" ON public.admin_audit_log FOR ALL USING (public.is_platform_owner());';
    END IF;
END $$;

-- 8. Seed secure testing accounts using clean, requested credentials and passwords
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  -- Delete existing testing users to avoid primary key or email conflicts
  DELETE FROM auth.users WHERE email IN ('owner@platform.com', 'travel@agency.com', 'showroom@agency.com', 'admin@example.com');
  DELETE FROM public.profiles WHERE id IN ('8a23bb8e-1282-4bf1-bfd0-40a2bc2275f9', '0150dc2d-8181-45f8-a450-7a3d639875e1', '5b533cb4-77e8-4680-bc9b-38e9a5a73e6a');

  -- Seed Platform Owner
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at, 
    raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, 
    role, aud, confirmation_token
  ) VALUES (
    '8a23bb8e-1282-4bf1-bfd0-40a2bc2275f9',
    '00000000-0000-0000-0000-000000000000',
    'owner@platform.com',
    crypt('owner123', gen_salt('bf', 10)),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "Platform Owner"}'::jsonb,
    false,
    now(),
    now(),
    'authenticated',
    'authenticated',
    ''
  );

  INSERT INTO public.profiles (
    id, agency_id, full_name, role, is_platform_owner, created_at
  ) VALUES (
    '8a23bb8e-1282-4bf1-bfd0-40a2bc2275f9',
    NULL,
    'Platform Owner',
    'superadmin',
    true,
    now()
  );

  -- Seed Travel Admin
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
  );

  INSERT INTO public.profiles (
    id, agency_id, full_name, role, is_platform_owner, created_at
  ) VALUES (
    '0150dc2d-8181-45f8-a450-7a3d639875e1',
    'b99a818c-34d1-44eb-991b-689e246995b0', -- VoyagePro Travel Agency
    'Travel Admin',
    'superadmin',
    false,
    now()
  );

  -- Seed Showroom Admin
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
  );

  INSERT INTO public.profiles (
    id, agency_id, full_name, role, is_platform_owner, created_at
  ) VALUES (
    '5b533cb4-77e8-4680-bc9b-38e9a5a73e6a',
    'a25a818c-34d1-44eb-991b-689e246995a9', -- A2S Auto Showroom
    'Showroom Admin',
    'superadmin',
    false,
    now()
  );

END $$;

-- 9. Force reload PostgREST schema cache to ensure Next.js immediately recognizes changes
NOTIFY pgrst, 'reload schema';
