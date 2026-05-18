const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('Querying schema from catalog...');
  
  // Select from a view or run a raw query using RPC if available, or fetch system views
  // Note: Since Supabase REST API exposes public schema views, let's see if we can read information_schema
  const { data: clientsCols, error: errC } = await supabase
    .from('clients')
    .insert([{ full_name: 'Test Validation' }])
    .select();
    
  console.log('Insert test clients:', { clientsCols, error: errC });
}

run().catch(console.error);
