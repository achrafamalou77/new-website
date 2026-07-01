-- Migration: 20260526_add_website_settings_to_agencies.sql
-- Restore the missing website_settings JSONB column in the agencies table to support showroom basic information, contacts, and socials.

ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS website_settings JSONB DEFAULT '{}'::jsonb;
