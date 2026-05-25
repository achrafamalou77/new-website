-- Migration: 0020_customs_and_landed_cost.sql
-- Adds global shipping/fees to containers and per‑vehicle customs/fees.

-- 1. Extend containers with global expense columns
ALTER TABLE public.containers
  ADD COLUMN global_shipping_fee NUMERIC(15, 2) DEFAULT 0.00,
  ADD COLUMN global_transit_broker_fee NUMERIC(15, 2) DEFAULT 0.00,
  ADD COLUMN global_port_handling_fee NUMERIC(15, 2) DEFAULT 0.00;

-- 2. Extend import_orders with customs and allocated share columns
ALTER TABLE public.import_orders
  ADD COLUMN custom_duties_fee NUMERIC(15, 2) DEFAULT 0.00,
  ADD COLUMN transitaire_broker_fee NUMERIC(15, 2) DEFAULT 0.00,
  ADD COLUMN additional_logistics_fee NUMERIC(15, 2) DEFAULT 0.00,
  ADD COLUMN allocated_container_share NUMERIC(15, 2) DEFAULT 0.00;

-- Note: RLS policies already reference agency_id; new columns inherit same policies.
