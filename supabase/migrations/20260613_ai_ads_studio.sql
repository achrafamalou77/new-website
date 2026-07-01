ALTER TABLE public.meta_integrations
  ADD COLUMN IF NOT EXISTS meta_user_access_token TEXT,
  ADD COLUMN IF NOT EXISTS meta_token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS meta_ad_accounts JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS selected_ad_account_id TEXT,
  ADD COLUMN IF NOT EXISTS meta_pixels JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS selected_pixel_id TEXT,
  ADD COLUMN IF NOT EXISTS ads_connected BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.ai_ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  business_type_slug TEXT NOT NULL
    CHECK (business_type_slug IN ('travel_agency', 'car_showroom', 'ecommerce')),
  name TEXT NOT NULL,
  objective TEXT NOT NULL
    CHECK (objective IN ('OUTCOME_TRAFFIC', 'OUTCOME_LEADS', 'OUTCOME_SALES', 'OUTCOME_ENGAGEMENT')),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'ready', 'publishing', 'paused', 'error', 'archived')),
  catalog_item_type TEXT,
  catalog_item_id UUID,
  catalog_item_title TEXT,
  strategy JSONB NOT NULL DEFAULT '{}'::jsonb,
  creative JSONB NOT NULL DEFAULT '{}'::jsonb,
  targeting JSONB NOT NULL DEFAULT '{}'::jsonb,
  budget JSONB NOT NULL DEFAULT '{}'::jsonb,
  destination_url TEXT,
  call_to_action TEXT NOT NULL DEFAULT 'LEARN_MORE',
  meta_campaign_id TEXT,
  meta_adset_id TEXT,
  meta_creative_id TEXT,
  meta_ad_id TEXT,
  meta_error TEXT,
  generated_by TEXT,
  approved_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_ad_campaigns_agency_created
  ON public.ai_ad_campaigns(agency_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_ad_campaigns_agency_status
  ON public.ai_ad_campaigns(agency_id, status);

CREATE OR REPLACE FUNCTION public.update_ai_ad_campaigns_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ai_ad_campaigns_updated_at ON public.ai_ad_campaigns;
CREATE TRIGGER ai_ad_campaigns_updated_at
  BEFORE UPDATE ON public.ai_ad_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_ai_ad_campaigns_updated_at();

ALTER TABLE public.ai_ad_campaigns ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.ai_ad_campaigns FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_ad_campaigns TO authenticated;

DROP POLICY IF EXISTS ai_ad_campaigns_select_agency ON public.ai_ad_campaigns;
CREATE POLICY ai_ad_campaigns_select_agency
  ON public.ai_ad_campaigns FOR SELECT TO authenticated
  USING (
    agency_id = (
      SELECT profiles.agency_id
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS ai_ad_campaigns_manage_superadmin ON public.ai_ad_campaigns;
CREATE POLICY ai_ad_campaigns_manage_superadmin
  ON public.ai_ad_campaigns FOR ALL TO authenticated
  USING (
    agency_id = (
      SELECT profiles.agency_id
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'superadmin'
    )
  )
  WITH CHECK (
    agency_id = (
      SELECT profiles.agency_id
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'superadmin'
    )
  );

COMMENT ON TABLE public.ai_ad_campaigns IS
  'Editable AI-generated Meta ad campaign drafts. Publishing always creates paused Meta objects.';
