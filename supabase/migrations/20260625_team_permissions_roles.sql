DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.profiles'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%role%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('superadmin', 'manager', 'sales', 'support', 'employee'));

