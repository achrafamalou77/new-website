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
