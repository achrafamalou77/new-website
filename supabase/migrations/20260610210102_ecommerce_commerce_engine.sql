-- Production ecommerce engine: product landing pages, campaign attribution,
-- media storage, and atomic stock-safe checkout.

CREATE TABLE IF NOT EXISTS public.ecommerce_product_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.ecommerce_products(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  headline TEXT NOT NULL,
  subheadline TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
  faq JSONB NOT NULL DEFAULT '[]'::jsonb,
  social_proof JSONB NOT NULL DEFAULT '[]'::jsonb,
  urgency_text TEXT,
  cta_text TEXT NOT NULL DEFAULT 'Commander maintenant',
  theme JSONB NOT NULL DEFAULT '{"primary":"#7c3aed","accent":"#111827","style":"modern"}'::jsonb,
  seo JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_by_ai BOOLEAN NOT NULL DEFAULT false,
  views INTEGER NOT NULL DEFAULT 0 CHECK (views >= 0),
  conversions INTEGER NOT NULL DEFAULT 0 CHECK (conversions >= 0),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(agency_id, slug),
  UNIQUE(product_id)
);

ALTER TABLE public.ecommerce_orders
  ADD COLUMN IF NOT EXISTS landing_page_id UUID
    REFERENCES public.ecommerce_product_pages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS promotion_id UUID
    REFERENCES public.ecommerce_promotions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS shipping_zone_id UUID
    REFERENCES public.ecommerce_shipping_zones(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS promotion_code TEXT,
  ADD COLUMN IF NOT EXISTS public_token UUID NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS campaign JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS ecommerce_orders_public_token_key
  ON public.ecommerce_orders(public_token);
CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_landing_page
  ON public.ecommerce_orders(landing_page_id)
  WHERE landing_page_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_promotion
  ON public.ecommerce_orders(promotion_id)
  WHERE promotion_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_shipping_zone
  ON public.ecommerce_orders(shipping_zone_id)
  WHERE shipping_zone_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ecommerce_product_pages_agency_status
  ON public.ecommerce_product_pages(agency_id, status);

DROP TRIGGER IF EXISTS set_ecommerce_product_pages_updated_at
  ON public.ecommerce_product_pages;
CREATE TRIGGER set_ecommerce_product_pages_updated_at
  BEFORE UPDATE ON public.ecommerce_product_pages
  FOR EACH ROW EXECUTE FUNCTION public.set_ecommerce_updated_at();

ALTER TABLE public.ecommerce_product_pages ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.ecommerce_product_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.ecommerce_product_pages TO authenticated;

DROP POLICY IF EXISTS ecommerce_product_pages_public_read
  ON public.ecommerce_product_pages;
CREATE POLICY ecommerce_product_pages_public_read
  ON public.ecommerce_product_pages
  FOR SELECT
  TO anon
  USING (status = 'published');

DROP POLICY IF EXISTS ecommerce_product_pages_tenant
  ON public.ecommerce_product_pages;
CREATE POLICY ecommerce_product_pages_tenant
  ON public.ecommerce_product_pages
  FOR ALL
  TO authenticated
  USING (agency_id = public.get_current_tenant_id())
  WITH CHECK (agency_id = public.get_current_tenant_id());

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ecommerce-assets',
  'ecommerce-assets',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE OR REPLACE FUNCTION public.place_ecommerce_order(
  p_agency_id UUID,
  p_product_id UUID,
  p_landing_page_id UUID,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_customer_city TEXT,
  p_customer_address TEXT,
  p_quantity INTEGER,
  p_variant JSONB DEFAULT '{}'::jsonb,
  p_shipping_zone_id UUID DEFAULT NULL,
  p_promotion_code TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_campaign JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product public.ecommerce_products%ROWTYPE;
  v_shipping public.ecommerce_shipping_zones%ROWTYPE;
  v_promotion public.ecommerce_promotions%ROWTYPE;
  v_landing public.ecommerce_product_pages%ROWTYPE;
  v_subtotal NUMERIC(12,2);
  v_shipping_fee NUMERIC(12,2) := 0;
  v_discount NUMERIC(12,2) := 0;
  v_total NUMERIC(12,2);
  v_order_id UUID;
  v_public_token UUID;
  v_order_number TEXT;
  v_target_product_ids JSONB;
BEGIN
  IF p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 20 THEN
    RAISE EXCEPTION 'Quantity must be between 1 and 20';
  END IF;

  IF length(trim(COALESCE(p_customer_name, ''))) < 2
     OR length(trim(COALESCE(p_customer_phone, ''))) < 8
     OR length(trim(COALESCE(p_customer_address, ''))) < 5 THEN
    RAISE EXCEPTION 'Customer name, phone and address are required';
  END IF;

  SELECT *
  INTO v_product
  FROM public.ecommerce_products
  WHERE id = p_product_id
    AND agency_id = p_agency_id
    AND status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product is unavailable';
  END IF;

  IF v_product.stock_quantity < p_quantity THEN
    RAISE EXCEPTION 'Only % item(s) remain in stock', v_product.stock_quantity;
  END IF;

  IF p_landing_page_id IS NOT NULL THEN
    SELECT *
    INTO v_landing
    FROM public.ecommerce_product_pages
    WHERE id = p_landing_page_id
      AND agency_id = p_agency_id
      AND product_id = p_product_id
      AND status = 'published';

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Landing page is unavailable';
    END IF;
  END IF;

  IF p_shipping_zone_id IS NOT NULL THEN
    SELECT *
    INTO v_shipping
    FROM public.ecommerce_shipping_zones
    WHERE id = p_shipping_zone_id
      AND agency_id = p_agency_id
      AND is_active = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Shipping option is unavailable';
    END IF;

    v_shipping_fee := v_shipping.base_fee;
  END IF;

  v_subtotal := ROUND(v_product.price * p_quantity, 2);

  IF p_promotion_code IS NOT NULL AND trim(p_promotion_code) <> '' THEN
    SELECT *
    INTO v_promotion
    FROM public.ecommerce_promotions
    WHERE agency_id = p_agency_id
      AND upper(code) = upper(trim(p_promotion_code))
      AND status = 'live'
      AND (starts_at IS NULL OR starts_at <= NOW())
      AND (ends_at IS NULL OR ends_at >= NOW());

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Promotion code is invalid or expired';
    END IF;

    v_target_product_ids := v_promotion.target -> 'product_ids';
    IF jsonb_typeof(v_target_product_ids) = 'array'
       AND jsonb_array_length(v_target_product_ids) > 0
       AND NOT (v_target_product_ids ? p_product_id::text) THEN
      RAISE EXCEPTION 'Promotion does not apply to this product';
    END IF;

    IF v_promotion.discount_type = 'percentage' THEN
      v_discount := ROUND(
        v_subtotal * LEAST(v_promotion.discount_value, 100) / 100,
        2
      );
    ELSIF v_promotion.discount_type = 'fixed' THEN
      v_discount := LEAST(v_promotion.discount_value, v_subtotal);
    ELSIF v_promotion.discount_type = 'free_shipping' THEN
      v_shipping_fee := 0;
    END IF;
  END IF;

  v_total := GREATEST(v_subtotal + v_shipping_fee - v_discount, 0);
  v_order_number :=
    'EC-' || to_char(NOW(), 'YYYYMMDD') || '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  INSERT INTO public.ecommerce_orders (
    agency_id,
    order_number,
    customer_name,
    customer_phone,
    customer_city,
    customer_address,
    items,
    subtotal,
    shipping_fee,
    discount_amount,
    total,
    payment_method,
    payment_status,
    fulfillment_status,
    source,
    notes,
    landing_page_id,
    promotion_id,
    shipping_zone_id,
    promotion_code,
    campaign
  )
  VALUES (
    p_agency_id,
    v_order_number,
    trim(p_customer_name),
    trim(p_customer_phone),
    NULLIF(trim(COALESCE(p_customer_city, '')), ''),
    trim(p_customer_address),
    jsonb_build_array(jsonb_build_object(
      'product_id', v_product.id,
      'sku', v_product.sku,
      'name', v_product.name,
      'quantity', p_quantity,
      'unit_price', v_product.price,
      'variant', COALESCE(p_variant, '{}'::jsonb),
      'image', COALESCE(v_product.images ->> 0, '')
    )),
    v_subtotal,
    v_shipping_fee,
    v_discount,
    v_total,
    'cod',
    'pending',
    'new',
    CASE WHEN p_landing_page_id IS NULL THEN 'storefront' ELSE 'landing_page' END,
    NULLIF(trim(COALESCE(p_notes, '')), ''),
    p_landing_page_id,
    CASE WHEN v_promotion.id IS NULL THEN NULL ELSE v_promotion.id END,
    p_shipping_zone_id,
    CASE WHEN v_promotion.id IS NULL THEN NULL ELSE v_promotion.code END,
    COALESCE(p_campaign, '{}'::jsonb)
  )
  RETURNING id, public_token INTO v_order_id, v_public_token;

  UPDATE public.ecommerce_products
  SET stock_quantity = stock_quantity - p_quantity
  WHERE id = v_product.id;

  IF p_landing_page_id IS NOT NULL THEN
    UPDATE public.ecommerce_product_pages
    SET conversions = conversions + 1
    WHERE id = p_landing_page_id;
  END IF;

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'public_token', v_public_token,
    'subtotal', v_subtotal,
    'shipping_fee', v_shipping_fee,
    'discount', v_discount,
    'total', v_total
  );
END;
$$;

REVOKE ALL ON FUNCTION public.place_ecommerce_order(
  UUID, UUID, UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, JSONB, UUID, TEXT, TEXT, JSONB
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.place_ecommerce_order(
  UUID, UUID, UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, JSONB, UUID, TEXT, TEXT, JSONB
) TO service_role;
