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
