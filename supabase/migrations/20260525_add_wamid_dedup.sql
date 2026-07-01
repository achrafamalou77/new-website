-- ============================================================
-- Migration: Add wamid column for WhatsApp message deduplication
-- Purpose: Prevents n8n from processing duplicate webhooks from Meta
-- Run in: Supabase SQL Editor → New Query
-- ============================================================

-- 1. Add wamid column to conversation_messages table
ALTER TABLE public.conversation_messages
  ADD COLUMN IF NOT EXISTS wamid TEXT;

-- 2. Add partial unique index on wamid (ignores NULLs automatically in PostgreSQL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_conv_messages_wamid
  ON public.conversation_messages(wamid)
  WHERE wamid IS NOT NULL;

-- 3. Add index on created_at for fast dedup lookups
CREATE INDEX IF NOT EXISTS idx_conv_messages_created_at
  ON public.conversation_messages(created_at DESC);

COMMENT ON COLUMN public.conversation_messages.wamid IS 'WhatsApp message ID (wamid) from the Meta webhook payload. Used for deduplication.';
