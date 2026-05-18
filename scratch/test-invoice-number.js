const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('Testing get_next_invoice_number via RPC or database call...');
  
  // We can query using the Supabase .rpc() or calling a custom query helper
  const { data, error } = await supabase.rpc('get_next_invoice_number', {
    p_agency_id: '00000000-0000-0000-0000-000000000000',
    p_issue_date: '2026-05-18'
  });
  
  console.log('Invoice Number RPC Result:', { data, error });
}

run().catch(console.error);
