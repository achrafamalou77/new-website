INSERT INTO public.plans (
  id,
  name,
  price,
  description,
  features,
  max_trips,
  max_employees,
  ai_credits_monthly
)
VALUES
  (
    'ecommerce_free',
    'Online Store Free',
    0,
    'Products, inventory, orders, shipping, promotions, and a public storefront.',
    '{"finance":true,"team":true,"products":true,"orders":true,"inventory":true,"shipping":true,"promotions":true,"website":true,"ai_landing_pages":false,"chatbot":false}',
    100,
    2,
    0
  ),
  (
    'ecommerce_plus',
    'Online Store Plus',
    9000,
    'Store operations with AI product landing pages and campaign attribution.',
    '{"finance":true,"team":true,"products":true,"orders":true,"inventory":true,"shipping":true,"promotions":true,"website":true,"ai_landing_pages":true,"chatbot":false}',
    1000,
    5,
    1500
  ),
  (
    'ecommerce_pro',
    'Online Store Pro',
    21000,
    'AI landing pages, storefront automation, and AI customer assistance.',
    '{"finance":true,"team":true,"products":true,"orders":true,"inventory":true,"shipping":true,"promotions":true,"website":true,"ai_landing_pages":true,"chatbot":true,"leads_analysis":true}',
    10000,
    15,
    7000
  ),
  (
    'ecommerce_max',
    'Online Store Max',
    34000,
    'High-volume ecommerce operations with the full AI and analytics suite.',
    '{"finance":true,"team":true,"products":true,"orders":true,"inventory":true,"shipping":true,"promotions":true,"website":true,"ai_landing_pages":true,"chatbot":true,"leads_analysis":true}',
    999999,
    9999,
    15000
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  max_trips = EXCLUDED.max_trips,
  max_employees = EXCLUDED.max_employees,
  ai_credits_monthly = EXCLUDED.ai_credits_monthly;

UPDATE public.agencies
SET plan = 'ecommerce_free'
WHERE business_type_slug = 'ecommerce'
  AND plan NOT LIKE 'ecommerce_%';
