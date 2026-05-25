-- Migration: 0023_vehicle_history_and_storage.sql
-- Vehicle History Log + Car Images Storage Support

-- 1. Create vehicle_history table
CREATE TABLE IF NOT EXISTS public.vehicle_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID REFERENCES public.car_sales_inventory(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL DEFAULT 'note',
  -- event_type: status_change | price_change | sold | rented | serviced | note | imported | document_added
  title VARCHAR(255) NOT NULL,
  description TEXT,
  old_value TEXT,
  new_value TEXT,
  performed_by UUID REFERENCES public.profiles(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS
ALTER TABLE public.vehicle_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vehicle_history_select" ON public.vehicle_history;
CREATE POLICY "vehicle_history_select" ON public.vehicle_history
  FOR SELECT USING (agency_id = get_my_agency_id() OR is_platform_owner());

DROP POLICY IF EXISTS "vehicle_history_insert" ON public.vehicle_history;
CREATE POLICY "vehicle_history_insert" ON public.vehicle_history
  FOR INSERT WITH CHECK (agency_id = get_my_agency_id() OR is_platform_owner());

DROP POLICY IF EXISTS "vehicle_history_update" ON public.vehicle_history;
CREATE POLICY "vehicle_history_update" ON public.vehicle_history
  FOR UPDATE USING (agency_id = get_my_agency_id() OR is_platform_owner());

DROP POLICY IF EXISTS "vehicle_history_delete" ON public.vehicle_history;
CREATE POLICY "vehicle_history_delete" ON public.vehicle_history
  FOR DELETE USING (agency_id = get_my_agency_id() OR is_platform_owner());

-- 3. Add rental bookings table for availability calendar
CREATE TABLE IF NOT EXISTS public.rental_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID REFERENCES public.car_sales_inventory(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  client_name VARCHAR(255),
  client_phone VARCHAR(50),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  daily_rate NUMERIC(15, 2) DEFAULT 0,
  total_amount NUMERIC(15, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'confirmed',
  -- status: confirmed | active | completed | cancelled
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable RLS on rental_bookings
ALTER TABLE public.rental_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rental_bookings_select" ON public.rental_bookings;
CREATE POLICY "rental_bookings_select" ON public.rental_bookings
  FOR SELECT USING (agency_id = get_my_agency_id() OR is_platform_owner());

DROP POLICY IF EXISTS "rental_bookings_insert" ON public.rental_bookings;
CREATE POLICY "rental_bookings_insert" ON public.rental_bookings
  FOR INSERT WITH CHECK (agency_id = get_my_agency_id() OR is_platform_owner());

DROP POLICY IF EXISTS "rental_bookings_update" ON public.rental_bookings;
CREATE POLICY "rental_bookings_update" ON public.rental_bookings
  FOR UPDATE USING (agency_id = get_my_agency_id() OR is_platform_owner());

DROP POLICY IF EXISTS "rental_bookings_delete" ON public.rental_bookings;
CREATE POLICY "rental_bookings_delete" ON public.rental_bookings
  FOR DELETE USING (agency_id = get_my_agency_id() OR is_platform_owner());

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS vehicle_history_car_id_idx ON public.vehicle_history(car_id);
CREATE INDEX IF NOT EXISTS vehicle_history_agency_id_idx ON public.vehicle_history(agency_id);
CREATE INDEX IF NOT EXISTS rental_bookings_car_id_idx ON public.rental_bookings(car_id);
CREATE INDEX IF NOT EXISTS rental_bookings_dates_idx ON public.rental_bookings(start_date, end_date);
