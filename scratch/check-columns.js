const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('Fetching table metadata...');
  
  // Try querying pg_attribute or table information using RPC or running a simple select to see structure
  const { data: clients, error: errC } = await supabase.from('clients').select('*').limit(1);
  console.log('Clients columns:', clients ? Object.keys(clients[0] || {}) : 'Error or empty', errC);

  const { data: invoices, error: errI } = await supabase.from('invoices').select('*').limit(1);
  console.log('Invoices columns:', invoices ? Object.keys(invoices[0] || {}) : 'Error or empty', errI);

  const { data: payments, error: errP } = await supabase.from('invoice_payments').select('*').limit(1);
  console.log('Payments columns:', payments ? Object.keys(payments[0] || {}) : 'Error or empty', errP);
}

run().catch(console.error);
