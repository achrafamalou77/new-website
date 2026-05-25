-- Migration: 0022_b2b_corporate_clients.sql
-- Phase 4: B2B Corporate Clients & Bulk Purchasing

-- 1. Create client classification enum
DO $$ BEGIN
  CREATE TYPE client_classification_enum AS ENUM ('retail', 'b2b', 'corporate', 'wholesale');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. Extend clients table with B2B fields
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS classification client_classification_enum NOT NULL DEFAULT 'retail',
  ADD COLUMN IF NOT EXISTS company_legal_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS company_nif VARCHAR(100),
  ADD COLUMN IF NOT EXISTS company_rc VARCHAR(100),
  ADD COLUMN IF NOT EXISTS company_address TEXT,
  ADD COLUMN IF NOT EXISTS volume_discount_tier NUMERIC(5, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255),
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. Create invoice_items table for multi-line invoices
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  item_type VARCHAR(50) NOT NULL DEFAULT 'car_sale',
  item_reference_id UUID,
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  discount_amount NUMERIC(15, 2) DEFAULT 0.00,
  discount_percent NUMERIC(5, 2) DEFAULT 0.00,
  total_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable RLS on invoice_items
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoice_items_select" ON public.invoice_items;
CREATE POLICY "invoice_items_select" ON public.invoice_items
  FOR SELECT USING (agency_id = get_my_agency_id() OR is_platform_owner());

DROP POLICY IF EXISTS "invoice_items_insert" ON public.invoice_items;
CREATE POLICY "invoice_items_insert" ON public.invoice_items
  FOR INSERT WITH CHECK (agency_id = get_my_agency_id() OR is_platform_owner());

DROP POLICY IF EXISTS "invoice_items_update" ON public.invoice_items;
CREATE POLICY "invoice_items_update" ON public.invoice_items
  FOR UPDATE USING (agency_id = get_my_agency_id() OR is_platform_owner());

DROP POLICY IF EXISTS "invoice_items_delete" ON public.invoice_items;
CREATE POLICY "invoice_items_delete" ON public.invoice_items
  FOR DELETE USING (agency_id = get_my_agency_id() OR is_platform_owner());

-- 5. Add B2B metadata columns to invoices
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS invoice_type VARCHAR(50) DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS company_nif VARCHAR(100),
  ADD COLUMN IF NOT EXISTS company_rc VARCHAR(100),
  ADD COLUMN IF NOT EXISTS company_legal_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS volume_discount_applied NUMERIC(5, 2) DEFAULT 0.00;
