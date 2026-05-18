const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('Connecting to Supabase...');
  const { data: clients, error: clientsError } = await supabase.from('clients').select('id').limit(1);
  console.log('Clients table search:', { clients, error: clientsError });

  const { data: invoices, error: invoicesError } = await supabase.from('invoices').select('id').limit(1);
  console.log('Invoices table search:', { invoices, error: invoicesError });
}

run().catch(console.error);
