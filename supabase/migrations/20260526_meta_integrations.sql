-- ============================================================
-- Migration: Meta Integrations Table
-- Stores OAuth tokens and connection status for Meta platforms
-- per agency (Facebook Page, Instagram Business, WhatsApp WABA)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.meta_integrations (
  id                              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id                       UUID        NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE UNIQUE,

  -- Facebook Page / Messenger
  facebook_connected              BOOLEAN     NOT NULL DEFAULT false,
  facebook_page_id                TEXT,
  facebook_page_name              TEXT,
  facebook_page_access_token      TEXT,       -- long-lived page token (60 days)
  facebook_enabled                BOOLEAN     NOT NULL DEFAULT true,

  -- Instagram Business (linked to FB page)
  instagram_connected             BOOLEAN     NOT NULL DEFAULT false,
  instagram_business_account_id  TEXT,
  instagram_username              TEXT,
  instagram_enabled               BOOLEAN     NOT NULL DEFAULT true,

  -- WhatsApp Business API (WABA)
  whatsapp_connected              BOOLEAN     NOT NULL DEFAULT false,
  whatsapp_phone_number_id        TEXT,       -- used to send messages via Graph API
  whatsapp_waba_id                TEXT,
  whatsapp_business_name          TEXT,
  whatsapp_phone_display          TEXT,       -- e.g. "+213 550 123 456"
  whatsapp_access_token           TEXT,       -- system user token
  whatsapp_enabled                BOOLEAN     NOT NULL DEFAULT true,

  -- Webhook configuration
  webhook_verify_token            TEXT,       -- unique per agency, used to verify Meta webhooks
  n8n_webhook_url                 TEXT,       -- optional: forward messages to n8n for AI processing

  created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_meta_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER meta_integrations_updated_at
  BEFORE UPDATE ON public.meta_integrations
  FOR EACH ROW EXECUTE FUNCTION update_meta_integrations_updated_at();

-- Performance index
CREATE INDEX IF NOT EXISTS idx_meta_integrations_agency
  ON public.meta_integrations(agency_id);

-- Index for webhook routing (lookup by FB page ID)
CREATE INDEX IF NOT EXISTS idx_meta_integrations_fb_page
  ON public.meta_integrations(facebook_page_id)
  WHERE facebook_page_id IS NOT NULL;

-- Index for webhook routing (lookup by WA phone number ID)
CREATE INDEX IF NOT EXISTS idx_meta_integrations_wa_phone
  ON public.meta_integrations(whatsapp_phone_number_id)
  WHERE whatsapp_phone_number_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.meta_integrations ENABLE ROW LEVEL SECURITY;

-- Only superadmins can read/update their own agency row
CREATE POLICY "Superadmins can manage own meta_integrations"
  ON public.meta_integrations
  FOR ALL
  USING (
    agency_id IN (
      SELECT agency_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- Service role bypasses RLS (used by Next.js API routes and n8n)

COMMENT ON TABLE public.meta_integrations IS
  'Stores per-agency Meta platform OAuth tokens and connection status for WhatsApp, Instagram, and Facebook Messenger.';
