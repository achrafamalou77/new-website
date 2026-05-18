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
