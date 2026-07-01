-- Allow new accounts to be created with the ecommerce business type.

ALTER TABLE public.agencies
  DROP CONSTRAINT IF EXISTS agencies_business_type_slug_check;

ALTER TABLE public.agencies
  ADD CONSTRAINT agencies_business_type_slug_check
  CHECK (business_type_slug IN ('travel_agency', 'travel', 'car_showroom', 'ecommerce'));
