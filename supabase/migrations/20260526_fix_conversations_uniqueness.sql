-- Fix duplicate conversations: add unique constraint
-- This allows n8n to properly upsert (merge) on conflict

ALTER TABLE public.conversations
  ADD CONSTRAINT IF NOT EXISTS conversations_agency_phone_platform_unique
  UNIQUE (agency_id, customer_phone, platform);

-- Enable Realtime on conversation_messages (conversations already added)
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_messages;
