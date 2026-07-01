-- Platform owner approval gate for demo readiness.
-- New tenant workspaces are created as pending and must be activated by the
-- platform owner before dashboard/public portal access is allowed.

DO $$
DECLARE
  constraint_name text;
BEGIN
  FOR constraint_name IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.agencies'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.agencies DROP CONSTRAINT IF EXISTS %I', constraint_name);
  END LOOP;
END $$;

ALTER TABLE public.agencies
  ADD CONSTRAINT agencies_status_check
  CHECK (status IN ('pending', 'active', 'inactive', 'suspended'));

ALTER TABLE public.agencies
  ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approval_notes text,
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspended_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_agencies_status_created_at
  ON public.agencies(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agencies_approved_by
  ON public.agencies(approved_by);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agencies TO authenticated;
