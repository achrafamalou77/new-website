-- Migration: 0021_consignment_sales.sql
-- Modifies the car_sales_inventory table to support customer-owned vehicles (Consignment/Depot-Vente)

CREATE TYPE public.car_owner_type_enum AS ENUM ('agency', 'customer');

ALTER TABLE public.car_sales_inventory
  ADD COLUMN owner_type public.car_owner_type_enum NOT NULL DEFAULT 'agency',
  ADD COLUMN owner_client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  ADD COLUMN commission_percentage NUMERIC(5, 2) DEFAULT NULL,
  ADD COLUMN commission_flat_fee NUMERIC(15, 2) DEFAULT NULL,
  ADD COLUMN owner_target_payout NUMERIC(15, 2) DEFAULT 0.00,
  ADD COLUMN consignment_agreement_details JSONB;
