-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: agencies
CREATE TABLE IF NOT EXISTS agencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name TEXT NOT NULL,
    subdomain TEXT UNIQUE NOT NULL,
    active_modules JSONB DEFAULT '{"chatbot":true,"website":true}'::jsonb,
    website_settings JSONB DEFAULT '{}'::jsonb,
    ai_credits INTEGER DEFAULT 500,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT CHECK (role IN ('superadmin', 'employee')),
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: trips
CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    destination TEXT NOT NULL,
    duration_days INTEGER NOT NULL,
    image_urls JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: conversations
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    customer_phone TEXT NOT NULL,
    customer_name TEXT,
    platform TEXT CHECK (platform IN ('whatsapp', 'facebook', 'instagram')),
    lead_score TEXT CHECK (lead_score IN ('HOT', 'WARM', 'COLD')),
    lead_summary TEXT,
    ai_status BOOLEAN DEFAULT true,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_type TEXT CHECK (sender_type IN ('ai', 'human', 'customer')),
    content TEXT,
    media_url TEXT,
    is_voice_note BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: bookings
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    trip_id UUID REFERENCES trips(id) ON DELETE RESTRICT,
    client_manifest JSONB DEFAULT '{}'::jsonb,
    status TEXT CHECK (status IN ('pending_payment', 'completed', 'cancelled')),
    total_price INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_agencies_subdomain ON agencies(subdomain);
CREATE INDEX IF NOT EXISTS idx_profiles_agency_id ON profiles(agency_id);
CREATE INDEX IF NOT EXISTS idx_trips_agency_id ON trips(agency_id);
CREATE INDEX IF NOT EXISTS idx_conversations_agency_id ON conversations(agency_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_bookings_agency_id ON bookings(agency_id);

-- Row-Level Security (RLS) Setup

-- Function to check if the current user is a superadmin
CREATE OR REPLACE FUNCTION is_superadmin() RETURNS BOOLEAN AS $$
DECLARE
    is_admin BOOLEAN;
BEGIN
    SELECT (role = 'superadmin') INTO is_admin 
    FROM profiles 
    WHERE id = auth.uid();
    RETURN COALESCE(is_admin, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- 1. Agencies Policies
DROP POLICY IF EXISTS "Select agencies" ON agencies;
CREATE POLICY "Select agencies" ON agencies FOR SELECT
USING (id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS "Insert agencies" ON agencies;
CREATE POLICY "Insert agencies" ON agencies FOR INSERT
WITH CHECK (id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS "Update agencies" ON agencies;
CREATE POLICY "Update agencies" ON agencies FOR UPDATE
USING (id = current_setting('app.current_tenant_id', true)::uuid)
WITH CHECK (id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS "Delete agencies" ON agencies;
CREATE POLICY "Delete agencies" ON agencies FOR DELETE
USING (id = current_setting('app.current_tenant_id', true)::uuid AND is_superadmin());

-- 2. Profiles Policies
DROP POLICY IF EXISTS "Select profiles" ON profiles;
CREATE POLICY "Select profiles" ON profiles FOR SELECT
USING (agency_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS "Insert profiles" ON profiles;
CREATE POLICY "Insert profiles" ON profiles FOR INSERT
WITH CHECK (agency_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS "Update profiles" ON profiles;
CREATE POLICY "Update profiles" ON profiles FOR UPDATE
USING (agency_id = current_setting('app.current_tenant_id', true)::uuid)
WITH CHECK (agency_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS "Delete profiles" ON profiles;
CREATE POLICY "Delete profiles" ON profiles FOR DELETE
USING (agency_id = current_setting('app.current_tenant_id', true)::uuid AND is_superadmin());

-- 3. Trips Policies
DROP POLICY IF EXISTS "Select trips" ON trips;
CREATE POLICY "Select trips" ON trips FOR SELECT
USING (agency_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS "Insert trips" ON trips;
CREATE POLICY "Insert trips" ON trips FOR INSERT
WITH CHECK (agency_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS "Update trips" ON trips;
CREATE POLICY "Update trips" ON trips FOR UPDATE
USING (agency_id = current_setting('app.current_tenant_id', true)::uuid)
WITH CHECK (agency_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS "Delete trips" ON trips;
CREATE POLICY "Delete trips" ON trips FOR DELETE
USING (agency_id = current_setting('app.current_tenant_id', true)::uuid AND is_superadmin());

-- 4. Conversations Policies
DROP POLICY IF EXISTS "Select conversations" ON conversations;
CREATE POLICY "Select conversations" ON conversations FOR SELECT
USING (agency_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS "Insert conversations" ON conversations;
CREATE POLICY "Insert conversations" ON conversations FOR INSERT
WITH CHECK (agency_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS "Update conversations" ON conversations;
CREATE POLICY "Update conversations" ON conversations FOR UPDATE
USING (agency_id = current_setting('app.current_tenant_id', true)::uuid)
WITH CHECK (agency_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS "Delete conversations" ON conversations;
CREATE POLICY "Delete conversations" ON conversations FOR DELETE
USING (agency_id = current_setting('app.current_tenant_id', true)::uuid AND is_superadmin());

-- 5. Messages Policies
DROP POLICY IF EXISTS "Select messages" ON messages;
CREATE POLICY "Select messages" ON messages FOR SELECT
USING (conversation_id IN (SELECT id FROM conversations WHERE agency_id = current_setting('app.current_tenant_id', true)::uuid));

DROP POLICY IF EXISTS "Insert messages" ON messages;
CREATE POLICY "Insert messages" ON messages FOR INSERT
WITH CHECK (conversation_id IN (SELECT id FROM conversations WHERE agency_id = current_setting('app.current_tenant_id', true)::uuid));

DROP POLICY IF EXISTS "Update messages" ON messages;
CREATE POLICY "Update messages" ON messages FOR UPDATE
USING (conversation_id IN (SELECT id FROM conversations WHERE agency_id = current_setting('app.current_tenant_id', true)::uuid))
WITH CHECK (conversation_id IN (SELECT id FROM conversations WHERE agency_id = current_setting('app.current_tenant_id', true)::uuid));

DROP POLICY IF EXISTS "Delete messages" ON messages;
CREATE POLICY "Delete messages" ON messages FOR DELETE
USING (
    conversation_id IN (SELECT id FROM conversations WHERE agency_id = current_setting('app.current_tenant_id', true)::uuid)
    AND is_superadmin()
);

-- 6. Bookings Policies
DROP POLICY IF EXISTS "Select bookings" ON bookings;
CREATE POLICY "Select bookings" ON bookings FOR SELECT
USING (agency_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS "Insert bookings" ON bookings;
CREATE POLICY "Insert bookings" ON bookings FOR INSERT
WITH CHECK (agency_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS "Update bookings" ON bookings;
CREATE POLICY "Update bookings" ON bookings FOR UPDATE
USING (agency_id = current_setting('app.current_tenant_id', true)::uuid)
WITH CHECK (agency_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS "Delete bookings" ON bookings;
CREATE POLICY "Delete bookings" ON bookings FOR DELETE
USING (agency_id = current_setting('app.current_tenant_id', true)::uuid AND is_superadmin());
