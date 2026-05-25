-- ============================================================
-- Migration: Chatbot Conversation Messages Table
-- Purpose: Stores all conversations between Meta users and the AI chatbot
-- Run this in Supabase SQL Editor > New Query
-- ============================================================

-- 1. Create the conversation_messages table
CREATE TABLE IF NOT EXISTS public.conversation_messages (
  id             UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id      UUID          NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  sender_id      TEXT          NOT NULL,           -- Meta platform user ID or phone number
  platform       TEXT          NOT NULL,           -- 'whatsapp' | 'instagram' | 'facebook'
  role           TEXT          NOT NULL,           -- 'user' | 'assistant'
  content        TEXT          NOT NULL,
  message_type   TEXT          NOT NULL DEFAULT 'text', -- 'text' | 'voice' | 'image' | 'video' | 'document'
  media_url      TEXT,                             -- Optional: original media URL if applicable
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 2. Performance indexes
CREATE INDEX IF NOT EXISTS idx_conv_messages_sender
  ON public.conversation_messages(agency_id, sender_id);

CREATE INDEX IF NOT EXISTS idx_conv_messages_created
  ON public.conversation_messages(agency_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conv_messages_platform
  ON public.conversation_messages(agency_id, platform);

-- 3. Enable Row Level Security
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policy: superadmins can read their own agency messages
CREATE POLICY "Superadmins can read own agency messages"
  ON public.conversation_messages
  FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- 5. RLS Policy: service_role (n8n) can do everything
-- n8n uses the service_role key which bypasses RLS automatically.
-- No extra policy needed.

-- 6. Add n8n_meta_config to agencies.chatbot_config schema (informational comment only)
-- The chatbot_config JSONB column will now also store:
-- {
--   "meta_integration": {
--     "enabled": true,
--     "whatsapp_enabled": true,
--     "instagram_enabled": true,
--     "facebook_enabled": false,
--     "webhook_url": "https://your-n8n.com/webhook/meta-webhook",
--     "verify_token": "your-secret-token"
--   }
-- }
-- This is stored automatically when the dashboard saves chatbot settings.

-- 7. Add a view for dashboard conversation analytics
CREATE OR REPLACE VIEW public.conversation_analytics AS
SELECT
  agency_id,
  platform,
  DATE_TRUNC('day', created_at) AS day,
  COUNT(DISTINCT sender_id)     AS unique_users,
  COUNT(*)                      AS total_messages,
  COUNT(*) FILTER (WHERE role = 'user') AS user_messages,
  COUNT(*) FILTER (WHERE role = 'assistant') AS bot_messages
FROM public.conversation_messages
GROUP BY agency_id, platform, DATE_TRUNC('day', created_at)
ORDER BY day DESC;

-- Grant read on the view to authenticated users
GRANT SELECT ON public.conversation_analytics TO authenticated;

COMMENT ON TABLE public.conversation_messages IS 'Stores all AI chatbot conversations from Meta platforms (WhatsApp, Instagram, Facebook).';
COMMENT ON COLUMN public.conversation_messages.sender_id IS 'The Meta platform user identifier (phone number for WhatsApp, PSID for FB/IG).';
COMMENT ON COLUMN public.conversation_messages.platform IS 'Which Meta platform: whatsapp, instagram, or facebook.';
COMMENT ON COLUMN public.conversation_messages.role IS 'Message author: user (customer) or assistant (AI bot).';
