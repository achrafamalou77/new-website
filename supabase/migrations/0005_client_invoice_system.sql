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
