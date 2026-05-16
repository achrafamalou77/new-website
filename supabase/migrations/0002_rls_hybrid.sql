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
DROP POLICY IF EXISTS "Select agencies" ON agencies;
DROP POLICY IF EXISTS "Insert agencies" ON agencies;
DROP POLICY IF EXISTS "Update agencies" ON agencies;
DROP POLICY IF EXISTS "Delete agencies" ON agencies;

DROP POLICY IF EXISTS "Select profiles" ON profiles;
DROP POLICY IF EXISTS "Insert profiles" ON profiles;
DROP POLICY IF EXISTS "Update profiles" ON profiles;
DROP POLICY IF EXISTS "Delete profiles" ON profiles;

DROP POLICY IF EXISTS "Select trips" ON trips;
DROP POLICY IF EXISTS "Insert trips" ON trips;
DROP POLICY IF EXISTS "Update trips" ON trips;
DROP POLICY IF EXISTS "Delete trips" ON trips;

DROP POLICY IF EXISTS "Select conversations" ON conversations;
DROP POLICY IF EXISTS "Insert conversations" ON conversations;
DROP POLICY IF EXISTS "Update conversations" ON conversations;
DROP POLICY IF EXISTS "Delete conversations" ON conversations;

DROP POLICY IF EXISTS "Select messages" ON messages;
DROP POLICY IF EXISTS "Insert messages" ON messages;
DROP POLICY IF EXISTS "Update messages" ON messages;
DROP POLICY IF EXISTS "Delete messages" ON messages;

DROP POLICY IF EXISTS "Select bookings" ON bookings;
DROP POLICY IF EXISTS "Insert bookings" ON bookings;
DROP POLICY IF EXISTS "Update bookings" ON bookings;
DROP POLICY IF EXISTS "Delete bookings" ON bookings;

-- Recreate policies using get_current_tenant_id()
-- Agencies
CREATE POLICY "Select agencies" ON agencies FOR SELECT USING (id = get_current_tenant_id());
CREATE POLICY "Insert agencies" ON agencies FOR INSERT WITH CHECK (id = get_current_tenant_id());
CREATE POLICY "Update agencies" ON agencies FOR UPDATE USING (id = get_current_tenant_id()) WITH CHECK (id = get_current_tenant_id());
CREATE POLICY "Delete agencies" ON agencies FOR DELETE USING (id = get_current_tenant_id() AND is_superadmin());

-- Profiles
CREATE POLICY "Select profiles" ON profiles FOR SELECT USING (agency_id = get_current_tenant_id());
CREATE POLICY "Insert profiles" ON profiles FOR INSERT WITH CHECK (agency_id = get_current_tenant_id());
CREATE POLICY "Update profiles" ON profiles FOR UPDATE USING (agency_id = get_current_tenant_id()) WITH CHECK (agency_id = get_current_tenant_id());
CREATE POLICY "Delete profiles" ON profiles FOR DELETE USING (agency_id = get_current_tenant_id() AND is_superadmin());

-- Trips
CREATE POLICY "Select trips" ON trips FOR SELECT USING (agency_id = get_current_tenant_id());
CREATE POLICY "Insert trips" ON trips FOR INSERT WITH CHECK (agency_id = get_current_tenant_id());
CREATE POLICY "Update trips" ON trips FOR UPDATE USING (agency_id = get_current_tenant_id()) WITH CHECK (agency_id = get_current_tenant_id());
CREATE POLICY "Delete trips" ON trips FOR DELETE USING (agency_id = get_current_tenant_id() AND is_superadmin());

-- Conversations
CREATE POLICY "Select conversations" ON conversations FOR SELECT USING (agency_id = get_current_tenant_id());
CREATE POLICY "Insert conversations" ON conversations FOR INSERT WITH CHECK (agency_id = get_current_tenant_id());
CREATE POLICY "Update conversations" ON conversations FOR UPDATE USING (agency_id = get_current_tenant_id()) WITH CHECK (agency_id = get_current_tenant_id());
CREATE POLICY "Delete conversations" ON conversations FOR DELETE USING (agency_id = get_current_tenant_id() AND is_superadmin());

-- Messages
CREATE POLICY "Select messages" ON messages FOR SELECT USING (conversation_id IN (SELECT id FROM conversations WHERE agency_id = get_current_tenant_id()));
CREATE POLICY "Insert messages" ON messages FOR INSERT WITH CHECK (conversation_id IN (SELECT id FROM conversations WHERE agency_id = get_current_tenant_id()));
CREATE POLICY "Update messages" ON messages FOR UPDATE USING (conversation_id IN (SELECT id FROM conversations WHERE agency_id = get_current_tenant_id())) WITH CHECK (conversation_id IN (SELECT id FROM conversations WHERE agency_id = get_current_tenant_id()));
CREATE POLICY "Delete messages" ON messages FOR DELETE USING (conversation_id IN (SELECT id FROM conversations WHERE agency_id = get_current_tenant_id()) AND is_superadmin());

-- Bookings
CREATE POLICY "Select bookings" ON bookings FOR SELECT USING (agency_id = get_current_tenant_id());
CREATE POLICY "Insert bookings" ON bookings FOR INSERT WITH CHECK (agency_id = get_current_tenant_id());
CREATE POLICY "Update bookings" ON bookings FOR UPDATE USING (agency_id = get_current_tenant_id()) WITH CHECK (agency_id = get_current_tenant_id());
CREATE POLICY "Delete bookings" ON bookings FOR DELETE USING (agency_id = get_current_tenant_id() AND is_superadmin());
