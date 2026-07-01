-- Covers the optional client foreign key used by ecommerce order lookups.

CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_client
  ON public.ecommerce_orders(client_id)
  WHERE client_id IS NOT NULL;
