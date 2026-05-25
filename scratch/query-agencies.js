const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ipmzemhteoigoenkmsfl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwbXplbWh0ZW9pZ29lbmttc2ZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODkzODE0NSwiZXhwIjoyMDk0NTE0MTQ1fQ.ws6wew8g2_8kD0VYPqHAzp4G3wNjbVct-pSOYirJf0I'
);

async function run() {
  const { data, error } = await supabase
    .from('car_sales_inventory')
    .select('id, brand, model, status, final_price, agency_id');
    
  if (error) {
    console.error(error);
    return;
  }
  
  console.log('--- Car Sales Inventory Seeded Data ---');
  console.log(JSON.stringify(data, null, 2));
}

run();
