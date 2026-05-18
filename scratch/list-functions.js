const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('Querying RPC list...');
  // Querypg_proc using standard select from pg_catalog if we have access via REST (usually pg_catalog is not exposed)
  // Let's see if we can read from public schema views or try standard function calls
  const { data, error } = await supabase.rpc('get_next_invoice_number', { p_agency_id: '902f4b1a-be6d-4c70-945f-20aa9ed059a8', p_issue_date: '2026-05-18' });
  console.log('Test RPC Invoice number result:', data, error);
}

run().catch(console.error);
