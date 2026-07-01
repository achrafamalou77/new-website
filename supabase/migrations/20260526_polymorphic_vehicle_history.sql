-- Migration: 20260526_polymorphic_vehicle_history.sql
-- Decouple vehicle_history, rental_bookings, car_sales_orders, and car_rental_bookings from specific vehicle tables
-- This allows cars to transition between car_sales_inventory and car_rental_fleet seamlessly without breaking constraints or losing history.

ALTER TABLE public.vehicle_history DROP CONSTRAINT IF EXISTS vehicle_history_car_id_fkey;
ALTER TABLE public.rental_bookings DROP CONSTRAINT IF EXISTS rental_bookings_car_id_fkey;
ALTER TABLE public.car_sales_orders DROP CONSTRAINT IF EXISTS car_sales_orders_car_id_fkey;
ALTER TABLE public.car_rental_bookings DROP CONSTRAINT IF EXISTS car_rental_bookings_car_id_fkey;
