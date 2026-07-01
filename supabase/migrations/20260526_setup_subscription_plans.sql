-- 1. First, insert the Car Showroom plans into the plans table
INSERT INTO public.plans (id, name, price, description, features, max_trips, max_employees, ai_credits_monthly)
VALUES 
('car_free', 'Car Showroom Free Trial (7-Day)', 0, 'Core operations: Finance management, team directory, vehicle inventory, customs import tracker, and car rentals.', '{"finance": true, "team": true, "inventory": true, "import": true, "rental": true, "website": false, "chatbot": false, "leads_analysis": false}', 9999, 9999, 0),
('car_plus', 'Car Showroom Plus', 10000, 'All Free features + premium whitelabel website builder module.', '{"finance": true, "team": true, "inventory": true, "import": true, "rental": true, "website": true, "chatbot": false, "leads_analysis": false}', 9999, 9999, 0),
('car_pro', 'Car Showroom Pro', 23000, 'All Plus features + automated AI Chatbot receptionist.', '{"finance": true, "team": true, "inventory": true, "import": true, "rental": true, "website": true, "chatbot": true, "leads_analysis": false}', 9999, 9999, 2000),
('car_max', 'Car Showroom Max', 35000, 'Ultimate showroom platform: Pro plan + advanced leads board trend analytics.', '{"finance": true, "team": true, "inventory": true, "import": true, "rental": true, "website": true, "chatbot": true, "leads_analysis": true}', 9999, 9999, 10000)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  max_trips = EXCLUDED.max_trips,
  max_employees = EXCLUDED.max_employees,
  ai_credits_monthly = EXCLUDED.ai_credits_monthly;

-- 2. Insert the Travel Agency plans into the plans table
INSERT INTO public.plans (id, name, price, description, features, max_trips, max_employees, ai_credits_monthly)
VALUES 
('travel_free', 'Travel Agency Free', 0, 'Basic operations management: Team directory, basic ledger, and client profiles.', '{"team": true, "finance": true, "basic": true, "visa": false, "website": false, "chatbot": false, "leads_analysis": false}', 9999, 9999, 0),
('travel_plus', 'Travel Agency Plus', 7000, 'All Free features + international Visa services tracker & Whitelabel Website Builder.', '{"team": true, "finance": true, "basic": true, "visa": true, "website": true, "chatbot": false, "leads_analysis": false}', 9999, 9999, 0),
('travel_pro', 'Travel Agency Pro', 20000, 'All Plus features + AI Chatbot receptionist (credits for 300 msgs/day, 7k/mo).', '{"team": true, "finance": true, "basic": true, "visa": true, "website": true, "chatbot": true, "leads_analysis": false}', 9999, 9999, 7000),
('travel_max', 'Travel Agency Max', 32000, 'Ultimate travel SaaS: Pro plan + deep collaborative lead board & CRM metrics analysis.', '{"team": true, "finance": true, "basic": true, "visa": true, "website": true, "chatbot": true, "leads_analysis": true}', 9999, 9999, 15000)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  max_trips = EXCLUDED.max_trips,
  max_employees = EXCLUDED.max_employees,
  ai_credits_monthly = EXCLUDED.ai_credits_monthly;

-- 3. Update existing agencies to reference new plan IDs
UPDATE public.agencies 
SET plan = 'travel_free' 
WHERE business_type_slug = 'travel_agency' OR business_type_slug = 'travel' OR business_type_slug IS NULL;

UPDATE public.agencies 
SET plan = 'car_free' 
WHERE business_type_slug = 'car_showroom';

-- 4. Set default plan to travel_free for new agencies at database layer
ALTER TABLE public.agencies ALTER COLUMN plan SET DEFAULT 'travel_free';

-- 5. Delete obsolete mock plans
DELETE FROM public.plans WHERE id IN ('free', 'growth', 'pro');
