-- Add custom_domain to agencies table if it doesn't already exist
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS custom_domain VARCHAR(255) UNIQUE;

-- Create subscriptions_ledgers for transaction audits and invoicing
CREATE TABLE IF NOT EXISTS public.subscriptions_ledgers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
    plan_id VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(255) NOT NULL UNIQUE,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'DZD',
    status VARCHAR(50) DEFAULT 'pending', -- pending, paid, failed, expired
    payment_method VARCHAR(50) DEFAULT 'chargily', -- chargily, ccp, bank_transfer
    receipt_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on subscriptions_ledgers
ALTER TABLE public.subscriptions_ledgers ENABLE ROW LEVEL SECURITY;

-- Create RLS isolation policy for subscriptions_ledgers
DROP POLICY IF EXISTS "Users can view their own agency's ledgers" ON public.subscriptions_ledgers;
CREATE POLICY "Users can view their own agency's ledgers" ON public.subscriptions_ledgers
    FOR ALL
    TO authenticated
    USING (
        agency_id IN (
            SELECT agency_id FROM public.profiles WHERE id = auth.uid()
        )
    );
