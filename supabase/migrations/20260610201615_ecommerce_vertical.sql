-- Adds first-class online store vertical: catalog, orders, shipping, promotions.

INSERT INTO public.business_types (
  slug,
  name,
  name_ar,
  name_fr,
  description,
  icon,
  color,
  features
)
VALUES (
  'ecommerce',
  'Online Store',
  'متجر إلكتروني',
  'Boutique en Ligne',
  'Online retail business manager with product catalog, COD orders, stock, delivery and promotions.',
  'ShoppingBag',
  '#8b5cf6',
  '["inbox", "leads", "clients", "products", "orders", "inventory", "shipping", "promotions", "team", "chatbot", "website", "settings"]'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  name_ar = EXCLUDED.name_ar,
  name_fr = EXCLUDED.name_fr,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  features = EXCLUDED.features;

CREATE TABLE IF NOT EXISTS public.ecommerce_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  brand TEXT,
  price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  compare_at_price NUMERIC(12,2) CHECK (compare_at_price IS NULL OR compare_at_price >= 0),
  cost_price NUMERIC(12,2) CHECK (cost_price IS NULL OR cost_price >= 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  low_stock_threshold INTEGER NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
  variants JSONB NOT NULL DEFAULT '[]'::jsonb,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  channels JSONB NOT NULL DEFAULT '["website"]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived')),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(agency_id, sku)
);

CREATE TABLE IF NOT EXISTS public.ecommerce_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_city TEXT,
  customer_address TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  shipping_fee NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  total NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  payment_method TEXT NOT NULL DEFAULT 'cod'
    CHECK (payment_method IN ('cod', 'card', 'bank_transfer', 'ccp', 'baridimob')),
  payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  fulfillment_status TEXT NOT NULL DEFAULT 'new'
    CHECK (fulfillment_status IN ('new', 'confirmed', 'packed', 'shipped', 'delivered', 'returned', 'cancelled')),
  source TEXT NOT NULL DEFAULT 'website',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(agency_id, order_number)
);

CREATE TABLE IF NOT EXISTS public.ecommerce_shipping_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  carrier TEXT NOT NULL,
  wilayas JSONB NOT NULL DEFAULT '[]'::jsonb,
  base_fee NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (base_fee >= 0),
  cod_enabled BOOLEAN NOT NULL DEFAULT true,
  estimated_days TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ecommerce_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'percentage'
    CHECK (discount_type IN ('percentage', 'fixed', 'free_shipping')),
  discount_value NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (discount_value >= 0),
  target JSONB NOT NULL DEFAULT '{}'::jsonb,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'live', 'expired', 'paused')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(agency_id, code)
);

CREATE INDEX IF NOT EXISTS idx_ecommerce_products_agency
  ON public.ecommerce_products(agency_id);
CREATE INDEX IF NOT EXISTS idx_ecommerce_products_public_catalog
  ON public.ecommerce_products(agency_id, status, is_featured);
CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_agency
  ON public.ecommerce_orders(agency_id);
CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_status
  ON public.ecommerce_orders(agency_id, fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_ecommerce_shipping_agency
  ON public.ecommerce_shipping_zones(agency_id);
CREATE INDEX IF NOT EXISTS idx_ecommerce_promotions_agency
  ON public.ecommerce_promotions(agency_id);

CREATE OR REPLACE FUNCTION public.set_ecommerce_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_ecommerce_products_updated_at ON public.ecommerce_products;
CREATE TRIGGER set_ecommerce_products_updated_at
  BEFORE UPDATE ON public.ecommerce_products
  FOR EACH ROW EXECUTE FUNCTION public.set_ecommerce_updated_at();

DROP TRIGGER IF EXISTS set_ecommerce_orders_updated_at ON public.ecommerce_orders;
CREATE TRIGGER set_ecommerce_orders_updated_at
  BEFORE UPDATE ON public.ecommerce_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_ecommerce_updated_at();

ALTER TABLE public.ecommerce_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecommerce_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecommerce_shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecommerce_promotions ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.ecommerce_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ecommerce_products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ecommerce_orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ecommerce_shipping_zones TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ecommerce_promotions TO authenticated;

DROP POLICY IF EXISTS ecommerce_products_public_read ON public.ecommerce_products;
CREATE POLICY ecommerce_products_public_read
  ON public.ecommerce_products
  FOR SELECT
  TO anon
  USING (status = 'active');

DROP POLICY IF EXISTS ecommerce_products_tenant ON public.ecommerce_products;
CREATE POLICY ecommerce_products_tenant
  ON public.ecommerce_products
  FOR ALL
  TO authenticated
  USING (agency_id = public.get_current_tenant_id())
  WITH CHECK (agency_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS ecommerce_orders_tenant ON public.ecommerce_orders;
CREATE POLICY ecommerce_orders_tenant
  ON public.ecommerce_orders
  FOR ALL
  TO authenticated
  USING (agency_id = public.get_current_tenant_id())
  WITH CHECK (agency_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS ecommerce_shipping_tenant ON public.ecommerce_shipping_zones;
CREATE POLICY ecommerce_shipping_tenant
  ON public.ecommerce_shipping_zones
  FOR ALL
  TO authenticated
  USING (agency_id = public.get_current_tenant_id())
  WITH CHECK (agency_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS ecommerce_promotions_tenant ON public.ecommerce_promotions;
CREATE POLICY ecommerce_promotions_tenant
  ON public.ecommerce_promotions
  FOR ALL
  TO authenticated
  USING (agency_id = public.get_current_tenant_id())
  WITH CHECK (agency_id = public.get_current_tenant_id());
