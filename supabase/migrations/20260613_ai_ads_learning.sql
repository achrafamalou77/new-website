CREATE TABLE IF NOT EXISTS public.ai_ad_profiles (
  agency_id UUID PRIMARY KEY REFERENCES public.agencies(id) ON DELETE CASCADE,
  brand_voice TEXT NOT NULL DEFAULT 'clear, trustworthy and locally relevant',
  preferred_languages JSONB NOT NULL DEFAULT '["fr","ar"]'::jsonb,
  required_phrases JSONB NOT NULL DEFAULT '[]'::jsonb,
  forbidden_phrases JSONB NOT NULL DEFAULT '[]'::jsonb,
  default_country TEXT NOT NULL DEFAULT 'DZ',
  generation_count INTEGER NOT NULL DEFAULT 0,
  feedback_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_ad_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.ai_ad_campaigns(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  feedback_type TEXT NOT NULL
    CHECK (feedback_type IN ('approved_edit', 'rating', 'performance')),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  notes TEXT,
  before_snapshot JSONB,
  after_snapshot JSONB,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_ad_feedback_agency_created
  ON public.ai_ad_feedback(agency_id, created_at DESC);

ALTER TABLE public.ai_ad_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_ad_feedback ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.ai_ad_profiles, public.ai_ad_feedback FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_ad_profiles, public.ai_ad_feedback TO authenticated;

CREATE POLICY ai_ad_profiles_agency ON public.ai_ad_profiles FOR ALL TO authenticated
  USING (agency_id = (SELECT agency_id FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'superadmin'))
  WITH CHECK (agency_id = (SELECT agency_id FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'superadmin'));

CREATE POLICY ai_ad_feedback_agency ON public.ai_ad_feedback FOR ALL TO authenticated
  USING (agency_id = (SELECT agency_id FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'superadmin'))
  WITH CHECK (agency_id = (SELECT agency_id FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'superadmin'));
