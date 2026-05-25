-- Migration 0019: Containers and Shipping Lines

-- Create the custom types if they do not exist
DO $$ BEGIN
    CREATE TYPE shipping_line_enum AS ENUM ('CMA CGM', 'Maersk', 'Evergreen', 'MSC', 'ONE', 'HMM', 'Other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE shipment_status_enum AS ENUM ('At Origin Port', 'On Vessel', 'Arrived Port of Algiers', 'In Customs', 'Dispatched', 'Delivered');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create the containers table
CREATE TABLE IF NOT EXISTS public.containers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
    container_number VARCHAR(100) UNIQUE NOT NULL,
    shipping_line shipping_line_enum NOT NULL DEFAULT 'MSC',
    status shipment_status_enum NOT NULL DEFAULT 'At Origin Port',
    vessel_name VARCHAR(255),
    voyage_number VARCHAR(100),
    departure_port VARCHAR(100) DEFAULT 'Marseille',
    arrival_port VARCHAR(100) DEFAULT 'Algiers',
    departure_date TIMESTAMP WITH TIME ZONE,
    estimated_arrival_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.containers ENABLE ROW LEVEL SECURITY;

-- Drop policies if exist and create new ones
DROP POLICY IF EXISTS "Allow select containers" ON public.containers;
CREATE POLICY "Allow select containers" ON public.containers
    FOR SELECT USING (agency_id = get_my_agency_id() OR is_platform_owner());

DROP POLICY IF EXISTS "Allow insert containers" ON public.containers;
CREATE POLICY "Allow insert containers" ON public.containers
    FOR INSERT WITH CHECK (agency_id = get_my_agency_id() OR is_platform_owner());

DROP POLICY IF EXISTS "Allow update containers" ON public.containers;
CREATE POLICY "Allow update containers" ON public.containers
    FOR UPDATE USING (agency_id = get_my_agency_id() OR is_platform_owner());

DROP POLICY IF EXISTS "Allow delete containers" ON public.containers;
CREATE POLICY "Allow delete containers" ON public.containers
    FOR DELETE USING (agency_id = get_my_agency_id() OR is_platform_owner());

-- Modify import_orders to include container_id reference
ALTER TABLE public.import_orders
ADD COLUMN IF NOT EXISTS container_id UUID REFERENCES public.containers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS tracking_status VARCHAR(100) DEFAULT 'At Origin Port';
